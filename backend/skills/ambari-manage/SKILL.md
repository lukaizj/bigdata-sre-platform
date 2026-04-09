---
name: Ambari 管理
description: Ambari 集群服务管理，支持服务启停、状态查询、告警查看
type: management
endpoint: ${AMBARI_URL}/api/v1
username: admin
password: admin
clusterName: ""
timeout: 60s
skills:
  service_status:
    name: 服务状态
    description: 查看集群服务状态
  start_service:
    name: 启动服务
    description: 启动指定服务
  stop_service:
    name: 停止服务
    description: 停止指定服务
  restart_service:
    name: 重启服务
    description: 重启指定服务
  alerts:
    name: 告警列表
    description: 查看当前告警
  hosts:
    name: 主机列表
    description: 查看集群主机状态
---

## Ambari 管理

### 使用说明

- 需要配置 Ambari 服务地址和认证信息
- 支持服务启停、状态查询、告警查看等

### 示例

- "查看集群服务状态"
- "启动 HDFS 服务"
- "查看当前告警"