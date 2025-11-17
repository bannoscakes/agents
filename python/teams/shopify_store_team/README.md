# Shopify Store Team

A complete multi-agent team for managing Shopify e-commerce operations. The team leader coordinates specialist agents to handle customer support, marketing, analytics, and sales operations.

## Team Structure

```
Shopify Store Leader
├── Customer Support Agent (chatbot)
├── Email Automation Agent
├── Social Media Generator Agent
├── Sales Forecasting Agent
└── Customer Segmentation Agent
```

## Features

- ✅ **Automated Marketing** - Social media + email campaigns
- ✅ **Customer Support** - AI chatbot with order tracking
- ✅ **Sales Analytics** - Forecasting and trend analysis
- ✅ **Customer Insights** - RFM segmentation and targeting
- ✅ **Daily Operations** - Automated workflow execution
- ✅ **Strategic Planning** - Weekly/monthly reporting

## Quick Start

### Method 1: Using Configuration File

```python
from teams.team_factory import create_team

# Build team from YAML config
leader = create_team('teams/configs/shopify_team.yaml')

# Execute a goal
result = leader.execute_goal(
    goal="marketing_campaign",
    context={
        'product': 'Sourdough Bread Collection',
        'platforms': ['instagram', 'facebook'],
        'include_email': True
    }
)

print(f"Success rate: {result['summary']['success_rate']}")
```

### Method 2: Programmatic Setup

```python
from teams.shopify_store_team import ShopifyStoreLeader
from shopify_chatbot_agent.shopify_chatbot_agent import ShopifyChatbotAgent
from email_automation_agent.email_automation_agent import EmailAutomationAgent

# Create leader
leader = ShopifyStoreLeader(config={
    'store_name': 'Artisan Bakery',
    'llm_api_key': 'your-api-key'
})

# Register agents
chatbot = ShopifyChatbotAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('Chatbot', chatbot, ['customer_support', 'order_tracking'])

email_agent = EmailAutomationAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('EmailAgent', email_agent, ['email_marketing'])

# Execute goal
result = leader.execute_goal("daily_operations")
```

## Available Goals

### Marketing Campaign
Plan and execute multi-channel marketing campaigns.

```python
result = leader.execute_goal(
    goal="marketing_campaign",
    context={
        'product': 'Product Name',
        'platforms': ['instagram', 'facebook', 'twitter'],
        'content_type': 'promotional',  # or 'educational', 'announcement'
        'include_email': True,
        'audience': 'target audience description',
        'tone': 'friendly'  # or 'professional', 'casual'
    }
)
```

**What it does:**
- Generates platform-specific social media posts with hashtags
- Creates email campaign content
- Suggests optimal posting times
- Maintains brand voice consistency

### Daily Operations
Execute daily store management tasks.

```python
result = leader.execute_goal(
    goal="daily_operations",
    context={
        'inquiries': [
            {
                'subject': 'Order status',
                'message': 'Where is my order #1234?',
                'email': 'customer@example.com'
            }
        ],
        'sales_data': [
            {'date': '2024-01-01', 'sales': 1200},
            # ... more data
        ],
        'forecast_days': 7
    }
)
```

**What it does:**
- Processes customer inquiries
- Handles order tracking requests
- Generates sales forecasts
- Creates daily analytics summary

### Weekly Analytics
Generate comprehensive weekly reports.

```python
result = leader.execute_goal(
    goal="weekly_analytics",
    context={
        'sales_data': [...],  # Historical sales data
        'forecast_days': 30
    }
)
```

**What it does:**
- Analyzes sales trends
- Generates 30-day forecast
- Identifies growth opportunities
- Provides actionable insights

### Customer Review
Segment customers and generate marketing strategies.

```python
result = leader.execute_goal(
    goal="customer_review",
    context={
        'customers': [
            {
                'email': 'customer@example.com',
                'total_spent': 850,
                'orders': 12,
                'last_order_days': 5
            },
            # ... more customers
        ]
    }
)
```

**What it does:**
- RFM analysis (Recency, Frequency, Monetary)
- Customer segmentation (high-value, at-risk, new, etc.)
- Personalized marketing recommendations per segment
- Churn prediction

### Customer Support
Handle customer inquiries and support requests.

```python
result = leader.execute_goal(
    goal="customer_support",
    context={
        'inquiries': [
            {
                'subject': 'Product inquiry',
                'message': 'Do you have gluten-free options?',
                'email': 'customer@example.com'
            }
        ]
    }
)
```

**What it does:**
- Responds to customer questions
- Provides product information
- Handles order inquiries
- Escalates complex issues

### Process Orders
Process and manage incoming orders.

```python
result = leader.execute_goal(
    goal="process_orders",
    context={
        'orders': [...],  # Order data
        'auto_fulfill': False
    }
)
```

**What it does:**
- Validates order data
- Processes payments (if integrated)
- Updates inventory
- Sends confirmation emails

## Configuration

### YAML Configuration (Recommended)

Create `my_shopify_team.yaml`:

```yaml
team_type: shopify_store

leader_config:
  store_name: "My Store"
  store_url: "my-store.myshopify.com"
  llm_api_key: "${LLM_API_KEY}"

members:
  - name: CustomerSupportAgent
    type: shopify_chatbot
    capabilities:
      - customer_support
      - order_tracking
    config:
      shopify_store_url: "my-store.myshopify.com"
      shopify_access_token: "${SHOPIFY_ACCESS_TOKEN}"
      store_name: "My Store"
      brand_voice: "friendly and helpful"
      llm_api_key: "${LLM_API_KEY}"

  - name: EmailAgent
    type: email_automation
    capabilities:
      - email_marketing
    config:
      llm_api_key: "${LLM_API_KEY}"

  - name: SocialMediaAgent
    type: social_media_generator
    capabilities:
      - social_media
    config:
      llm_api_key: "${LLM_API_KEY}"
      brand_voice: "friendly and engaging"

  - name: ForecastingAgent
    type: sales_forecasting
    capabilities:
      - sales_forecasting
      - analytics
    config:
      llm_api_key: "${LLM_API_KEY}"

  - name: SegmentationAgent
    type: customer_segmentation
    capabilities:
      - customer_segmentation
    config:
      llm_api_key: "${LLM_API_KEY}"
```

### Environment Variables

```bash
export LLM_API_KEY="your-anthropic-or-openai-api-key"
export SHOPIFY_ACCESS_TOKEN="your-shopify-admin-api-token"
export SHOPIFY_STORE_URL="your-store.myshopify.com"
```

## Team Metrics

Get real-time team performance:

```python
status = leader.get_team_status()

print(f"Team: {status['team_name']}")
print(f"Total tasks: {status['tasks']['total']}")
print(f"Completed: {status['tasks']['completed']}")

for agent_name, metrics in status['agents'].items():
    print(f"\n{agent_name}:")
    print(f"  Success rate: {metrics['success_rate']:.1f}%")
    print(f"  Tasks completed: {metrics['tasks_completed']}")
```

## Strategic Recommendations

Get AI-powered recommendations:

```python
recommendations = leader.get_recommendations()
for rec in recommendations:
    print(f"• {rec}")
```

Example output:
```
✅ SocialMediaAgent performing excellently (24 tasks completed)
⚠️  EmailAgent has low success rate (45.0%) - consider reviewing configuration
```

## Use Cases

### E-commerce Automation
- Automated marketing campaigns
- Customer support 24/7
- Sales forecasting for inventory
- Customer segmentation for targeted ads

### Bakery/Food Business
- Daily production planning
- Customer order management
- Social media content for seasonal products
- Email campaigns for new products

### Retail Store
- Customer inquiry handling
- Weekly sales analysis
- Marketing campaign execution
- Customer loyalty programs

## Example Workflows

### Weekly Marketing Workflow

```python
import schedule
import time

def run_weekly_marketing():
    leader = create_team('configs/shopify_team.yaml')

    result = leader.execute_goal(
        goal="marketing_campaign",
        context={
            'product': 'Weekly Special',
            'platforms': ['instagram', 'facebook'],
            'include_email': True
        }
    )

    print(f"Campaign completed: {result['summary']['success_rate']}")

# Schedule weekly on Monday at 9 AM
schedule.every().monday.at("09:00").do(run_weekly_marketing)

while True:
    schedule.run_pending()
    time.sleep(60)
```

### Daily Operations Automation

```python
def daily_operations():
    leader = create_team('configs/shopify_team.yaml')

    # Fetch today's data from your systems
    inquiries = fetch_customer_inquiries()
    sales_data = fetch_sales_history(days=30)

    result = leader.execute_goal(
        goal="daily_operations",
        context={
            'inquiries': inquiries,
            'sales_data': sales_data,
            'forecast_days': 7
        }
    )

    # Send report to team
    send_slack_notification(result)

# Run every day at 6 AM
schedule.every().day.at("06:00").do(daily_operations)
```

## Best Practices

1. **Start with YAML configs** - Easier to maintain and modify
2. **Monitor team metrics** - Track success rates and identify issues
3. **Use environment variables** - Keep API keys secure
4. **Schedule regular goals** - Automate daily/weekly operations
5. **Review recommendations** - Act on AI-suggested improvements
6. **Test with small data** - Validate before running on full datasets

## Requirements

- Python 3.8+
- LLM API key (Anthropic Claude or OpenAI)
- Shopify Admin API access (for full features)
- Agent dependencies (install individual agents)

## Cost Estimates

Approximate costs per goal execution:

| Goal | Estimated Cost |
|------|---------------|
| Marketing Campaign | $0.05 - $0.10 |
| Daily Operations | $0.10 - $0.20 |
| Weekly Analytics | $0.03 - $0.05 |
| Customer Review | $0.05 - $0.15 |
| Customer Support (per inquiry) | $0.01 - $0.02 |

*Costs vary based on LLM provider, model, and data volume*

## Troubleshooting

### Agent failing with "No agent capable of handling task type"

**Solution:** Make sure agents are registered with the correct capabilities matching the task types in `plan_tasks()`.

### Low success rate for specific agent

**Solution:**
1. Check API keys are valid
2. Review agent configuration
3. Ensure sufficient context is provided
4. Check agent-specific README for requirements

### Tasks not completing

**Solution:**
1. Check `result['failures']` for error details
2. Verify network connectivity to APIs
3. Ensure all environment variables are set
4. Review logs for specific error messages

## License

MIT License
