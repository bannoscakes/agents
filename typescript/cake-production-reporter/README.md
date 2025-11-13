# Cake Production Reporter Agent - TypeScript/Supabase

A specialized TypeScript agent for Supabase that generates bi-weekly production reports showing how many cakes need to be cooked based on incoming orders.

**Perfect for your stack:**
- ✅ TypeScript/TSX
- ✅ Supabase (PostgreSQL + Edge Functions)
- ✅ React frontend integration
- ✅ Deno runtime

## Features

- **Scheduled Reporting**: Runs twice a week on configurable days
- **Supabase Integration**: Works directly with your PostgreSQL database
- **Edge Functions**: Deploy as serverless Supabase Edge Function
- **React Components**: Ready-to-use frontend components
- **Multiple Formats**: Text, HTML, or JSON reports
- **Safety Buffer**: Configurable buffer percentage for production planning
- **Real-time**: Can be triggered manually or scheduled

## Quick Start

### 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the schema file to your project
cp typescript/supabase-examples/database/schema.sql your-project/supabase/migrations/
```

Or run it directly in Supabase Dashboard → SQL Editor.

### 2. Deploy Edge Function

```bash
# Copy the Edge Function
cp -r typescript/supabase-examples/edge-functions/production-report \
  your-project/supabase/functions/

# Deploy to Supabase
cd your-project
supabase functions deploy production-report
```

### 3. Add to Your Frontend

```bash
# Copy the React component
cp typescript/supabase-examples/react-integration/ProductionReportPage.tsx \
  your-project/src/pages/
```

## Usage

### Option 1: Call from Frontend

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Generate a new report
const { data, error } = await supabase.functions.invoke('production-report', {
  body: {
    format: 'html', // or 'text', 'json'
    startDate: '2025-11-06',
    endDate: '2025-11-13',
  },
});

console.log(data.report);
```

### Option 2: Use Directly in Your Code

```typescript
import { CakeProductionReporterAgent } from './cake-production-reporter/CakeProductionReporter';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const agent = new CakeProductionReporterAgent({
  supabaseClient: supabase,
  ordersTable: 'orders',
  reportFormat: 'html',
  bufferPercentage: 10,
  orderStatus: ['confirmed', 'paid'],
  deliveryMethod: 'database',
});

const report = await agent.execute();
console.log(report);
```

### Option 3: Schedule with pg_cron

In Supabase SQL Editor (requires pg_cron extension - contact Supabase support):

```sql
-- Schedule for Monday and Thursday at 8:00 AM
SELECT cron.schedule(
    'production-report-monday',
    '0 8 * * 1',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/production-report',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::JSONB,
        body := '{}'::JSONB
    );
    $$
);
```

## Configuration Options

```typescript
interface CakeProductionReporterConfig {
  // Scheduling
  reportDays?: string[];        // ['Monday', 'Thursday']
  reportTime?: string;           // '08:00'

  // Data source
  supabaseClient: SupabaseClient;
  ordersTable?: string;          // default: 'orders'
  customQuery?: string;

  // Report settings
  reportFormat?: 'text' | 'html' | 'json';
  includeDetails?: boolean;
  bufferPercentage?: number;     // default: 10 (adds 10% buffer)

  // Filters
  orderStatus?: string[];        // ['confirmed', 'paid']

  // Delivery
  deliveryMethod?: 'database' | 'webhook' | 'return';
  reportsTable?: string;         // default: 'production_reports'
  webhookUrl?: string;
  emailTo?: string[];
}
```

## Database Schema

### Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_name TEXT,
    cake_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    order_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    ...
);
```

### Production Reports Table

```sql
CREATE TABLE production_reports (
    id UUID PRIMARY KEY,
    report_date TIMESTAMPTZ NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_orders INTEGER NOT NULL,
    production_data JSONB NOT NULL,
    report_text TEXT,
    report_html TEXT,
    ...
);
```

## PostgreSQL Functions

The schema includes helpful PostgreSQL functions:

### `get_orders_for_production(start_date, end_date)`

Fetches confirmed orders for the date range.

```sql
SELECT * FROM get_orders_for_production(
    '2025-11-06'::timestamptz,
    '2025-11-13'::timestamptz
);
```

### `get_production_summary(start_date, end_date, buffer_percentage)`

Returns aggregated cake quantities with buffer.

```sql
SELECT * FROM get_production_summary(
    NOW() - INTERVAL '7 days',
    NOW(),
    10
);
```

Result:
```
 cake_type       | total_quantity | buffered_quantity | order_count
-----------------+----------------+-------------------+-------------
 Chocolate Cake  | 10             | 11                | 5
 Vanilla Cake    | 8              | 9                 | 4
```

## React Integration

### Full Page Component

Use the provided `ProductionReportPage.tsx`:

```typescript
import ProductionReportPage from './pages/ProductionReportPage';

function App() {
  return <ProductionReportPage />;
}
```

### Custom Hook

```typescript
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

export function useProductionReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('production-report');
    await fetchReports();
    setLoading(false);
    return data;
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from('production_reports')
      .select('*')
      .order('report_date', { ascending: false });
    setReports(data || []);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return { reports, generateReport, loading, refresh: fetchReports };
}
```

## Example Report Output

### Text Format

```
======================================================================
🎂 CAKE PRODUCTION REPORT
======================================================================
Report Generated: 2025-11-13 08:00
Period: 2025-11-06 to 2025-11-13
Total Orders: 15

PRODUCTION REQUIREMENTS:
----------------------------------------------------------------------
  Chocolate Cake                          14 cakes
  Vanilla Cake                            10 cakes
  Red Velvet Cake                          6 cakes
----------------------------------------------------------------------
TOTAL CAKES TO PRODUCE: 30 cakes
(Includes 10% safety buffer)
======================================================================
```

### HTML Format

Beautiful formatted HTML report with:
- Gradient header
- Summary cards
- Responsive table
- Print-friendly styling

### JSON Format

```json
{
  "production": {
    "Chocolate Cake": 14,
    "Vanilla Cake": 10,
    "Red Velvet Cake": 6
  },
  "period": {
    "start": "2025-11-06T00:00:00Z",
    "end": "2025-11-13T23:59:59Z"
  },
  "total_orders": 15,
  "total_cakes": 30
}
```

## Deployment Scenarios

### Scenario 1: Manual Trigger from Dashboard

Add a button in your admin dashboard that calls the Edge Function.

### Scenario 2: Scheduled via pg_cron

Set up cron jobs in PostgreSQL to run twice a week.

### Scenario 3: External Scheduler

Use GitHub Actions, Vercel Cron, or similar:

```yaml
# .github/workflows/production-report.yml
name: Generate Production Report
on:
  schedule:
    - cron: '0 8 * * 1,4'  # Monday and Thursday at 8 AM
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://your-project.supabase.co/functions/v1/production-report \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

### Scenario 4: Triggered by Order Status Change

Use Supabase Database Webhooks to trigger report generation when order status changes.

## Customization

### Custom Date Range

```typescript
const report = await agent.execute(
  new Date('2025-11-01'),  // start date
  new Date('2025-11-30')   // end date
);
```

### Custom Filters

Modify the SQL query or add more filters:

```typescript
const agent = new CakeProductionReporterAgent({
  supabaseClient: supabase,
  customQuery: 'get_orders_for_production_with_filters',
  orderStatus: ['confirmed', 'paid', 'processing'],
});
```

### Different Buffer Percentages

```typescript
const agent = new CakeProductionReporterAgent({
  bufferPercentage: 15,  // 15% buffer for busy seasons
});
```

## Troubleshooting

### No orders appearing

- Check that your orders table has the correct columns
- Verify the `order_date` is within the date range
- Check the `status` filter matches your order statuses

### Edge Function timeout

- For large datasets, consider running directly in a backend service
- Or batch process orders in smaller chunks

### Permission errors

- Ensure RLS policies allow reading orders
- Check that service role key is used for scheduled functions

## Next Steps

1. ✅ Run the database schema
2. ✅ Deploy the Edge Function
3. ✅ Add the React component to your frontend
4. ✅ Test manually first
5. ✅ Set up scheduling
6. ✅ Customize as needed

## Support

For questions or issues:
- Check the main repository documentation
- Review the example files
- Test with sample data first

## License

MIT - Use freely in your production systems!
