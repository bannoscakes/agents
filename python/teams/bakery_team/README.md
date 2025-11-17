# Bakery Operations Team

A complete multi-agent team for managing bakery operations. The team leader coordinates specialist agents to handle recipe management, production planning, quality control, and customer service.

## Team Structure

```
Bakery Operations Leader
├── Recipe Management Agent
├── Sales Forecasting Agent
├── Customer Service Agent
├── Production Planning Agent (conceptual)
└── Quality Control Agent (conceptual)
```

## Features

- ✅ **Recipe Management** - Scale, substitute, allergens, nutrition
- ✅ **Production Planning** - Demand forecasting and scheduling
- ✅ **Quality Control** - Product inspection and approval
- ✅ **Customer Service** - Order inquiries and custom requests
- ✅ **Sales Forecasting** - Predict demand for inventory planning
- ✅ **Daily Operations** - Automated workflow execution

## Quick Start

### Method 1: Using Configuration File

```python
from teams.team_factory import create_team

# Build team from YAML config
leader = create_team('teams/configs/bakery_team.yaml')

# Plan weekly production
result = leader.execute_goal(
    goal="plan_production",
    context={
        'sales_data': historical_sales,
        'recipes': recipes_to_scale,
        'forecast_days': 7
    }
)

print(f"Success rate: {result['summary']['success_rate']}")
```

### Method 2: Programmatic Setup

```python
from teams.bakery_team import BakeryLeader
from recipe_management_agent.recipe_management_agent import RecipeManagementAgent
from sales_forecasting_agent.sales_forecasting_agent import SalesForecastingAgent

# Create leader
leader = BakeryLeader(config={
    'bakery_name': 'Artisan Bakery',
    'specialties': ['sourdough', 'cakes', 'pastries'],
    'llm_api_key': 'your-api-key'
})

# Register agents
recipe_agent = RecipeManagementAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('RecipeAgent', recipe_agent, [
    'recipe_scale', 'recipe_substitute', 'recipe_allergens'
])

forecast_agent = SalesForecastingAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('ForecastAgent', forecast_agent, ['sales_forecasting'])

# Execute goal
result = leader.execute_goal("plan_production")
```

## Available Goals

### Plan Production
Plan daily or weekly production based on demand forecasts.

```python
result = leader.execute_goal(
    goal="plan_production",
    context={
        'sales_data': [
            {'date': '2024-01-01', 'sales': 1200, 'product': 'sourdough'},
            # ... more data
        ],
        'recipes': [
            {
                'name': 'Sourdough Bread',
                'servings': 10,
                'target_servings': 100,
                'ingredients': {
                    'flour': '500g',
                    'water': '350ml',
                    'starter': '100g'
                }
            }
        ],
        'forecast_days': 7,
        'generate_report': True
    }
)
```

**What it does:**
- Forecasts product demand
- Scales recipes to target quantities
- Generates Bill of Materials (BOM)
- Creates production schedule
- Estimates ingredient requirements

### Custom Order
Handle custom cake or catering orders.

```python
result = leader.execute_goal(
    goal="custom_order",
    context={
        'order': {
            'message': 'Need a 3-tier wedding cake for 100 guests',
            'customer_email': 'bride@example.com',
            'recipe': {
                'name': 'Wedding Cake',
                'servings': 100,
                'ingredients': {...}
            },
            'nutrition_info': True
        }
    }
)
```

**What it does:**
- Responds to customer inquiry
- Checks for allergens
- Calculates nutrition information
- Provides pricing estimates
- Suggests alternatives if needed

### Quality Check
Perform quality control on products.

```python
result = leader.execute_goal(
    goal="quality_check",
    context={
        'products': [
            {
                'name': 'Sourdough Loaf #1',
                'type': 'bread',
                'description': 'Golden brown crust, good rise',
                'image': '/path/to/image.jpg'  # Optional
            }
        ]
    }
)
```

**What it does:**
- Inspects product quality
- Detects defects
- Scores quality (0-10)
- Auto-approves or flags for review
- Records inspection results

### Recipe Management
Scale, substitute, or analyze recipes.

```python
# Scale a recipe
result = leader.execute_goal(
    goal="recipe_management",
    context={
        'action': 'scale',
        'recipe': {
            'name': 'Croissants',
            'servings': 12,
            'ingredients': {...}
        },
        'servings': 60  # Scale to 60 servings
    }
)

# Check allergens
result = leader.execute_goal(
    goal="recipe_management",
    context={
        'action': 'allergens',
        'recipe': {
            'name': 'Almond Croissant',
            'ingredients': {
                'almonds': '100g',
                'flour': '400g',
                'eggs': '2'
            }
        }
    }
)

# Get nutrition info
result = leader.execute_goal(
    goal="recipe_management",
    context={
        'action': 'nutrition',
        'recipe': {...}
    }
)

# Substitute ingredients
result = leader.execute_goal(
    goal="recipe_management",
    context={
        'action': 'substitute',
        'recipe': {...},
        'ingredient_to_replace': 'butter',
        'reason': 'vegan option'
    }
)
```

**Actions available:**
- `scale` - Adjust recipe for different serving sizes
- `allergens` - Detect allergens (nuts, dairy, gluten, etc.)
- `nutrition` - Calculate calories, protein, carbs, fats
- `substitute` - Find ingredient alternatives
- `optimize` - Reduce waste and costs

### Demand Forecast
Predict sales and demand.

```python
result = leader.execute_goal(
    goal="forecast_demand",
    context={
        'sales_data': historical_sales_30_days,
        'forecast_days': 30
    }
)
```

**What it does:**
- Analyzes historical sales trends
- Detects seasonality patterns
- Predicts future demand
- Identifies anomalies
- Provides confidence scores

### Customer Inquiry
Handle customer questions and requests.

```python
result = leader.execute_goal(
    goal="customer_inquiry",
    context={
        'inquiries': [
            {
                'subject': 'Birthday cake order',
                'message': 'Can I order a chocolate cake for 20 people?',
                'customer_email': 'customer@example.com'
            }
        ]
    }
)
```

**What it does:**
- Responds to inquiries
- Provides product information
- Handles order requests
- Escalates complex issues

### Daily Operations
Execute complete daily workflow.

```python
result = leader.execute_goal(
    goal="daily_operations",
    context={
        'sales_data': last_30_days,
        'recipes': todays_recipes,
        'products_to_check': morning_products,
        'inquiries': customer_messages,
        'plan_production': True
    }
)
```

**What it does:**
- Plans production for the day
- Runs quality checks
- Handles customer inquiries
- Generates daily forecast
- Creates operational summary

## Configuration

### YAML Configuration (Recommended)

Create `my_bakery_team.yaml`:

```yaml
team_type: bakery

leader_config:
  bakery_name: "Artisan Bakery & Café"
  specialties:
    - sourdough
    - wedding cakes
    - pastries
  llm_api_key: "${LLM_API_KEY}"

members:
  - name: RecipeAgent
    type: recipe_management
    capabilities:
      - recipe_scale
      - recipe_substitute
      - recipe_allergens
      - recipe_nutrition
      - recipe_optimize
    config:
      llm_api_key: "${LLM_API_KEY}"

  - name: ForecastingAgent
    type: sales_forecasting
    capabilities:
      - sales_forecasting
    config:
      llm_api_key: "${LLM_API_KEY}"

  - name: CustomerServiceAgent
    type: shopify_chatbot
    capabilities:
      - customer_support
    config:
      store_name: "Artisan Bakery"
      brand_voice: "warm and welcoming"
      llm_api_key: "${LLM_API_KEY}"
```

### Environment Variables

```bash
export LLM_API_KEY="your-anthropic-or-openai-api-key"
```

## Operational Metrics

Track bakery operations:

```python
result = leader.execute_goal("daily_operations", context={...})

metrics = result['operational_metrics']
print(f"Recipes managed: {metrics['recipes_managed']}")
print(f"Quality checks passed: {metrics['quality_checks_passed']}")
print(f"Customer inquiries handled: {metrics['customer_inquiries_handled']}")
print(f"Production plans created: {metrics['production_plans_created']}")
print(f"Forecasts generated: {metrics['forecasts_generated']}")
```

## Use Cases

### Weekly Production Planning

```python
import schedule

def plan_weekly_production():
    """Plan production for the week every Sunday"""
    from datetime import datetime, timedelta

    # Get last 30 days of sales
    sales_data = fetch_sales_data(days=30)

    # Recipes to produce
    recipes = [
        {
            'name': 'Sourdough Bread',
            'servings': 10,
            'target_servings': 500,  # Week's supply
            'ingredients': {...}
        },
        {
            'name': 'Croissants',
            'servings': 12,
            'target_servings': 300,
            'ingredients': {...}
        }
    ]

    leader = create_team('configs/bakery_team.yaml')

    result = leader.execute_goal(
        goal="plan_production",
        context={
            'sales_data': sales_data,
            'recipes': recipes,
            'forecast_days': 7,
            'generate_report': True
        }
    )

    # Email report to production team
    send_production_plan(result)

# Run every Sunday at 6 PM
schedule.every().sunday.at("18:00").do(plan_weekly_production)
```

### Custom Order Workflow

```python
def handle_custom_order(order_details):
    """Process custom cake orders"""
    leader = create_team('configs/bakery_team.yaml')

    # Create recipe based on order
    recipe = {
        'name': f"{order_details['type']} - {order_details['servings']} servings",
        'servings': order_details['servings'],
        'ingredients': get_base_recipe(order_details['type'])
    }

    result = leader.execute_goal(
        goal="custom_order",
        context={
            'order': {
                'message': order_details['special_requests'],
                'customer_email': order_details['email'],
                'recipe': recipe,
                'nutrition_info': order_details.get('need_nutrition', False)
            }
        }
    )

    # Send quote to customer
    send_custom_order_quote(order_details['email'], result)

    return result
```

### Daily Quality Control

```python
def morning_quality_check():
    """Check first batch of products every morning"""
    import glob

    # Get morning products
    products = []
    for image_path in glob.glob('/bakery/photos/morning/*.jpg'):
        product_name = os.path.basename(image_path).replace('.jpg', '')
        products.append({
            'name': product_name,
            'type': 'bread',  # or detect from name
            'image': image_path,
            'description': f'Morning batch {datetime.now().date()}'
        })

    leader = create_team('configs/bakery_team.yaml')

    result = leader.execute_goal(
        goal="quality_check",
        context={'products': products}
    )

    # Flag failed products
    if result['failures']:
        alert_production_team(result['failures'])

# Run every day at 7 AM
schedule.every().day.at("07:00").do(morning_quality_check)
```

## Best Practices

1. **Forecast regularly** - Update forecasts weekly for accurate planning
2. **Track allergens** - Always check allergens for custom orders
3. **Scale recipes carefully** - Verify scaled amounts make sense
4. **Quality control daily** - Check first and last batches
5. **Monitor waste** - Use optimization to reduce ingredient waste
6. **Document recipes** - Keep recipes updated with team feedback

## Example Recipe Format

```python
recipe = {
    'name': 'Sourdough Bread',
    'servings': 10,  # Number of loaves
    'ingredients': {
        'bread flour': '500g',
        'water': '350ml',
        'sourdough starter': '100g',
        'salt': '10g'
    },
    'instructions': [
        'Mix flour and water, autolyse 30 minutes',
        'Add starter and salt, knead 10 minutes',
        # ...
    ],
    'prep_time': '30 minutes',
    'bake_time': '45 minutes',
    'total_time': '24 hours'  # Including fermentation
}
```

## Extending the Team

Add production planning agent:

```python
class ProductionPlanningAgent(BaseTeamMemberAgent):
    def __init__(self, config=None):
        super().__init__('ProductionPlanner', ['production_report'], config)

    def execute(self, **kwargs):
        products = kwargs.get('products', [])

        # Calculate BOM for all products
        bom = calculate_bill_of_materials(products)

        # Create production schedule
        schedule = create_schedule(products)

        return {
            'success': True,
            'bom': bom,
            'schedule': schedule,
            'total_items': len(products)
        }

# Register with team
leader = BakeryLeader(config={...})
planning_agent = ProductionPlanningAgent()
leader.register_agent('Planner', planning_agent, ['production_report'])
```

## Cost Estimates

Approximate costs per goal execution:

| Goal | Estimated Cost |
|------|---------------|
| Plan Production | $0.05 - $0.15 |
| Custom Order | $0.03 - $0.08 |
| Quality Check (per product) | $0.01 - $0.03 |
| Recipe Management | $0.01 - $0.02 |
| Demand Forecast | $0.02 - $0.05 |
| Customer Inquiry (each) | $0.01 - $0.02 |
| Daily Operations | $0.15 - $0.30 |

*Costs vary based on data volume and LLM provider*

## Troubleshooting

### Recipe scaling producing odd quantities

**Solution:** Round scaled quantities and provide the `round_to` parameter in context.

### Allergen detection missing items

**Solution:** Ensure ingredient names are specific (e.g., "almond flour" not just "flour").

### Forecast inaccurate

**Solution:**
1. Provide at least 14 days of historical data
2. Include seasonality information
3. Mark special events (holidays, promotions)
4. Use actual sales data, not estimates

### Quality checks failing

**Solution:**
1. Provide clear product descriptions
2. Include images when possible
3. Specify product type accurately
4. Check quality scoring thresholds

## Requirements

- Python 3.8+
- LLM API key (Anthropic Claude or OpenAI)
- Sales data (CSV, database, or API)
- Recipe database
- Product images (for quality control)

## License

MIT License
