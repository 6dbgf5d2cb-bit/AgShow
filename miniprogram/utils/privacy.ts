/**
 * 用户隐私保护指引（配合 app.json 的 __usePrivacyCheck__）
 * 说明：backgroundfetch privacy fail 多为微信底层预拉取校验日志，通常可忽略。
 */

let privacyHandlerRegistered = false

export function initPrivacyAuthorization(): void {
  if (privacyHandlerRegistered) return
  privacyHandlerRegistered = true

  if (typeof wx.onNeedPrivacyAuthorization === 'function') {
    wx.onNeedPrivacyAuthorization((resolve) => {
      wx.showModal({
        title: '隐私保护提示',
        content: '请阅读并同意《用户隐私保护指引》后继续使用',
        confirmText: '去查看',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm && wx.openPrivacyContract) {
            wx.openPrivacyContract({
              success: () => resolve({ event: 'agree' }),
              fail: () => resolve({ event: 'disagree' })
            })
          } else {
            resolve({ event: 'disagree' })
          }
        },
        fail: () => resolve({ event: 'disagree' })
      })
    })
  }
}

export function logPrivacySettingOnLaunch(): void {
  if (!wx.getPrivacySetting) return
  wx.getPrivacySetting({
    success: (res) => {
      if (res.needAuthorization) {
        console.info('[privacy] 需在页面内完成用户隐私授权（登录页已提供勾选）')
      }
    }
  })
}
