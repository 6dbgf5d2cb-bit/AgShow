export const API_CONFIG = {
  auth: {
    /**
     * 微信云托管（推荐）
     * cloudEnv：必填！云开发「环境 ID」（不是环境名称）
     *   查看路径：微信公众平台 → 开发 → 云开发 → 设置 → 环境 ID（如 prod-abc123）
     * cloudService：云托管「服务名称」（服务列表里的名称，你当前为 express-m78v-002）
     */
    useCloudRun: true,
    cloudService: 'express-m78v-002',
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
  }
}
