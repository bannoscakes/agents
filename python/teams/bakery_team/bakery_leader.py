"""
Bakery Operations Team Leader

Coordinates a team of agents to manage bakery operations:
- Recipe management (scaling, substitutions, allergens)
- Production planning and reporting
- Quality control
- Customer service
- Sales forecasting
- Order processing

The leader receives high-level goals like "plan weekly production" or
"handle custom order" and coordinates the team to achieve them.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from teams.base_leader_agent import BaseLeaderAgent, Task, TaskPriority
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class BakeryLeader(BaseLeaderAgent):
    """
    Leader agent for bakery operations

    Manages and coordinates:
    - Recipe management agent
    - Production planning agent
    - Quality control agent
    - Customer service agent (chatbot)
    - Sales forecasting agent
    - Order processing agent
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Bakery Operations Leader

        Args:
            config: Configuration including bakery name, products, etc.
        """
        super().__init__(team_name="Bakery Operations Team", config=config)

        self.bakery_name = config.get('bakery_name', 'Artisan Bakery') if config else 'Artisan Bakery'
        self.specialties = config.get('specialties', ['bread', 'cakes', 'pastries']) if config else ['bread', 'cakes', 'pastries']

    def plan_tasks(self, goal: str, context: Optional[Dict[str, Any]] = None) -> List[Task]:
        """
        Plan tasks based on the goal

        Supported goals:
        - "plan_production": Plan weekly/daily production
        - "custom_order": Handle custom cake/catering order
        - "quality_check": Perform quality control
        - "recipe_management": Scale, substitute ingredients, check allergens
        - "forecast_demand": Forecast sales and demand
        - "customer_inquiry": Handle customer questions
        - "daily_operations": Complete daily workflow

        Args:
            goal: High-level goal identifier
            context: Additional context

        Returns:
            List of tasks to execute
        """
        context = context or {}
        tasks = []

        goal_lower = goal.lower()

        # GOAL: Plan Production
        if 'production' in goal_lower or 'plan' in goal_lower:
            tasks = self._plan_production_planning(context)

        # GOAL: Custom Order
        elif 'custom' in goal_lower or 'order' in goal_lower:
            tasks = self._plan_custom_order(context)

        # GOAL: Quality Check
        elif 'quality' in goal_lower or 'inspection' in goal_lower:
            tasks = self._plan_quality_check(context)

        # GOAL: Recipe Management
        elif 'recipe' in goal_lower:
            tasks = self._plan_recipe_management(context)

        # GOAL: Demand Forecasting
        elif 'forecast' in goal_lower or 'demand' in goal_lower:
            tasks = self._plan_demand_forecast(context)

        # GOAL: Customer Inquiry
        elif 'customer' in goal_lower or 'inquiry' in goal_lower:
            tasks = self._plan_customer_service(context)

        # GOAL: Daily Operations
        elif 'daily' in goal_lower:
            tasks = self._plan_daily_operations(context)

        else:
            logger.warning(f"Unknown goal pattern: {goal}. Using general task planning.")
            tasks = self._plan_general_goal(goal, context)

        return tasks

    def _plan_production_planning(self, context: Dict[str, Any]) -> List[Task]:
        """Plan production planning workflow"""
        tasks = []

        # 1. Forecast demand
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Forecast product demand",
            task_type="sales_forecasting",
            priority=TaskPriority.HIGH,
            metadata={
                'historical_data': context.get('sales_data', []),
                'forecast_days': context.get('forecast_days', 7)
            }
        ))

        # 2. Scale recipes based on forecast
        recipes_to_scale = context.get('recipes', [])
        for recipe in recipes_to_scale:
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description=f"Scale recipe: {recipe.get('name', 'Unknown')}",
                task_type="recipe_scale",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'action': 'scale',
                    'recipe': recipe,
                    'servings': recipe.get('target_servings', 100)
                }
            ))

        # 3. Generate production report (if production agent available)
        if context.get('generate_report', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Generate production report",
                task_type="production_report",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'products': context.get('products', [])
                }
            ))

        return tasks

    def _plan_custom_order(self, context: Dict[str, Any]) -> List[Task]:
        """Plan custom order handling workflow"""
        tasks = []
        order_details = context.get('order', {})

        # 1. Handle customer inquiry
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Respond to custom order inquiry",
            task_type="customer_support",
            priority=TaskPriority.HIGH,
            metadata={
                'message': order_details.get('message', ''),
                'customer_email': order_details.get('customer_email', '')
            }
        ))

        # 2. Check recipe for allergens (if recipe provided)
        if order_details.get('recipe'):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Check allergens in recipe",
                task_type="recipe_allergens",
                priority=TaskPriority.HIGH,
                metadata={
                    'action': 'allergens',
                    'recipe': order_details['recipe']
                }
            ))

        # 3. Calculate nutrition (if requested)
        if order_details.get('nutrition_info', False):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Calculate nutrition information",
                task_type="recipe_nutrition",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'action': 'nutrition',
                    'recipe': order_details.get('recipe', {})
                }
            ))

        return tasks

    def _plan_quality_check(self, context: Dict[str, Any]) -> List[Task]:
        """Plan quality control workflow"""
        products = context.get('products', [])
        tasks = []

        for product in products:
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description=f"Quality check: {product.get('name', 'Unknown')}",
                task_type="quality_control",
                priority=TaskPriority.HIGH,
                metadata={
                    'product_type': product.get('type', 'cake'),
                    'image_path': product.get('image', ''),
                    'description': product.get('description', '')
                }
            ))

        return tasks

    def _plan_recipe_management(self, context: Dict[str, Any]) -> List[Task]:
        """Plan recipe management workflow"""
        action = context.get('action', 'scale')
        recipe = context.get('recipe', {})

        # Map action to task type
        task_type_map = {
            'scale': 'recipe_scale',
            'substitute': 'recipe_substitute',
            'allergens': 'recipe_allergens',
            'nutrition': 'recipe_nutrition',
            'optimize': 'recipe_optimize'
        }

        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description=f"Recipe {action}: {recipe.get('name', 'Unknown')}",
                task_type=task_type_map.get(action, 'recipe_scale'),
                priority=TaskPriority.MEDIUM,
                metadata={
                    'action': action,
                    'recipe': recipe,
                    **{k: v for k, v in context.items() if k not in ['action', 'recipe']}
                }
            )
        ]

    def _plan_demand_forecast(self, context: Dict[str, Any]) -> List[Task]:
        """Plan demand forecasting workflow"""
        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description="Forecast product demand",
                task_type="sales_forecasting",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'historical_data': context.get('sales_data', []),
                    'forecast_days': context.get('forecast_days', 30)
                }
            )
        ]

    def _plan_customer_service(self, context: Dict[str, Any]) -> List[Task]:
        """Plan customer service workflow"""
        inquiries = context.get('inquiries', [context])  # Single or multiple
        tasks = []

        for inquiry in inquiries:
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description=f"Handle inquiry: {inquiry.get('subject', 'General')}",
                task_type="customer_support",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'message': inquiry.get('message', ''),
                    'customer_email': inquiry.get('customer_email', '')
                }
            ))

        return tasks

    def _plan_daily_operations(self, context: Dict[str, Any]) -> List[Task]:
        """Plan complete daily operations workflow"""
        tasks = []

        # 1. Morning: Plan production
        if context.get('plan_production', True):
            tasks.extend(self._plan_production_planning({
                'sales_data': context.get('sales_data', []),
                'recipes': context.get('recipes', []),
                'forecast_days': 1,
                'generate_report': False
            }))

        # 2. Quality checks
        if context.get('products_to_check'):
            tasks.extend(self._plan_quality_check({
                'products': context['products_to_check']
            }))

        # 3. Handle customer inquiries
        if context.get('inquiries'):
            tasks.extend(self._plan_customer_service({
                'inquiries': context['inquiries']
            }))

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
            'bakery': self.bakery_name,
            'summary': {
                'total_tasks': len(tasks),
                'successful': len(successful_tasks),
                'failed': len(failed_tasks),
                'success_rate': f"{len(successful_tasks) / len(tasks) * 100:.1f}%" if tasks else "0%"
            },
            'results': {},
            'failures': [],
            'operational_metrics': self._calculate_operational_metrics(successful_tasks)
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

    def _calculate_operational_metrics(self, tasks: List[Task]) -> Dict[str, Any]:
        """Calculate operational metrics from task results"""
        metrics = {
            'recipes_managed': 0,
            'quality_checks_passed': 0,
            'customer_inquiries_handled': 0,
            'production_plans_created': 0,
            'forecasts_generated': 0
        }

        for task in tasks:
            if 'recipe' in task.task_type:
                metrics['recipes_managed'] += 1
            elif task.task_type == 'quality_control':
                metrics['quality_checks_passed'] += 1
            elif task.task_type == 'customer_support':
                metrics['customer_inquiries_handled'] += 1
            elif task.task_type == 'production_report':
                metrics['production_plans_created'] += 1
            elif task.task_type == 'sales_forecasting':
                metrics['forecasts_generated'] += 1

        return metrics
