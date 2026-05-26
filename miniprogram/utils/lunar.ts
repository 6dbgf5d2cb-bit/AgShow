export interface LunarDate {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
  solarYear: number
  solarMonth: number
  solarDay: number
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string
  zodiac: string
  term?: string
}

export interface SolarDate {
  year: number
  month: number
  day: number
}

export interface HuangLiDay {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  solarYear: number
  solarMonth: number
  solarDay: number
  isLeapMonth: boolean
  yearGanZhi: string
  monthGanZhi: string
  dayGanZhi: string
  zodiac: string
  term?: string
  yi: string[]
  ji: string[]
  chengGong?: string
  yiShen?: string
  xiongShen?: string
  chongSha?: string
  suiXiang?: string
}

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const LUNAR_DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                   '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                   '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

const TERMS = ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
               '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
               '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
               '立冬', '小雪', '大雪', '冬至', '小寒', '大寒']

import {
  solarToLunarCore,
  lunarToSolarCore
} from './lunar-calendar-core'


const HUANGLI_YI = ['祭祀', '祈福', '嫁娶', '纳采', '入宅', '安床', '修造', '动土', '出行', '开市', '交易', '立券', '纳财', '赴任', '求医', '开光', '解除', '安葬', '破土', '移柩', '启攒', '订盟', '纳婿', '裁衣', '合帐', '冠笄', '生子', '求嗣', '上梁', '竖柱', '纳畜', '牧养', '会亲友', '开仓', '放水', '出火', '纳福']
const HUANGLI_JI = ['祭祀', '祈福', '嫁娶', '纳采', '入宅', '安床', '修造', '动土', '出行', '开市', '交易', '立券', '纳财', '赴任', '求医', '开光', '解除', '安葬', '破土', '移柩', '启攒', '订盟', '纳婿', '裁衣', '合帐', '冠笄', '生子', '求嗣', '上梁', '竖柱', '纳畜', '牧养', '会亲友', '开仓', '放水', '出火', '纳福']

const CHONG_SHA_MAP: Record<string, string> = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
  '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
}

const YI_SHEN_LIST = ['青龙', '明堂', '金匮', '天德', '玉堂', '司命']
const XIONG_SHEN_LIST = ['天刑', '朱雀', '白虎', '天牢', '玄武', '勾陈']

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

const ZHI_SHEN: Record<string, { yi: string[]; ji: string[] }> = {
  '子': { yi: ['祭祀', '祈福', '嫁娶', '出行', '求医'], ji: ['动土', '破土', '安葬'] },
  '丑': { yi: ['祭祀', '修造', '入宅', '纳财', '开市'], ji: ['嫁娶', '移柩', '启攒'] },
  '寅': { yi: ['祭祀', '祈福', '嫁娶', '纳采', '开市'], ji: ['动土', '破土', '安葬'] },
  '卯': { yi: ['祭祀', '出行', '修造', '入宅', '安床'], ji: ['嫁娶', '安葬', '破土'] },
  '辰': { yi: ['祭祀', '祈福', '修造', '动土', '竖柱'], ji: ['嫁娶', '移柩', '出行'] },
  '巳': { yi: ['祭祀', '祈福', '交易', '立券', '纳财'], ji: ['嫁娶', '入宅', '安葬'] },
  '午': { yi: ['祭祀', '祈福', '嫁娶', '纳采', '求医'], ji: ['动土', '破土', '修造'] },
  '未': { yi: ['祭祀', '修造', '入宅', '开市', '纳财'], ji: ['嫁娶', '移柩', '破土'] },
  '申': { yi: ['祭祀', '祈福', '出行', '交易', '立券'], ji: ['嫁娶', '动土', '安葬'] },
  '酉': { yi: ['祭祀', '祈福', '修造', '入宅', '安床'], ji: ['嫁娶', '破土', '移柩'] },
  '戌': { yi: ['祭祀', '祈福', '修造', '动土', '竖柱'], ji: ['嫁娶', '出行', '安葬'] },
  '亥': { yi: ['祭祀', '祈福', '嫁娶', '纳采', '求医'], ji: ['动土', '破土', '修造'] }
}

const GAN_SHEN: Record<string, { yi: string[]; ji: string[] }> = {
  '甲': { yi: ['祭祀', '祈福', '嫁娶', '纳采'], ji: ['动土', '破土'] },
  '乙': { yi: ['祭祀', '修造', '入宅', '安床'], ji: ['嫁娶', '安葬'] },
  '丙': { yi: ['祭祀', '祈福', '开市', '交易'], ji: ['入宅', '移柩'] },
  '丁': { yi: ['祭祀', '祈福', '求医', '解除'], ji: ['修造', '动土'] },
  '戊': { yi: ['祭祀', '修造', '动土', '竖柱'], ji: ['嫁娶', '出行'] },
  '己': { yi: ['祭祀', '祈福', '纳财', '开市'], ji: ['安葬', '破土'] },
  '庚': { yi: ['祭祀', '出行', '交易', '立券'], ji: ['嫁娶', '入宅'] },
  '辛': { yi: ['祭祀', '祈福', '修造', '安床'], ji: ['动土', '移柩'] },
  '壬': { yi: ['祭祀', '祈福', '嫁娶', '求医'], ji: ['修造', '破土'] },
  '癸': { yi: ['祭祀', '入宅', '纳财', '开市'], ji: ['动土', '安葬'] }
}

function calculateYearGanZhi(year: number): string {
  const tianGanIndex = (year - 4) % 10
  const diZhiIndex = (year - 4) % 12
  return TIANGAN[tianGanIndex] + DIZHI[diZhiIndex]
}

function calculateMonthGanZhi(year: number, month: number): string {
  const yearGanIndex = (year - 4) % 10
  let monthGanIndex = (yearGanIndex * 2 + month) % 10
  if (monthGanIndex < 0) monthGanIndex += 10
  
  let monthZhiIndex = (month + 1) % 12
  if (monthZhiIndex === 0) monthZhiIndex = 12
  monthZhiIndex -= 1
  
  return TIANGAN[monthGanIndex] + DIZHI[monthZhiIndex]
}

function calculateDayGanZhi(year: number, month: number, day: number): string {
  const century = Math.floor(year / 100)
  const yearInCentury = year % 100
  
  let ganIndex: number
  let zhiIndex: number
  
  if (century === 20) {
    ganIndex = (yearInCentury * 5 + Math.floor(yearInCentury / 4) + day + (month * 2 - 1) + 3) % 10
    zhiIndex = (yearInCentury * 5 + Math.floor(yearInCentury / 4) + day + (month * 2 - 1) + 3) % 12
  } else if (century === 21) {
    ganIndex = (yearInCentury * 5 + Math.floor(yearInCentury / 4) + day + (month * 2 - 1) + 8) % 10
    zhiIndex = (yearInCentury * 5 + Math.floor(yearInCentury / 4) + day + (month * 2 - 1) + 8) % 12
  } else {
    ganIndex = ((year * 5 + Math.floor(year / 4) + day + (month * 2 - 1)) % 10 + 10) % 10
    zhiIndex = ((year * 5 + Math.floor(year / 4) + day + (month * 2 - 1)) % 12 + 12) % 12
  }
  
  return TIANGAN[ganIndex] + DIZHI[zhiIndex]
}

function calculateZodiac(year: number): string {
  const diZhiIndex = (year - 4) % 12
  return ZODIAC[diZhiIndex]
}

function calculateTerm(year: number, month: number, day: number): string | undefined {
  const baseTermDays = [
    [5, 20], [4, 19], [6, 21], [5, 20], [6, 21], [7, 23],
    [8, 23], [8, 23], [9, 23], [8, 24], [8, 22], [7, 22]
  ]
  
  const leapOffset = year % 4
  const offset = leapOffset === 0 ? 1 : 0
  
  const monthIndex = month - 1
  if (monthIndex < 0 || monthIndex >= 12) return undefined
  
  const termDay1 = baseTermDays[monthIndex][0] + (monthIndex === 1 ? offset : 0)
  const termDay2 = baseTermDays[monthIndex][1]
  
  if (day === termDay1) {
    return TERMS[monthIndex * 2]
  }
  if (day === termDay2) {
    return TERMS[monthIndex * 2 + 1]
  }
  
  return undefined
}

function calculateSuiXiang(dayGan: string, dayZhi: string): string {
  const ganWuxing = TIANGAN_WUXING[dayGan]
  const zhiWuxing = DIZHI_WUXING[dayZhi]
  
  if (ganWuxing === zhiWuxing) {
    return '比肩'
  } else if (
    (ganWuxing === '木' && zhiWuxing === '火') ||
    (ganWuxing === '火' && zhiWuxing === '土') ||
    (ganWuxing === '土' && zhiWuxing === '金') ||
    (ganWuxing === '金' && zhiWuxing === '水') ||
    (ganWuxing === '水' && zhiWuxing === '木')
  ) {
    return '食神'
  } else {
    return '伤官'
  }
}

function generateHuangLiInfo(dayGanZhi: string): Partial<HuangLiDay> {
  const dayGan = dayGanZhi[0]
  const dayZhi = dayGanZhi[1]
  const zhiIndex = DIZHI.indexOf(dayZhi)
  const yiIndex = zhiIndex % YI_SHEN_LIST.length
  const xiongIndex = (zhiIndex + 3) % XIONG_SHEN_LIST.length
  
  const zhiShen = ZHI_SHEN[dayZhi] || { yi: [], ji: [] }
  const ganShen = GAN_SHEN[dayGan] || { yi: [], ji: [] }
  
  const yiFromZhi = [...zhiShen.yi]
  const yiFromGan = ganShen.yi.filter(item => !yiFromZhi.includes(item))
  const yiCombined = [...new Set([...yiFromZhi, ...yiFromGan])]
  
  const jiFromZhi = [...zhiShen.ji]
  const jiFromGan = ganShen.ji.filter(item => !jiFromZhi.includes(item))
  const jiCombined = [...new Set([...jiFromZhi, ...jiFromGan])]
  
  const yiList = yiCombined.length > 0 ? yiCombined.slice(0, 5) : 
                [...HUANGLI_YI].sort(() => Math.random() - 0.5).slice(0, 5)
  const jiList = jiCombined.length > 0 ? jiCombined.slice(0, 5) : 
                [...HUANGLI_JI].filter(item => !yiList.includes(item))
                               .sort(() => Math.random() - 0.5).slice(0, 5)
  
  const chongSha = CHONG_SHA_MAP[dayZhi] || ''
  const suiXiang = calculateSuiXiang(dayGan, dayZhi)
  
  return {
    yi: yiList,
    ji: jiList,
    chengGong: YI_SHEN_LIST[yiIndex],
    yiShen: YI_SHEN_LIST[yiIndex],
    xiongShen: XIONG_SHEN_LIST[xiongIndex],
    chongSha: chongSha ? `冲${ZODIAC[DIZHI.indexOf(chongSha)]}(${chongSha})` : '',
    suiXiang: suiXiang
  }
}

/** 公历转农历（查寿星天文历对照表） */
export function solarToLunarLocal(year: number, month: number, day: number): LunarDate {
  const core = solarToLunarCore(year, month, day)
  const yearGanZhi = calculateYearGanZhi(core.lunarYear)
  const monthGanZhi = calculateMonthGanZhi(core.lunarYear, core.lunarMonth)
  const dayGanZhi = calculateDayGanZhi(year, month, day)
  const zodiac = calculateZodiac(core.lunarYear)
  const term = calculateTerm(year, month, day)

  return {
    lunarYear: core.lunarYear,
    lunarMonth: core.lunarMonth,
    lunarDay: core.lunarDay,
    isLeapMonth: core.isLeapMonth,
    solarYear: year,
    solarMonth: month,
    solarDay: day,
    yearGanZhi,
    monthGanZhi,
    dayGanZhi,
    zodiac,
    term
  }
}

/** 农历转公历（查对照表反向索引） */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth = false
): SolarDate {
  return lunarToSolarCore(lunarYear, lunarMonth, lunarDay, isLeapMonth)
}

export function formatSolarDate(solar: SolarDate): string {
  return `${solar.year}年${solar.month}月${solar.day}日`
}

export async function solarToLunar(year: number, month: number, day: number): Promise<HuangLiDay> {
  try {
    const lunar = solarToLunarLocal(year, month, day)
    const huangLiInfo = generateHuangLiInfo(lunar.dayGanZhi)
    
    return {
      ...lunar,
      ...huangLiInfo,
      yi: huangLiInfo.yi || [],
      ji: huangLiInfo.ji || []
    } as HuangLiDay
  } catch (error) {
    console.error('农历转换失败:', error)
    const lunar = solarToLunarLocal(year, month, day)
    const huangLiInfo = generateHuangLiInfo(lunar.dayGanZhi)
    
    return {
      ...lunar,
      ...huangLiInfo,
      yi: huangLiInfo.yi || [],
      ji: huangLiInfo.ji || []
    } as HuangLiDay
  }
}

export function formatLunarDate(lunar: LunarDate): string {
  const yearStr = `${lunar.lunarYear}年(${lunar.zodiac})`
  const monthStr = lunar.isLeapMonth ? `闰${LUNAR_MONTHS[lunar.lunarMonth - 1]}月` : `${LUNAR_MONTHS[lunar.lunarMonth - 1]}月`
  const dayStr = LUNAR_DAYS[lunar.lunarDay - 1]

  return `${yearStr}${monthStr}${dayStr}`
}
