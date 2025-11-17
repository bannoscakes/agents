"""
Example: Using Team Factory to Build Teams from Configuration

This example shows how to use YAML/JSON configuration files to set up
teams without writing Python code for each team setup.
"""

import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from teams.team_factory import TeamFactory, create_team


def example_1_build_from_yaml():
    """Example 1: Build team from YAML configuration"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Build Team from YAML Configuration")
    print("="*70 + "\n")

    # Build Shopify Store Team from config file
    config_path = os.path.join(os.path.dirname(__file__), 'configs', 'shopify_team.yaml')

    try:
        leader = create_team(config_path)

        print(f"✅ Team created: {leader.team_name}")

        # Show team status
        status = leader.get_team_status()
        print(f"\n👥 Team has {len(status['agents'])} members:")
        for agent_name, agent_data in status['agents'].items():
            print(f"  - {agent_name}: {', '.join(agent_data['capabilities'])}")

        # Execute a goal
        print("\n🎯 Executing marketing campaign goal...")
        result = leader.execute_goal(
            goal="marketing_campaign",
            context={
                'product': 'Sourdough Bread',
                'platforms': ['instagram', 'facebook'],
                'content_type': 'promotional',
                'include_email': True
            }
        )

        print(f"\n📊 Result: {result['summary']['success_rate']} success rate")

    except FileNotFoundError as e:
        print(f"⚠️  Config file not found: {e}")
        print("Note: Make sure you're running from the correct directory")
    except Exception as e:
        print(f"❌ Error: {e}")


def example_2_build_bakery_team():
    """Example 2: Build bakery team from config"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Build Bakery Team from Configuration")
    print("="*70 + "\n")

    config_path = os.path.join(os.path.dirname(__file__), 'configs', 'bakery_team.yaml')

    try:
        leader = create_team(config_path)

        print(f"✅ Team created: {leader.team_name}")

        # Show team members
        status = leader.get_team_status()
        print(f"\n👥 Team Members:")
        for agent_name, agent_data in status['agents'].items():
            print(f"  - {agent_name}")
            print(f"    Capabilities: {', '.join(agent_data['capabilities'])}")

        # Execute a recipe management task
        print("\n🎯 Checking allergens in recipe...")

        recipe = {
            'name': 'Chocolate Cake',
            'servings': 12,
            'ingredients': {
                'flour': '300g',
                'sugar': '200g',
                'cocoa powder': '50g',
                'eggs': '4 units',
                'milk': '250ml',
                'butter': '150g'
            }
        }

        result = leader.execute_goal(
            goal="recipe_management",
            context={
                'action': 'allergens',
                'recipe': recipe
            }
        )

        print(f"\n📊 Result: {result['summary']['success_rate']} success rate")

    except FileNotFoundError as e:
        print(f"⚠️  Config file not found: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


def example_3_build_repository_team():
    """Example 3: Build repository team from config"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Build Repository Team from Configuration")
    print("="*70 + "\n")

    config_path = os.path.join(os.path.dirname(__file__), 'configs', 'repository_team.yaml')

    try:
        leader = create_team(config_path)

        print(f"✅ Team created: {leader.team_name}")

        # Show team capabilities
        status = leader.get_team_status()
        print(f"\n👥 Team Capabilities:")
        all_capabilities = set()
        for agent_data in status['agents'].values():
            all_capabilities.update(agent_data['capabilities'])

        for capability in sorted(all_capabilities):
            print(f"  ✓ {capability}")

        # Execute a code review
        print("\n🎯 Reviewing code...")

        sample_code = '''
def process_payment(amount, card_number):
    # Process payment without validation
    return charge_card(card_number, amount)
'''

        result = leader.execute_goal(
            goal="review_pr",
            context={
                'pr_number': 123,
                'code': sample_code,
                'language': 'python',
                'run_tests': False,
                'check_docs': False
            }
        )

        print(f"\n📊 Result: {result['summary']['success_rate']} success rate")

    except FileNotFoundError as e:
        print(f"⚠️  Config file not found: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


def example_4_custom_team():
    """Example 4: Build custom team from dictionary"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Build Custom Team from Dictionary")
    print("="*70 + "\n")

    # Define team configuration programmatically
    custom_config = {
        'team_type': 'shopify_store',
        'leader_config': {
            'store_name': 'Custom Store',
            'llm_api_key': os.getenv('LLM_API_KEY', '')
        },
        'members': [
            {
                'name': 'SocialAgent',
                'type': 'social_media_generator',
                'capabilities': ['social_media'],
                'config': {
                    'llm_api_key': os.getenv('LLM_API_KEY', ''),
                    'brand_voice': 'professional and innovative'
                }
            },
            {
                'name': 'EmailAgent',
                'type': 'email_automation',
                'capabilities': ['email_marketing'],
                'config': {
                    'llm_api_key': os.getenv('LLM_API_KEY', ''),
                    'company_name': 'Custom Store'
                }
            }
        ]
    }

    try:
        factory = TeamFactory()
        leader = factory.build_team_from_dict(custom_config)

        print(f"✅ Custom team created: {leader.team_name}")

        status = leader.get_team_status()
        print(f"\n👥 Team has {len(status['agents'])} members:")
        for agent_name in status['agents'].keys():
            print(f"  - {agent_name}")

    except Exception as e:
        print(f"❌ Error: {e}")


def example_5_register_custom_agent():
    """Example 5: Register and use custom agent type"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Register Custom Agent Type")
    print("="*70 + "\n")

    factory = TeamFactory()

    # Show registered agents
    print("📋 Registered Agent Types:")
    for agent_type in sorted(factory.agent_registry.keys()):
        print(f"  - {agent_type}")

    print("\n📋 Registered Leader Types:")
    for leader_type in sorted(factory.leader_registry.keys()):
        print(f"  - {leader_type}")

    # You can register custom agents like this:
    # from my_custom_agent import MyCustomAgent
    # factory.register_agent('my_custom_type', MyCustomAgent)


if __name__ == '__main__':
    print("\n🎯 TEAM FACTORY EXAMPLES\n")
    print("These examples show how to build teams from configuration files")
    print("instead of manually writing setup code.\n")

    # Example 1: Build from YAML
    example_1_build_from_yaml()

    # Example 2: Build bakery team
    example_2_build_bakery_team()

    # Example 3: Build repository team
    example_3_build_repository_team()

    # Example 4: Build from dictionary
    example_4_custom_team()

    # Example 5: Show registered types
    example_5_register_custom_agent()

    print("\n✅ All examples completed!\n")

    print("\n💡 TIP: You can create your own team configurations by:")
    print("  1. Copy one of the YAML files in teams/configs/")
    print("  2. Modify the team members and configuration")
    print("  3. Use create_team('path/to/your/config.yaml')")
    print("\n")
