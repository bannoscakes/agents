# Shopify Chatbot Agent

AI-powered customer support chatbot for Shopify stores. Handles product inquiries, order tracking, shipping questions, returns, and more.

## Features

- **Product Information** - Answer questions about products, availability, pricing
- **Order Tracking** - Real-time order status and tracking information
- **Shipping Info** - Delivery times, costs, international shipping
- **Returns & Refunds** - Process return requests and refund inquiries
- **Store Policies** - Provide information about store policies
- **Smart Escalation** - Automatically escalate complex issues to human support
- **Conversation History** - Maintains context across multiple messages
- **Customizable Brand Voice** - Match your store's personality
- **Multi-language Support** - Support customers in multiple languages
- **Shopify Integration** - Direct integration with Shopify Admin API

## Installation

```bash
# Core requirements
pip install anthropic  # or openai

# For Shopify integration
pip install ShopifyAPI
```

## Quick Start

### Basic Setup (Mock Mode)

```python
from shopify_chatbot_agent import ShopifyChatbotAgent

agent = ShopifyChatbotAgent({
    'store_name': 'Your Store Name',
    'brand_voice': 'friendly and helpful',
    'store_policies': {
        'shipping': 'Free shipping on orders over $50',
        'returns': '30-day return policy',
        'support_email': 'support@yourstore.com'
    }
})

with agent:
    response = agent.execute("What's your return policy?")
    print(response)
```

### With Shopify Integration

```python
agent = ShopifyChatbotAgent({
    'shopify_store_url': 'your-store.myshopify.com',
    'shopify_access_token': 'your-access-token',
    'llm_provider': 'anthropic',
    'llm_api_key': 'your-api-key',
    'store_name': 'Your Store',
    'brand_voice': 'warm and professional',
    'store_policies': {
        'shipping': 'Free shipping on orders over $50. Standard delivery 3-5 business days.',
        'returns': '30-day return policy for unused items',
        'support_email': 'support@yourstore.com',
        'support_phone': '1-800-YOUR-SHOP'
    }
})

with agent:
    # Customer asks about order
    response = agent.execute(
        "Where is my order #12345?",
        customer_email="customer@example.com",
        customer_name="John"
    )
    print(response)
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `shopify_store_url` | Your Shopify store URL | - |
| `shopify_access_token` | Shopify Admin API token | From env |
| `shopify_api_version` | API version | '2024-01' |
| `store_name` | Your store name | 'Our Store' |
| `brand_voice` | Chatbot personality | 'friendly and helpful' |
| `store_policies` | Dict of store policies | {} |
| `llm_provider` | LLM provider ('anthropic', 'openai') | 'anthropic' |
| `llm_api_key` | API key for LLM | From env |
| `model` | LLM model name | 'claude-3-5-sonnet-20241022' |
| `enable_escalation` | Enable human escalation | True |
| `escalation_keywords` | Keywords that trigger escalation | Default list |
| `max_history` | Max conversation turns to keep | 10 |

## Shopify Setup

### 1. Create a Private App in Shopify

1. Go to your Shopify admin panel
2. Navigate to **Apps** → **Develop apps**
3. Click **Create an app**
4. Name it "Customer Support Chatbot"
5. Configure Admin API scopes:
   - `read_orders` - To fetch order information
   - `read_products` - To search products
   - `read_customers` - To verify customer info (optional)
6. Install the app and copy the **Admin API access token**

### 2. Set Environment Variables

```bash
export SHOPIFY_ACCESS_TOKEN="your-admin-api-token"
export LLM_API_KEY="your-anthropic-or-openai-key"
```

## Use Cases

### 1. Embedded Website Chat Widget

```python
# Flask/FastAPI backend
from flask import Flask, request, jsonify
from shopify_chatbot_agent import ShopifyChatbotAgent

app = Flask(__name__)
agent = ShopifyChatbotAgent({...})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    customer_email = data.get('email')

    with agent:
        response = agent.execute(message, customer_email=customer_email)
        return jsonify({'response': response})
```

### 2. Order Status Lookup

```python
with agent:
    response = agent.execute(
        "What's the status of order #12345?",
        customer_email="customer@example.com"
    )
    # Returns: "Order #12345 has been shipped!
    # Tracking: 1Z999AA10123456784
    # Expected delivery: Dec 25, 2024"
```

### 3. Product Recommendations

```python
with agent:
    response = agent.execute(
        "I'm looking for a birthday gift for my mom"
    )
    # Bot suggests products based on inventory
```

### 4. Returns Processing

```python
with agent:
    response = agent.execute(
        "I want to return my order #12345"
    )
    # Provides return instructions and policy
```

## Embedding in Shopify

### Option 1: Custom Liquid Theme Integration

Add to `theme.liquid`:

```html
<!-- Chat widget -->
<div id="chat-widget"></div>

<script>
  // Load chat widget
  (function() {
    const widget = document.createElement('script');
    widget.src = 'https://your-server.com/widget.js';
    document.body.appendChild(widget);
  })();
</script>
```

### Option 2: Shopify App

Create a Shopify app that embeds the chatbot:

```javascript
// app.js
import { Provider } from '@shopify/app-bridge-react';

function ChatbotApp() {
  return (
    <Provider config={config}>
      <ChatWidget apiUrl="https://your-backend.com/chat" />
    </Provider>
  );
}
```

## Advanced Features

### Custom Escalation Logic

```python
agent = ShopifyChatbotAgent({
    'enable_escalation': True,
    'escalation_keywords': [
        'speak to human',
        'talk to person',
        'manager',
        'representative',
        'complaint'
    ]
})
```

### Multi-language Support

```python
# The LLM automatically handles multiple languages
with agent:
    # Customer asks in Spanish
    response = agent.execute("¿Cuál es su política de devolución?")
    # Bot responds in Spanish
```

### Conversation History

```python
with agent:
    agent.execute("Do you have chocolate cake?")
    agent.execute("How much is it?")  # Remembers context
    agent.execute("I'll take two")     # Still in context

    # Get full history
    history = agent.get_conversation_history()

    # Reset conversation
    agent.reset_conversation()
```

### Store Policies Configuration

```python
store_policies = {
    'shipping': '''
        - Free shipping on orders over $50
        - Standard delivery: 3-5 business days
        - Express delivery: 1-2 business days ($15)
        - International shipping available
    ''',
    'returns': '''
        - 30-day return policy
        - Items must be unused and in original packaging
        - Free return shipping
        - Refunds processed within 5-7 business days
    ''',
    'warranty': '1-year warranty on all products',
    'support_email': 'support@yourstore.com',
    'support_phone': '1-800-123-4567',
    'business_hours': 'Mon-Fri 9AM-6PM EST'
}

agent = ShopifyChatbotAgent({
    'store_policies': store_policies
})
```

## Deployment

### Heroku

```bash
# Procfile
web: gunicorn app:app

# Deploy
heroku create your-chatbot
heroku config:set SHOPIFY_ACCESS_TOKEN=xxx
heroku config:set LLM_API_KEY=xxx
git push heroku main
```

### AWS Lambda

```python
# lambda_function.py
from shopify_chatbot_agent import ShopifyChatbotAgent
import json

agent = ShopifyChatbotAgent({...})

def lambda_handler(event, context):
    body = json.loads(event['body'])
    message = body['message']

    response = agent.execute(message)

    return {
        'statusCode': 200,
        'body': json.dumps({'response': response})
    }
```

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "server.py"]
```

## Performance & Costs

### Response Time
- Average: 1-3 seconds
- With Shopify API: 2-4 seconds
- Cached responses: <1 second

### Cost per Conversation
- **Anthropic Claude**: ~$0.015 per conversation (10 messages)
- **OpenAI GPT-4**: ~$0.03 per conversation (10 messages)
- **Shopify API**: Free (within rate limits)

### Monthly Costs (Estimate)

| Conversations/Month | Cost (Claude) | Cost (GPT-4) |
|---------------------|---------------|--------------|
| 1,000 | $15 | $30 |
| 10,000 | $150 | $300 |
| 100,000 | $1,500 | $3,000 |

## Best Practices

1. **Set Clear Escalation Rules** - Define when to escalate to human
2. **Keep Policies Updated** - Regularly update store policies
3. **Monitor Conversations** - Review chat logs for improvements
4. **Customize Brand Voice** - Match your brand personality
5. **Test Thoroughly** - Test with real customer scenarios
6. **Set Rate Limits** - Prevent API abuse
7. **Cache Common Questions** - Speed up FAQ responses
8. **Collect Feedback** - Ask customers to rate responses

## Troubleshooting

### Bot gives generic responses
- Check that `llm_api_key` is set correctly
- Verify LLM provider credentials
- Review system prompt configuration

### Order lookup not working
- Verify Shopify access token has `read_orders` scope
- Check `shopify_store_url` format
- Ensure order number format is correct

### Escalation not triggering
- Review `escalation_keywords` list
- Check that `enable_escalation` is True
- Verify support contact info is set

## Example Chat Flows

### Product Inquiry
```
Customer: Do you have red velvet cake?
Bot: Yes! We have Red Velvet Cake available for $24.99.
     It's currently in stock. Would you like to know more
     about ingredients or order one?

Customer: Does it have nuts?
Bot: Our Red Velvet Cake does not contain nuts. It's made
     with cream cheese frosting and is nut-free. However,
     it is produced in a facility that processes nuts.
```

### Order Tracking
```
Customer: Where is my order #12345?
Bot: Let me check that for you! Order #12345 was shipped
     on Dec 20, 2024.

     Tracking Number: 1Z999AA10123456784
     Carrier: UPS
     Expected Delivery: Dec 23, 2024

     You can track it here: [tracking link]
```

### Returns
```
Customer: I need to return order #12345
Bot: I'd be happy to help with your return. We have a
     30-day return policy for unused items.

     To process your return:
     1. Visit our returns portal: [link]
     2. Enter order #12345
     3. Select items to return
     4. Print the prepaid shipping label

     Refunds are processed within 5-7 business days
     after we receive your return.

     Is there anything specific wrong with the order?
```

## License

MIT
