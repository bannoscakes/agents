"""
Base Leader Agent - Orchestrates and coordinates team agents

The leader agent:
- Receives high-level tasks/goals
- Breaks them down into subtasks
- Delegates to specialist agents
- Monitors progress and results
- Makes strategic decisions
- Aggregates final outputs
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Task execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    DELEGATED = "delegated"


class TaskPriority(Enum):
    """Task priority levels"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class Task:
    """Represents a task that can be delegated"""
    def __init__(
        self,
        task_id: str,
        description: str,
        task_type: str,
        priority: TaskPriority = TaskPriority.MEDIUM,
        assigned_to: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.task_id = task_id
        self.description = description
        self.task_type = task_type
        self.priority = priority
        self.assigned_to = assigned_to
        self.status = TaskStatus.PENDING
        self.created_at = datetime.now()
        self.completed_at: Optional[datetime] = None
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary"""
        return {
            'task_id': self.task_id,
            'description': self.description,
            'task_type': self.task_type,
            'priority': self.priority.name,
            'assigned_to': self.assigned_to,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'result': self.result,
            'error': self.error,
            'metadata': self.metadata
        }


class BaseLeaderAgent(ABC):
    """
    Base class for leader agents that coordinate teams

    The leader is responsible for:
    1. Understanding high-level goals
    2. Planning and task decomposition
    3. Delegating to specialist agents
    4. Monitoring progress
    5. Making strategic decisions
    6. Aggregating results
    """

    def __init__(self, team_name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the leader agent

        Args:
            team_name: Name of the team
            config: Configuration dictionary
        """
        self.team_name = team_name
        self.config = config or {}
        self.team_members: Dict[str, Any] = {}  # agent_name -> agent_instance
        self.tasks: Dict[str, Task] = {}  # task_id -> Task
        self.task_counter = 0
        self.initialized = False

        logger.info(f"Leader Agent initialized for team: {team_name}")

    def register_agent(self, agent_name: str, agent_instance: Any, capabilities: List[str]):
        """
        Register a team member agent

        Args:
            agent_name: Unique name for the agent
            agent_instance: The agent instance
            capabilities: List of task types this agent can handle
        """
        self.team_members[agent_name] = {
            'instance': agent_instance,
            'capabilities': capabilities,
            'tasks_assigned': 0,
            'tasks_completed': 0,
            'tasks_failed': 0
        }
        logger.info(f"Registered agent '{agent_name}' with capabilities: {capabilities}")

    def initialize(self):
        """Initialize the leader and all team members"""
        logger.info(f"Initializing {self.team_name} team...")

        # Initialize all team members
        for agent_name, agent_data in self.team_members.items():
            agent = agent_data['instance']
            if hasattr(agent, 'initialize'):
                try:
                    agent.initialize()
                    logger.info(f"✓ Initialized {agent_name}")
                except Exception as e:
                    logger.error(f"✗ Failed to initialize {agent_name}: {e}")

        self.initialized = True
        logger.info(f"{self.team_name} team ready!")

    @abstractmethod
    def plan_tasks(self, goal: str, context: Optional[Dict[str, Any]] = None) -> List[Task]:
        """
        Break down a high-level goal into tasks

        Args:
            goal: High-level goal/objective
            context: Additional context for planning

        Returns:
            List of tasks to be executed
        """
        pass

    def delegate_task(self, task: Task) -> bool:
        """
        Delegate a task to the most appropriate agent

        Args:
            task: Task to delegate

        Returns:
            True if successfully delegated, False otherwise
        """
        # Find agents capable of handling this task type
        capable_agents = [
            (name, data) for name, data in self.team_members.items()
            if task.task_type in data['capabilities']
        ]

        if not capable_agents:
            logger.warning(f"No agent capable of handling task type: {task.task_type}")
            task.status = TaskStatus.FAILED
            task.error = f"No agent available for task type: {task.task_type}"
            return False

        # Simple load balancing: choose agent with fewest assigned tasks
        chosen_agent_name, chosen_agent_data = min(
            capable_agents,
            key=lambda x: x[1]['tasks_assigned']
        )

        task.assigned_to = chosen_agent_name
        task.status = TaskStatus.DELEGATED
        chosen_agent_data['tasks_assigned'] += 1

        logger.info(f"Delegated task '{task.description}' to {chosen_agent_name}")
        return True

    def execute_task(self, task: Task) -> Any:
        """
        Execute a delegated task

        Args:
            task: Task to execute

        Returns:
            Task result
        """
        if not task.assigned_to:
            raise ValueError("Task not assigned to any agent")

        agent_data = self.team_members.get(task.assigned_to)
        if not agent_data:
            raise ValueError(f"Agent '{task.assigned_to}' not found")

        agent = agent_data['instance']
        task.status = TaskStatus.IN_PROGRESS

        try:
            logger.info(f"Executing task '{task.description}' with {task.assigned_to}")

            # Execute the task
            result = agent.execute(**task.metadata)

            task.result = result
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()
            agent_data['tasks_completed'] += 1

            logger.info(f"✓ Task completed: {task.description}")
            return result

        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.now()
            agent_data['tasks_failed'] += 1

            logger.error(f"✗ Task failed: {task.description} - {e}")
            raise

    @abstractmethod
    def aggregate_results(self, tasks: List[Task]) -> Dict[str, Any]:
        """
        Aggregate results from multiple tasks

        Args:
            tasks: List of completed tasks

        Returns:
            Aggregated result
        """
        pass

    def execute_goal(self, goal: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a high-level goal by planning, delegating, and coordinating

        Args:
            goal: High-level goal to achieve
            context: Additional context

        Returns:
            Final aggregated result
        """
        if not self.initialized:
            self.initialize()

        logger.info(f"\n{'='*60}")
        logger.info(f"GOAL: {goal}")
        logger.info(f"{'='*60}\n")

        # Step 1: Plan tasks
        logger.info("📋 Planning tasks...")
        tasks = self.plan_tasks(goal, context)
        logger.info(f"Created {len(tasks)} tasks\n")

        # Store tasks
        for task in tasks:
            self.tasks[task.task_id] = task

        # Step 2: Delegate tasks
        logger.info("🎯 Delegating tasks...")
        for task in tasks:
            self.delegate_task(task)
        logger.info("")

        # Step 3: Execute tasks
        logger.info("⚙️  Executing tasks...")
        results = []
        for task in tasks:
            try:
                result = self.execute_task(task)
                results.append(result)
            except Exception as e:
                logger.error(f"Task execution failed: {e}")
        logger.info("")

        # Step 4: Aggregate results
        logger.info("📊 Aggregating results...")
        final_result = self.aggregate_results(tasks)

        logger.info(f"\n{'='*60}")
        logger.info("✅ GOAL COMPLETED")
        logger.info(f"{'='*60}\n")

        return final_result

    def get_team_status(self) -> Dict[str, Any]:
        """Get current team status and metrics"""
        return {
            'team_name': self.team_name,
            'agents': {
                name: {
                    'capabilities': data['capabilities'],
                    'tasks_assigned': data['tasks_assigned'],
                    'tasks_completed': data['tasks_completed'],
                    'tasks_failed': data['tasks_failed'],
                    'success_rate': (
                        data['tasks_completed'] / data['tasks_assigned'] * 100
                        if data['tasks_assigned'] > 0 else 0
                    )
                }
                for name, data in self.team_members.items()
            },
            'tasks': {
                'total': len(self.tasks),
                'pending': sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING),
                'in_progress': sum(1 for t in self.tasks.values() if t.status == TaskStatus.IN_PROGRESS),
                'completed': sum(1 for t in self.tasks.values() if t.status == TaskStatus.COMPLETED),
                'failed': sum(1 for t in self.tasks.values() if t.status == TaskStatus.FAILED)
            }
        }

    def cleanup(self):
        """Cleanup all team members"""
        logger.info(f"Cleaning up {self.team_name} team...")
        for agent_name, agent_data in self.team_members.items():
            agent = agent_data['instance']
            if hasattr(agent, 'cleanup'):
                try:
                    agent.cleanup()
                except Exception as e:
                    logger.error(f"Error cleaning up {agent_name}: {e}")

    def __enter__(self):
        """Context manager entry"""
        self.initialize()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.cleanup()
