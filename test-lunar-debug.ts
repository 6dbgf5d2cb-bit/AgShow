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

const year = 2007
const month = 12
const day = 12

const springMonth = Math.floor(140 / 100)
const springDay = 140 % 100

console.log(`2007年立春: ${springMonth}月${springDay}日`)
console.log(`从1月1日到立春的天数: ${dateToDays(year, springMonth, springDay)}`)
console.log(`从1月1日到${month}月${day}日的天数: ${dateToDays(year, month, day)}`)

const daysFromSpring = dateToDays(year, month, day) - dateToDays(year, springMonth, springDay)
console.log(`从立春到${month}月${day}日的天数: ${daysFromSpring}`)

const months2007 = [29,30,29,30,29,30,29,30,30,29,30,30]

let accumulated = 0
let lunarMonth = 1
for (let i = 0; i < months2007.length; i++) {
  const m = months2007[i]
  console.log(`正月${lunarMonth}: ${m}天, 累计: ${accumulated}`)
  if (accumulated + m > daysFromSpring) {
    console.log(`找到! 农历${lunarMonth}月${daysFromSpring - accumulated + 1}日`)
    break
  }
  accumulated += m
  lunarMonth++
}
