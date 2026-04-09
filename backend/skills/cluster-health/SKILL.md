---
name: 集群健康检查
description: 大数据集群综合健康检查，包括 HDFS/YARN/Spark 状态
type: monitoring
timeout: 60s
skills:
  full_check:
    name: 全面检查
    description: 检查 HDFS/YARN/Spark 整体健康状态
  hdfs_health:
    name: HDFS 健康
    description: 检查 HDFS 块分布、副本数、DataNode 状态
  yarn_health:
    name: YARN 健康
    description: 检查 NodeManager、队列状态
  spark_health:
    name: Spark 健康
    description: 检查 Spark 应用执行状态
---

## 集群健康检查

### 使用说明

- 综合检查大数据集群健康状态
- 支持 HDFS、YARN、Spark 分组件检查

### 示例

- "检查集群健康状态"
- "HDFS 健康检查"
- "全面检查 HDFS 和 YARN"