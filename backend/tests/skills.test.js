const { parseIntent: parseHdfsIntent } = require('../skills/hdfs-query');
const { parseIntent: parseYarnIntent } = require('../skills/yarn-query');
const { parseIntent: parseSparkIntent } = require('../skills/spark-query');
const { parseIntent: parseAmbariIntent } = require('../skills/ambari-manage');

describe('Skill Intent Parsing', () => {
  test('HDFS intent parsing', () => {
    expect(parseHdfsIntent('查一下HDFS磁盘使用情况').action).toBe('disk_usage');
    expect(parseHdfsIntent('列出/user/hadoop目录文件').action).toBe('list');
    expect(parseHdfsIntent('HDFS集群状态').action).toBe('cluster_status');
  });

  test('YARN intent parsing', () => {
    expect(parseYarnIntent('查一下YARN集群资源').action).toBe('cluster_metrics');
    expect(parseYarnIntent('列出正在运行的应用').action).toBe('apps');
    expect(parseYarnIntent('YARN节点状态').action).toBe('nodes');
  });

  test('Spark intent parsing', () => {
    expect(parseSparkIntent('列出最近完成的Spark应用').action).toBe('apps');
    expect(parseSparkIntent('查看app-123的Job状态').action).toBe('jobs');
  });

  test('Ambari intent parsing', () => {
    expect(parseAmbariIntent('查看集群服务状态').action).toBe('service_status');
    expect(parseAmbariIntent('启动HDFS服务').action).toBe('start_service');
    expect(parseAmbariIntent('查看当前告警').action).toBe('alerts');
  });
});