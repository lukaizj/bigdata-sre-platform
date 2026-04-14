/**
 * Function Calling 工具定义
 * 用于 AI 驱动的多轮对话系统
 */

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'query_hdfs_status',
      description: '查询HDFS集群状态，包括NameNode状态、DataNode数量、存储使用情况、集群健康状态等',
      parameters: {
        type: 'object',
        properties: {
          cluster_id: {
            type: 'string',
            description: '集群ID，可选值：test-cluster（测试集群）、offline（离线集群）、cold（冷集群）、qcc-offline（离线新集群）、realtime（实时集群）'
          },
          action: {
            type: 'string',
            enum: ['status', 'disk_usage', 'health', 'list_directory'],
            description: '查询类型：status（集群状态）、disk_usage（磁盘使用）、health（健康检查）、list_directory（目录列表）'
          },
          path: {
            type: 'string',
            description: 'HDFS路径，仅在list_directory时使用，如/user/hadoop'
          }
        },
        required: ['cluster_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_yarn_status',
      description: '查询YARN集群资源状态，包括ResourceManager状态、NodeManager列表、应用列表、队列信息、资源使用情况',
      parameters: {
        type: 'object',
        properties: {
          cluster_id: {
            type: 'string',
            description: '集群ID，可选值：test-cluster、offline、cold、qcc-offline、realtime'
          },
          action: {
            type: 'string',
            enum: ['metrics', 'apps', 'nodes', 'scheduler'],
            description: '查询类型：metrics（集群指标）、apps（应用列表）、nodes（节点列表）、scheduler（调度器/队列）'
          },
          state: {
            type: 'string',
            enum: ['RUNNING', 'FINISHED', 'FAILED', 'KILLED'],
            description: '应用状态过滤，仅在apps时使用'
          }
        },
        required: ['cluster_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_spark_apps',
      description: '查询Spark应用列表或应用详情，包括应用状态、Job执行情况、Executor信息、Stage耗时等',
      parameters: {
        type: 'object',
        properties: {
          cluster_id: {
            type: 'string',
            description: '集群ID或使用default表示使用默认Spark History Server'
          },
          app_id: {
            type: 'string',
            description: 'Spark应用ID，如application_1701234567890_0001，仅在查询详情时使用'
          },
          action: {
            type: 'string',
            enum: ['list', 'detail', 'jobs', 'executors', 'stages'],
            description: '查询类型：list（应用列表）、detail（应用详情）、jobs（Job列表）、executors（Executor列表）、stages（Stage列表）'
          },
          status: {
            type: 'string',
            enum: ['running', 'completed', 'failed'],
            description: '应用状态过滤，仅在list时使用'
          }
        },
        required: ['cluster_id', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_cluster_health',
      description: '综合检查集群健康状态，同时检查HDFS、YARN、Spark等多个组件，返回整体健康评估',
      parameters: {
        type: 'object',
        properties: {
          cluster_id: {
            type: 'string',
            description: '集群ID'
          },
          components: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['hdfs', 'yarn', 'spark']
            },
            description: '要检查的组件列表，默认检查所有组件'
          }
        },
        required: ['cluster_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_cluster_list',
      description: '获取可用集群列表，返回所有配置的集群信息，包括集群ID、名称、环境、描述等',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ambari_service_action',
      description: '通过Ambari管理集群服务，可以启动、停止、重启服务，查看服务状态和组件状态',
      parameters: {
        type: 'object',
        properties: {
          cluster_id: {
            type: 'string',
            description: '集群ID'
          },
          service: {
            type: 'string',
            description: '服务名称，如HDFS、YARN、SPARK、HIVE、KAFKA等'
          },
          action: {
            type: 'string',
            enum: ['start', 'stop', 'restart', 'status'],
            description: '操作类型'
          }
        },
        required: ['cluster_id', 'action']
      }
    }
  }
];

// 工具名称映射到中文描述
const TOOL_NAMES = {
  query_hdfs_status: '查询HDFS状态',
  query_yarn_status: '查询YARN状态',
  query_spark_apps: '查询Spark应用',
  check_cluster_health: '集群健康检查',
  get_cluster_list: '获取集群列表',
  ambari_service_action: 'Ambari服务操作'
};

module.exports = {
  TOOL_DEFINITIONS,
  TOOL_NAMES
};