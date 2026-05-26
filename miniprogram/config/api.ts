export const API_CONFIG = {
  /**
   * 服务端地址（HTTPS）。配置后启用：
   * - 微信 code2Session / 手机号解密
   * - 用户库云端同步（多手机管理后台可见同一用户列表）
   * 本地调试可在开发者工具勾选「不校验合法域名」，baseUrl 填内网穿透地址
   */
  auth: {
    baseUrl: '' // 例: 'https://your-api.example.com'
  },
  tianapi: {
    key: '',
    baseUrl: 'https://api.tianapi.com'
  },
  alapi: {
    token: '',
    baseUrl: 'https://v2.alapi.cn'
  }
}
