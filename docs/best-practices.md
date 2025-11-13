# Best Practices for Using Agents

## General Guidelines

### 1. Always Use Context Managers

**Python:**
```python
# Good
with ChatAgent(config) as agent:
    result = agent.execute(input)

# Avoid
agent = ChatAgent(config)
agent.initialize()
result = agent.execute(input)
agent.cleanup()  # Easy to forget!
```

**JavaScript:**
```javascript
// Good
await agent.use(async (agent) => {
    const result = await agent.execute(input);
});

// Avoid
await agent.initialize();
const result = await agent.execute(input);
await agent.cleanup();  // Easy to forget!
```

### 2. Handle Errors Gracefully

```python
try:
    result = agent.execute(input)
except Exception as e:
    logger.error(f"Agent failed: {e}")
    # Handle error appropriately
```

### 3. Configure Through Environment Variables

```python
import os

agent = ChatAgent({
    'api_key': os.getenv('OPENAI_API_KEY'),
    'model': os.getenv('MODEL', 'gpt-4'),
    'log_level': os.getenv('LOG_LEVEL', 'INFO')
})
```

### 4. Log Important Events

```python
agent.logger.info("Processing started")
agent.logger.warning("Rate limit approaching")
agent.logger.error("Failed to process")
```

## Configuration Best Practices

### Use Configuration Files

**config.json:**
```json
{
  "chat_agent": {
    "system_prompt": "You are helpful",
    "max_history": 20
  },
  "api_agent": {
    "base_url": "https://api.example.com",
    "retry_count": 3
  }
}
```

**Python:**
```python
import json

with open('config.json') as f:
    config = json.load(f)

chat = ChatAgent(config['chat_agent'])
api = ApiAgent(config['api_agent'])
```

### Environment-Specific Config

```python
import os

env = os.getenv('ENVIRONMENT', 'development')
config_file = f'config.{env}.json'

with open(config_file) as f:
    config = json.load(f)
```

## Performance Best Practices

### 1. Reuse Agent Instances

```python
# Good - reuse the same agent
agent = ChatAgent(config)
agent.initialize()

for message in messages:
    response = agent.execute(message)
    process(response)

agent.cleanup()

# Avoid - creating new agents repeatedly
for message in messages:
    agent = ChatAgent(config)
    agent.initialize()
    response = agent.execute(message)
    agent.cleanup()
```

### 2. Use Batch Processing When Possible

```python
# Good
processor = DataProcessorAgent()
all_results = processor.execute(all_data)

# Avoid if data can be processed together
for item in all_data:
    processor = DataProcessorAgent()
    result = processor.execute([item])
```

### 3. Limit State Size

```python
# Good - only keep recent history
agent = ChatAgent({'max_history': 20})

# Avoid - unlimited history
agent = ChatAgent({'max_history': None})  # Will grow forever
```

## Security Best Practices

### 1. Never Hardcode Credentials

```python
# Bad
agent = ApiAgent({
    'api_key': 'sk-1234567890abcdef'
})

# Good
import os
agent = ApiAgent({
    'api_key': os.getenv('API_KEY')
})
```

### 2. Validate Inputs

```python
def execute(self, data):
    # Validate before processing
    if not isinstance(data, list):
        raise ValueError("Data must be a list")

    if len(data) > MAX_SIZE:
        raise ValueError(f"Data too large (max {MAX_SIZE})")

    # Process validated data
    return self._process(data)
```

### 3. Sanitize Outputs

```python
# When dealing with user input
def execute(self, user_input):
    # Sanitize input
    safe_input = sanitize(user_input)

    # Process
    result = self._process(safe_input)

    # Don't expose internal errors to users
    return result
```

### 4. Use Secrets Management

```python
# Use proper secrets management
from secret_manager import get_secret

agent = ChatAgent({
    'api_key': get_secret('OPENAI_API_KEY')
})
```

## Testing Best Practices

### 1. Mock External Dependencies

```python
import unittest
from unittest.mock import patch, Mock

class TestChatAgent(unittest.TestCase):
    @patch('chat_agent.openai')
    def test_execute(self, mock_openai):
        mock_openai.chat.completions.create.return_value = Mock(
            choices=[Mock(message=Mock(content='response'))]
        )

        agent = ChatAgent({'provider': 'openai'})
        result = agent.execute('test')

        self.assertEqual(result, 'response')
```

### 2. Test Error Conditions

```python
def test_invalid_input(self):
    agent = DataProcessorAgent()

    with self.assertRaises(ValueError):
        agent.execute(None)

    with self.assertRaises(ValueError):
        agent.execute("not a list")
```

### 3. Test State Management

```python
def test_state_persistence(self):
    agent = ChatAgent({'max_history': 10})
    agent.execute('Hello')

    # Save state
    agent.save_state('test_state.json')

    # Load in new agent
    new_agent = ChatAgent()
    new_agent.load_state('test_state.json')

    self.assertEqual(len(new_agent.get_history()), 2)
```

## Integration Best Practices

### 1. Use Dependency Injection

```python
class MyApp:
    def __init__(self, chat_agent=None, api_agent=None):
        self.chat = chat_agent or ChatAgent()
        self.api = api_agent or ApiAgent()

    def process(self, input):
        data = self.api.execute('GET', '/data')
        return self.chat.execute(f"Analyze: {data}")
```

### 2. Graceful Degradation

```python
def get_response(message):
    try:
        # Try AI agent first
        return ai_agent.execute(message)
    except Exception as e:
        logger.warning(f"AI agent failed: {e}")
        # Fall back to simple logic
        return simple_response(message)
```

### 3. Circuit Breaker Pattern

```python
class CircuitBreaker:
    def __init__(self, max_failures=5):
        self.failures = 0
        self.max_failures = max_failures
        self.open = False

    def call(self, func, *args, **kwargs):
        if self.open:
            raise Exception("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            if self.failures >= self.max_failures:
                self.open = True
            raise

# Usage
breaker = CircuitBreaker()
breaker.call(agent.execute, input)
```

## Monitoring Best Practices

### 1. Add Metrics

```python
import time

class MonitoredAgent(BaseAgent):
    def execute(self, *args, **kwargs):
        start = time.time()
        try:
            result = super().execute(*args, **kwargs)
            duration = time.time() - start
            self.log('info', f'Execution took {duration:.2f}s')
            return result
        except Exception as e:
            self.log('error', f'Execution failed: {e}')
            raise
```

### 2. Track Usage

```python
agent.state['metrics'] = {
    'total_calls': 0,
    'successful_calls': 0,
    'failed_calls': 0,
    'total_tokens': 0
}

def execute(self, input):
    self.state['metrics']['total_calls'] += 1
    try:
        result = self._execute(input)
        self.state['metrics']['successful_calls'] += 1
        return result
    except Exception:
        self.state['metrics']['failed_calls'] += 1
        raise
```

## Deployment Best Practices

### 1. Use Environment Variables

```bash
# .env file
OPENAI_API_KEY=sk-...
ENVIRONMENT=production
LOG_LEVEL=INFO
MAX_RETRIES=3
```

### 2. Health Checks

```python
def health_check():
    """Check if agent is healthy"""
    try:
        agent.execute("test")
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### 3. Graceful Shutdown

```python
import signal

def shutdown_handler(signum, frame):
    logger.info("Shutting down...")
    agent.cleanup()
    exit(0)

signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)
```

## Common Pitfalls to Avoid

1. **Forgetting to cleanup** - Use context managers
2. **Hardcoding configuration** - Use config files/env vars
3. **Ignoring errors** - Handle exceptions properly
4. **Not validating inputs** - Always validate
5. **Creating too many instances** - Reuse agents
6. **Storing sensitive data in state** - Use secure storage
7. **Not testing edge cases** - Test failures, not just success
8. **Missing documentation** - Document your usage

## Summary

✅ Use context managers
✅ Handle errors gracefully
✅ Configure through environment
✅ Validate inputs
✅ Reuse agent instances
✅ Log important events
✅ Test thoroughly
✅ Monitor in production
✅ Document everything

❌ Don't hardcode credentials
❌ Don't ignore errors
❌ Don't skip cleanup
❌ Don't store secrets in state
❌ Don't create unnecessary instances
