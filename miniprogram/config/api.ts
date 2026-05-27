export const API_CONFIG = {
  auth: {
    /**
     * 方式一（推荐）：微信云托管
     * 1. 在云托管控制台创建服务（如 agshow-api），上传 server 目录构建镜像
     * 2. 小程序关联同一云环境
     * 3. 填写 cloudService 为服务名，useCloudRun 设为 true
     * 4. cloudEnv 留空则使用默认关联环境，或填环境 ID（如 prod-xxx）
     */
    useCloudRun: true,
    cloudService: 'agshow-api',
    cloudEnv: '',

    /**
     * 方式二：自建 HTTPS 域名（与云托管二选一，云托管优先）
     * useCloudRun 为 false 时生效
     */
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
