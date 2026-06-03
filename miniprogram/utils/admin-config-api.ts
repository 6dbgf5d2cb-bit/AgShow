/**
 * 管理后台系统配置云端同步（角色/模块/首页权限）
 */
import { isRemoteApiEnabled, remoteRequest } from './cloud-request'

export interface AdminSystemConfigPayload {
  updatedAt?: number
  adminManagedAt?: number
  roleConfig?: Record<string, { name: string; permissions: string[] }>
  rolePermissions?: Record<string, Record<string, Record<string, boolean>>>
  moduleConfigs?: unknown[]
  homePageConfigs?: unknown[]
  /** 首页快捷区展示的旅行记 ID */
  featuredTravellogId?: string
}

export async function fetchAdminSystemConfig(): Promise<AdminSystemConfigPayload> {
  const res = await remoteRequest<{ config: AdminSystemConfigPayload }>(
    '/api/admin/system-config',
    'GET'
  )
  return res.config || {}
}

export async function pushAdminSystemConfig(
  config: AdminSystemConfigPayload
): Promise<AdminSystemConfigPayload> {
  const res = await remoteRequest<{ config: AdminSystemConfigPayload }>(
    '/api/admin/system-config',
    'POST',
    config
  )
  return res.config || config
}

export function isAdminConfigApiEnabled(): boolean {
  return isRemoteApiEnabled()
}
