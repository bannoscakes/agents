"""
Shopify Store Team Leader

Coordinates a team of agents to manage a complete Shopify store:
- Customer support (chatbot)
- Order processing
- Email marketing
- Social media content
- Analytics and forecasting
- Customer segmentation

The leader receives high-level goals like "process today's orders" or
"run weekly marketing campaign" and coordinates the team to achieve them.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from teams.base_leader_agent import BaseLeaderAgent, Task, TaskPriority
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class ShopifyStoreLeader(BaseLeaderAgent):
    """
    Leader agent for Shopify store operations

    Manages and coordinates:
    - Customer support agent
    - Order processing agent
    - Email automation agent
    - Social media generator
    - Sales forecasting agent
    - Customer segmentation agent
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Shopify Store Leader

        Args:
            config: Configuration including store details, API keys, etc.
        """
        super().__init__(team_name="Shopify Store Team", config=config)

        self.store_name = config.get('store_name', 'My Store') if config else 'My Store'
        self.store_url = config.get('store_url', '') if config else ''

    def plan_tasks(self, goal: str, context: Optional[Dict[str, Any]] = None) -> List[Task]:
        """
        Plan tasks based on the goal

        Supported goals:
        - "process_orders": Process and fulfill orders
        - "customer_support": Handle customer inquiries
        - "marketing_campaign": Run social media + email campaign
        - "weekly_analytics": Generate analytics and forecasts
        - "customer_review": Analyze and segment customers
        - "daily_operations": Full daily workflow

        Args:
            goal: High-level goal identifier
            context: Additional context (date range, specific items, etc.)

        Returns:
            List of tasks to execute
        """
        context = context or {}
        tasks = []

        goal_lower = goal.lower()

        # GOAL: Process Orders
        if 'order' in goal_lower and 'process' in goal_lower:
            tasks = self._plan_order_processing(context)

        # GOAL: Customer Support
        elif 'customer' in goal_lower and 'support' in goal_lower:
            tasks = self._plan_customer_support(context)

        # GOAL: Marketing Campaign
        elif 'marketing' in goal_lower or 'campaign' in goal_lower:
            tasks = self._plan_marketing_campaign(context)

        # GOAL: Analytics
        elif 'analytics' in goal_lower or 'forecast' in goal_lower:
            tasks = self._plan_analytics(context)

        # GOAL: Customer Segmentation
        elif 'segment' in goal_lower or 'customer' in goal_lower and 'review' in goal_lower:
            tasks = self._plan_customer_segmentation(context)

        # GOAL: Daily Operations (comprehensive)
        elif 'daily' in goal_lower:
            tasks = self._plan_daily_operations(context)

        # GOAL: Weekly Report
        elif 'weekly' in goal_lower:
            tasks = self._plan_weekly_report(context)

        else:
            # Default: analyze the goal with LLM or use general approach
            logger.warning(f"Unknown goal pattern: {goal}. Using general task planning.")
            tasks = self._plan_general_goal(goal, context)

        return tasks

    def _plan_order_processing(self, context: Dict[str, Any]) -> List[Task]:
        """Plan order processing workflow"""
        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description="Process incoming orders",
                task_type="order_processing",
                priority=TaskPriority.HIGH,
                metadata={
                    'orders': context.get('orders', []),
                    'auto_fulfill': context.get('auto_fulfill', False)
                }
            )
        ]

    def _plan_customer_support(self, context: Dict[str, Any]) -> List[Task]:
        """Plan customer support workflow"""
        inquiries = context.get('inquiries', [])
        tasks = []

        for idx, inquiry in enumerate(inquiries):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description=f"Handle customer inquiry: {inquiry.get('subject', 'N/A')}",
                task_type="customer_support",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'message': inquiry.get('message', ''),
                    'customer_email': inquiry.get('email', '')
                }
            ))

        return tasks

    def _plan_marketing_campaign(self, context: Dict[str, Any]) -> List[Task]:
        """Plan marketing campaign workflow"""
        tasks = []
        product = context.get('product', 'our products')
        platforms = context.get('platforms', ['instagram', 'facebook', 'twitter'])

        # Social media content generation
        for platform in platforms:
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description=f"Generate {platform} content",
                task_type="social_media",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'topic': product,
                    'platform': platform,
                    'content_type': context.get('content_type', 'promotional')
                }
            ))

        # Email campaign
        if context.get('include_email', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Generate email campaign",
                task_type="email_marketing",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'content_type': 'email_campaign',
                    'product': product,
                    'target_audience': context.get('audience', 'all customers'),
                    'tone': context.get('tone', 'friendly')
                }
            ))

        return tasks

    def _plan_analytics(self, context: Dict[str, Any]) -> List[Task]:
        """Plan analytics and forecasting workflow"""
        tasks = []

        # Sales forecasting
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Generate sales forecast",
            task_type="sales_forecasting",
            priority=TaskPriority.MEDIUM,
            metadata={
                'historical_data': context.get('sales_data', []),
                'forecast_days': context.get('forecast_days', 30)
            }
        ))

        return tasks

    def _plan_customer_segmentation(self, context: Dict[str, Any]) -> List[Task]:
        """Plan customer segmentation workflow"""
        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description="Segment customers",
                task_type="customer_segmentation",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'customers': context.get('customers', [])
                }
            )
        ]

    def _plan_daily_operations(self, context: Dict[str, Any]) -> List[Task]:
        """Plan complete daily operations workflow"""
        tasks = []

        # 1. Process orders
        tasks.extend(self._plan_order_processing(context))

        # 2. Handle customer support
        if context.get('inquiries'):
            tasks.extend(self._plan_customer_support(context))

        # 3. Quick analytics check
        tasks.extend(self._plan_analytics(context))

        return tasks

    def _plan_weekly_report(self, context: Dict[str, Any]) -> List[Task]:
        """Plan weekly reporting workflow"""
        tasks = []

        # Analytics
        tasks.extend(self._plan_analytics(context))

        # Customer segmentation
        tasks.extend(self._plan_customer_segmentation(context))

        # Social media planning for next week
        if context.get('plan_social_media', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Plan next week's social media",
                task_type="social_media",
                priority=TaskPriority.LOW,
                metadata={
                    'topic': 'weekly highlights',
                    'platform': 'instagram',
                    'content_type': 'recap'
                }
            ))

        return tasks

    def _plan_general_goal(self, goal: str, context: Dict[str, Any]) -> List[Task]:
        """Fallback: create a general task"""
        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description=goal,
                task_type="general",
                priority=TaskPriority.MEDIUM,
                metadata=context
            )
        ]

    def aggregate_results(self, tasks: List[Task]) -> Dict[str, Any]:
        """
        Aggregate results from all tasks

        Args:
            tasks: List of completed tasks

        Returns:
            Comprehensive report of all task results
        """
        successful_tasks = [t for t in tasks if t.status.value == "completed"]
        failed_tasks = [t for t in tasks if t.status.value == "failed"]

        report = {
            'team': self.team_name,
            'store': self.store_name,
            'summary': {
                'total_tasks': len(tasks),
                'successful': len(successful_tasks),
                'failed': len(failed_tasks),
                'success_rate': f"{len(successful_tasks) / len(tasks) * 100:.1f}%" if tasks else "0%"
            },
            'results': {},
            'failures': []
        }

        # Organize results by task type
        for task in successful_tasks:
            task_type = task.task_type
            if task_type not in report['results']:
                report['results'][task_type] = []

            report['results'][task_type].append({
                'task_id': task.task_id,
                'description': task.description,
                'assigned_to': task.assigned_to,
                'result': task.result
            })

        # Record failures
        for task in failed_tasks:
            report['failures'].append({
                'task_id': task.task_id,
                'description': task.description,
                'error': task.error
            })

        return report

    def get_recommendations(self) -> List[str]:
        """
        Get strategic recommendations based on team performance

        Returns:
            List of recommendations
        """
        recommendations = []
        status = self.get_team_status()

        # Check agent performance
        for agent_name, agent_data in status['agents'].items():
            success_rate = agent_data['success_rate']

            if success_rate < 50 and agent_data['tasks_assigned'] > 0:
                recommendations.append(
                    f"⚠️  {agent_name} has low success rate ({success_rate:.1f}%) - "
                    f"consider reviewing configuration or providing more context"
                )
            elif success_rate == 100 and agent_data['tasks_completed'] > 5:
                recommendations.append(
                    f"✅ {agent_name} performing excellently ({agent_data['tasks_completed']} tasks completed)"
                )

        # Check task distribution
        if status['tasks']['failed'] > status['tasks']['completed'] / 2:
            recommendations.append(
                "⚠️  High failure rate - review task complexity and agent capabilities"
            )

        return recommendations
