import { solarToLunar, lunarToSolar } from './lunar'
import { computeBaziPillars } from './bazi-pillar'

export type { SymptomItem, SymptomResult, BodyPartReport, OrganReport, ClassicReport } from './tcm-diagnosis'
export { SYMPTOM_CATEGORIES, SYMPTOMS, analyzeSymptoms } from './tcm-diagnosis'

export interface DaYunItem {
  startAge: number
  endAge: number
  gan: string
  zhi: string
  analysis: string
}

export interface LiuNianItem {
  year: number
  gan: string
  zhi: string
  analysis: string
  shiShen: string
}

export interface BaZiResult {
  year: string
  month: string
  day: string
  hour: string
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  hourGan: string
  hourZhi: string
  xiyongShen: string
  analysis: string
  startAge: number  // 起运年龄（周岁约数）
  qiYunDesc: string  // 起运交运说明
  naYin: { year: string; month: string; day: string; hour: string }
  pillarMethod: string  // 排盘依据说明
  ziShiNote: string
  detailedAnalysis: {
    riZhu: string
    yuanhaiPoem: string
    yueLing: string
    wuXing: string
    shiShen: string
    geJu: string
    yunShi: string
    jianYi: string[]
  }
  daYun: DaYunItem[]  // 大运分析
  liuNian: LiuNianItem[]  // 流年分析
  ditianSuiAnalysis: {
    tongshen: string
    xingqing: {
      pos: string
      neg: string
    }
    geju: string
    yunshi: string
    zonglun: string
  }
  originalDate: string  // 原始输入日期
  originalCalendarType: string  // 原始输入历法类型
  lunarDate: string  // 转换后的农历日期
  solarDate: string  // 转换后的阳历日期
}

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const TIANGAN_YANGYIN = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴']
const DIZHI_YANGYIN = ['阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴', '阳', '阴']

const TIANGAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
}

const DIZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

// 五行相生关系：木生火，火生土，土生金，金生水，水生木
const WUXING_SHENG: Record<string, string> = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
}

// 五行相克关系：木克土，土克水，水克火，火克金，金克木
const WUXING_K: Record<string, string> = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
}

// 计算某年某月某日是当年的第几天
function dayOfYear(month: number, day: number, year: number): number {
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let total = 0
  for (let i = 0; i < month - 1; i++) {
    total += daysInMonth[i]
  }
  return total + day
}

// 判断是否闰年
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

// 公历日期转儒略日
function solarToJulianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

const SHICHEN: Record<string, { name: string; range: string; startHour: number }> = {
  '23-01': { name: '子时', range: '23:00-01:00', startHour: 23 },
  '01-03': { name: '丑时', range: '01:00-03:00', startHour: 1 },
  '03-05': { name: '寅时', range: '03:00-05:00', startHour: 3 },
  '05-07': { name: '卯时', range: '05:00-07:00', startHour: 5 },
  '07-09': { name: '辰时', range: '07:00-09:00', startHour: 7 },
  '09-11': { name: '巳时', range: '09:00-11:00', startHour: 9 },
  '11-13': { name: '午时', range: '11:00-13:00', startHour: 11 },
  '13-15': { name: '未时', range: '13:00-15:00', startHour: 13 },
  '15-17': { name: '申时', range: '15:00-17:00', startHour: 15 },
  '17-19': { name: '酉时', range: '17:00-19:00', startHour: 17 },
  '19-21': { name: '戌时', range: '19:00-21:00', startHour: 19 },
  '21-23': { name: '亥时', range: '21:00-23:00', startHour: 21 }
}

function getYearGan(year: number): string {
  const ganIndex = (year - 4) % 10
  return TIANGAN[ganIndex]
}

function getYearZhi(year: number): string {
  const zhiIndex = (year - 4) % 12
  return DIZHI[zhiIndex]
}

// 根据《渊海子平》年上起月法计算月干
// 甲己之年丙作首，乙庚之岁戊为头，丙辛之岁寻庚上，丁壬壬位顺行流，戊癸之年何方发，甲寅之上好追求
// 根据公历日期获取节气月份（用于计算月柱）
function getSolarTermMonth(year: number, month: number, day: number): number {
  // 节气日期表（粗略值，实际需要精确计算）
  // 每个月的节气日期（日）
  const solarTerms: Record<number, { start: number; end: number }> = {
    1: { start: 6, end: 21 },   // 小寒-立春前
    2: { start: 4, end: 19 },   // 立春-惊蛰前
    3: { start: 6, end: 21 },   // 惊蛰-清明前
    4: { start: 5, end: 20 },   // 清明-立夏前
    5: { start: 6, end: 21 },   // 立夏-芒种前
    6: { start: 6, end: 21 },   // 芒种-小暑前
    7: { start: 7, end: 23 },   // 小暑-立秋前
    8: { start: 8, end: 23 },   // 立秋-白露前
    9: { start: 8, end: 23 },   // 白露-寒露前
    10: { start: 8, end: 24 },  // 寒露-立冬前
    11: { start: 7, end: 22 },  // 立冬-大雪前
    12: { start: 7, end: 22 }   // 大雪-小寒前
  }
  
  const term = solarTerms[month]
  
  // 判断处于哪个节气区间
  // 节气月份对应：立春开始为寅月(1月)，以此类推
  if (month === 1) {
    if (day >= term.end) return 12  // 大寒后，属上年腊月
    return 12  // 小寒-大寒，属上年腊月
  } else if (month === 2) {
    if (day < term.start) return 12  // 立春前，属上年腊月
    return 1   // 立春后，寅月
  } else {
    if (day < term.start) {
      // 节气前，属上个月
      return month - 2  // 3月惊蛰前属2月(卯月前)
    } else if (day < term.end) {
      // 第一个节气后，第二个节气前
      return month - 1
    } else {
      // 第二个节气后，属下个月
      return month
    }
  }
}

// 根据公历日期获取月支（基于节气）
function getMonthZhiBySolarTerm(year: number, month: number, day: number): string {
  // 节气月份：1=寅, 2=卯, 3=辰, 4=巳, 5=午, 6=未, 7=申, 8=酉, 9=戌, 10=亥, 11=子, 12=丑
  const solarMonth = getSolarTermMonth(year, month, day)
  
  // 如果是1月且在立春前，属于上年腊月(丑月)
  if (month === 1 && day < 4) {
    return '丑'
  }
  
  // 寅开始对应索引2
  const zhiOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  return zhiOrder[solarMonth - 1] || '寅'
}

// 根据公历日期获取月干（基于节气和年干）
function getMonthGanBySolarTerm(year: number, month: number, day: number): string {
  const yearGan = getYearGan(year)
  const solarMonth = getSolarTermMonth(year, month, day)
  
  // 确定正月的月干（寅月的月干）
  const zhengYueGan: Record<string, number> = {
    '甲': 2, '己': 2,  // 甲己之年丙作首(丙=2)
    '乙': 4, '庚': 4,  // 乙庚之岁戊为头(戊=4)
    '丙': 6, '辛': 6,  // 丙辛之岁寻庚上(庚=6)
    '丁': 8, '壬': 8,  // 丁壬壬位顺行流(壬=8)
    '戊': 0, '癸': 0   // 戊癸之年甲寅上(甲=0)
  }
  
  const startGan = zhengYueGan[yearGan]
  // 正月(寅月)对应索引0开始计算
  const monthIndex = solarMonth - 1  // 0-11
  const ganIndex = (startGan + monthIndex) % 10
  return TIANGAN[ganIndex]
}

function getMonthGan(year: number, month: number): string {
  const yearGan = getYearGan(year)
  
  // 确定正月的月干（寅月的月干）
  const zhengYueGan: Record<string, number> = {
    '甲': 2, '己': 2,  // 甲己之年丙作首(丙=2)
    '乙': 4, '庚': 4,  // 乙庚之岁戊为头(戊=4)
    '丙': 6, '辛': 6,  // 丙辛之岁寻庚上(庚=6)
    '丁': 8, '壬': 8,  // 丁壬壬位顺行流(壬=8)
    '戊': 0, '癸': 0   // 戊癸之年甲寅上(甲=0)
  }
  
  const startGan = zhengYueGan[yearGan]
  const monthIndex = month - 1  // 0-11
  const ganIndex = (startGan + monthIndex) % 10
  return TIANGAN[ganIndex]
}

function getMonthZhi(month: number): string {
  const zhiOrder = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return DIZHI[zhiOrder[month - 1]]
}

function genderToLunarCode(gender: string): 0 | 1 {
  return gender === 'male' || gender === '男' ? 1 : 0
}

// 分析单步大运
function analyzeDaYun(daYunGan: string, daYunZhi: string, dayGan: string): string {
  const dayWuxing = TIANGAN_WUXING[dayGan]
  const ganWuxing = TIANGAN_WUXING[daYunGan]
  const zhiWuxing = DIZHI_WUXING[daYunZhi]
  
  let analysis = `${daYunGan}${daYunZhi}运：`
  
  // 判断五行生克
  if (ganWuxing === dayWuxing) {
    analysis += `${ganWuxing}比劫助身，`
    if (zhiWuxing === dayWuxing) {
      analysis += '比劫成势，'
    } else if (WUXING_SHENG[zhiWuxing] === dayWuxing) {
      analysis += '印星生扶，'
    } else if (WUXING_SHENG[dayWuxing] === zhiWuxing) {
      analysis += '食伤吐秀，'
    }
  } else if (WUXING_SHENG[ganWuxing] === dayWuxing) {
    analysis += `${ganWuxing}印星生身，`
    if (zhiWuxing === dayWuxing) {
      analysis += '比劫助身，'
    } else if (WUXING_SHENG[zhiWuxing] === dayWuxing) {
      analysis += '印星叠见，'
    }
  } else if (WUXING_SHENG[dayWuxing] === ganWuxing) {
    analysis += `${ganWuxing}食伤泄秀，`
    if (zhiWuxing === WUXING_SHENG[dayWuxing]) {
      analysis += '食伤成势，'
    }
  } else if (WUXING_K[ganWuxing] === dayWuxing) {
    analysis += `${ganWuxing}财星耗身，`
  } else {
    analysis += `${ganWuxing}官杀制身，`
  }
  
  if (WUXING_SHENG[ganWuxing] === dayWuxing || ganWuxing === dayWuxing) {
    analysis += '印比助身，宜巩固根基、学习积累。'
  } else if (WUXING_K[ganWuxing] === dayWuxing || WUXING_K[zhiWuxing] === dayWuxing) {
    analysis += '财官制身，宜稳中求进、量力而行。'
  } else if (WUXING_SHENG[dayWuxing] === ganWuxing) {
    analysis += '食伤泄秀，宜发挥才华、拓展表达。'
  } else {
    analysis += '行运平和，宜顺势而为。'
  }

  return analysis
}

function buildDaYunFromPillars(
  pillars: ReturnType<typeof computeBaziPillars>,
  dayGan: string
): DaYunItem[] {
  return pillars.daYun.map((dy) => ({
    startAge: dy.startAge,
    endAge: dy.endAge,
    gan: dy.gan,
    zhi: dy.zhi,
    analysis: analyzeDaYun(dy.gan, dy.zhi, dayGan)
  }))
}

function buildLiuNianFromPillars(
  pillars: ReturnType<typeof computeBaziPillars>,
  dayGan: string
): LiuNianItem[] {
  const nowYear = new Date().getFullYear()
  const birthYear = nowYear - (pillars.daYun[0]?.startAge || 1) + 1
  const age = nowYear - birthYear + 1
  const currentDy =
    pillars.daYun.find((d) => age >= d.startAge && age <= d.endAge) || pillars.daYun[0]

  return pillars.liuNian.map((ln) => ({
    year: ln.year,
    gan: ln.gan,
    zhi: ln.zhi,
    shiShen: SHISHEN[dayGan]?.[TIANGAN.indexOf(ln.gan)] || '不明',
    analysis: analyzeLiuNian(
      ln.year,
      ln.gan,
      ln.zhi,
      dayGan,
      currentDy?.gan || pillars.month.gan,
      currentDy?.zhi || pillars.month.zhi
    )
  }))
}

// 分析单年流年
function analyzeLiuNian(
  year: number,
  yearGan: string,
  yearZhi: string,
  dayGan: string,
  daYunGan: string,
  daYunZhi: string
): string {
  const dayWuxing = TIANGAN_WUXING[dayGan]
  const yearWuxing = TIANGAN_WUXING[yearGan]
  const zhiWuxing = DIZHI_WUXING[yearZhi]
  const daYunGanWuxing = TIANGAN_WUXING[daYunGan]
  const daYunZhiWuxing = DIZHI_WUXING[daYunZhi]
  
  let analysis = ''
  
  // 判断流年与大运的关系
  if (yearGan === daYunGan) {
    analysis += `${year}年${yearGan}${yearZhi}，与大运伏吟，`
  } else if (yearZhi === daYunZhi) {
    analysis += `${year}年${yearGan}${yearZhi}，与大运地支相同，`
  } else {
    analysis += `${year}年${yearGan}${yearZhi}，`
  }
  
  // 判断五行生克
  if (yearWuxing === dayWuxing) {
    analysis += '比劫主事，'
  } else if (WUXING_SHENG[yearWuxing] === dayWuxing) {
    analysis += '印星主事，'
  } else if (WUXING_SHENG[dayWuxing] === yearWuxing) {
    analysis += '食伤主事，'
  } else if (WUXING_K[yearWuxing] === dayWuxing) {
    analysis += '财星主事，'
  } else {
    analysis += '官杀主事，'
  }
  
  // 判断流年与大运的配合
  if (WUXING_SHENG[daYunGanWuxing] === yearWuxing) {
    analysis += '大运生流年，'
  } else if (WUXING_SHENG[yearWuxing] === daYunGanWuxing) {
    analysis += '流年生大运，'
  } else if (yearWuxing === daYunGanWuxing) {
    analysis += '与大运比和，'
  }
  
  // 添加具体断语
  const monthOrder = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  const monthIndex = monthOrder.indexOf(yearZhi)
  
  const seasonalTips = [
    '春季木旺，', '春季木旺，', '季春土旺，',
    '夏季火旺，', '夏季火旺，', '季夏土旺，',
    '秋季金旺，', '秋季金旺，', '季秋土旺，',
    '冬季水旺，', '冬季水旺，', '季冬土旺，'
  ]
  
  analysis += seasonalTips[monthIndex] || ''
  analysis += '宜结合大运与用神综合取舍。'

  return analysis
}

// 根据《渊海子平》计算日柱
// 使用蔡勒公式变体计算日柱
function getDayGan(year: number, month: number, day: number): string {
  // 1900年1月1日是甲戌日（甲=0，戌=10）
  // 计算从1900年1月1日到目标日期的天数
  const baseDate = new Date(1900, 0, 1)
  const targetDate = new Date(year, month - 1, day)
  const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 1900年1月1日是甲戌日，甲=0，所以日干的基准是0
  const ganIndex = (daysDiff % 10 + 10) % 10
  return TIANGAN[ganIndex]
}

function getDayZhi(year: number, month: number, day: number): string {
  const baseDate = new Date(1900, 0, 1)
  const targetDate = new Date(year, month - 1, day)
  const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 1900年1月1日是甲戌日，戌=10
  const zhiIndex = (daysDiff % 12 + 10) % 12
  return DIZHI[zhiIndex]
}

// 根据《渊海子平》日上起时法计算时干
// 甲己日起甲子，乙庚日起丙子，丙辛日起戊子，丁壬日起庚子，戊癸日起壬子
function getHourGan(dayGan: string, hour: number): string {
  // 确定时干的起始（子时的天干）
  const shiGanStart: Record<string, number> = {
    '甲': 0, '己': 0,  // 甲己日起甲子(甲=0)
    '乙': 2, '庚': 2,  // 乙庚日起丙子(丙=2)
    '丙': 4, '辛': 4,  // 丙辛日起戊子(戊=4)
    '丁': 6, '壬': 6,  // 丁壬日起庚子(庚=6)
    '戊': 8, '癸': 8   // 戊癸日起壬子(壬=8)
  }
  
  const startGan = shiGanStart[dayGan]
  // 时辰索引：0=子, 1=丑, 2=寅, ...
  const hourIndex = Math.floor((hour + 1) / 2) % 12
  const ganIndex = (startGan + hourIndex) % 10
  return TIANGAN[ganIndex]
}

function getHourZhi(hour: number): string {
  // 子时特殊处理：23点属于晚子时（次日0点），时支仍为子
  if (hour === 23) {
    return '子'
  }
  const hourIndex = Math.floor((hour + 1) / 2) % 12
  return DIZHI[hourIndex]
}

function analyzeXiYongShen(bazi: BaZiResult): { xiyongShen: string; analysis: string } {
  const allGans = [bazi.yearGan, bazi.monthGan, bazi.dayGan, bazi.hourGan]
  const allZhis = [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.hourZhi]
  
  const wuxingCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  
  allGans.forEach(gan => {
    wuxingCount[TIANGAN_WUXING[gan]]++
  })
  
  allZhis.forEach(zhi => {
    wuxingCount[DIZHI_WUXING[zhi]]++
  })
  
  let maxElement = ''
  let maxCount = 0
  let minElement = ''
  let minCount = Infinity
  
  Object.entries(wuxingCount).forEach(([element, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxElement = element
    }
    if (count < minCount) {
      minCount = count
      minElement = element
    }
  })
  
  const wuxingRelation: Record<string, { produces: string; conqueredBy: string }> = {
    '木': { produces: '火', conqueredBy: '金' },
    '火': { produces: '土', conqueredBy: '水' },
    '土': { produces: '金', conqueredBy: '木' },
    '金': { produces: '水', conqueredBy: '火' },
    '水': { produces: '木', conqueredBy: '土' }
  }
  
  let xiyongShen = ''
  let analysis = ''
  
  if (maxCount >= 4) {
    xiyongShen = wuxingRelation[maxElement].conqueredBy
    analysis = `日主${bazi.dayGan}(${TIANGAN_WUXING[bazi.dayGan]}), ${maxElement}元素过旺(${maxCount}个)，宜用${xiyongShen}来克制。`
  } else if (minCount === 0) {
    xiyongShen = minElement
    analysis = `日主${bazi.dayGan}(${TIANGAN_WUXING[bazi.dayGan]}), ${minElement}元素缺失，宜补${minElement}。`
  } else {
    const dayWuxing = TIANGAN_WUXING[bazi.dayGan]
    xiyongShen = wuxingRelation[dayWuxing].produces
    analysis = `日主${bazi.dayGan}(${dayWuxing})，五行相对平衡，建议以${xiyongShen}为用神，生助日主。`
  }
  
  return { xiyongShen, analysis }
}

export async function generateBaZi(name: string, birthDate: string, birthTime: string, gender: string, calendarType: string = 'solar'): Promise<BaZiResult> {
  let lunarYear: number, lunarMonth: number, lunarDay: number
  let solarYear: number, solarMonth: number, solarDay: number
  
  if (calendarType === 'lunar') {
    const parts = birthDate.split('-')
    lunarYear = parseInt(parts[0])
    lunarMonth = parseInt(parts[1])
    lunarDay = parseInt(parts[2])
    
    const solarResult = lunarToSolar(lunarYear, lunarMonth, lunarDay)
    solarYear = solarResult.year
    solarMonth = solarResult.month
    solarDay = solarResult.day
  } else {
    const parts = birthDate.split('-')
    solarYear = parseInt(parts[0])
    solarMonth = parseInt(parts[1])
    solarDay = parseInt(parts[2])
    
    const lunarResult = await solarToLunar(solarYear, solarMonth, solarDay)
    lunarYear = lunarResult.lunarYear
    lunarMonth = lunarResult.lunarMonth
    lunarDay = lunarResult.lunarDay
  }
  
  console.log(`排盘信息：${name}，${calendarType === 'lunar' ? '农历' : '阳历'} ${birthDate}，出生时间${birthTime}`)
  console.log(`统一转换为：农历${lunarYear}年${lunarMonth}月${lunarDay}日，对应阳历${solarYear}年${solarMonth}月${solarDay}日`)
  
  // 第二步：根据《渊海子平》用转换后的农历日期排四柱八字盘
  // - 年柱：根据农历年份计算
  // - 月柱：根据节气计算（《渊海子平》规定：月柱以节气划分，非农历月份）
  // - 日柱：根据公历日期计算（因干支纪日以公历为基准）
  // - 时柱：根据日干和出生时辰计算
  
  const timeSlot = SHICHEN[birthTime]
  const startHour = timeSlot ? timeSlot.startHour : parseInt(birthTime.split('-')[0], 10)

  const pillars = computeBaziPillars(
    solarYear,
    solarMonth,
    solarDay,
    startHour,
    genderToLunarCode(gender)
  )

  const yearGan = pillars.year.gan
  const yearZhi = pillars.year.zhi
  const monthGan = pillars.month.gan
  const monthZhi = pillars.month.zhi
  const dayGan = pillars.day.gan
  const dayZhi = pillars.day.zhi
  const hourGan = pillars.hour.gan
  const hourZhi = pillars.hour.zhi
  
  const { xiyongShen, analysis } = analyzeXiYongShen({
    year: `${lunarYear}`,
    month: `${solarMonth}`,
    day: `${solarDay}`,
    hour: birthTime,
    yearGan,
    yearZhi,
    monthGan,
    monthZhi,
    dayGan,
    dayZhi,
    hourGan,
    hourZhi,
    xiyongShen: '',
    analysis: '',
    detailedAnalysis: {} as BaZiResult['detailedAnalysis']
  })
  
  // 计算五行数量
  const allGans = [yearGan, monthGan, dayGan, hourGan]
  const allZhis = [yearZhi, monthZhi, dayZhi, hourZhi]
  
  const wuxingCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  
  allGans.forEach(gan => {
    wuxingCount[TIANGAN_WUXING[gan]]++
  })
  
  allZhis.forEach(zhi => {
    wuxingCount[DIZHI_WUXING[zhi]]++
  })
  
  const detailedAnalysis = analyzeBaZiDetailed(
    dayGan,
    monthGan,
    monthZhi,
    allGans,
    allZhis,
    wuxingCount,
    pillars
  )

  const ditianSuiAnalysis = analyzeDiTianSui(
    dayGan,
    monthGan,
    monthZhi,
    allGans,
    allZhis,
    wuxingCount,
    pillars
  )

  const startAge = Math.max(1, pillars.qiYun.startAgeYears + 1)
  const daYun = buildDaYunFromPillars(pillars, dayGan)
  const liuNian = buildLiuNianFromPillars(pillars, dayGan)

  const hourLabel = timeSlot
    ? `${timeSlot.name}(${timeSlot.range})`
    : birthTime

  return {
    year: `${pillars.baziYearLabel}年（八字年柱 ${yearGan}${yearZhi}）`,
    month: `农历${lunarMonth}月 / 节气月令 ${monthGan}${monthZhi}`,
    day: `${lunarDay}日（日柱 ${dayGan}${dayZhi}）`,
    hour: hourLabel,
    
    // 四柱干支
    yearGan,
    yearZhi,
    monthGan,
    monthZhi,
    dayGan,
    dayZhi,
    hourGan,
    hourZhi,
    
    // 喜用神分析
    xiyongShen,
    analysis,
    
    startAge,
    qiYunDesc: pillars.qiYun.description,
    naYin: pillars.naYin,
    pillarMethod:
      '依《渊海子平》子平术：年柱以立春为界，月柱以节气为界（非农历月份），日柱、时柱按公历日与时辰推算，大运顺逆依年干阴阳与性别而定。',
    ziShiNote: pillars.ziShiNote,

    detailedAnalysis,
    
    // 大运流年
    daYun,
    liuNian,
    
    // 《滴天髓》运势分析
    ditianSuiAnalysis,
    
    // 原始日期信息（用于展示）
    originalDate: birthDate,
    originalCalendarType: calendarType,
    lunarDate: `${lunarYear}年${lunarMonth}月${lunarDay}日`,
    solarDate: `${solarYear}年${solarMonth}月${solarDay}日`
  }
}

export interface TimeSlot {
  value: string
  name: string
  range: string
  label: string
}

export function getTimeSlots(): TimeSlot[] {
  return Object.entries(SHICHEN).map(([key, value]) => ({
    value: key,
    name: value.name,
    range: value.range,
    label: `${value.name}(${value.range})`
  }))
}

export function getTimeSlotLabel(slot: string): string {
  const shichen = SHICHEN[slot]
  return shichen ? `${shichen.name}(${shichen.range})` : slot
}

// 十神定义（根据《渊海子平》）
const SHISHEN: Record<string, string[]> = {
  '甲': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '乙': ['劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印'],
  '丙': ['偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官'],
  '丁': ['正印', '偏印', '劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀'],
  '戊': ['七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财'],
  '己': ['正官', '七杀', '正印', '偏印', '劫财', '比肩', '伤官', '食神', '正财', '偏财'],
  '庚': ['偏财', '正财', '七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官'],
  '辛': ['正财', '偏财', '正官', '七杀', '正印', '偏印', '劫财', '比肩', '伤官', '食神'],
  '壬': ['食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印', '比肩', '劫财'],
  '癸': ['伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印', '劫财', '比肩']
}

// 地支藏干（根据《渊海子平》）
const DIZHI_CANGGAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
}

// 日主特性（根据《渊海子平》）
const RIZHU_TEDIAN: Record<string, { xingge: string; tedian: string }> = {
  '甲': { xingge: '阳木参天', tedian: '仁慈正直，有领导才能，性格刚强，有进取心' },
  '乙': { xingge: '阴木花草', tedian: '温柔细腻，善于变通，有艺术天赋，性格温和' },
  '丙': { xingge: '阳火太阳', tedian: '热情开朗，光明磊落，有感染力，喜欢表现' },
  '丁': { xingge: '阴火灯烛', tedian: '心思细腻，专注执着，有洞察力，性格内敛' },
  '戊': { xingge: '阳土城墙', tedian: '稳重踏实，诚实守信，有包容心，做事可靠' },
  '己': { xingge: '阴土田园', tedian: '温和谦逊，善于培育，有耐心，重视家庭' },
  '庚': { xingge: '阳金斧钺', tedian: '刚毅果断，有正义感，重情义，做事干脆' },
  '辛': { xingge: '阴金珠玉', tedian: '精致优雅，善于修饰，有品味，追求完美' },
  '壬': { xingge: '阳水江河', tedian: '智慧灵动，善于应变，有谋略，心胸开阔' },
  '癸': { xingge: '阴水雨露', tedian: '聪明细腻，善于滋润，有灵性，性格柔和' }
}

/** 《渊海子平》论十干提要（子平正宗，与滴天髓诗诀区分） */
const YUANHAI_LUNGAN: Record<string, string> = {
  '甲': '《渊海子平》论甲：木之阳，参天拔地，有栋梁之材。生于春月，得令而旺，宜金修剪；生于秋月，木气凋零，宜火暖局。',
  '乙': '《渊海子平》论乙：木之阴，花草藤萝，性柔而韧。春生喜水滋润，夏生喜水润根，秋生宜火，冬生宜阳。',
  '丙': '《渊海子平》论丙：火之阳，太阳之火，光明炽烈。能暖万物，能炼庚金。春月喜木，秋月喜木，冬月最要木火。',
  '丁': '《渊海子平》论丁：火之阴，灯烛之火，内性昭融。得甲木引化则明，失令则晦。喜木喜火，忌水过旺。',
  '戊': '《渊海子平》论戊：土之阳，城墙厚土，厚重诚信。春宜火暖，夏宜水润，秋宜金泄，冬宜火温。',
  '己': '《渊海子平》论己：土之阴，田园之土，能生万物。喜火暖、喜金泄秀，忌木重克、水多荡。',
  '庚': '《渊海子平》论庚：金之阳，斧钺之金，刚毅果决。喜丁火锻炼，喜壬水淘洗，春木旺时须火制。',
  '辛': '《渊海子平》论辛：金之阴，珠玉之金，精致温润。喜水润泽，喜火暖局，忌土厚埋。',
  '壬': '《渊海子平》论壬：水之阳，江河之水，奔流不息。智谋深远，喜金生助，忌土重塞。',
  '癸': '《渊海子平》论癸：水之阴，雨露之水，至弱至柔。喜金源、喜乙木引化，冬生宜火暖。'
}

// 《滴天髓》通神论诗诀
const DI_TIAN_SUI_TONGSHEN: Record<string, string> = {
  '甲': '甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。',
  '乙': '乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。',
  '丙': '丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲木若来，必当焚灭。',
  '丁': '丁火其形一灯，太阳相见夺光。得时能铸庚金，失令难熔顽铁。虽少干柴，喜湿泥多。虎马犬乡，甲木若来，必当焚灭。',
  '戊': '戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。',
  '己': '己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。',
  '庚': '庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。',
  '辛': '辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。',
  '壬': '壬水通河，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。',
  '癸': '癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。'
}

// 《滴天髓》性情论
const DI_TIAN_SUI_XINGQING: Record<string, { pos: string; neg: string }> = {
  '甲': { pos: '正直仁慈，有上进心，乐于助人，富有同情心', neg: '过于自信，固执己见，有时显得倔强' },
  '乙': { pos: '温柔善良，心思细腻，善于变通，富有艺术天赋', neg: '过于软弱，缺乏主见，容易随波逐流' },
  '丙': { pos: '热情开朗，光明磊落，有领导才能，充满活力', neg: '过于急躁，缺乏耐心，容易冲动行事' },
  '丁': { pos: '聪明睿智，专注执着，富有创造力，洞察力强', neg: '过于敏感，情绪波动大，容易钻牛角尖' },
  '戊': { pos: '稳重踏实，诚实守信，有责任心，善于包容', neg: '过于保守，缺乏变通，有时显得固执' },
  '己': { pos: '温和谦逊，善于协调，富有耐心，重视家庭', neg: '过于优柔寡断，缺乏决断力，容易妥协' },
  '庚': { pos: '刚毅果断，光明磊落，有正义感，重情重义', neg: '过于刚强，缺乏变通，容易得罪人' },
  '辛': { pos: '精致优雅，善于修饰，追求完美，富有品味', neg: '过于挑剔，追求虚荣，有时显得虚伪' },
  '壬': { pos: '智慧灵动，善于应变，有谋略，心胸开阔', neg: '过于圆滑，缺乏原则，容易投机取巧' },
  '癸': { pos: '聪明细腻，善于思考，富有灵性，性格柔和', neg: '过于内向，缺乏自信，容易犹豫不决' }
}

// 《滴天髓》格局论
const DI_TIAN_SUI_GEJU: Record<string, string> = {
  '正官': '官星清贵，为人正直，有责任感，适合公职或管理岗位。需看官星是否得令得地。',
  '七杀': '七杀有制，魄力非凡，果断勇敢，适合武职或挑战性工作。若无制化则易招是非。',
  '正印': '印星生身，仁慈善良，有学识，适合学术、教育、文化领域。印多则依赖性强。',
  '偏印': '偏印生身，思维独特，有特殊才能，适合技术、艺术、玄学领域。偏印过旺则孤僻。',
  '食神': '食神吐秀，聪明才华，乐观开朗，适合艺术、创作、表达类工作。食多则慵懒。',
  '伤官': '伤官泄秀，才华横溢，见解独到，适合创意、技术领域。伤官见官则易招官非。',
  '正财': '财星得用，勤俭持家，务实能干，适合经商、财务工作。财多身弱则富屋贫人。',
  '偏财': '偏财得地，慷慨大方，商业头脑灵活，适合投资、经商。偏财过旺则易投机。',
  '比肩': '比劫帮身，朋友众多，乐于助人，适合团队合作。比劫过旺则易争财夺利。',
  '劫财': '劫财助身，行动力强，敢于拼搏，适合创业开拓。劫财过旺则易冲动生事。'
}

// 月令特性
const YUELING_TEDIAN: Record<string, string> = {
  '子': '水旺之时，寒气较重，宜火调候',
  '丑': '土旺之月，寒湿之气，宜火温暖',
  '寅': '木旺之始，阳气初生，生机勃勃',
  '卯': '木旺之时，春气正盛，宜金修剪',
  '辰': '土旺之月，湿土养木，宜火暖局',
  '巳': '火旺之始，阳气渐盛，宜水调候',
  '午': '火旺之时，炎夏之际，宜水滋润',
  '未': '土旺之月，夏末余火，宜水润泽',
  '申': '金旺之始，秋气渐生，宜火炼金',
  '酉': '金旺之时，秋气正盛，宜火锻炼',
  '戌': '土旺之月，秋末收藏，宜木疏通',
  '亥': '水旺之始，冬气渐生，宜火温暖'
}

// 格局判断（根据《渊海子平》）
function judgeGeJu(dayGan: string, monthZhi: string, allGans: string[], allZhis: string[]): { geJu: string; shuoming: string } {
  if (!monthZhi || !DIZHI_CANGGAN[monthZhi]) {
    return { geJu: '格局判断失败', shuoming: '月令数据无效' }
  }
  
  if (!allGans || !Array.isArray(allGans) || allGans.length === 0) {
    return { geJu: '格局判断失败', shuoming: '天干数据无效' }
  }
  
  if (!allZhis || !Array.isArray(allZhis) || allZhis.length === 0) {
    return { geJu: '格局判断失败', shuoming: '地支数据无效' }
  }
  
  const monthCanggan = DIZHI_CANGGAN[monthZhi]
  const monthGanWuXing = monthCanggan.map(gan => TIANGAN_WUXING[gan])
  const dayWuXing = TIANGAN_WUXING[dayGan]
  
  // 判断月令透出
  const touChu = allGans.filter(gan => monthCanggan.includes(gan))
  
  // 判断身强身弱
  let shenQiang = 0
  allGans.forEach(gan => {
    if (TIANGAN_WUXING[gan] === dayWuXing || 
        (dayWuXing === '木' && TIANGAN_WUXING[gan] === '水') ||
        (dayWuXing === '火' && TIANGAN_WUXING[gan] === '木') ||
        (dayWuXing === '土' && TIANGAN_WUXING[gan] === '火') ||
        (dayWuXing === '金' && TIANGAN_WUXING[gan] === '土') ||
        (dayWuXing === '水' && TIANGAN_WUXING[gan] === '金')) {
      shenQiang++
    }
  })
  
  allZhis.forEach(zhi => {
    const canggan = DIZHI_CANGGAN[zhi]
    if (canggan) {
      canggan.forEach(gan => {
        if (TIANGAN_WUXING[gan] === dayWuXing) shenQiang += 0.5
      })
    }
  })
  
  const isShenQiang = shenQiang >= 3
  
  // 判断格局
  let geJu = ''
  let shuoming = ''
  
  // 正官格
  if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '正官')) {
    geJu = '正官格'
    shuoming = isShenQiang ? 
      '日主强旺，官星透出，为人正直，有管理能力，适合公职或管理岗位。' :
      '日主偏弱，官星克身，宜印星化官生身，或比劫帮身抗官。'
  }
  // 七杀格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '七杀')) {
    geJu = '七杀格'
    shuoming = isShenQiang ?
      '日主强旺，七杀有制，有魄力，有领导才能，适合武职或开创性工作。' :
      '日主偏弱，七杀攻身，宜食神制杀或印星化杀，否则多灾多难。'
  }
  // 正印格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '正印')) {
    geJu = '正印格'
    shuoming = isShenQiang ?
      '日主强旺，印星生身太过，易有依赖心理，宜财星破印。' :
      '日主偏弱，印星生身，有贵人相助，适合学术、文化、教育领域。'
  }
  // 偏印格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '偏印')) {
    geJu = '偏印格'
    shuoming = isShenQiang ?
      '日主强旺，枭神夺食，宜财星制枭，或比劫泄秀。' :
      '日主偏弱，偏印生身，有特殊才能，适合技术、艺术、玄学领域。'
  }
  // 食神格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '食神')) {
    geJu = '食神格'
    shuoming = isShenQiang ?
      '日主强旺，食神泄秀，聪明有才华，适合艺术、创作、表达类工作。' :
      '日主偏弱，食神泄身太过，宜印星生身制食。'
  }
  // 伤官格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '伤官')) {
    geJu = '伤官格'
    shuoming = isShenQiang ?
      '日主强旺，伤官吐秀，才华横溢，但易傲气，适合创意、技术领域。' :
      '日主偏弱，伤官泄身，宜印星制伤生身。'
  }
  // 正财格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '正财')) {
    geJu = '正财格'
    shuoming = isShenQiang ?
      '日主强旺，财星得用，勤俭持家，适合经商、财务、管理工作。' :
      '日主偏弱，财星克身，宜比劫帮身或印星生身。'
  }
  // 偏财格
  else if (touChu.some(gan => SHISHEN[dayGan][TIANGAN.indexOf(gan)] === '偏财')) {
    geJu = '偏财格'
    shuoming = isShenQiang ?
      '日主强旺，偏财透出，慷慨大方，有商业头脑，适合投资、经商。' :
      '日主偏弱，偏财克身，宜比劫帮身。'
  }
  // 建禄格/月刃格
  else if (monthCanggan.includes(dayGan) || 
           (dayGan === '甲' && monthZhi === '卯') ||
           (dayGan === '丙' && monthZhi === '午') ||
           (dayGan === '庚' && monthZhi === '酉') ||
           (dayGan === '壬' && monthZhi === '子')) {
    geJu = '建禄格'
    shuoming = isShenQiang ?
      '日主得令而旺，宜财官为用，有白手起家之能。' :
      '日主虽得令但根气不足，宜印星生扶或比劫帮身。'
  }
  else {
    geJu = '普通格局'
    shuoming = isShenQiang ?
      '日主强旺，宜财官食伤为用神。' :
      '日主偏弱，宜印比为用神。'
  }
  
  return { geJu, shuoming }
}

// 详细分析八字（根据《渊海子平》）
// 《渊海子平》为八字命理之祖，由宋代徐子平所著，奠定了子平术的基础
function analyzeBaZiDetailed(
  dayGan: string,
  monthGan: string,
  monthZhi: string,
  allGans: string[],
  allZhis: string[],
  wuxingCount: Record<string, number>,
  pillars: ReturnType<typeof computeBaziPillars>
): BaZiResult['detailedAnalysis'] {
  const riZhuInfo = RIZHU_TEDIAN[dayGan]
  const riZhu =
    `日主${dayGan}（${riZhuInfo.xingge}）。${riZhuInfo.tedian}。` +
    `年柱纳音${pillars.naYin.year}，月柱${pillars.naYin.month}，日柱${pillars.naYin.day}，时柱${pillars.naYin.hour}。`

  const yuanhaiPoem = YUANHAI_LUNGAN[dayGan]

  const yueLing =
    `生于${monthZhi}月（月令），${YUELING_TEDIAN[monthZhi]}。` +
    `月干${monthGan}为${pillars.monthShiShenGan}，` +
    `年干${pillars.yearShiShenGan}，` +
    `时干${pillars.timeShiShenGan}。` +
    `《渊海子平》以月令为格局之源，须先看月令藏干透干与日主强弱。`
  
  // 3. 五行分析
  const wuxingList = Object.entries(wuxingCount)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}${v}个`)
    .join('、')
  const dayWuxing = TIANGAN_WUXING[dayGan]
  const wuxing = `五行分布：${wuxingList}。日主属${dayWuxing}，${wuxingCount[dayWuxing] >= 3 ? '五行偏旺' : wuxingCount[dayWuxing] <= 1 ? '五行偏弱' : '五行中和'}。`
  
  // 4. 十神分析
  const shiShenParts = [
    `年干${allGans[0]}(${pillars.yearShiShenGan})`,
    `月干${allGans[1]}(${pillars.monthShiShenGan})`,
    `日干${allGans[2]}(日主)`,
    `时干${allGans[3]}(${pillars.timeShiShenGan})`
  ]
  const shiShen = `十神配置：${shiShenParts.join('、')}。`
  
  // 5. 格局分析
  const { geJu: geJuName, shuoming: geJuShuoMing } = judgeGeJu(dayGan, monthZhi, allGans, allZhis)
  const geJu = `${geJuName}：${geJuShuoMing}`
  
  // 6. 运势分析
  let yunShi = ''
  const maxElement = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1])[0][0]
  const minElement = Object.entries(wuxingCount).sort((a, b) => a[1] - b[1])[0][0]
  
  if (wuxingCount[dayWuxing] >= 3) {
    yunShi = `日主强旺，行运喜财官食伤，忌印比。当前五行${maxElement}最旺，${minElement}最弱。`
  } else if (wuxingCount[dayWuxing] <= 1) {
    yunShi = `日主偏弱，行运喜印比生扶，忌财官食伤。当前五行${maxElement}最旺，${minElement}最弱。`
  } else {
    yunShi = `日主中和，行运较为平顺，可根据大运流年调整。当前五行${maxElement}偏旺，${minElement}偏弱。`
  }
  
  // 7. 建议
  const jianYi: string[] = []
  
  // 根据喜用神给出建议
  const xiYongShen = wuxingCount[dayWuxing] >= 3 ? 
    (dayWuxing === '木' ? '金' : dayWuxing === '火' ? '水' : dayWuxing === '土' ? '木' : dayWuxing === '金' ? '火' : '土') :
    (dayWuxing === '木' ? '水' : dayWuxing === '火' ? '木' : dayWuxing === '土' ? '火' : dayWuxing === '金' ? '土' : '金')
  
  jianYi.push(`喜用神为${xiYongShen}，日常生活中可多接触${xiYongShen}属性的事物。`)
  
  // 颜色建议
  const colorMap: Record<string, string> = {
    '木': '绿色、青色',
    '火': '红色、紫色',
    '土': '黄色、棕色',
    '金': '白色、金色',
    '水': '黑色、蓝色'
  }
  jianYi.push(`幸运颜色：${colorMap[xiYongShen]}，可在衣着、装饰中多用。`)
  
  // 方位建议
  const directionMap: Record<string, string> = {
    '木': '东方',
    '火': '南方',
    '土': '中央',
    '金': '西方',
    '水': '北方'
  }
    jianYi.push(`有利方位：${directionMap[xiYongShen]}，发展事业或居住可考虑此方向。`)
  
  // 职业建议
  const careerMap: Record<string, string> = {
    '木': '教育、文化、出版、园艺、服装',
    '火': '电子、能源、餐饮、演艺、美容',
    '土': '房地产、建筑、农业、矿产、仓储',
    '金': '金融、机械、汽车、五金、法律',
    '水': '物流、旅游、贸易、传媒、咨询'
  }
  jianYi.push(`适合行业：${careerMap[xiYongShen]}等相关领域。`)
  
  // 健康建议
  const healthMap: Record<string, string> = {
    '木': '肝胆、眼睛、筋骨',
    '火': '心脏、血液、小肠',
    '土': '脾胃、肌肉、消化系统',
    '金': '肺、大肠、呼吸系统',
    '水': '肾、膀胱、泌尿系统'
  }
  const weakElement = Object.entries(wuxingCount).sort((a, b) => a[1] - b[1])[0][0]
  jianYi.push(`健康注意：${healthMap[weakElement]}方面需多加保养。`)
  
  // 性格建议
  if (geJuName.includes('官')) {
    jianYi.push('性格建议：为人正直，有责任感，但不宜过于拘谨，要学会变通。')
  } else if (geJuName.includes('杀')) {
    jianYi.push('性格建议：有魄力有决断，但要注意控制脾气，避免冲动。')
  } else if (geJuName.includes('印')) {
    jianYi.push('性格建议：心地善良，有学识，但要增强独立性，减少依赖。')
  } else if (geJuName.includes('食') || geJuName.includes('伤')) {
    jianYi.push('性格建议：才华横溢，表达能力强，但要收敛傲气，尊重他人。')
  } else if (geJuName.includes('财')) {
    jianYi.push('性格建议：务实重利，善于理财，但要注意精神追求，不要过于物质。')
  }
  
  return {
    riZhu,
    yuanhaiPoem,
    yueLing,
    wuXing: wuxing,
    shiShen,
    geJu,
    yunShi,
    jianYi
  }
}

// 《滴天髓》分析函数
function analyzeDiTianSui(
  dayGan: string,
  monthGan: string,
  monthZhi: string,
  allGans: string[],
  allZhis: string[],
  wuxingCount: Record<string, number>,
  pillars: ReturnType<typeof computeBaziPillars>
): BaZiResult['ditianSuiAnalysis'] {
  
  // 1. 通神论
  const tongshen = DI_TIAN_SUI_TONGSHEN[dayGan]
  
  // 2. 性情论
  const xingqing = DI_TIAN_SUI_XINGQING[dayGan]
  
  // 3. 格局论
  const monthCanggan = DIZHI_CANGGAN[monthZhi]
  const touChu = allGans.filter(gan => monthCanggan.includes(gan))
  
  let geju = ''
  if (touChu.length > 0) {
    const firstTouChu = touChu[0]
    const shiShenName = SHISHEN[dayGan][TIANGAN.indexOf(firstTouChu)]
    geju = DI_TIAN_SUI_GEJU[shiShenName] || '需结合整体格局综合判断。'
  } else {
    geju = '月令不透，格局需结合全局五行力量综合判断。'
  }
  
  // 4. 运势论（根据《滴天髓》"通神论"思想）
  const dayWuxing = TIANGAN_WUXING[dayGan]
  const maxElement = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1])[0][0]
  const minElement = Object.entries(wuxingCount).sort((a, b) => a[1] - b[1])[0][0]
  
  let yunshi = ''
  if (wuxingCount[dayWuxing] >= 3) {
    // 日主强旺
    yunshi = `日主${dayGan}(${dayWuxing})强旺，《滴天髓》云："强得宜泄，弱得宜生。" 此造需取克泄耗之神为用。当前五行${maxElement}最旺，${minElement}最弱。行运宜走${minElement}运以平衡格局。`
  } else if (wuxingCount[dayWuxing] <= 1) {
    // 日主衰弱
    yunshi = `日主${dayGan}(${dayWuxing})衰弱，《滴天髓》云："真神得用，假神休咎。" 此造需取生扶之神为用。当前五行${maxElement}最旺，${minElement}最弱。行运宜走${dayWuxing}之生助运。`
  } else {
    // 日主中和
    yunshi = `日主${dayGan}(${dayWuxing})中和，《滴天髓》云："中和为贵，偏枯为病。" 此造格局平衡，行运以顺势为宜。当前五行${maxElement}偏旺，${minElement}偏弱，需注意流年引发的失衡。`
  }
  
  // 5. 总论
  let zonglun = ''
  const monthWuxing = DIZHI_WUXING[monthZhi]
  
  if (monthWuxing === dayWuxing) {
    zonglun =
      `【《滴天髓》总论】\n\n日主${dayGan}生于${monthZhi}月，得令而旺。${xingqing.pos}。\n\n` +
      `《滴天髓》云："得时得地，不可不辨。" 此造得令，根基稳固，如能得用神相济，可成事业。` +
      `需注意：${xingqing.neg}。\n\n格局：${geju.split('。')[0]}。\n\n` +
      `大运：${pillars.qiYun.description}\n\n行运：${yunshi.split('。')[0]}。`
  } else {
    const monthGanWuXing = TIANGAN_WUXING[monthGan]
    
    if (monthGanWuXing === dayWuxing) {
      zonglun = `【《滴天髓》总论】\n\n日主${dayGan}生于${monthZhi}月，月干${monthGan}生扶日主，得势而强。${xingqing.pos}。\n\n《滴天髓》云："天覆地载，万物悉备。" 此造得天时地利，若再得人和，必能成就一番事业。需注意修持：${xingqing.neg}。\n\n格局方面${geju.split('。')[0]}。\n\n行运之道：${yunshi.split('。')[0]}。`
    } else {
      zonglun = `【《滴天髓》总论】\n\n日主${dayGan}生于${monthZhi}月，月干${monthGan}(${monthGanWuXing})与日主${dayGan}(${dayWuxing})相战。${xingqing.pos}。\n\n《滴天髓》云："战则不足，和则有余。" 此造需调和五行，以求得中和之道。性格上需注意：${xingqing.neg}。\n\n格局方面${geju.split('。')[0]}。\n\n行运之道：${yunshi.split('。')[0]}。`
    }
  }
  
  return {
    tongshen,
    xingqing,
    geju,
    yunshi,
    zonglun
  }
}