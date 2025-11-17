"""
Repository Management Team

A complete multi-agent team for managing software repositories.
The team includes a leader agent that coordinates specialist agents for:
- Code review
- Testing
- Documentation
- Security auditing
- Issue triage
"""

from .repository_leader import RepositoryLeader

__all__ = ['RepositoryLeader']
