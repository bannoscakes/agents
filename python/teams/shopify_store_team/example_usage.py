"""
Example: Shopify Store Team Usage

Shows how to set up and use the Shopify Store Team with a leader
coordinating multiple specialist agents.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from teams.shopify_store_team.shopify_store_leader import ShopifyStoreLeader
from shopify_chatbot_agent.shopify_chatbot_agent import ShopifyChatbotAgent
from email_automation_agent.email_automation_agent import EmailAutomationAgent
from social_media_generator.social_media_generator import SocialMediaGeneratorAgent
from sales_forecasting_agent.sales_forecasting_agent import SalesForecastingAgent
from customer_segmentation_agent.customer_segmentation_agent import CustomerSegmentationAgent


def setup_shopify_team():
    """
    Set up a complete Shopify Store Team

    Returns:
        Configured ShopifyStoreLeader with all agents registered
    """
    # Initialize the leader
    leader = ShopifyStoreLeader(config={
        'store_name': 'Artisan Bakery',
        'store_url': 'artisan-bakery.myshopify.com',
        'shopify_api_key': os.getenv('SHOPIFY_API_KEY'),
        'llm_api_key': os.getenv('LLM_API_KEY')
    })

    # Initialize and register team members

    # 1. Customer Support Agent
    chatbot_agent = ShopifyChatbotAgent(config={
        'shopify_store_url': 'artisan-bakery.myshopify.com',
        'shopify_access_token': os.getenv('SHOPIFY_ACCESS_TOKEN'),
        'store_name': 'Artisan Bakery',
        'brand_voice': 'warm, friendly, and artisanal',
        'llm_api_key': os.getenv('LLM_API_KEY')
    })
    leader.register_agent(
        agent_name='CustomerSupportAgent',
        agent_instance=chatbot_agent,
        capabilities=['customer_support', 'order_tracking']
    )

    # 2. Email Automation Agent
    email_agent = EmailAutomationAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY'),
        'company_name': 'Artisan Bakery'
    })
    leader.register_agent(
        agent_name='EmailAgent',
        agent_instance=email_agent,
        capabilities=['email_marketing', 'email_automation']
    )

    # 3. Social Media Generator
    social_agent = SocialMediaGeneratorAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY'),
        'brand_voice': 'artisanal, community-focused, passionate about baking'
    })
    leader.register_agent(
        agent_name='SocialMediaAgent',
        agent_instance=social_agent,
        capabilities=['social_media', 'content_generation']
    )

    # 4. Sales Forecasting Agent
    forecasting_agent = SalesForecastingAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY')
    })
    leader.register_agent(
        agent_name='ForecastingAgent',
        agent_instance=forecasting_agent,
        capabilities=['sales_forecasting', 'analytics']
    )

    # 5. Customer Segmentation Agent
    segmentation_agent = CustomerSegmentationAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY')
    })
    leader.register_agent(
        agent_name='SegmentationAgent',
        agent_instance=segmentation_agent,
        capabilities=['customer_segmentation', 'analytics']
    )

    return leader


def example_1_marketing_campaign():
    """Example 1: Run a marketing campaign"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Marketing Campaign")
    print("="*70 + "\n")

    leader = setup_shopify_team()

    # Execute marketing campaign goal
    result = leader.execute_goal(
        goal="marketing_campaign",
        context={
            'product': 'Sourdough Bread Collection',
            'platforms': ['instagram', 'facebook'],
            'content_type': 'promotional',
            'include_email': True,
            'audience': 'bread lovers',
            'tone': 'warm and inviting'
        }
    )

    print("\n📊 CAMPAIGN RESULTS:")
    print(f"Success Rate: {result['summary']['success_rate']}")
    print(f"\nContent Generated:")
    for task_type, tasks in result['results'].items():
        print(f"\n{task_type}:")
        for task in tasks:
            print(f"  ✓ {task['description']}")

    return result


def example_2_daily_operations():
    """Example 2: Run daily operations"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Daily Operations")
    print("="*70 + "\n")

    leader = setup_shopify_team()

    # Sample data
    sample_inquiries = [
        {
            'subject': 'Order status',
            'message': 'Where is my order #1234?',
            'email': 'customer@example.com'
        },
        {
            'subject': 'Product question',
            'message': 'Do you have gluten-free options?',
            'email': 'glutenfree@example.com'
        }
    ]

    sample_sales_data = [
        {'date': '2024-01-01', 'sales': 1200},
        {'date': '2024-01-02', 'sales': 1350},
        {'date': '2024-01-03', 'sales': 1100},
        {'date': '2024-01-04', 'sales': 1500},
        {'date': '2024-01-05', 'sales': 1400},
        {'date': '2024-01-06', 'sales': 1800},
        {'date': '2024-01-07', 'sales': 1600}
    ]

    result = leader.execute_goal(
        goal="daily_operations",
        context={
            'inquiries': sample_inquiries,
            'sales_data': sample_sales_data,
            'forecast_days': 7
        }
    )

    print("\n📊 DAILY OPERATIONS SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")
    print(f"Success Rate: {result['summary']['success_rate']}")

    # Get recommendations
    recommendations = leader.get_recommendations()
    if recommendations:
        print("\n💡 RECOMMENDATIONS:")
        for rec in recommendations:
            print(f"  {rec}")

    return result


def example_3_weekly_report():
    """Example 3: Generate weekly report"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Weekly Report")
    print("="*70 + "\n")

    leader = setup_shopify_team()

    sample_sales_data = [
        {'date': f'2024-01-{i:02d}', 'sales': 1200 + (i * 50)}
        for i in range(1, 15)
    ]

    sample_customers = [
        {'email': 'customer1@example.com', 'total_spent': 850, 'orders': 12, 'last_order_days': 5},
        {'email': 'customer2@example.com', 'total_spent': 350, 'orders': 4, 'last_order_days': 15},
        {'email': 'customer3@example.com', 'total_spent': 1200, 'orders': 20, 'last_order_days': 3},
        {'email': 'customer4@example.com', 'total_spent': 150, 'orders': 2, 'last_order_days': 60},
    ]

    result = leader.execute_goal(
        goal="weekly_report",
        context={
            'sales_data': sample_sales_data,
            'customers': sample_customers,
            'forecast_days': 30,
            'plan_social_media': True
        }
    )

    print("\n📊 WEEKLY REPORT SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")

    # Show team status
    team_status = leader.get_team_status()
    print("\n👥 TEAM PERFORMANCE:")
    for agent_name, agent_data in team_status['agents'].items():
        print(f"\n{agent_name}:")
        print(f"  Tasks Completed: {agent_data['tasks_completed']}")
        print(f"  Success Rate: {agent_data['success_rate']:.1f}%")

    return result


def example_4_custom_goal():
    """Example 4: Custom goal with specific instructions"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Custom Goal")
    print("="*70 + "\n")

    leader = setup_shopify_team()

    # Customer support for specific inquiry
    result = leader.execute_goal(
        goal="customer_support",
        context={
            'inquiries': [
                {
                    'subject': 'Wedding Cake Order',
                    'message': 'I need a custom 3-tier wedding cake for 100 guests. '
                               'Can you help me with flavors and pricing?',
                    'email': 'bride@example.com'
                }
            ]
        }
    )

    print("\n📊 RESULT:")
    print(f"Handled {result['summary']['successful']} inquiry")

    return result


if __name__ == '__main__':
    # Run examples
    print("\n🎯 SHOPIFY STORE TEAM EXAMPLES\n")

    # Example 1: Marketing Campaign
    example_1_marketing_campaign()

    # Example 2: Daily Operations
    example_2_daily_operations()

    # Example 3: Weekly Report
    example_3_weekly_report()

    # Example 4: Custom Goal
    example_4_custom_goal()

    print("\n✅ All examples completed!\n")
