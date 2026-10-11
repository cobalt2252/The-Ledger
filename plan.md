# The Ledger — working plan

This is for whoever changes the game next. The README is for players; this
file holds the decisions behind the numbers, the rules every change has to
keep, how to work on the code safely, and what is still open.

Keep it short and current. When a change moves one of the targets below,
update the figure here in the same commit, with the reason.

---

## 1. Tuning targets

Each system was tuned to an outcome, then measured over hundreds of
simulated lives. These are the figures as last measured, and the script
that measures each one (in `tests/`). If a change moves a figure outside its
range, either the change is wrong or this file needs updating with the
reason.

Simulated players answer every decision at random and never take holidays
or therapy, so survival and wellbeing in these runs are worse than a real
player's. Compare runs with each other, not with real life.

| System | Target | Last measured | Script |
|---|---|---|---|
| Burnout, ordinary jobs | rare, a few % of working lives | 2% of lives have one | `burnout_econ.js 300 ordinary` |
| Burnout, front-line jobs | common but not certain | 46% of lives | `burnout_econ.js 300 frontline` |
| Leaving home | about half of early-20s at home; nobody past 30 | 63% at 22, 51% at 25, 0% at 30 | `home_econ.js 150` |
| Young-adult debt | a minority, small overdrafts | 10% in debt at 22 | `rent_econ.js 250` |
| Era balance, owners | real savings within 1.6× across decades | 1.40× | `era_econ.js` |
| Era balance, renters | renting costs more later (deliberate) | keep 51% of an owner's savings in the 1940s, 18% in the 2010s | `era_econ.js` |
| House price ÷ wage | about 3.5× in the 1970s, about 9× now | 3.5× → 9.3× | `era_econ.js` |
| Investments, 30 years | cash < bonds < property < stocks < crypto | −0.7%, 2.6%, 4.0%, 8.9%, 12.1% a year | `econ.js` |
| Casino | the house always wins at any stake | slots 89%, blackjack 94.5% returned | `casino_econ.js` |
| Crime family | most are caught; few reach the top | 59% jailed, 9% killed, 6% reach Boss | `crime_econ.js` |
| Cartel | harsher than the crime family | 58% jailed, 14% killed, 2% reach the top | `crime_econ.js` |
| Politics | the top is rare even when played well | PM 13% (democracy), 10% (one-party), 6% royal / 0% commoner (monarchy) | `politics_econ.js` |
| Prison | behaving gets you out sooner | 10-year sentence: behave 2.6y, deal 25y | `prison_econ.js` |
| Social media | most creators earn little | YouTube median £2k/yr after 20 years, p99 £31k | `social_econ.js` |
| Dodgy Dave's car lot | a gamble, slightly worse than honest | 97p of value per £1 (honest dealer 98p), half worse than described | `shop_econ.js` |
| Renovation | usually pays, not always | £1.18 per £1 spent; loses money 27% of the time | `shop_econ.js` |
| Antiques bought from a dealer | the dealer's markup rarely comes back | 82p real per £1 after 20 years | `shop_econ.js` |
| Heirloom valuations | an occasional find, an occasional fake | 5% worth 4×+, 8% a later copy | `shop_econ.js` |
| Heirlooms per life | about half of lives receive one | 0.69 each; 51% none | `heir_econ.js 200` |
| Protected one-night stand | a real but small risk | 2.7% modelled, 3.0% observed | `prot.js` |
| Longevity | good health makes 75+ likely, 100 possible | health ≥75: 73% reach 75, 2% reach 100 | `longevity.js` |

## 2. Design rules

These are decisions, not accidents. Don't undo one without deciding to.

**Money**
- Every amount is written in 2020 money and scaled to the year being lived
  through with `eraMoney()` / `priceLevel()`. A fixed figure that skips this
  is a bug (the old shop prices and state pension both were).
- House prices follow their own index, which outran wages. That's the
  housing squeeze, and it's meant to bite.
- Rent follows the middle of house prices and wages (`rentIndex()`), the same
  as house prices in 2020. Renters pay about a third of income, between a
  shared room (40% of a full rent) and a whole place (4.5% of a standard
  home's 2020 price).
- Tax is assessed on the year as a whole. Every payment goes through
  `payIncome`, taxed at the marginal rate on the year so far; one personal
  allowance a year, whatever order the money arrives in.
- Unemployment support includes help with rent at the shared-room rate.

**Life**
- Nobody is forced out at 18. Adult children stay home paying board (the
  lower of £2,500 and 15% of income) until they can afford to leave, marry,
  go to university, reach 30, or lose their parents' home.
- Full-time students' rent goes on the student loan.
- Stress drifts back towards a resting level of 30 each year, faster with
  health, happiness, closeness and time off. Burnout is three straight years
  above 80.
- Every stage of education ends with a notification and a "what next"
  choice. A rejection still counts the stage you finished.
- Parents separate at about 1.2% a year while together. A separated parent
  remarries at 7% a year, a widowed one at 4% (halved over 55, never from 72).
- A surviving spouse inherits before the children. Step-relatives take no
  share of your parents' estate.

**Place**
- Everyone has a country. Unset means "where you are". Emigrating marks
  everyone and everything left behind (family, friends, exes, rivals,
  houses, graves) with the old country.
- Across a border: no living together, no time in person, no gifts, no grave
  visits. Only a call (letter, phone or video by era) and an invitation to
  move. **No in-person visits.** This was asked for explicitly; a paid trip
  back would be a new decision.
- A job or political office ends on emigrating; a business carries on.
- The next generation starts where the heir lives.

**Things**
- Condition (0–100) drives value: `condFactor()` for objects,
  `propCondFactor()` for houses (even a wreck is worth the plot).
- Shops restock on every visit (asked for, and accepted that a player can
  walk in and out to reroll). Items only appear once they existed.
- Fine things keep pace with inflation plus a small real return; ordinary
  instruments lose value until they're vintage.
- Unvalued heirlooms are counted at the family's belief until valued.
- What you own at death passes to the heir as heirlooms, taken out of the
  money pot first so nothing is counted twice.

**Screens**
- Every row, choice, button and notification carries an emoji
  (`iconOrDefault()`: specific match, then the kind of answer, then 👉).
- Only emoji from Unicode 12 or earlier, and text-default emoji always get
  U+FE0F. `verify_k.js` enforces both.
- One decision sheet on screen at a time (`clearDecisionSheets()`); answering
  a stale copy would run the decision twice.
- Decisions queue (`queueChoice`) and never overwrite each other. Life-stage
  events run even when another decision is waiting.

## 3. Working on the code

- **One file.** The game is `index.html`: markup, styles and one script.
  Nothing is built.
- **Patch, don't hand-edit.** Every change was made by a small Python script
  that replaces exact text and asserts how many times it matched (normally
  once), so nothing changes silently if the code has moved. Afterwards,
  extract the last `<script>` block and run `node --check` on it.
- **`clamp(value, max, min)`.** Max comes before min. Most slips here are
  silent.
- **Stats gain at most 12 a year** (`STAT_YEAR_CAP`). Tests that call a
  yearly function repeatedly must reset `state.yearlyStatGain`.
- **Anything about a person or a place goes through `isHere()` /
  `isAbroad()`.**
- **Measure, don't trust.** For anything with odds or money, write or rerun
  a measurement script over hundreds of lives before and after.
- **Test thresholds need headroom.** Size a statistical check so a correct
  build fails less than about 1 run in 200 (aim for three standard errors).
  Most of the flaky tests so far were thresholds set too close.
- **Run before shipping:**
  - `sh tests/run_all.sh` (about 1,900 checks and both fuzzers)
  - `node tests/verify_ui_browser.js` (needs Playwright)
  - `node tests/crawl_icons.js` (any blank rows) and `node tests/icon_scan.js`
    (every label through the icon picker)
- **Look at it.** Take screenshots of any screen you changed; several bugs
  were only visible that way.

## 4. Backlog

| Item | Why | Notes |
|---|---|---|
| Students' living costs on the maintenance loan | University students still pay £11k a year of living costs from cash, the main source of debt at 22 | Rent already goes on the loan |
| Optional paid trip back to see family abroad | A natural follow-up to emigration | Contradicts the current "no in-person visits" rule, so it's a decision first |
| Repairs for vehicles | Vehicle condition is shown and wears, but nothing improves it | Restoration exists for belongings and houses |
| Forces after emigrating | The birth nation's forces can still be joined from abroad, but a forces career ends when you emigrate | Choose one rule |
| A monarch who emigrates | Inheriting or holding a throne while abroad isn't handled | Rare |
| Heir's birthplace | The heir inherits the parent's birthplace, which also sets pay and prices | Could be the country they grew up in |
| Remove the dead Activities "assets" panel | Unreachable code, still in the file | Its broken buttons are already gone |

## 5. Known quirks

- `verify_v.js` runs a slightly different number of checks each time (some
  are conditional). The total varies; failures are what matter.
- Belongings bought before conditions existed show without one, and don't
  wear.
- In the random-choice simulations few lives reach old age, because the
  simulated player takes every risk. Compare runs with each other.
