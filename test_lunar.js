const { solarToLunar, formatLunarDate } = require('./miniprogram/utils/lunar')

const testCases = [
  { solar: { year: 2007, month: 12, day: 12 }, expected: { lunarYear: 2007, lunarMonth: 11, lunarDay: 3 }, desc: '2007年12月12日（冬月初三）' },
  { solar: { year: 1976, month: 12, day: 19 }, expected: { lunarYear: 1976, lunarMonth: 10, lunarDay: 29 }, desc: '1976年12月19日（十月廿九）' },
  { solar: { year: 2023, month: 1, day: 22 }, expected: { lunarYear: 2023, lunarMonth: 1, lunarDay: 1 }, desc: '2023年春节' },
  { solar: { year: 2007, month: 2, day: 18 }, expected: { lunarYear: 2007, lunarMonth: 1, lunarDay: 1 }, desc: '2007年春节' },
  { solar: { year: 1947, month: 8, day: 24 }, expected: { lunarYear: 1947, lunarMonth: 7, lunarDay: 9 }, desc: '1947年8月24日（七月初九）' },
  { solar: { year: 1900, month: 1, day: 31 }, expected: { lunarYear: 1899, lunarMonth: 12, lunarDay: 30 }, desc: '1900年春节前' },
  { solar: { year: 1900, month: 2, day: 1 }, expected: { lunarYear: 1900, lunarMonth: 1, lunarDay: 1 }, desc: '1900年春节' },
  { solar: { year: 2025, month: 1, day: 29 }, expected: { lunarYear: 2025, lunarMonth: 1, lunarDay: 1 }, desc: '2025年春节' },
  { solar: { year: 2026, month: 2, day: 17 }, expected: { lunarYear: 2026, lunarMonth: 1, lunarDay: 1 }, desc: '2026年春节' },
  { solar: { year: 2061, month: 1, day: 21 }, expected: { lunarYear: 2061, lunarMonth: 1, lunarDay: 1 }, desc: '2061年春节（最早春节）' },
  { solar: { year: 2099, month: 1, day: 21 }, expected: { lunarYear: 2099, lunarMonth: 1, lunarDay: 1 }, desc: '2099年春节（最早春节）' },
  { solar: { year: 2015, month: 2, day: 19 }, expected: { lunarYear: 2015, lunarMonth: 1, lunarDay: 1 }, desc: '2015年春节（最晚春节之一）' },
]

let passed = 0
let failed = 0

console.log('=== 农历转换测试 ===\n')

for (const testCase of testCases) {
  try {
    const result = solarToLunar(testCase.solar.year, testCase.solar.month, testCase.solar.day)
    const formatted = formatLunarDate(result)
    
    const isCorrect = result.lunarYear === testCase.expected.lunarYear &&
                      result.lunarMonth === testCase.expected.lunarMonth &&
                      result.lunarDay === testCase.expected.lunarDay
    
    if (isCorrect) {
      console.log(`✓ 通过: ${testCase.desc}`)
      console.log(`  阳历: ${testCase.solar.year}-${testCase.solar.month}-${testCase.solar.day}`)
      console.log(`  农历: ${formatted}\n`)
      passed++
    } else {
      console.log(`✗ 失败: ${testCase.desc}`)
      console.log(`  阳历: ${testCase.solar.year}-${testCase.solar.month}-${testCase.solar.day}`)
      console.log(`  期望: ${testCase.expected.lunarYear}年${testCase.expected.lunarMonth}月${testCase.expected.lunarDay}日`)
      console.log(`  实际: ${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日 (${formatted})\n`)
      failed++
    }
  } catch (error) {
    console.log(`✗ 错误: ${testCase.desc}`)
    console.log(`  错误信息: ${error.message}\n`)
    failed++
  }
}

console.log(`=== 测试结果: 通过 ${passed} / 失败 ${failed} ===`)
