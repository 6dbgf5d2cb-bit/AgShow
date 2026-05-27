import { isUserApiEnabled, fetchRemoteUsers, pushUserToRemote, deleteRemoteUsers } from './user-api'

export type MemberLevel = 'normal' | 'gold' | 'vip' | 'premium'

export type AccountStatus = 'normal' | 'frozen' | 'unactivated' | 'cancelled'

export type UserRole = string

export interface User {
  userId: string
  username: string
  phone: string
  email: string
  realName: string
  idCardEncrypted: string
  passwordSalt: string
  passwordHash: string
  totpSecret?: string
  status: AccountStatus
  registerIp: string
  lastLoginIp: string
  lastLoginTime: number
  loginFailCount: number
  lockTime: number
  registerTime: number
  lastPasswordChangeTime: number
  emailVerifiedTime?: number
  phoneVerifiedTime?: number
  nickname: string
  avatarUrl: string
  gender: 'male' | 'female' | 'other'
  birthday: string
  region: string
  timezone: string
  language: string
  memberLevel: MemberLevel
  points: number
  referrerId?: string
  wechatOpenId?: string
  googleSub?: string
  roles: UserRole[]
  updatedAt?: number
}

export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

export interface WeChatLoginRequest {
  wxCode: string
  openId: string
  unionId?: string
  nickname?: string
  avatarUrl?: string
}

export interface PhoneLoginRequest {
  phone: string
  openId?: string
}

export interface RegisterRequest {
  username: string
  password: string
  phone: string
  email: string
  realName: string
  idCard?: string
  nickname: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  region?: string
  referrerId?: string
}

export interface UserSession {
  userId: string
  token: string
  expiresAt: number
  userInfo: Partial<User>
}

const USER_STORAGE_KEY = 'member_user_session'
const MOCK_USERS_KEY = 'member_mock_users'
const USER_WAL_KEY = 'member_user_wal'
const USER_RECORD_PREFIX = 'member_user_record_'
const ROLE_CONFIG_KEY = 'member_role_config'
const ROLE_PERMISSIONS_KEY = 'member_role_permissions'
const DELETED_USERS_KEY = 'member_user_deleted_ids'

function loadDeletedUserIds(): Set<string> {
  try {
    const raw = wx.getStorageSync(DELETED_USERS_KEY)
    if (!raw) return new Set()
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : [])
  } catch {
    return new Set()
  }
}

function saveDeletedUserIds(ids: Set<string>): void {
  wx.setStorageSync(DELETED_USERS_KEY, JSON.stringify([...ids]))
}

function markUsersAsDeleted(userIds: string[]): void {
  if (!userIds.length) return
  const set = loadDeletedUserIds()
  userIds.forEach((id) => {
    if (id) set.add(id)
  })
  saveDeletedUserIds(set)
}

function clearDeletedUserMark(userId: string): void {
  if (!userId) return
  const set = loadDeletedUserIds()
  if (set.delete(userId)) {
    saveDeletedUserIds(set)
  }
}

async function pushUserAndWait(user: User): Promise<void> {
  if (!isUserApiEnabled()) return
  await pushUserToRemote(user)
}

function generateUserId(): string {
  return 'U' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 6).toUpperCase()
}

function generateSalt(): string {
  return Math.random().toString(36).substr(2, 16)
}

function hashPassword(password: string, salt: string): string {
  let hash = (password || 'x') + (salt || 'y')
  for (let i = 0; i < 1000; i++) {
    const chars = Array.from(hash)
    const sum = chars.length > 0
      ? chars.reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : 0
    hash = sum.toString(36) || '0'
  }
  return hash || '0'
}

function getCurrentIp(): string {
  return '192.168.1.' + Math.floor(Math.random() * 254 + 1)
}

const DEFAULT_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

/** 补齐本地存储用户字段，避免加载/列表渲染异常 */
function normalizeStoredUser(raw: Partial<User>): User {
  const username =
    (raw.username && String(raw.username).trim()) ||
    (raw.wechatOpenId ? `wx_${String(raw.wechatOpenId).replace(/\W/g, '').slice(-8)}` : '') ||
    `user_${Date.now().toString(36)}`
  const roles: UserRole[] =
    Array.isArray(raw.roles) && raw.roles.length > 0
      ? raw.roles
      : username.toLowerCase() === 'admin'
        ? ['admin']
        : ['member']
  const now = Date.now()

  return {
    userId: raw.userId || generateUserId(),
    username,
    phone: raw.phone || '',
    email: raw.email || '',
    realName: raw.realName || '',
    idCardEncrypted: raw.idCardEncrypted || '',
    passwordSalt: raw.passwordSalt || generateSalt(),
    passwordHash:
      raw.passwordHash ||
      (raw.passwordSalt
        ? hashPassword('changeme', raw.passwordSalt)
        : hashPassword('changeme', generateSalt())),
    status: raw.status || 'normal',
    registerIp: raw.registerIp || getCurrentIp(),
    lastLoginIp: raw.lastLoginIp || '',
    lastLoginTime: raw.lastLoginTime || 0,
    loginFailCount: raw.loginFailCount || 0,
    lockTime: raw.lockTime || 0,
    registerTime: raw.registerTime || now,
    lastPasswordChangeTime: raw.lastPasswordChangeTime || now,
    emailVerifiedTime: raw.emailVerifiedTime,
    phoneVerifiedTime: raw.phoneVerifiedTime,
    nickname: raw.nickname || username,
    avatarUrl: raw.avatarUrl || DEFAULT_AVATAR,
    gender: raw.gender || 'other',
    birthday: raw.birthday || '',
    region: raw.region || '',
    timezone: raw.timezone || 'Asia/Shanghai',
    language: raw.language || 'zh-CN',
    memberLevel: raw.memberLevel || 'normal',
    points: typeof raw.points === 'number' ? raw.points : 0,
    referrerId: raw.referrerId,
    wechatOpenId: raw.wechatOpenId,
    googleSub: raw.googleSub,
    roles,
    updatedAt: raw.updatedAt || raw.registerTime || now
  }
}

function findUserIndexInList(users: User[], user: Partial<User>): number {
  if (user.userId) {
    const byId = users.findIndex((u) => u.userId === user.userId)
    if (byId >= 0) return byId
  }
  if (user.wechatOpenId) {
    const byWx = users.findIndex((u) => u.wechatOpenId === user.wechatOpenId)
    if (byWx >= 0) return byWx
  }
  if (user.phone) {
    const byPhone = users.findIndex((u) => u.phone && u.phone === user.phone)
    if (byPhone >= 0) return byPhone
  }
  if (user.username) {
    const byName = users.findIndex((u) => u.username === user.username)
    if (byName >= 0) return byName
  }
  return -1
}

function appendUserWal(userId: string): void {
  if (!userId) return
  const wal: string[] = wx.getStorageSync(USER_WAL_KEY) || []
  if (!wal.includes(userId)) {
    wal.push(userId)
    wx.setStorageSync(USER_WAL_KEY, wal)
  }
}

function removeUserRecord(userId: string): void {
  if (!userId) return
  wx.removeStorageSync(USER_RECORD_PREFIX + userId)
  const wal: string[] = wx.getStorageSync(USER_WAL_KEY) || []
  const nextWal = wal.filter((id) => id !== userId)
  if (nextWal.length !== wal.length) {
    wx.setStorageSync(USER_WAL_KEY, nextWal)
  }
}

function removeUsersFromRegistryLocal(userIds: string[]): number {
  if (!userIds.length) return 0

  const idSet = new Set(userIds)
  let users = readAllUsersFromRegistry()
  const before = users.length
  users = users.filter((u) => !idSet.has(u.userId))

  userIds.forEach((id) => removeUserRecord(id))
  saveMockUsers(users)
  markUsersAsDeleted(userIds)

  return before - users.length
}

function saveUserRecord(user: User): User {
  const normalized = normalizeStoredUser({ ...user, updatedAt: Date.now() })
  const key = USER_RECORD_PREFIX + normalized.userId
  wx.setStorageSync(key, JSON.stringify(normalized))
  appendUserWal(normalized.userId)

  const wal: string[] = wx.getStorageSync(USER_WAL_KEY) || []
  if (!wal.includes(normalized.userId)) {
    console.error('[user] WAL append failed for', normalized.userId)
    appendUserWal(normalized.userId)
  }

  return normalized
}

/** 从索引 + 单条记录读取（主数据源，避免整表被覆盖丢失） */
function readAllUsersFromRegistry(): User[] {
  const byId = new Map<string, User>()

  const wal: string[] = wx.getStorageSync(USER_WAL_KEY) || []
  for (const id of wal) {
    if (!id) continue
    try {
      const data = wx.getStorageSync(USER_RECORD_PREFIX + id)
      if (!data) continue
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      const u = normalizeStoredUser(parsed as Partial<User>)
      byId.set(u.userId, u)
    } catch (itemErr) {
      console.warn('[user] skip bad user record', id, itemErr)
    }
  }

  for (const u of readUserListFromStorage()) {
    if (!byId.has(u.userId)) {
      saveUserRecord(u)
      byId.set(u.userId, u)
    }
  }

  return Array.from(byId.values())
}

/** 从 Storage 直接读取用户列表（不触发 getMockUsers 副作用） */
function readUserListFromStorage(): User[] {
  try {
    const data = wx.getStorageSync(MOCK_USERS_KEY)
    if (!data) return []

    let parsed: unknown = typeof data === 'string' ? JSON.parse(data) : data
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        return []
      }
    }
    if (!Array.isArray(parsed)) return []

    const result: User[] = []
    for (const item of parsed) {
      try {
        const normalized = normalizeStoredUser(item as Partial<User>)
        if (normalized.userId) {
          result.push(normalized)
        }
      } catch (itemErr) {
        console.warn('[user] skip invalid user record', itemErr)
      }
    }
    return result
  } catch (e) {
    console.error('[user] readUserListFromStorage failed', e)
    return []
  }
}

/** 将用户写入统一注册表（所有登录方式共用） */
function upsertUserInStorage(user: User): User {
  clearDeletedUserMark(user.userId)
  const normalized = normalizeStoredUser(user)
  let users = readAllUsersFromRegistry()
  const index = findUserIndexInList(users, normalized)

  let saved: User
  if (index < 0) {
    saved = normalized
    users.push(saved)
  } else {
    saved = normalizeStoredUser({ ...users[index], ...normalized })
    users[index] = saved
  }

  saveUserRecord(saved)
  saveMockUsers(users)
  ensureDefaultAdminInList(readAllUsersFromRegistry())

  const verify = readAllUsersFromRegistry()
  const ok =
    verify.some((u) => u.userId === saved.userId) ||
    (saved.wechatOpenId ? verify.some((u) => u.wechatOpenId === saved.wechatOpenId) : false)

  if (!ok) {
    console.error('[user] upsert verify failed, force append', saved.userId)
    saveUserRecord(saved)
    users = readAllUsersFromRegistry()
    if (!users.some((u) => u.userId === saved.userId)) {
      users.push(saved)
      saveMockUsers(users)
    }
  }

  syncUserToRemoteIfEnabled(saved)
  return saved
}

function syncUserToRemoteIfEnabled(user: User): void {
  if (!isUserApiEnabled()) return
  pushUserToRemote(user).catch((err) => {
    console.warn('[user] remote sync failed', err)
  })
}

function ensureDefaultAdminInList(users: User[]): User[] {
  const hasAdmin = users.some((u) => (u.username || '').toLowerCase() === 'admin')
  if (!hasAdmin) {
    const admin = createDefaultAdmin()
    users.push(admin)
    saveUserRecord(admin)
    saveMockUsers(users)
  }
  return users
}

function createDefaultAdmin(): User {
  const salt = generateSalt()
  const passwordHash = hashPassword('admin123', salt)
  
  return {
    userId: 'UADMIN000001',
    username: 'admin',
    phone: '13800138000',
    email: 'admin@example.com',
    realName: '系统管理员',
    idCardEncrypted: '',
    passwordSalt: salt,
    passwordHash: passwordHash,
    status: 'normal',
    registerIp: '127.0.0.1',
    lastLoginIp: '',
    lastLoginTime: 0,
    loginFailCount: 0,
    lockTime: 0,
    registerTime: Date.now(),
    lastPasswordChangeTime: Date.now(),
    nickname: '系统管理员',
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    gender: 'other',
    birthday: '',
    region: '管理员',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    memberLevel: 'premium',
    points: 99999,
    roles: ['admin']
  }
}

function getMockUsers(): User[] {
  try {
    let users = readAllUsersFromRegistry()

    if (users.length === 0) {
      const defaultAdmin = createDefaultAdmin()
      saveUserRecord(defaultAdmin)
      saveMockUsers([defaultAdmin])
      return [defaultAdmin]
    }

    let changed = false
    users = users.map((raw) => {
      const needsFix =
        !raw.userId ||
        !raw.username ||
        !Array.isArray(raw.roles) ||
        raw.roles.length === 0 ||
        !raw.memberLevel
      const normalized = normalizeStoredUser(raw)
      const username = (normalized.username || '').toLowerCase()
      if (username === 'admin' && !normalized.roles.includes('admin')) {
        changed = true
        return normalizeStoredUser({ ...normalized, roles: [...normalized.roles, 'admin'] })
      }
      if (needsFix) {
        changed = true
      }
      return normalized
    })

    const beforeAdminCheck = users.length
    users = ensureDefaultAdminInList(users)
    if (users.length > beforeAdminCheck) {
      changed = true
    }

    if (changed) {
      saveMockUsers(users)
    }

    return users
  } catch (e) {
    console.error('Failed to load users:', e)
    const recovered = readAllUsersFromRegistry()
    if (recovered.length > 0) {
      const users = ensureDefaultAdminInList(recovered)
      saveMockUsers(users)
      return users
    }
    const defaultAdmin = createDefaultAdmin()
    saveUserRecord(defaultAdmin)
    saveMockUsers([defaultAdmin])
    return [defaultAdmin]
  }
}

function saveMockUsers(users: User[]): void {
  wx.setStorageSync(MOCK_USERS_KEY, JSON.stringify(users))
}

export const MemberLevelConfig: Record<MemberLevel, { name: string; color: string; privileges: string[] }> = {
  normal: {
    name: '普通会员',
    color: '#999999',
    privileges: ['基础服务', '积分累计']
  },
  gold: {
    name: '金牌会员',
    color: '#FFD700',
    privileges: ['基础服务', '积分累计', '专属客服', '95折优惠']
  },
  vip: {
    name: '贵宾会员',
    color: '#FF6B6B',
    privileges: ['基础服务', '积分累计', '专属客服', '9折优惠', '优先发货', '生日礼包']
  },
  premium: {
    name: 'VIP会员',
    color: '#9B59B6',
    privileges: ['基础服务', '积分累计', '专属客服', '85折优惠', '优先发货', '生日礼包', '专属活动', '一对一服务']
  }
}

export const AccountStatusConfig: Record<AccountStatus, { name: string; color: string }> = {
  normal: { name: '正常', color: '#52c41a' },
  frozen: { name: '冻结', color: '#ff4d4f' },
  unactivated: { name: '未激活', color: '#faad14' },
  cancelled: { name: '已注销', color: '#d9d9d9' }
}

const DefaultRoleConfig: Record<string, { name: string; permissions: string[] }> = {
  admin: {
    name: '管理员',
    permissions: ['dashboard', 'user_management', 'role_management', 'system_settings', 'all']
  },
  member: {
    name: '会员',
    permissions: ['profile', 'orders', 'points', 'settings']
  },
  guest: {
    name: '访客',
    permissions: ['browse', 'search']
  }
}

function getStoredRoleConfig(): Record<string, { name: string; permissions: string[] }> {
  try {
    const stored = wx.getStorageSync(ROLE_CONFIG_KEY)
    if (stored) {
      return { ...DefaultRoleConfig, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load role config:', e)
  }
  return { ...DefaultRoleConfig }
}

function saveRoleConfig(config: Record<string, { name: string; permissions: string[] }>): void {
  try {
    const customConfig = { ...config }
    delete customConfig['admin']
    delete customConfig['member']
    delete customConfig['guest']
    wx.setStorageSync(ROLE_CONFIG_KEY, JSON.stringify(customConfig))
  } catch (e) {
    console.error('Failed to save role config:', e)
  }
}

export const RoleConfig: Record<string, { name: string; permissions: string[] }> = getStoredRoleConfig()

export function saveRoleToConfig(roleKey: string, config: { name: string; permissions: string[] }): void {
  RoleConfig[roleKey] = config
  saveRoleConfig(RoleConfig)
}

export function removeRoleFromConfig(roleKey: string): void {
  delete RoleConfig[roleKey]
  saveRoleConfig(RoleConfig)
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return RoleConfig[role]?.permissions.includes(permission) || RoleConfig[role]?.permissions.includes('all') || false
}

function encodeIdCard(idCard: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(idCard)
    }
  } catch {
    // 小程序环境可能无 btoa
  }
  return idCard
}

export async function register(request: RegisterRequest): Promise<User> {
  const users = readAllUsersFromRegistry()

  if (users.some((u) => u.username === request.username)) {
    throw new Error('用户名已存在')
  }
  if (users.some((u) => u.phone && u.phone === request.phone)) {
    throw new Error('手机号已被注册')
  }

  const salt = generateSalt()
  const passwordHash = hashPassword(request.password, salt)

  const newUser: User = {
    userId: generateUserId(),
    username: request.username,
    phone: request.phone,
    email: request.email || '',
    realName: request.realName || '',
    idCardEncrypted: request.idCard ? encodeIdCard(request.idCard) : '',
    passwordSalt: salt,
    passwordHash: passwordHash,
    status: 'unactivated',
    registerIp: getCurrentIp(),
    lastLoginIp: '',
    lastLoginTime: 0,
    loginFailCount: 0,
    lockTime: 0,
    registerTime: Date.now(),
    lastPasswordChangeTime: Date.now(),
    nickname: request.nickname || request.username,
    avatarUrl: DEFAULT_AVATAR,
    gender: request.gender || 'other',
    birthday: request.birthday || '',
    region: request.region || '',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    memberLevel: 'normal',
    points: 0,
    referrerId: request.referrerId,
    roles: request.username.toLowerCase() === 'admin' ? ['admin'] : ['member']
  }

  return upsertUserInStorage(newUser)
}

function persistSession(user: User, rememberMe = true): UserSession {
  const savedUser = upsertUserInStorage(user)
  const token = 'TOKEN_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 16)
  const expiresAt = rememberMe
    ? Date.now() + 30 * 24 * 60 * 60 * 1000
    : Date.now() + 24 * 60 * 60 * 1000

  const session: UserSession = {
    userId: savedUser.userId,
    token,
    expiresAt,
    userInfo: {
      userId: savedUser.userId,
      username: savedUser.username,
      nickname: savedUser.nickname,
      avatarUrl: savedUser.avatarUrl,
      memberLevel: savedUser.memberLevel,
      points: savedUser.points,
      status: savedUser.status,
      roles: savedUser.roles
    }
  }

  wx.setStorageSync(USER_STORAGE_KEY, JSON.stringify(session))
  return session
}

function finalizeUserLogin(user: User): User {
  user.loginFailCount = 0
  user.lastLoginIp = getCurrentIp()
  user.lastLoginTime = Date.now()
  if (user.status === 'unactivated') {
    user.status = 'normal'
  }
  return user
}

function findUserByWechatOpenId(openId: string, users = readAllUsersFromRegistry()): User | undefined {
  if (!openId) return undefined
  return users.find((u) => u.wechatOpenId === openId)
}

function findUserByPhone(phone: string, users = readAllUsersFromRegistry()): User | undefined {
  if (!phone) return undefined
  return users.find((u) => u.phone === phone)
}

function createOAuthUser(params: {
  openId?: string
  phone: string
  nickname: string
  avatarUrl: string
}): User {
  const salt = generateSalt()
  const defaultPassword = hashPassword('wx_' + Date.now(), salt)
  const suffix = (params.openId || params.phone).replace(/\W/g, '').slice(-8) || Date.now().toString(36)

  return {
    userId: generateUserId(),
    username: 'wx_' + suffix,
    phone: params.phone,
    email: '',
    realName: '',
    idCardEncrypted: '',
    passwordSalt: salt,
    passwordHash: defaultPassword,
    status: 'normal',
    registerIp: getCurrentIp(),
    lastLoginIp: '',
    lastLoginTime: 0,
    loginFailCount: 0,
    lockTime: 0,
    registerTime: Date.now(),
    lastPasswordChangeTime: Date.now(),
    nickname: params.nickname,
    avatarUrl:
      params.avatarUrl ||
      'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    gender: 'other',
    birthday: '',
    region: '',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    memberLevel: 'normal',
    points: 0,
    wechatOpenId: params.openId || '',
    roles: ['member']
  }
}

/** 微信登录：按 openId 查找或自动注册新会员 */
export async function loginWithWeChat(request: WeChatLoginRequest): Promise<UserSession> {
  if (!request.openId) {
    throw new Error('无法获取微信身份标识，请重试')
  }

  const users = readAllUsersFromRegistry()
  let user = findUserByWechatOpenId(request.openId, users)

  if (!user) {
    user = createOAuthUser({
      openId: request.openId,
      phone: '',
      nickname: request.nickname || '微信用户',
      avatarUrl: request.avatarUrl || ''
    })
  } else {
    if (request.nickname) user.nickname = request.nickname
    if (request.avatarUrl) user.avatarUrl = request.avatarUrl
    user.wechatOpenId = request.openId
    if (!Array.isArray(user.roles) || user.roles.length === 0) {
      user.roles = ['member']
    }
    if (user.status === 'frozen') throw new Error('账户已被冻结')
    if (user.status === 'cancelled') throw new Error('账户已注销')
  }

  finalizeUserLogin(user)

  if (user.userId) {
    await syncRemoteUserIntoRegistry(user.userId)
    const fresh = getUserById(user.userId)
    if (fresh) {
      user = {
        ...fresh,
        nickname: request.nickname || fresh.nickname,
        avatarUrl: request.avatarUrl || fresh.avatarUrl,
        wechatOpenId: request.openId,
        lastLoginIp: getCurrentIp(),
        lastLoginTime: Date.now(),
        loginFailCount: 0,
        status: fresh.status === 'unactivated' ? 'normal' : fresh.status
      }
    }
  }

  const savedUser = upsertUserInStorage(user)

  const currentSession = getCurrentSession()
  const keepAdminSession = !!currentSession?.userInfo?.roles?.includes('admin')

  const session = keepAdminSession ? currentSession! : persistSession(savedUser, true)

  const inRegistry = readAllUsersFromRegistry().some(
    (u) =>
      u.userId === savedUser.userId ||
      (savedUser.wechatOpenId && u.wechatOpenId === savedUser.wechatOpenId)
  )
  if (!inRegistry) {
    throw new Error('用户数据保存失败，请重试')
  }

  if (keepAdminSession) {
    wx.showToast({ title: '微信用户已登记', icon: 'success' })
  }

  return session
}

/** 本机号码一键登录：按手机号查找或自动注册 */
export async function loginWithPhoneNumber(request: PhoneLoginRequest): Promise<UserSession> {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(request.phone)) {
    throw new Error('手机号格式无效')
  }

  const users = readAllUsersFromRegistry()
  let user = findUserByPhone(request.phone, users)

  if (!user && request.openId) {
    user = findUserByWechatOpenId(request.openId, users)
    if (user) {
      user.phone = request.phone
    }
  }

  if (!user) {
    user = createOAuthUser({
      openId: request.openId,
      phone: request.phone,
      nickname: '用户' + request.phone.slice(-4),
      avatarUrl: ''
    })
  } else {
    if (request.openId) user.wechatOpenId = request.openId
    user.phone = request.phone
    user.phoneVerifiedTime = Date.now()
    if (!Array.isArray(user.roles) || user.roles.length === 0) {
      user.roles = ['member']
    }
    if (user.status === 'frozen') throw new Error('账户已被冻结')
    if (user.status === 'cancelled') throw new Error('账户已注销')
  }

  finalizeUserLogin(user)

  if (user.userId) {
    await syncRemoteUserIntoRegistry(user.userId)
    const fresh = getUserById(user.userId)
    if (fresh) {
      user = {
        ...fresh,
        phone: request.phone,
        wechatOpenId: request.openId || fresh.wechatOpenId,
        phoneVerifiedTime: Date.now(),
        lastLoginIp: getCurrentIp(),
        lastLoginTime: Date.now(),
        loginFailCount: 0,
        status: fresh.status === 'unactivated' ? 'normal' : fresh.status
      }
    }
  }

  return persistSession(upsertUserInStorage(user), true)
}

export async function login(request: LoginRequest): Promise<UserSession> {
  const users = getMockUsers()
  const user = users.find(u => u.username === request.username)

  if (!user) {
    throw new Error('用户名不存在')
  }

  if (user.status === 'frozen') {
    throw new Error('账户已被冻结')
  }

  if (user.status === 'cancelled') {
    throw new Error('账户已注销')
  }

  if (user.lockTime > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockTime - Date.now()) / 60000)
    throw new Error(`账户已锁定，请${remainingMinutes}分钟后重试`)
  }

  const passwordHash = hashPassword(request.password, user.passwordSalt)
  if (passwordHash !== user.passwordHash) {
    user.loginFailCount++
    
    if (user.loginFailCount >= 5) {
      user.lockTime = Date.now() + 30 * 60 * 1000
    }
    
    saveMockUsers(users)
    
    const remainingAttempts = Math.max(0, 5 - user.loginFailCount)
    if (remainingAttempts > 0) {
      throw new Error(`密码错误，还有${remainingAttempts}次尝试机会`)
    } else {
      throw new Error('密码错误次数过多，账户已锁定30分钟')
    }
  }

  finalizeUserLogin(user)

  if (user.userId) {
    await syncRemoteUserIntoRegistry(user.userId)
    const fresh = getUserById(user.userId)
    if (fresh) {
      user = {
        ...fresh,
        lastLoginIp: getCurrentIp(),
        lastLoginTime: Date.now(),
        loginFailCount: 0,
        status: fresh.status === 'unactivated' ? 'normal' : fresh.status
      }
    }
  }

  return persistSession(upsertUserInStorage(user), !!request.rememberMe)
}

export function logout(): void {
  wx.removeStorageSync(USER_STORAGE_KEY)
}

export function getCurrentSession(): UserSession | null {
  try {
    const data = wx.getStorageSync(USER_STORAGE_KEY)
    if (!data) return null
    
    const session: UserSession = JSON.parse(data)
    
    if (session.expiresAt < Date.now()) {
      logout()
      return null
    }
    
    return session
  } catch {
    return null
  }
}

/** 用注册表最新资料刷新当前登录会话（等级、角色等） */
export function refreshSessionFromRegistry(userId?: string): void {
  const session = getCurrentSession()
  if (!session) return

  const id = userId || session.userId
  if (!id || session.userId !== id) return

  const user = getUserById(id)
  if (!user) return

  session.userInfo = {
    userId: user.userId,
    username: user.username,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    memberLevel: user.memberLevel,
    points: user.points,
    status: user.status,
    roles: user.roles
  }
  wx.setStorageSync(USER_STORAGE_KEY, JSON.stringify(session))
}

/** 从云端拉取指定用户并合并到本机注册表 */
export async function syncRemoteUserIntoRegistry(userId: string): Promise<User | null> {
  if (!userId) return null

  if (isUserApiEnabled()) {
    try {
      const remoteUsers = await fetchRemoteUsers()
      const remote = remoteUsers.find((u) => u.userId === userId)
      if (remote) {
        mergeUsersIntoLocalRegistry([remote])
      }
    } catch (e) {
      console.warn('[user] syncRemoteUserIntoRegistry failed', e)
    }
  }

  refreshSessionFromRegistry(userId)
  return getUserById(userId)
}

/** 同步当前登录用户：云端等级/角色 → 本地注册表 → 刷新 session */
export async function syncCurrentUserFromRemote(): Promise<User | null> {
  const session = getCurrentSession()
  if (!session?.userId) return null
  return syncRemoteUserIntoRegistry(session.userId)
}

/** 若当前登录会话中的用户不在注册表，则补写入（防止仅 session 无列表记录） */
export function syncSessionUserToRegistry(): void {
  const session = getCurrentSession()
  if (!session?.userId) return

  const users = readAllUsersFromRegistry()
  if (users.some((u) => u.userId === session.userId)) return

  const info = session.userInfo || {}
  upsertUserInStorage(
    normalizeStoredUser({
      userId: session.userId,
      username: info.username,
      nickname: info.nickname,
      avatarUrl: info.avatarUrl,
      memberLevel: info.memberLevel,
      points: info.points,
      status: info.status,
      roles: info.roles
    })
  )
}

export function getUserById(userId: string): User | null {
  return readAllUsersFromRegistry().find((u) => u.userId === userId) || null
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const user = getUserById(userId)
  if (!user) return null

  const saved = upsertUserInStorage({ ...user, ...updates })
  try {
    await pushUserAndWait(saved)
  } catch (e) {
    console.warn('[user] updateUser remote sync failed', e)
  }

  if (getCurrentSession()?.userId === userId) {
    refreshSessionFromRegistry(userId)
  }

  return saved
}

/** 直接设置用户角色列表 */
export async function setUserRoles(userId: string, roles: UserRole[]): Promise<User | null> {
  const safeRoles = roles.length > 0 ? roles : ['member']
  return updateUser(userId, { roles: safeRoles })
}

export function updatePassword(userId: string, oldPassword: string, newPassword: string): boolean {
  const users = getMockUsers()
  const user = users.find(u => u.userId === userId)
  
  if (!user) return false
  
  const oldHash = hashPassword(oldPassword, user.passwordSalt)
  if (oldHash !== user.passwordHash) return false
  
  const newSalt = generateSalt()
  const newHash = hashPassword(newPassword, newSalt)
  
  user.passwordSalt = newSalt
  user.passwordHash = newHash
  user.lastPasswordChangeTime = Date.now()
  
  saveMockUsers(users)
  return true
}

export function upgradeMemberLevel(userId: string, newLevel: MemberLevel): boolean {
  const users = getMockUsers()
  const user = users.find(u => u.userId === userId)
  
  if (!user) return false
  
  user.memberLevel = newLevel
  saveMockUsers(users)
  
  void updateUser(userId, { memberLevel: newLevel })
  return true
}

export function addPoints(userId: string, points: number): number {
  const users = getMockUsers()
  const user = users.find(u => u.userId === userId)
  
  if (!user) return 0
  
  user.points = Math.max(0, user.points + points)
  saveMockUsers(users)
  
  void updateUser(userId, { points: user.points })
  return user.points
}

export function assignRole(userId: string, role: UserRole): boolean {
  const users = getMockUsers()
  const user = users.find(u => u.userId === userId)
  
  if (!user) return false
  
  if (!user.roles.includes(role)) {
    user.roles.push(role)
    saveMockUsers(users)
    void updateUser(userId, { roles: user.roles })
  }
  
  return true
}

export function removeRole(userId: string, role: UserRole): boolean {
  const users = getMockUsers()
  const user = users.find(u => u.userId === userId)
  
  if (!user) return false
  
  const index = user.roles.indexOf(role)
  if (index !== -1 && user.roles.length > 1) {
    user.roles.splice(index, 1)
    saveMockUsers(users)
    void updateUser(userId, { roles: user.roles })
    return true
  }
  
  return false
}

export async function verifyPhone(userId: string): Promise<boolean> {
  return (await updateUser(userId, { phoneVerifiedTime: Date.now() })) !== null
}

export async function verifyEmail(userId: string): Promise<boolean> {
  return (await updateUser(userId, { emailVerifiedTime: Date.now() })) !== null
}

/** 强制把用户写入注册表并同步列表（注册/登录后调用） */
export function commitUserToRegistry(user: User): User {
  return upsertUserInStorage(user)
}

export function getAllUsers(): User[] {
  syncSessionUserToRegistry()

  let users = readAllUsersFromRegistry()

  if (users.length === 0) {
    const legacy = readUserListFromStorage()
    if (legacy.length > 0) {
      legacy.forEach((u) => saveUserRecord(u))
      users = readAllUsersFromRegistry()
    }
  }

  users = ensureDefaultAdminInList(users)

  if (users.length === 0) {
    const admin = createDefaultAdmin()
    saveUserRecord(admin)
    saveMockUsers([admin])
    users = [admin]
  } else {
    saveMockUsers(users)
  }

  const deleted = loadDeletedUserIds()
  return users
    .filter((u) => !deleted.has(u.userId))
    .slice()
    .sort((a, b) => (b.registerTime || 0) - (a.registerTime || 0))
}

function userRevision(user: Partial<User>): number {
  return user.updatedAt || user.registerTime || 0
}

/** 将服务端用户合并到本机（较新的 updatedAt 优先，避免覆盖刚做的管理操作） */
export function mergeUsersIntoLocalRegistry(remoteUsers: User[]): User[] {
  const deleted = loadDeletedUserIds()

  for (const raw of remoteUsers) {
    const users = readAllUsersFromRegistry()
    const normalized = normalizeStoredUser(raw)
    if (deleted.has(normalized.userId)) continue

    const index = findUserIndexInList(users, normalized)

    if (index < 0) {
      saveUserRecord(normalized)
      continue
    }

    const local = users[index]
    // 仅当云端版本更新时才覆盖本地，避免刚做的管理操作被旧数据冲掉
    if (userRevision(normalized) > userRevision(local)) {
      saveUserRecord(normalizeStoredUser({ ...local, ...normalized }))
    }
  }

  let users = ensureDefaultAdminInList(readAllUsersFromRegistry())
  users = users.filter((u) => !deleted.has(u.userId))
  saveMockUsers(users)
  return users
    .slice()
    .sort((a, b) => (b.registerTime || 0) - (a.registerTime || 0))
}

/** 从服务端拉取用户并合并到本地列表 */
export async function pullRemoteUsersAndMerge(): Promise<User[]> {
  if (!isUserApiEnabled()) {
    return getAllUsers()
  }
  const remote = await fetchRemoteUsers()
  return mergeUsersIntoLocalRegistry(remote)
}

export { isUserApiEnabled } from './user-api'

export function getCurrentUser(): User | null {
  const session = getCurrentSession()
  if (!session) return null
  return getUserById(session.userId)
}

/** 清空本地用户数据（保留默认管理员） */
export function clearAllUsers(): void {
  const wal: string[] = wx.getStorageSync(USER_WAL_KEY) || []
  for (const id of wal) {
    if (id) {
      wx.removeStorageSync(USER_RECORD_PREFIX + id)
    }
  }
  wx.removeStorageSync(USER_WAL_KEY)
  wx.removeStorageSync(MOCK_USERS_KEY)

  const defaultAdmin = createDefaultAdmin()
  saveUserRecord(defaultAdmin)
  saveMockUsers([defaultAdmin])
}

export function deleteUser(userId: string): boolean {
  return removeUsersFromRegistryLocal([userId]) > 0
}

export async function deleteUsers(userIds: string[]): Promise<number> {
  const count = removeUsersFromRegistryLocal(userIds)
  if (count > 0 && isUserApiEnabled()) {
    try {
      await deleteRemoteUsers(userIds)
    } catch (e) {
      console.warn('[user] remote delete failed, kept local tombstone', e)
    }
  }
  return count
}

export async function batchUpdateRole(
  userIds: string[],
  role: UserRole,
  add: boolean = true
): Promise<number> {
  let count = 0

  for (const userId of userIds) {
    const user = getUserById(userId)
    if (!user) continue

    const roles = Array.isArray(user.roles) ? [...user.roles] : ['member']
    let nextRoles: UserRole[] | null = null

    if (add) {
      if (!roles.includes(role)) {
        nextRoles = [...roles, role]
      }
    } else {
      const index = roles.indexOf(role)
      if (index !== -1 && roles.length > 1) {
        nextRoles = roles.filter((r) => r !== role)
      }
    }

    if (!nextRoles) continue

    const saved = await updateUser(userId, { roles: nextRoles })
    if (saved) count++
  }

  return count
}

export async function batchUpdateMemberLevel(
  userIds: string[],
  level: MemberLevel
): Promise<number> {
  let count = 0

  for (const userId of userIds) {
    const saved = await updateUser(userId, { memberLevel: level })
    if (saved) count++
  }

  return count
}

export function batchAddUsers(newUsers: Omit<User, 'userId' | 'passwordSalt' | 'passwordHash' | 'registerTime' | 'lastPasswordChangeTime'>[]): User[] {
  const createdUsers: User[] = []
  
  newUsers.forEach(userData => {
    const salt = generateSalt()
    const passwordHash = hashPassword('123456', salt)
    
    const newUser: User = {
      ...userData,
      userId: generateUserId(),
      passwordSalt: salt,
      passwordHash: passwordHash,
      registerTime: Date.now(),
      lastPasswordChangeTime: Date.now()
    }
    
    const created = upsertUserInStorage(newUser)
    createdUsers.push(created)
  })

  return createdUsers
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export interface ModuleConfig {
  id: string
  name: string
  icon: string
  enabled: boolean
  permissions: Record<PermissionAction, boolean>
}

export interface RolePermission {
  role: UserRole
  modules: Record<string, Record<PermissionAction, boolean>>
}

export interface HomePageConfig {
  moduleId: string
  enabled: boolean
  permissions: Record<PermissionAction, boolean>
}

const MODULE_CONFIGS_KEY = 'member_module_configs'

const DefaultModuleConfigs: ModuleConfig[] = [
  { id: 'dashboard', name: '仪表盘', icon: '📊', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'user_management', name: '用户管理', icon: '👥', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'role_management', name: '角色管理', icon: '🎭', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'order_management', name: '订单管理', icon: '📋', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'points_management', name: '积分管理', icon: '⭐', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'system_settings', name: '系统设置', icon: '⚙️', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'profile', name: '个人资料', icon: '👤', enabled: true, permissions: { view: true, create: true, edit: true, delete: false } },
  { id: 'orders', name: '我的订单', icon: '🛒', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'points', name: '积分中心', icon: '💰', enabled: true, permissions: { view: true, create: true, edit: true, delete: false } },
  { id: 'settings', name: '个人设置', icon: '⚙️', enabled: true, permissions: { view: true, create: true, edit: true, delete: false } },
  { id: 'travel', name: '自驾游', icon: '🚗', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'travellog', name: '旅行记', icon: '📝', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { id: 'health', name: '健康检测', icon: '🏥', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } }
]

function getStoredModuleConfigs(): ModuleConfig[] {
  try {
    const stored = wx.getStorageSync(MODULE_CONFIGS_KEY)
    if (stored) {
      const storedConfigs = JSON.parse(stored)
      return DefaultModuleConfigs.map(defaultConfig => {
        const storedConfig = storedConfigs.find((s: ModuleConfig) => s.id === defaultConfig.id)
        return storedConfig ? storedConfig : defaultConfig
      })
    }
  } catch (e) {
    console.error('Failed to load module configs:', e)
  }
  return JSON.parse(JSON.stringify(DefaultModuleConfigs))
}

function saveModuleConfigs(configs: ModuleConfig[]): void {
  try {
    wx.setStorageSync(MODULE_CONFIGS_KEY, JSON.stringify(configs))
  } catch (e) {
    console.error('Failed to save module configs:', e)
  }
}

export const ModuleConfigs: ModuleConfig[] = getStoredModuleConfigs()

export function saveModuleConfigsToStorage(configs: ModuleConfig[]): void {
  configs.forEach(config => {
    const index = ModuleConfigs.findIndex(m => m.id === config.id)
    if (index !== -1) {
      ModuleConfigs[index] = config
    }
  })
  saveModuleConfigs(ModuleConfigs)
}

const DefaultRolePermissionConfigs: Record<string, Record<string, Record<PermissionAction, boolean>>> = {
  admin: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    user_management: { view: true, create: true, edit: true, delete: true },
    role_management: { view: true, create: true, edit: true, delete: true },
    order_management: { view: true, create: true, edit: true, delete: true },
    points_management: { view: true, create: true, edit: true, delete: true },
    system_settings: { view: true, create: true, edit: true, delete: true },
    profile: { view: true, create: true, edit: true, delete: false },
    orders: { view: true, create: true, edit: true, delete: true },
    points: { view: true, create: true, edit: true, delete: false },
    settings: { view: true, create: true, edit: true, delete: false },
    travel: { view: true, create: true, edit: true, delete: true },
    health: { view: true, create: true, edit: true, delete: true }
  },
  member: {
    dashboard: { view: false, create: false, edit: false, delete: false },
    user_management: { view: false, create: false, edit: false, delete: false },
    role_management: { view: false, create: false, edit: false, delete: false },
    order_management: { view: false, create: false, edit: false, delete: false },
    points_management: { view: false, create: false, edit: false, delete: false },
    system_settings: { view: false, create: false, edit: false, delete: false },
    profile: { view: true, create: false, edit: true, delete: false },
    orders: { view: true, create: true, edit: true, delete: false },
    points: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, create: false, edit: true, delete: false },
    travel: { view: true, create: true, edit: true, delete: true },
    travellog: { view: true, create: true, edit: true, delete: true },
    health: { view: true, create: true, edit: true, delete: true }
  },
  guest: {
    dashboard: { view: false, create: false, edit: false, delete: false },
    user_management: { view: false, create: false, edit: false, delete: false },
    role_management: { view: false, create: false, edit: false, delete: false },
    order_management: { view: false, create: false, edit: false, delete: false },
    points_management: { view: false, create: false, edit: false, delete: false },
    system_settings: { view: false, create: false, edit: false, delete: false },
    profile: { view: false, create: false, edit: false, delete: false },
    orders: { view: false, create: false, edit: false, delete: false },
    points: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    travel: { view: false, create: false, edit: false, delete: false },
    health: { view: false, create: false, edit: false, delete: false }
  }
}

function getStoredRolePermissions(): Record<string, Record<string, Record<PermissionAction, boolean>>> {
  try {
    const stored = wx.getStorageSync(ROLE_PERMISSIONS_KEY)
    if (stored) {
      const storedConfigs = JSON.parse(stored) as Record<
        string,
        Record<string, Record<PermissionAction, boolean>>
      >
      const result = JSON.parse(JSON.stringify(DefaultRolePermissionConfigs)) as Record<
        string,
        Record<string, Record<PermissionAction, boolean>>
      >
      Object.keys(storedConfigs).forEach((roleKey) => {
        if (!result[roleKey]) result[roleKey] = {}
        Object.keys(storedConfigs[roleKey] || {}).forEach((modId) => {
          result[roleKey][modId] = {
            ...(DefaultRolePermissionConfigs[roleKey]?.[modId] || {
              view: false,
              create: false,
              edit: false,
              delete: false
            }),
            ...storedConfigs[roleKey][modId]
          }
        })
      })
      return result
    }
  } catch (e) {
    console.error('Failed to load role permissions:', e)
  }
  return JSON.parse(JSON.stringify(DefaultRolePermissionConfigs))
}

/** 修复旧版「会员无任何模块权限」的本地缓存 */
export function repairDefaultMemberPermissions(): void {
  const perms = getStoredRolePermissions()
  if (perms.member?.travel?.view) return
  perms.member = JSON.parse(JSON.stringify(DefaultRolePermissionConfigs.member))
  saveRolePermissions(perms)
}

function saveRolePermissions(configs: Record<string, Record<string, Record<PermissionAction, boolean>>>): void {
  try {
    wx.setStorageSync(ROLE_PERMISSIONS_KEY, JSON.stringify(configs))
  } catch (e) {
    console.error('Failed to save role permissions:', e)
  }
}

export function getRolePermissionConfigs(): Record<string, Record<string, Record<PermissionAction, boolean>>> {
  return getStoredRolePermissions()
}

export function saveRolePermissionsToConfig(roleKey: string, permissions: Record<string, Record<PermissionAction, boolean>>): void {
  const currentConfigs = getStoredRolePermissions()
  currentConfigs[roleKey] = permissions
  saveRolePermissions(currentConfigs)
}

export function removeRolePermissionsFromConfig(roleKey: string): void {
  const currentConfigs = getStoredRolePermissions()
  delete currentConfigs[roleKey]
  saveRolePermissions(currentConfigs)
}

const HOME_PAGE_CONFIGS_KEY = 'member_homepage_configs'

const DefaultHomePageConfigs: HomePageConfig[] = [
  { moduleId: 'dashboard', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'user_management', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'role_management', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'order_management', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'points_management', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'system_settings', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'profile', enabled: true, permissions: { view: true, create: false, edit: true, delete: false } },
  { moduleId: 'orders', enabled: true, permissions: { view: true, create: true, edit: true, delete: false } },
  { moduleId: 'points', enabled: true, permissions: { view: true, create: false, edit: false, delete: false } },
  { moduleId: 'settings', enabled: true, permissions: { view: true, create: false, edit: true, delete: false } },
  { moduleId: 'travel', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'travellog', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } },
  { moduleId: 'health', enabled: true, permissions: { view: true, create: true, edit: true, delete: true } }
]

function getStoredHomePageConfigs(): HomePageConfig[] {
  try {
    const stored = wx.getStorageSync(HOME_PAGE_CONFIGS_KEY)
    if (stored) {
      const storedConfigs = JSON.parse(stored)
      return DefaultHomePageConfigs.map(defaultConfig => {
        const storedConfig = storedConfigs.find((s: HomePageConfig) => s.moduleId === defaultConfig.moduleId)
        return storedConfig ? storedConfig : defaultConfig
      })
    }
  } catch (e) {
    console.error('Failed to load homepage configs:', e)
  }
  return JSON.parse(JSON.stringify(DefaultHomePageConfigs))
}

function saveHomePageConfigs(configs: HomePageConfig[]): void {
  try {
    wx.setStorageSync(HOME_PAGE_CONFIGS_KEY, JSON.stringify(configs))
  } catch (e) {
    console.error('Failed to save homepage configs:', e)
  }
}

export const HomePageConfigs: HomePageConfig[] = getStoredHomePageConfigs()

export function saveHomePageConfigsToStorage(configs: HomePageConfig[]): void {
  configs.forEach(config => {
    const index = HomePageConfigs.findIndex(h => h.moduleId === config.moduleId)
    if (index !== -1) {
      HomePageConfigs[index] = config
    }
  })
  saveHomePageConfigs(HomePageConfigs)
}

function checkModuleConfigPermission(moduleId: string, action: PermissionAction): boolean {
  const moduleConfig = ModuleConfigs.find(m => m.id === moduleId)
  return moduleConfig?.enabled && moduleConfig.permissions[action] === true
}

function checkRolePermission(userId: string, moduleId: string, action: PermissionAction): boolean {
  const user = getUserById(userId)
  if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return false

  for (const role of user.roles) {
    if (hasPermission(role, 'all')) return true
  }

  const latestPermissions = getStoredRolePermissions()

  for (const role of user.roles) {
    const rolePermissions = latestPermissions[role]
    if (rolePermissions?.[moduleId]?.[action]) {
      return true
    }
  }

  return false
}

function checkHomePagePermission(moduleId: string, action: PermissionAction): boolean {
  const homeConfig = HomePageConfigs.find(h => h.moduleId === moduleId)
  return homeConfig?.enabled && homeConfig.permissions[action] === true
}

export function checkModulePermission(userId: string, moduleId: string, action: PermissionAction): boolean {
  const user = getUserById(userId)
  if (!user) return false
  
  const moduleAllowed = checkModuleConfigPermission(moduleId, action)
  const roleAllowed = checkRolePermission(userId, moduleId, action)
  const homeAllowed = checkHomePagePermission(moduleId, action)
  
  return moduleAllowed && roleAllowed && homeAllowed
}

export function checkAllModulePermissions(userId: string, moduleId: string): { view: boolean; create: boolean; edit: boolean; delete: boolean } {
  return {
    view: checkModulePermission(userId, moduleId, 'view'),
    create: checkModulePermission(userId, moduleId, 'create'),
    edit: checkModulePermission(userId, moduleId, 'edit'),
    delete: checkModulePermission(userId, moduleId, 'delete')
  }
}