const { solarToLunar, lunarToSolar, formatLunarDate } = require('./lunar.ts')

function testSolarToLunar(year, month, day, expectedLunarYear, expectedLunarMonth, expectedLunarDay) {
  try {
    const result = solarToLunar(year, month, day)
    const isCorrect = result.lunarYear === expectedLunarYear && 
                      result.lunarMonth === expectedLunarMonth && 
                      result.lunarDay === expectedLunarDay
    
    console.log(`阳历 ${year}-${month}-${day} -> 农历 ${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日`)
    console.log(`预期: ${expectedLunarYear}年${expectedLunarMonth}月${expectedLunarDay}日`)
    console.log(isCorrect ? '✓ 正确' : '✗ 错误')
    console.log('---')
    
    return isCorrect
  } catch (e) {
    console.log(`阳历 ${year}-${month}-${day} -> 错误: ${e.message}`)
    console.log('---')
    return false
  }
}

function testLunarToSolar(lunarYear, lunarMonth, lunarDay, expectedYear, expectedMonth, expectedDay) {
  try {
    const result = lunarToSolar(lunarYear, lunarMonth, lunarDay)
    const isCorrect = result.year === expectedYear && 
                      result.month === expectedMonth && 
                      result.day === expectedDay
    
    console.log(`农历 ${lunarYear}年${lunarMonth}月${lunarDay}日 -> 阳历 ${result.year}-${result.month}-${result.day}`)
    console.log(`预期: ${expectedYear}-${expectedMonth}-${expectedDay}`)
    console.log(isCorrect ? '✓ 正确' : '✗ 错误')
    console.log('---')
    
    return isCorrect
  } catch (e) {
    console.log(`农历 ${lunarYear}年${lunarMonth}月${lunarDay}日 -> 错误: ${e.message}`)
    console.log('---')
    return false
  }
}

console.log('=== 测试阳历转农历 ===')
console.log('')

// 测试一些已知的日期
let allPassed = true

// 2024年春节: 2月10日 -> 甲辰年正月初一
allPassed &= testSolarToLunar(2024, 2, 10, 2024, 1, 1)

// 2023年春节: 1月22日 -> 癸卯年正月初一
allPassed &= testSolarToLunar(2023, 1, 22, 2023, 1, 1)

// 2023年1月21日 -> 壬寅年腊月三十
allPassed &= testSolarToLunar(2023, 1, 21, 2022, 12, 30)

// 2020年春节: 1月25日 -> 庚子年正月初一
allPassed &= testSolarToLunar(2020, 1, 25, 2020, 1, 1)

// 2019年12月31日 -> 己亥年腊月初六
allPassed &= testSolarToLunar(2019, 12, 31, 2019, 12, 6)

// 2019年春节: 2月5日 -> 己亥年正月初一
allPassed &= testSolarToLunar(2019, 2, 5, 2019, 1, 1)

// 2007年12月12日 -> 丁亥年十月二十三
allPassed &= testSolarToLunar(2007, 12, 12, 2007, 10, 23)

// 1976年12月19日 -> 丙辰年十月二十九
allPassed &= testSolarToLunar(1976, 12, 19, 1976, 10, 29)

// 闰月测试: 2017年闰六月 -> 2017年7月23日是闰六月初一
allPassed &= testSolarToLunar(2017, 7, 23, 2017, 6, 1)

console.log('')
console.log('=== 测试农历转阳历 ===')
console.log('')

// 农历转阳历测试
allPassed &= testLunarToSolar(2024, 1, 1, 2024, 2, 10)
allPassed &= testLunarToSolar(2023, 1, 1, 2023, 1, 22)
allPassed &= testLunarToSolar(2022, 12, 30, 2023, 1, 21)
allPassed &= testLunarToSolar(2020, 1, 1, 2020, 1, 25)
allPassed &= testLunarToSolar(2019, 12, 6, 2019, 12, 31)
allPassed &= testLunarToSolar(2019, 1, 1, 2019, 2, 5)
allPassed &= testLunarToSolar(2007, 10, 23, 2007, 12, 12)
allPassed &= testLunarToSolar(1976, 10, 29, 1976, 12, 19)

console.log('')
console.log('=== 测试结果 ===')
console.log(allPassed ? '所有测试通过！' : '部分测试失败！')
