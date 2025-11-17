"""
Example: Bakery Operations Team Usage

Shows how to set up and use the Bakery Operations Team with a leader
coordinating recipe management, production, quality control, and customer service.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from teams.bakery_team.bakery_leader import BakeryLeader
from recipe_management_agent.recipe_management_agent import RecipeManagementAgent
from sales_forecasting_agent.sales_forecasting_agent import SalesForecastingAgent
from shopify_chatbot_agent.shopify_chatbot_agent import ShopifyChatbotAgent


def setup_bakery_team():
    """
    Set up a complete Bakery Operations Team

    Returns:
        Configured BakeryLeader with all agents registered
    """
    # Initialize the leader
    leader = BakeryLeader(config={
        'bakery_name': 'Artisan Bakery & Café',
        'specialties': ['sourdough', 'wedding cakes', 'pastries'],
        'llm_api_key': os.getenv('LLM_API_KEY')
    })

    # Initialize and register team members

    # 1. Recipe Management Agent
    recipe_agent = RecipeManagementAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY')
    })
    leader.register_agent(
        agent_name='RecipeAgent',
        agent_instance=recipe_agent,
        capabilities=[
            'recipe_scale',
            'recipe_substitute',
            'recipe_allergens',
            'recipe_nutrition',
            'recipe_optimize'
        ]
    )

    # 2. Sales Forecasting Agent
    forecasting_agent = SalesForecastingAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY')
    })
    leader.register_agent(
        agent_name='ForecastingAgent',
        agent_instance=forecasting_agent,
        capabilities=['sales_forecasting']
    )

    # 3. Customer Service Agent
    customer_service = ShopifyChatbotAgent(config={
        'store_name': 'Artisan Bakery & Café',
        'brand_voice': 'warm, artisanal, and welcoming',
        'llm_api_key': os.getenv('LLM_API_KEY'),
        'store_policies': {
            'returns': '7-day return policy on packaged goods',
            'custom_orders': '48-hour notice required for custom cakes',
            'delivery': 'Free delivery on orders over $50'
        }
    })
    leader.register_agent(
        agent_name='CustomerServiceAgent',
        agent_instance=customer_service,
        capabilities=['customer_support']
    )

    # Note: In a real implementation, you would add:
    # - ProductionPlanningAgent (BOM, scheduling)
    # - QualityControlAgent (inspection, defect detection)
    # - OrderProcessingAgent (webhook processing)

    return leader


def example_1_weekly_production():
    """Example 1: Plan weekly production"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Weekly Production Planning")
    print("="*70 + "\n")

    leader = setup_bakery_team()

    # Historical sales data
    sales_data = [
        {'date': '2024-01-01', 'sales': 1200, 'product': 'sourdough'},
        {'date': '2024-01-02', 'sales': 1350, 'product': 'sourdough'},
        {'date': '2024-01-03', 'sales': 1100, 'product': 'sourdough'},
        {'date': '2024-01-04', 'sales': 1500, 'product': 'sourdough'},
        {'date': '2024-01-05', 'sales': 1400, 'product': 'sourdough'},
        {'date': '2024-01-06', 'sales': 1800, 'product': 'sourdough'},
        {'date': '2024-01-07', 'sales': 1600, 'product': 'sourdough'}
    ]

    # Recipes to scale
    recipes = [
        {
            'name': 'Sourdough Bread',
            'servings': 10,
            'target_servings': 100,
            'ingredients': {
                'bread flour': '500g',
                'water': '350ml',
                'sourdough starter': '100g',
                'salt': '10g'
            }
        },
        {
            'name': 'Croissants',
            'servings': 12,
            'target_servings': 60,
            'ingredients': {
                'flour': '400g',
                'butter': '250g',
                'milk': '150ml',
                'sugar': '50g',
                'yeast': '10g',
                'salt': '8g'
            }
        }
    ]

    result = leader.execute_goal(
        goal="plan_production",
        context={
            'sales_data': sales_data,
            'recipes': recipes,
            'forecast_days': 7,
            'generate_report': True
        }
    )

    print("\n📊 PRODUCTION PLAN SUMMARY:")
    print(f"Success Rate: {result['summary']['success_rate']}")

    print("\n📈 Operational Metrics:")
    metrics = result['operational_metrics']
    print(f"  Recipes Scaled: {metrics['recipes_managed']}")
    print(f"  Forecasts Generated: {metrics['forecasts_generated']}")
    print(f"  Production Plans: {metrics['production_plans_created']}")

    return result


def example_2_custom_cake_order():
    """Example 2: Handle custom wedding cake order"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Custom Wedding Cake Order")
    print("="*70 + "\n")

    leader = setup_bakery_team()

    custom_order = {
        'message': '''
        Hi! I need a 3-tier wedding cake for 100 guests on June 15th.
        We want chocolate cake with vanilla buttercream.
        The bride has a nut allergy - can you ensure no nuts?
        Also, can you provide nutrition info?
        ''',
        'customer_email': 'bride@example.com',
        'recipe': {
            'name': 'Wedding Cake - 3 Tier',
            'servings': 100,
            'ingredients': {
                'flour': '2000g',
                'sugar': '1500g',
                'cocoa powder': '300g',
                'eggs': '20 units',
                'butter': '1000g',
                'milk': '500ml',
                'vanilla extract': '50ml',
                'baking powder': '40g'
            }
        },
        'nutrition_info': True
    }

    result = leader.execute_goal(
        goal="custom_order",
        context={
            'order': custom_order
        }
    )

    print("\n📊 ORDER HANDLING SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")
    print(f"Success Rate: {result['summary']['success_rate']}")

    print("\n✅ Actions Taken:")
    for task_type, tasks in result['results'].items():
        print(f"\n{task_type}:")
        for task in tasks:
            print(f"  ✓ {task['description']}")

    return result


def example_3_quality_control():
    """Example 3: Daily quality control"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Daily Quality Control")
    print("="*70 + "\n")

    leader = setup_bakery_team()

    products_to_check = [
        {
            'name': 'Sourdough Loaf #1',
            'type': 'bread',
            'description': 'Golden brown crust, good rise'
        },
        {
            'name': 'Wedding Cake Tier 1',
            'type': 'cake',
            'description': '3-layer chocolate cake with vanilla buttercream'
        },
        {
            'name': 'Croissant Batch A',
            'type': 'pastry',
            'description': 'Flaky layers, golden color'
        }
    ]

    result = leader.execute_goal(
        goal="quality_check",
        context={
            'products': products_to_check
        }
    )

    print("\n📊 QUALITY CONTROL SUMMARY:")
    print(f"Products Checked: {result['summary']['successful']}")
    print(f"Success Rate: {result['summary']['success_rate']}")

    print("\n✅ Quality Checks:")
    if 'quality_control' in result['results']:
        for check in result['results']['quality_control']:
            print(f"  ✓ {check['description']}")

    return result


def example_4_allergen_check():
    """Example 4: Recipe allergen analysis"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Allergen Analysis")
    print("="*70 + "\n")

    leader = setup_bakery_team()

    recipe_to_check = {
        'name': 'Almond Croissant',
        'servings': 12,
        'ingredients': {
            'flour': '400g',
            'butter': '250g',
            'milk': '150ml',
            'almonds': '100g',
            'almond paste': '150g',
            'eggs': '2 units',
            'sugar': '50g'
        }
    }

    result = leader.execute_goal(
        goal="recipe_management",
        context={
            'action': 'allergens',
            'recipe': recipe_to_check
        }
    )

    print("\n📊 ALLERGEN CHECK SUMMARY:")
    print(f"Success Rate: {result['summary']['success_rate']}")

    if 'recipe_allergens' in result['results']:
        print("\n⚠️  Allergen Information:")
        for task in result['results']['recipe_allergens']:
            print(f"  ✓ {task['description']}")

    return result


def example_5_daily_operations():
    """Example 5: Complete daily operations"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Daily Operations")
    print("="*70 + "\n")

    leader = setup_bakery_team()

    # Comprehensive daily context
    daily_context = {
        'sales_data': [
            {'date': f'2024-01-{i:02d}', 'sales': 1200 + (i * 50)}
            for i in range(1, 8)
        ],
        'recipes': [
            {
                'name': 'Daily Sourdough',
                'servings': 10,
                'target_servings': 50,
                'ingredients': {
                    'flour': '500g',
                    'water': '350ml',
                    'starter': '100g',
                    'salt': '10g'
                }
            }
        ],
        'products_to_check': [
            {'name': 'Morning Bread Batch', 'type': 'bread', 'description': 'First batch of the day'},
            {'name': 'Pastry Display', 'type': 'pastry', 'description': 'Assorted pastries'}
        ],
        'inquiries': [
            {
                'subject': 'Birthday cake order',
                'message': 'Can I order a chocolate cake for 20 people for this Saturday?',
                'customer_email': 'customer@example.com'
            }
        ],
        'plan_production': True
    }

    result = leader.execute_goal(
        goal="daily_operations",
        context=daily_context
    )

    print("\n📊 DAILY OPERATIONS SUMMARY:")
    print(f"Total Tasks: {result['summary']['total_tasks']}")
    print(f"Successful: {result['summary']['successful']}")
    print(f"Success Rate: {result['summary']['success_rate']}")

    print("\n📈 Operational Metrics:")
    metrics = result['operational_metrics']
    for metric, value in metrics.items():
        print(f"  {metric.replace('_', ' ').title()}: {value}")

    # Team status
    team_status = leader.get_team_status()
    print("\n👥 TEAM PERFORMANCE:")
    for agent_name, agent_data in team_status['agents'].items():
        print(f"\n{agent_name}:")
        print(f"  Tasks Completed: {agent_data['tasks_completed']}")
        print(f"  Success Rate: {agent_data['success_rate']:.1f}%")

    return result


if __name__ == '__main__':
    # Run examples
    print("\n🎯 BAKERY OPERATIONS TEAM EXAMPLES\n")

    # Example 1: Weekly Production Planning
    example_1_weekly_production()

    # Example 2: Custom Cake Order
    example_2_custom_cake_order()

    # Example 3: Quality Control
    example_3_quality_control()

    # Example 4: Allergen Check
    example_4_allergen_check()

    # Example 5: Daily Operations
    example_5_daily_operations()

    print("\n✅ All examples completed!\n")
