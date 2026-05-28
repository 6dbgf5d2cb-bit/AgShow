export const API_CONFIG = {
  auth: {
    /**
     * 微信云托管（推荐）
     * cloudEnv：必填！云开发「环境 ID」（不是环境名称）
     *   查看路径：微信公众平台 → 开发 → 云开发 → 设置 → 环境 ID（如 prod-abc123）
     * cloudService：云托管「服务名称」（服务列表里的名称，你当前为 express-m78v-002）
     *
     * 图片/视频上传使用同一 cloudEnv（云开发 → 存储）。
     * 存储权限建议：所有用户可读，登录用户可写，否则他人看不到发布的图片。
     */
    useCloudRun: true,
    cloudService: 'express-m78v',
    cloudEnv: 'prod-d7g5aexo529d6be22', // ← 请填写你的环境 ID，例如 'prod-xxxxxx'

    /** 自建 HTTPS（useCloudRun 为 false 时使用） */
    baseUrl: ''
  },
  tianapi: {
    key: '',
    baseUrl: 'https://api.tianapi.com'
  },
  alapi: {
    token: '',
    baseUrl: 'https://v2.alapi.cn'
  },
  /**
   * 关联公众号（与小程序需在同一微信开放平台绑定）
   * username：公众号原始 ID（设置与开发 → 公众号设置 → 账号详情 → 微信号，形如 gh_xxxx）
   * 服务端同步草稿还需在云托管配置 MP_APPID、MP_APP_SECRET（公众号的 AppID/密钥，非小程序）
   */
  officialAccount: {
    enabled: true,
    username: '', // 填写 gh_ 开头的原始 ID，用于打开公众号主页
    displayName: 'AgShow'
  }
}
