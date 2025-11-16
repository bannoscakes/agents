# Task Scheduler Agent

Schedule and execute tasks with cron-like functionality. Manage recurring tasks, one-time jobs, and task dependencies.

## Features

- Cron-style scheduling
- One-time and recurring tasks
- Task dependencies
- Priority management
- Error handling and retries
- Task history

## Quick Start

```python
from task_scheduler import TaskSchedulerAgent, Task

agent = TaskSchedulerAgent()

# Create a task
task = Task(
    name='Daily Backup',
    schedule='0 2 * * *',  # 2 AM daily
    action=lambda: backup_database()
)

with agent:
    # Add task to scheduler
    agent.execute(task)
    
    # Run scheduler
    agent.run()
```

## Task Configuration

```python
task = Task(
    name='Task Name',
    schedule='0 * * * *',  # Cron expression
    action=callable_function,
    priority=1,
    retry_on_failure=True,
    max_retries=3
)
```

## Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sun-Sat)
│ │ │ └──────   Month (1-12)
│ │ └──────── Day of month (1-31)
│ └────────── Hour (0-23)
└──────────── Minute (0-59)
```

## Examples

- `0 * * * *` - Every hour
- `0 2 * * *` - Daily at 2 AM
- `0 2 * * 0` - Weekly on Sunday at 2 AM
- `0 0 1 * *` - Monthly on 1st at midnight

## Use Cases

- Automated backups
- Report generation
- Data synchronization
- Cleanup tasks
- Scheduled notifications

## License

MIT
