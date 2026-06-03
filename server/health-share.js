/**
 * 中医诊断 / 八字排盘 结果分享（云端存储，好友可打开）
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const SHARE_FILE = path.join(DATA_DIR, 'health_shares.json')
const MAX_SHARE_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MAX_SHARES = 500

function loadShares() {
  try {
    const raw = fs.readFileSync(SHARE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveShares(map) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(SHARE_FILE, JSON.stringify(map, null, 2), 'utf8')
}

function pruneShares(map) {
  const now = Date.now()
  const keys = Object.keys(map)
  for (const k of keys) {
    const item = map[k]
    if (!item || now - (item.createdAt || 0) > MAX_SHARE_AGE_MS) {
      delete map[k]
    }
  }
  const rest = Object.keys(map)
  if (rest.length > MAX_SHARES) {
    rest
      .sort((a, b) => (map[a].createdAt || 0) - (map[b].createdAt || 0))
      .slice(0, rest.length - MAX_SHARES)
      .forEach((k) => delete map[k])
  }
}

function makeShareId(type) {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function createHealthShare(body) {
  const type = body.type === 'symptom' ? 'symptom' : 'bazi'
  if (!body.data || typeof body.data !== 'object') {
    throw new Error('缺少分享数据')
  }
  const map = loadShares()
  pruneShares(map)
  const shareId = makeShareId(type)
  const title =
    (body.title && String(body.title).trim()) ||
    (type === 'bazi' ? '八字排盘结果' : '中医诊断结果')
  map[shareId] = {
    type,
    title,
    data: body.data,
    createdAt: Date.now()
  }
  saveShares(map)
  return { shareId, type, title, createdAt: map[shareId].createdAt }
}

function getHealthShare(shareId) {
  if (!shareId) return null
  const map = loadShares()
  const item = map[shareId]
  if (!item) return null
  if (Date.now() - (item.createdAt || 0) > MAX_SHARE_AGE_MS) {
    delete map[shareId]
    saveShares(map)
    return null
  }
  return item
}

module.exports = { createHealthShare, getHealthShare }
