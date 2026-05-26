import { getUserById, MemberLevel, User } from './user'

const TRAVELLOG_KEY = 'travel_logs'

export interface TravelLogComment {
  commentId: string
  authorId: string
  authorName: string
  content: string
  createTime: number
  replyTo?: string
}

export interface TravelLog {
  logId: string
  title: string
  content: string
  images: string[]
  videos: string[]
  publisherId: string
  publishTime: number
  updateTime: number
  status: 'active' | 'deleted'
  viewCount: number
  likeCount: number
  commentCount: number
  comments: TravelLogComment[]
  allowComments: boolean
  tags: string[]
  location?: string
}

export interface CreateTravelLogRequest {
  title: string
  content: string
  images?: string[]
  videos?: string[]
  tags?: string[]
  location?: string
  allowComments?: boolean
}

function generateLogId(): string {
  return 'TL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase()
}

function generateCommentId(): string {
  return 'TC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase()
}

const DEFAULT_LOGS: TravelLog[] = [
  {
    logId: 'TLDEFAULT001',
    title: '云南大理之行',
    content: '这次大理之旅真是太棒了！洱海的风景美不胜收，古城的夜晚格外迷人。我们骑行环海西路，沿途看到了很多美丽的风景。喜洲古镇的粑粑非常好吃，一定要尝尝！',
    images: [],
    videos: [],
    publisherId: 'UADMIN000001',
    publishTime: Date.now() - 86400000 * 7,
    updateTime: Date.now() - 86400000 * 7,
    status: 'active',
    viewCount: 523,
    likeCount: 45,
    commentCount: 12,
    comments: [
      {
        commentId: 'TC001',
        authorId: 'UMEMBER00001',
        authorName: '旅行爱好者',
        content: '太美了！下次我也要去',
        createTime: Date.now() - 86400000 * 6
      },
      {
        commentId: 'TC002',
        authorId: 'UMEMBER00002',
        authorName: '摄影达人',
        content: '请问用什么相机拍的？',
        createTime: Date.now() - 86400000 * 5
      }
    ],
    allowComments: true,
    tags: ['自然风光', '古城', '旅行日记'],
    location: '云南大理'
  },
  {
    logId: 'TLDEFAULT002',
    title: '西藏珠峰大本营',
    content: '终于来到了珠峰大本营！海拔5200米，虽然有点高原反应，但看到珠峰的那一刻，一切都值得了。日出时分的珠峰尤其壮观，金色的阳光洒在雪山上，美得令人窒息。',
    images: [],
    videos: [],
    publisherId: 'UADMIN000001',
    publishTime: Date.now() - 86400000 * 14,
    updateTime: Date.now() - 86400000 * 14,
    status: 'active',
    viewCount: 892,
    likeCount: 78,
    commentCount: 23,
    comments: [
      {
        commentId: 'TC003',
        authorId: 'UMEMBER00003',
        authorName: '冒险家',
        content: '太厉害了！一直想去但没勇气',
        createTime: Date.now() - 86400000 * 13
      }
    ],
    allowComments: true,
    tags: ['高原', '雪山', '挑战'],
    location: '西藏珠峰大本营'
  },
  {
    logId: 'TLDEFAULT003',
    title: '江南水乡古镇游',
    content: '苏州、杭州、乌镇、西塘，一路下来感受到了江南水乡的独特韵味。小桥流水人家，白墙黛瓦，仿佛置身于水墨画中。晚上在古镇里散步，格外宁静惬意。',
    images: [],
    videos: [],
    publisherId: 'UADMIN000001',
    publishTime: Date.now() - 86400000 * 3,
    updateTime: Date.now() - 86400000 * 3,
    status: 'active',
    viewCount: 342,
    likeCount: 31,
    commentCount: 8,
    comments: [],
    allowComments: false,
    tags: ['古镇', '水乡', '文化'],
    location: '江南水乡'
  }
]

function getTravelLogs(): TravelLog[] {
  try {
    const data = wx.getStorageSync(TRAVELLOG_KEY)
    console.log('getTravelLogs: raw data exists:', !!data, 'typeof:', typeof data)
    
    if (!data) {
      console.log('getTravelLogs: no data found, initializing with DEFAULT_LOGS')
      saveTravelLogs(DEFAULT_LOGS)
      return DEFAULT_LOGS
    }
    
    let logs: TravelLog[]
    try {
      logs = typeof data === 'string' ? JSON.parse(data) : data
      console.log('getTravelLogs: parsed logs count:', Array.isArray(logs) ? logs.length : 'not array')
    } catch (e) {
      console.error('getTravelLogs: JSON parse failed:', e)
      saveTravelLogs(DEFAULT_LOGS)
      return DEFAULT_LOGS
    }
    
    if (!Array.isArray(logs)) {
      console.log('getTravelLogs: logs is not an array, resetting')
      saveTravelLogs(DEFAULT_LOGS)
      return DEFAULT_LOGS
    }
    
    if (logs.length === 0) {
      console.log('getTravelLogs: logs array is empty')
      return []
    }
    
    let needsSave = false
    const fixedLogs = logs.map((log: TravelLog, index: number) => {
      if (!log.publisherId) {
        console.log('getTravelLogs: fixing log', index, '- missing publisherId')
        needsSave = true
        return { ...log, publisherId: 'UADMIN000001' }
      }
      if (log.allowComments === undefined) {
        return { ...log, allowComments: true }
      }
      if (!log.comments) {
        return { ...log, comments: [] }
      }
      return log
    })
    
    if (needsSave) {
      console.log('getTravelLogs: saving fixed logs')
      saveTravelLogs(fixedLogs)
    }
    
    return fixedLogs
  } catch (e) {
    console.error('getTravelLogs: unexpected error:', e)
    saveTravelLogs(DEFAULT_LOGS)
    return DEFAULT_LOGS
  }
}

function saveTravelLogs(logs: TravelLog[]): void {
  try {
    const data = JSON.stringify(logs)
    console.log('saveTravelLogs: saving', logs.length, 'logs, data length:', data.length)
    wx.setStorageSync(TRAVELLOG_KEY, data)
    
    // 验证保存是否成功
    const saved = wx.getStorageSync(TRAVELLOG_KEY)
    console.log('saveTravelLogs: save verification - data exists:', !!saved)
  } catch (e) {
    console.error('saveTravelLogs failed:', e)
  }
}

export function canPublishLog(userId: string): { canPublish: boolean; message: string } {
  const user = getUserById(userId)
  if (!user) {
    return { canPublish: false, message: '用户不存在' }
  }
  
  if (user.status !== 'normal') {
    return { canPublish: false, message: '账户状态异常，无法发布' }
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

export function createLog(
  publisherId: string,
  data: CreateTravelLogRequest
): TravelLog | null {
  const checkResult = canPublishLog(publisherId)
  if (!checkResult.canPublish) {
    console.error('createLog failed: ', checkResult.message)
    return null
  }
  
  const newLog: TravelLog = {
    logId: generateLogId(),
    title: data.title,
    content: data.content,
    images: data.images || [],
    videos: data.videos || [],
    publisherId: publisherId,
    publishTime: Date.now(),
    updateTime: Date.now(),
    status: 'active',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    comments: [],
    allowComments: data.allowComments !== undefined ? data.allowComments : true,
    tags: data.tags || [],
    location: data.location
  }
  
  const logs = getTravelLogs()
  console.log('Before create: logs count =', logs.length)
  logs.unshift(newLog)
  saveTravelLogs(logs)
  
  // 验证保存是否成功
  const savedLogs = getTravelLogs()
  console.log('After create: logs count =', savedLogs.length)
  
  return newLog
}

export function getActiveLogs(): TravelLog[] {
  const logs = getTravelLogs()
  console.log('getActiveLogs: total logs =', logs.length)
  
  const activeLogs = logs.filter(l => l.status === 'active')
  console.log('getActiveLogs: active logs =', activeLogs.length)
  
  return activeLogs.sort((a, b) => b.publishTime - a.publishTime)
}

export function getLogById(logId: string): TravelLog | null {
  const logs = getTravelLogs()
  return logs.find(l => l.logId === logId && l.status !== 'deleted') || null
}

export function incrementViewCount(logId: string): void {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  if (index !== -1) {
    logs[index].viewCount++
    saveTravelLogs(logs)
  }
}

export function toggleLike(logId: string, userId: string): { liked: boolean; count: number } {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  if (index === -1) {
    return { liked: false, count: 0 }
  }
  
  const log = logs[index]
  const likesKey = `travel_log_likes_${logId}`
  const likes = wx.getStorageSync(likesKey) || []
  
  if (likes.includes(userId)) {
    const newLikes = likes.filter((id: string) => id !== userId)
    wx.setStorageSync(likesKey, newLikes)
    log.likeCount = newLikes.length
    saveTravelLogs(logs)
    return { liked: false, count: log.likeCount }
  } else {
    const newLikes = [...likes, userId]
    wx.setStorageSync(likesKey, newLikes)
    log.likeCount = newLikes.length
    saveTravelLogs(logs)
    return { liked: true, count: log.likeCount }
  }
}

export function addComment(logId: string, authorId: string, content: string, replyTo?: string): boolean {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  if (index === -1) {
    return false
  }
  
  const log = logs[index]
  if (!log.allowComments) {
    return false
  }
  
  const user = getUserById(authorId)
  if (!user) {
    return false
  }
  
  const comment: TravelLogComment = {
    commentId: generateCommentId(),
    authorId: authorId,
    authorName: user.nickname || user.username,
    content: content,
    createTime: Date.now(),
    replyTo
  }
  
  log.comments.push(comment)
  log.commentCount = log.comments.length
  saveTravelLogs(logs)
  
  return true
}

export function deleteComment(logId: string, commentId: string, userId: string): boolean {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  if (index === -1) {
    return false
  }
  
  const log = logs[index]
  const user = getUserById(userId)
  if (!user) {
    return false
  }
  
  const commentIndex = log.comments.findIndex(c => c.commentId === commentId)
  if (commentIndex === -1) {
    return false
  }
  
  const comment = log.comments[commentIndex]
  if (comment.authorId !== userId && !user.roles.includes('admin')) {
    return false
  }
  
  log.comments.splice(commentIndex, 1)
  log.commentCount = log.comments.length
  saveTravelLogs(logs)
  
  return true
}

export function updateLog(logId: string, updates: Partial<TravelLog>): TravelLog | null {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  
  if (index === -1) return null
  
  logs[index] = {
    ...logs[index],
    ...updates,
    updateTime: Date.now()
  }
  
  saveTravelLogs(logs)
  return logs[index]
}

export function deleteLog(logId: string): boolean {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  
  if (index === -1) return false
  
  logs[index].status = 'deleted'
  saveTravelLogs(logs)
  return true
}

export function toggleComments(logId: string): boolean {
  const logs = getTravelLogs()
  const index = logs.findIndex(l => l.logId === logId)
  
  if (index === -1) return false
  
  logs[index].allowComments = !logs[index].allowComments
  saveTravelLogs(logs)
  
  return logs[index].allowComments
}

export function getLogsByPublisher(publisherId: string): TravelLog[] {
  const logs = getTravelLogs()
  return logs.filter(l => l.publisherId === publisherId && l.status === 'active')
}

export function getPublisherInfo(publisherId: string): {
  nickname: string
  avatarUrl: string
  memberLevel: MemberLevel
  phone: string
} | null {
  const user = getUserById(publisherId)
  if (!user) {
    return null
  }
  
  return {
    nickname: user.nickname || user.username,
    avatarUrl: user.avatarUrl || '',
    memberLevel: user.memberLevel,
    phone: canViewPhone(user.userId) ? user.phone : ''
  }
}