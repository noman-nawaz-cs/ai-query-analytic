import type { AIQueryRecord, AIQueryFilterOptions } from '../types/ai-query.ts';

export function applyFilters(data: AIQueryRecord[], filters: AIQueryFilterOptions): AIQueryRecord[] {
  return data.filter(item => {
    if (filters.models && filters.models.length && !filters.models.includes(item.model)) return false;
    if (filters.providers && filters.providers.length && !filters.providers.includes(item.provider)) return false;
    if (filters.dateRange) {
      const ts = new Date(item.timestamp).getTime();
      if (filters.dateRange.start && ts < filters.dateRange.start.getTime()) return false;
      if (filters.dateRange.end && ts > filters.dateRange.end.getTime()) return false;
    }
    if (filters.costRange) {
      if (filters.costRange.min !== undefined && item.cost < filters.costRange.min) return false;
      if (filters.costRange.max !== undefined && item.cost > filters.costRange.max) return false;
    }
    if (filters.tokenRange) {
      const totalTokens = item.inputTokens + item.outputTokens;
      if (filters.tokenRange.min !== undefined && totalTokens < filters.tokenRange.min) return false;
      if (filters.tokenRange.max !== undefined && totalTokens > filters.tokenRange.max) return false;
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!item.input.toLowerCase().includes(s) && !item.output.toLowerCase().includes(s)) return false;
    }
    return true;
  });
}

export function applySorting(data: AIQueryRecord[], sortKey: keyof AIQueryRecord, order: 'asc' | 'desc') {
  return data.slice().sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA === valB) return 0;
    const comparison = valA && valB && valA > valB ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
}
