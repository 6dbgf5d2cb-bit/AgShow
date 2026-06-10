/**
 * 中医诊断 / 八字排盘 / 紫微斗数 使用次数统计与分享
 */
import type { BaZiResult, SymptomResult } from './health'
import type { ZiweiResult } from './ziwei-engine'
import { isRemoteApiEnabled, remoteRequest } from './cloud-request'

const USAGE_KEY = 'health_usage_stats'
const SHARE_PREFIX = 'health_share_'
const MAX_SHARE_AGE_MS = 30 * 24 * 60 * 60 * 1000

export interface HealthUsageStats {
  tcm: number
  bazi: number
  ziwei: number
  updatedAt: number
}

export interface HealthShareRecord {
  type: 'bazi' | 'symptom' | 'ziwei'
  title: string
  createdAt: number
  data: BaZiResult | SymptomResult | ZiweiResult
}

function readStats(): HealthUsageStats {
  try {
    const raw = wx.getStorageSync(USAGE_KEY) as HealthUsageStats
    if (raw && typeof raw.tcm === 'number' && typeof raw.bazi === 'number') {
      return { ...raw, ziwei: typeof raw.ziwei === 'number' ? raw.ziwei : 0 }
    }
  } catch {
    /* ignore */
  }
  return { tcm: 0, bazi: 0, ziwei: 0, updatedAt: Date.now() }
}

function writeStats(stats: HealthUsageStats): void {
  stats.updatedAt = Date.now()
  wx.setStorageSync(USAGE_KEY, stats)
}

export function getHealthUsageStats(): HealthUsageStats {
  return readStats()
}

export function incrementTcmUsage(): number {
  const stats = readStats()
  stats.tcm += 1
  writeStats(stats)
  return stats.tcm
}

export function incrementBaziUsage(): number {
  const stats = readStats()
  stats.bazi += 1
  writeStats(stats)
  return stats.bazi
}

export function incrementZiweiUsage(): number {
  const stats = readStats()
  stats.ziwei += 1
  writeStats(stats)
  return stats.ziwei
}

function makeShareId(type: 'bazi' | 'symptom' | 'ziwei'): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 保存可分享的结果，返回 shareId */
export function saveHealthSharePayload(
  type: 'bazi' | 'symptom' | 'ziwei',
  data: BaZiResult | SymptomResult | ZiweiResult,
  title?: string
): string {
  const shareId = makeShareId(type)
  let shareTitle = title?.trim() || ''
  if (!shareTitle) {
    if (type === 'bazi') {
      const b = data as BaZiResult
      shareTitle = `八字排盘 · ${b.originalDate || b.solarDate || '命理分析'}`
    } else if (type === 'ziwei') {
      const z = data as ZiweiResult
      shareTitle = `紫微斗数 · ${z.name || z.lunarDate || '命盘分析'}`
    } else {
      const s = data as SymptomResult
      shareTitle = s.patternSummary
        ? `中医诊断 · ${s.patternSummary.slice(0, 20)}`
        : '中医诊断结果'
    }
  }
  const record: HealthShareRecord = {
    type,
    title: shareTitle,
    createdAt: Date.now(),
    data
  }
  wx.setStorageSync(SHARE_PREFIX + shareId, record)
  return shareId
}

export function loadHealthSharePayload(shareId: string): HealthShareRecord | null {
  if (!shareId) return null
  try {
    const record = wx.getStorageSync(SHARE_PREFIX + shareId) as HealthShareRecord
    if (!record?.data || !record.type) return null
    if (Date.now() - (record.createdAt || 0) > MAX_SHARE_AGE_MS) {
      wx.removeStorageSync(SHARE_PREFIX + shareId)
      return null
    }
    return record
  } catch {
    return null
  }
}

export function buildHealthSharePath(type: 'bazi' | 'symptom', shareId: string): string {
  return `/pages/health-result/health-result?type=${type}&shareId=${encodeURIComponent(shareId)}`
}

export function buildZiweiSharePath(shareId: string): string {
  return `/pages/ziwei-result/ziwei-result?shareId=${encodeURIComponent(shareId)}`
}

/** 优先云端保存，便于好友打开；失败则仅存本机 */
export async function saveHealthSharePayloadAsync(
  type: 'bazi' | 'symptom' | 'ziwei',
  data: BaZiResult | SymptomResult | ZiweiResult,
  title?: string
): Promise<string> {
  const localId = saveHealthSharePayload(type, data, title)
  if (!isRemoteApiEnabled()) {
    return localId
  }
  try {
    const res = await remoteRequest<{ shareId: string }>('/api/health/share', 'POST', {
      type,
      title: title || '',
      data
    })
    if (res?.shareId) {
      wx.setStorageSync(SHARE_PREFIX + res.shareId, {
        type,
        title: title || '',
        createdAt: Date.now(),
        data
      })
      return res.shareId
    }
  } catch (e) {
    console.warn('[health-share] cloud save failed', e)
  }
  return localId
}

/** 优先从云端加载分享 */
export async function loadHealthSharePayloadAsync(
  shareId: string
): Promise<HealthShareRecord | null> {
  if (!shareId) return null
  if (isRemoteApiEnabled()) {
    try {
      const res = await remoteRequest<HealthShareRecord & { shareId?: string }>(
        `/api/health/share?id=${encodeURIComponent(shareId)}`,
        'GET'
      )
      if (res?.data && res.type) {
        const record: HealthShareRecord = {
          type: res.type,
          title: res.title || '',
          createdAt: res.createdAt || Date.now(),
          data: res.data
        }
        wx.setStorageSync(SHARE_PREFIX + shareId, record)
        return record
      }
    } catch (e) {
      console.warn('[health-share] cloud load failed', e)
    }
  }
  return loadHealthSharePayload(shareId)
}
