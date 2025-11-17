"""
Multi-Agent Teams Framework

Hierarchical team structure with leader agents that coordinate specialist agents.
"""

from .base_leader_agent import BaseLeaderAgent, Task, TaskStatus, TaskPriority
from .base_team_member_agent import BaseTeamMemberAgent

__all__ = [
    'BaseLeaderAgent',
    'BaseTeamMemberAgent',
    'Task',
    'TaskStatus',
    'TaskPriority'
]
