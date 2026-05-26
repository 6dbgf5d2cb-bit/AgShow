/**
 * 阳历/农历互转（单一对照表 Base64，主包约 400KB）
 * - 阳历→农历：O(1) 查表
 * - 农历→阳历：对照表线性匹配（单次提交可接受）
 */
import { SOLAR_TABLE_B64, SOLAR_TABLE_DAY_COUNT } from './lunar-solar-table'

export interface LunarCoreResult {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
}

export interface SolarCoreResult {
  year: number
  month: number
  day: number
}

export const SOLAR_TABLE_ORIGIN = { year: 1900, month: 1, day: 1 }
export const JDN_ORIGIN = 2415021

let solarTableCache: Uint32Array | null = null

function decodeSolarTable(): Uint32Array {
  if (solarTableCache) return solarTableCache
  let buf: ArrayBuffer
  if (typeof wx !== 'undefined' && wx.base64ToArrayBuffer) {
    buf = wx.base64ToArrayBuffer(SOLAR_TABLE_B64)
  } else {
    const nodeBuf = Buffer.from(SOLAR_TABLE_B64, 'base64')
    buf = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength)
  }
  solarTableCache = new Uint32Array(buf)
  return solarTableCache
}

export function packLunar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeapMonth: boolean): number {
  return (
    ((lunarYear - 1900) << 17) |
    (isLeapMonth ? 1 << 16 : 0) |
    (lunarMonth << 8) |
    lunarDay
  )
}

export function unpackLunar(packed: number): LunarCoreResult {
  return {
    lunarYear: 1900 + ((packed >> 17) & 0xfff),
    isLeapMonth: ((packed >> 16) & 1) === 1,
    lunarMonth: (packed >> 8) & 0xff,
    lunarDay: packed & 0xff
  }
}

export function toJulianDay(year: number, month: number, day: number): number {
  let y = year
  let m = month
  if (m <= 2) {
    y--
    m += 12
  }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5
}

export function fromJulianDay(jd: number): SolarCoreResult {
  const z = Math.floor(jd + 0.5)
  let a = z
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25)
    a = z + 1 + alpha - Math.floor(alpha / 4)
  }
  const b = a + 1524
  const c = Math.floor((b - 122.1) / 365.25)
  const d = Math.floor(365.25 * c)
  const e = Math.floor((b - d) / 30.6001)
  const day = b - d - Math.floor(30.6001 * e)
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715
  return { year, month, day }
}

export function solarToDayIndex(year: number, month: number, day: number): number {
  return Math.round(toJulianDay(year, month, day) - JDN_ORIGIN)
}

export function dayIndexToSolar(index: number): SolarCoreResult {
  return fromJulianDay(JDN_ORIGIN + index)
}

function assertSolarInRange(year: number, month: number, day: number): number {
  const idx = solarToDayIndex(year, month, day)
  if (idx < 0 || idx >= SOLAR_TABLE_DAY_COUNT) {
    throw new Error(`仅支持${SOLAR_TABLE_ORIGIN.year}-${2100}年范围内的日期`)
  }
  return idx
}

/** 公历 → 农历（查对照表） */
export function solarToLunarCore(year: number, month: number, day: number): LunarCoreResult {
  const idx = assertSolarInRange(year, month, day)
  const table = decodeSolarTable()
  return unpackLunar(table[idx])
}

/** 农历 → 公历（对照表反向匹配） */
export function lunarToSolarCore(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth = false
): SolarCoreResult {
  if (lunarDay < 1 || lunarDay > 30) throw new Error('农历日无效')

  const packed = packLunar(lunarYear, lunarMonth, lunarDay, isLeapMonth)
  const table = decodeSolarTable()

  for (let i = 0; i < table.length; i++) {
    if (table[i] === packed) {
      return dayIndexToSolar(i)
    }
  }

  throw new Error('农历日期不在对照表范围内')
}
