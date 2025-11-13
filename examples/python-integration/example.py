"""
Example: Integrating Python agents into your project

Method 1: Git Submodule
- Add this repo as a submodule: git submodule add <repo-url> lib/agents
- Import agents from lib/agents/python

Method 2: Direct Copy
- Copy the agents you need into your project
- Import and use them
"""

import sys
import os

# If using git submodule
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../python'))

from chat_agent import ChatAgent
from data_processor import DataProcessorAgent
from task_scheduler import TaskSchedulerAgent


def example_1_chat_agent():
    """Example 1: Using the Chat Agent"""
    print("=" * 60)
    print("Example 1: Chat Agent")
    print("=" * 60)

    # Create a code review assistant
    code_reviewer = ChatAgent({
        'system_prompt': '''You are an expert code reviewer.
        Analyze code for bugs, security issues, and best practices.''',
        'max_history': 10
    })

    with code_reviewer:
        code = '''
def process_user_input(user_input):
    query = "SELECT * FROM users WHERE name = '" + user_input + "'"
    return execute_query(query)
        '''

        response = code_reviewer.execute(
            f"Review this code and identify issues:\n{code}"
        )
        print(f"\nCode Review:\n{response}\n")


def example_2_data_processor():
    """Example 2: Using the Data Processor Agent"""
    print("=" * 60)
    print("Example 2: Data Processor Agent")
    print("=" * 60)

    # Process user data
    processor = DataProcessorAgent()

    # Add transformations
    processor.add_filter(lambda user: user['age'] >= 18)
    processor.add_transformation(lambda user: {
        **user,
        'status': 'verified',
        'adult': True
    })

    users = [
        {'name': 'Alice', 'age': 25, 'email': 'alice@example.com'},
        {'name': 'Bob', 'age': 17, 'email': 'bob@example.com'},
        {'name': 'Charlie', 'age': 30, 'email': 'charlie@example.com'}
    ]

    with processor:
        processed = processor.execute(users, calculate_stats=True)
        print(f"\nOriginal users: {len(users)}")
        print(f"Processed users: {len(processed)}")
        print(f"Stats: {processor.get_stats()}")
        print(f"\nProcessed data:")
        for user in processed:
            print(f"  {user}")


def example_3_task_scheduler():
    """Example 3: Using the Task Scheduler Agent"""
    print("\n" + "=" * 60)
    print("Example 3: Task Scheduler Agent")
    print("=" * 60)

    import time

    scheduler = TaskSchedulerAgent()

    # Define tasks
    def backup_database():
        print(f"[{time.strftime('%H:%M:%S')}] Backing up database...")
        return "Backup complete"

    def send_report():
        print(f"[{time.strftime('%H:%M:%S')}] Sending daily report...")
        return "Report sent"

    def cleanup():
        print(f"[{time.strftime('%H:%M:%S')}] Cleaning up temp files...")
        return "Cleanup complete"

    # Schedule tasks
    scheduler.add_task('backup', backup_database, interval_seconds=5)
    scheduler.add_task('report', send_report, interval_seconds=8)
    scheduler.add_task('cleanup', cleanup, interval_seconds=12)

    with scheduler:
        print("\nScheduled tasks:")
        for name, info in scheduler.get_tasks().items():
            print(f"  - {name}: {info['schedule']}")

        print("\nRunning scheduler for 15 seconds...")
        scheduler.start()
        time.sleep(15)
        scheduler.stop()

        print("\nExecution history:")
        for entry in scheduler.get_history(limit=20):
            print(f"  {entry['timestamp']}: {entry['task']} - {entry['status']}")


def example_4_combining_agents():
    """Example 4: Combining Multiple Agents"""
    print("\n" + "=" * 60)
    print("Example 4: Combining Multiple Agents")
    print("=" * 60)

    # Use multiple agents together
    chat = ChatAgent({'system_prompt': 'You are a data analyst.'})
    processor = DataProcessorAgent()

    # Process data
    processor.add_transformation(lambda x: x * 2)
    data = [1, 2, 3, 4, 5]
    processed = processor.execute(data, calculate_stats=True)

    # Analyze with chat agent
    chat.initialize()
    analysis = chat.execute(
        f"Analyze this data: {processed}. Stats: {processor.get_stats()}"
    )

    print(f"\nOriginal data: {data}")
    print(f"Processed data: {processed}")
    print(f"AI Analysis: {analysis}")

    chat.cleanup()


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Python Agents Integration Examples")
    print("=" * 60 + "\n")

    # Run examples
    example_1_chat_agent()
    example_2_data_processor()
    example_3_task_scheduler()
    example_4_combining_agents()

    print("\n" + "=" * 60)
    print("All examples completed!")
    print("=" * 60)
