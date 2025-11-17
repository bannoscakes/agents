"""
Team Factory - Build teams from configuration files

Supports loading team configurations from YAML/JSON files and
automatically instantiating the leader and all team members.
"""

import yaml
import json
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TeamFactory:
    """
    Factory for building teams from configuration files

    Supports:
    - YAML configuration files
    - JSON configuration files
    - Dynamic agent loading
    - Environment variable substitution
    """

    def __init__(self):
        self.agent_registry = {}
        self.leader_registry = {}
        self._register_built_in_teams()

    def _register_built_in_teams(self):
        """Register built-in team leaders and agents"""
        try:
            # Register team leaders
            from teams.shopify_store_team import ShopifyStoreLeader
            from teams.repository_team import RepositoryLeader
            from teams.bakery_team import BakeryLeader

            self.leader_registry['shopify_store'] = ShopifyStoreLeader
            self.leader_registry['repository'] = RepositoryLeader
            self.leader_registry['bakery'] = BakeryLeader

            # Register agents
            from shopify_chatbot_agent.shopify_chatbot_agent import ShopifyChatbotAgent
            from email_automation_agent.email_automation_agent import EmailAutomationAgent
            from social_media_generator.social_media_generator import SocialMediaGeneratorAgent
            from sales_forecasting_agent.sales_forecasting_agent import SalesForecastingAgent
            from customer_segmentation_agent.customer_segmentation_agent import CustomerSegmentationAgent
            from code_review_agent.code_review_agent import CodeReviewAgent
            from faq_generator_agent.faq_generator_agent import FAQGeneratorAgent
            from recipe_management_agent.recipe_management_agent import RecipeManagementAgent

            self.agent_registry['shopify_chatbot'] = ShopifyChatbotAgent
            self.agent_registry['email_automation'] = EmailAutomationAgent
            self.agent_registry['social_media_generator'] = SocialMediaGeneratorAgent
            self.agent_registry['sales_forecasting'] = SalesForecastingAgent
            self.agent_registry['customer_segmentation'] = CustomerSegmentationAgent
            self.agent_registry['code_review'] = CodeReviewAgent
            self.agent_registry['faq_generator'] = FAQGeneratorAgent
            self.agent_registry['recipe_management'] = RecipeManagementAgent

            logger.info("Built-in teams and agents registered")

        except Exception as e:
            logger.warning(f"Could not register all built-in teams: {e}")

    def register_agent(self, agent_type: str, agent_class):
        """
        Register a custom agent type

        Args:
            agent_type: Identifier for the agent type
            agent_class: Agent class
        """
        self.agent_registry[agent_type] = agent_class
        logger.info(f"Registered agent type: {agent_type}")

    def register_leader(self, leader_type: str, leader_class):
        """
        Register a custom leader type

        Args:
            leader_type: Identifier for the leader type
            leader_class: Leader class
        """
        self.leader_registry[leader_type] = leader_class
        logger.info(f"Registered leader type: {leader_type}")

    def load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load team configuration from file

        Args:
            config_path: Path to YAML or JSON config file

        Returns:
            Configuration dictionary
        """
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(config_path, 'r') as f:
            if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                config = yaml.safe_load(f)
            elif config_path.endswith('.json'):
                config = json.load(f)
            else:
                raise ValueError("Config file must be .yaml, .yml, or .json")

        # Substitute environment variables
        config = self._substitute_env_vars(config)

        return config

    def _substitute_env_vars(self, obj: Any) -> Any:
        """
        Recursively substitute environment variables in config

        Format: ${ENV_VAR_NAME} or ${ENV_VAR_NAME:default_value}
        """
        if isinstance(obj, dict):
            return {k: self._substitute_env_vars(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._substitute_env_vars(item) for item in obj]
        elif isinstance(obj, str):
            # Simple env var substitution
            if obj.startswith('${') and obj.endswith('}'):
                var_spec = obj[2:-1]
                if ':' in var_spec:
                    var_name, default = var_spec.split(':', 1)
                    return os.getenv(var_name, default)
                else:
                    return os.getenv(var_spec, '')
            return obj
        else:
            return obj

    def build_team(self, config_path: str) -> Any:
        """
        Build a team from configuration file

        Args:
            config_path: Path to team configuration file

        Returns:
            Configured leader agent with team members registered
        """
        config = self.load_config(config_path)

        team_type = config.get('team_type')
        if not team_type:
            raise ValueError("Config must specify 'team_type'")

        if team_type not in self.leader_registry:
            raise ValueError(f"Unknown team type: {team_type}")

        # Create leader
        leader_class = self.leader_registry[team_type]
        leader_config = config.get('leader_config', {})
        leader = leader_class(config=leader_config)

        logger.info(f"Created {team_type} leader: {leader.team_name}")

        # Register team members
        members = config.get('members', [])
        for member_config in members:
            agent_type = member_config.get('type')
            agent_name = member_config.get('name')
            capabilities = member_config.get('capabilities', [])
            agent_config = member_config.get('config', {})

            if agent_type not in self.agent_registry:
                logger.warning(f"Unknown agent type: {agent_type}, skipping")
                continue

            # Instantiate agent
            agent_class = self.agent_registry[agent_type]
            agent_instance = agent_class(config=agent_config)

            # Register with leader
            leader.register_agent(
                agent_name=agent_name,
                agent_instance=agent_instance,
                capabilities=capabilities
            )

            logger.info(f"Added {agent_name} to team")

        logger.info(f"Team built successfully: {len(members)} members")

        return leader

    def build_team_from_dict(self, config: Dict[str, Any]) -> Any:
        """
        Build a team from configuration dictionary

        Args:
            config: Team configuration dictionary

        Returns:
            Configured leader agent with team members registered
        """
        # Substitute environment variables
        config = self._substitute_env_vars(config)

        team_type = config.get('team_type')
        if not team_type:
            raise ValueError("Config must specify 'team_type'")

        if team_type not in self.leader_registry:
            raise ValueError(f"Unknown team type: {team_type}")

        # Create leader
        leader_class = self.leader_registry[team_type]
        leader_config = config.get('leader_config', {})
        leader = leader_class(config=leader_config)

        # Register team members
        members = config.get('members', [])
        for member_config in members:
            agent_type = member_config.get('type')
            agent_name = member_config.get('name')
            capabilities = member_config.get('capabilities', [])
            agent_config = member_config.get('config', {})

            if agent_type not in self.agent_registry:
                logger.warning(f"Unknown agent type: {agent_type}, skipping")
                continue

            # Instantiate agent
            agent_class = self.agent_registry[agent_type]
            agent_instance = agent_class(config=agent_config)

            # Register with leader
            leader.register_agent(
                agent_name=agent_name,
                agent_instance=agent_instance,
                capabilities=capabilities
            )

        return leader


# Convenience function
def create_team(config_path: str) -> Any:
    """
    Create a team from configuration file

    Args:
        config_path: Path to team configuration file

    Returns:
        Configured team leader
    """
    factory = TeamFactory()
    return factory.build_team(config_path)
