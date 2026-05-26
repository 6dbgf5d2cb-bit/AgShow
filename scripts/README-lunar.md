# 农历对照表

## 生成

```bash
npm run generate:lunar-table
```

基于 `lunar-javascript`（与寿星天文历/国家万年历数据一致）生成：

- `miniprogram/utils/lunar-solar-table.ts` — 阳历→农历（Base64 压缩，约 390KB）

农历→阳历在同一张表内反向匹配（不另存 1MB 反向索引）。

## 使用

- 用户选择**阳历**：`solarToLunarLocal` O(1) 查表
- 用户选择**农历**：`lunarToSolar` 对照表匹配（排盘时调用一次，耗时可忽略）

## 体积

主包农历相关约 **418KB**（原约 1650KB），满足 2MB 主包限制。
