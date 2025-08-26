export interface AIQueryRecord {
    id: string;
    model: string;
    provider: 'openai' | 'gemini';
    input: string;
    output: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    timestamp: Date;
    responseTime: number;
    modelVersion?: string;
}
  
export interface AIQueryFilterOptions {
    models?: string[];
    providers?: string[];
    dateRange?: { start: Date; end: Date };
    costRange?: { min: number; max: number };
    tokenRange?: { min: number; max: number };
    search?: string;
}
  
export interface AnalyticsSummary {
    totalCost: number;
    avgCost: number;
    avgResponseTime: number;
    tokenEfficiency: number;
    modelStats: Record<string, {
      avgCost: number;
      avgTokens: number;
      avgResponseTime: number;
    }>;
}
  