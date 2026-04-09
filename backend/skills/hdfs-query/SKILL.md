---
name: HDFS 查询
description: HDFS 文件系统操作和状态查询，支持目录列表、磁盘使用、集群状态等
type: storage
endpoint: ${HADOOP_NAMENODE_URL}/webhdfs/v1
timeout: 30s
skills:
  list:
    name: 列出文件
    description: 列出 HDFS 目录内容
  disk_usage:
    name: 磁盘使用
    description: 查询 HDFS 存储使用情况
  cluster_status:
    name: 集群状态
    description: NameNode 状态和 DataNode 列表
  content_summary:
    name: 内容汇总
    description: 目录文件数、大小统计
---

## HDFS 查询

### 使用说明

- 技能配置完成，可在智能体中使用
- 支持查询 HDFS 目录列表、磁盘使用、集群状态等
- 需要配置 NameNode WebHDFS 地址

### 示例

- "查一下 HDFS 磁盘使用情况"
- "列出 /user/hadoop 目录"
- "HDFS 集群状态"