"""
Bakery Operations Team

A complete multi-agent team for managing bakery operations.
The team includes a leader agent that coordinates specialist agents for:
- Recipe management
- Production planning
- Quality control
- Customer service
- Sales forecasting
- Order processing
"""

from .bakery_leader import BakeryLeader

__all__ = ['BakeryLeader']
