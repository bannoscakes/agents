"""
Repository Management Team Leader

Coordinates a team of agents to manage a software repository:
- Code review
- Testing
- Documentation generation
- Issue triage
- Security scanning
- Performance analysis

The leader receives high-level goals like "review PR #123" or
"prepare for release v2.0" and coordinates the team to achieve them.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from teams.base_leader_agent import BaseLeaderAgent, Task, TaskPriority
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class RepositoryLeader(BaseLeaderAgent):
    """
    Leader agent for repository management

    Manages and coordinates:
    - Code review agent
    - Testing agent (conceptual - runs tests)
    - Documentation agent (FAQ/doc generation)
    - Issue triage agent (conceptual)
    - Security agent (conceptual)
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Repository Management Leader

        Args:
            config: Configuration including repo details, API keys, etc.
        """
        super().__init__(team_name="Repository Management Team", config=config)

        self.repo_name = config.get('repo_name', 'my-repo') if config else 'my-repo'
        self.repo_owner = config.get('repo_owner', '') if config else ''

    def plan_tasks(self, goal: str, context: Optional[Dict[str, Any]] = None) -> List[Task]:
        """
        Plan tasks based on the goal

        Supported goals:
        - "review_pr": Review pull request
        - "pre_release": Pre-release checklist (tests, docs, security)
        - "onboard_contributor": Help new contributor get started
        - "security_audit": Run security checks
        - "update_docs": Update documentation
        - "triage_issues": Triage and label issues

        Args:
            goal: High-level goal identifier
            context: Additional context

        Returns:
            List of tasks to execute
        """
        context = context or {}
        tasks = []

        goal_lower = goal.lower()

        # GOAL: Review Pull Request
        if 'review' in goal_lower and 'pr' in goal_lower:
            tasks = self._plan_pr_review(context)

        # GOAL: Pre-release Checklist
        elif 'release' in goal_lower or 'deploy' in goal_lower:
            tasks = self._plan_pre_release(context)

        # GOAL: Update Documentation
        elif 'doc' in goal_lower or 'documentation' in goal_lower:
            tasks = self._plan_documentation_update(context)

        # GOAL: Security Audit
        elif 'security' in goal_lower or 'audit' in goal_lower:
            tasks = self._plan_security_audit(context)

        # GOAL: Onboard Contributor
        elif 'onboard' in goal_lower or 'contributor' in goal_lower:
            tasks = self._plan_onboarding(context)

        # GOAL: Daily Maintenance
        elif 'daily' in goal_lower or 'maintenance' in goal_lower:
            tasks = self._plan_daily_maintenance(context)

        else:
            logger.warning(f"Unknown goal pattern: {goal}. Using general task planning.")
            tasks = self._plan_general_goal(goal, context)

        return tasks

    def _plan_pr_review(self, context: Dict[str, Any]) -> List[Task]:
        """Plan pull request review workflow"""
        tasks = []
        pr_number = context.get('pr_number', 'unknown')
        code = context.get('code', '')
        language = context.get('language', 'python')

        # 1. Code review
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description=f"Review code for PR #{pr_number}",
            task_type="code_review",
            priority=TaskPriority.HIGH,
            metadata={
                'code': code,
                'language': language,
                'pr_number': pr_number
            }
        ))

        # 2. Run tests (if test files provided)
        if context.get('run_tests', False):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Run test suite",
                task_type="testing",
                priority=TaskPriority.HIGH,
                metadata={
                    'test_command': context.get('test_command', 'pytest'),
                    'pr_number': pr_number
                }
            ))

        # 3. Check documentation
        if context.get('check_docs', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Verify documentation",
                task_type="documentation",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'code': code,
                    'check_type': 'completeness'
                }
            ))

        return tasks

    def _plan_pre_release(self, context: Dict[str, Any]) -> List[Task]:
        """Plan pre-release checklist"""
        tasks = []
        version = context.get('version', '1.0.0')

        # 1. Run full test suite
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description=f"Run full test suite for v{version}",
            task_type="testing",
            priority=TaskPriority.CRITICAL,
            metadata={
                'test_command': context.get('test_command', 'pytest'),
                'coverage': True
            }
        ))

        # 2. Security audit
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Security vulnerability scan",
            task_type="security",
            priority=TaskPriority.CRITICAL,
            metadata={
                'scan_dependencies': True,
                'scan_code': True
            }
        ))

        # 3. Update documentation
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Update release documentation",
            task_type="documentation",
            priority=TaskPriority.HIGH,
            metadata={
                'version': version,
                'changelog': context.get('changelog', '')
            }
        ))

        # 4. Code review of changes since last release
        if context.get('review_changes', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Review changes since last release",
                task_type="code_review",
                priority=TaskPriority.HIGH,
                metadata={
                    'code': context.get('changes', ''),
                    'language': context.get('language', 'python')
                }
            ))

        return tasks

    def _plan_documentation_update(self, context: Dict[str, Any]) -> List[Task]:
        """Plan documentation update workflow"""
        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description="Generate/update documentation",
                task_type="documentation",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'content': context.get('content', ''),
                    'doc_type': context.get('doc_type', 'api'),
                    'num_faqs': context.get('num_faqs', 10)
                }
            )
        ]

    def _plan_security_audit(self, context: Dict[str, Any]) -> List[Task]:
        """Plan security audit workflow"""
        tasks = []

        # 1. Code security review
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Security-focused code review",
            task_type="code_review",
            priority=TaskPriority.CRITICAL,
            metadata={
                'code': context.get('code', ''),
                'language': context.get('language', 'python'),
                'focus': 'security'
            }
        ))

        # 2. Dependency scan (conceptual)
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Scan dependencies for vulnerabilities",
            task_type="security",
            priority=TaskPriority.CRITICAL,
            metadata={
                'dependencies': context.get('dependencies', [])
            }
        ))

        return tasks

    def _plan_onboarding(self, context: Dict[str, Any]) -> List[Task]:
        """Plan contributor onboarding workflow"""
        tasks = []

        # 1. Generate getting started docs
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Generate contributor onboarding guide",
            task_type="documentation",
            priority=TaskPriority.MEDIUM,
            metadata={
                'content': context.get('repo_overview', ''),
                'doc_type': 'onboarding'
            }
        ))

        # 2. Generate FAQ
        if context.get('generate_faq', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Generate contributor FAQ",
                task_type="faq_generation",
                priority=TaskPriority.LOW,
                metadata={
                    'content': context.get('repo_overview', ''),
                    'num_faqs': 15
                }
            ))

        return tasks

    def _plan_daily_maintenance(self, context: Dict[str, Any]) -> List[Task]:
        """Plan daily maintenance workflow"""
        tasks = []

        # Run tests
        self.task_counter += 1
        tasks.append(Task(
            task_id=f"task_{self.task_counter}",
            description="Daily test run",
            task_type="testing",
            priority=TaskPriority.MEDIUM,
            metadata={
                'test_command': context.get('test_command', 'pytest')
            }
        ))

        # Quick security check
        if context.get('security_check', True):
            self.task_counter += 1
            tasks.append(Task(
                task_id=f"task_{self.task_counter}",
                description="Daily security scan",
                task_type="security",
                priority=TaskPriority.MEDIUM,
                metadata={
                    'quick_scan': True
                }
            ))

        return tasks

    def _plan_general_goal(self, goal: str, context: Dict[str, Any]) -> List[Task]:
        """Fallback: create a general task"""
        self.task_counter += 1
        return [
            Task(
                task_id=f"task_{self.task_counter}",
                description=goal,
                task_type="general",
                priority=TaskPriority.MEDIUM,
                metadata=context
            )
        ]

    def aggregate_results(self, tasks: List[Task]) -> Dict[str, Any]:
        """
        Aggregate results from all tasks

        Args:
            tasks: List of completed tasks

        Returns:
            Comprehensive report of all task results
        """
        successful_tasks = [t for t in tasks if t.status.value == "completed"]
        failed_tasks = [t for t in tasks if t.status.value == "failed"]

        report = {
            'team': self.team_name,
            'repository': self.repo_name,
            'summary': {
                'total_tasks': len(tasks),
                'successful': len(successful_tasks),
                'failed': len(failed_tasks),
                'success_rate': f"{len(successful_tasks) / len(tasks) * 100:.1f}%" if tasks else "0%"
            },
            'results': {},
            'failures': [],
            'quality_metrics': self._calculate_quality_metrics(successful_tasks)
        }

        # Organize results by task type
        for task in successful_tasks:
            task_type = task.task_type
            if task_type not in report['results']:
                report['results'][task_type] = []

            report['results'][task_type].append({
                'task_id': task.task_id,
                'description': task.description,
                'assigned_to': task.assigned_to,
                'result': task.result
            })

        # Record failures
        for task in failed_tasks:
            report['failures'].append({
                'task_id': task.task_id,
                'description': task.description,
                'error': task.error
            })

        return report

    def _calculate_quality_metrics(self, tasks: List[Task]) -> Dict[str, Any]:
        """Calculate quality metrics from task results"""
        metrics = {
            'code_reviews_passed': 0,
            'tests_passed': 0,
            'security_issues_found': 0,
            'documentation_updated': 0
        }

        for task in tasks:
            if task.task_type == 'code_review':
                metrics['code_reviews_passed'] += 1
            elif task.task_type == 'testing':
                metrics['tests_passed'] += 1
            elif task.task_type == 'security':
                # Count if security issues were found
                if task.result and isinstance(task.result, dict):
                    metrics['security_issues_found'] += task.result.get('issues_found', 0)
            elif task.task_type == 'documentation':
                metrics['documentation_updated'] += 1

        return metrics
