const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const LUNAR_DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                   '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                   '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

interface LunarYearData {
  spring: number
  leap: number
  months: number[]
}

const LUNAR_DATA: Record<number, LunarYearData> = {
  2007: { spring: 218, leap: 0, months: [29,30,29,30,29,30,29,30,30,29,30,30,0] },
}

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

function calculateYearGanZhi(year: number): string {
  const tianGanIndex = (year - 4) % 10
  const diZhiIndex = (year - 4) % 12
  return TIANGAN[tianGanIndex] + DIZHI[diZhiIndex]
}

function solarToLunarLocal(year: number, month: number, day: number): any {
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
      const yearGanZhi = calculateYearGanZhi(lunarYear)
      
      return {
        lunarYear,
        lunarMonth,
        lunarDay: daysFromSpring - accumulatedDays + 1,
        isLeapMonth,
        solarYear: year,
        solarMonth: month,
        solarDay: day,
        yearGanZhi,
        zodiac: ZODIAC[(lunarYear - 4) % 12]
      }
    }
    accumulatedDays += m
    if (!isLeapMonth) {
      lunarMonth++
    }
  }

  throw new Error('计算农历日期失败')
}

function formatLunarDate(result: any): string {
  const yearGanZhi = result.yearGanZhi
  let monthStr = LUNAR_MONTHS[result.lunarMonth - 1]
  if (result.isLeapMonth) {
    monthStr = '闰' + monthStr
  }
  const dayStr = LUNAR_DAYS[result.lunarDay - 1]
  return `${yearGanZhi}年(${ZODIAC[(result.lunarYear - 4) % 12]}年)${monthStr}月${dayStr}`
}

const year = 2007
const month = 12
const day = 12

console.log(`测试阳历 ${year}年${month}月${day}日`)
try {
  const result = solarToLunarLocal(year, month, day)
  console.log(`计算结果: ${formatLunarDate(result)}`)
  console.log(`预期结果: 丁亥年(猪年)冬月初三`)
  
  const expectedYearGanZhi = '丁亥'
  const expectedLunarMonth = 11
  const expectedLunarDay = 3
  
  const isCorrect = result.yearGanZhi === expectedYearGanZhi && 
                    result.lunarMonth === expectedLunarMonth && 
                    result.lunarDay === expectedLunarDay
  
  console.log(`\n验证结果: ${isCorrect ? '✓ 正确' : '✗ 错误'}`)
  
  if (!isCorrect) {
    console.log(`年干支: 期望=${expectedYearGanZhi}, 实际=${result.yearGanZhi}`)
    console.log(`农历月: 期望=${expectedLunarMonth}, 实际=${result.lunarMonth}`)
    console.log(`农历日: 期望=${expectedLunarDay}, 实际=${result.lunarDay}`)
  }
} catch (error) {
  console.error('转换失败:', error)
}
