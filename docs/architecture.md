# Agent Architecture

## Overview

This repository provides a collection of reusable agents built on a common architecture pattern. Each agent follows the same base structure while providing specialized functionality.

## Core Concepts

### Base Agent Pattern

All agents inherit from a base class that provides:

1. **Initialization** - Setup resources and configuration
2. **Execution** - Main logic for the agent's task
3. **State Management** - Track and persist agent state
4. **Cleanup** - Release resources properly
5. **Logging** - Consistent logging across agents

### Agent Lifecycle

```
Create → Initialize → Execute → Cleanup
  ↓          ↓          ↓          ↓
Config   Resources   Logic    Release
```

## Design Principles

### 1. Single Responsibility

Each agent has one clear purpose:
- **ChatAgent**: Handle conversations
- **DataProcessorAgent**: Transform data
- **TaskSchedulerAgent**: Schedule tasks
- **ApiAgent**: Make HTTP requests

### 2. Composability

Agents can be combined to create more complex workflows:

```python
# Python example
data = fetch_agent.execute('/api/data')
processed = processor_agent.execute(data)
analysis = chat_agent.execute(f"Analyze: {processed}")
```

```javascript
// JavaScript example
const data = await fetchAgent.execute('/api/data');
const processed = await processorAgent.execute(data);
const analysis = await chatAgent.execute(`Analyze: ${processed}`);
```

### 3. Configuration over Code

Agents are configured through dictionaries/objects:

```python
agent = ChatAgent({
    'system_prompt': 'You are helpful',
    'max_history': 20,
    'provider': 'openai'
})
```

### 4. State Persistence

All agents can save and restore their state:

```python
agent.save_state('agent_state.json')
# Later...
agent.load_state('agent_state.json')
```

## Agent Structure

### Python Agents

```
agent_name/
├── __init__.py          # Package exports
├── agent_name.py        # Main agent class
├── README.md            # Documentation
└── requirements.txt     # Dependencies (if any)
```

### JavaScript Agents

```
agent-name/
├── index.js            # Module exports
├── AgentName.js        # Main agent class
├── README.md           # Documentation
└── package.json        # Dependencies (if any)
```

## Integration Patterns

### Pattern 1: Direct Import

Copy agent code into your project:

```
your_project/
├── agents/
│   └── chat_agent.py
└── main.py
```

### Pattern 2: Git Submodule

Add this repo as a submodule:

```bash
git submodule add <repo-url> lib/agents
```

### Pattern 3: Package Installation

Install as a package (when published):

```bash
pip install reusable-agents  # Python
npm install reusable-agents  # JavaScript
```

### Pattern 4: Docker Service

Run agents as microservices:

```bash
docker run -p 8080:8080 agent-image
```

## Extending Agents

### Creating a New Agent

1. Inherit from BaseAgent
2. Implement `_initialize()`
3. Implement `execute()`
4. Optionally implement `_cleanup()`

#### Python Example

```python
from base.agent import BaseAgent

class MyAgent(BaseAgent):
    def _initialize(self):
        self.state['data'] = []

    def execute(self, input_data):
        # Your logic here
        return result

    def _cleanup(self):
        # Optional cleanup
        pass
```

#### JavaScript Example

```javascript
const BaseAgent = require('./base/Agent');

class MyAgent extends BaseAgent {
  async _initialize() {
    this.state.data = [];
  }

  async execute(inputData) {
    // Your logic here
    return result;
  }

  async _cleanup() {
    // Optional cleanup
  }
}
```

## Best Practices

1. **Always use context managers** (Python `with` / JavaScript `use()`) when possible
2. **Handle errors gracefully** - Don't let one failure crash everything
3. **Log important events** - Use the built-in logger
4. **Keep state minimal** - Only store what you need
5. **Document configuration options** - Make it easy for others
6. **Write examples** - Show how to use your agent
7. **Test thoroughly** - Agents should be reliable

## Performance Considerations

- **Lazy Initialization**: Agents only initialize when first used
- **Resource Cleanup**: Always cleanup to prevent leaks
- **State Management**: Keep state size reasonable
- **Async Operations**: Use async where appropriate (JavaScript)

## Security Considerations

- **Input Validation**: Always validate inputs
- **API Keys**: Never hardcode keys, use environment variables
- **State Files**: Don't store sensitive data in state
- **Error Messages**: Don't expose internal details

## Future Enhancements

Potential additions to the architecture:

- Middleware support for agents
- Event-based communication between agents
- Agent orchestration framework
- Built-in monitoring and metrics
- Agent marketplace/registry
