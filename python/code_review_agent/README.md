# Code Review Agent

Automated code review with AI. Detect security issues, performance problems, best practices violations, and potential bugs.

## Features

- Security vulnerability detection
- Performance analysis
- Best practices enforcement
- Code style checking
- Bug detection with line references
- Multi-language support (Python, JavaScript, TypeScript, etc.)

## Quick Start

```python
from code_review_agent import CodeReviewAgent

agent = CodeReviewAgent({
    'llm_provider': 'anthropic',
    'llm_api_key': 'your-api-key'
})

code = '''
def process_user_input(user_input):
    query = "SELECT * FROM users WHERE name = '" + user_input + "'"
    return execute_query(query)
'''

with agent:
    review = agent.execute(code, language='python')
    print(review['review'])
```

## Output Example

```
SECURITY ISSUES:
- Line 2: SQL Injection vulnerability - user input is concatenated directly
  into SQL query. Use parameterized queries instead.

RECOMMENDATIONS:
- Use: cursor.execute("SELECT * FROM users WHERE name = ?", (user_input,))

BEST PRACTICES:
- Add input validation
- Use ORM or prepared statements
- Implement error handling
```

## Supported Languages

Python, JavaScript, TypeScript, Java, C++, Go, Ruby, PHP, and more

## Use Cases

- PR review automation
- Pre-commit checks
- Code quality monitoring
- Learning and mentorship

## Cost: ~$0.01 per review (500 lines)

## License

MIT
