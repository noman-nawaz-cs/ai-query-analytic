# AIQueryAnalyticsTable Component - Technical Documentation

## 📋 Component Overview

**File**: `src/lib/components/AIQueryAnalyticsTable.svelte`  
**Type**: Svelte Component  
**Purpose**: Comprehensive AI query analytics and visualization component

## 🏗️ Architecture

### Component Structure
```
AIQueryAnalyticsTable.svelte
├── Script Section (TypeScript)
├── Style Section (SCSS)
└── Template Section (Svelte)
```

### Dependencies
- **Core**: Svelte framework
- **Virtual List**: `@sveltejs/svelte-virtual-list`
- **Utilities**: `filters.js`, `analytics.js`, `export.js`
- **Types**: `AIQueryRecord`, `AIQueryFilterOptions`

## 🔧 Script Section

### Props
```typescript
export let data: AIQueryRecord[] = [];
```

### Internal State Variables

#### Filter State
```typescript
let filters: AIQueryFilterOptions = {
  models: [],
  providers: [],
  search: '',
  dateRange: undefined,
  costRange: undefined,
  tokenRange: undefined
};
```

#### UI State
```typescript
let sortKey: keyof AIQueryRecord = 'timestamp';
let sortOrder: 'asc' | 'desc' = 'desc';
let expandedRow: string | null = null;
let showFilters = false;
let showProviderDropdown = false;
let showModelDropdown = false;
```

#### Data State
```typescript
let filteredData: AIQueryRecord[] = [];
let analytics = computeAnalytics(data);
let availableModels: string[] = Object.keys(modelProviderMap);
let availableProviders: string[] = Object.keys(providerModelsMap);
let filteredModels: string[] = [];
```

### Provider-Model Mapping

#### Static Mappings
```typescript
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
```

### Chart Configuration
```typescript
const rowHeight = 80;
const chartWidth = 800;
const chartHeight = 260;
const chartPadding = 40;
```

## 🔄 Lifecycle & Reactivity

### onMount Hook
```typescript
onMount(() => {
  updateFilteredModels();
  updateFilteredProviders();
  updateTable();
});
```

### Reactive Statements
```typescript
$: {
  if (filteredData.length > 0) {
    // Chart generation logic
    // Updates chartPoints, xAxisLabels, yAxisLabels
  }
}

$: if (data.length > 0) {
  updateTable();
}
```

## 🎯 Core Functions

### Data Management

#### `updateTable()`
Main function that applies filters and sorting to data.
```typescript
function updateTable() {
  const temp = applyFilters(data, filters);
  filteredData = applySorting(temp, sortKey, sortOrder);
  analytics = computeAnalytics(filteredData);
}
```

#### `updateFilteredModels()`
Updates available models based on selected providers.
```typescript
function updateFilteredModels() {
  const providers = filters.providers ?? [];
  if (providers.length === 0) {
    filteredModels = [];
  } else {
    filteredModels = providers.reduce((acc: string[], provider: string) => {
      const providerModels = providerModelsMap[provider] || [];
      return acc.concat(providerModels);
    }, []);
  }
  filters.models = (filters.models ?? []).filter(model => 
    filteredModels.includes(model)
  );
}
```

#### `updateFilteredProviders()`
Updates available providers based on selected models.
```typescript
function updateFilteredProviders() {
  const models = filters.models ?? [];
  if (models.length === 0) return;
  
  const modelProviders = models.map(model => modelProviderMap[model]).filter(Boolean);
  const uniqueProviders = Array.from(new Set(modelProviders));
  const currentProviders = new Set(filters.providers ?? []);
  const requiredProviders = new Set(uniqueProviders);
  
  if (!Array.from(requiredProviders).every(p => currentProviders.has(p as string)) ||
      !Array.from(currentProviders).every(p => requiredProviders.has(p as string))) {
    filters.providers = uniqueProviders;
  }
}
```

### Sorting & Interaction

#### `toggleSort(key: keyof AIQueryRecord)`
Handles column sorting with toggle behavior.
```typescript
function toggleSort(key: keyof AIQueryRecord) {
  if (sortKey === key) {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortOrder = 'asc';
  }
  updateTable();
}
```

#### `toggleExpand(id: string)`
Manages row expansion state.
```typescript
function toggleExpand(id: string) {
  expandedRow = expandedRow === id ? null : id;
}
```

### Filter Management

#### Provider Functions
```typescript
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

function toggleProvider(provider: string) {
  if (filters.providers.includes(provider)) {
    filters.providers = filters.providers.filter(p => p !== provider);
  } else {
    filters.providers = [...filters.providers, provider];
  }
  updateFilteredModels();
  updateTable();
}
```

#### Model Functions
```typescript
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

function toggleModel(model: string) {
  if (filters.models.includes(model)) {
    filters.models = filters.models.filter(m => m !== model);
  } else {
    filters.models = [...filters.models, model];
  }
  updateFilteredProviders();
  updateTable();
}
```

### Range Filter Handlers

#### `onDateChange(which: 'start' | 'end', value: string)`
Handles date range filter updates.
```typescript
function onDateChange(which: 'start' | 'end', value: string) {
  const current = filters.dateRange ?? { 
    start: undefined as Date | undefined, 
    end: undefined as Date | undefined 
  };
  const date = value ? new Date(value) : undefined;
  filters = {
    ...filters,
    dateRange: { 
      start: which === 'start' ? date! : current.start!, 
      end: which === 'end' ? date! : current.end! 
    }
  };
  updateTable();
}
```

#### `onRangeChange(kind: 'cost' | 'token', side: 'min' | 'max', value: string)`
Handles cost and token range filter updates.
```typescript
function onRangeChange(kind: 'cost' | 'token', side: 'min' | 'max', value: string) {
  const num = value === '' ? undefined : Number(value);
  if (kind === 'cost') {
    const current = filters.costRange ?? { 
      min: undefined as number | undefined, 
      max: undefined as number | undefined 
    };
    filters = { 
      ...filters, 
      costRange: { 
        min: side === 'min' ? num! : current.min!, 
        max: side === 'max' ? num! : current.max! 
      } 
    };
  } else {
    const current = filters.tokenRange ?? { 
      min: undefined as number | undefined, 
      max: undefined as number | undefined 
    };
    filters = { 
      ...filters, 
      tokenRange: { 
        min: side === 'min' ? num! : current.min!, 
        max: side === 'max' ? num! : current.max! 
      } 
    };
  }
  updateTable();
}
```

### Utility Functions

#### `getCostColor(cost: number)`
Returns CSS class for cost-based styling.
```typescript
function getCostColor(cost: number) {
  if (cost < 0.01) return 'low';
  if (cost < 0.05) return 'medium';
  return 'high';
}
```

#### `formatCurrency(value: number)`
Formats cost values with 4 decimal precision.
```typescript
function formatCurrency(value: number) {
  return `$${value.toFixed(4)}`;
}
```

#### Analytics Calculations
```typescript
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
```

## 📊 Chart Generation

### Chart Data Processing
The component generates SVG charts based on filtered data:

1. **Data Series Creation**: Maps timestamp and cost data
2. **Coordinate Calculation**: Converts data to SVG coordinates
3. **Axis Label Generation**: Creates time and cost labels
4. **Chart Rendering**: Generates SVG elements with gradients

### Chart Elements
- **Background**: Gradient-filled rectangle
- **Grid Lines**: Horizontal and vertical guidelines
- **Axes**: X and Y axis lines
- **Data Line**: Polyline connecting data points
- **Data Points**: Circles with tooltips
- **Area Fill**: Gradient-filled polygon below data line

## 🎨 Styling Architecture

### SCSS Structure
```scss
.analytics-table {
  // Main container
  .header { /* Title and description */ }
  .filters-section { /* Filter controls */ }
  .summary { /* Statistics cards */ }
  .chart-section { /* Cost trend chart */ }
  .actions { /* Export buttons */ }
  .table-section { /* Data table */ }
}
```

### Responsive Breakpoints
- **Desktop**: >768px - Full table, side-by-side filters
- **Mobile**: ≤768px - Card layout, collapsible filters

### CSS Variables
Uses SCSS variables from `src/styles/variables.scss`:
- Spacing scale (`$spacing-xs` to `$spacing-xl`)
- Breakpoints (`$breakpoint-md`, `$breakpoint-lg`)
- Color schemes and gradients

## 📱 Mobile Optimization

### Responsive Features
1. **Collapsible Filters**: Toggle button for mobile
2. **Card Layout**: Mobile-optimized data display
3. **Touch-Friendly**: Larger touch targets
4. **Optimized Dropdowns**: Full-width mobile dropdowns

### Mobile-Specific Styles
```scss
@media (max-width: 600px) {
  .multi-select {
    .dropdown {
      left: 0 !important;
      right: 0 !important;
      min-width: 80vw !important;
      width: 85vw !important;
      max-width: 95vw !important;
    }
  }
}
```

## 🚀 Performance Optimizations

### Virtual Scrolling
- **Threshold**: Automatically switches at 100+ items
- **Row Height**: Configurable (default: 80px)
- **Memory Management**: Only renders visible rows

### Efficient Updates
- **Reactive Statements**: Minimal re-renders
- **Debounced Filters**: Prevents excessive updates
- **Optimized Chart**: SVG-based rendering

## 🔒 Accessibility Features

### ARIA Labels
- **Dropdowns**: `aria-haspopup="listbox"`, `aria-expanded`
- **Options**: `role="option"`, `aria-selected`
- **Buttons**: Descriptive labels and actions

### Keyboard Navigation
- **Tab Order**: Logical tab sequence
- **Enter/Space**: Dropdown activation
- **Escape**: Dropdown closure

### Screen Reader Support
- **Semantic HTML**: Proper table structure
- **Descriptive Text**: Clear labels and instructions
- **Status Updates**: Dynamic content announcements

## 🧪 Testing Considerations

### Component Testing
1. **Filter Logic**: Test all filter combinations
2. **Sorting**: Verify column sorting behavior
3. **Responsiveness**: Test mobile and desktop views
4. **Performance**: Large dataset handling

### Edge Cases
1. **Empty Data**: Handle empty arrays gracefully
2. **Invalid Data**: Robust error handling
3. **Filter Conflicts**: Provider-model relationships
4. **Date Formats**: Various timestamp formats

## 🔧 Customization Points

### Styling Overrides
```scss
.analytics-table {
  // Override default colors
  .header h1 { color: #your-brand; }
  
  // Custom filter styles
  .filters-section { background: your-theme; }
  
  // Modify chart appearance
  .chart-section { border-radius: your-radius; }
}
```

### Function Overrides
```typescript
// Override default analytics calculation
function customAnalytics(data: AIQueryRecord[]) {
  return {
    ...computeAnalytics(data),
    customMetric: calculateCustomMetric(data)
  };
}
```

## 📚 Integration Examples

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
  import AIQueryAnalyticsTable from '$lib/components/AIQueryAnalyticsTable.svelte';
</script>

<AIQueryAnalyticsTable data={data.queries} />
```

### With External State Management
```typescript
// stores/queries.js
import { writable } from 'svelte/store';

export const queries = writable([]);
export const filters = writable({});

// Component usage
<script>
  import { queries, filters } from '$lib/stores/queries.js';
  
  $: if ($queries.length > 0) {
    // Handle data updates
  }
</script>
```

---

This technical documentation provides comprehensive details for developers working with or extending the AIQueryAnalyticsTable component. For user-facing documentation, see the main README.md file.
