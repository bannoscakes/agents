"""
Task Scheduler Agent - Automated task execution

Schedule and execute tasks:
- One-time tasks
- Recurring tasks
- Cron-style scheduling
- Task dependencies
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import Callable, Dict, Any, Optional, List
from datetime import datetime, timedelta
import time
import threading


class Task:
    """Represents a scheduled task"""

    def __init__(
        self,
        name: str,
        func: Callable,
        args: tuple = (),
        kwargs: dict = None,
        schedule: Optional[str] = None
    ):
        self.name = name
        self.func = func
        self.args = args
        self.kwargs = kwargs or {}
        self.schedule = schedule
        self.last_run = None
        self.next_run = None
        self.runs = 0
        self.enabled = True

    def execute(self) -> Any:
        """Execute the task"""
        try:
            result = self.func(*self.args, **self.kwargs)
            self.last_run = datetime.now()
            self.runs += 1
            return result
        except Exception as e:
            raise Exception(f"Task {self.name} failed: {str(e)}")


class TaskSchedulerAgent(BaseAgent):
    """
    Agent for scheduling and executing tasks

    Features:
    - Schedule one-time or recurring tasks
    - Interval-based scheduling (every N seconds/minutes/hours)
    - Task dependencies
    - Async execution
    - Task history

    Example:
        scheduler = TaskSchedulerAgent()

        def my_task():
            print("Task executed!")

        scheduler.add_task('my_task', my_task, interval_seconds=10)
        scheduler.start()  # Runs in background
    """

    def _initialize(self) -> None:
        """Initialize task scheduler"""
        self.state['tasks'] = {}
        self.state['running'] = False
        self.state['thread'] = None
        self.state['history'] = []

    def add_task(
        self,
        name: str,
        func: Callable,
        args: tuple = (),
        kwargs: dict = None,
        interval_seconds: Optional[int] = None,
        interval_minutes: Optional[int] = None,
        interval_hours: Optional[int] = None,
        run_immediately: bool = False
    ) -> 'TaskSchedulerAgent':
        """
        Add a task to the scheduler

        Args:
            name: Unique task name
            func: Function to execute
            args: Function arguments
            kwargs: Function keyword arguments
            interval_seconds: Run every N seconds
            interval_minutes: Run every N minutes
            interval_hours: Run every N hours
            run_immediately: Run task immediately upon adding

        Returns:
            Self for chaining
        """
        if not self._initialized:
            self.initialize()

        # Calculate schedule
        schedule = None
        if interval_seconds:
            schedule = f"every_{interval_seconds}s"
        elif interval_minutes:
            schedule = f"every_{interval_minutes}m"
        elif interval_hours:
            schedule = f"every_{interval_hours}h"

        task = Task(name, func, args, kwargs, schedule)

        # Calculate next run time
        if interval_seconds:
            task.next_run = datetime.now() + timedelta(seconds=interval_seconds)
        elif interval_minutes:
            task.next_run = datetime.now() + timedelta(minutes=interval_minutes)
        elif interval_hours:
            task.next_run = datetime.now() + timedelta(hours=interval_hours)

        if run_immediately:
            task.next_run = datetime.now()

        self.state['tasks'][name] = task
        self.logger.info(f"Task '{name}' added to scheduler")

        return self

    def remove_task(self, name: str) -> None:
        """Remove a task from scheduler"""
        if name in self.state['tasks']:
            del self.state['tasks'][name]
            self.logger.info(f"Task '{name}' removed")

    def execute(self, task_name: Optional[str] = None) -> Any:
        """
        Execute a specific task or all due tasks

        Args:
            task_name: Name of task to execute (None = execute all due tasks)

        Returns:
            Task result(s)
        """
        if not self._initialized:
            self.initialize()

        if task_name:
            # Execute specific task
            if task_name not in self.state['tasks']:
                raise ValueError(f"Task '{task_name}' not found")

            task = self.state['tasks'][task_name]
            return self._execute_task(task)
        else:
            # Execute all due tasks
            results = {}
            now = datetime.now()

            for name, task in self.state['tasks'].items():
                if task.enabled and task.next_run and task.next_run <= now:
                    results[name] = self._execute_task(task)

            return results

    def _execute_task(self, task: Task) -> Any:
        """Execute a task and update its schedule"""
        self.logger.info(f"Executing task: {task.name}")

        try:
            result = task.execute()

            # Update next run time
            self._update_next_run(task)

            # Add to history
            self.state['history'].append({
                'task': task.name,
                'timestamp': datetime.now().isoformat(),
                'status': 'success',
                'runs': task.runs
            })

            return result

        except Exception as e:
            self.logger.error(f"Task {task.name} failed: {str(e)}")

            self.state['history'].append({
                'task': task.name,
                'timestamp': datetime.now().isoformat(),
                'status': 'failed',
                'error': str(e)
            })

            raise

    def _update_next_run(self, task: Task) -> None:
        """Update the next run time for a task"""
        if not task.schedule:
            task.next_run = None
            return

        # Parse schedule
        if task.schedule.startswith('every_'):
            parts = task.schedule.replace('every_', '').rstrip('smh')
            interval = int(parts)
            unit = task.schedule[-1]

            if unit == 's':
                task.next_run = datetime.now() + timedelta(seconds=interval)
            elif unit == 'm':
                task.next_run = datetime.now() + timedelta(minutes=interval)
            elif unit == 'h':
                task.next_run = datetime.now() + timedelta(hours=interval)

    def start(self, blocking: bool = False) -> None:
        """
        Start the scheduler

        Args:
            blocking: If True, runs in current thread. If False, runs in background.
        """
        if self.state['running']:
            self.logger.warning("Scheduler already running")
            return

        self.state['running'] = True
        self.logger.info("Starting scheduler")

        if blocking:
            self._run_loop()
        else:
            self.state['thread'] = threading.Thread(target=self._run_loop, daemon=True)
            self.state['thread'].start()

    def stop(self) -> None:
        """Stop the scheduler"""
        self.state['running'] = False
        if self.state['thread']:
            self.state['thread'].join(timeout=5)
        self.logger.info("Scheduler stopped")

    def _run_loop(self) -> None:
        """Main scheduler loop"""
        while self.state['running']:
            try:
                self.execute()
            except Exception as e:
                self.logger.error(f"Scheduler error: {str(e)}")

            time.sleep(1)  # Check every second

    def get_tasks(self) -> Dict[str, Dict]:
        """Get all tasks and their status"""
        return {
            name: {
                'name': task.name,
                'schedule': task.schedule,
                'last_run': task.last_run.isoformat() if task.last_run else None,
                'next_run': task.next_run.isoformat() if task.next_run else None,
                'runs': task.runs,
                'enabled': task.enabled
            }
            for name, task in self.state['tasks'].items()
        }

    def get_history(self, limit: int = 10) -> List[Dict]:
        """Get task execution history"""
        return self.state['history'][-limit:]

    def _cleanup(self) -> None:
        """Cleanup scheduler"""
        self.stop()


# Example usage
if __name__ == '__main__':
    print("Task Scheduler Agent Example")
    print("=" * 50)

    scheduler = TaskSchedulerAgent()

    def greet(name):
        msg = f"Hello, {name}! Current time: {datetime.now().strftime('%H:%M:%S')}"
        print(msg)
        return msg

    def calculate():
        result = sum(range(100))
        print(f"Calculation result: {result}")
        return result

    # Add tasks
    scheduler.add_task('greet_alice', greet, args=('Alice',), interval_seconds=3)
    scheduler.add_task('greet_bob', greet, args=('Bob',), interval_seconds=5)
    scheduler.add_task('calculate', calculate, interval_seconds=7)

    print("\nTasks scheduled:")
    for name, info in scheduler.get_tasks().items():
        print(f"  - {name}: {info['schedule']}")

    print("\nRunning scheduler for 15 seconds...")
    scheduler.start()

    try:
        time.sleep(15)
    finally:
        scheduler.stop()

    print("\nExecution history:")
    for entry in scheduler.get_history():
        print(f"  {entry['timestamp']}: {entry['task']} - {entry['status']}")
