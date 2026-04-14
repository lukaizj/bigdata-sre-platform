const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  server: {
    port: parseInt(process.env.SERVER_PORT) || 8080,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bigdata_sre',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  hadoop: {
    namenodeUrl: process.env.HADOOP_NAMENODE_URL || 'http://localhost:9870',
    yarnUrl: process.env.HADOOP_YARN_URL || 'http://localhost:8088',
    user: process.env.HADOOP_USER || 'hadoop',
  },
  spark: {
    historyUrl: process.env.SPARK_HISTORY_URL || 'http://localhost:18080',
  },
  ambari: {
    url: process.env.AMBARI_URL || 'http://localhost:8080',
    username: process.env.AMBARI_USERNAME || 'admin',
    password: process.env.AMBARI_PASSWORD || 'admin',
    clusterName: process.env.AMBARI_CLUSTER_NAME || '',
  },
  glm: {
    enabled: process.env.GLM_ENABLED === 'true',
    apiKey: process.env.GLM_API_KEY || '',
    apiUrl: process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: process.env.GLM_MODEL || 'glm-4',
  },
};

module.exports = config;