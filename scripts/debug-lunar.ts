import { dayIndexToSolar, solarToDayIndex, solarToLunarCore } from '../miniprogram/utils/lunar-calendar-core'

const end = solarToDayIndex(2100, 12, 31)
let firstFail = -1
for (let i = 0; i <= end; i++) {
  const s = dayIndexToSolar(i)
  try {
    solarToLunarCore(s.year, s.month, s.day)
  } catch (e: any) {
    if (firstFail < 0) {
      firstFail = i
      console.log('first fail index', i, s, e.message)
    }
  }
}
console.log('total days', end + 1, 'first fail', firstFail)
