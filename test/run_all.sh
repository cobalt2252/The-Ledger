#!/bin/sh
# Runs every Node test suite against ../index.html and prints a total.
# Needs Node 18+. The browser test (verify_ui_browser.js) is separate: it needs
# Playwright (npm i -D playwright && npx playwright install chromium).
cd "$(dirname "$0")"
total=0; failed=0
for f in verify_u verify_t verify_s verify_r verify_q verify_feat verify_ui verify_v verify_p verify_ui2 verify_c verify_sm verify_f verify_g verify_h verify_i verify_j verify_k; do
  line=$(node "$f.js" 2>&1 | grep -E "passed" | tail -1)
  echo "$f: $line"
  p=$(echo "$line" | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+"); x=$(echo "$line" | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+")
  total=$((total + ${p:-0})); failed=$((failed + ${x:-0}))
done
echo "queue_test: $(node queue_test.js 2>&1 | tail -1)"
echo "fuzz: $(node fuzz.js 2>&1 | tail -2 | tr '\n' ' ')"
echo "fuzz_actions: $(node fuzz_actions.js 2>&1 | tail -2 | tr '\n' ' ')"
echo "TOTAL: $total passed, $failed failed"
[ "$failed" -eq 0 ]
