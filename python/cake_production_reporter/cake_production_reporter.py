"""
Cake Production Reporter Agent

A specialized agent for production systems that generates reports twice a week
showing how many cakes need to be cooked based on incoming orders.

Features:
- Scheduled reporting (configurable days and times)
- Order aggregation by cake type
- Production quantity calculation
- Multiple report formats (text, HTML, JSON)
- Email/file delivery
- Database and API integration support
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict
import json


class CakeProductionReporterAgent(BaseAgent):
    """
    Agent that generates production reports for cake orders

    This agent is designed to run in production environments and can:
    - Fetch orders from various sources (database, API, CSV)
    - Aggregate orders by cake type
    - Calculate total production needs
    - Generate formatted reports
    - Schedule reports to run twice a week
    - Send reports via email or save to file

    Example:
        agent = CakeProductionReporterAgent({
            'report_days': ['Monday', 'Thursday'],
            'report_time': '08:00',
            'data_source': 'database',
            'db_connection': db_conn,
            'email_to': 'production@bakery.com'
        })

        # Manual report
        report = agent.execute()

        # Or schedule automatic reports
        agent.start_scheduler()
    """

    def _initialize(self) -> None:
        """Initialize the reporter agent"""
        # Report scheduling
        self.state['report_days'] = self.config.get('report_days', ['Monday', 'Thursday'])
        self.state['report_time'] = self.config.get('report_time', '08:00')
        self.state['timezone'] = self.config.get('timezone', 'UTC')

        # Data source configuration
        self.state['data_source'] = self.config.get('data_source', 'function')
        self.state['fetch_function'] = self.config.get('fetch_function')
        self.state['db_connection'] = self.config.get('db_connection')
        self.state['api_endpoint'] = self.config.get('api_endpoint')

        # Report configuration
        self.state['report_format'] = self.config.get('report_format', 'text')
        self.state['include_details'] = self.config.get('include_details', True)
        self.state['buffer_percentage'] = self.config.get('buffer_percentage', 10)  # Safety buffer

        # Delivery configuration
        self.state['delivery_method'] = self.config.get('delivery_method', 'file')
        self.state['output_file'] = self.config.get('output_file', 'production_report.txt')
        self.state['email_to'] = self.config.get('email_to', [])
        self.state['email_from'] = self.config.get('email_from', '')

        # Report history
        self.state['last_report_date'] = None
        self.state['report_history'] = []

    def execute(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        custom_orders: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Generate a production report

        Args:
            start_date: Start date for orders (defaults to last report or 7 days ago)
            end_date: End date for orders (defaults to now)
            custom_orders: Provide orders directly instead of fetching

        Returns:
            Dictionary containing report data and formatted report
        """
        if not self._initialized:
            self.initialize()

        # Determine date range
        if not start_date:
            if self.state['last_report_date']:
                start_date = self.state['last_report_date']
            else:
                start_date = datetime.now() - timedelta(days=7)

        if not end_date:
            end_date = datetime.now()

        self.logger.info(f"Generating report for {start_date.date()} to {end_date.date()}")

        # Fetch orders
        if custom_orders is not None:
            orders = custom_orders
        else:
            orders = self._fetch_orders(start_date, end_date)

        # Process orders
        production_data = self._aggregate_orders(orders)

        # Add safety buffer
        production_data = self._apply_buffer(production_data)

        # Generate report
        report_text = self._generate_report(production_data, start_date, end_date, orders)

        # Create report package
        report = {
            'date': datetime.now().isoformat(),
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'total_orders': len(orders),
            'production_data': production_data,
            'report_text': report_text
        }

        # Deliver report
        self._deliver_report(report)

        # Update state
        self.state['last_report_date'] = end_date
        self.state['report_history'].append({
            'date': datetime.now().isoformat(),
            'total_orders': len(orders),
            'total_cakes': sum(production_data.values())
        })

        # Keep only last 100 reports in history
        if len(self.state['report_history']) > 100:
            self.state['report_history'] = self.state['report_history'][-100:]

        self.logger.info(f"Report generated: {sum(production_data.values())} total cakes")

        return report

    def _fetch_orders(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """
        Fetch orders from configured data source

        Returns list of order dictionaries with at least:
        - cake_type: string
        - quantity: int
        - order_date: datetime or string
        """
        data_source = self.state['data_source']

        if data_source == 'function' and self.state['fetch_function']:
            # Custom function provided
            orders = self.state['fetch_function'](start_date, end_date)

        elif data_source == 'database' and self.state['db_connection']:
            # Database query
            orders = self._fetch_from_database(start_date, end_date)

        elif data_source == 'api' and self.state['api_endpoint']:
            # API call
            orders = self._fetch_from_api(start_date, end_date)

        else:
            # No data source configured - return empty or raise error
            self.logger.warning("No data source configured, returning empty orders")
            orders = []

        self.logger.info(f"Fetched {len(orders)} orders")
        return orders

    def _fetch_from_database(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch orders from database"""
        conn = self.state['db_connection']
        query = self.config.get('db_query', """
            SELECT cake_type, quantity, order_date
            FROM orders
            WHERE order_date >= ? AND order_date <= ?
        """)

        cursor = conn.cursor()
        cursor.execute(query, (start_date, end_date))

        orders = []
        for row in cursor.fetchall():
            orders.append({
                'cake_type': row[0],
                'quantity': row[1],
                'order_date': row[2]
            })

        return orders

    def _fetch_from_api(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch orders from API"""
        import requests

        endpoint = self.state['api_endpoint']
        params = {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        }

        headers = self.config.get('api_headers', {})

        response = requests.get(endpoint, params=params, headers=headers)
        response.raise_for_status()

        return response.json()

    def _aggregate_orders(self, orders: List[Dict]) -> Dict[str, int]:
        """
        Aggregate orders by cake type

        Returns: {cake_type: total_quantity}
        """
        aggregation = defaultdict(int)

        for order in orders:
            cake_type = order.get('cake_type', 'Unknown')
            quantity = order.get('quantity', 1)
            aggregation[cake_type] += quantity

        return dict(aggregation)

    def _apply_buffer(self, production_data: Dict[str, int]) -> Dict[str, int]:
        """Apply safety buffer to production quantities"""
        buffer_pct = self.state['buffer_percentage']

        if buffer_pct <= 0:
            return production_data

        buffered = {}
        for cake_type, quantity in production_data.items():
            buffer_amount = int(quantity * buffer_pct / 100)
            buffered[cake_type] = quantity + buffer_amount

        self.logger.info(f"Applied {buffer_pct}% safety buffer")
        return buffered

    def _generate_report(
        self,
        production_data: Dict[str, int],
        start_date: datetime,
        end_date: datetime,
        orders: List[Dict]
    ) -> str:
        """Generate formatted report"""
        report_format = self.state['report_format']

        if report_format == 'html':
            return self._generate_html_report(production_data, start_date, end_date, orders)
        elif report_format == 'json':
            return json.dumps({
                'production': production_data,
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'total_orders': len(orders),
                'total_cakes': sum(production_data.values())
            }, indent=2)
        else:
            return self._generate_text_report(production_data, start_date, end_date, orders)

    def _generate_text_report(
        self,
        production_data: Dict[str, int],
        start_date: datetime,
        end_date: datetime,
        orders: List[Dict]
    ) -> str:
        """Generate plain text report"""
        buffer_pct = self.state['buffer_percentage']

        lines = []
        lines.append("=" * 70)
        lines.append("CAKE PRODUCTION REPORT")
        lines.append("=" * 70)
        lines.append(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append(f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        lines.append(f"Total Orders: {len(orders)}")
        lines.append("")

        lines.append("PRODUCTION REQUIREMENTS:")
        lines.append("-" * 70)

        if not production_data:
            lines.append("No cakes to produce this period.")
        else:
            # Sort by quantity (descending)
            sorted_cakes = sorted(production_data.items(), key=lambda x: x[1], reverse=True)

            for cake_type, quantity in sorted_cakes:
                lines.append(f"  {cake_type:<40} {quantity:>5} cakes")

        lines.append("-" * 70)
        lines.append(f"TOTAL CAKES TO PRODUCE: {sum(production_data.values())} cakes")

        if buffer_pct > 0:
            lines.append(f"(Includes {buffer_pct}% safety buffer)")

        lines.append("=" * 70)

        if self.state['include_details']:
            lines.append("")
            lines.append("ORDER DETAILS:")
            lines.append("-" * 70)

            for i, order in enumerate(orders[:20], 1):  # Show first 20
                order_date = order.get('order_date', 'N/A')
                if isinstance(order_date, datetime):
                    order_date = order_date.strftime('%Y-%m-%d')

                lines.append(
                    f"  {i}. {order.get('cake_type', 'Unknown'):<30} "
                    f"x{order.get('quantity', 1):<3} - {order_date}"
                )

            if len(orders) > 20:
                lines.append(f"  ... and {len(orders) - 20} more orders")

        lines.append("=" * 70)

        return "\n".join(lines)

    def _generate_html_report(
        self,
        production_data: Dict[str, int],
        start_date: datetime,
        end_date: datetime,
        orders: List[Dict]
    ) -> str:
        """Generate HTML report"""
        buffer_pct = self.state['buffer_percentage']

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Cake Production Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .summary {{ background-color: #e7f3e7; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .total {{ font-size: 1.2em; font-weight: bold; color: #4CAF50; }}
    </style>
</head>
<body>
    <h1>🎂 Cake Production Report</h1>

    <div class="summary">
        <p><strong>Report Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
        <p><strong>Period:</strong> {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}</p>
        <p><strong>Total Orders:</strong> {len(orders)}</p>
        <p class="total">TOTAL CAKES TO PRODUCE: {sum(production_data.values())} cakes</p>
        {f'<p><em>(Includes {buffer_pct}% safety buffer)</em></p>' if buffer_pct > 0 else ''}
    </div>

    <h2>Production Requirements</h2>
    <table>
        <tr>
            <th>Cake Type</th>
            <th>Quantity</th>
        </tr>
"""

        sorted_cakes = sorted(production_data.items(), key=lambda x: x[1], reverse=True)
        for cake_type, quantity in sorted_cakes:
            html += f"""
        <tr>
            <td>{cake_type}</td>
            <td>{quantity}</td>
        </tr>
"""

        html += """
    </table>
</body>
</html>
"""
        return html

    def _deliver_report(self, report: Dict[str, Any]) -> None:
        """Deliver the report via configured method"""
        delivery_method = self.state['delivery_method']

        if delivery_method == 'file':
            self._save_to_file(report)

        if delivery_method == 'email' or 'email' in str(delivery_method):
            self._send_email(report)

    def _save_to_file(self, report: Dict[str, Any]) -> None:
        """Save report to file"""
        output_file = self.state['output_file']

        # Add timestamp to filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        base, ext = os.path.splitext(output_file)
        timestamped_file = f"{base}_{timestamp}{ext}"

        with open(timestamped_file, 'w') as f:
            f.write(report['report_text'])

        self.logger.info(f"Report saved to {timestamped_file}")

    def _send_email(self, report: Dict[str, Any]) -> None:
        """Send report via email"""
        # This is a placeholder - integrate with your email system
        # You can use smtplib, SendGrid, AWS SES, etc.

        self.logger.info("Email delivery not implemented yet")
        self.logger.info("To implement: configure SMTP settings or email service")

        # Example implementation:
        # import smtplib
        # from email.mime.text import MIMEText
        #
        # msg = MIMEText(report['report_text'])
        # msg['Subject'] = f"Cake Production Report - {datetime.now().strftime('%Y-%m-%d')}"
        # msg['From'] = self.state['email_from']
        # msg['To'] = ', '.join(self.state['email_to'])
        #
        # with smtplib.SMTP(smtp_host, smtp_port) as server:
        #     server.send_message(msg)

    def get_next_report_date(self) -> datetime:
        """Calculate when the next report should run"""
        now = datetime.now()
        report_days = self.state['report_days']
        report_time = self.state['report_time']

        # Map day names to numbers
        day_map = {
            'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
            'Friday': 4, 'Saturday': 5, 'Sunday': 6
        }

        target_days = [day_map[day] for day in report_days if day in day_map]

        # Find next occurrence
        for days_ahead in range(8):
            check_date = now + timedelta(days=days_ahead)
            if check_date.weekday() in target_days:
                # Parse time
                hour, minute = map(int, report_time.split(':'))
                next_run = check_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

                if next_run > now:
                    return next_run

        return now  # Fallback

    def should_run_now(self) -> bool:
        """Check if report should run now"""
        now = datetime.now()
        next_run = self.get_next_report_date()

        # Run if within 5 minutes of scheduled time
        time_diff = abs((next_run - now).total_seconds())
        return time_diff < 300

    def start_scheduler(self) -> None:
        """
        Start the report scheduler

        Note: This requires the agent to keep running.
        For production, consider using a proper scheduler like:
        - Cron jobs
        - Celery
        - APScheduler
        - Cloud scheduler (AWS CloudWatch Events, Google Cloud Scheduler)
        """
        from task_scheduler import TaskSchedulerAgent

        scheduler = TaskSchedulerAgent()

        # Calculate when to run
        next_run = self.get_next_report_date()
        days_until = (next_run - datetime.now()).days

        # Schedule reports
        # Note: This is simplified - for production use proper scheduling
        scheduler.add_task(
            'production_report',
            self.execute,
            interval_hours=84,  # 3.5 days (twice a week)
            run_immediately=False
        )

        self.logger.info(f"Scheduler started. Next report: {next_run}")
        scheduler.start(blocking=True)


# Example usage
if __name__ == '__main__':
    print("=" * 70)
    print("Cake Production Reporter Agent - Example")
    print("=" * 70)

    # Example 1: Simple usage with sample data
    def fetch_sample_orders(start_date, end_date):
        """Simulate fetching orders from your system"""
        return [
            {'cake_type': 'Chocolate Cake', 'quantity': 5, 'order_date': '2025-11-10'},
            {'cake_type': 'Vanilla Cake', 'quantity': 3, 'order_date': '2025-11-10'},
            {'cake_type': 'Red Velvet Cake', 'quantity': 2, 'order_date': '2025-11-11'},
            {'cake_type': 'Chocolate Cake', 'quantity': 8, 'order_date': '2025-11-11'},
            {'cake_type': 'Carrot Cake', 'quantity': 4, 'order_date': '2025-11-12'},
            {'cake_type': 'Vanilla Cake', 'quantity': 6, 'order_date': '2025-11-12'},
            {'cake_type': 'Lemon Cake', 'quantity': 3, 'order_date': '2025-11-13'},
        ]

    # Create agent
    agent = CakeProductionReporterAgent({
        'report_days': ['Monday', 'Thursday'],
        'report_time': '08:00',
        'data_source': 'function',
        'fetch_function': fetch_sample_orders,
        'buffer_percentage': 10,  # 10% safety buffer
        'report_format': 'text',
        'delivery_method': 'file',
        'output_file': 'production_report.txt',
        'include_details': True
    })

    with agent:
        print("\nGenerating production report...")
        print()

        report = agent.execute()

        print(report['report_text'])
        print()
        print(f"Next scheduled report: {agent.get_next_report_date()}")
