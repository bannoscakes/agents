# TypeScript Agents for Supabase

TypeScript agents designed to work with Supabase, Deno, and modern web stacks.

## Available Agents

### Cake Production Reporter

A specialized agent for generating bi-weekly production reports for bakeries.

**Features:**
- Supabase/PostgreSQL integration
- Runs as Edge Function
- React frontend components included
- Scheduled reporting
- Multiple output formats

[View Documentation →](./cake-production-reporter/README.md)

## Stack Compatibility

These agents are built for:

- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Runtime**: Deno
- **Frontend**: React + TypeScript
- **Styling**: Works with Tailwind CSS, Radix UI, etc.
- **Bundler**: Vite compatible

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Set Up Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Use an Agent

```typescript
import { CakeProductionReporterAgent } from './typescript/cake-production-reporter/CakeProductionReporter';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const agent = new CakeProductionReporterAgent({
  supabaseClient: supabase,
  reportFormat: 'html',
});

const report = await agent.execute();
```

## Project Structure

```
typescript/
├── cake-production-reporter/   # Production report agent
│   ├── CakeProductionReporter.ts
│   └── README.md
├── supabase-examples/
│   ├── edge-functions/         # Supabase Edge Function examples
│   ├── database/               # SQL schema and migrations
│   └── react-integration/      # React component examples
├── package.json
└── README.md
```

## Deployment

### Edge Functions

```bash
# Deploy to Supabase
supabase functions deploy your-function-name
```

### React Components

Copy components to your React project:

```bash
cp typescript/supabase-examples/react-integration/*.tsx \
  your-project/src/components/
```

## Database Setup

All agents include SQL migration files in `supabase-examples/database/`.

Run them in Supabase Dashboard → SQL Editor or add to your migrations:

```bash
cp typescript/supabase-examples/database/*.sql \
  your-project/supabase/migrations/
```

## Creating Custom Agents

Want to create your own agent? Follow this pattern:

```typescript
export interface YourAgentConfig {
  supabaseClient: SupabaseClient;
  // ... your config options
}

export class YourAgent {
  private config: YourAgentConfig;

  constructor(config: YourAgentConfig) {
    this.config = config;
  }

  async execute(): Promise<Result> {
    // Your agent logic
  }
}
```

## Examples

### Basic Usage

```typescript
const agent = new YourAgent({
  supabaseClient: supabase,
});

const result = await agent.execute();
```

### With Error Handling

```typescript
try {
  const result = await agent.execute();
  console.log('Success:', result);
} catch (error) {
  console.error('Failed:', error);
}
```

### In React Component

```typescript
function MyComponent() {
  const [result, setResult] = useState(null);

  const runAgent = async () => {
    const agent = new YourAgent({ supabaseClient: supabase });
    const data = await agent.execute();
    setResult(data);
  };

  return (
    <button onClick={runAgent}>Run Agent</button>
  );
}
```

## TypeScript Support

All agents are fully typed with TypeScript interfaces:

```typescript
import type {
  CakeProductionReporterConfig,
  Order,
  Report,
} from './cake-production-reporter/CakeProductionReporter';
```

## Best Practices

1. **Environment Variables**: Never commit API keys
2. **Error Handling**: Always wrap agent calls in try/catch
3. **Rate Limiting**: Be mindful of Supabase quotas
4. **Testing**: Test with sample data first
5. **Monitoring**: Log agent execution for debugging

## Contributing

Want to add a new TypeScript agent? See [CONTRIBUTING.md](../CONTRIBUTING.md).

## License

MIT
