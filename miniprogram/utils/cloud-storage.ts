/**
 * 微信云存储上传（与用户/内容共用 cloudEnv）
 *
 * 控制台：云开发 → 存储 → 权限建议「所有用户可读，登录用户可写」，
 * 否则其他用户无法看到 cloud:// 图片。
 */
import { isCloudRunEnabled } from './cloud-request'

export function isCloudStorageEnabled(): boolean {
  const cloud = wx.cloud as { uploadFile?: unknown; getTempFileURL?: unknown } | undefined
  return isCloudRunEnabled() && !!cloud?.uploadFile
}

/** 已是云文件或公网 URL，无需再上传 */
export function isPersistedMediaUrl(url: string): boolean {
  if (!url) return false
  return (
    url.startsWith('cloud://') ||
    url.startsWith('https://') ||
    url.startsWith('http://') && !url.includes('tmp')
  )
}

/** 本地临时路径，需上传云存储 */
export function isLocalMediaPath(path: string): boolean {
  if (!path || isPersistedMediaUrl(path)) return false
  return (
    path.startsWith('wxfile://') ||
    path.startsWith('http://tmp') ||
    path.startsWith('https://tmp') ||
    !path.startsWith('http')
  )
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10)
}

function fileExt(path: string): string {
  const match = path.match(/\.([a-zA-Z0-9]+)(\?|$)/)
  const ext = match ? match[1].toLowerCase() : 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov']
  return allowed.includes(ext) ? `.${ext}` : '.jpg'
}

function buildCloudPath(folder: string, localPath: string): string {
  return `agshow/${folder}/${Date.now()}_${randomSuffix()}${fileExt(localPath)}`
}

/** 上传单个文件到云存储，返回 fileID（cloud://） */
export function uploadFileToCloud(localPath: string, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!localPath) {
      reject(new Error('文件路径为空'))
      return
    }
    if (!isCloudStorageEnabled()) {
      reject(new Error('未启用云开发，请在 config/api.ts 配置 cloudEnv'))
      return
    }

    wx.cloud.uploadFile({
      cloudPath: buildCloudPath(folder, localPath),
      filePath: localPath,
      success: (res) => {
        if (res.fileID) {
          resolve(res.fileID)
          return
        }
        reject(new Error('上传成功但未返回 fileID'))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传到云存储失败'))
      }
    })
  })
}

/** 将本地路径转为云 fileID；已是 cloud:// / https 则原样返回 */
export async function ensureCloudMediaUrl(path: string, folder: string): Promise<string> {
  if (!path) return ''
  if (!isLocalMediaPath(path)) return path
  return uploadFileToCloud(path, folder)
}

/** 批量上传，保持顺序 */
export async function ensureCloudMediaUrls(paths: string[], folder: string): Promise<string[]> {
  const result: string[] = []
  for (const p of paths) {
    if (!p) continue
    result.push(await ensureCloudMediaUrl(p, folder))
  }
  return result
}

/** 将 cloud:// 批量转为 HTTPS 临时链接，便于各端 image 组件展示 */
export async function resolveMediaUrlMap(urls: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(urls.filter((u) => u && u.startsWith('cloud://')))]

  for (const u of urls) {
    if (u && !u.startsWith('cloud://')) map.set(u, u)
  }

  if (!unique.length) return map

  const cloud = wx.cloud as {
    getTempFileURL?: (opts: {
      fileList: string[]
      success?: (res: {
        fileList: Array<{ fileID: string; tempFileURL?: string; status: number }>
      }) => void
      fail?: (err: { errMsg?: string }) => void
    }) => void
  }

  if (!cloud?.getTempFileURL) {
    unique.forEach((id) => map.set(id, id))
    return map
  }

  await new Promise<void>((resolve) => {
    cloud.getTempFileURL!({
      fileList: unique,
      success: (res) => {
        res.fileList?.forEach((item) => {
          if (item.status === 0 && item.tempFileURL) {
            map.set(item.fileID, item.tempFileURL)
          } else {
            map.set(item.fileID, item.fileID)
          }
        })
        resolve()
      },
      fail: () => {
        unique.forEach((id) => map.set(id, id))
        resolve()
      }
    })
  })

  return map
}

export function applyResolvedUrl(url: string, resolved: Map<string, string>): string {
  if (!url) return url
  return resolved.get(url) || url
}

export async function resolveMediaUrls(urls: string[]): Promise<string[]> {
  const map = await resolveMediaUrlMap(urls)
  return urls.map((u) => applyResolvedUrl(u, map))
}
