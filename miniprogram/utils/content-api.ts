/**
 * 自驾游 / 旅行记 云端同步（与用户数据共用微信云托管 express 服务）
 * 数据持久化在服务端 data/travel_routes.json、data/travel_logs.json
 */
import { isRemoteApiEnabled, remoteRequest } from './cloud-request'
import type { TravelRoute } from './travel'
import type { TravelLog } from './travellog'

export function isContentApiEnabled(): boolean {
  return isRemoteApiEnabled()
}

export async function fetchRemoteRoutes(): Promise<TravelRoute[]> {
  const res = await remoteRequest<{ routes: TravelRoute[] }>('/api/travel/routes', 'GET')
  return Array.isArray(res.routes) ? res.routes : []
}

export async function pushRouteToRemote(route: TravelRoute): Promise<TravelRoute> {
  const res = await remoteRequest<{ route: TravelRoute }>('/api/travel/routes/upsert', 'POST', route)
  return res.route || route
}

export async function fetchRemoteLogs(): Promise<TravelLog[]> {
  const res = await remoteRequest<{ logs: TravelLog[] }>('/api/travel/logs', 'GET')
  return Array.isArray(res.logs) ? res.logs : []
}

export async function pushLogToRemote(log: TravelLog): Promise<TravelLog> {
  const res = await remoteRequest<{ log: TravelLog }>('/api/travel/logs/upsert', 'POST', log)
  return res.log || log
}

export function contentRevision(item: { updateTime?: number; publishTime?: number }): number {
  return item.updateTime || item.publishTime || 0
}

export interface ShareLogToMpResult {
  draftMediaId?: string
  message: string
  configured?: boolean
}

export async function fetchMpShareConfig(): Promise<{ shareToMpEnabled: boolean }> {
  try {
    return await remoteRequest<{ shareToMpEnabled: boolean }>('/api/travel/mp-config', 'GET')
  } catch {
    return { shareToMpEnabled: false }
  }
}

/** 将旅行记生成关联公众号图文草稿（需服务端配置公众号密钥） */
export async function shareLogToOfficialAccount(params: {
  logId: string
  userId: string
  authorName?: string
  imageUrls: string[]
  log?: TravelLog
}): Promise<ShareLogToMpResult> {
  return remoteRequest<ShareLogToMpResult>('/api/travel/logs/share-to-mp', 'POST', {
    logId: params.logId,
    userId: params.userId,
    authorName: params.authorName,
    imageUrls: params.imageUrls,
    log: params.log
  })
}
