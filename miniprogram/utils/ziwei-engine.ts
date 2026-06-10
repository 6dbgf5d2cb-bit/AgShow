/**
 * 紫微斗数排盘引擎（依《紫微斗数全书》安星，典籍分析见 ziwei-classics）
 */
import { detectPatterns } from './ziwei-patterns'
import { analyzeZiweiClassics, type ZiweiClassicsBundle } from './ziwei-classics'
import type { PatternResult } from './ziwei-patterns'
import {
  type PalaceName,
  type StarSlot,
  PALACE_BRANCHES,
  placeMajorStars,
  placeMinorStars,
  mergeStarPalaces,
  getSoulAndBody,
  getPalaceNames,
  getPalaceGanZhi,
  getFiveElementsClass,
  getZiweiTianfuIndex,
  getDaXian
} from './ziwei-stars'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solar, Lunar } = require('./vendor/lunar.js') as {
  Solar: {
    fromYmdHms: (
      y: number,
      m: number,
      d: number,
      h: number,
      mi: number,
      s: number
    ) => { getLunar: () => LunarDetail }
  }
  Lunar: {
    fromYmdHms: (
      y: number,
      m: number,
      d: number,
      h: number,
      mi: number,
      s: number
    ) => LunarDetail
  }
}

interface LunarDetail {
  getYear: () => number
  getMonth: () => number
  getDay: () => number
  getMonthInChinese: () => string
  getDayInChinese: () => string
  getYearGan: () => string
  getYearZhi: () => string
  getTimeZhi: () => string
  getTimeZhiIndex: () => number
  getTimeInGanZhi: () => string
  getSolar: () => { getYear: () => number; getMonth: () => number; getDay: () => number }
}

export interface ZiweiPalaceView {
  index: number
  branch: string
  name: PalaceName
  gan: string
  zhi: string
  ganZhi: string
  isSoul: boolean
  isBody: boolean
  majorStars: StarSlot[]
  minorStars: StarSlot[]
  starLines: string[]
}

export interface ZiweiResult {
  name: string
  gender: 'male' | 'female'
  genderLabel: string
  originalCalendarType: 'solar' | 'lunar'
  originalDate: string
  originalTime: string
  lunarDate: string
  solarDate: string
  timeZhi: string
  timeGanZhi: string
  yearGan: string
  yearZhi: string
  fiveElementsClass: string
  soulPalaceName: PalaceName
  bodyPalaceName: PalaceName
  palaces: ZiweiPalaceView[]
  patterns: PatternResult[]
  classics: ZiweiClassicsBundle
  daXian: {
    ageRange: string
    palaceName: PalaceName
    gan: string
    zhi: string
    ganZhi: string
  }[]
  chartNote: string
}

function parseBirthTime(time: string): { hour: number; minute: number } {
  const parts = time.split(':')
  const hour = parseInt(parts[0], 10)
  const minute = parseInt(parts[1] || '0', 10)
  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    throw new Error('出生时间格式不正确')
  }
  if (Number.isNaN(minute) || minute < 0 || minute > 59) {
    throw new Error('出生时间格式不正确')
  }
  return { hour, minute }
}

function formatStarLine(s: StarSlot): string {
  let t = s.name
  if (s.brightness) t += `·${s.brightness}`
  if (s.mutagen) t += `·化${s.mutagen}`
  return t
}

function resolveLunarFromInput(
  birthDate: string,
  birthTime: string,
  calendarType: 'solar' | 'lunar'
): {
  lunar: LunarDetail
  solarYear: number
  solarMonth: number
  solarDay: number
  lunarYear: number
  lunarMonth: number
  lunarDay: number
} {
  const { hour, minute } = parseBirthTime(birthTime)
  const dateParts = birthDate.split('-').map((p) => parseInt(p, 10))
  if (dateParts.length < 3 || dateParts.some((n) => Number.isNaN(n))) {
    throw new Error('出生日期格式不正确')
  }

  let lunarApi: LunarDetail
  let solarYear: number
  let solarMonth: number
  let solarDay: number

  if (calendarType === 'lunar') {
    const [ly, lm, ld] = dateParts
    lunarApi = Lunar.fromYmdHms(ly, lm, ld, hour, minute, 0)
    const solar = lunarApi.getSolar()
    solarYear = solar.getYear()
    solarMonth = solar.getMonth()
    solarDay = solar.getDay()
  } else {
    const [sy, sm, sd] = dateParts
    solarYear = sy
    solarMonth = sm
    solarDay = sd
    const solarObj = Solar.fromYmdHms(sy, sm, sd, hour, minute, 0)
    lunarApi = solarObj.getLunar()
  }

  return {
    lunar: lunarApi,
    solarYear,
    solarMonth,
    solarDay,
    lunarYear: lunarApi.getYear(),
    lunarMonth: lunarApi.getMonth(),
    lunarDay: lunarApi.getDay()
  }
}

export async function generateZiwei(
  name: string,
  birthDate: string,
  birthTime: string,
  gender: string,
  calendarType: string = 'solar'
): Promise<ZiweiResult> {
  const cal = calendarType === 'lunar' ? 'lunar' : 'solar'
  const g = gender === 'female' ? 'female' : 'male'

  const { lunar, solarYear, solarMonth, solarDay, lunarYear, lunarMonth, lunarDay } =
    resolveLunarFromInput(birthDate, birthTime, cal)

  const yearGan = lunar.getYearGan()
  const yearZhi = lunar.getYearZhi()
  const timeBranchIndex = lunar.getTimeZhiIndex()
  const timeZhi = lunar.getTimeZhi()
  const timeGanZhi = lunar.getTimeInGanZhi()

  const { soulIndex, bodyIndex } = getSoulAndBody(lunarMonth, timeBranchIndex)
  const palaceNames = getPalaceNames(soulIndex)
  const palaceGanZhi = getPalaceGanZhi(soulIndex, yearGan)
  const mingGZ = palaceGanZhi[soulIndex]
  const fiveElementsClass = getFiveElementsClass(mingGZ.gan, mingGZ.zhi)

  const { ziweiIndex, tianfuIndex } = getZiweiTianfuIndex(lunarDay, fiveElementsClass)
  const majorPalaces = placeMajorStars(ziweiIndex, tianfuIndex, yearGan)
  const minorPalaces = placeMinorStars(yearGan, yearZhi, lunarMonth, timeBranchIndex, yearGan)
  const merged = mergeStarPalaces(majorPalaces, minorPalaces)

  const palaceData = palaceNames.map((pName, i) => ({
    name: pName,
    index: i,
    majorStars: merged[i].filter((s) => s.type === 'major'),
    minorStars: merged[i].filter((s) => s.type !== 'major')
  }))

  const patterns = detectPatterns(palaceData)
  const daXianRaw = getDaXian(soulIndex, yearGan, yearZhi, g, fiveElementsClass, palaceNames)
  const daXian = daXianRaw.map((d) => ({
    ageRange: d.ageRange,
    palaceName: d.palaceName,
    gan: d.gan,
    zhi: d.zhi,
    ganZhi: `${d.gan}${d.zhi}`
  }))

  const classics = analyzeZiweiClassics({
    palaces: palaceData,
    patterns,
    yearGan,
    fiveElementsClass,
    gender: g,
    daXian: daXianRaw
  })

  const palaces: ZiweiPalaceView[] = palaceNames.map((pName, i) => {
    const gz = palaceGanZhi[i]
    const stars = merged[i]
    const majorStars = stars.filter((s) => s.type === 'major')
    const minorOnly = stars.filter((s) => s.type !== 'major')
    return {
      index: i,
      branch: PALACE_BRANCHES[i],
      name: pName,
      gan: gz.gan,
      zhi: gz.zhi,
      ganZhi: `${gz.gan}${gz.zhi}`,
      isSoul: i === soulIndex,
      isBody: i === bodyIndex,
      majorStars,
      minorStars: minorOnly,
      starLines: stars.map(formatStarLine)
    }
  })

  const lunarDate = `${lunarYear}年${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`
  const solarDate = `${solarYear}年${solarMonth}月${solarDay}日`

  return {
    name: name.trim(),
    gender: g,
    genderLabel: g === 'male' ? '男' : '女',
    originalCalendarType: cal,
    originalDate: birthDate,
    originalTime: birthTime,
    lunarDate,
    solarDate,
    timeZhi,
    timeGanZhi,
    yearGan,
    yearZhi,
    fiveElementsClass,
    soulPalaceName: palaceNames[soulIndex],
    bodyPalaceName: palaceNames[bodyIndex],
    palaces,
    patterns,
    classics,
    daXian,
    chartNote:
      cal === 'solar'
        ? `输入公历 ${birthDate} ${birthTime}，已换算农历 ${lunarDate} ${timeZhi}时排盘。`
        : `输入农历 ${birthDate} ${birthTime}，对应公历 ${solarDate}，${timeZhi}时排盘。`
  }
}
