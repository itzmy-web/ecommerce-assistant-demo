# AI 电商运营助手（演示版）

面向电商运营场景的一站式 AI 工作台演示项目：数据看板、商品/店铺运营、单品运营三大工作流（补商品信息 / 投放建议 / 周期复盘）与 Agent 平台，全部内置演示数据，开箱即用。

## 功能一览

| 模块 | 路由 | 说明 |
| --- | --- | --- |
| 经营看板 | `/dashboard` | 核心指标卡、业绩趋势、平台分布 |
| 商品运营 | `/products` | 商品列表、详情（含单品运营入口） |
| 店铺运营 | `/stores` | 多店铺汇总与对比 |
| 工作流 · 补商品信息 | `/workflows/product-info` | 商品信息体检台：完整度评分、字段缺失洞察、逐商品补齐清单 |
| 工作流 · 投放建议 | `/workflows/ads` | 投放作战室：消耗/收入/ROI 图表、实验决策徽章（放量/维持/暂停） |
| 工作流 · 周期复盘 | `/workflows/review` | 复盘驾驶舱：收入趋势、聚合行动项清单、逐商品复盘时间线 |
| 数据导入 | `/import` | 演示数据导入 |
| Agent 平台 | `/agents` | 智能体运行与事件流 |

## 技术栈

- **Next.js 16**（App Router，`output: "standalone"`）+ **React 19** + **Tailwind CSS 4**
- **ECharts 6** 图表、**lucide-react** 图标
- 演示版 Mock API：`src/app/api/v1/[...path]/route.ts`（登录接受任意凭据，返回演示 token）

## 本地运行

```bash
npm install
npm run dev        # 开发环境
# 或
npm run build && npm start   # 生产构建
```

## 说明

- 本项目为演示/学习用途，所有数据均为内置 mock，不连接真实后端。
- 登录页接受任意用户名/密码，用于演示完整交互流程。
