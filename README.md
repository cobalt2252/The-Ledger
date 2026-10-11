# The Ledger

A text-based life simulator for the browser. Start as a newborn, press **Age** to
advance a year at a time, and make the choices that shape a whole life — school,
careers, money, relationships, health, crime, and eventually what you leave behind.

Play it: open `index.html`, or enable GitHub Pages on this repo and visit the URL.
It's built mobile-first — a dark theme, large touch targets and safe-area
handling — so it's at its best on a phone, but works fine on a desktop browser.

## Screens

A splash opens onto a **home screen** showing your level, XP progress and
lifetime record, with a single *Start a New Life* button, a *Continue Life* row
when a game is in progress, and tiles for **Achievements** and **Statistics**.

**Create a Life** fits on one screen: names arrive pre-rolled (with a dice
button to roll again), then gender, a starting scenario and difficulty. God Mode
— birthplace, wealth class, nobility and sexuality — sits behind a disclosure so
it's there when you want it and out of the way when you don't.

**Achievements** tracks achievements, standing challenges and the life ribbons
you've collected. **Statistics** keeps lifetime records and every past life.

Every sheet shares the same layout. A header pinned to the top shows who
you are, what you do, your age and your balance — updated the moment anything
changes — with the close button beside it. Every option is a row with an
emoji, a title, a line on what it does and its price on the right; rows that
do something straight away end in `•••`, rows that open another screen end
in `›`, and every sub-screen has the same `‹` back arrow by its title. Every row,
choice, button and notification carries an emoji, picked from what it says, and
only emoji that every phone and computer can draw are used.
Activities, Occupation and Assets open with a short **Just for you** list —
up to three things worth doing given your life right now: see a doctor when
your health is failing, counselling when a marriage is strained, catch up
with a friend who's drifting, find a job, invest idle savings, claim a
pension.

## Running it

No build step, no dependencies, no server required.

- **Locally:** double-click `index.html`.
- **GitHub Pages:** Settings → Pages → Source: `main`, folder `/ (root)`. It'll be
  served at `https://<your-username>.github.io/<repo-name>/`.

Progress is saved to `localStorage`, so it persists in that browser but doesn't
sync between devices.

## What's in it

**The loop** — one year per press. Each year has a limited number of *actions*,
so you can't do everything; choices compete with each other.

**Education** — primary through secondary, with the option to study hard, skip
class or cheat. Then college, university with a choice of degree, and
postgraduate study up to a PhD. You can also go back at any age — evening
classes, a diploma, a first degree or a second one — and choose how to fund it:
apply for a scholarship, take a student loan, pay your own way, or ask your
parents, who may well say no.

Finishing each stage is announced, and asks what's next, with every entry
requirement and fee shown. Leaving school at 18 offers college, an
apprenticeship, or stopping and looking for work. Finishing college offers
university or work. Graduating offers a Master's, an MBA from 24, or work,
and a Master's opens the way to a PhD. The same questions follow courses
taken later in life. Choosing work opens the job listings straight away, and
a rejection still counts the stage you finished, so you can apply again
later.

The professional schools take longer: Veterinary Medicine is a five-year
degree and Pharmacy four, against three for most subjects, and each is the
only way into its profession, so there is no pharmacist without a pharmacy
degree and no vet without a veterinary one. Nursing can be entered as a
healthcare assistant, but from 2013 you can't register past that rung without
a Nursing degree, and a graduate starts as a staff nurse. An MBA is open from
24 and helps with promotion in business and in senior roles anywhere. A short
course at a local college (a community college course in the US and Canada)
takes a year of evenings and gives a certificate in bookkeeping, IT, a
language, first aid or professional cookery, each counting for something when
you apply for a job in the matching field.

**Careers** — 44 ladders across 17 fields, and every one of them runs eleven
rungs from the bottom to the top: ten promotions, from Trainee Electrician to
Regional Contractor, from Trainee Teller to Hedge Fund Partner. Manual and
Trades is eleven separate trades rather than one catch-all — electrician,
plumber, carpenter, bricklayer, welder, mechanic, decorator, roofer, HGV driver,
groundworker and landscape gardener — each with its own ladder that can end in
owning the firm. Retail and hospitality are separate fields with separate
ladders. Leaving school into an apprenticeship means picking the actual trade.

Work wears you down, and time off builds you back up. Each year stress eases
part of the way back towards a resting level, faster when you're healthy,
happy, close to a partner or friends, or out of work, and barely at all in
prison. An ordinary job settles at a steady level. Three years running above
80 ends a career in burnout, and that takes a heavy load: front-line work,
crime, or one crisis after another. Over simulated working lives with no
holidays or therapy, burnout ends a career in about 2% of ordinary lives and
about half of front-line ones.

Every job — civilian, military or political — has a performance stat you manage:
work harder, coast, ask for raises, put in for promotion or selection, or walk
out. Let performance fall below 30 and you get a formal warning and a year to
recover it; ignore that and you're dismissed. Every promotion resets it: a new
rung starts you in the lower middle with no above-scale pay, so the reputation
that got you there belongs to the job you just left and the first year in a new
rank has to be earned. Every career has its own dilemmas that surface as you go,
and several have their own actions — auditions for actors, cases for lawyers,
operations for surgeons, transfer windows for footballers.

**Creative careers** — acting, design and content creation, plus three more.
*Model* needs looks of 65 to get signed, is promoted on looks rather than
smarts, and is a young person's job: past 32 the bookings slow and the
agencies drop you, so most modelling careers are over by the early thirties.
*Music Producer* runs from Bedroom Producer to Super-Producer, with records to
produce, credits to fight over, uncleared samples and unknowns worth a gamble.
*Musician* is now two routes: solo, the higher ceiling, or in a band, which
splits the money but rises more steadily and comes with its own trouble —
creative differences, a bandmate who needs help, a support slot on a huge tour,
and the chance to walk out and go solo a rung below where the band was.

**Organised crime** — two ladders, a Crime Family (Lookout to Boss of Bosses)
and a Drug Cartel (Lookout to Cartel Boss, from the late 1970s on). Nobody
takes on a stranger: you need connections first — a crew, a criminal record or
a bad enough reputation. The pay is cash, untaxed and undeclared, with no
pension. Every year builds police *heat*; taking on more work raises your
standing and your heat, lying low cools both, and the job screen shows your
odds of arrest this year and the sentence you'd face, which grows with rank.
Higher up, more people stand between you and the street, so the same heat is
harder to make stick. The violence is real, sooner or later the police offer
you a deal to testify, and walking away isn't always allowed. Played well, a
crime family pays far better than an honest trade; about one in four still
ends up inside, one in twenty is killed, and about one in a hundred reaches the
top. The cartel pays more and kills twice as often. Reaching the top of either
earns the *Kingpin* ribbon.

**Armed forces** — fifteen services across nine countries: the Royal Navy,
British Army, RAF and Royal Marines; the US Army, Navy, Air Force and Marine
Corps; and the Canadian, Australian, New Zealand, Irish, Indian, French and
German armies. Each has eleven ranks for other ranks and eleven for officers —
ten promotions either way — with each nation's real ladder in English. The
Royal Navy runs Recruit through Able Rating, Leading Hand, Petty Officer and
Chief Petty Officer up to Warrant Officer of the Naval Service. Where a nation's
ladder is genuinely shorter it's completed with that nation's real senior
appointments rather than invented ranks. Promotion goes by time in rank and how
you've been reported on, and you can only enlist in the forces of a country you
belong to — where you were born, or where you've since settled, so emigrating
opens a different set of services.

**Politics** — three routes to power, and which one is open depends on where
you live. In an elected country it's eleven rungs from Parish Councillor through
Local Councillor, Council Leader, Mayor and MP to Secretary of State and Prime
Minister. In a monarchy with real executive power there are no elections at all:
you rise by royal favour from Palace Clerk through the Crown Council to Chief of
the Royal Court, and the throne itself passes by blood — unless you take it,
which works about two times in five from the top of the court and otherwise ends
on a rope or in a cell for decades. In a one-party state you climb the party
from member through provincial secretary and the Politburo to Supreme Leader,
and losing favour there is answered with a purge rather than a by-election:
about half of those removed are convicted of corruption on the way out. A
sovereign and a supreme leader both hold the post for life, so there is no term
to lose. You advance from inside the post you hold, which needs years of service
and a standing that rises with every rung — reaching the very top is the work of
a whole career, and most careers stop one or two rungs short.

**Money** — progressive income tax, assessed on the year as a whole: a
salary, a fee, a tour, a sponsorship deal and a social-media payout all share
one personal allowance, each taxed at the marginal rate on top of what you've
already earned that year, so it makes no difference what order they arrive in.
Living costs, mortgages, student loans,
pensions and a credit score. Investments in bonds, stocks and crypto take any amount you type and can be
sold in part or in full. Property can be bought in bulk — the screen shows the
most you can afford — and let out in one press. Rent arrives as a single
summarised figure each year rather than a line per property, with running
totals for rent taken, maintenance spent and net income. Life insurance is priced on
your age when you buy it, so buying young locks in a cheap rate for life; you
can switch policies later (re-priced at your current age) or cancel outright.

**Shops** — ten of them, and each puts out different stock every time you walk
in, priced in the money of the year you're in. A car dealer, a used lot, a
motorcycle dealer, a bike shop, a jeweller, a faux jeweller, a music shop, an
antiques dealer, a yacht broker and an aircraft broker. Every listing has its
own make, age, mileage, condition and asking price, and says whether that
price is below the going rate, fair or optimistic. Things appear when they
existed: no SUVs in 1970, no e-bikes before 2010. Dodgy Dave's used lot sells
cheaply and as seen, and about half its cars turn out worse than described. On
average it's slightly worse value than an honest dealer, but far more of a
gamble. A classic car now and then holds its value instead of losing it.

**Property listings** — the market shows five homes each time you look, from a
studio flat to a country manor, in a town centre, a commuter village or by the
sea, each with bedrooms, condition, upkeep and an asking price that follows
the housing market for the year. Buy outright, or with a mortgage that a
lender will only grant up to about four and a half times your income. Homes
wear, faster when let. A run-down one can be renovated, which usually adds
more than it costs but not always. A wreck can't be let or lived in until
it's done. You can sell any one property (the mortgage and agents' fees come
out of the price) and move into one as your home, which takes it off the
rental market. Buying standard homes in bulk is still there.

**Where you live** — nobody is put out at 18. You stay with your parents,
paying a little towards your keep, until you can afford a place, marry, go
to university or reach thirty, or until you choose to move out; you can move
back in later. Anyone living independently who doesn't live in a home they
own pays rent, priced from the housing market for the year: a room in a
shared house, a small flat or a place of your own, at about a third of your
income. A partner shares it. University students' rent goes on their
student loan, as a maintenance loan would. Unemployment support includes help
with rent at the shared-room rate. Living in a home you own ends the rent and
brings a small lift in happiness every year. If you own somewhere free and fit
to live in, you move into it rather than renting elsewhere.

**Heirlooms** — things that come down the family. A grandparent sometimes
leaves you something when they die, and your parents' heirlooms are shared
among their children when the estate is settled (waive your share and you
waive those too). Each is named for when it was made (a Victorian mantel
clock, an Art Deco signet ring) and has a condition that decides its worth.
An heirloom nobody has had valued is worth what the family believes until a
valuer looks: about one in twenty turns out to be a real find, and one in
twelve a later copy. Belongings wear with the years and can be restored, though
over-restoring an antique sometimes strips its value. Fine things keep pace
with inflation and a little more; ordinary instruments lose value until
they're old enough to be vintage. Sell an unvalued heirloom to a dealer at
70% of the estimate, or a valued one at auction. Everything of note you own
when you die passes to whoever carries on the ledger as an heirloom, and comes
out of the money pot first so nothing is counted twice. A will that leaves
everything to charity, or to an elder sibling, passes none.

**Relationships** — family, friends, partners, enemies, pets and children. The
dating app filters by age and net worth, and profiles show both. There are
one-night stands as well as relationships, and protection is a decision you
make in the moment, with the real odds spelled out: conception depends on both
partners' ages and sexes, following an actual fertility curve rather than a
flat roll. Marriage, prenups, affairs, divorce and custody battles follow.

Every person has a page of their own. The Relationships screen opens with
*Spend time with everyone* at the top, then Love, Family, Children, Friends,
Enemies, Pets, Exes and Late relationships, each a list of people with a relationship bar beside their
name. Tap anyone to see who they are and what you can do with them: spend
time, talk, pay a compliment, choose a gift from something small to an
extravagance, ask for money, argue or insult them. A partner adds dates, the
cinema, weekend getaways, anniversaries, renewing your vows after ten years,
relationship counselling, contraception agreed as a standing arrangement,
trying for a baby, spying on them and divorce, with the settlement shown before
you file. Children get time together, schoolwork help, tuition, treats, the
doctor (free on the NHS), discipline, spying on them once they're ten, and
adoption. A grown-up child's page shows their life and the paths you can
suggest. Enemies can be confronted, insulted or made peace with, pets walked
and shown, and the dead have their own section with a grave to visit.

Parents can separate, at roughly the rate real marriages end: about four
households in ten over a childhood and beyond. A separated or widowed parent
may marry again, bringing a step-parent and sometimes step-siblings into the
family. Step-relatives take no share of your parents' estate. When a parent
dies married, the surviving spouse inherits first, and a step-parent leaves you
a share of their own estate only if you were close or they had no children of
their own.

Every relationship that ends, however it ends (a breakup, a divorce, a
proposal turned down, an affair found out), leaves an **ex** behind. Exes have
their own tab and their own pages: you can keep in touch, send a gift, insult
them, cut contact for good, or once a year suggest trying again. That works
best with someone you parted from on good terms, and less often the longer
it's been. Exes age and die like anyone else.

**Late relationships** gathers everyone you have lost: family, partners,
exes, friends, rivals and pets, newest first, each showing how long ago they
died, their age and the cause, with a grave to visit.

Friendships start through pop-up encounters and fade if you neglect them — go
a few years without seeing someone and they'll pull you up on it, then drift
away. Insult a friend who barely likes you and they may become a rival.

Children you parent while young grow into adults with lives of their own:
their own education, career, earnings, net worth, partner and children. You
can visit them, help them out financially, and encourage them towards study,
ambition, meeting someone or starting a family — though pushing only lands
where the relationship is strong.

**Vehicles you actually use** — everything in the garage can be taken out, and
what you do with it depends on what it is: you drive a car, ride a bike or a
motorcycle, sail a boat and fly a light aircraft or a helicopter, and each needs
the right licence first. Every vehicle carries a condition, and a performance rating drawn from
its value in today's money, so a car from any decade rates the same. Take it out for the pleasure of it, make a long trip of it, or book a
track day — the legal way to use the performance, and measurably the safest.
Cars and motorcycles can also be street raced: put up anything from £100 to
£50,000 against whoever turns up, with a faster machine winning more often and
crashing harder, and the police turning up about one time in nine whether you
won or not. A crash costs real health, sometimes a year of recovery, and about
one in five writes the vehicle off for an insurance cheque worth a fraction of
it. Racing a hatchback is roughly break-even; racing a supercar is a reliable
way to destroy your net worth.

**Social media** — sixteen platforms, each its own account with its own
audience: YouTube, TikTok, Instagram, Facebook, X, Snapchat, Twitch, Kick, a
podcast, SoundCloud, LinkedIn, Reddit, Pinterest, Substack, Patreon and
OnlyFans. Each arrives in the year it really launched — a life lived through
the 1990s has nothing to join until LinkedIn in 2003 — and Twitter becomes X
in 2023. They grow differently: looks drive TikTok, Instagram and Snapchat,
smarts drive YouTube, X and Substack, esports skill drives Twitch and Kick.
They pay differently too: Reddit and LinkedIn never pay, TikTok pays little
per follower, YouTube's back catalogue keeps earning when you stop, and
paying subscribers on Substack, Patreon and OnlyFans are worth far more each
than free followers. You get six posts a year across every platform (twelve
as a full-time content creator), plus paid promotion, collaborations with
bigger accounts once you've 1,000 followers, attention-grabbing stunts that
can get you banned, and verification — earned at 100,000 followers, or
bought on X from 2023. Accounts shrink if you stop posting, and some
followers drift away every year regardless. Most creators earn very little;
a breakout year makes a few enormous. Social income is taxed with everything
else you earn that year. A large LinkedIn network helps job applications, SoundCloud helps a
music career, big accounts attract brand deals and trolls, and an OnlyFans
can come out at work or at home. Under-18s never see OnlyFans at all.

**Health** — conditions that can be screened for and treated, chronic illness,
injuries with recovery periods, addiction and rehab. Keeping health high
genuinely extends your life.

**A world that ages properly** — everyone has an age, and everyone dies on the
same real mortality curve you do. Parents are a plausible age at your birth and
go when their own years catch up: about three quarters of people still have a
parent at fifty, one in six at sixty-five, and almost nobody at seventy-seven.
Siblings, friends, partners and rivals all age and die too. When both parents
are gone their estate divides equally between all their children, you included
— and you can take your share, contest the will, or waive it.

**Marriage** — propose when you're ready, going ring shopping first or turning
up without one, which cuts your chances by about a third. Then choose a venue,
from a register office to a castle, decide on a prenup, and book a honeymoon.
The prenup decision puts both net worths side by side and says plainly whose
side the agreement would be protecting — your partner has money of their own,
which grows over the years they work and draws down after they retire, so it is
sometimes you who would be signing something against your own interest.

**Crime** — from shoplifting to armed robbery, gangs, and a full arrest → court →
plea → sentencing flow. Inside, the game narrows to what a prisoner can
actually reach: the wing, your finances and visits. You get one move a year —
behave, volunteer for the kitchens, cleaning party, post round, laundry,
library, gardens or mentoring, use the gym or take a course, or offend. Every
offence shows its odds of being caught, which rise the more you try; getting
caught adds years and destroys the conduct record the parole board reads.
Behaving or working your way through a ten-year sentence typically gets you out
in under three years; dealing every year earns a few thousand pounds and keeps
you inside for twenty-five.

**Gambling** — blackjack and the slots take any stake you type, up to your whole
balance. The house keeps a realistic edge at every stake and will absorb a long
run of luck without complaint — a lifetime of winning seven figures in small
amounts is nobody's problem. Take £5,000,000 off it on a *single bet*, though,
and the pit boss makes a call: two men in good suits appear at your shoulder and
you are never welcome on the floor again. It takes a jackpot line on a
six-figure spin, or a blackjack on a stake most players never have.

**The whole world** — 200 countries across all six continents, each with its
own currency, wage level and cost of living. You can emigrate to any of them,
picked by continent then country, and be born in any of them too. A move's
effect on your earnings and bills is measured against where you were born, not
in absolute terms, so a life that starts in Lagos and moves to London gains as
much as the reverse loses, and staying put is always neutral. Crossing a
continent costs more than moving next door. The default birth roll stays
weighted to the British Isles, since the schooling, tax and armed forces are
British, but every country is available in God Mode.

Emigrating asks who comes with you. Your partner and young children move with
you, or you can ask the rest of the family and grown-up children to come too,
and each decides for themselves (a parent's spouse comes with them).
Unmarried, you can go without your partner, which ends it. Everyone and
everything else stays where it was: your parents, siblings, grown-up children,
friends, exes, rivals, the houses you own and the graves of people you've
lost. While you're in different countries you can't live with them, spend time
with them, give them gifts or visit their graves. You can write to them,
phone or video call depending on the year, and ask them to move to be near
you. A rival in another country can't touch you, and a friend abroad won't
turn up demanding your time. Any job or political office stays behind; a
business can be run from anywhere. A house you own abroad can still be let,
but you'll pay rent where you live. Move back and everyone there is close at
hand again. When the ledger passes to a child, the new life starts in the
country where that child lives.

**Local currency** — money is shown in the currency of wherever you live, with
the sterling equivalent in brackets: `₹106,000 (£1,000)`. Both halves can be
switched off independently in Settings. Balances are always held in sterling
internally, so emigrating changes how a figure reads and never what it is
worth.

**Decade of birth** — you're born into one of eight decades from the 1940s to
the 2010s, and it changes the game. Careers only exist once they exist: no
software engineering before 1975, no esports before 2012, no space programme
before 1961. Wages, prices and bills are all in the money of the year you're
living through, so a 1950s life earns 1950s wages against 1950s costs — the
same in real terms, but housing isn't. A house runs about 3.5× average earnings
for someone born in the 1940s and 9.5× for someone born in the 2010s, which
makes buying early a real bet. Dated events land on the calendar wherever you
happen to be in life: the 1973 oil crisis, Black Monday, 15% interest rates,
the dot-com crash, 2008, 2020. Men born in the 1940s get call-up papers at 18
and can serve, apply to defer, or refuse and risk prison for it.

**Perks** — XP finally buys something. Twenty-one permanent unlocks across five
branches, gated by level and paid from a pool kept separate from your level
total, so spending never demotes you. Weighted towards opening options rather
than raising numbers: begin at sixteen with childhood summarised, lower the
Space Programme's entry bar, get two years' grace on a formal warning, survive
health hitting zero once per life. Everything is refundable, so a different
build can always be tried.

**God Mode is earned** — each of the controls over the circumstances you're
born into is its own perk, cheapest first: sexuality (400 XP), your decade
(750), your country (1,500), your class (4,000), a noble title (7,000), and the
throne itself (14,000). Until one is unlocked the game rolls it for you, and a
locked control shows no value at all — so rerolling can't become a way of
picking what you haven't earned. Scenarios still grant whatever they need
regardless: Rags to Riches starts you poor and The Squandered Crown starts you
royal from the first life.

**Hardcore** — one life. No Time Machine, no heir to carry it on, nothing to
rewind to, and two and a half times the XP.

**The Museum** — a completion grid across every life you have ever played:
careers topped, services served, offices held, degrees earned, every one of
the 200 countries lived in (split by continent), decades lived, ribbons,
wedding venues, honeymoons, prison jobs and sixteen rare feats. Nothing in it
resets.

**Meta-progression** — XP and levels that persist across lives, four difficulty
modes, six scenario starts with goals, a life score at death, ribbons,
achievements, challenges, and a Time Machine to rewind an earlier year. You can
also close the ledger whenever you like: the life is scored and filed like any
other, and an heir can pick it up.

**Legacy** — continue as one of your children and play a dynasty across
generations. An heir brings their life with them: their partner, and their own
children, who become yours. The death screen shows what each heir would arrive
with before you choose.

**Notifications** — every decision is followed by an outcome panel saying
whether it worked, what it paid or cost, and which stats moved. Life's
milestones surface as notifications you can dismiss: hired, promoted, sacked,
together, engaged, married, a child, a grandchild, enrolled, qualified, caught,
sentenced, released, bereaved and reaching retirement age.

## Technical notes

It's a single self-contained HTML file — markup, styles and about 11,000 lines
of game logic in one place. That's deliberate: it means zero build tooling and it
runs from a file:// URL or any static host without configuration.

The only environment dependency is a `window.storage` API (async
`get`/`set`/`delete`/`list`). A `localStorage`-backed shim sits at the top of the
file, so it works anywhere a browser does.

## Tests

The `tests/` folder checks the game against itself: 18 suites and about 1,900
checks covering the rules, the money, the screens and the measured odds, plus
two fuzzers that play hundreds of lives at random looking for crashes. They
need Node 18 or later and nothing else.

```sh
sh tests/run_all.sh          # every suite, with a total at the end
node tests/verify_j.js       # or any one suite on its own
```

`tests/verify_ui_browser.js` drives the page in a real browser. It needs
Playwright (`npm i -D playwright && npx playwright install chromium`); set
`CHROMIUM_PATH` to use a browser you already have.

## Licence

MIT — see `LICENSE`.
