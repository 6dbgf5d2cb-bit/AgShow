/**
 * 微信云托管数据同步：用户、旅行记、自驾游
 */
import { isContentApiEnabled } from './content-api'
import { pullRemoteLogsAndMerge } from './travellog'
import { pullRemoteRoutesAndMerge } from './travel'
import { isUserApiEnabled, pullRemoteUsersAndMerge } from './user'

export function isCloudBackendEnabled(): boolean {
  return isUserApiEnabled() || isContentApiEnabled()
}

/** 从云托管拉取用户 + 旅行记 + 自驾游，合并到本机（重装/换机后恢复） */
export async function syncAllFromCloud(): Promise<void> {
  const errors: string[] = []

  if (isUserApiEnabled()) {
    try {
      await pullRemoteUsersAndMerge()
    } catch (e) {
      errors.push('用户')
      console.warn('[cloud-sync] pull users failed', e)
    }
  }

  if (isContentApiEnabled()) {
    try {
      await pullRemoteLogsAndMerge()
    } catch (e) {
      errors.push('旅行记')
      console.warn('[cloud-sync] pull logs failed', e)
    }
    try {
      await pullRemoteRoutesAndMerge()
    } catch (e) {
      errors.push('自驾游')
      console.warn('[cloud-sync] pull routes failed', e)
    }
  }

  if (errors.length > 0) {
    throw new Error(`同步失败：${errors.join('、')}，请检查云托管服务是否已部署`)
  }
}
