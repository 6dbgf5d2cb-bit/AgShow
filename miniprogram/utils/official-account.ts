import { API_CONFIG } from '../config/api'

/** 是否已配置公众号原始 ID（用于打开公众号主页） */
export function isOfficialAccountConfigured(): boolean {
  const oa = API_CONFIG.officialAccount
  return !!(oa?.enabled && oa.username)
}

/** 打开关联公众号主页（需用户已关注或从公众号场景进入过） */
export function openOfficialAccountProfile(): void {
  const username = API_CONFIG.officialAccount?.username
  if (!username) {
    wx.showToast({ title: '未配置关联公众号', icon: 'none' })
    return
  }
  wx.openOfficialAccountProfile({
    username,
    success: () => {},
    fail: () => {
      wx.showModal({
        title: '无法打开公众号',
        content: `请搜索「${API_CONFIG.officialAccount?.displayName || '公众号'}」关注后查看。`,
        showCancel: false
      })
    }
  })
}

export function getOfficialAccountDisplayName(): string {
  return API_CONFIG.officialAccount?.displayName || '关联公众号'
}
