# Repository Management Team

A complete multi-agent team for managing software development workflows. The team leader coordinates specialist agents to handle code review, documentation, testing, and security auditing.

## Team Structure

```
Repository Leader
├── Code Review Agent
├── Documentation Agent (FAQ Generator)
├── Testing Agent (conceptual)
└── Security Agent (conceptual)
```

## Features

- ✅ **Automated Code Review** - Security, performance, best practices
- ✅ **Documentation Generation** - FAQs, API docs, onboarding guides
- ✅ **Pre-Release Checks** - Complete release checklist
- ✅ **Security Auditing** - Vulnerability detection
- ✅ **Testing Coordination** - Test execution and reporting
- ✅ **Quality Metrics** - Track code quality over time

## Quick Start

### Method 1: Using Configuration File

```python
from teams.team_factory import create_team

# Build team from YAML config
leader = create_team('teams/configs/repository_team.yaml')

# Review a pull request
result = leader.execute_goal(
    goal="review_pr",
    context={
        'pr_number': 123,
        'code': open('changed_files.py').read(),
        'language': 'python'
    }
)

print(f"Success rate: {result['summary']['success_rate']}")
```

### Method 2: Programmatic Setup

```python
from teams.repository_team import RepositoryLeader
from code_review_agent.code_review_agent import CodeReviewAgent
from faq_generator_agent.faq_generator_agent import FAQGeneratorAgent

# Create leader
leader = RepositoryLeader(config={
    'repo_name': 'my-awesome-project',
    'llm_api_key': 'your-api-key'
})

# Register agents
code_agent = CodeReviewAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('CodeReviewer', code_agent, ['code_review', 'security'])

doc_agent = FAQGeneratorAgent(config={'llm_api_key': 'your-api-key'})
leader.register_agent('DocGen', doc_agent, ['documentation', 'faq_generation'])

# Execute goal
result = leader.execute_goal("review_pr", context={...})
```

## Available Goals

### Review Pull Request
Comprehensive PR review with code analysis, testing, and documentation checks.

```python
result = leader.execute_goal(
    goal="review_pr",
    context={
        'pr_number': 123,
        'code': '...',  # Code changes
        'language': 'python',  # or 'javascript', 'typescript', etc.
        'run_tests': True,  # Execute test suite
        'check_docs': True  # Verify documentation
    }
)
```

**What it does:**
- Reviews code for security issues
- Checks performance and best practices
- Identifies bugs and anti-patterns
- Runs test suite (if enabled)
- Verifies documentation completeness

### Pre-Release Checklist
Complete pre-release validation workflow.

```python
result = leader.execute_goal(
    goal="pre_release",
    context={
        'version': '2.0.0',
        'test_command': 'pytest tests/',
        'changelog': '# Changes in v2.0.0...',
        'review_changes': True
    }
)
```

**What it does:**
- Runs full test suite with coverage
- Performs security vulnerability scan
- Updates release documentation
- Reviews all changes since last release
- Generates quality metrics

### Update Documentation
Generate or update project documentation.

```python
result = leader.execute_goal(
    goal="update_docs",
    context={
        'content': api_documentation_text,
        'doc_type': 'api',  # or 'user_guide', 'developer', 'faq'
        'num_faqs': 10
    }
)
```

**What it does:**
- Generates FAQs from content
- Creates API documentation
- Updates existing docs
- Ensures consistency

### Security Audit
Comprehensive security review.

```python
result = leader.execute_goal(
    goal="security_audit",
    context={
        'code': full_codebase_or_critical_files,
        'language': 'python',
        'dependencies': ['requests==2.25.0', 'django==2.2.0']
    }
)
```

**What it does:**
- Security-focused code review
- Dependency vulnerability scan
- Identifies hardcoded secrets
- Detects injection vulnerabilities
- Checks for insecure patterns

### Onboard Contributor
Create onboarding materials for new contributors.

```python
result = leader.execute_goal(
    goal="onboard_contributor",
    context={
        'repo_overview': project_description,
        'generate_faq': True
    }
)
```

**What it does:**
- Generates contributor onboarding guide
- Creates FAQ for common questions
- Documents setup process
- Explains project structure

### Daily Maintenance
Run daily health checks.

```python
result = leader.execute_goal(
    goal="daily_maintenance",
    context={
        'test_command': 'npm test',
        'security_check': True
    }
)
```

**What it does:**
- Runs test suite
- Quick security scan
- Checks for common issues
- Generates health report

## Configuration

### YAML Configuration (Recommended)

Create `my_repo_team.yaml`:

```yaml
team_type: repository

leader_config:
  repo_name: "my-awesome-project"
  repo_owner: "mycompany"
  llm_api_key: "${LLM_API_KEY}"

members:
  - name: CodeReviewAgent
    type: code_review
    capabilities:
      - code_review
      - security
    config:
      llm_api_key: "${LLM_API_KEY}"
      focus_areas:
        - security
        - performance
        - best_practices

  - name: DocumentationAgent
    type: faq_generator
    capabilities:
      - documentation
      - faq_generation
    config:
      llm_api_key: "${LLM_API_KEY}"
```

### Environment Variables

```bash
export LLM_API_KEY="your-anthropic-or-openai-api-key"
export GITHUB_TOKEN="your-github-token"  # Optional for GitHub integration
```

## Quality Metrics

Track code quality over time:

```python
result = leader.execute_goal("pre_release", context={...})

metrics = result['quality_metrics']
print(f"Code reviews passed: {metrics['code_reviews_passed']}")
print(f"Tests passed: {metrics['tests_passed']}")
print(f"Security issues found: {metrics['security_issues_found']}")
print(f"Documentation updated: {metrics['documentation_updated']}")
```

## Use Cases

### CI/CD Integration
Integrate with GitHub Actions, GitLab CI, or Jenkins:

```yaml
# .github/workflows/pr-review.yml
name: AI PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run AI Review
        run: |
          python scripts/ai_review.py \
            --pr-number ${{ github.event.pull_request.number }} \
            --files $(git diff --name-only origin/main)
```

### Pre-Commit Hook
Run code review before commits:

```python
# .git/hooks/pre-commit
#!/usr/bin/env python3
from teams.repository_team import RepositoryLeader

leader = RepositoryLeader(config={'llm_api_key': 'your-key'})

# Get staged files
import subprocess
result = subprocess.run(['git', 'diff', '--cached', '--name-only'],
                       capture_output=True, text=True)
files = result.stdout.strip().split('\n')

# Review changes
for file in files:
    if file.endswith('.py'):
        with open(file) as f:
            code = f.read()

        review = leader.execute_goal("review_pr", context={
            'code': code,
            'language': 'python',
            'run_tests': False
        })

        if review['failures']:
            print(f"❌ Review failed for {file}")
            exit(1)

print("✅ All checks passed!")
```

### Release Automation
Automate release preparation:

```python
import sys

def prepare_release(version):
    leader = create_team('configs/repository_team.yaml')

    result = leader.execute_goal(
        goal="pre_release",
        context={
            'version': version,
            'test_command': 'pytest --cov',
            'review_changes': True
        }
    )

    if result['summary']['failed'] > 0:
        print("❌ Release checks failed!")
        for failure in result['failures']:
            print(f"  - {failure['description']}: {failure['error']}")
        sys.exit(1)

    print(f"✅ Ready to release v{version}!")
    print(f"Quality score: {result['summary']['success_rate']}")

if __name__ == '__main__':
    prepare_release(sys.argv[1])
```

## Example Workflows

### PR Review Workflow

```python
def review_pull_request(pr_number, repo_path):
    """Review a pull request automatically"""
    import subprocess

    # Get PR changes
    result = subprocess.run(
        ['git', 'diff', f'origin/main...pr-{pr_number}'],
        cwd=repo_path,
        capture_output=True,
        text=True
    )

    code_changes = result.stdout

    # Review with team
    leader = create_team('configs/repository_team.yaml')

    review_result = leader.execute_goal(
        goal="review_pr",
        context={
            'pr_number': pr_number,
            'code': code_changes,
            'language': 'python',
            'run_tests': True,
            'check_docs': True
        }
    )

    # Post results as PR comment (requires GitHub API)
    if review_result['results'].get('code_review'):
        for review in review_result['results']['code_review']:
            print(f"Code Review: {review['result']}")

    return review_result['summary']['success_rate'] == '100.0%'
```

### Nightly Security Scan

```python
import schedule

def nightly_security_scan():
    """Run security scan every night"""
    import os

    # Read all Python files
    codebase = ""
    for root, dirs, files in os.walk('./src'):
        for file in files:
            if file.endswith('.py'):
                with open(os.path.join(root, file)) as f:
                    codebase += f"\n# File: {file}\n{f.read()}\n"

    leader = create_team('configs/repository_team.yaml')

    result = leader.execute_goal(
        goal="security_audit",
        context={
            'code': codebase,
            'language': 'python'
        }
    )

    # Send alert if issues found
    if result['quality_metrics']['security_issues_found'] > 0:
        send_security_alert(result)

schedule.every().day.at("02:00").do(nightly_security_scan)
```

## Best Practices

1. **Integrate with CI/CD** - Automate reviews in your pipeline
2. **Set quality gates** - Block merges if reviews fail
3. **Monitor metrics** - Track quality trends over time
4. **Regular security scans** - Schedule weekly audits
5. **Update documentation** - Auto-generate docs on releases
6. **Review dependencies** - Check for vulnerabilities regularly

## Extending the Team

Add custom agents:

```python
# Create a custom testing agent
class TestingAgent(BaseTeamMemberAgent):
    def __init__(self, config=None):
        super().__init__('TestRunner', ['testing'], config)

    def execute(self, **kwargs):
        test_command = kwargs.get('test_command', 'pytest')
        # Run tests and return results
        import subprocess
        result = subprocess.run(
            test_command.split(),
            capture_output=True,
            text=True
        )

        return {
            'success': result.returncode == 0,
            'output': result.stdout,
            'errors': result.stderr
        }

# Register with team
leader = RepositoryLeader(config={...})
test_agent = TestingAgent()
leader.register_agent('TestRunner', test_agent, ['testing'])
```

## Cost Estimates

Approximate costs per goal execution:

| Goal | Estimated Cost |
|------|---------------|
| Review PR | $0.02 - $0.05 |
| Pre-Release | $0.10 - $0.20 |
| Update Docs | $0.01 - $0.03 |
| Security Audit | $0.05 - $0.15 |
| Onboard Contributor | $0.02 - $0.04 |
| Daily Maintenance | $0.03 - $0.06 |

*Costs vary based on code size, LLM provider, and model*

## Troubleshooting

### Code review finding too many false positives

**Solution:** Adjust the focus areas in the code review agent configuration to be more specific to your needs.

### Tests not running

**Solution:**
1. Verify test command is correct
2. Ensure test dependencies are installed
3. Check working directory is correct
4. Review test agent logs

### Documentation generation issues

**Solution:**
1. Provide more context in the `content` field
2. Specify `doc_type` explicitly
3. Increase `num_faqs` if needed
4. Check agent has necessary permissions

## Requirements

- Python 3.8+
- LLM API key (Anthropic Claude or OpenAI)
- Git repository access
- Test framework (pytest, jest, etc.) for testing features

## License

MIT License
