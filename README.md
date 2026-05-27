# AgShow 微信小程序

会员、健康检测、自驾游、管理后台等功能的微信小程序。

## 用户统一管理（多手机）

管理后台要看到**所有手机**上的新用户，必须使用云端用户库：

- **推荐**：部署 `server/` 到 [**微信云托管**](server/README.md)，小程序开启 `useCloudRun`  
- 详见：[server/README.md](server/README.md)

## 目录

| 目录 | 说明 |
|------|------|
| `miniprogram/` | 小程序前端 |
| `server/` | 后端 API（云托管镜像） |
| `scripts/` | 农历表生成等开发脚本 |

## 本地开发

1. 用微信开发者工具打开本项目  
2. `miniprogram/config/api.ts` 配置云托管或本地 `baseUrl`  
3. 编译运行  
