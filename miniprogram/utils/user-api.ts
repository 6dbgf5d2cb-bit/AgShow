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

/** 将用户同步到服务端 */
export async function pushUserToRemote(user: User): Promise<User> {
  const res = await remoteRequest<{ user: User }>('/api/users/upsert', 'POST', user)
  return res.user || user
}
