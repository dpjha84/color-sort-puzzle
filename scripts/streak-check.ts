// Quick logic check for streak freezes and milestone chests. Run: npx tsx scripts/streak-check.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {} };
import { loadProgress, applyDailyWin, liveDailyStreak, applyPurchase, chestFor, MAX_FREEZES } from '../src/utils/progress';

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);

let p = loadProgress(1);
for (let i = 0; i < 3; i++) p = applyDailyWin(p, day(i), 100).state;
ok(p.daily.streak === 3, 'three consecutive days gives streak 3');
ok(p.daily.freezes === 1, 'day-3 chest grants one freeze');
ok(chestFor(3)?.coins === 150 && chestFor(7)?.gems === 3 && chestFor(30)?.freezes === 2 && chestFor(60) !== null && chestFor(5) === null, 'chest table');

// miss day 3 (index 3), win on day 4: freeze covers it
const res = applyDailyWin(p, day(4), 100);
ok(res.result.streak === 4 && res.result.froze === 1, 'one missed day is covered by a freeze');
ok(res.state.daily.freezes === 0, 'the freeze is consumed');
ok(liveDailyStreak(p.daily, day(4)) === 3, 'streak shown alive while a freeze can cover the gap');

// two missed days with only one freeze: streak resets
const lost = applyDailyWin(p, day(5), 100);
ok(lost.result.streak === 1 && lost.result.froze === 0, 'gap larger than freezes resets streak');
ok(lost.state.daily.freezes === 1, 'freeze kept when streak resets anyway');
ok(liveDailyStreak(p.daily, day(5)) === 0, 'lapsed streak shows 0');

// freeze purchase and cap
let q = loadProgress(1); q.gems = 10;
q = applyPurchase(q, 'freeze')!; q = applyPurchase(q, 'freeze')!;
ok(q.daily.freezes === MAX_FREEZES && q.gems === 6, 'buying two freezes costs 4 gems');
ok(applyPurchase(q, 'freeze') === null, 'cannot hold more than the cap');

// replay same day pays nothing and keeps freezes
const again = applyDailyWin(res.state, day(4), 200);
ok(!again.result.first && again.result.chest === null, 'replay on the same day pays no chest');
process.exit(fails ? 1 : 0);
