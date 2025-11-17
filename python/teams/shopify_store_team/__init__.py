"""
Shopify Store Team

A complete multi-agent team for managing Shopify e-commerce operations.
The team includes a leader agent that coordinates specialist agents for:
- Customer support
- Order processing
- Email marketing
- Social media content
- Sales forecasting
- Customer segmentation
"""

from .shopify_store_leader import ShopifyStoreLeader

__all__ = ['ShopifyStoreLeader']
