/**
 * 用户数据云端同步（云托管 / HTTPS，多设备共享用户列表）
 */
import { isRemoteApiEnabled, remoteRequest } from './cloud-request'
import type { User } from './user'

export function isUserApiEnabled(): boolean {
  return isRemoteApiEnabled()
}

/** 从服务端拉取全部用户 */
export async function fetchRemoteUsers(): Promise<User[]> {
  const res = await remoteRequest<{ users: User[] }>('/api/users', 'GET')
  return Array.isArray(res.users) ? res.users : []
}

/** 按 openId / 手机号 / 用户名查询云端用户（重装后恢复账号） */
export async function fetchRemoteUserLookup(params: {
  openId?: string
  phone?: string
  username?: string
}): Promise<User | null> {
  const qs: string[] = []
  if (params.openId) qs.push(`openId=${encodeURIComponent(params.openId)}`)
  if (params.phone) qs.push(`phone=${encodeURIComponent(params.phone)}`)
  if (params.username) qs.push(`username=${encodeURIComponent(params.username)}`)
  if (!qs.length) return null
  const res = await remoteRequest<{ user: User | null }>(
    `/api/users/lookup?${qs.join('&')}`,
    'GET'
  )
  return res.user || null
}

/** 将用户同步到服务端 */
export async function pushUserToRemote(user: User): Promise<User> {
  const res = await remoteRequest<{ user: User }>('/api/users/upsert', 'POST', user)
  return res.user || user
}

/** 从服务端删除用户 */
export async function deleteRemoteUsers(userIds: string[]): Promise<number> {
  if (!userIds.length) return 0
  const res = await remoteRequest<{ deleted: number }>('/api/users/delete', 'POST', { userIds })
  return res.deleted ?? userIds.length
}
