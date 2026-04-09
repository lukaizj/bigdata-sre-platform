const config = require('../../src/config');
const { callGLM } = require('../../src/services/glm');

/**
 * 数据可视化技能
 * 将数据转换为 ECharts 图表配置
 */
async function execute(message, skillConfig, previousResult) {
  // 使用前一个技能的结果，或者尝试从消息中提取数据
  let rawData = previousResult;

  if (!rawData) {
    // 尝试从消息中提取 JSON 数据
    const jsonMatch = message.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        rawData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        return { error: '无法解析数据', data: null };
      }
    }
  }

  if (!rawData) {
    return { error: '没有可用的数据进行可视化', data: null };
  }

  try {
    // 使用 GLM 生成图表配置
    if (config.glm.enabled) {
      const chartConfig = await generateChartConfig(rawData, message);
      return { data: chartConfig };
    } else {
      // 简单的默认图表生成
      const chartConfig = generateDefaultChart(rawData);
      return { data: chartConfig };
    }
  } catch (err) {
    return { error: `图表生成失败: ${err.message}`, data: null };
  }
}

async function generateChartConfig(data, userMessage) {
  const systemPrompt = `你是一个数据分析助手，需要将数据转换为 ECharts 图表配置。

要求：
1. 根据数据特点选择合适的图表类型（折线图、柱状图、饼图、表格等）
2. 返回完整的 ECharts option 配置（JSON 格式）
3. 图表要清晰、易读、美观
4. 标题、图例、坐标轴标签要使用中文
5. 直接返回 JSON 对象，不要有任何其他文字说明

常见图表类型选择：
- 时间序列数据：折线图 (line)
- 分类比较数据：柱状图 (bar)
- 占比数据：饼图 (pie)
- 表格数据：可以用表格展示
- 集群状态：可以用仪表盘或状态卡片`;

  const response = await callGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `用户需求: ${userMessage}\n\n数据: ${JSON.stringify(data, null, 2)}` },
  ]);

  // 尝试解析 JSON
  try {
    // 提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse chart config:', e);
  }

  // 如果解析失败，返回默认配置
  return generateDefaultChart(data);
}

function generateDefaultChart(data) {
  // 根据数据类型生成简单图表
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { title: { text: '暂无数据' } };
    }

    // 检查是否是对象数组
    if (typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      const numericKeys = keys.filter(k => typeof data[0][k] === 'number');

      if (numericKeys.length > 0) {
        // 生成柱状图
        return {
          title: { text: '数据统计', left: 'center' },
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: data.slice(0, 20).map((item, i) => item.name || item.host || item.service_name || `Item ${i + 1}`),
          },
          yAxis: { type: 'value' },
          series: numericKeys.slice(0, 3).map(key => ({
            name: key,
            type: 'bar',
            data: data.slice(0, 20).map(item => item[key]),
          })),
        };
      }
    }

    // 简单数组
    return {
      title: { text: '数据概览', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '50%',
        data: data.slice(0, 10).map((item, i) => ({
          name: item.name || `Item ${i + 1}`,
          value: typeof item === 'number' ? item : (item.value || item.count || 1),
        })),
      }],
    };
  }

  // 单个对象
  if (typeof data === 'object') {
    const entries = Object.entries(data).slice(0, 10);
    return {
      title: { text: '数据概览', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: entries.map(([k]) => k) },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: entries.map(([, v]) => (typeof v === 'number' ? v : 0)),
      }],
    };
  }

  return { title: { text: '无法生成图表' } };
}

module.exports = {
  execute,
  generateChartConfig,
  generateDefaultChart,
};