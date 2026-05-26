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

console.log(`测试日期: ${year}年${month}月${day}日`)
console.log(`是否闰年: ${(year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)}`)

const springMonth = 2
const springDay = 4

console.log(`\n2007年立春: ${springMonth}月${springDay}日`)
console.log(`从1月1日到立春: ${dateToDays(year, springMonth, springDay)}天`)
console.log(`从1月1日到测试日期: ${dateToDays(year, month, day)}天`)

const daysFromSpring = dateToDays(year, month, day) - dateToDays(year, springMonth, springDay)
console.log(`从立春到测试日期: ${daysFromSpring}天`)

console.log(`\n2007年农历月份天数:`)
const months2007 = [29,30,29,30,29,30,29,30,30,29,30,30]

let accumulated = 0
let lunarMonth = 1
for (let i = 0; i < months2007.length; i++) {
  const m = months2007[i]
  console.log(`农历${lunarMonth}月: ${m}天, 累计: ${accumulated}`)
  if (accumulated + m > daysFromSpring) {
    console.log(`\n计算结果: 农历${lunarMonth}月${daysFromSpring - accumulated + 1}日`)
    break
  }
  accumulated += m
  lunarMonth++
}

console.log(`\n根据寿星天文历，正确结果应该是: 丁亥年冬月初三`)
console.log(`\n问题分析:`)
console.log(`1. 当前算法假设"立春=正月初一"`)
console.log(`2. 但2007年正月初一是2月18日，立春是2月4日`)
console.log(`3. 从立春到正月初一有14天的差距`)
console.log(`4. 所以需要调整计算逻辑`)
