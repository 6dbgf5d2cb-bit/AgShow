/**
 * AgShow API — 微信云托管 / 自建部署
 *
 * 环境变量：
 *   WX_APPID      小程序 AppID（云托管可自动注入）
 *   WX_SECRET     小程序 AppSecret
 *   PORT          监听端口，云托管默认 80
 *   DATA_DIR      用户数据目录，默认 ./data
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { createTravelLogDraft, isMpShareConfigured } = require('./mp-article')
const {
  handleSendResetCode,
  handleResetPassword,
  handleResetByWechatPhone
} = require('./password-reset')
const { mergeUserUpsert, mergeContentUpsert } = require('./admin-merge')
const { getSystemConfig, saveSystemConfig } = require('./system-config')

const APPID = process.env.WX_APPID || ''
const SECRET = process.env.WX_SECRET || ''
const PORT = Number(process.env.PORT || 80)
const HOST = process.env.HOST || '0.0.0.0'
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const ROUTES_FILE = path.join(DATA_DIR, 'travel_routes.json')
const LOGS_FILE = path.join(DATA_DIR, 'travel_logs.json')

let accessToken = ''
let tokenExpireAt = 0

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpireAt) return accessToken
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(data.errmsg || '获取 access_token 失败')
  }
  accessToken = data.access_token
  tokenExpireAt = Date.now() + (data.expires_in - 300) * 1000
  return accessToken
}

async function code2Session(code) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
  const res = await fetch(url)
  const data = await res.json()
  if (data.errcode) throw new Error(data.errmsg || 'code2Session 失败')
  return data
}

async function getPhoneByCode(phoneCode) {
  const token = await getAccessToken()
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: phoneCode })
  })
  const data = await res.json()
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || '解密手机号失败')
  }
  return data.phone_info?.purePhoneNumber || data.phone_info?.phoneNumber
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(JSON.stringify(data))
}

function getPathname(req) {
  return (req.url || '/').split('?')[0]
}

function getQuery(req) {
  const raw = req.url || ''
  const idx = raw.indexOf('?')
  if (idx < 0) return {}
  const out = {}
  for (const part of raw.slice(idx + 1).split('&')) {
    const [k, v] = part.split('=')
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return out
}

function loadUserMap() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveUserMap(map) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(map, null, 2), 'utf8')
}

function upsertUserInMap(user) {
  if (!user || !user.userId) {
    throw new Error('userId required')
  }
  const map = loadUserMap()
  const existing = map[user.userId]
  map[user.userId] = mergeUserUpsert(existing, user)
  saveUserMap(map)
  return map[user.userId]
}

function listAllUsers() {
  const map = loadUserMap()
  return Object.values(map).sort((a, b) => (b.registerTime || 0) - (a.registerTime || 0))
}

function loadIdMap(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveIdMap(filePath, map) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf8')
}

function upsertRouteInMap(route) {
  if (!route || !route.routeId) throw new Error('routeId required')
  const map = loadIdMap(ROUTES_FILE)
  const existing = map[route.routeId]
  map[route.routeId] = mergeContentUpsert(existing, route)
  saveIdMap(ROUTES_FILE, map)
  return map[route.routeId]
}

function listAllRoutes() {
  const map = loadIdMap(ROUTES_FILE)
  return Object.values(map).sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
}

function upsertLogInMap(log) {
  if (!log || !log.logId) throw new Error('logId required')
  const map = loadIdMap(LOGS_FILE)
  const existing = map[log.logId]
  map[log.logId] = mergeContentUpsert(existing, log)
  saveIdMap(LOGS_FILE, map)
  return map[log.logId]
}

function listAllLogs() {
  const map = loadIdMap(LOGS_FILE)
  return Object.values(map).sort((a, b) => (b.publishTime || 0) - (a.publishTime || 0))
}

function getLogById(logId) {
  const map = loadIdMap(LOGS_FILE)
  return map[logId] || null
}

function canUserShareLog(userId, log) {
  if (!userId || !log) return false
  const users = loadUserMap()
  const user = users[userId]
  if (!user) return false
  if (Array.isArray(user.roles) && user.roles.includes('admin')) return true
  return log.publisherId === userId
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-WX-SERVICE'
    })
    res.end()
    return
  }

  const pathname = getPathname(req)

  try {
    if (pathname === '/' || pathname === '/health') {
      send(res, 200, { ok: true, service: 'agshow-api' })
      return
    }

    const body = await readBody(req)

    if (pathname === '/auth/wechat' && req.method === 'POST') {
      const session = await code2Session(body.code)
      send(res, 200, { openId: session.openid, unionId: session.unionid })
      return
    }

    if (pathname === '/auth/phone' && req.method === 'POST') {
      const phone = await getPhoneByCode(body.code)
      send(res, 200, { phone })
      return
    }

    if (pathname === '/api/auth/send-reset-code' && req.method === 'POST') {
      const result = await handleSendResetCode(body, listAllUsers)
      send(res, 200, result)
      return
    }

    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const result = handleResetPassword(body, listAllUsers, upsertUserInMap)
      send(res, 200, result)
      return
    }

    if (pathname === '/api/auth/reset-password-phone' && req.method === 'POST') {
      let verifiedPhone = body.phone
      if (body.phoneCode) {
        verifiedPhone = await getPhoneByCode(body.phoneCode)
      }
      const result = handleResetByWechatPhone(
        body,
        listAllUsers,
        upsertUserInMap,
        verifiedPhone
      )
      send(res, 200, result)
      return
    }

    if (pathname === '/api/users' && req.method === 'GET') {
      send(res, 200, { users: listAllUsers() })
      return
    }

    if (pathname === '/api/users/lookup' && req.method === 'GET') {
      const q = getQuery(req)
      const users = listAllUsers()
      let user = null
      if (q.openId) {
        user = users.find((u) => u.wechatOpenId === q.openId) || null
      }
      if (!user && q.phone) {
        user = users.find((u) => u.phone === q.phone) || null
      }
      if (!user && q.username) {
        const key = String(q.username).toLowerCase()
        user = users.find((u) => (u.username || '').toLowerCase() === key) || null
      }
      send(res, 200, { user })
      return
    }

    if (pathname === '/api/users/upsert' && req.method === 'POST') {
      const user = upsertUserInMap(body)
      send(res, 200, { user })
      return
    }

    if (pathname === '/api/admin/system-config' && req.method === 'GET') {
      send(res, 200, { config: getSystemConfig() })
      return
    }

    if (pathname === '/api/admin/system-config' && req.method === 'POST') {
      const config = saveSystemConfig(body)
      send(res, 200, { config })
      return
    }

    if (pathname === '/api/users/delete' && req.method === 'POST') {
      const ids = Array.isArray(body.userIds) ? body.userIds : []
      const map = loadUserMap()
      let deleted = 0
      ids.forEach((id) => {
        if (id && map[id]) {
          delete map[id]
          deleted++
        }
      })
      saveUserMap(map)
      send(res, 200, { deleted })
      return
    }

    if (pathname === '/api/travel/routes' && req.method === 'GET') {
      send(res, 200, { routes: listAllRoutes() })
      return
    }

    if (pathname === '/api/travel/routes/upsert' && req.method === 'POST') {
      const route = upsertRouteInMap(body)
      send(res, 200, { route })
      return
    }

    if (pathname === '/api/travel/logs' && req.method === 'GET') {
      send(res, 200, { logs: listAllLogs() })
      return
    }

    if (pathname === '/api/travel/logs/upsert' && req.method === 'POST') {
      const log = upsertLogInMap(body)
      send(res, 200, { log })
      return
    }

    if (pathname === '/api/travel/logs/share-to-mp' && req.method === 'POST') {
      const logId = body.logId
      const userId = body.userId
      const log = getLogById(logId) || body.log
      if (!log || !log.logId) {
        send(res, 400, { message: '旅行记不存在' })
        return
      }
      if (!canUserShareLog(userId, log)) {
        send(res, 403, { message: '仅作者或管理员可分享到公众号' })
        return
      }
      if (!isMpShareConfigured()) {
        send(res, 503, {
          message: '服务端未配置公众号 MP_APPID / MP_APP_SECRET',
          configured: false
        })
        return
      }
      const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : log.images || []
      const result = await createTravelLogDraft(log, imageUrls, {
        authorName: body.authorName || ''
      })
      const map = loadIdMap(LOGS_FILE)
      if (map[log.logId]) {
        map[log.logId].mpDraftMediaId = result.draftMediaId
        map[log.logId].mpDraftSharedAt = Date.now()
        saveIdMap(LOGS_FILE, map)
      }
      send(res, 200, { ...result, configured: true })
      return
    }

    if (pathname === '/api/travel/mp-config' && req.method === 'GET') {
      send(res, 200, { shareToMpEnabled: isMpShareConfigured() })
      return
    }

    send(res, 404, { message: 'not found', path: pathname })
  } catch (e) {
    console.error('[api]', pathname, e)
    send(res, 500, { message: e.message || 'server error' })
  }
})

if (!APPID || !SECRET) {
  console.warn('[agshow-api] 请配置环境变量 WX_APPID、WX_SECRET')
}

server.listen(PORT, HOST, () => {
  console.log(`[agshow-api] listening http://${HOST}:${PORT}`)
  console.log('  GET  /health')
  console.log('  POST /auth/wechat')
  console.log('  POST /auth/phone')
  console.log('  POST /api/auth/send-reset-code')
  console.log('  POST /api/auth/reset-password')
  console.log('  POST /api/auth/reset-password-phone')
  console.log('  GET  /api/users')
  console.log('  GET  /api/users/lookup?openId=&phone=&username=')
  console.log('  POST /api/users/upsert')
  console.log('  GET  /api/admin/system-config')
  console.log('  POST /api/admin/system-config')
  console.log('  POST /api/users/delete')
  console.log('  GET  /api/travel/routes')
  console.log('  POST /api/travel/routes/upsert')
  console.log('  GET  /api/travel/logs')
  console.log('  POST /api/travel/logs/upsert')
  console.log('  POST /api/travel/logs/share-to-mp')
  console.log('  GET  /api/travel/mp-config')
  console.log(`  MP share: ${isMpShareConfigured() ? 'enabled' : 'disabled (set MP_APPID, MP_APP_SECRET)'}`)
  console.log(`  Users: ${USERS_FILE}`)
  console.log(`  Routes: ${ROUTES_FILE}`)
  console.log(`  Logs: ${LOGS_FILE}`)
})
