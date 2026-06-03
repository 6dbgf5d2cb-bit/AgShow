/** 根据当前页面路径推断底部导航高亮项 */
export function inferTabActive(route: string): string {
  if (!route) return ''
  if (route.includes('travellog')) return 'travellog'
  if (route.includes('travel')) return 'travel'
  if (route.includes('health')) return 'health'
  if (
    route.includes('science') ||
    route.includes('ziwei') ||
    route.includes('liuyao') ||
    route.includes('fengshui')
  ) {
    return 'science'
  }
  if (route.includes('index')) return ''
  return 'member'
}
