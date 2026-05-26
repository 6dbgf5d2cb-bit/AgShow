function dateToDays(year: number, month: number, day: number): number {
  let days = day
  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  
  for (let i = 1; i < month; i++) {
    days += monthDays[i]
  }
  
  if (month > 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
    if (isLeap) {
      days++
    }
  }
  
  return days
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

interface LunarYearData {
  spring: number
  leap: number
  months: number[]
}

const TEST_CASES = [
  { year: 2007, month: 12, day: 12, expectedLunarYear: 2007, expectedLunarMonth: 11, expectedLunarDay: 3 },
  { year: 2008, month: 2, day: 7, expectedLunarYear: 2008, expectedLunarMonth: 1, expectedLunarDay: 1 },
  { year: 2009, month: 1, day: 26, expectedLunarYear: 2009, expectedLunarMonth: 1, expectedLunarDay: 1 },
  { year: 2010, month: 2, day: 14, expectedLunarYear: 2010, expectedLunarMonth: 1, expectedLunarDay: 1 },
  { year: 2023, month: 1, day: 22, expectedLunarYear: 2023, expectedLunarMonth: 1, expectedLunarDay: 1 },
  { year: 2024, month: 2, day: 10, expectedLunarYear: 2024, expectedLunarMonth: 1, expectedLunarDay: 1 },
  { year: 2025, month: 1, day: 29, expectedLunarYear: 2025, expectedLunarMonth: 1, expectedLunarDay: 1 },
]

const LUNAR_DATA: Record<number, LunarYearData> = {
  2007: { spring: 218, leap: 0, months: [29,30,29,30,29,30,29,30,30,29,30,30,0] },
  2008: { spring: 207, leap: 0, months: [29,29,30,29,30,29,30,29,30,30,29,30,0] },
  2009: { spring: 126, leap: 0, months: [29,30,29,29,30,29,29,30,29,30,30,29,0] },
  2010: { spring: 214, leap: 8, months: [29,30,29,30,29,29,30,29,30,30,29,30,29] },
  2023: { spring: 122, leap: 0, months: [30,29,30,29,30,29,30,29,30,29,30,29,0] },
  2024: { spring: 210, leap: 0, months: [30,29,30,29,30,29,30,29,30,29,30,29,0] },
  2025: { spring: 129, leap: 0, months: [29,30,29,30,29,30,29,30,29,30,29,30,0] },
}

function solarToLunarLocal(year: number, month: number, day: number): { lunarYear: number, lunarMonth: number, lunarDay: number } {
  const data = LUNAR_DATA[year]
  if (!data) {
    throw new Error('无法获取农历数据')
  }

  const springMonth = Math.floor(data.spring / 100)
  const springDay = data.spring % 100
  
  let daysFromSpring: number
  let lunarYear: number
  let yearData: LunarYearData

  if (month < springMonth || (month === springMonth && day < springDay)) {
    lunarYear = year - 1
    yearData = LUNAR_DATA[lunarYear]
    if (!yearData) {
      throw new Error('无法获取上一年农历数据')
    }
    
    const prevSpringMonth = Math.floor(yearData.spring / 100)
    const prevSpringDay = yearData.spring % 100
    
    const daysInPrevYear = isLeapYear(lunarYear) ? 366 : 365
    const daysFromPrevSpring = daysInPrevYear - dateToDays(lunarYear, prevSpringMonth, prevSpringDay) + dateToDays(year, month, day)
    daysFromSpring = daysFromPrevSpring
  } else {
    lunarYear = year
    yearData = data
    daysFromSpring = dateToDays(year, month, day) - dateToDays(year, springMonth, springDay)
  }

  let accumulatedDays = 0
  let lunarMonth = 1
  let isLeapMonth = false

  for (let i = 0; i < yearData.months.length; i++) {
    const m = yearData.months[i]
    if (m === 0) break
    isLeapMonth = yearData.leap !== 0 && i === yearData.leap
    if (accumulatedDays + m > daysFromSpring) {
      return {
        lunarYear,
        lunarMonth,
        lunarDay: daysFromSpring - accumulatedDays + 1
      }
    }
    accumulatedDays += m
    if (!isLeapMonth) {
      lunarMonth++
    }
  }

  throw new Error('计算农历日期失败')
}

console.log('=== 农历对照表全面测试 ===\n')

let passed = 0
let failed = 0

for (const test of TEST_CASES) {
  try {
    const result = solarToLunarLocal(test.year, test.month, test.day)
    const isCorrect = result.lunarYear === test.expectedLunarYear &&
                      result.lunarMonth === test.expectedLunarMonth &&
                      result.lunarDay === test.expectedLunarDay
    
    if (isCorrect) {
      console.log(`✓ 阳历 ${test.year}年${test.month}月${test.day}日 → 农历${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日 (正确)`)
      passed++
    } else {
      console.log(`✗ 阳历 ${test.year}年${test.month}月${test.day}日`)
      console.log(`  期望: 农历${test.expectedLunarYear}年${test.expectedLunarMonth}月${test.expectedLunarDay}日`)
      console.log(`  实际: 农历${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日`)
      failed++
    }
  } catch (error) {
    console.log(`✗ 阳历 ${test.year}年${test.month}月${test.day}日 → 错误: ${error}`)
    failed++
  }
}

console.log(`\n=== 测试结果 ===`)
console.log(`通过: ${passed} / ${TEST_CASES.length}`)
console.log(`失败: ${failed} / ${TEST_CASES.length}`)
console.log(`成功率: ${((passed / TEST_CASES.length) * 100).toFixed(0)}%`)
