import { getUserById, MemberLevel, User } from './user'
import {
  isContentApiEnabled,
  fetchRemoteRoutes,
  pushRouteToRemote,
  mergeContentItem
} from './content-api'

export interface RouteParticipant {
  userId: string
  userName: string
  phone: string
  avatarUrl: string
  memberLevel: MemberLevel
  signUpTime: number
}

export interface TravelRoute {
  routeId: string
  title: string
  description: string
  startPoint: string
  endPoint: string
  waypoints: string[]
  distance: number
  duration: number
  coverImage: string
  images: string[]
  publisherId: string
  publishTime: number
  updateTime: number
  adminManagedAt?: number
  status: 'active' | 'inactive' | 'deleted'
  viewCount: number
  likeCount: number
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  bestSeason: string[]
  tips: string
  maxParticipants: number
  participants: RouteParticipant[]
}

const TRAVEL_ROUTES_KEY = 'member_travel_routes'

function generateRouteId(): string {
  return 'TR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

const DEFAULT_ROUTES: TravelRoute[] = [
  {
    routeId: 'TRDEFAULT001',
    title: '云南大理自驾游',
    description: '穿越洱海，感受大理的风花雪月。沿途风景秀丽，适合摄影爱好者。途经古城、喜洲古镇、双廊等景点。',
    startPoint: '昆明',
    endPoint: '大理',
    waypoints: ['楚雄', '祥云'],
    distance: 320,
    duration: 5,
    coverImage: '',
    images: [],
    publisherId: 'UADMIN000001',
    publishTime: Date.now() - 86400000 * 30,
    updateTime: Date.now() - 86400000 * 30,
    status: 'active',
    viewCount: 1256,
    likeCount: 89,
    tags: ['自然风光', '古城', '摄影'],
    difficulty: 'medium',
    bestSeason: ['spring', 'autumn'],
    tips: '建议避开节假日高峰，提前预订住宿。',
    maxParticipants: 10,
    participants: []
  },
  {
    routeId: 'TRDEFAULT002',
    title: '川藏南线之旅',
    description: '从成都出发，穿越二郎山、新都桥、理塘，最终到达拉萨。这是一条充满挑战和美景的路线。',
    startPoint: '成都',
    endPoint: '拉萨',
    waypoints: ['康定', '新都桥', '理塘', '巴塘', '芒康'],
    distance: 2100,
    duration: 12,
    coverImage: '',
    images: [],
    publisherId: 'UADMIN000001',
    publishTime: Date.now() - 86400000 * 15,
    updateTime: Date.now() - 86400000 * 15,
    status: 'active',
    viewCount: 2341,
    likeCount: 156,
    tags: ['高原', '雪山', '挑战'],
    difficulty: 'hard',
    bestSeason: ['summer'],
    tips: '提前做好高原反应准备，检查车辆状况。',
    maxParticipants: 8,
    participants: []
  },
  {
    routeId: 'TRDEFAULT003',
    title: '江南水乡自驾',
    description: '游览苏州、杭州、乌镇、西塘等江南古镇，体验小桥流水人家的诗意生活。',
    startPoint: '上海',
    endPoint: '杭州',
    waypoints: ['苏州', '无锡', '乌镇', '西塘'],
    distance: 450,
    duration: 6,
    coverImage: '',
    images: [],
    publisherId: 'UADMIN000001',
    publishTime: Date.now() - 86400000 * 7,
    updateTime: Date.now() - 86400000 * 7,
    status: 'active',
    viewCount: 876,
    likeCount: 67,
    tags: ['古镇', '水乡', '文化'],
    difficulty: 'easy',
    bestSeason: ['spring', 'autumn'],
    tips: '建议住在古镇内，体验夜晚的宁静。',
    maxParticipants: 12,
    participants: []
  }
]

export function clearTravelRoutes(): void {
  wx.removeStorageSync(TRAVEL_ROUTES_KEY)
}

function getTravelRoutes(): TravelRoute[] {
  try {
    const data = wx.getStorageSync(TRAVEL_ROUTES_KEY)
    if (!data) {
      saveTravelRoutes(DEFAULT_ROUTES)
      return DEFAULT_ROUTES
    }
    
    let routes: TravelRoute[]
    try {
      routes = JSON.parse(data)
    } catch {
      saveTravelRoutes(DEFAULT_ROUTES)
      return DEFAULT_ROUTES
    }
    
    if (!Array.isArray(routes)) {
      saveTravelRoutes(DEFAULT_ROUTES)
      return DEFAULT_ROUTES
    }
    
    if (routes.length === 0) {
      return []
    }
    
    let needsSave = false
    const fixedRoutes = routes.map((route: TravelRoute) => {
      if (!route.publisherId) {
        needsSave = true
        return { ...route, publisherId: 'UADMIN000001' }
      }
      return route
    })
    
    if (needsSave) {
      saveTravelRoutes(fixedRoutes)
    }
    
    return fixedRoutes
  } catch {
    saveTravelRoutes(DEFAULT_ROUTES)
    return DEFAULT_ROUTES
  }
}

function saveTravelRoutes(routes: TravelRoute[]): void {
  wx.setStorageSync(TRAVEL_ROUTES_KEY, JSON.stringify(routes))
}

function mergeRoutes(local: TravelRoute[], remote: TravelRoute[]): TravelRoute[] {
  const map = new Map<string, TravelRoute>()
  for (const item of local) {
    if (item.routeId) map.set(item.routeId, item)
  }
  for (const remoteItem of remote) {
    if (!remoteItem.routeId) continue
    const existing = map.get(remoteItem.routeId)
    if (!existing) {
      map.set(remoteItem.routeId, remoteItem)
      continue
    }
    map.set(remoteItem.routeId, mergeContentItem(existing, remoteItem))
  }
  return Array.from(map.values())
}

/** 写入云托管后台（发布/编辑/删除必调，失败则抛错） */
export async function pushRouteToCloud(route: TravelRoute): Promise<void> {
  if (!isContentApiEnabled()) {
    throw new Error('未配置云托管，自驾游无法保存到后台，请检查 config/api.ts')
  }
  await pushRouteToRemote(route)
}

async function syncRouteToRemote(route: TravelRoute): Promise<void> {
  if (!isContentApiEnabled()) return
  try {
    await pushRouteToRemote(route)
  } catch (e) {
    console.warn('[travel] remote sync failed', e)
  }
}

/** 从云端拉取自驾游线路并合并到本机 */
export async function pullRemoteRoutesAndMerge(): Promise<void> {
  if (!isContentApiEnabled()) return
  try {
    const remote = await fetchRemoteRoutes()
    const local = getTravelRoutes()
    saveTravelRoutes(mergeRoutes(local, remote))
  } catch (e) {
    console.warn('[travel] pull remote failed', e)
    throw e
  }
}

export function canPublishRoute(userId: string): { canPublish: boolean; message: string } {
  const user = getUserById(userId)
  if (!user) {
    return { canPublish: false, message: '用户不存在' }
  }
  
  const vipLevels: MemberLevel[] = ['vip', 'premium']
  if (!vipLevels.includes(user.memberLevel)) {
    return { canPublish: false, message: '仅贵宾会员及以上可以发布线路' }
  }
  
  return { canPublish: true, message: '' }
}

export function canViewPhone(viewerId: string): boolean {
  const viewer = getUserById(viewerId)
  if (!viewer) return false
  
  if (viewer.roles.includes('admin')) return true
  
  const goldLevels: MemberLevel[] = ['gold', 'vip', 'premium']
  return goldLevels.includes(viewer.memberLevel)
}

export async function createRoute(
  publisherId: string,
  data: {
    title: string
    description: string
    startPoint: string
    endPoint: string
    waypoints?: string[]
    distance?: number
    duration?: number
    coverImage?: string
    images?: string[]
    tags?: string[]
    difficulty?: 'easy' | 'medium' | 'hard'
    bestSeason?: string[]
    tips?: string
    maxParticipants?: number
  }
): TravelRoute | null {
  const checkResult = canPublishRoute(publisherId)
  if (!checkResult.canPublish) {
    throw new Error(checkResult.message)
  }
  
  const routes = getTravelRoutes()
  
  const newRoute: TravelRoute = {
    routeId: generateRouteId(),
    title: data.title,
    description: data.description,
    startPoint: data.startPoint,
    endPoint: data.endPoint,
    waypoints: data.waypoints || [],
    distance: data.distance || 0,
    duration: data.duration || 0,
    coverImage: data.coverImage || '',
    images: data.images || [],
    publisherId: publisherId,
    publishTime: Date.now(),
    updateTime: Date.now(),
    status: 'active',
    viewCount: 0,
    likeCount: 0,
    tags: data.tags || [],
    difficulty: data.difficulty || 'medium',
    bestSeason: data.bestSeason || [],
    tips: data.tips || '',
    maxParticipants: data.maxParticipants || 10,
    participants: []
  }
  
  routes.push(newRoute)
  saveTravelRoutes(routes)
  await pushRouteToCloud(newRoute)

  return newRoute
}

export function getRouteById(routeId: string): TravelRoute | null {
  const routes = getTravelRoutes()
  return routes.find(r => r.routeId === routeId && r.status !== 'deleted') || null
}

export function getActiveRoutes(): TravelRoute[] {
  const routes = getTravelRoutes()
  return routes.filter(r => r.status === 'active').sort((a, b) => b.publishTime - a.publishTime)
}

export function getRoutesByPublisher(publisherId: string): TravelRoute[] {
  const routes = getTravelRoutes()
  return routes.filter(r => r.publisherId === publisherId && r.status === 'active')
}

export async function updateRoute(routeId: string, updates: Partial<TravelRoute>): Promise<TravelRoute | null> {
  const routes = getTravelRoutes()
  const index = routes.findIndex(r => r.routeId === routeId)
  
  if (index === -1) return null
  
  routes[index] = {
    ...routes[index],
    ...updates,
    updateTime: Date.now()
  }
  
  saveTravelRoutes(routes)
  await pushRouteToCloud(routes[index])
  return routes[index]
}

export async function deleteRoute(
  routeId: string,
  options?: { fromAdmin?: boolean }
): Promise<boolean> {
  const routes = getTravelRoutes()
  const index = routes.findIndex(r => r.routeId === routeId)
  
  if (index === -1) return false
  
  const now = Date.now()
  routes[index].status = 'deleted'
  routes[index].updateTime = now
  if (options?.fromAdmin) {
    routes[index].adminManagedAt = now
  }
  saveTravelRoutes(routes)
  await pushRouteToCloud(routes[index])
  return true
}

export async function signUpRoute(routeId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const routes = getTravelRoutes()
  const index = routes.findIndex(r => r.routeId === routeId)
  
  if (index === -1) {
    return { success: false, message: '线路不存在' }
  }
  
  const route = routes[index]
  
  if (route.status !== 'active') {
    return { success: false, message: '线路已关闭' }
  }
  
  if (route.participants.find(p => p.userId === userId)) {
    return { success: false, message: '您已报名此线路' }
  }
  
  if (route.participants.length >= route.maxParticipants) {
    return { success: false, message: '已满员' }
  }
  
  const user = getUserById(userId)
  if (!user) {
    return { success: false, message: '用户不存在' }
  }
  
  const participant: RouteParticipant = {
    userId: user.userId,
    userName: user.nickname || user.username,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    memberLevel: user.memberLevel,
    signUpTime: Date.now()
  }
  
  route.participants.push(participant)
  route.updateTime = Date.now()
  saveTravelRoutes(routes)
  await pushRouteToCloud(route)

  return { success: true, message: '报名成功' }
}

export function getParticipants(routeId: string): RouteParticipant[] {
  const route = getRouteById(routeId)
  return route ? route.participants : []
}

export function isUserSignedUp(routeId: string, userId: string): boolean {
  const route = getRouteById(routeId)
  if (!route) return false
  return route.participants.some(p => p.userId === userId)
}

export function incrementViewCount(routeId: string): void {
  const routes = getTravelRoutes()
  const route = routes.find(r => r.routeId === routeId)
  if (route) {
    route.viewCount++
    saveTravelRoutes(routes)
  }
}

export function getPublisherInfo(publisherId: string): {
  nickname: string
  avatarUrl: string
  memberLevel: MemberLevel
  phone: string
  userId: string
} | null {
  const user = getUserById(publisherId)
  if (!user) return null
  
  return {
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    memberLevel: user.memberLevel,
    phone: user.phone,
    userId: user.userId
  }
}

export function makePhoneCall(phone: string): void {
  wx.makePhoneCall({
    phoneNumber: phone,
    fail: () => {
      wx.showToast({
        title: '拨打电话失败',
        icon: 'none'
      })
    }
  })
}

export const DifficultyConfig = {
  easy: { name: '简单', color: '#52c41a' },
  medium: { name: '中等', color: '#faad14' },
  hard: { name: '困难', color: '#ff4d4f' }
}

export const SeasonOptions = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' }
]

export const TagOptions = [
  '山水风光', '古镇古村', '海滨沙滩', '草原沙漠',
  '森林氧吧', '雪山冰川', '温泉养生', '美食之旅',
  '文化古迹', '亲子游', '情侣游', '摄影圣地'
]
