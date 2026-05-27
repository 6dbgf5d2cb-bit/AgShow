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
| 代码目录 | 本仓库 `server/` 目录 |
| Dockerfile | 使用 `server/Dockerfile` |

### 3. 环境变量（服务设置 → 环境变量）

| 变量 | 说明 |
|------|------|
| `WX_APPID` | 小程序 AppID |
| `WX_SECRET` | 小程序 AppSecret |
| `PORT` | `80`（默认已设） |
| `DATA_DIR` | `/app/data`（用户 JSON 存储，可选） |

云托管绑定小程序后，部分账号可自动注入 AppID/Secret，请以控制台为准。

### 4. 健康检查

- 路径：`/health` 或 `/`  
- 期望返回：`{"ok":true,"service":"agshow-api"}`

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
| GET | `/api/users` | 全部用户列表 |
| POST | `/api/users/upsert` | 注册/登录同步用户 |
| POST | `/api/users/delete` | 删除用户 |
| GET | `/api/travel/routes` | 自驾游线路列表 |
| POST | `/api/travel/routes/upsert` | 发布/更新线路 |
| GET | `/api/travel/logs` | 旅行记列表 |
| POST | `/api/travel/logs/upsert` | 发布/更新旅行记 |

---

## 六、生产建议

当前用户数据存于容器内 `data/users.json`，**实例重建可能丢失**。正式上线建议：

- 使用云托管挂载**云存储卷**，或  
- 接入 **MySQL / 云数据库**（后续可扩展）
