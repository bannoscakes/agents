# CLAUDE.md - AI Assistant Guide

> **Purpose**: This guide helps AI assistants (like Claude) understand the repository structure, conventions, and workflows to effectively contribute to this codebase.

**Last Updated**: 2025-11-17
**Repository**: Reusable Agents Library
**Languages**: Python, JavaScript, TypeScript

---

## Table of Contents

1. [Repository Overview](#repository-overview)
2. [Codebase Structure](#codebase-structure)
3. [Development Workflows](#development-workflows)
4. [Agent Architecture](#agent-architecture)
5. [Key Conventions](#key-conventions)
6. [Multi-Agent Teams Framework](#multi-agent-teams-framework)
7. [Common AI Assistant Tasks](#common-ai-assistant-tasks)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Documentation Standards](#documentation-standards)
10. [Quick Reference](#quick-reference)

---

## Repository Overview

### What This Repository Is

A collection of **reusable, LLM-powered agents** in multiple languages (Python, JavaScript, TypeScript) that can be integrated into any project. The repository provides:

- **40+ production-ready agents** across various domains
- **Multi-agent teams framework** with leader-worker architecture
- **Consistent base architecture** across all languages
- **Multiple integration patterns** (submodule, direct copy, Docker, package)
- **Comprehensive documentation** for each agent

### Core Philosophy

1. **Single Responsibility**: Each agent does one thing well
2. **Composability**: Agents can be combined for complex workflows
3. **Configuration over Code**: Behavior controlled via config
4. **Language Agnostic**: Same patterns across Python/JS/TS
5. **Reusability First**: Easy to drop into any project

### Agent Categories

- **Core Agents**: Chat, Data Processing, Task Scheduling
- **E-commerce**: Shopify chatbots, customer segmentation, sales forecasting
- **Business Automation**: Email automation, social media generation, FAQ generation
- **Voice AI**: Transcription (STT), synthesis (TTS), voice chat
- **Bakery-Specific**: Recipe management, production reporting, quality control
- **Development Tools**: Code review, webhook processing
- **Multi-Agent Teams**: Coordinated agent teams with leader architecture

---

## Codebase Structure

### Directory Layout

```
agents/
├── python/              # Python agents
│   ├── base/            # BaseAgent class (core infrastructure)
│   ├── teams/           # Multi-agent teams framework
│   │   ├── base_leader_agent.py
│   │   ├── base_team_member_agent.py
│   │   ├── team_factory.py
│   │   ├── configs/     # YAML team configurations
│   │   ├── shopify_store_team/
│   │   ├── repository_team/
│   │   └── bakery_team/
│   ├── chat_agent/
│   ├── shopify_chatbot_agent/
│   ├── voice_chat_agent/
│   └── [20+ other agents]/
├── javascript/          # JavaScript/Node.js agents
│   ├── base/            # BaseAgent class
│   ├── chat-agent/
│   ├── api-agent/
│   └── [8+ other agents]/
├── typescript/          # TypeScript/Supabase agents
│   ├── shopify-chatbot-agent/
│   ├── cake-quality-control/
│   ├── webhook-order-processor/
│   └── [5+ other agents]/
├── docker/              # Dockerized agents
│   └── python-agent/
├── examples/            # Integration examples
│   ├── python-integration/
│   ├── javascript-integration/
│   └── docker-deployment/
├── docs/                # Documentation
│   ├── architecture.md
│   └── best-practices.md
├── README.md            # Main repository documentation
├── CONTRIBUTING.md      # Contribution guidelines
└── CLAUDE.md            # This file
```

### Language-Specific Patterns

#### Python Agents

```
python/agent_name/
├── __init__.py              # Exports: from .agent_name import AgentName
├── agent_name.py            # Main class inheriting BaseAgent
├── README.md                # Documentation
├── requirements.txt         # Optional: agent-specific dependencies
└── example_usage.py         # Optional: standalone example
```

#### JavaScript Agents

```
javascript/agent-name/
├── index.js                 # Exports: module.exports = { AgentName }
├── AgentName.js             # Main class extending BaseAgent
├── README.md                # Documentation
└── package.json             # Optional: agent-specific dependencies
```

#### TypeScript Agents

```
typescript/agent-name/
├── index.ts                 # Main Supabase Edge Function
├── README.md                # Documentation
├── package.json             # Dependencies
└── supabase-examples/       # Optional: deployment examples
```

---

## Development Workflows

### Adding a New Python Agent

1. **Create directory structure**:
   ```bash
   mkdir python/my_new_agent
   cd python/my_new_agent
   ```

2. **Create `my_new_agent.py`**:
   ```python
   """
   My New Agent - Brief description

   Features:
   - Feature 1
   - Feature 2
   """

   from base.agent import BaseAgent
   from typing import Any, Dict, Optional

   class MyNewAgent(BaseAgent):
       """
       Detailed description

       Example:
           agent = MyNewAgent({
               'option1': 'value1',
               'option2': 42
           })
           result = agent.execute(input_data)
       """

       def _initialize(self) -> None:
           """Initialize resources and validate config"""
           self.option1 = self.config.get('option1', 'default')
           self.option2 = self.config.get('option2', 0)
           self.logger.info(f"Initialized with option1={self.option1}")

       def execute(self, input_data: Any) -> Dict[str, Any]:
           """
           Main execution method

           Args:
               input_data: Description of input

           Returns:
               Dictionary containing results
           """
           # Implementation here
           result = {
               'status': 'success',
               'data': processed_data
           }
           return result

       def _cleanup(self) -> None:
           """Optional: cleanup resources"""
           pass

   # Example usage (for testing)
   if __name__ == "__main__":
       agent = MyNewAgent({'option1': 'test'})
       agent.initialize()
       result = agent.execute("test input")
       print(result)
       agent.cleanup()
   ```

3. **Create `__init__.py`**:
   ```python
   from .my_new_agent import MyNewAgent
   __all__ = ['MyNewAgent']
   ```

4. **Create `README.md`** (see [Documentation Standards](#documentation-standards))

5. **Add to main README.md** under appropriate category

### Adding a New JavaScript Agent

Similar pattern to Python, but using JavaScript/ES6+ syntax:

```javascript
const BaseAgent = require('../base/Agent');

class MyNewAgent extends BaseAgent {
    async _initialize() {
        this.option1 = this.config.option1 || 'default';
        this.logger.info(`Initialized with option1=${this.option1}`);
    }

    async execute(inputData) {
        // Implementation
        return {
            status: 'success',
            data: processedData
        };
    }

    async _cleanup() {
        // Optional cleanup
    }
}

module.exports = MyNewAgent;
```

### Modifying Existing Agents

**IMPORTANT**: When modifying agents, follow these rules:

1. **Read the agent's README first** to understand its purpose and API
2. **Maintain backward compatibility** unless explicitly breaking changes are needed
3. **Update documentation** when changing behavior or adding features
4. **Add deprecation warnings** before removing features
5. **Test with example usage** to ensure nothing breaks
6. **Update version comments** if the agent has versioning

### Working with Multi-Agent Teams

The teams framework (`python/teams/`) enables hierarchical agent coordination:

**Key Components**:
- `BaseLeaderAgent`: Coordinates team members, plans tasks, delegates work
- `BaseTeamMemberAgent`: Executes delegated tasks
- `TeamFactory`: Builds teams from YAML configs
- Built-in teams: Shopify, Repository, Bakery

**Adding a new team**:

1. Create leader class extending `BaseLeaderAgent`
2. Implement `plan_tasks(goal, context)` to break goals into tasks
3. Implement `aggregate_results(tasks)` to combine results
4. Create YAML config in `teams/configs/`
5. Register with `TeamFactory`

See `python/teams/README.md` for detailed team framework documentation.

---

## Agent Architecture

### Base Agent Pattern (All Languages)

Every agent follows this lifecycle:

```
┌─────────────┐
│   Create    │  new Agent(config)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Initialize  │  _initialize() - Setup resources
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Execute   │  execute(input) - Main logic (can be called multiple times)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Cleanup   │  _cleanup() - Release resources
└─────────────┘
```

### BaseAgent Capabilities (Python)

Located in `python/base/agent.py`:

**Properties**:
- `name`: Agent name (defaults to class name)
- `config`: Configuration dictionary
- `state`: Persistent state dictionary
- `logger`: Built-in logger
- `_initialized`: Initialization flag

**Methods**:
- `initialize()`: Public initialization (calls `_initialize()`)
- `_initialize()`: **Abstract** - Override in subclasses
- `execute(*args, **kwargs)`: **Abstract** - Main execution method
- `cleanup()`: Public cleanup (calls `_cleanup()`)
- `_cleanup()`: Optional cleanup override
- `get_state()`: Get current state snapshot
- `save_state(filepath)`: Persist state to JSON
- `load_state(filepath)`: Restore state from JSON
- `__enter__` / `__exit__`: Context manager support

**Context Manager Usage**:
```python
with MyAgent(config) as agent:
    result = agent.execute(input)
# Automatic cleanup on exit
```

### Configuration Pattern

All agents accept configuration dictionaries:

```python
agent = ChatAgent({
    'system_prompt': 'You are helpful',
    'max_history': 20,
    'provider': 'anthropic',
    'model': 'claude-3-5-sonnet-20241022',
    'log_level': logging.DEBUG,
    'api_key': os.getenv('ANTHROPIC_API_KEY')  # NEVER hardcode!
})
```

**Configuration Best Practices**:
- Use environment variables for secrets
- Provide sensible defaults in `_initialize()`
- Validate required config in `_initialize()`
- Document all options in README
- Support YAML/JSON config files for complex setups

---

## Key Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Python module | `snake_case` | `chat_agent/` |
| Python class | `PascalCase` | `ChatAgent` |
| Python file | `snake_case.py` | `chat_agent.py` |
| JavaScript module | `kebab-case` | `chat-agent/` |
| JavaScript class | `PascalCase` | `ChatAgent` |
| JavaScript file | `PascalCase.js` | `ChatAgent.js` |
| Config options | `snake_case` (Python), `camelCase` (JS) | `max_history`, `maxHistory` |
| Methods | `snake_case` (Python), `camelCase` (JS) | `execute()`, `_initialize()` |

### File Organization Standards

**Every agent directory MUST have**:
- Main implementation file (`agent_name.py` or `AgentName.js`)
- `__init__.py` (Python) or `index.js` (JavaScript) for exports
- `README.md` with comprehensive documentation

**Agents SHOULD have**:
- Example usage in `if __name__ == '__main__'` block (Python)
- `requirements.txt` or `package.json` if they have dependencies
- Inline documentation (docstrings/JSDoc)

**Agents MAY have**:
- `example_usage.py` for standalone examples
- `tests/` directory for unit tests
- Configuration examples
- Additional documentation files

### Code Style

**Python**:
- Follow PEP 8
- Use type hints for method signatures
- Docstrings for all public methods (Google or NumPy style)
- Maximum line length: 100 characters (flexible)
- Use `"""triple quotes"""` for docstrings

**JavaScript**:
- ES6+ features (async/await, classes, arrow functions)
- JSDoc comments for public methods
- Use `const` by default, `let` when needed
- Consistent 2-space or 4-space indentation

**TypeScript**:
- Strict type checking
- Export types and interfaces
- Use Deno/Supabase Edge Function conventions

### Import Patterns

**Python**:
```python
# Standard library
import os
import json
from typing import Dict, Any, Optional

# Third-party
import anthropic

# Local
from base.agent import BaseAgent
```

**JavaScript**:
```javascript
// Node built-ins
const fs = require('fs');
const path = require('path');

// Third-party
const Anthropic = require('@anthropic-ai/sdk');

// Local
const BaseAgent = require('../base/Agent');
```

### Error Handling

**Always handle errors gracefully**:

```python
def execute(self, input_data):
    try:
        # Validate input
        if not input_data:
            raise ValueError("Input data is required")

        # Process
        result = self._process(input_data)
        return result

    except ValueError as e:
        self.logger.error(f"Validation error: {e}")
        raise
    except Exception as e:
        self.logger.error(f"Unexpected error: {e}")
        return {
            'status': 'error',
            'error': str(e)
        }
```

### Logging Standards

Use the built-in logger:

```python
self.logger.debug("Detailed debugging info")
self.logger.info("Normal operation messages")
self.logger.warning("Warning messages")
self.logger.error("Error messages")
```

**Log levels**:
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages (default)
- `WARNING`: Warning messages (e.g., rate limits approaching)
- `ERROR`: Error messages

---

## Multi-Agent Teams Framework

### Overview

Located in `python/teams/`, this framework enables hierarchical agent coordination:

- **Leader agents** plan tasks, delegate work, aggregate results
- **Team members** execute delegated tasks
- **TeamFactory** builds teams from YAML configs
- **Task lifecycle** management (PENDING → DELEGATED → IN_PROGRESS → COMPLETED/FAILED)

### Built-in Teams

1. **Shopify Store Team** (`shopify_store_team/`)
   - Customer support, email marketing, social media, analytics
   - Goals: `marketing_campaign`, `daily_operations`, `weekly_analytics`

2. **Repository Team** (`repository_team/`)
   - Code review, documentation, security audits
   - Goals: `review_pr`, `pre_release`, `security_audit`, `onboard_contributor`

3. **Bakery Team** (`bakery_team/`)
   - Recipe management, production planning, quality control
   - Goals: `plan_production`, `custom_order`, `quality_check`, `daily_operations`

### Working with Teams

**Using configuration files** (recommended):

```python
from teams.team_factory import create_team

# Load team from YAML
leader = create_team('teams/configs/shopify_team.yaml')

# Execute a goal
result = leader.execute_goal(
    goal="marketing_campaign",
    context={
        'product': 'Artisan Bread',
        'platforms': ['instagram', 'facebook']
    }
)

print(result['summary'])  # Success rate, task breakdown
```

**Key methods**:
- `leader.plan_tasks(goal, context)`: Break goal into tasks
- `leader.delegate_task(task)`: Assign task to capable agent
- `leader.execute_goal(goal, context)`: Full workflow
- `leader.get_team_status()`: Team metrics and status

### Adding Agents to Teams

Register agents with capabilities:

```python
leader.register_agent(
    agent_name='CodeReviewer',
    agent_instance=code_review_agent,
    capabilities=['code_review', 'security', 'performance']
)
```

Leader delegates tasks to agents based on matching capabilities.

---

## Common AI Assistant Tasks

### Task 1: Adding a New Agent

**Steps**:
1. Determine agent category and language
2. Create directory structure
3. Implement class inheriting from BaseAgent
4. Implement `_initialize()` and `execute()` methods
5. Create `__init__.py`/`index.js` exports
6. Write comprehensive README.md
7. Add example usage in main file
8. Update main README.md
9. Test manually
10. Commit with descriptive message

**Example commit message**: `feat: Add SentimentAnalysisAgent for text sentiment analysis`

### Task 2: Updating Agent Documentation

**When to update**:
- Adding new features
- Changing behavior
- Fixing bugs that affect usage
- Adding configuration options

**What to update**:
- Agent's README.md
- Docstrings in code
- Main README.md if adding new capabilities
- CHANGELOG.md if one exists

### Task 3: Debugging an Agent

**Debugging checklist**:
1. Check the agent's README for expected behavior
2. Look at example usage in `if __name__ == '__main__'` block
3. Check logs (agents have built-in logging)
4. Verify configuration is correct
5. Check for missing environment variables (API keys)
6. Verify input format matches expected format
7. Look for error handling in `execute()` method
8. Check if `_initialize()` completed successfully

### Task 4: Creating a New Team

See `python/teams/README.md` for detailed instructions. Summary:

1. Create leader class extending `BaseLeaderAgent`
2. Implement `plan_tasks()` to decompose goals
3. Implement `aggregate_results()` to combine task results
4. Create YAML config in `teams/configs/`
5. Register with TeamFactory
6. Create example usage file
7. Update teams README.md

### Task 5: Reviewing Code

**What to check**:
- Does it inherit from BaseAgent?
- Are `_initialize()` and `execute()` implemented?
- Is there error handling?
- Are inputs validated?
- Is logging used appropriately?
- Is there a README.md?
- Are docstrings complete?
- Are API keys handled via environment variables?
- Is cleanup implemented if resources are held?

### Task 6: Adding Integration Examples

Location: `examples/` directory

**Structure**:
```
examples/my-integration/
├── README.md          # How to use this example
├── example.py         # Working code
├── config.json        # Sample configuration
└── .env.example       # Required environment variables
```

---

## Testing & Quality Assurance

### Manual Testing

**All agents must be manually tested before committing**:

1. Test the `if __name__ == '__main__'` example
2. Test with invalid inputs (should handle gracefully)
3. Test with missing configuration (should fail clearly)
4. Test cleanup (no resource leaks)
5. Test state persistence (save/load state)

### Example Testing Pattern

```python
if __name__ == "__main__":
    # Test 1: Basic usage
    agent = MyAgent({'option': 'value'})
    agent.initialize()
    result = agent.execute("test input")
    print("Test 1:", result)
    agent.cleanup()

    # Test 2: Context manager
    with MyAgent({'option': 'value'}) as agent:
        result = agent.execute("test input")
        print("Test 2:", result)

    # Test 3: State persistence
    agent = MyAgent()
    agent.initialize()
    agent.execute("input 1")
    agent.save_state('test_state.json')

    new_agent = MyAgent()
    new_agent.load_state('test_state.json')
    result = new_agent.execute("input 2")
    print("Test 3:", result)
    new_agent.cleanup()

    # Test 4: Error handling
    try:
        agent = MyAgent()
        agent.initialize()
        agent.execute(None)  # Should handle gracefully
    except Exception as e:
        print("Test 4: Error handled:", e)
```

### Unit Testing (Optional)

While formal unit tests aren't required, they're encouraged:

```python
# tests/test_my_agent.py
import unittest
from my_agent import MyAgent

class TestMyAgent(unittest.TestCase):
    def setUp(self):
        self.agent = MyAgent({'option': 'test'})
        self.agent.initialize()

    def tearDown(self):
        self.agent.cleanup()

    def test_execute_basic(self):
        result = self.agent.execute("test")
        self.assertEqual(result['status'], 'success')

    def test_execute_invalid_input(self):
        with self.assertRaises(ValueError):
            self.agent.execute(None)
```

### Quality Checklist

Before submitting a new agent:

- [ ] Inherits from BaseAgent
- [ ] Implements `_initialize()` and `execute()`
- [ ] Has comprehensive docstrings
- [ ] Has README.md with examples
- [ ] Handles errors gracefully
- [ ] Logs important events
- [ ] Uses environment variables for secrets
- [ ] Has example usage in main file
- [ ] Cleanup is implemented (if needed)
- [ ] State can be saved/loaded (if needed)
- [ ] Manually tested and working
- [ ] Added to main README.md

---

## Documentation Standards

### README.md Structure

**Every agent MUST have a README.md with this structure**:

```markdown
# Agent Name

Brief one-sentence description

## Features

- Feature 1
- Feature 2
- Feature 3

## Quick Start

```python
# Minimal working example
from agent_name import AgentName

agent = AgentName({'config_option': 'value'})
agent.initialize()
result = agent.execute(input)
print(result)
agent.cleanup()
```

## Configuration Options

- `option1` (type, default: value): Description
- `option2` (type, required): Description
- `api_key` (str, required): API key from environment variable

## Usage Examples

### Example 1: Basic Usage

[Complete working example]

### Example 2: Advanced Usage

[More complex example]

## Integration

How to integrate this agent into your project:

1. Copy files
2. Install dependencies
3. Configure
4. Use

## API Reference

### Constructor

`AgentName(config: Dict[str, Any])`

### Methods

#### execute(input: Any) -> Dict

Description of what it does

**Parameters**:
- `input`: Description

**Returns**:
- Dictionary with results

## Cost Estimation

Approximate cost per use (if applicable)

## Dependencies

- `dependency1>=1.0.0`
- `dependency2>=2.0.0`

## License

MIT
```

### Docstring Standards (Python)

Use Google-style docstrings:

```python
def execute(self, input_data: Dict[str, Any], options: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Execute the agent's main task

    This method processes input data according to the configured options
    and returns structured results.

    Args:
        input_data: Dictionary containing the data to process. Must include
            'content' key with string value.
        options: Optional dictionary of execution-specific options. Supports
            'mode' (str) and 'verbose' (bool).

    Returns:
        Dictionary with structure:
            {
                'status': str,  # 'success' or 'error'
                'result': Any,  # Processed result
                'metadata': Dict  # Additional info
            }

    Raises:
        ValueError: If input_data is missing required keys
        RuntimeError: If processing fails

    Example:
        >>> agent = MyAgent({'option': 'value'})
        >>> agent.initialize()
        >>> result = agent.execute({'content': 'test'})
        >>> print(result['status'])
        'success'
    """
```

### JSDoc Standards (JavaScript)

```javascript
/**
 * Execute the agent's main task
 *
 * @param {Object} inputData - Data to process
 * @param {string} inputData.content - Content to process
 * @param {Object} [options] - Optional execution options
 * @param {string} [options.mode] - Processing mode
 * @param {boolean} [options.verbose] - Enable verbose output
 * @returns {Promise<Object>} Result object with status and data
 * @throws {Error} If input validation fails
 *
 * @example
 * const agent = new MyAgent({option: 'value'});
 * await agent.initialize();
 * const result = await agent.execute({content: 'test'});
 * console.log(result.status); // 'success'
 */
async execute(inputData, options = {}) {
    // Implementation
}
```

---

## Quick Reference

### Common File Locations

| What | Where |
|------|-------|
| Base Python agent | `python/base/agent.py` |
| Base JavaScript agent | `javascript/base/Agent.js` |
| Teams framework | `python/teams/` |
| Team configs | `python/teams/configs/*.yaml` |
| Documentation | `docs/` |
| Examples | `examples/` |
| Git ignore | `.gitignore` |

### Environment Variables

Common environment variables used across agents:

```bash
# LLM API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Shopify
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_STORE_NAME=...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...

# General
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Common Commands

```bash
# Add new Python agent
mkdir python/my_agent
touch python/my_agent/__init__.py
touch python/my_agent/my_agent.py
touch python/my_agent/README.md

# Test Python agent
cd python/my_agent
python my_agent.py

# Add new JS agent
mkdir javascript/my-agent
touch javascript/my-agent/index.js
touch javascript/my-agent/MyAgent.js
touch javascript/my-agent/README.md

# Test JS agent
cd javascript/my-agent
node MyAgent.js
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/add-sentiment-agent

# Make changes, test thoroughly

# Stage and commit
git add .
git commit -m "feat: Add SentimentAnalysisAgent for text analysis"

# Push and create PR
git push origin feature/add-sentiment-agent
```

### Commit Message Format

Follow conventional commits:

- `feat: Add new EmailAgent`
- `fix: Fix ChatAgent memory leak`
- `docs: Update architecture documentation`
- `refactor: Improve BaseAgent error handling`
- `test: Add tests for DataProcessor`
- `chore: Update dependencies`

---

## Tips for AI Assistants

### When Adding New Agents

1. **Always check if similar agent exists** - Extend rather than duplicate
2. **Follow the language conventions** - Python uses snake_case, JS uses camelCase
3. **Read the CONTRIBUTING.md** - It has detailed patterns and examples
4. **Check existing agents** - Use them as templates
5. **Test before committing** - Run the example code
6. **Document thoroughly** - Future developers will thank you

### When Debugging

1. **Check the logs** - Agents have built-in logging
2. **Verify environment variables** - Most issues are missing API keys
3. **Look at example usage** - Often in `if __name__ == '__main__'` block
4. **Check initialization** - Did `_initialize()` succeed?
5. **Validate inputs** - Is the input format correct?

### When Reviewing Code

1. **Check inheritance** - Must inherit from BaseAgent
2. **Check documentation** - README.md and docstrings
3. **Check error handling** - No bare `except:` clauses
4. **Check secrets** - No hardcoded API keys
5. **Check cleanup** - Resources properly released

### Common Mistakes to Avoid

- ❌ Hardcoding API keys in code
- ❌ Forgetting to implement `_initialize()` or `execute()`
- ❌ Not handling errors gracefully
- ❌ Missing README.md documentation
- ❌ Not following naming conventions
- ❌ Creating agents that do too many things
- ❌ Forgetting to export from `__init__.py` or `index.js`
- ❌ Not testing with example usage

### Best Practices Summary

- ✅ Use context managers (`with` statement)
- ✅ Handle all errors gracefully
- ✅ Log important events
- ✅ Validate inputs
- ✅ Document everything
- ✅ Use environment variables for secrets
- ✅ Keep agents focused (single responsibility)
- ✅ Test thoroughly before committing
- ✅ Follow existing patterns
- ✅ Write clear commit messages

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-17 | Initial CLAUDE.md creation |

---

**Questions or Improvements?**

If you find gaps in this documentation or have suggestions for improvement, please:
1. Open an issue describing what's unclear
2. Submit a PR with improvements to this file
3. Check existing documentation in `docs/` directory

This file is maintained to help AI assistants work effectively with this codebase. Keep it updated as the repository evolves.
