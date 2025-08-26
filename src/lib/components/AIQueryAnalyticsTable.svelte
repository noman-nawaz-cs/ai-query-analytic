<script lang="ts">
  import { onMount } from 'svelte';
  import { applyFilters } from '$lib/utils/filters.js';
  import { applySorting } from '$lib/utils/filters.js';
  import { computeAnalytics } from '$lib/utils/analytics.js';
  import { exportToCSV, exportToJSON } from '$lib/utils/export.js';
  import type { AIQueryRecord, AIQueryFilterOptions } from '$lib/types/ai-query.js';
  import VirtualList from '@sveltejs/svelte-virtual-list/VirtualList.svelte';

  export let data: AIQueryRecord[] = [];

  const modelProviderMap: Record<string, string> = {
    'gpt-4': 'openai',
    'gpt-4o-mini': 'openai',
    'gpt-3.5-turbo': 'openai',
    'gemini-pro': 'gemini',
    'gemini-1.5-pro': 'gemini',
  };

  const providerModelsMap: Record<string, string[]> = {
    'openai': ['gpt-4', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    'gemini': ['gemini-pro', 'gemini-1.5-pro'],
  };

  let filters: AIQueryFilterOptions = {
    models: [],
    providers: [],
    search: '',
    dateRange: undefined,
    costRange: undefined,
    tokenRange: undefined
  };

  let sortKey: keyof AIQueryRecord = 'timestamp';
  let sortOrder: 'asc' | 'desc' = 'desc';

  let filteredData: AIQueryRecord[] = [];
  let analytics = computeAnalytics(data);

  let expandedRow: string | null = null;
  let availableModels: string[] = Object.keys(modelProviderMap);
  let availableProviders: string[] = Object.keys(providerModelsMap);
  let showFilters = false;

  let filteredModels: string[] = [];

  onMount(() => {
    updateFilteredModels();
    updateFilteredProviders();
    updateTable();
  });

  function updateFilteredModels() {
    const providers = filters.providers ?? [];
    if (providers.length === 0) {
      // If no provider selected, show no models
      filteredModels = [];
    } else {
      // Only show models whose provider is selected
      filteredModels = providers.reduce((acc: string[], provider: string) => {
        const providerModels = providerModelsMap[provider] || [];
        return acc.concat(providerModels);
      }, []);
    }
    filters.models = (filters.models ?? []).filter(model => filteredModels.includes(model));
  }

  function updateFilteredProviders() {
    const models = filters.models ?? [];
    if (models.length === 0) {
      return;
    }
    const modelProviders = models.map(model => modelProviderMap[model]).filter(Boolean);
    const uniqueProviders = Array.from(new Set(modelProviders));
    const currentProviders = new Set(filters.providers ?? []);
    const requiredProviders = new Set(uniqueProviders);
    if (
      !Array.from(requiredProviders).every(p => currentProviders.has(p as string)) ||
      !Array.from(currentProviders).every(p => requiredProviders.has(p as string))
    ) {
      filters.providers = uniqueProviders;
    }
  }

  function updateTable() {
    const temp = applyFilters(data, filters);
    filteredData = applySorting(temp, sortKey, sortOrder);
    analytics = computeAnalytics(filteredData);
 }


 function toggleSort(key: keyof AIQueryRecord) {
  if (sortKey === key) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortOrder = 'asc';
  }
  updateTable();
}


  function toggleExpand(id: string) {
    expandedRow = expandedRow === id ? null : id;
  }

  function getCostColor(cost: number) {
    if (cost < 0.01) return 'low';
    if (cost < 0.05) return 'medium';
    return 'high';
  }

  const rowHeight = 80;

  const chartWidth = 800;
  const chartHeight = 260;
  const chartPadding = 40;
  let chartPoints = '';
  let xAxisLabels: Array<{x: number, label: string}> = [];
  let yAxisLabels: Array<{y: number, label: string}> = [];

  $: {
    if (filteredData.length > 0) {
      const series = filteredData
        .map(d => ({
          date: new Date(d.timestamp).getTime(),
          cost: d.cost,
          timestamp: d.timestamp
        }))
        .sort((a, b) => a.date - b.date);

      if (series.length === 1) {
        const innerW = chartWidth - chartPadding * 2;
        const innerH = chartHeight - chartPadding * 2;
        const x = chartPadding + innerW / 2;
        const y = chartPadding + innerH / 2;
        chartPoints = `${x},${y}`;
      } else {
        const minX = series[0].date;
        const maxX = series[series.length - 1].date;
        const minY = Math.min(...series.map(p => p.cost));
        const maxY = Math.max(...series.map(p => p.cost));

        const rangeX = Math.max(1, maxX - minX);
        const rangeY = Math.max(0.0001, maxY - minY);

        const innerW = chartWidth - chartPadding * 2;
        const innerH = chartHeight - chartPadding * 2;

        chartPoints = series
          .map(p => {
            const x = chartPadding + ((p.date - minX) / rangeX) * innerW;
            const y = chartPadding + (1 - (p.cost - minY) / rangeY) * innerH;
            return `${x},${y}`;
          })
          .join(' ');

        xAxisLabels = [];
        yAxisLabels = [];

        const numXLabels = Math.min(5, series.length);
        for (let i = 0; i < numXLabels; i++) {
          const dataIndex = Math.floor((i * (series.length - 1)) / Math.max(1, numXLabels - 1));
          const x = chartPadding + ((series[dataIndex].date - minX) / rangeX) * innerW;
          const date = new Date(series[dataIndex].timestamp);
          xAxisLabels.push({
            x,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }

        const numYLabels = 5;
        for (let i = 0; i < numYLabels; i++) {
          const value = minY + (maxY - minY) * (i / (numYLabels - 1));
          const y = chartPadding + (1 - (value - minY) / rangeY) * innerH;
          yAxisLabels.push({
            y,
            label: `$${value.toFixed(4)}`
          });
        }
      }
    } else {
      chartPoints = '';
      xAxisLabels = [];
      yAxisLabels = [];
    }
  }

  function formatCurrency(value: number) {
    return `$${value.toFixed(4)}`;
  }

  function onDateChange(which: 'start' | 'end', value: string) {
    const current = filters.dateRange ?? { start: undefined as Date | undefined, end: undefined as Date | undefined };
    const date = value ? new Date(value) : undefined;
    filters = {
      ...filters,
      dateRange: { start: which === 'start' ? date! : current.start!, end: which === 'end' ? date! : current.end! }
    };
    updateTable();
  }

  function onRangeChange(kind: 'cost' | 'token', side: 'min' | 'max', value: string) {
    const num = value === '' ? undefined : Number(value);
    if (kind === 'cost') {
      const current = filters.costRange ?? { min: undefined as number | undefined, max: undefined as number | undefined };
      filters = { ...filters, costRange: { min: side === 'min' ? num! : current.min!, max: side === 'max' ? num! : current.max! } };
    } else {
      const current = filters.tokenRange ?? { min: undefined as number | undefined, max: undefined as number | undefined };
      filters = { ...filters, tokenRange: { min: side === 'min' ? num! : current.min!, max: side === 'max' ? num! : current.max! } };
    }
    updateTable();
  }

  function totalTokensOf(item: AIQueryRecord) {
    return item.inputTokens + item.outputTokens;
  }

  function efficiencyOf(item: AIQueryRecord) {
    return item.inputTokens === 0 ? 0 : item.outputTokens / item.inputTokens;
  }

  function costPerTokenOf(item: AIQueryRecord) {
    const total = totalTokensOf(item);
    return total === 0 ? 0 : item.cost / total;
  }

  // --- Add local state for custom dropdowns ---
  let showProviderDropdown = false;
  let showModelDropdown = false;

  function toggleProviderDropdown() {
    showProviderDropdown = !showProviderDropdown;
    if (showProviderDropdown) showModelDropdown = false;
  }
  function toggleModelDropdown() {
    showModelDropdown = !showModelDropdown;
    if (showModelDropdown) showProviderDropdown = false;
  }
  function closeDropdowns() {
    showProviderDropdown = false;
    showModelDropdown = false;
  }

  function selectAllProviders() {
    filters.providers = [...availableProviders];
    updateFilteredModels();
    updateTable();
  }
  function clearProviders() {
    filters.providers = [];
    updateFilteredModels();
    updateTable();
  }
  function selectAllModels() {
    filters.models = [...filteredModels];
    updateFilteredProviders();
    updateTable();
  }
  function clearModels() {
    filters.models = [];
    updateFilteredProviders();
    updateTable();
  }
  function toggleProvider(provider: string) {
    filters.providers = (filters.providers ?? []).filter(p => p !== provider);
    if (filters.providers.includes(provider)) {
      filters.providers = filters.providers.filter(p => p !== provider);
    } else {
      filters.providers = [...filters.providers, provider];
    }
    updateFilteredModels();
    updateTable();
  }
  function toggleModel(model: string) {
    filters.models = (filters.models ?? []).filter(m => m !== model);
    if (filters.models.includes(model)) {
      filters.models = filters.models.filter(m => m !== model);
    } else {
      filters.models = [...filters.models, model];
    }
    updateFilteredProviders();
    updateTable();
  }
  function removeProvider(provider: string) {
    filters.providers = (filters.providers ?? []).filter(p => p !== provider);
    updateFilteredModels();
    updateTable();
  }
  function removeModel(model: string) {
    filters.models = (filters.models ?? []).filter(m => m !== model);
    updateFilteredProviders();
    updateTable();
  }
  $: if (data.length > 0) {
  updateTable();
}
</script>

<style lang="scss">
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.analytics-table {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: $spacing-md;

  @media (max-width: $breakpoint-md) {
    padding: $spacing-sm;
  }

  .header {
    text-align: center;
    margin-bottom: $spacing-xl;
    color: white;

    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 $spacing-sm 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      
      @media (max-width: $breakpoint-md) {
        font-size: 2rem;
      }
    }

    p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .filters-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: $spacing-lg;
    margin-bottom: $spacing-lg;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative; // Add this to establish stacking context
    z-index: 1; // Lower than dropdown

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-md;

      h3 {
        margin: 0;
        color: #1f2937;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .toggle-filters {
        @include button-style(transparent, #4f46e5);
        border: 2px solid #4f46e5;
        border-radius: 12px;
        padding: $spacing-sm $spacing-md;
        font-weight: 500;
        transition: all 0.3s ease;

        @media (min-width: $breakpoint-md) {
          display: none;
        }

        &:hover {
          background: #4f46e5;
          color: white;
        }
      }
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-md $spacing-lg;
      transition: all 0.3s ease;

      @media (max-width: $breakpoint-lg) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: $breakpoint-md) {
        display: none;
        grid-template-columns: 1fr;
        &.show {
          display: grid;
        }
      }

      .filter-group {
        display: flex;
        flex-direction: column;

        label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: $spacing-xs;
        }

        input, select {
          padding: $spacing-sm $spacing-md;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          min-height: 42px;

          &:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }

          &::placeholder {
            color: #9ca3af;
          }

          &:disabled {
            background-color: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
          }
        }

        select[multiple] {
          min-height: 100px;
          resize: vertical;
        }
      }

      .filter-group.full-width {
        grid-column: 1 / -1;
      }

      .filter-group.half-width {
        @media (min-width: $breakpoint-md) {
          grid-column: span 1;
        }
      }

      .range-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $spacing-sm;
        align-items: end;

        .range-input {
          display: flex;
          flex-direction: column;

          label {
            font-size: 0.8rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 4px;
          }

          input {
            width: 100%;
            padding: $spacing-sm;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 0.3s ease;
            min-height: 38px;

            &:focus {
              border-color: #4f46e5;
              outline: none;
            }
          }
        }
      }
    }
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: $spacing-lg;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: $spacing-xs;

        @media (max-width: $breakpoint-md) {
          font-size: 1.5rem;
        }
      }

      .stat-label {
        color: #6b7280;
        font-size: 0.9rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      &.cost { .stat-value { color: #ef4444; } }
      &.avg-cost { .stat-value { color: #f59e0b; } }
      &.response { .stat-value { color: #10b981; } }
      &.efficiency { .stat-value { color: #8b5cf6; } }
    }
  }

  .chart-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: $spacing-lg;
    margin-bottom: $spacing-lg;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);

    h3 {
      margin: 0 0 $spacing-md 0;
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .chart {
      height: 300px;
      border-radius: 12px;
      overflow: hidden;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }
  }

  .actions {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    flex-wrap: wrap;

    button {
      @include button-style(rgba(255, 255, 255, 0.9), #4f46e5);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      padding: $spacing-md $spacing-lg;
      font-weight: 600;
      font-size: 0.95rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);

      &:hover {
        background: #4f46e5;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
      }

      @media (max-width: $breakpoint-md) {
        flex: 1;
        min-width: 120px;
      }
    }
  }

  .table-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);

    .table-header {
      padding: $spacing-lg;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
    }

    .table-container {
      overflow-x: auto;
      max-height: 600px;

      &.desktop-table {
        display: block;
        @media (max-width: $breakpoint-md) {
          display: none;
        }
      }

      &.mobile-cards {
        display: none;
        @media (max-width: $breakpoint-md) {
          display: block;
        }
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background: white;

        thead {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          position: sticky;
          top: 0;
          z-index: 2;

          th {
            padding: $spacing-md $spacing-sm;
            cursor: pointer;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            white-space: nowrap;
            font-size: 0.85rem;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: background-color 0.3s ease;
            min-width: 100px; /* Ensure minimum width */

            &:hover {
              background: rgba(79, 70, 229, 0.1);
            }

            &.sortable::after {
              content: '↕️';
              margin-left: $spacing-xs;
              opacity: 0.5;
            }
          }
        }

        tbody {
          tr {
            &:hover {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            }

            td {
              padding: $spacing-md $spacing-sm;
              border-bottom: 1px solid #f3f4f6;
              min-width: 100px; /* Match th min-width */
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;

              &.model {
                width: 120px;
                font-weight: 700;
                color: #4f46e5;
              }

              &.text {
                flex: 2;
                min-width: 200px;

                .truncate {
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 300px;
                }

                .full-text {
                  font-size: 0.85rem;
                  color: #6b7280;
                  background: #f9fafb;
                  padding: $spacing-sm;
                  border-radius: 8px;
                  margin-top: $spacing-xs;
                  border-left: 3px solid #4f46e5;
                  white-space: pre-wrap;
                  word-break: break-word;
                  overflow-wrap: anywhere;
                  max-height: 300px;
                  overflow-y: auto;
                }
              }

              &.tokens {
                font-weight: 600;
                
                &.warn {
                  color: #dc2626;
                  background: #fee2e2;
                  padding: 2px 6px;
                  border-radius: 6px;
                }
              }

              &.cost {
                font-weight: 700;
                
                &.low { color: #059669; }
                &.medium { color: #d97706; }
                &.high { color: #dc2626; }
              }

              button {
                @include button-style(#4f46e5);
                font-size: 0.8rem;
                padding: $spacing-xs $spacing-sm;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.3s ease;

                &:hover {
                  transform: scale(1.05);
                  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }
              }
            }
          }
        }
      }

      .row {
        display: none; /* Replaced with table rows */
      }

      table tr th:first-child,
      table tr td:first-child {
        padding-left: 1.5rem;
      }

      table tr th:last-child,
      table tr td:last-child {
        padding-right: 1.5rem;
      }
    }

    .mobile-cards {
      padding: $spacing-md;

      .mobile-card {
        background: white;
        border-radius: 16px;
        padding: $spacing-lg;
        margin-bottom: $spacing-md;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        border: 1px solid #e5e7eb;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $spacing-md;
          padding-bottom: $spacing-sm;
          border-bottom: 2px solid #e5e7eb;

          .model-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: #4f46e5;
          }

          .timestamp {
            font-size: 0.8rem;
            color: #6b7280;
          }
        }

        .card-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: $spacing-sm $spacing-md;
          margin-bottom: $spacing-md;

          .field {
            .label {
              font-size: 0.8rem;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            }

            .value {
              font-size: 0.95rem;
              font-weight: 600;
              color: #111827;
            }
          }
        }

        .card-text {
          margin-bottom: $spacing-md;

          .text-section {
            margin-bottom: $spacing-sm;

            .text-label {
              font-size: 0.8rem;
              font-weight: 600;
              color: #6b7280;
              margin-bottom: 2px;
            }

            .text-content {
              background: #f9fafb;
              padding: $spacing-sm;
              border-radius: 8px;
              border-left: 3px solid #4f46e5;
              font-size: 0.9rem;
              line-height: 1.4;
            }
          }
        }

        .card-actions {
          display: flex;
          justify-content: center;

          button {
            @include button-style(#4f46e5);
            padding: $spacing-sm $spacing-lg;
            border-radius: 12px;
            font-weight: 600;
          }
        }
      }
    }
  }
}

.multi-select {
  position: relative;
  z-index: 1010;
  .dropdown {
    position: absolute;
    z-index: 9999; /* Much higher to ensure on top of all cards */
    top: 110%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    max-height: 220px;
    overflow-y: auto;
    padding: 0.5rem 0;
    .dropdown-actions {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1rem 0.25rem 1rem;
      button {
        background: none;
        border: none;
        color: #4f46e5;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.95rem;
        padding: 0 0.5rem;
        &:hover { text-decoration: underline; }
      }
    }
    .dropdown-option {
      display: flex;
      align-items: center;
      padding: 4px 8px; // Remove quotes to fix CSS
      cursor: pointer;
      &:hover { background: #f3f4f6; }
      input[type="checkbox"] {
        margin-right: 0.5rem;
      }
      label {
        font-size: 1rem;
        color: #374151;
        cursor: pointer;
      }
    }
  }
  .selected-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
    .pill {
      background: #4f46e5;
      color: white;
      border-radius: 999px;
      padding: 0.2rem 0.75rem 0.2rem 0.75rem;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      button {
        background: none;
        border: none;
        color: white;
        font-size: 1.1rem;
        cursor: pointer;
        margin-left: 0.2rem;
        padding: 0;
        line-height: 1;
      }
    }
  }
  .multi-select-btn {
    width: 100%;
    padding: 0.6rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.3s;
    min-height: 42px;
    &:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    &:disabled {
      background-color: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }
}

// --- MOBILE DROPDOWN STYLES ---
@media (max-width: 600px) {
  .multi-select {
    z-index: unset;
    .dropdown {
      left: 0 !important;
      right: 0 !important;
      min-width: 80vw !important;
      width: 85vw !important;
      max-width: 95vw !important;
      border-radius: 16px !important;
      font-size: 1.05rem;
      padding: 0.25rem 0.25rem !important;
      max-height: 60vh !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }
    .dropdown-option {
      padding: 10px 12px !important;
      font-size: 1.08rem !important;
      label {
        font-size: 1.08rem !important;
      }
      input[type="checkbox"] {
        width: 22px;
        height: 22px;
      }
    }
    .dropdown-actions {
      padding: 0.5rem 0.5rem 0.25rem 0.5rem !important;
      button {
        font-size: 1.08rem !important;
      }
    }
  }
}
</style>

<div class="analytics-table">
<div class="container">
  <div class="header">
    <h1>AI Query Analytics</h1>
    <p>Track, analyze, and optimize your AI model usage</p>
  </div>

  <div class="filters-section">
    <div class="filters-header">
      <h3>Filters & Search</h3>
      <button class="toggle-filters" on:click={() => showFilters = !showFilters}>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>
    </div>
    
    <div class="filters" class:show={showFilters}>
      <div class="filter-group full-width">
        <label for="filter-search">Search Queries</label>
        <input
          type="text"
          placeholder="Search input/output..."
          id="filter-search"
          bind:value={filters.search}
          on:input={updateTable}
        />
      </div>

      <div class="filter-group half-width">
        <label for="filter-providers">Providers</label>
        <div class="multi-select">
          <div class="selected-pills">
            {#each (filters.providers ?? []).filter(p => availableProviders.includes(p)) as provider (provider)}
              <span class="pill">{provider}
                <button aria-label="Remove" on:click={() => removeProvider(provider)}>&times;</button>
              </span>
            {/each}
          </div>
          <button class="multi-select-btn" type="button" on:click={toggleProviderDropdown} aria-haspopup="listbox" aria-expanded={showProviderDropdown}>
            {(filters.providers ?? []).length > 0 ? `${(filters.providers ?? []).length} selected` : 'Select providers...'}
          </button>
          {#if showProviderDropdown}
            <div class="dropdown" role="listbox" tabindex="0">
              <div class="dropdown-actions">
                <button type="button" on:click={selectAllProviders}>Select All</button>
                <div>
                <button type="button" on:click={clearProviders}>Clear</button>
                <button type="button" aria-label="Close" style="float:right" on:click={closeDropdowns}>&#10005;</button>
              </div>
              </div>
              {#each availableProviders as provider}
                <div class="dropdown-option" role="option" tabindex="0" aria-selected={(filters.providers ?? []).includes(provider)}>
                  <input type="checkbox" id={`prov-${provider}`} checked={(filters.providers ?? []).includes(provider)} on:change={() => toggleProvider(provider)} />
                  <label for={`prov-${provider}`}>{provider}</label>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="filter-group half-width">
        <label for="filter-models">Models</label>
        <div class="multi-select">
          <div class="selected-pills">
            {#each (filters.models ?? []).filter(m => filteredModels.includes(m)) as model (model)}
              <span class="pill">{model}
                <button aria-label="Remove" on:click={() => removeModel(model)}>&times;</button>
              </span>
            {/each}
          </div>
          <button class="multi-select-btn" type="button" on:click={toggleModelDropdown} aria-haspopup="listbox" aria-expanded={showModelDropdown} disabled={filteredModels.length === 0}>
            {(filters.models ?? []).length > 0 ? `${(filters.models ?? []).length} selected` : 'Select models...'}
          </button>
          {#if showModelDropdown}
            <div class="dropdown" role="listbox" tabindex="0">
              <div class="dropdown-actions">
                <button type="button" on:click={selectAllModels} disabled={filteredModels.length === 0}>Select All</button>
                <div>
                <button type="button" on:click={clearModels}>Clear</button>
                <button type="button" aria-label="Close" style="float:right" on:click={closeDropdowns}>&#10005;</button>
              </div>
              </div>
              {#each filteredModels as model}
                <div class="dropdown-option" role="option" tabindex="0" aria-selected={(filters.models ?? []).includes(model)}>
                  <input type="checkbox" id={`model-${model}`} checked={(filters.models ?? []).includes(model)} on:change={() => toggleModel(model)} />
                  <label for={`model-${model}`}>{model}</label>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="filter-group">
        <div>Date Range</div>
        <div class="range-group">
          <div class="range-input">
            <label for="filter-date-start">From</label>
            <input 
              id="filter-date-start" 
              type="date" 
              on:change={(e) => onDateChange('start', (e.target as HTMLInputElement).value)} 
            />
          </div>
          <div class="range-input">
            <label for="filter-date-end">To</label>
            <input 
              id="filter-date-end" 
              type="date" 
              on:change={(e) => onDateChange('end', (e.target as HTMLInputElement).value)} 
            />
          </div>
        </div>
      </div>

      <div class="filter-group">
        <div>Cost Range ($)</div>
        <div class="range-group">
          <div class="range-input">
            <label for="filter-cost-min">Min</label>
            <input 
              id="filter-cost-min" 
              type="number" 
              step="0.0001" 
              placeholder="0.0000" 
              on:input={(e) => onRangeChange('cost', 'min', (e.target as HTMLInputElement).value)} 
            />
          </div>
          <div class="range-input">
            <label for="filter-cost-max">Max</label>
            <input 
              id="filter-cost-max" 
              type="number" 
              step="0.0001" 
              placeholder="1.0000" 
              on:input={(e) => onRangeChange('cost', 'max', (e.target as HTMLInputElement).value)} 
            />
          </div>
        </div>
      </div>

      <div class="filter-group">
        <div>Token Range (Input+Output)</div>
        <div class="range-group">
          <div class="range-input">
            <label for="filter-token-min">Min</label>
            <input 
              id="filter-token-min" 
              type="number" 
              placeholder="0" 
              on:input={(e) => onRangeChange('token', 'min', (e.target as HTMLInputElement).value)} 
            />
          </div>
          <div class="range-input">
            <label for="filter-token-max">Max</label>
            <input 
              id="filter-token-max" 
              type="number" 
              placeholder="10000" 
              on:input={(e) => onRangeChange('token', 'max', (e.target as HTMLInputElement).value)} 
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="summary">
    <div class="stat-card cost">
      <div class="stat-value">${analytics.totalCost.toFixed(4)}</div>
      <div class="stat-label">Total Cost</div>
    </div>
    <div class="stat-card avg-cost">
      <div class="stat-value">${analytics.avgCost.toFixed(4)}</div>
      <div class="stat-label">Average Cost</div>
    </div>
    <div class="stat-card response">
      <div class="stat-value">{analytics.avgResponseTime.toFixed(0)}ms</div>
      <div class="stat-label">Avg Response Time</div>
    </div>
    <div class="stat-card efficiency">
      <div class="stat-value">{analytics.tokenEfficiency.toFixed(2)}</div>
      <div class="stat-label">Token Efficiency</div>
    </div>
  </div>

  {#if filteredData.length > 0}
  <div class="chart-section">
    <h3>Cost Trends Over Time</h3>
    <div class="chart">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.2" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.1" />
              </linearGradient>
            </defs>
            
            <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="url(#chartGradient)" opacity="0.05" rx="12" />
            
            {#each yAxisLabels as yLabel}
              <line 
                x1={chartPadding} 
                y1={yLabel.y} 
                x2={chartWidth - chartPadding} 
                y2={yLabel.y} 
                stroke="#e5e7eb" 
                stroke-width="1" 
                opacity="0.5"
              />
            {/each}
            
            {#each xAxisLabels as xLabel}
              <line 
                x1={xLabel.x} 
                y1={chartPadding} 
                x2={xLabel.x} 
                y2={chartHeight - chartPadding} 
                stroke="#e5e7eb" 
                stroke-width="1" 
                opacity="0.3"
              />
            {/each}
            
            <line 
              x1={chartPadding} 
              y1={chartPadding} 
              x2={chartPadding} 
              y2={chartHeight - chartPadding} 
              stroke="#6b7280" 
              stroke-width="2" 
            />
            <line 
              x1={chartPadding} 
              y1={chartHeight - chartPadding} 
              x2={chartWidth - chartPadding} 
              y2={chartHeight - chartPadding} 
              stroke="#6b7280" 
              stroke-width="2" 
            />
            
            {#if chartPoints && filteredData.length > 0}
              {#if filteredData.length === 1}
                <circle 
                  cx={chartPoints.split(',')[0]} 
                  cy={chartPoints.split(',')[1]} 
                  r="8" 
                  fill="#4f46e5" 
                  stroke="white" 
                  stroke-width="3" 
                />
              {:else}
                {@const firstPoint = chartPoints.split(' ')[0]}
                {@const lastPoint = chartPoints.split(' ')[chartPoints.split(' ').length - 1]}
                <polygon 
                  fill="url(#areaGradient)" 
                  points={`${chartPadding},${chartHeight - chartPadding} ${chartPoints} ${lastPoint.split(',')[0]},${chartHeight - chartPadding}`}
                />
                
                <polyline 
                  fill="none" 
                  stroke="url(#chartGradient)" 
                  stroke-width="3" 
                  points={chartPoints}
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                
                {#each chartPoints.split(' ') as point, index}
                  {@const coords = point.split(',')}
                  {@const item = filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[index]}
                  <circle 
                    cx={coords[0]} 
                    cy={coords[1]} 
                    r="5" 
                    fill="#4f46e5" 
                    stroke="white" 
                    stroke-width="2"
                  >
                    <title>
                      {new Date(item?.timestamp).toLocaleDateString()}: ${item?.cost.toFixed(4)}
                    </title>
                  </circle>
                {/each}
              {/if}
            {:else}
              <text 
                x={chartWidth / 2} 
                y={chartHeight / 2} 
                text-anchor="middle" 
                fill="#9ca3af" 
                font-size="16"
              >
                No data available
              </text>
            {/if}
            
            {#each yAxisLabels as yLabel}
              <text 
                x={chartPadding - 10} 
                y={yLabel.y + 4} 
                text-anchor="end" 
                fill="#6b7280" 
                font-size="12"
                font-weight="500"
              >
                {yLabel.label}
              </text>
            {/each}
            
            {#each xAxisLabels as xLabel}
              <text 
                x={xLabel.x} 
                y={chartHeight - chartPadding + 20} 
                text-anchor="middle" 
                fill="#6b7280" 
                font-size="12"
                font-weight="500"
              >
                {xLabel.label}
              </text>
            {/each}
            
            <text 
              x={chartWidth / 2} 
              y={20} 
              text-anchor="middle" 
              fill="#374151" 
              font-size="14"
              font-weight="600"
            >
              Cost per Query Over Time
            </text>
          </svg>
    </div>
  </div>
  {/if}

  <div class="actions">
    <button on:click={() => exportToCSV(filteredData)}>Export CSV</button>
    <button on:click={() => exportToJSON(filteredData)}>Export JSON</button>
  </div>

  <div class="table-section">
    <div class="table-header">
      <h3>Query Results ({filteredData.length} items)</h3>
    </div>

    <div class="table-container desktop-table">
      <table>
        <thead>
          <tr>
            <th class="sortable" on:click={() => toggleSort('model')}>Model</th>
            <th>Input</th>
            <th>Output</th>
            <th class="sortable" on:click={() => toggleSort('inputTokens')}>Input Tokens</th>
            <th class="sortable" on:click={() => toggleSort('outputTokens')}>Output Tokens</th>
            <th class="sortable" on:click={() => toggleSort('cost')}>Cost</th>
            <th class="sortable" on:click={() => toggleSort('timestamp')}>Timestamp</th>
            <th class="sortable" on:click={() => toggleSort('responseTime')}>Response Time</th>
            <th>Efficiency</th>
            <th>Cost/Token</th>
            <th>Provider</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#if filteredData.length <= 100}
            {#each filteredData as item}
              <tr>
                <td class="model">{item.model}</td>
                <td class="text">
                  <div class="truncate">{item.input}</div>
                  {#if expandedRow === item.id}
                    <div class="full-text">{item.input}</div>
                  {/if}
                </td>
                <td class="text">
                  <div class="truncate">{item.output}</div>
                  {#if expandedRow === item.id}
                    <div class="full-text">{item.output}</div>
                  {/if}
                </td>
                <td class="tokens {totalTokensOf(item) > 200 ? 'warn' : ''}">{item.inputTokens}</td>
                <td class="tokens {totalTokensOf(item) > 200 ? 'warn' : ''}">{item.outputTokens}</td>
                <td class="cost {getCostColor(item.cost)}">{formatCurrency(item.cost)}</td>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{item.responseTime} ms</td>
                <td>{efficiencyOf(item).toFixed(2)}</td>
                <td>{costPerTokenOf(item).toFixed(6)}</td>
                <td>{item.provider}</td>
                <td>
                  <button on:click={() => toggleExpand(item.id)}>
                    {expandedRow === item.id ? 'Collapse' : 'Expand'}
                  </button>
                </td>
              </tr>
            {/each}
          {:else}
            <VirtualList items={filteredData} let:item rowHeight={rowHeight} height={520}>
              <tr>
                <td class="model">{item.model}</td>
                <td class="text">
                  <div class="truncate">{item.input}</div>
                  {#if expandedRow === item.id}
                    <div class="full-text">{item.input}</div>
                  {/if}
                </td>
                <td class="text">
                  <div class="truncate">{item.output}</div>
                  {#if expandedRow === item.id}
                    <div class="full-text">{item.output}</div>
                  {/if}
                </td>
                <td class="tokens {totalTokensOf(item) > 200 ? 'warn' : ''}">{item.inputTokens}</td>
                <td class="tokens {totalTokensOf(item) > 200 ? 'warn' : ''}">{item.outputTokens}</td>
                <td class="cost {getCostColor(item.cost)}">{formatCurrency(item.cost)}</td>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td>{item.responseTime} ms</td>
                <td>{efficiencyOf(item).toFixed(2)}</td>
                <td>{costPerTokenOf(item).toFixed(6)}</td>
                <td>{item.provider}</td>
                <td>
                  <button on:click={() => toggleExpand(item.id)}>
                    {expandedRow === item.id ? 'Collapse' : 'Expand'}
                  </button>
                </td>
              </tr>
            </VirtualList>
          {/if}
        </tbody>
      </table>
    </div>

    <div class="table-container mobile-cards">
      {#each filteredData as item}
        <div class="mobile-card">
          <div class="card-header">
            <div class="model-name">{item.model}</div>
            <div class="timestamp">{new Date(item.timestamp).toLocaleDateString()}</div>
          </div>

          <div class="card-content">
            <div class="field">
              <div class="label">Input Tokens</div>
              <div class="value {totalTokensOf(item) > 200 ? 'warn' : ''}">{item.inputTokens}</div>
            </div>
            <div class="field">
              <div class="label">Output Tokens</div>
              <div class="value {totalTokensOf(item) > 200 ? 'warn' : ''}">{item.outputTokens}</div>
            </div>
            <div class="field">
              <div class="label">Cost</div>
              <div class="value cost {getCostColor(item.cost)}">{formatCurrency(item.cost)}</div>
            </div>
            <div class="field">
              <div class="label">Response Time</div>
              <div class="value">{item.responseTime}ms</div>
            </div>
            <div class="field">
              <div class="label">Efficiency</div>
              <div class="value">{efficiencyOf(item).toFixed(2)}</div>
            </div>
            <div class="field">
              <div class="label">Provider</div>
              <div class="value">{item.provider}</div>
            </div>
          </div>

          {#if expandedRow === item.id}
            <div class="card-text">
              <div class="text-section">
                <div class="text-label">Input Query</div>
                <div class="text-content">{item.input}</div>
              </div>
              <div class="text-section">
                <div class="text-label">Model Response</div>
                <div class="text-content">{item.output}</div>
              </div>
            </div>
          {/if}

          <div class="card-actions">
            <button on:click={() => toggleExpand(item.id)}>
              {expandedRow === item.id ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
</div>
