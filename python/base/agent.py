"""
Base Agent Class
Provides common functionality for all Python agents
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging
import json
from datetime import datetime


class BaseAgent(ABC):
    """
    Base class for all agents

    Provides:
    - Logging
    - Configuration management
    - State management
    - Error handling
    - Lifecycle hooks
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None, name: Optional[str] = None):
        """
        Initialize the agent

        Args:
            config: Configuration dictionary
            name: Agent name (defaults to class name)
        """
        self.name = name or self.__class__.__name__
        self.config = config or {}
        self.state = {}
        self.logger = self._setup_logger()
        self._initialized = False

    def _setup_logger(self) -> logging.Logger:
        """Setup logger for this agent"""
        logger = logging.getLogger(self.name)
        logger.setLevel(self.config.get('log_level', logging.INFO))

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def initialize(self) -> None:
        """Initialize the agent (called before first use)"""
        if self._initialized:
            return

        self.logger.info(f"Initializing {self.name}")
        self._initialize()
        self._initialized = True
        self.logger.info(f"{self.name} initialized successfully")

    @abstractmethod
    def _initialize(self) -> None:
        """Override this to add custom initialization logic"""
        pass

    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        """
        Main execution method - must be implemented by subclasses

        This is the primary method that defines what the agent does
        """
        pass

    def cleanup(self) -> None:
        """Cleanup resources (called when agent is done)"""
        self.logger.info(f"Cleaning up {self.name}")
        self._cleanup()
        self._initialized = False

    def _cleanup(self) -> None:
        """Override this to add custom cleanup logic"""
        pass

    def get_state(self) -> Dict[str, Any]:
        """Get current agent state"""
        return {
            'name': self.name,
            'initialized': self._initialized,
            'state': self.state,
            'timestamp': datetime.now().isoformat()
        }

    def save_state(self, filepath: str) -> None:
        """Save agent state to file"""
        with open(filepath, 'w') as f:
            json.dump(self.get_state(), f, indent=2)
        self.logger.info(f"State saved to {filepath}")

    def load_state(self, filepath: str) -> None:
        """Load agent state from file"""
        with open(filepath, 'r') as f:
            saved_state = json.load(f)
            self.state = saved_state.get('state', {})
        self.logger.info(f"State loaded from {filepath}")

    def __enter__(self):
        """Context manager entry"""
        self.initialize()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.cleanup()
        return False
