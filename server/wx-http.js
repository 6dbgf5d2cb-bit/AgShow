/**
 * 访问 api.weixin.qq.com（云托管兼容）
 * - 开启「开放接口服务」时 HTTPS 易出现 DEPTH_ZERO_SELF_SIGNED_CERT，官方推荐容器内用 HTTP
 * - 直连 HTTPS 时合并系统 CA 与 /app/cert/certificate.crt
 */
const http = require('http')
const https = require('https')
const tls = require('tls')
const fs = require('fs')

const WEIXIN_HOST = 'api.weixin.qq.com'

let httpsAgent = null

function truthy(v) {
  return v === '1' || v === 'true' || v === 'yes'
}

function cloudRunCertPresent() {
  try {
    return fs.existsSync('/app/cert/certificate.crt')
  } catch {
    return false
  }
}

/** 云托管开放接口服务：容器内 HTTP 至 169.254.x，无 TLS 自签问题 */
function useHttpForWeixinApi() {
  if (truthy(process.env.WX_API_USE_HTTP)) return true
  if (truthy(process.env.WX_API_USE_HTTPS)) return false
  if (cloudRunCertPresent()) return true
  return false
}

function getWeixinApiOrigin() {
  return `${useHttpForWeixinApi() ? 'http' : 'https'}://${WEIXIN_HOST}`
}

/** path 以 / 开头，或传入完整 http(s) URL */
function weixinUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${getWeixinApiOrigin()}${path}`
}

function loadCaBundle() {
  const seen = new Set()
  const out = []
  const add = (pem) => {
    if (!pem || typeof pem !== 'string') return
    const key = pem.slice(0, 96)
    if (seen.has(key)) return
    seen.add(key)
    out.push(pem)
  }
  for (const c of tls.rootCertificates) add(c)
  for (const file of [
    process.env.NODE_EXTRA_CA_CERTS,
    '/etc/ssl/certs/ca-certificates.crt',
    '/app/cert/certificate.crt'
  ]) {
    if (!file) continue
    try {
      if (fs.existsSync(file)) add(fs.readFileSync(file, 'utf8'))
    } catch {
      /* ignore */
    }
  }
  return out
}

function getHttpsAgent() {
  if (!httpsAgent) {
    httpsAgent = new https.Agent({
      ca: loadCaBundle(),
      keepAlive: true,
      maxSockets: 12
    })
  }
  return httpsAgent
}

function wxHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    let parsed
    try {
      parsed = new URL(url)
    } catch (e) {
      reject(e)
      return
    }

    const body = options.body ? String(options.body) : ''
    const isHttps = parsed.protocol === 'https:'
    const lib = isHttps ? https : http

    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
      },
      timeout: options.timeout || 20000,
      ...(isHttps ? { agent: getHttpsAgent() } : {})
    }

    const req = lib.request(reqOpts, (res) => {
      let raw = ''
      res.on('data', (chunk) => {
        raw += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          json: async () => {
            try {
              return raw ? JSON.parse(raw) : {}
            } catch {
              throw new Error(`微信接口返回非 JSON：${raw.slice(0, 200)}`)
            }
          },
          text: async () => raw
        })
      })
    })

    req.on('error', (e) => {
      const code = e.code || ''
      if (
        code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
        code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        /self[- ]?signed certificate/i.test(e.message || '')
      ) {
        reject(
          new Error(
            '连接微信服务器失败(自签证书)：请在云托管环境变量设置 WX_API_USE_HTTP=1 并重新发布；' +
              '或在控制台关闭「开放接口服务」后仅用 HTTPS。环境变量须为 WX_APPID、WX_SECRET（不是 WX_SECERT）'
          )
        )
        return
      }
      if (code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || code === 'CERT_HAS_EXPIRED') {
        reject(
          new Error(
            'HTTPS 证书校验失败：请重新构建镜像（server/Dockerfile 含 ca-certificates）并发布'
          )
        )
        return
      }
      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
        reject(new Error('无法解析 api.weixin.qq.com，请检查云托管 DNS/外网出网'))
        return
      }
      if (code === 'ETIMEDOUT' || code === 'ECONNRESET') {
        reject(new Error('连接微信接口超时，请确认已开通外网访问并重试'))
        return
      }
      reject(
        new Error(
          `连接微信服务器失败(${code || 'unknown'})：${e.message || '网络错误'}。环境变量须为 WX_APPID 与 WX_SECRET（不是 WX_SECERT）`
        )
      )
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('连接微信接口超时(20s)'))
    })

    if (body) req.write(body)
    req.end()
  })
}

module.exports = {
  getWeixinApiOrigin,
  useHttpForWeixinApi,
  weixinUrl,
  wxHttpRequest
}
