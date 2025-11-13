"""
Chat Agent - LLM-powered conversational agent

This agent can be integrated with various LLM providers (OpenAI, Anthropic, etc.)
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import List, Dict, Any, Optional


class ChatAgent(BaseAgent):
    """
    A conversational agent that maintains chat history and context

    Features:
    - Multi-turn conversations
    - Context management
    - Message history
    - System prompts
    - Token counting (basic)

    Example:
        agent = ChatAgent({
            'system_prompt': 'You are a helpful assistant',
            'max_history': 10
        })
        agent.initialize()
        response = agent.execute('Hello, how are you?')
        print(response)
    """

    def _initialize(self) -> None:
        """Initialize chat agent"""
        self.state['messages'] = []
        self.state['system_prompt'] = self.config.get(
            'system_prompt',
            'You are a helpful AI assistant.'
        )
        self.state['max_history'] = self.config.get('max_history', 20)

        # Add system message
        if self.state['system_prompt']:
            self.state['messages'].append({
                'role': 'system',
                'content': self.state['system_prompt']
            })

    def execute(self, message: str, **kwargs) -> str:
        """
        Send a message and get a response

        Args:
            message: User message
            **kwargs: Additional parameters (provider-specific)

        Returns:
            Agent response
        """
        if not self._initialized:
            self.initialize()

        # Add user message to history
        self.add_message('user', message)

        # Generate response (this is a placeholder - integrate with actual LLM)
        response = self._generate_response(message, **kwargs)

        # Add assistant response to history
        self.add_message('assistant', response)

        # Trim history if needed
        self._trim_history()

        return response

    def _generate_response(self, message: str, **kwargs) -> str:
        """
        Generate response using LLM provider

        Override this method to integrate with actual LLM providers:
        - OpenAI API
        - Anthropic Claude
        - Local models (Ollama, etc.)
        - Any other provider
        """
        # This is a placeholder implementation
        # Replace with actual LLM call
        provider = self.config.get('provider', 'mock')

        if provider == 'mock':
            return f"Mock response to: {message}"

        # Add your LLM integration here
        # Example for OpenAI:
        # import openai
        # response = openai.ChatCompletion.create(
        #     model=self.config.get('model', 'gpt-4'),
        #     messages=self.state['messages']
        # )
        # return response.choices[0].message.content

        raise NotImplementedError(f"Provider '{provider}' not implemented")

    def add_message(self, role: str, content: str) -> None:
        """Add a message to chat history"""
        self.state['messages'].append({
            'role': role,
            'content': content
        })

    def _trim_history(self) -> None:
        """Trim message history to max_history length"""
        max_history = self.state['max_history']

        # Always keep system message (index 0)
        if len(self.state['messages']) > max_history + 1:
            system_msg = self.state['messages'][0]
            self.state['messages'] = (
                [system_msg] +
                self.state['messages'][-(max_history):]
            )

    def clear_history(self) -> None:
        """Clear chat history (except system message)"""
        system_msg = self.state['messages'][0] if self.state['messages'] else None
        self.state['messages'] = [system_msg] if system_msg else []
        self.logger.info("Chat history cleared")

    def get_history(self) -> List[Dict[str, str]]:
        """Get chat history"""
        return self.state['messages']

    def set_system_prompt(self, prompt: str) -> None:
        """Update system prompt"""
        self.state['system_prompt'] = prompt
        if self.state['messages'] and self.state['messages'][0]['role'] == 'system':
            self.state['messages'][0]['content'] = prompt
        else:
            self.state['messages'].insert(0, {
                'role': 'system',
                'content': prompt
            })
        self.logger.info("System prompt updated")


# Example usage
if __name__ == '__main__':
    # Create and use the agent
    agent = ChatAgent({
        'system_prompt': 'You are a helpful coding assistant.',
        'max_history': 10
    })

    with agent:
        print("Chat Agent Example")
        print("=" * 50)

        # Simulate a conversation
        messages = [
            "Hello! Can you help me with Python?",
            "What's the difference between a list and a tuple?",
            "Thanks for the help!"
        ]

        for msg in messages:
            print(f"\nUser: {msg}")
            response = agent.execute(msg)
            print(f"Agent: {response}")

        print("\n" + "=" * 50)
        print(f"Total messages in history: {len(agent.get_history())}")
