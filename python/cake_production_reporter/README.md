# Cake Production Reporter Agent

A specialized production agent that generates reports twice a week showing how many cakes need to be cooked based on incoming orders.

## Features

- **Scheduled Reporting**: Runs twice a week on configurable days
- **Order Aggregation**: Groups orders by cake type
- **Safety Buffer**: Adds configurable buffer percentage to production quantities
- **Multiple Data Sources**: Database, API, CSV, or custom function
- **Multiple Formats**: Text, HTML, or JSON reports
- **Flexible Delivery**: Save to file, email, or custom delivery
- **History Tracking**: Keeps history of past reports

## Quick Start

```python
from cake_production_reporter import CakeProductionReporterAgent

# Define how to fetch your orders
def fetch_orders(start_date, end_date):
    # Your logic to fetch orders from database/API
    return [
        {'cake_type': 'Chocolate Cake', 'quantity': 5, 'order_date': '2025-11-10'},
        {'cake_type': 'Vanilla Cake', 'quantity': 3, 'order_date': '2025-11-10'},
        # ... more orders
    ]

# Create agent
agent = CakeProductionReporterAgent({
    'report_days': ['Monday', 'Thursday'],  # Twice a week
    'report_time': '08:00',
    'data_source': 'function',
    'fetch_function': fetch_orders,
    'buffer_percentage': 10,  # 10% safety buffer
    'output_file': 'production_report.txt'
})

# Generate report
with agent:
    report = agent.execute()
    print(report['report_text'])
```

## Configuration Options

### Scheduling

- `report_days` (list): Days to run report (e.g., `['Monday', 'Thursday']`)
- `report_time` (str): Time to run report (e.g., `'08:00'`)
- `timezone` (str): Timezone for scheduling (default: `'UTC'`)

### Data Source

Choose one:

**Option 1: Custom Function**
```python
{
    'data_source': 'function',
    'fetch_function': your_fetch_function
}
```

**Option 2: Database**
```python
{
    'data_source': 'database',
    'db_connection': db_connection,
    'db_query': 'SELECT cake_type, quantity, order_date FROM orders WHERE ...'
}
```

**Option 3: API**
```python
{
    'data_source': 'api',
    'api_endpoint': 'https://your-api.com/orders',
    'api_headers': {'Authorization': 'Bearer token'}
}
```

### Report Configuration

- `report_format` (str): Format - `'text'`, `'html'`, or `'json'` (default: `'text'`)
- `include_details` (bool): Include order details in report (default: `True`)
- `buffer_percentage` (int): Safety buffer % to add to quantities (default: `10`)

### Delivery

- `delivery_method` (str): `'file'` or `'email'`
- `output_file` (str): Path to save report (default: `'production_report.txt'`)
- `email_to` (list): Email addresses to send report to
- `email_from` (str): Sender email address

## Order Data Format

Your data source should return a list of dictionaries with:

```python
[
    {
        'cake_type': 'Chocolate Cake',    # required
        'quantity': 5,                     # required
        'order_date': '2025-11-10'        # required (string or datetime)
    },
    # ... more orders
]
```

## Example Report Output

```
======================================================================
CAKE PRODUCTION REPORT
======================================================================
Report Generated: 2025-11-13 08:00
Period: 2025-11-06 to 2025-11-13
Total Orders: 15

PRODUCTION REQUIREMENTS:
----------------------------------------------------------------------
  Chocolate Cake                          14 cakes
  Vanilla Cake                            10 cakes
  Red Velvet Cake                          6 cakes
  Carrot Cake                              4 cakes
  Lemon Cake                               3 cakes
----------------------------------------------------------------------
TOTAL CAKES TO PRODUCE: 37 cakes
(Includes 10% safety buffer)
======================================================================
```

## Integration Examples

### Example 1: With Database

```python
import sqlite3

# Connect to your database
conn = sqlite3.connect('orders.db')

agent = CakeProductionReporterAgent({
    'report_days': ['Monday', 'Thursday'],
    'report_time': '08:00',
    'data_source': 'database',
    'db_connection': conn,
    'db_query': '''
        SELECT cake_type, quantity, order_date
        FROM orders
        WHERE order_date >= ? AND order_date <= ?
        AND status = 'confirmed'
    ''',
    'buffer_percentage': 15,
    'output_file': 'reports/production.txt'
})

# Run manually
report = agent.execute()
```

### Example 2: With API

```python
agent = CakeProductionReporterAgent({
    'report_days': ['Monday', 'Thursday'],
    'data_source': 'api',
    'api_endpoint': 'https://your-bakery.com/api/orders',
    'api_headers': {
        'Authorization': 'Bearer your-api-token',
        'Content-Type': 'application/json'
    },
    'buffer_percentage': 10,
    'report_format': 'html',
    'output_file': 'reports/production.html'
})

report = agent.execute()
```

### Example 3: With Cron Job

Save as `generate_report.py`:

```python
#!/usr/bin/env python3
from cake_production_reporter import CakeProductionReporterAgent
import sys

def fetch_orders(start_date, end_date):
    # Your fetch logic
    pass

agent = CakeProductionReporterAgent({
    'report_days': ['Monday', 'Thursday'],
    'report_time': '08:00',
    'data_source': 'function',
    'fetch_function': fetch_orders,
    'buffer_percentage': 10,
    'output_file': '/var/reports/production.txt'
})

try:
    report = agent.execute()
    print("Report generated successfully")
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
```

Setup cron:
```bash
# Run Monday and Thursday at 8 AM
0 8 * * 1,4 /usr/bin/python3 /path/to/generate_report.py
```

### Example 4: Email Delivery

```python
agent = CakeProductionReporterAgent({
    'report_days': ['Monday', 'Thursday'],
    'data_source': 'function',
    'fetch_function': fetch_orders,
    'delivery_method': 'email',
    'email_to': ['production@bakery.com', 'manager@bakery.com'],
    'email_from': 'reports@bakery.com',
    # Configure email settings in your environment
})

report = agent.execute()
```

## Methods

### execute(start_date=None, end_date=None, custom_orders=None)

Generate a production report.

**Parameters:**
- `start_date` (datetime, optional): Start date for orders
- `end_date` (datetime, optional): End date for orders
- `custom_orders` (list, optional): Provide orders directly

**Returns:**
- Dictionary with report data and formatted text

### get_next_report_date()

Calculate when the next report should run based on schedule.

**Returns:**
- datetime of next scheduled report

### should_run_now()

Check if the report should run now based on schedule.

**Returns:**
- bool

## Production Deployment

### Option 1: Cron Job (Recommended)

Best for simple, reliable scheduling on a server.

### Option 2: Systemd Timer

For Linux systems with systemd.

### Option 3: Task Scheduler

For Windows systems.

### Option 4: Cloud Scheduler

- AWS CloudWatch Events
- Google Cloud Scheduler
- Azure Logic Apps

### Option 5: Docker Container

Run as a containerized service that checks the schedule periodically.

## Tips

1. **Test First**: Run manually before scheduling
2. **Monitor**: Check that reports are generating correctly
3. **Buffer**: Adjust buffer percentage based on your needs
4. **Backup**: Keep report history for reference
5. **Notifications**: Add alerts if report generation fails

## Troubleshooting

**No orders appearing:**
- Check your date range
- Verify data source connection
- Check fetch function returns correct format

**Report not running on schedule:**
- Use external scheduler (cron) instead of built-in
- Check system time and timezone
- Verify scheduler is running

**Wrong quantities:**
- Verify order data is correct
- Check buffer percentage setting
- Ensure no duplicate orders

## Support

For issues or questions about this agent, refer to the main repository documentation.
