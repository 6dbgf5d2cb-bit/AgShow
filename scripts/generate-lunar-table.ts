/**
 * 生成阳历→农历对照表（Base64 压缩）
 * 运行: npm run generate:lunar-table
 */
import * as fs from 'fs'
import * as path from 'path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solar } = require('lunar-javascript') as {
  Solar: {
    fromYmd: (y: number, m: number, d: number) => {
      getLunar: () => { getYear: () => number; getMonth: () => number; getDay: () => number }
    }
  }
}

const JDN_ORIGIN = 2415021

function packLunar(y: number, m: number, d: number, leap: boolean): number {
  return ((y - 1900) << 17) | (leap ? 1 << 16 : 0) | (m << 8) | d
}

function toJulianDay(year: number, month: number, day: number): number {
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

function solarToDayIndex(year: number, month: number, day: number): number {
  return Math.round(toJulianDay(year, month, day) - JDN_ORIGIN)
}

const TEST_CASES = [
  { solar: [1976, 12, 19], lunar: [1976, 10, 29, false] },
  { solar: [2007, 12, 12], lunar: [2007, 11, 3, false] },
  { solar: [2024, 2, 10], lunar: [2024, 1, 1, false] },
  { solar: [2019, 2, 5], lunar: [2019, 1, 1, false] }
]

function main() {
  const endIndex = solarToDayIndex(2100, 12, 31)
  const uint32 = new Uint32Array(endIndex + 1)

  for (let i = 0; i <= endIndex; i++) {
    const jd = JDN_ORIGIN + i
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

    const lunar = Solar.fromYmd(year, month, day).getLunar()
    const lm = Math.abs(lunar.getMonth())
    uint32[i] = packLunar(lunar.getYear(), lm, lunar.getDay(), lunar.getMonth() < 0)
  }

  const b64 = Buffer.from(uint32.buffer).toString('base64')
  console.log(`天数 ${uint32.length}，Base64 ${(b64.length / 1024).toFixed(1)} KB`)

  for (const t of TEST_CASES) {
    const [sy, sm, sd] = t.solar
    const p = uint32[solarToDayIndex(sy, sm, sd)]
    const ly = 1900 + ((p >> 17) & 0xfff)
    const lm = (p >> 8) & 0xff
    const ld = p & 0xff
    const [ey, em, ed] = t.lunar
    console.log(`${ly === ey && lm === em && ld === ed ? '✓' : '✗'} ${sy}-${sm}-${sd} → ${ly}-${lm}-${ld}`)
  }

  const chunkLen = 76
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += chunkLen) {
    lines.push(b64.slice(i, i + chunkLen))
  }

  const content = `/**
 * 阳历→农历对照表（自动生成）
 * Uint32Array Base64，下标=距1900-01-01的天数
 */
export const SOLAR_TABLE_DAY_COUNT = ${uint32.length}

export const SOLAR_TABLE_B64 = [
${lines.map((l) => `  '${l}',`).join('\n')}
].join('')
`

  fs.writeFileSync(path.join(__dirname, '../miniprogram/utils/lunar-solar-table.ts'), content, 'utf8')
}

main()
