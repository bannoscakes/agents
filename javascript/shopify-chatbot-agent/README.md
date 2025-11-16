# Shopify Chatbot Agent (JavaScript)

AI-powered customer support chatbot for Shopify stores built with Node.js.

## Installation

```bash
npm install @anthropic-ai/sdk shopify-api-node

# Optional
npm install express cors  # For web server
```

## Quick Start

```javascript
const ShopifyChatbotAgent = require('./ShopifyChatbotAgent');

const agent = new ShopifyChatbotAgent({
  storeName: 'Your Store',
  brandVoice: 'friendly and helpful',
  llmProvider: 'anthropic',
  llmApiKey: process.env.ANTHROPIC_API_KEY,
  shopifyStoreUrl: 'your-store.myshopify.com',
  shopifyAccessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  storePolicies: {
    shipping: 'Free shipping on orders over $50',
    returns: '30-day return policy',
    support_email: 'support@yourstore.com'
  }
});

await agent.use(async (agent) => {
  const response = await agent.execute("What's your return policy?");
  console.log(response);
});
```

## Express Server Example

```javascript
const express = require('express');
const cors = require('cors');
const ShopifyChatbotAgent = require('./ShopifyChatbotAgent');

const app = express();
app.use(cors());
app.use(express.json());

const agent = new ShopifyChatbotAgent({
  storeName: 'Your Store',
  // ... config
});

app.post('/chat', async (req, res) => {
  const { message, customerEmail, customerName } = req.body;

  try {
    const response = await agent.execute(message, {
      customerEmail,
      customerName
    });

    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Chatbot server running on port 3000');
});
```

See Python version README for full documentation.
