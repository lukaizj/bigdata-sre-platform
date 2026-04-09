---
name: YARN 查询
description: YARN 资源管理和应用查询，支持应用列表、集群指标、节点状态等
type: compute
endpoint: ${HADOOP_YARN_URL}/ws/v1
timeout: 30s
skills:
  apps:
    name: 应用列表
    description: 查询运行中的应用
  cluster_metrics:
    name: 集群指标
    description: YARN 集群资源使用情况
  nodes:
    name: 节点列表
    description: NodeManager 节点状态
  scheduler:
    name: 调度器信息
    description: 队列状态和调度策略
---

## YARN 查询

### 使用说明

- 技能配置完成，可在智能体中使用
- 支持查询 YARN 应用、集群资源、节点状态等

### 示例

- "查一下 YARN 集群资源"
- "列出正在运行的应用"
- "YARN 节点状态"