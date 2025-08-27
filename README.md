# AI Query Analytics Table Component

A comprehensive, feature-rich Svelte component for analyzing and visualizing AI model usage data. This component provides advanced filtering, sorting, analytics, and export capabilities for tracking AI query performance and costs.

## 🚀 Features

### Core Functionality
- **Data Visualization**: Interactive table with expandable rows for detailed query information
- **Advanced Filtering**: Multi-criteria filtering by model, provider, date range, cost, and tokens
- **Real-time Analytics**: Dynamic calculation of cost metrics, response times, and token efficiency
- **Responsive Design**: Mobile-optimized with card layout and desktop table view
- **Virtual Scrolling**: Efficient rendering for large datasets using virtual list
- **Interactive Charts**: SVG-based cost trend visualization over time

### Filtering Capabilities
- **Text Search**: Search across input and output content
- **Provider Selection**: Multi-select dropdown for AI providers (OpenAI, Gemini)
- **Model Selection**: Dynamic model filtering based on selected providers
- **Date Range**: Start and end date filtering
- **Cost Range**: Min/max cost filtering with 4-decimal precision
- **Token Range**: Min/max token filtering (input + output)

### Analytics & Metrics
- **Cost Analysis**: Total cost, average cost per query
- **Performance Metrics**: Average response time, token efficiency
- **Trend Visualization**: Cost trends over time with interactive chart
- **Model Statistics**: Per-model performance analytics

### Export & Data Management
- **CSV Export**: Download filtered data as CSV
- **JSON Export**: Download filtered data as JSON
- **Sorting**: Click-to-sort on any column
- **Row Expansion**: Expand/collapse individual rows for full content

## 📦 Installation

```bash
npm install @sveltejs/svelte-virtual-list
```

## 🔧 Usage

### Basic Implementation

```svelte
<script>
  import AIQueryAnalyticsTable from '$lib/components/AIQueryAnalyticsTable.svelte';
  import type { AIQueryRecord } from '$lib/types/ai-query.js';
  
  let queryData: AIQueryRecord[] = [
    {
      id: '1',
      model: 'gpt-4',
      provider: 'openai',
      input: 'What is artificial intelligence?',
      output: 'Artificial intelligence (AI) is...',
      inputTokens: 10,
      outputTokens: 50,
      cost: 0.0023,
      timestamp: new Date('2024-01-15'),
      responseTime: 1250
    }
    // ... more data
  ];
</script>

<AIQueryAnalyticsTable data={queryData} />
```

### With TypeScript

```svelte
<script lang="ts">
  import AIQueryAnalyticsTable from '$lib/components/AIQueryAnalyticsTable.svelte';
  import type { AIQueryRecord } from '$lib/types/ai-query.js';
  
  let queryData: AIQueryRecord[] = [];
  
  // Fetch data from API
  async function fetchData() {
    const response = await fetch('/api/ai-queries');
    queryData = await response.json();
  }
</script>

<AIQueryAnalyticsTable {data} />
```

## 📋 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `AIQueryRecord[]` | ✅ | `[]` | Array of AI query records to analyze |

## 🏗️ Data Structure

### AIQueryRecord Interface

```typescript
interface AIQueryRecord {
  id: string;                    // Unique identifier
  model: string;                 // AI model name (e.g., 'gpt-4', 'gemini-pro')
  provider: 'openai' | 'gemini'; // AI provider
  input: string;                 // User input/query
  output: string;                // AI model response
  inputTokens: number;           // Input token count
  outputTokens: number;          // Output token count
  cost: number;                  // Query cost in USD
  timestamp: Date;               // Query timestamp
  responseTime: number;          // Response time in milliseconds
  modelVersion?: string;         // Optional model version
}
```

### Filter Options

```typescript
interface AIQueryFilterOptions {
  models?: string[];                    // Array of model names to include
  providers?: string[];                 // Array of providers to include
  dateRange?: {                         // Date range filter
    start: Date;
    end: Date;
  };
  costRange?: {                         // Cost range filter
    min: number;
    max: number;
  };
  tokenRange?: {                        // Token range filter
    min: number;
    max: number;
  };
  search?: string;                      // Text search query
}
```

## 🎨 Styling & Customization

### CSS Variables

The component uses SCSS variables for consistent theming:

```scss
// Available in src/styles/variables.scss
$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;
$spacing-xl: 2rem;

$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
```

### Custom Styling

```scss
// Override component styles
.analytics-table {
  .header h1 {
    color: #your-brand-color;
  }
  
  .stat-card {
    background: your-custom-background;
  }
}
```

## 🔍 Filtering Examples

### Filter by Provider

```typescript
// The component automatically handles provider-model relationships
// Selecting OpenAI will show: gpt-4, gpt-4o-mini, gpt-3.5-turbo
// Selecting Gemini will show: gemini-pro, gemini-1.5-pro
```

### Filter by Date Range

```typescript
// Date filtering is handled automatically when date inputs change
// Format: YYYY-MM-DD
```

### Filter by Cost Range

```typescript
// Cost filtering supports 4 decimal precision
// Example: min: 0.001, max: 0.100
```

## 📊 Analytics Calculations

### Cost Metrics
- **Total Cost**: Sum of all query costs
- **Average Cost**: Mean cost per query
- **Cost per Token**: Cost divided by total tokens (input + output)

### Performance Metrics
- **Response Time**: Average response time across all queries
- **Token Efficiency**: Output tokens / Input tokens ratio
- **Model Statistics**: Per-model performance breakdown

## 📱 Responsive Behavior

### Desktop View (>768px)
- Full table with all columns
- Side-by-side filters
- Interactive chart
- Virtual scrolling for large datasets

### Mobile View (≤768px)
- Card-based layout
- Collapsible filters
- Touch-optimized interactions
- Optimized dropdown positioning

## 🚀 Performance Features

### Virtual Scrolling
- Automatically switches to virtual list for datasets >100 items
- Configurable row height (default: 80px)
- Smooth scrolling performance

### Efficient Rendering
- Reactive updates only when necessary
- Debounced filter updates
- Optimized chart rendering

## 🔧 Advanced Usage

### Custom Filter Logic

```typescript
// The component automatically updates when data changes
$: if (data.length > 0) {
  // Custom logic here
  updateTable();
}
```

### Export Customization

```typescript
// Import utility functions for custom export logic
import { exportToCSV, exportToJSON } from '$lib/utils/export.js';

// Custom export with modified data
function customExport() {
  const customData = filteredData.map(item => ({
    ...item,
    customField: 'custom value'
  }));
  exportToCSV(customData);
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Filters not working**: Ensure data structure matches `AIQueryRecord` interface
2. **Chart not displaying**: Check if `filteredData` has valid timestamp and cost values
3. **Mobile dropdown issues**: Verify z-index and positioning in CSS
4. **Performance issues**: Large datasets automatically use virtual scrolling

### Debug Mode

```typescript
// Add console logs to debug filter updates
function updateTable() {
  console.log('Filters:', filters);
  console.log('Filtered data length:', filteredData.length);
  // ... rest of function
}
```

## 📚 Dependencies

- **Svelte**: Core framework
- **@sveltejs/svelte-virtual-list**: Virtual scrolling for large datasets
- **SCSS**: Styling with variables and mixins

## 🤝 Contributing

When contributing to this component:

1. Maintain TypeScript strict mode
2. Follow existing SCSS structure and variables
3. Test responsive behavior on mobile devices
4. Ensure accessibility with proper ARIA labels
5. Update documentation for new features

## 📄 License

This component is part of the AI Query Analytics project. See project license for details.

---

**Note**: This component is designed for production use and includes comprehensive error handling, accessibility features, and performance optimizations for large datasets.
