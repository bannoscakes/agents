# Sales Forecasting Agent

Predict future sales trends using historical data and AI analysis. Identify patterns, seasonality, and anomalies.

## Features

- 30+ day sales predictions
- Trend detection (growing/declining)
- Seasonality pattern identification
- Anomaly detection
- Confidence scoring
- Simple moving average fallback

## Quick Start

```python
from sales_forecasting_agent import SalesForecastingAgent

agent = SalesForecastingAgent({
    'llm_provider': 'anthropic',
    'llm_api_key': 'your-api-key'
})

historical_data = [
    {'date': '2024-01-01', 'sales': 1200},
    {'date': '2024-01-02', 'sales': 1350},
    {'date': '2024-01-03', 'sales': 980},
    # ... more data
]

with agent:
    forecast = agent.execute(
        historical_data=historical_data,
        forecast_days=30
    )
    
    print(forecast['analysis'])
```

## Output Format

```json
{
  "forecast": [
    {"day": 1, "predicted_sales": 1250},
    {"day": 2, "predicted_sales": 1280}
  ],
  "trends": "Upward trend observed, +15% growth",
  "seasonality": "Higher sales on weekends",
  "confidence": "medium"
}
```

## Use Cases

- Inventory planning
- Revenue projections
- Staffing decisions
- Marketing budget allocation

## Minimum Data: 7 days recommended, 30+ days for best accuracy

## License

MIT
