# Multi-Agent Teams Framework

A hierarchical multi-agent system where **leader agents** coordinate teams of **specialist agents** to accomplish complex goals.

## 🎯 Overview

Instead of single agents working in isolation, this framework enables teams of agents to collaborate under the guidance of a leader agent that:

- **Plans** tasks by breaking down high-level goals
- **Delegates** work to specialist agents
- **Monitors** progress and handles failures
- **Aggregates** results into comprehensive reports
- **Makes** strategic decisions

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Leader Agent                │
│  - Plans tasks                      │
│  - Delegates to specialists         │
│  - Aggregates results               │
└─────────────────────────────────────┘
           │
           ├─────────────┬─────────────┬─────────────┐
           │             │             │             │
    ┌──────▼──────┐ ┌───▼──────┐ ┌────▼─────┐ ┌────▼─────┐
    │  Specialist │ │Specialist│ │Specialist│ │Specialist│
    │   Agent 1   │ │ Agent 2  │ │ Agent 3  │ │ Agent 4  │
    └─────────────┘ └──────────┘ └──────────┘ └──────────┘
```

## 📦 Built-in Teams

### 1. **Shopify Store Team**
Manages complete e-commerce operations:
- Customer support (chatbot)
- Order processing
- Email marketing campaigns
- Social media content generation
- Sales forecasting
- Customer segmentation

**Use cases:**
- "Run weekly marketing campaign"
- "Process today's orders"
- "Generate customer analytics report"

### 2. **Repository Management Team**
Manages software development workflows:
- Code review
- Documentation generation
- Security auditing
- Testing coordination
- Issue triage

**Use cases:**
- "Review PR #123"
- "Prepare for v2.0 release"
- "Onboard new contributor"
- "Run security audit"

### 3. **Bakery Operations Team**
Manages bakery operations:
- Recipe management (scaling, allergens, nutrition)
- Production planning
- Quality control
- Customer service
- Sales forecasting
- Order processing

**Use cases:**
- "Plan weekly production"
- "Handle custom wedding cake order"
- "Check allergens in recipe"
- "Run daily operations"

## 🚀 Quick Start

### Method 1: Using Configuration Files (Recommended)

```python
from teams.team_factory import create_team

# Build team from YAML config
leader = create_team('teams/configs/shopify_team.yaml')

# Execute a goal
result = leader.execute_goal(
    goal="marketing_campaign",
    context={
        'product': 'Sourdough Bread',
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
    'store_name': 'My Store',
    'llm_api_key': 'your-api-key'
})

# Register agents
chatbot = ShopifyChatbotAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('Chatbot', chatbot, ['customer_support'])

email_agent = EmailAutomationAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('EmailAgent', email_agent, ['email_marketing'])

# Execute goal
result = leader.execute_goal("daily_operations", context={...})
```

## 📝 Configuration Format

YAML configuration example:

```yaml
team_type: shopify_store

leader_config:
  store_name: "My Store"
  llm_api_key: "${LLM_API_KEY}"  # Environment variable substitution

members:
  - name: CustomerSupportAgent
    type: shopify_chatbot
    capabilities:
      - customer_support
      - order_tracking
    config:
      store_name: "My Store"
      brand_voice: "friendly and helpful"
      llm_api_key: "${LLM_API_KEY}"

  - name: EmailAgent
    type: email_automation
    capabilities:
      - email_marketing
    config:
      llm_api_key: "${LLM_API_KEY}"
```

## 🎨 Creating Custom Teams

### Step 1: Create a Leader Agent

```python
from teams.base_leader_agent import BaseLeaderAgent, Task, TaskPriority

class MyCustomLeader(BaseLeaderAgent):
    def __init__(self, config=None):
        super().__init__(team_name="My Custom Team", config=config)

    def plan_tasks(self, goal: str, context=None) -> List[Task]:
        # Break down goal into tasks
        tasks = []
        if 'analyze' in goal.lower():
            tasks.append(Task(
                task_id="task_1",
                description="Analyze data",
                task_type="data_analysis",
                priority=TaskPriority.HIGH,
                metadata={'data': context.get('data')}
            ))
        return tasks

    def aggregate_results(self, tasks: List[Task]) -> Dict:
        # Combine results from all tasks
        return {
            'summary': {...},
            'results': {...}
        }
```

### Step 2: Register and Use

```python
from teams.team_factory import TeamFactory

factory = TeamFactory()
factory.register_leader('my_custom_team', MyCustomLeader)

# Now you can use it in configs
config = {
    'team_type': 'my_custom_team',
    'leader_config': {...},
    'members': [...]
}

leader = factory.build_team_from_dict(config)
```

## 📚 Core Concepts

### Task

A unit of work that can be delegated:

```python
Task(
    task_id="task_1",
    description="Review code for PR #123",
    task_type="code_review",
    priority=TaskPriority.HIGH,
    metadata={'code': '...', 'language': 'python'}
)
```

### Task Types & Capabilities

Agents declare what they can do, leaders delegate accordingly:

```python
leader.register_agent(
    agent_name='CodeReviewer',
    agent_instance=code_review_agent,
    capabilities=['code_review', 'security']
)
```

### Task Lifecycle

1. **PENDING** - Task created, not yet assigned
2. **DELEGATED** - Assigned to an agent
3. **IN_PROGRESS** - Agent executing task
4. **COMPLETED** - Task finished successfully
5. **FAILED** - Task failed with error

### Goal Execution Flow

```python
result = leader.execute_goal("marketing_campaign", context={...})
```

1. **Planning**: Leader breaks goal into tasks
2. **Delegation**: Leader assigns tasks to capable agents
3. **Execution**: Agents execute their assigned tasks
4. **Aggregation**: Leader combines all results
5. **Return**: Comprehensive report returned

## 🔧 Advanced Features

### Load Balancing

Leader automatically distributes tasks to agents with fewest assignments:

```python
# Automatically chooses least-busy agent
leader.delegate_task(task)
```

### Team Status & Metrics

```python
status = leader.get_team_status()
print(status)
# {
#   'team_name': 'Shopify Store Team',
#   'agents': {
#     'CustomerAgent': {
#       'tasks_assigned': 10,
#       'tasks_completed': 9,
#       'tasks_failed': 1,
#       'success_rate': 90.0
#     }
#   },
#   'tasks': {
#     'total': 15,
#     'completed': 13,
#     'failed': 2
#   }
# }
```

### Environment Variable Substitution

Config files support environment variables:

```yaml
leader_config:
  api_key: "${API_KEY}"  # Uses os.getenv('API_KEY')
  url: "${BASE_URL:https://default.com}"  # With default value
```

### Context Manager Support

```python
with ShopifyStoreLeader(config={...}) as leader:
    result = leader.execute_goal("daily_operations")
# Automatic cleanup on exit
```

## 📊 Examples

See the example files for complete usage:

- `shopify_store_team/example_usage.py` - E-commerce operations
- `repository_team/example_usage.py` - Software development
- `bakery_team/example_usage.py` - Bakery operations
- `example_team_factory.py` - Configuration-based setup

## 🛠️ Available Agents

| Agent Type | Capabilities | Team |
|------------|--------------|------|
| `shopify_chatbot` | customer_support, order_tracking | Shopify, Bakery |
| `email_automation` | email_marketing, email_automation | Shopify |
| `social_media_generator` | social_media, content_generation | Shopify |
| `sales_forecasting` | sales_forecasting, analytics | Shopify, Bakery |
| `customer_segmentation` | customer_segmentation, analytics | Shopify |
| `code_review` | code_review, security | Repository |
| `faq_generator` | documentation, faq_generation | Repository |
| `recipe_management` | recipe_scale, recipe_allergens, recipe_nutrition | Bakery |

## 🎯 Common Goals

### Shopify Store Team

- `marketing_campaign` - Run social media + email campaign
- `daily_operations` - Process orders, handle support, check analytics
- `weekly_analytics` - Generate forecasts and customer segments
- `customer_support` - Handle customer inquiries

### Repository Team

- `review_pr` - Review pull request with tests and docs
- `pre_release` - Run full release checklist
- `security_audit` - Security-focused code review
- `update_docs` - Generate/update documentation
- `onboard_contributor` - Create onboarding materials

### Bakery Team

- `plan_production` - Plan weekly/daily production
- `custom_order` - Handle custom cake orders
- `quality_check` - Quality control inspection
- `recipe_management` - Scale, substitute, check allergens
- `daily_operations` - Complete daily workflow

## 🔒 Best Practices

1. **Use configuration files** for production teams
2. **Set environment variables** for API keys (never hardcode)
3. **Monitor team metrics** to identify performance issues
4. **Handle failures gracefully** - check `result['failures']`
5. **Break down complex goals** into smaller, manageable tasks
6. **Assign clear capabilities** to avoid task routing confusion
7. **Test agents individually** before adding to teams

## 📖 API Reference

### BaseLeaderAgent

```python
class BaseLeaderAgent:
    def plan_tasks(goal: str, context: Dict) -> List[Task]
    def delegate_task(task: Task) -> bool
    def execute_task(task: Task) -> Any
    def aggregate_results(tasks: List[Task]) -> Dict
    def execute_goal(goal: str, context: Dict) -> Dict
    def get_team_status() -> Dict
    def register_agent(name: str, instance: Any, capabilities: List[str])
```

### TeamFactory

```python
class TeamFactory:
    def register_agent(agent_type: str, agent_class)
    def register_leader(leader_type: str, leader_class)
    def load_config(config_path: str) -> Dict
    def build_team(config_path: str) -> BaseLeaderAgent
    def build_team_from_dict(config: Dict) -> BaseLeaderAgent
```

## 🤝 Contributing

To add a new team:

1. Create leader class extending `BaseLeaderAgent`
2. Implement `plan_tasks()` and `aggregate_results()`
3. Register with `TeamFactory`
4. Create YAML config in `configs/`
5. Add example usage

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ using the Anthropic Claude API**
