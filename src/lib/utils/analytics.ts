import type { AIQueryRecord, AnalyticsSummary } from '../types/ai-query.ts';

export function computeAnalytics(data: AIQueryRecord[]): AnalyticsSummary {
  if (!data.length) return {
    totalCost: 0,
    avgCost: 0,
    avgResponseTime: 0,
    tokenEfficiency: 0,
    modelStats: {}
  };

  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = totalCost / data.length;
  const avgResponseTime = data.reduce((sum, d) => sum + d.responseTime, 0) / data.length;
  const tokenEfficiency = data.reduce((sum, d) => sum + (d.outputTokens / (d.inputTokens || 1)), 0) / data.length;

  const modelStats: AnalyticsSummary['modelStats'] = {};
  data.forEach(d => {
    if (!modelStats[d.model]) {
      modelStats[d.model] = { avgCost: 0, avgTokens: 0, avgResponseTime: 0 };
    }
    modelStats[d.model].avgCost += d.cost;
    modelStats[d.model].avgTokens += d.inputTokens + d.outputTokens;
    modelStats[d.model].avgResponseTime += d.responseTime;
  });

  for (const model in modelStats) {
    const count = data.filter(d => d.model === model).length;
    modelStats[model].avgCost /= count;
    modelStats[model].avgTokens /= count;
    modelStats[model].avgResponseTime /= count;
  }

  return { totalCost, avgCost, avgResponseTime, tokenEfficiency, modelStats };
}
