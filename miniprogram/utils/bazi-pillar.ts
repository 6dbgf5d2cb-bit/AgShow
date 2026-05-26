/**
 * 四柱排盘（子平术）：立春换年、节气换月、精确日柱时柱
 * 基于 lunar-javascript，与主流万年历一致
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solar } = require('./vendor/lunar.js') as {
  Solar: {
    fromYmdHms: (
      y: number,
      m: number,
      d: number,
      h: number,
      mi: number,
      s: number
    ) => {
      getLunar: () => {
        getEightChar: () => EightCharApi
        getYearInGanZhiExact: () => string
        getMonthInChinese: () => string
        getDayInChinese: () => string
      }
    }
  }
}

interface EightCharApi {
  getYear: () => string
  getMonth: () => string
  getDay: () => string
  getTime: () => string
  getYearNaYin: () => string
  getMonthNaYin: () => string
  getDayNaYin: () => string
  getTimeNaYin: () => string
  getYearShiShenGan: () => string
  getMonthShiShenGan: () => string
  getTimeShiShenGan: () => string
  getYearHideGan: () => string
  getMonthHideGan: () => string
  getDayHideGan: () => string
  getTimeHideGan: () => string
  getYun: (gender: number, sect?: number) => YunApi
}

interface YunApi {
  getStartYear: () => number
  getStartMonth: () => number
  getStartDay: () => number
  getStartSolar: () => { toYmd: () => string }
  isForward: () => boolean
  getDaYun: (n?: number) => DaYunApi[]
}

interface DaYunApi {
  getStartAge: () => number
  getEndAge: () => number
  getGanZhi: () => string
  getLiuNian: (n?: number) => { getYear: () => number; getGanZhi: () => string }[]
}

export interface PillarPair {
  gan: string
  zhi: string
  ganZhi: string
}

export interface NaYinSet {
  year: string
  month: string
  day: string
  hour: string
}

export interface DaYunPillar {
  startAge: number
  endAge: number
  gan: string
  zhi: string
  ganZhi: string
}

export interface LiuNianPillar {
  year: number
  gan: string
  zhi: string
  ganZhi: string
}

export interface BaziPillarResult {
  year: PillarPair
  month: PillarPair
  day: PillarPair
  hour: PillarPair
  naYin: NaYinSet
  yearShiShenGan: string
  monthShiShenGan: string
  timeShiShenGan: string
  qiYun: {
    startAgeYears: number
    startAgeMonths: number
    startAgeDays: number
    startSolarYmd: string
    forward: boolean
    description: string
  }
  daYun: DaYunPillar[]
  liuNian: LiuNianPillar[]
  /** 八字历法年（立春为界，非农历正月初一） */
  baziYearLabel: string
  /** 晚子时说明：23:00 仍按当日排日柱（子平常用法） */
  ziShiNote: string
}

function splitGanZhi(gz: string): PillarPair {
  if (!gz || gz.length < 2) {
    return { gan: '', zhi: '', ganZhi: gz || '' }
  }
  return { gan: gz[0], zhi: gz[1], ganZhi: gz }
}

/** 时辰起始小时 → 排盘用时辰（取该时辰中点） */
export function hourForPillar(startHour: number): { hour: number; minute: number; ziShiNote: string } {
  if (startHour === 23) {
    return {
      hour: 23,
      minute: 30,
      ziShiNote: '子时（23:00–01:00）：按子平术以当日排日柱；若您生于 00:00 之后，日柱可能进一日，可改选丑时核对。'
    }
  }
  const map: Record<number, number> = {
    1: 1,
    3: 3,
    5: 5,
    7: 7,
    9: 9,
    11: 11,
    13: 13,
    15: 15,
    17: 17,
    19: 19,
    21: 21
  }
  const h = map[startHour] ?? 12
  return { hour: h, minute: 0, ziShiNote: '' }
}

/**
 * @param genderCode lunar-javascript：1=男，0=女
 */
export function computeBaziPillars(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  startHour: number,
  genderCode: 0 | 1
): BaziPillarResult {
  const { hour, minute, ziShiNote } = hourForPillar(startHour)
  const solar = Solar.fromYmdHms(solarYear, solarMonth, solarDay, hour, minute, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const year = splitGanZhi(ec.getYear())
  const month = splitGanZhi(ec.getMonth())
  const day = splitGanZhi(ec.getDay())
  const hourP = splitGanZhi(ec.getTime())

  const yun = ec.getYun(genderCode, 1)
  const startAgeYears = yun.getStartYear()
  const startAgeMonths = yun.getStartMonth()
  const startAgeDays = yun.getStartDay()
  const startSolarYmd = yun.getStartSolar().toYmd()
  const forward = yun.isForward()

  const qiYunDesc =
    `依《渊海子平》大运法：${genderCode === 1 ? '男命' : '女命'}，` +
    `${forward ? '阳年顺行' : '阴年逆行'}。` +
    `起运 ${startAgeYears} 年 ${startAgeMonths} 月 ${startAgeDays} 天，` +
    `约于公历 ${startSolarYmd} 交运。`

  const rawDaYun = yun.getDaYun(11)
  const daYun: DaYunPillar[] = []
  for (let i = 1; i < rawDaYun.length && daYun.length < 10; i++) {
    const dy = rawDaYun[i]
    const gz = dy.getGanZhi()
    if (!gz) continue
    const p = splitGanZhi(gz)
    daYun.push({
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      gan: p.gan,
      zhi: p.zhi,
      ganZhi: gz
    })
  }

  const liuNian: LiuNianPillar[] = []
  const currentDy = rawDaYun.find((d) => {
    const now = new Date().getFullYear()
    return d.getStartYear() <= now && d.getEndYear() >= now
  }) || rawDaYun[1]

  if (currentDy) {
    const lns = currentDy.getLiuNian(10)
    for (const ln of lns) {
      const gz = ln.getGanZhi()
      const p = splitGanZhi(gz)
      liuNian.push({
        year: ln.getYear(),
        gan: p.gan,
        zhi: p.zhi,
        ganZhi: gz
      })
    }
  }

  return {
    year,
    month,
    day,
    hour: hourP,
    naYin: {
      year: ec.getYearNaYin(),
      month: ec.getMonthNaYin(),
      day: ec.getDayNaYin(),
      hour: ec.getTimeNaYin()
    },
    yearShiShenGan: ec.getYearShiShenGan(),
    monthShiShenGan: ec.getMonthShiShenGan(),
    timeShiShenGan: ec.getTimeShiShenGan(),
    qiYun: {
      startAgeYears,
      startAgeMonths,
      startAgeDays,
      startSolarYmd,
      forward,
      description: qiYunDesc
    },
    daYun,
    liuNian,
    baziYearLabel: lunar.getYearInGanZhiExact(),
    ziShiNote
  }
}
