/**
 * 用户数据云端同步（配置 auth.baseUrl 后启用，支持多手机共享用户列表）
 */
import { API_CONFIG } from '../config/api'
import type { User } from './user'

function getBaseUrl(): string {
  return (API_CONFIG.auth?.baseUrl || '').trim().replace(/\/$/, '')
}

export function isUserApiEnabled(): boolean {
  return !!getBaseUrl()
}

function request<T>(path: string, method: 'GET' | 'POST', data?: unknown): Promise<T> {
  const base = getBaseUrl()
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}${path}`,
      method,
      data: data as WechatMiniprogram.IAnyObject,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const body = res.data as { users?: User[]; user?: User; message?: string }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body as T)
          return
        }
        reject(new Error(body?.message || `请求失败(${res.statusCode})`))
      },
      fail: () => reject(new Error('网络异常，请检查 auth.baseUrl 与服务器域名配置'))
    })
  })
}

/** 从服务端拉取全部用户 */
export async function fetchRemoteUsers(): Promise<User[]> {
  const res = await request<{ users: User[] }>('/api/users', 'GET')
  return Array.isArray(res.users) ? res.users : []
}

/** 将用户同步到服务端 */
export async function pushUserToRemote(user: User): Promise<User> {
  const res = await request<{ user: User }>('/api/users/upsert', 'POST', user)
  return res.user || user
}
