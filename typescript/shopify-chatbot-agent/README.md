# Shopify Chatbot Agent (TypeScript/Supabase)

AI customer support chatbot for Shopify stores with Supabase Edge Functions.

## Installation

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js
```

## Supabase Edge Function Deployment

### 1. Create Function

```bash
supabase functions new shopify-chat
```

### 2. Copy Code

Copy `supabase-function-example.ts` to `supabase/functions/shopify-chat/index.ts`

### 3. Set Environment Variables

```bash
supabase secrets set SHOPIFY_STORE_URL="your-store.myshopify.com"
supabase secrets set SHOPIFY_ACCESS_TOKEN="your-token"
supabase secrets set ANTHROPIC_API_KEY="your-key"
supabase secrets set STORE_NAME="Your Store"
supabase secrets set BRAND_VOICE="friendly and helpful"
supabase secrets set POLICY_SHIPPING="Free shipping over $50"
supabase secrets set POLICY_RETURNS="30-day returns"
supabase secrets set SUPPORT_EMAIL="support@yourstore.com"
```

### 4. Deploy

```bash
supabase functions deploy shopify-chat
```

## Quick Start

```typescript
import { ShopifyChatbotAgent } from './ShopifyChatbotAgent';

const agent = new ShopifyChatbotAgent({
  shopifyStoreUrl: 'your-store.myshopify.com',
  shopifyAccessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  llmProvider: 'anthropic',
  llmApiKey: process.env.ANTHROPIC_API_KEY,
  storeName: 'Your Store',
  storePolicies: {
    shipping: 'Free shipping on orders over $50',
    returns: '30-day return policy',
    support_email: 'support@yourstore.com'
  }
});

const result = await agent.execute("What's your return policy?");
console.log(result.response);
```

## Frontend Integration

```javascript
// Call from your Shopify theme
async function sendMessage(message) {
  const response = await fetch('https://your-project.supabase.co/functions/v1/shopify-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      message,
      customerEmail: customer?.email,
      customerName: customer?.name
    })
  });

  const data = await response.json();
  return data.response;
}
```

See Python version README for full documentation.
