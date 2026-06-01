/**
 * 微信登录 / 手机号授权
 */
import { API_CONFIG } from '../config/api'
import { isRemoteApiEnabled, remoteRequest } from './cloud-request'

const DEVICE_WECHAT_OPENID_KEY = 'device_wechat_openid'
const DEVICE_BOUND_PHONE_KEY = 'device_bound_phone'

export function wxLoginAsync(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('微信登录失败，请重试'))
        }
      },
      fail: () => reject(new Error('无法连接微信登录服务'))
    })
  })
}

export function getUserProfileAsync(): Promise<{ nickName: string; avatarUrl: string }> {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        resolve({
          nickName: res.userInfo.nickName || '微信用户',
          avatarUrl: res.userInfo.avatarUrl || ''
        })
      },
      fail: () => reject(new Error('需要授权头像昵称才能完成微信登录'))
    })
  })
}

export function getStoredWechatOpenId(): string {
  return (wx.getStorageSync(DEVICE_WECHAT_OPENID_KEY) as string) || ''
}

/** 保存服务端 code2session 返回的真实 openId（重装小程序后靠此 + 云端恢复用户） */
export function setStoredWechatOpenId(openId: string): void {
  if (openId) {
    wx.setStorageSync(DEVICE_WECHAT_OPENID_KEY, openId)
  }
}

/** @deprecated 仅兼容旧代码；新登录必须走服务端 openId，勿再生成假 ID */
export function getLocalWechatOpenId(): string {
  const stored = getStoredWechatOpenId()
  if (stored) return stored
  const fallback = 'WX_LOCAL_' + Date.now().toString(36).toUpperCase()
  wx.setStorageSync(DEVICE_WECHAT_OPENID_KEY, fallback)
  return fallback
}

/** 演示环境：用授权 code 生成本机绑定号（真机真实号码必须走服务端解密） */
export function getLocalPhoneFromCode(phoneCode: string): string {
  let phone = wx.getStorageSync(DEVICE_BOUND_PHONE_KEY) as string
  if (phone) return phone

  let hash = 0
  for (let i = 0; i < phoneCode.length; i++) {
    hash = (hash << 5) - hash + phoneCode.charCodeAt(i)
    hash |= 0
  }
  const suffix = String(Math.abs(hash) % 100000000).padStart(8, '0')
  phone = '138' + suffix.slice(0, 8)
  wx.setStorageSync(DEVICE_BOUND_PHONE_KEY, phone)
  return phone
}

export function clearLocalBoundPhone(): void {
  wx.removeStorageSync(DEVICE_BOUND_PHONE_KEY)
}

/** 查询是否仍需用户授权隐私协议 */
export function queryPrivacyNeedAuthorization(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!wx.getPrivacySetting) {
      resolve(false)
      return
    }
    wx.getPrivacySetting({
      success: (res) => resolve(!!res.needAuthorization),
      fail: () => resolve(false)
    })
  })
}

/** 打开微信隐私保护指引页面 */
export function openPrivacyContract(): void {
  if (wx.openPrivacyContract) {
    wx.openPrivacyContract({
      fail: () => {
        wx.showToast({ title: '暂无法打开隐私指引', icon: 'none' })
      }
    })
    return
  }
  wx.showToast({ title: '请升级微信版本后查看隐私指引', icon: 'none' })
}

function friendlyRemoteError(message: string, fallback: string): string {
  const m = message || ''
  if (m.indexOf('fetch failed') !== -1) {
    return '无法连接云托管，请检查服务是否已发布、环境 ID 与服务名是否正确'
  }
  if (m.indexOf('WX_APPID') !== -1 || m.indexOf('WX_SECRET') !== -1) {
    return m
  }
  return m || fallback
}

/** 解析手机号授权失败原因 */
export function parsePhoneAuthError(detail: {
  errMsg?: string
  errno?: number
}): string {
  const errMsg = detail.errMsg || ''
  const errno = detail.errno

  if (errno === 1400001 || errMsg.indexOf('no permission') !== -1) {
    return '小程序需完成企业认证并开通「手机号快速验证」后才能一键登录'
  }
  if (errMsg.indexOf('deny') !== -1 || errMsg.indexOf('cancel') !== -1) {
    return '您已取消授权手机号'
  }
  if (errMsg.indexOf('privacy') !== -1 || errMsg.indexOf('authorize') !== -1) {
    return '请先阅读并同意隐私政策后再授权手机号'
  }
  if (errMsg.indexOf('fail') !== -1) {
    return '当前环境无法获取手机号（模拟器不支持，请用真机调试）'
  }
  return '获取手机号失败，请使用下方手机号登录'
}

export function isPhoneAuthSuccess(detail: { errMsg?: string; code?: string }): boolean {
  return !!(detail.code && (detail.errMsg?.indexOf('ok') !== -1 || detail.errMsg === 'getPhoneNumber:ok'))
}

export interface ServerWechatLoginRes {
  openId: string
  unionId?: string
}

export interface ServerPhoneLoginRes {
  phone: string
  openId?: string
}

export async function fetchWechatSession(wxCode: string): Promise<ServerWechatLoginRes | null> {
  if (!isRemoteApiEnabled()) return null

  const data = await remoteRequest<{ openId?: string; unionId?: string; message?: string }>(
    '/auth/wechat',
    'POST',
    { code: wxCode }
  )
  if (data?.openId) {
    return { openId: data.openId, unionId: data.unionId }
  }
  throw new Error(friendlyRemoteError(data?.message || '', '服务端微信登录失败'))
}

export async function fetchPhoneNumber(
  phoneCode: string,
  _wxCode?: string
): Promise<ServerPhoneLoginRes | null> {
  if (!isRemoteApiEnabled()) return null

  const data = await remoteRequest<{ phone?: string; openId?: string; message?: string }>(
    '/auth/phone',
    'POST',
    { code: phoneCode }
  )
  if (data?.phone) {
    return { phone: data.phone, openId: data.openId }
  }
  throw new Error(friendlyRemoteError(data?.message || '', '服务端解密手机号失败'))
}

/** 是否已配置云端（云托管或 HTTPS） */
export function hasRemoteAuth(): boolean {
  return isRemoteApiEnabled()
}
