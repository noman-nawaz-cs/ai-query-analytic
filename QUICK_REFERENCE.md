# AIQueryAnalyticsTable - Quick Reference

## 🚀 Quick Start

```svelte
<script>
  import AIQueryAnalyticsTable from '$lib/components/AIQueryAnalyticsTable.svelte';
  import type { AIQueryRecord } from '$lib/types/ai-query.js';
  
  let data: AIQueryRecord[] = [];
</script>

<AIQueryAnalyticsTable {data} />
```

## 📋 Required Data Structure

```typescript
interface AIQueryRecord {
  id: string;                    // Unique identifier
  model: string;                 // 'gpt-4', 'gemini-pro', etc.
  provider: 'openai' | 'gemini'; // AI provider
  input: string;                 // User query
  output: string;                // AI response
  inputTokens: number;           // Input token count
  outputTokens: number;          // Output token count
  cost: number;                  // Cost in USD
  timestamp: Date;               // Query timestamp
  responseTime: number;          // Response time in ms
  modelVersion?: string;         // Optional
}
```

## 🔧 Key Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `AIQueryRecord[]` | ✅ | `[]` | Array of query records |

## 🎯 Supported Models

### OpenAI
- `gpt-4`
- `gpt-4o-mini`
- `gpt-3.5-turbo`

### Gemini
- `gemini-pro`
- `gemini-1.5-pro`

## 🔍 Filter Options

```typescript
interface AIQueryFilterOptions {
  models?: string[];                    // Model names
  providers?: string[];                 // 'openai' | 'gemini'
  dateRange?: { start: Date; end: Date };
  costRange?: { min: number; max: number };
  tokenRange?: { min: number; max: number };
  search?: string;                      // Text search
}
```

## 📊 Available Analytics

- **Total Cost**: Sum of all query costs
- **Average Cost**: Mean cost per query
- **Response Time**: Average response time
- **Token Efficiency**: Output/Input token ratio
- **Cost per Token**: Cost divided by total tokens

## 🎨 Styling Classes

### Main Containers
- `.analytics-table` - Root container
- `.filters-section` - Filter controls
- `.summary` - Statistics cards
- `.chart-section` - Cost trend chart
- `.table-section` - Data table

### Filter Elements
- `.filter-group` - Individual filter container
- `.multi-select` - Dropdown container
- `.dropdown` - Dropdown menu
- `.selected-pills` - Selected filter tags

### Table Elements
- `.desktop-table` - Desktop table view
- `.mobile-cards` - Mobile card layout
- `.sortable` - Sortable column headers

## 📱 Responsive Breakpoints

- **Desktop**: >768px - Full table, side filters
- **Mobile**: ≤768px - Cards, collapsible filters

## 🚀 Performance Features

- **Virtual Scrolling**: Auto-enabled for >100 items
- **Row Height**: Configurable (default: 80px)
- **Efficient Updates**: Reactive, minimal re-renders

## 🔒 Accessibility

- **ARIA Labels**: Proper dropdown and table labels
- **Keyboard Navigation**: Tab, Enter, Space, Escape
- **Screen Reader**: Semantic HTML structure

## 🐛 Common Issues

### Filters Not Working
```typescript
// Ensure data structure matches interface
console.log('Data:', data);
console.log('Filters:', filters);
```

### Chart Not Displaying
```typescript
// Check if data has valid timestamps and costs
console.log('Filtered data:', filteredData);
```

### Mobile Dropdown Issues
```scss
// Verify z-index in CSS
.multi-select .dropdown {
  z-index: 9999;
}
```

## 🔧 Customization Examples

### Override Colors
```scss
.analytics-table {
  .header h1 { color: #your-brand; }
  .stat-card { background: your-theme; }
}
```

### Custom Analytics
```typescript
// Override default analytics
function customAnalytics(data: AIQueryRecord[]) {
  return {
    ...computeAnalytics(data),
    customMetric: calculateCustom(data)
  };
}
```

### Export Customization
```typescript
import { exportToCSV, exportToJSON } from '$lib/utils/export.js';

// Custom export
function customExport() {
  const customData = filteredData.map(item => ({
    ...item,
    customField: 'value'
  }));
  exportToCSV(customData);
}
```

## 📚 Key Functions

### Core Functions
- `updateTable()` - Apply filters and sorting
- `updateFilteredModels()` - Update available models
- `updateFilteredProviders()` - Update available providers
- `toggleSort(key)` - Handle column sorting
- `toggleExpand(id)` - Expand/collapse rows

### Filter Functions
- `selectAllProviders()` - Select all providers
- `clearProviders()` - Clear provider selection
- `toggleProvider(provider)` - Toggle provider
- `selectAllModels()` - Select all models
- `clearModels()` - Clear model selection
- `toggleModel(model)` - Toggle model

### Range Functions
- `onDateChange(which, value)` - Date range filter
- `onRangeChange(kind, side, value)` - Cost/token range

## 🎯 Integration Patterns

### With SvelteKit
```typescript
// +page.server.ts
export async function load() {
  const queries = await fetchQueries();
  return { queries };
}

// +page.svelte
<script>
  export let data;
</script>

<AIQueryAnalyticsTable data={data.queries} />
```

### With Stores
```typescript
// stores/queries.js
import { writable } from 'svelte/store';
export const queries = writable([]);

// Component
<script>
  import { queries } from '$lib/stores/queries.js';
</script>

<AIQueryAnalyticsTable data={$queries} />
```

### With API
```typescript
<script>
  let data = [];
  
  async function fetchData() {
    const response = await fetch('/api/ai-queries');
    data = await response.json();
  }
  
  onMount(fetchData);
</script>

<AIQueryAnalyticsTable {data} />
```

## 📖 Full Documentation

- **User Guide**: `README.md`
- **Technical Docs**: `COMPONENT_DOCS.md`
- **Types**: `src/lib/types/ai-query.ts`
- **Utilities**: `src/lib/utils/`

---

**Quick Tip**: The component automatically handles provider-model relationships, so selecting OpenAI will only show OpenAI models, and vice versa.
