# Customer Segmentation Agent

Segment customers by behavior, value, and engagement. Generate targeted marketing recommendations for each segment.

## Features

- RFM Analysis (Recency, Frequency, Monetary)
- Behavioral segmentation
- AI-powered segment naming
- Marketing recommendations per segment
- Churn risk prediction
- Lifetime value estimation

## Quick Start

```python
from customer_segmentation_agent import CustomerSegmentationAgent

agent = CustomerSegmentationAgent({
    'llm_provider': 'anthropic',
    'llm_api_key': 'your-api-key'
})

customers = [
    {
        'email': 'customer1@example.com',
        'total_spent': 1500,
        'order_count': 25,
        'last_order_days': 5
    },
    {
        'email': 'customer2@example.com',
        'total_spent': 150,
        'order_count': 2,
        'last_order_days': 180
    },
    # ... more customers
]

with agent:
    segments = agent.execute(customers=customers)
    print(segments['segmentation'])
```

## Typical Segments

- **VIP Customers** - High value, frequent buyers
- **Loyal Regulars** - Consistent, moderate spenders
- **At Risk** - Previously active, now inactive
- **New Customers** - Recent first-time buyers
- **Bargain Hunters** - Price-sensitive, sale shoppers
- **One-Time Buyers** - Single purchase, no return

## Output Includes

- Segment definitions and criteria
- Customer count per segment
- Marketing recommendations
- Engagement strategies
- Revenue potential

## Use Cases

- Targeted email campaigns
- Personalized offers
- Churn prevention
- Customer retention programs

## License

MIT
