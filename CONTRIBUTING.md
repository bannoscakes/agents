# Contributing to Reusable Agents

Thank you for your interest in contributing! This document provides guidelines for adding new agents or improving existing ones.

## How to Contribute

### 1. Fork and Clone

```bash
git fork <repo-url>
git clone <your-fork-url>
cd agents
```

### 2. Create a Branch

```bash
git checkout -b feature/my-new-agent
```

### 3. Make Your Changes

See guidelines below for adding new agents.

### 4. Test Your Changes

Ensure your agent works correctly with examples.

### 5. Submit a Pull Request

Push your changes and create a PR with a clear description.

## Adding a New Agent

### Python Agent

1. **Create agent directory:**
   ```bash
   mkdir python/my_agent
   ```

2. **Create agent class** (`python/my_agent/my_agent.py`):
   ```python
   from base.agent import BaseAgent

   class MyAgent(BaseAgent):
       def _initialize(self):
           # Setup code
           pass

       def execute(self, input):
           # Main logic
           return result

       def _cleanup(self):
           # Cleanup code
           pass
   ```

3. **Add `__init__.py`:**
   ```python
   from .my_agent import MyAgent
   __all__ = ['MyAgent']
   ```

4. **Create README.md** with:
   - Description
   - Features
   - Usage examples
   - Configuration options
   - API reference

5. **Add example usage** in the agent file's `if __name__ == '__main__'` block

### JavaScript Agent

1. **Create agent directory:**
   ```bash
   mkdir javascript/my-agent
   ```

2. **Create agent class** (`javascript/my-agent/MyAgent.js`):
   ```javascript
   const BaseAgent = require('../base/Agent');

   class MyAgent extends BaseAgent {
       async _initialize() {
           // Setup code
       }

       async execute(input) {
           // Main logic
           return result;
       }

       async _cleanup() {
           // Cleanup code
       }
   }

   module.exports = MyAgent;
   ```

3. **Add `index.js`:**
   ```javascript
   const MyAgent = require('./MyAgent');
   module.exports = { MyAgent };
   ```

4. **Create README.md** with documentation

5. **Add example usage** in the main file

## Agent Requirements

All agents must:

1. ✅ Inherit from BaseAgent
2. ✅ Implement `_initialize()` method
3. ✅ Implement `execute()` method
4. ✅ Include comprehensive docstrings/JSDoc
5. ✅ Have a README.md with examples
6. ✅ Include example usage in the main file
7. ✅ Handle errors gracefully
8. ✅ Support configuration via constructor
9. ✅ Use built-in logging
10. ✅ Follow naming conventions

## Code Style

### Python
- Follow PEP 8
- Use type hints where appropriate
- Add docstrings to all public methods
- Use meaningful variable names

### JavaScript
- Use ES6+ features
- Add JSDoc comments
- Use async/await for async operations
- Use meaningful variable names

## Documentation Requirements

Every agent must include:

### README.md Structure

```markdown
# Agent Name

Brief description

## Features

- Feature 1
- Feature 2

## Quick Start

[Basic usage example]

## Configuration Options

- `option1` (type): Description
- `option2` (type): Description

## Methods

### execute(input)

Description of main method

## Examples

[Multiple examples showing different use cases]

## Integration

[How to use in projects]
```

### Code Comments

- Document complex logic
- Explain non-obvious decisions
- Add TODOs for future improvements

## Testing

While formal tests aren't required yet, please:

1. Test your agent manually
2. Include example usage that demonstrates it works
3. Test error conditions
4. Verify cleanup works properly

## Examples

### Good Example

```python
"""
Email Agent - Send emails via SMTP

Features:
- HTML and plain text emails
- Attachments support
- Template rendering
- Retry logic
"""

from base.agent import BaseAgent
import smtplib
from email.mime.text import MIMEText

class EmailAgent(BaseAgent):
    """
    Agent for sending emails

    Example:
        agent = EmailAgent({
            'smtp_host': 'smtp.gmail.com',
            'smtp_port': 587,
            'username': 'user@example.com',
            'password': 'pass'
        })

        agent.execute(
            to='recipient@example.com',
            subject='Hello',
            body='Test message'
        )
    """

    def _initialize(self):
        """Initialize SMTP connection"""
        self.smtp_host = self.config['smtp_host']
        self.smtp_port = self.config['smtp_port']
        self.username = self.config['username']
        self.password = self.config['password']

    def execute(self, to, subject, body):
        """Send an email"""
        # Implementation here
        pass
```

## Pull Request Guidelines

### PR Title Format

- `feat: Add new EmailAgent`
- `fix: Fix ChatAgent memory leak`
- `docs: Update architecture documentation`
- `refactor: Improve BaseAgent error handling`

### PR Description

Include:
1. What changes were made
2. Why the changes were needed
3. How to test the changes
4. Any breaking changes
5. Related issues (if any)

### PR Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] Documentation is complete
- [ ] Examples are included
- [ ] Agent has been tested
- [ ] README.md is clear and helpful
- [ ] No sensitive data in code
- [ ] Commit messages are clear

## Questions?

If you have questions:
1. Check existing documentation
2. Look at existing agents for examples
3. Open a discussion issue

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

## Recognition

Contributors will be:
- Listed in the README
- Credited in release notes
- Appreciated by the community! 🎉

Thank you for contributing to making agents more reusable and accessible!
