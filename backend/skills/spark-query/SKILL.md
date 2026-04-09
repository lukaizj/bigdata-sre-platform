---
name: Spark 查询
description: Spark History Server 应用查询，支持应用列表、Job/Stage 分析、执行器状态
type: analytics
endpoint: ${SPARK_HISTORY_URL}/api/v1
timeout: 30s
skills:
  apps:
    name: 应用列表
    description: 查询 Spark 应用历史
  app_detail:
    name: 应用详情
    description: 查看 Spark 应用详情
  jobs:
    name: Job 分析
    description: 分析 Spark Job 执行情况
  stages:
    name: Stage 分析
    description: 分析 Spark Stage 执行情况
  executors:
    name: 执行器状态
    description: 查看 Spark Executor 状态
---

## Spark 查询

### 使用说明

- 技能配置完成，可在智能体中使用
- 支持查询 Spark 应用、Job、Stage、Executor 等

### 示例

- "列出最近完成的 Spark 应用"
- "查看 app-xxx 的 Job 状态"
- "Spark 应用执行器状态"