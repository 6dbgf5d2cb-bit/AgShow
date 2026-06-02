/**
 * 将旅行记同步为关联公众号图文草稿（需配置 MP_APPID、MP_APP_SECRET）
 */
const { weixinUrl, wxHttpRequest } = require('./wx-http')

const MP_APPID = process.env.MP_APPID || ''
const MP_SECRET = process.env.MP_APP_SECRET || process.env.MP_SECRET || ''
const MINI_APPID = process.env.WX_APPID || ''

let mpToken = ''
let mpTokenExpireAt = 0

async function getMpAccessToken() {
  if (!MP_APPID || !MP_SECRET) {
    throw new Error('未配置公众号 MP_APPID / MP_APP_SECRET，无法同步到公众号')
  }
  if (mpToken && Date.now() < mpTokenExpireAt) return mpToken
  const url = weixinUrl(
    `/cgi-bin/token?grant_type=client_credential&appid=${MP_APPID}&secret=${MP_SECRET}`
  )
  const res = await wxHttpRequest(url)
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(data.errmsg || '获取公众号 access_token 失败')
  }
  mpToken = data.access_token
  mpTokenExpireAt = Date.now() + (data.expires_in - 300) * 1000
  return mpToken
}

async function downloadBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`下载图片失败: ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 100) throw new Error('图片数据无效')
  return buf
}

async function uploadThumbMaterial(token, imageBuffer) {
  const form = new FormData()
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
  form.append('media', blob, 'cover.jpg')
  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=thumb`
  const res = await fetch(url, { method: 'POST', body: form })
  const data = await res.json()
  if (!data.media_id) {
    throw new Error(data.errmsg || '上传封面失败')
  }
  return data.media_id
}

async function uploadContentImage(token, imageBuffer) {
  const form = new FormData()
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
  form.append('media', blob, 'img.jpg')
  const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`
  const res = await fetch(url, { method: 'POST', body: form })
  const data = await res.json()
  if (!data.url) {
    throw new Error(data.errmsg || '上传正文图片失败')
  }
  return data.url
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildDigest(log) {
  const plain = String(log.content || '').replace(/\s+/g, ' ').trim()
  const digest = plain.slice(0, 120)
  return digest || log.title || '旅行记'
}

function buildArticleHtml(log, contentImageUrls, options) {
  const { authorName, miniAppId, miniPath } = options
  const parts = []

  if (authorName) {
    parts.push(`<p style="color:#888;font-size:14px;">作者：${escapeHtml(authorName)}</p>`)
  }
  if (log.location) {
    parts.push(`<p>📍 ${escapeHtml(log.location)}</p>`)
  }

  const paragraphs = String(log.content || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length) {
    paragraphs.forEach((p) => {
      parts.push(`<p>${escapeHtml(p)}</p>`)
    })
  } else {
    parts.push('<p>（无正文）</p>')
  }

  contentImageUrls.forEach((imgUrl) => {
    parts.push(`<p><img src="${imgUrl}" /></p>`)
  })

  if (log.tags && log.tags.length) {
    parts.push(
      `<p style="color:#666;">${log.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}</p>`
    )
  }

  if (miniAppId && miniPath) {
    parts.push(
      `<p><mp-miniprogram data-miniprogram-appid="${miniAppId}" data-miniprogram-path="${escapeHtml(miniPath)}" data-miniprogram-title="在小程序中阅读"></mp-miniprogram></p>`
    )
  }

  parts.push(
    '<p style="color:#999;font-size:12px;">本文由 AgShow 旅行记同步至公众号草稿，请在公众平台素材库审核后发布。</p>'
  )

  return parts.join('\n')
}

/**
 * @param {object} log 旅行记
 * @param {string[]} imageUrls 可公网访问的图片 HTTPS 地址（封面取第一张）
 * @param {{ authorName?: string }} meta
 */
async function createTravelLogDraft(log, imageUrls = [], meta = {}) {
  if (!log || !log.logId) throw new Error('logId required')
  const urls = (imageUrls || []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u))
  if (!urls.length) {
    throw new Error('请至少包含一张可访问的图片作为公众号封面（云存储图片需先上传成功）')
  }

  const token = await getMpAccessToken()
  const thumbBuf = await downloadBuffer(urls[0])
  const thumbMediaId = await uploadThumbMaterial(token, thumbBuf)

  const contentImageUrls = []
  for (let i = 0; i < Math.min(urls.length, 8); i++) {
    try {
      const buf = await downloadBuffer(urls[i])
      const wxUrl = await uploadContentImage(token, buf)
      contentImageUrls.push(wxUrl)
    } catch (e) {
      console.warn('[mp-article] skip image', urls[i], e.message)
    }
  }

  const miniPath = `pages/travellog-detail/travellog-detail?logId=${encodeURIComponent(log.logId)}`
  const html = buildArticleHtml(log, contentImageUrls, {
    authorName: meta.authorName || '',
    miniAppId: MINI_APPID,
    miniPath
  })

  const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`
  const draftRes = await fetch(draftUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articles: [
        {
          title: String(log.title || '旅行记').slice(0, 64),
          author: (meta.authorName || 'AgShow').slice(0, 16),
          digest: buildDigest(log),
          content: html,
          thumb_media_id: thumbMediaId,
          need_open_comment: 1,
          only_fans_can_comment: 0
        }
      ]
    })
  })
  const draftData = await draftRes.json()
  if (!draftData.media_id) {
    throw new Error(draftData.errmsg || '创建公众号草稿失败')
  }

  return {
    draftMediaId: draftData.media_id,
    message: '已生成公众号图文草稿，请登录微信公众平台 → 内容与互动 → 草稿箱 审核发布'
  }
}

function isMpShareConfigured() {
  return !!(MP_APPID && MP_SECRET)
}

module.exports = {
  createTravelLogDraft,
  isMpShareConfigured
}
