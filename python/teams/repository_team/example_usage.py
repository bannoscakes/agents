"""
Example: Repository Management Team Usage

Shows how to set up and use the Repository Management Team with a leader
coordinating code review, testing, documentation, and security agents.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from teams.repository_team.repository_leader import RepositoryLeader
from code_review_agent.code_review_agent import CodeReviewAgent
from faq_generator_agent.faq_generator_agent import FAQGeneratorAgent


def setup_repository_team():
    """
    Set up a complete Repository Management Team

    Returns:
        Configured RepositoryLeader with all agents registered
    """
    # Initialize the leader
    leader = RepositoryLeader(config={
        'repo_name': 'my-awesome-project',
        'repo_owner': 'mycompany',
        'llm_api_key': os.getenv('LLM_API_KEY')
    })

    # Initialize and register team members

    # 1. Code Review Agent
    code_review_agent = CodeReviewAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY'),
        'focus_areas': ['security', 'performance', 'best_practices']
    })
    leader.register_agent(
        agent_name='CodeReviewAgent',
        agent_instance=code_review_agent,
        capabilities=['code_review', 'security']
    )

    # 2. Documentation Agent (FAQ Generator)
    doc_agent = FAQGeneratorAgent(config={
        'llm_api_key': os.getenv('LLM_API_KEY')
    })
    leader.register_agent(
        agent_name='DocumentationAgent',
        agent_instance=doc_agent,
        capabilities=['documentation', 'faq_generation']
    )

    # Note: In a real implementation, you would add more agents:
    # - TestingAgent (runs pytest, jest, etc.)
    # - SecurityAgent (dependency scanning, SAST)
    # - IssueTriageAgent (labels, prioritizes issues)
    # - PerformanceAgent (profiling, benchmarking)

    return leader


def example_1_pr_review():
    """Example 1: Review a pull request"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Pull Request Review")
    print("="*70 + "\n")

    leader = setup_repository_team()

    # Sample code from a PR
    sample_code = '''
def process_user_data(user_input):
    # Potential security issue: SQL injection vulnerability
    query = f"SELECT * FROM users WHERE name = '{user_input}'"
    result = execute_query(query)
    return result

def calculate_discount(price, discount_percent):
    # No validation on discount_percent
    return price * (1 - discount_percent / 100)
'''

    result = leader.execute_goal(
        goal="review_pr",
        context={
            'pr_number': 123,
            'code': sample_code,
            'language': 'python',
            'run_tests': False,  # Set to True if you have test infrastructure
            'check_docs': True
        }
    )

    print("\n📊 PR REVIEW SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")
    print(f"Success Rate: {result['summary']['success_rate']}")

    if 'code_review' in result['results']:
        print("\n🔍 Code Review Results:")
        for review in result['results']['code_review']:
            print(f"  ✓ {review['description']}")

    return result


def example_2_pre_release():
    """Example 2: Pre-release checklist"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Pre-Release Checklist")
    print("="*70 + "\n")

    leader = setup_repository_team()

    sample_changes = '''
# Changes in v2.0.0

## New Features
- Added user authentication system
- Implemented API rate limiting
- Added database migration tools

## Bug Fixes
- Fixed memory leak in data processor
- Resolved race condition in async handlers

## Breaking Changes
- Removed deprecated API endpoints
- Changed configuration format
'''

    result = leader.execute_goal(
        goal="pre_release",
        context={
            'version': '2.0.0',
            'test_command': 'pytest tests/',
            'changelog': sample_changes,
            'review_changes': True,
            'changes': sample_changes,
            'language': 'python'
        }
    )

    print("\n📊 PRE-RELEASE SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")
    print(f"Success Rate: {result['summary']['success_rate']}")

    print("\n📈 Quality Metrics:")
    metrics = result['quality_metrics']
    print(f"  Code Reviews: {metrics['code_reviews_passed']}")
    print(f"  Tests Passed: {metrics['tests_passed']}")
    print(f"  Docs Updated: {metrics['documentation_updated']}")

    if result['failures']:
        print("\n⚠️  FAILURES:")
        for failure in result['failures']:
            print(f"  ✗ {failure['description']}: {failure['error']}")

    return result


def example_3_documentation_update():
    """Example 3: Update documentation"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Documentation Update")
    print("="*70 + "\n")

    leader = setup_repository_team()

    api_documentation = '''
# User Authentication API

Our API uses JWT tokens for authentication.

## Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token.

Request:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}

### POST /api/auth/refresh
Refresh an expired token.

### GET /api/auth/verify
Verify if a token is valid.
'''

    result = leader.execute_goal(
        goal="update_docs",
        context={
            'content': api_documentation,
            'doc_type': 'api',
            'num_faqs': 10
        }
    )

    print("\n📊 DOCUMENTATION UPDATE SUMMARY:")
    print(f"Success Rate: {result['summary']['success_rate']}")

    return result


def example_4_onboarding():
    """Example 4: Onboard new contributor"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Contributor Onboarding")
    print("="*70 + "\n")

    leader = setup_repository_team()

    repo_overview = '''
# Project Overview

This is a Python web application built with FastAPI and PostgreSQL.

## Tech Stack
- FastAPI for REST API
- PostgreSQL for database
- Redis for caching
- Docker for containerization

## Project Structure
- /api - API endpoints
- /models - Database models
- /services - Business logic
- /tests - Test suite

## Development Setup
1. Clone repository
2. Install dependencies: pip install -r requirements.txt
3. Set up database: docker-compose up -d
4. Run migrations: alembic upgrade head
5. Start server: uvicorn main:app --reload

## Testing
- Run tests: pytest
- Check coverage: pytest --cov
- Lint code: flake8
'''

    result = leader.execute_goal(
        goal="onboard_contributor",
        context={
            'repo_overview': repo_overview,
            'generate_faq': True
        }
    )

    print("\n📊 ONBOARDING SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")

    if 'documentation' in result['results']:
        print("\n📚 Generated Documentation:")
        for doc in result['results']['documentation']:
            print(f"  ✓ {doc['description']}")

    if 'faq_generation' in result['results']:
        print("\n❓ Generated FAQ:")
        for faq in result['results']['faq_generation']:
            print(f"  ✓ {faq['description']}")

    return result


def example_5_security_audit():
    """Example 5: Security audit"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Security Audit")
    print("="*70 + "\n")

    leader = setup_repository_team()

    code_to_audit = '''
import os
import pickle

def load_user_data(filename):
    # Security issue: Arbitrary file read
    with open(filename, 'rb') as f:
        # Security issue: Unsafe deserialization
        data = pickle.load(f)
    return data

def execute_command(cmd):
    # Security issue: Command injection
    os.system(cmd)

def connect_database(host, user, password):
    # Security issue: Hardcoded credentials
    if not password:
        password = "admin123"
    # Security issue: SQL injection possible
    connection_string = f"postgresql://{user}:{password}@{host}/db"
    return connection_string
'''

    result = leader.execute_goal(
        goal="security_audit",
        context={
            'code': code_to_audit,
            'language': 'python',
            'dependencies': ['requests==2.25.0', 'django==2.2.0']  # Old versions
        }
    )

    print("\n📊 SECURITY AUDIT SUMMARY:")
    print(f"Tasks Completed: {result['summary']['successful']}/{result['summary']['total_tasks']}")

    print("\n🔒 Security Metrics:")
    metrics = result['quality_metrics']
    print(f"  Security Reviews: {metrics['code_reviews_passed']}")
    if metrics['security_issues_found'] > 0:
        print(f"  ⚠️  Issues Found: {metrics['security_issues_found']}")

    return result


if __name__ == '__main__':
    # Run examples
    print("\n🎯 REPOSITORY MANAGEMENT TEAM EXAMPLES\n")

    # Example 1: PR Review
    example_1_pr_review()

    # Example 2: Pre-release
    example_2_pre_release()

    # Example 3: Documentation
    example_3_documentation_update()

    # Example 4: Onboarding
    example_4_onboarding()

    # Example 5: Security Audit
    example_5_security_audit()

    print("\n✅ All examples completed!\n")
