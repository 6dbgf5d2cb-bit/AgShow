/**
 * 自驾游 / 旅行记 云端同步（与用户数据共用云托管）
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
