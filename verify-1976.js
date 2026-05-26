function dateToDays(y, m, d) {
  const monthDays = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  let days = d;
  for (let i = 1; i < m; i++) days += monthDays[i];
  if (m > 2 && ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0))) days++;
  return days;
}

function testLunar(year, month, day, expectedLunarMonth, expectedLunarDay) {
  const springMonth = 1;
  const springDay = 31;

  const yearDays = dateToDays(year, month, day);
  const springDays = dateToDays(year, springMonth, springDay);
  const daysFromSpring = yearDays - springDays + 1;

  const months1976 = [30,30,29,30,29,30,29,30,29,29,30,29,29];
  let accumulated = 0;
  let lunarMonth = 1;
  let isLeapMonth = false;

  for (let i = 0; i < months1976.length; i++) {
    const m = months1976[i];
    if (m === 0) break;
    isLeapMonth = 8 !== 0 && i === 8;
    if (accumulated + m >= daysFromSpring) {
      const lunarDay = daysFromSpring - accumulated;
      const match = lunarMonth === expectedLunarMonth && lunarDay === expectedLunarDay;
      console.log(`1976年${month}月${day}日 → 农历${lunarMonth}月${lunarDay}日 ${lunarMonth === 8 && isLeapMonth ? '(闰)' : ''} (预期: ${expectedLunarMonth}月${expectedLunarDay}日) ${match ? '✓' : '✗'}`);
      return;
    }
    accumulated += m;
    if (!isLeapMonth) {
      lunarMonth++;
    }
  }
  console.log(`1976年${month}月${day}日 → 计算失败`);
}

console.log('=== 验证1976年农历转换 (修正后) ===\n');
testLunar(1976, 10, 6, 8, 13);
testLunar(1976, 10, 22, 8, 29);
testLunar(1976, 10, 23, 9, 1);
testLunar(1976, 12, 7, 10, 17);
testLunar(1976, 12, 19, 10, 29);
testLunar(1976, 12, 21, 11, 1);

console.log('\n1976年月份数组: [30,30,29,30,29,30,29,30,29,29,30,29,29]');
console.log('leap = 8 (闰八月)');