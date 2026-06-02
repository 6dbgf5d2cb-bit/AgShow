# AgShow API（微信云托管）

用户登录、微信 openId、手机号解密、**全平台统一用户库**（管理后台多设备可见）。

## 一、部署到微信云托管

### 1. 开通

1. 登录 [微信公众平台](https://mp.weixin.qq.com/) → **开发** → **云开发** → 开通并创建环境  
2. 进入 [微信云托管控制台](https://cloud.weixin.qq.com/cloudrun)（或从云开发控制台进入「云托管」）  
3. 选择与小程关联的**同一云环境**

### 2. 创建服务

| 配置项 | 建议值 |
|--------|--------|
| 服务名称 | `agshow-api`（须与小程序 `config/api.ts` 中 `cloudService` 一致） |
| 端口 | `80` |
| 上传方式 | **上传代码包** 或 **Git / 流水线构建 Dockerfile** |
| 代码目录 | 本仓库 `server/` 目录（须包含全部 `*.js`，见 Dockerfile） |
| Dockerfile | 使用 `server/Dockerfile`（会复制 `auth-phone.js`、`mp-article.js`、`password-reset.js` 等） |

### 3. 环境变量（服务设置 → 环境变量）

| 变量 | 说明 |
|------|------|
| `WX_APPID` | 小程序 AppID（须与当前小程序一致） |
| `WX_SECRET` | 小程序 AppSecret（**不是** `WX_SECERT`，拼写错会导致读不到） |
| `PORT` | `80`（默认已设） |
| `DATA_DIR` | `/app/data`（用户 JSON 存储，可选） |

云托管绑定小程序后，部分账号可自动注入 AppID/Secret，请以控制台为准。

### 4. 健康检查与微信连通性

- `GET /health` — 返回 `wxAppIdConfigured`、`wxSecretConfigured` 是否为 true  
- `GET /api/debug/wechat` — 实际请求 `api.weixin.qq.com` 校验 AppID/Secret（发布后在浏览器或 curl 测）

若报「无法连接微信接口」：

1. 环境变量名必须是 **`WX_SECRET`**（你写的 `WX_SECERT` 少字母，代码已兼容但仍建议在控制台改对）  
2. 重新**构建并发布**镜像（`Dockerfile` 已安装 `ca-certificates`，否则 Alpine 访问 HTTPS 会 `fetch failed`）  
3. 云托管 → 服务 → **外网访问** 已开启  
4. AppID/Secret 从 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置 复制，勿用公众号密钥

### 5. 发布

构建镜像并**发布**服务，记下服务名（如 `agshow-api`）。

---

## 二、小程序配置

编辑 `miniprogram/config/api.ts`：

```typescript
auth: {
  useCloudRun: true,
  cloudService: 'agshow-api',  // 与云托管服务名一致
  cloudEnv: '',                // 留空=默认环境，或填 prod-xxxx
  baseUrl: ''
}
```

`miniprogram/app.ts` 会在启动时自动 `wx.cloud.init()`。

### 关联云环境

微信公众平台 → 开发 → 云开发 → 确认小程序已关联上述云环境。

### 云存储（图片/视频共享）

自驾游、旅行记、头像上传使用 **云开发 → 存储**（与 `cloudEnv` 相同环境）。

**权限设置（必做）**：云开发控制台 → 存储 → 权限设置，建议：

- **所有用户可读**（否则其他用户看不到 `cloud://` 图片）
- **仅创建者可写** 或 **登录用户可写**

发布内容时图片会先上传到 `agshow/travel/...`、`agshow/travellog/...`，再随内容 API 同步到云托管。

### 无需配置 request 域名

使用 `wx.cloud.callContainer` 走云托管内网，**不用**在「服务器域名」里填业务域名。

---

## 三、验证

1. 手机 A：新用户 **微信登录**  
2. 手机 B：管理员打开 **管理后台 → 用户管理**（标题旁显示「云端」）  
3. **下拉刷新**，应能看到手机 A 注册的用户  

---

## 四、本地调试（可选）

```bash
cd server
set WX_APPID=你的AppId
set WX_SECRET=你的Secret
set PORT=3000
npm start
```

小程序临时改为：

```typescript
useCloudRun: false,
baseUrl: 'http://127.0.0.1:3000'  // 开发者工具勾选「不校验合法域名」
```

---

## 五、接口说明

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/auth/wechat` | `{ code }` → `{ openId }` |
| POST | `/auth/phone` | `{ code }` → `{ phone }` |
| POST | `/api/auth/send-reset-code` | `{ channel:'sms'\|'email', phone?, email? }` 发送找回密码验证码 |
| POST | `/api/auth/reset-password` | `{ channel, phone?, email?, code, newPassword }` |
| POST | `/api/auth/reset-password-phone` | `{ phoneCode, code?, newPassword }` 微信验证手机号重置 |
| GET | `/api/users` | 全部用户列表 |
| GET | `/api/users/lookup?openId=&phone=&username=` | 按条件查询单个用户（重装恢复） |
| POST | `/api/users/upsert` | 注册/登录同步用户 |
| POST | `/api/users/delete` | 删除用户 |
| GET | `/api/admin/system-config` | 管理后台系统配置（角色/模块/首页权限） |
| POST | `/api/admin/system-config` | 保存管理后台系统配置 |
| GET | `/api/travel/routes` | 自驾游线路列表 |
| POST | `/api/travel/routes/upsert` | 发布/更新线路 |
| GET | `/api/travel/logs` | 旅行记列表 |
| POST | `/api/travel/logs/upsert` | 发布/更新/删除旅行记（status=deleted 同步删除态） |

小程序会在**登录成功、启动、进入会员中心**时拉取上述数据；发布/编辑/删除时**等待写入**云托管后再提示成功。

| 数据 | 服务端存储文件 |
|------|----------------|
| 用户注册/登录 | `data/users.json` |
| 旅行记 | `data/travel_logs.json` |
| 自驾游线路 | `data/travel_routes.json` |
| 管理后台系统配置 | `data/system_config.json` |
| 找回密码验证码 | `data/reset_codes.json` |

### 管理后台变更永久化

- 管理员修改的**用户角色、会员等级、积分、账户状态（含冻结/解冻）**会写入 `adminManagedAt`；普通用户端同步（`POST /api/users/upsert`）**不会覆盖**这些字段。
- 用户管理页支持**批量冻结/解冻、批量注销/恢复**及单用户操作；变更后无法被用户端同步改回。注销账户无法登录，恢复后变为正常可登录。
- 管理员删除/审核的**旅行记、自驾游**（`status`、`allowComments`）同样受 `adminManagedAt` 保护。
- 角色权限、模块开关、首页配置保存在 `system_config.json`，多设备/重装后通过 `GET /api/admin/system-config` 恢复。

### 忘记密码（短信 / 邮箱）

1. 用户注册时需填写**手机号**或**邮箱**（至少一项），找回时向对应渠道发送 6 位验证码（10 分钟有效）。
2. 云托管环境变量（对接真实发送，二选一或都配）：
   - `SMS_HOOK_URL` — POST `{ phone, message, code }` 到您的短信网关
   - `EMAIL_HOOK_URL` — POST `{ email, subject, html, code }` 到您的邮件服务
3. 开发调试：设 `RESET_CODE_DEBUG=true`，接口会返回 `debugCode`（勿用于生产）。
4. 微信「验证手机号快速重置」：授权手机号须与账号绑定手机一致。

### 旅行记同步到关联公众号

1. 小程序与公众号需在同一**微信开放平台**绑定，且公众号已认证。
2. 在云托管服务环境变量中增加（使用**公众号**的 AppID/密钥，不是小程序）：
   - `MP_APPID` — 公众号 AppID
   - `MP_APP_SECRET` — 公众号 AppSecret
3. 小程序 `miniprogram/config/api.ts` 中填写 `officialAccount.username`（公众号原始 ID，形如 `gh_xxxx`）。
4. 作者在旅行记详情点击「同步公众号草稿」，草稿出现在公众平台 → **草稿箱**，审核后发布。
5. 正文末尾会插入小程序卡片，读者可跳转查看该篇旅行记。

---

## 六、生产建议

当前用户数据存于容器内 `data/users.json`，**实例重建可能丢失**。正式上线建议：

- 使用云托管挂载**云存储卷**，或  
- 接入 **MySQL / 云数据库**（后续可扩展）
