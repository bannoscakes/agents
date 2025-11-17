"""
Base Team Member Agent - Specialist agent that works under a leader

Team member agents:
- Have specific capabilities/specializations
- Execute tasks delegated by the leader
- Report results back to the leader
- Can request assistance from other team members via leader
"""

import sys
import os

# Add parent directory to path to import base agent
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from base.Agent import Agent
from typing import Dict, Any, Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseTeamMemberAgent(Agent):
    """
    Extended base agent for team members

    Adds team-specific functionality:
    - Capability registration
    - Status reporting
    - Task result formatting
    """

    def __init__(self, agent_name: str, capabilities: List[str], config: Optional[Dict[str, Any]] = None):
        """
        Initialize team member agent

        Args:
            agent_name: Unique name for this agent
            capabilities: List of task types this agent can handle
            config: Configuration dictionary
        """
        super().__init__()
        self.agent_name = agent_name
        self.capabilities = capabilities
        self.config = config or {}
        self.leader: Optional[Any] = None

        logger.info(f"Team member agent '{agent_name}' initialized with capabilities: {capabilities}")

    def set_leader(self, leader: Any):
        """
        Set the leader agent for this team member

        Args:
            leader: Leader agent instance
        """
        self.leader = leader
        logger.info(f"{self.agent_name} now reports to {leader.team_name}")

    def can_handle(self, task_type: str) -> bool:
        """
        Check if this agent can handle a specific task type

        Args:
            task_type: Type of task

        Returns:
            True if agent has this capability
        """
        return task_type in self.capabilities

    def report_to_leader(self, message: str, level: str = "info"):
        """
        Report status/message to the leader

        Args:
            message: Message to report
            level: Log level (info, warning, error)
        """
        log_msg = f"[{self.agent_name}] {message}"

        if level == "info":
            logger.info(log_msg)
        elif level == "warning":
            logger.warning(log_msg)
        elif level == "error":
            logger.error(log_msg)

    def request_assistance(self, task_type: str, task_description: str, context: Optional[Dict] = None) -> Any:
        """
        Request assistance from another team member via the leader

        Args:
            task_type: Type of task needing assistance
            task_description: Description of the task
            context: Additional context

        Returns:
            Result from the assisting agent
        """
        if not self.leader:
            raise ValueError("No leader set - cannot request assistance")

        self.report_to_leader(f"Requesting assistance for task: {task_description}", "info")

        # Create a subtask and execute via leader
        from base_leader_agent import Task, TaskPriority

        subtask = Task(
            task_id=f"{self.agent_name}_request_{task_type}",
            description=task_description,
            task_type=task_type,
            priority=TaskPriority.HIGH,
            metadata=context or {}
        )

        # Delegate and execute through leader
        self.leader.delegate_task(subtask)
        result = self.leader.execute_task(subtask)

        return result

    def format_success_result(self, data: Any, message: Optional[str] = None) -> Dict[str, Any]:
        """
        Format a successful task result

        Args:
            data: Result data
            message: Optional success message

        Returns:
            Formatted result dictionary
        """
        return {
            'success': True,
            'agent': self.agent_name,
            'data': data,
            'message': message or f"{self.agent_name} completed task successfully"
        }

    def format_error_result(self, error: Exception, message: Optional[str] = None) -> Dict[str, Any]:
        """
        Format an error result

        Args:
            error: Exception that occurred
            message: Optional error message

        Returns:
            Formatted error dictionary
        """
        return {
            'success': False,
            'agent': self.agent_name,
            'error': str(error),
            'message': message or f"{self.agent_name} encountered an error"
        }

    def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status

        Returns:
            Status dictionary
        """
        return {
            'agent_name': self.agent_name,
            'capabilities': self.capabilities,
            'has_leader': self.leader is not None,
            'state': self.state
        }
