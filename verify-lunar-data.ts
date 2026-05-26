import { solarToLunarLocal } from './miniprogram/utils/lunar'

console.log('=== 验证农历数据准确性 ===\n')

const testCases = [
  { year: 2007, month: 12, day: 12, expectedYear: 2007, expectedMonth: 11, expectedDay: 3 },
  { year: 2008, month: 2, day: 7, expectedYear: 2008, expectedMonth: 1, expectedDay: 1 },
  { year: 2009, month: 1, day: 26, expectedYear: 2009, expectedMonth: 1, expectedDay: 1 },
  { year: 2010, month: 2, day: 14, expectedYear: 2010, expectedMonth: 1, expectedDay: 1 },
  { year: 2023, month: 1, day: 22, expectedYear: 2023, expectedMonth: 1, expectedDay: 1 },
  { year: 2024, month: 2, day: 10, expectedYear: 2024, expectedMonth: 1, expectedDay: 1 },
  { year: 2025, month: 1, day: 29, expectedYear: 2025, expectedMonth: 1, expectedDay: 1 },
]

let passed = 0
let failed = 0

for (const test of testCases) {
  try {
    const result = solarToLunarLocal(test.year, test.month, test.day)
    const isCorrect = result.lunarYear === test.expectedYear && 
                      result.lunarMonth === test.expectedMonth && 
                      result.lunarDay === test.expectedDay
    
    if (isCorrect) {
      console.log(`✓ 阳历 ${test.year}年${test.month}月${test.day}日 → 农历${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日 (正确)`)
      passed++
    } else {
      console.log(`✗ 阳历 ${test.year}年${test.month}月${test.day}日 → 农历${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日 (预期: 农历${test.expectedYear}年${test.expectedMonth}月${test.expectedDay}日)`)
      failed++
    }
  } catch (error) {
    console.log(`✗ 阳历 ${test.year}年${test.month}月${test.day}日 → 错误: ${error}`)
    failed++
  }
}

console.log(`\n=== 测试结果 ===`)
console.log(`通过: ${passed} / ${testCases.length}`)
console.log(`失败: ${failed} / ${testCases.length}`)
console.log(`成功率: ${((passed / testCases.length) * 100).toFixed(0)}%`)
