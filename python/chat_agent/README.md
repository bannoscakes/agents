# Chat Agent

A flexible conversational agent that can be integrated with various LLM providers.

## Features

- Multi-turn conversations with context
- Configurable system prompts
- Message history management
- Easy integration with LLM providers
- State persistence

## Quick Start

```python
from agents.python.chat_agent import ChatAgent

# Create agent
agent = ChatAgent({
    'system_prompt': 'You are a helpful assistant',
    'max_history': 10
})

# Initialize
agent.initialize()

# Chat
response = agent.execute('Hello!')
print(response)

# Cleanup
agent.cleanup()
```

## Using Context Manager

```python
with ChatAgent({'system_prompt': 'You are helpful'}) as agent:
    response = agent.execute('Hello!')
    print(response)
```

## Configuration Options

- `system_prompt` (str): System prompt for the agent
- `max_history` (int): Maximum number of messages to keep in history
- `provider` (str): LLM provider ('mock', 'openai', 'anthropic', etc.)
- `model` (str): Model name (provider-specific)
- `log_level` (int): Logging level

## Integrating with LLM Providers

### OpenAI

```python
agent = ChatAgent({
    'provider': 'openai',
    'model': 'gpt-4',
    'api_key': 'your-key'
})
```

Modify the `_generate_response` method to add OpenAI integration.

### Anthropic Claude

```python
agent = ChatAgent({
    'provider': 'anthropic',
    'model': 'claude-3-opus-20240229',
    'api_key': 'your-key'
})
```

### Local Models (Ollama)

```python
agent = ChatAgent({
    'provider': 'ollama',
    'model': 'llama2'
})
```

## Methods

- `execute(message: str) -> str`: Send message and get response
- `add_message(role: str, content: str)`: Add message to history
- `clear_history()`: Clear chat history
- `get_history() -> List[Dict]`: Get chat history
- `set_system_prompt(prompt: str)`: Update system prompt
- `save_state(filepath: str)`: Save agent state
- `load_state(filepath: str)`: Load agent state

## Example: Building a Code Review Bot

```python
code_reviewer = ChatAgent({
    'system_prompt': '''You are an expert code reviewer.
    Review code for:
    - Bugs and security issues
    - Performance problems
    - Code style and best practices
    Provide constructive feedback.''',
    'max_history': 20
})

with code_reviewer as agent:
    code = '''
    def calculate_sum(numbers):
        sum = 0
        for i in range(len(numbers)):
            sum += numbers[i]
        return sum
    '''

    review = agent.execute(f"Please review this code:\n{code}")
    print(review)
```
