/**
 * 微信云托管内网调用（无需配置 request 合法域名）
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrunguide/
 */
import { API_CONFIG } from '../config/api'

export function isCloudRunEnabled(): boolean {
  const auth = API_CONFIG.auth
  return !!(auth?.useCloudRun && auth?.cloudService?.trim())
}

function getCloudService(): string {
  return (API_CONFIG.auth?.cloudService || '').trim()
}

function getCloudEnv(): string | undefined {
  const env = (API_CONFIG.auth?.cloudEnv || '').trim()
  return env || undefined
}

export function isRemoteApiEnabled(): boolean {
  return isCloudRunEnabled() || !!(API_CONFIG.auth?.baseUrl || '').trim()
}

/** 云托管 / HTTPS 统一请求 */
export function remoteRequest<T>(
  path: string,
  method: 'GET' | 'POST',
  data?: unknown
): Promise<T> {
  if (isCloudRunEnabled()) {
    return callContainer<T>(path, method, data)
  }

  const base = (API_CONFIG.auth?.baseUrl || '').trim().replace(/\/$/, '')
  if (!base) {
    return Promise.reject(new Error('未配置云托管或 auth.baseUrl'))
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}${path}`,
      method,
      data: data as WechatMiniprogram.IAnyObject,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const body = res.data as T & { message?: string }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body)
          return
        }
        reject(new Error((body as { message?: string })?.message || `请求失败(${res.statusCode})`))
      },
      fail: () => reject(new Error('网络异常，请检查服务端配置'))
    })
  })
}

function callContainer<T>(path: string, method: 'GET' | 'POST', data?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!wx.cloud?.callContainer) {
      reject(new Error('当前基础库不支持云托管，请升级微信版本或检查是否已关联云环境'))
      return
    }

    const config: WechatMiniprogram.CloudConfig = {}
    const cloudEnv = getCloudEnv()
    if (cloudEnv) {
      config.env = cloudEnv
    }

    wx.cloud.callContainer({
      config,
      path,
      method,
      header: {
        'X-WX-SERVICE': getCloudService(),
        'content-type': 'application/json'
      },
      data: data as WechatMiniprogram.IAnyObject,
      success: (res) => {
        const body = (res.data || {}) as T & { message?: string }
        const code = res.statusCode || 0
        if (code >= 200 && code < 300) {
          resolve(body)
          return
        }
        reject(new Error(body?.message || `云托管请求失败(${code})`))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '云托管调用失败，请确认服务已部署且服务名正确'))
      }
    })
  })
}
