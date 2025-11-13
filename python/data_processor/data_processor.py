"""
Data Processor Agent - Data transformation and analysis

This agent handles data processing tasks like:
- Data validation
- Transformation
- Filtering
- Aggregation
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import Any, Dict, List, Callable, Optional
import json
import csv


class DataProcessorAgent(BaseAgent):
    """
    Agent for processing and transforming data

    Features:
    - Chain multiple transformations
    - Built-in validators
    - Data filtering
    - Format conversion (JSON, CSV, etc.)
    - Statistics and aggregation

    Example:
        processor = DataProcessorAgent()
        processor.add_transformation(lambda x: x * 2)
        result = processor.execute([1, 2, 3, 4, 5])
        # Result: [2, 4, 6, 8, 10]
    """

    def _initialize(self) -> None:
        """Initialize data processor"""
        self.state['transformations'] = []
        self.state['validators'] = []
        self.state['filters'] = []
        self.state['stats'] = {}

    def add_transformation(self, func: Callable) -> 'DataProcessorAgent':
        """Add a transformation function"""
        self.state['transformations'].append(func)
        return self

    def add_validator(self, func: Callable) -> 'DataProcessorAgent':
        """Add a validation function"""
        self.state['validators'].append(func)
        return self

    def add_filter(self, func: Callable) -> 'DataProcessorAgent':
        """Add a filter function"""
        self.state['filters'].append(func)
        return self

    def execute(self, data: Any, **kwargs) -> Any:
        """
        Process data through the pipeline

        Args:
            data: Input data
            **kwargs: Additional options

        Returns:
            Processed data
        """
        if not self._initialized:
            self.initialize()

        result = data
        self.logger.info(f"Processing data: {type(data)}")

        # Validate
        if kwargs.get('validate', True):
            self._validate(result)

        # Filter
        if self.state['filters']:
            result = self._apply_filters(result)

        # Transform
        if self.state['transformations']:
            result = self._apply_transformations(result)

        # Calculate stats if requested
        if kwargs.get('calculate_stats', False):
            self.state['stats'] = self._calculate_stats(result)

        self.logger.info("Data processing completed")
        return result

    def _validate(self, data: Any) -> None:
        """Run all validators on data"""
        for validator in self.state['validators']:
            if not validator(data):
                raise ValueError(f"Validation failed: {validator.__name__}")

    def _apply_filters(self, data: Any) -> Any:
        """Apply all filters to data"""
        if isinstance(data, list):
            result = data
            for filter_func in self.state['filters']:
                result = [item for item in result if filter_func(item)]
            return result
        else:
            for filter_func in self.state['filters']:
                if not filter_func(data):
                    return None
            return data

    def _apply_transformations(self, data: Any) -> Any:
        """Apply all transformations to data"""
        result = data

        for transform in self.state['transformations']:
            if isinstance(result, list):
                result = [transform(item) for item in result]
            else:
                result = transform(result)

        return result

    def _calculate_stats(self, data: Any) -> Dict[str, Any]:
        """Calculate basic statistics on data"""
        if not isinstance(data, list):
            return {'type': type(data).__name__}

        stats = {
            'count': len(data),
            'type': type(data[0]).__name__ if data else 'empty'
        }

        # Numeric stats
        if data and isinstance(data[0], (int, float)):
            stats['min'] = min(data)
            stats['max'] = max(data)
            stats['sum'] = sum(data)
            stats['avg'] = sum(data) / len(data)

        return stats

    def load_json(self, filepath: str) -> Any:
        """Load data from JSON file"""
        with open(filepath, 'r') as f:
            return json.load(f)

    def save_json(self, data: Any, filepath: str) -> None:
        """Save data to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        self.logger.info(f"Data saved to {filepath}")

    def load_csv(self, filepath: str, **kwargs) -> List[Dict]:
        """Load data from CSV file"""
        with open(filepath, 'r') as f:
            reader = csv.DictReader(f, **kwargs)
            return list(reader)

    def save_csv(self, data: List[Dict], filepath: str, **kwargs) -> None:
        """Save data to CSV file"""
        if not data:
            return

        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys(), **kwargs)
            writer.writeheader()
            writer.writerows(data)
        self.logger.info(f"Data saved to {filepath}")

    def get_stats(self) -> Dict[str, Any]:
        """Get calculated statistics"""
        return self.state['stats']

    def reset_pipeline(self) -> None:
        """Clear all transformations, validators, and filters"""
        self.state['transformations'] = []
        self.state['validators'] = []
        self.state['filters'] = []
        self.logger.info("Pipeline reset")


# Example usage
if __name__ == '__main__':
    print("Data Processor Agent Example")
    print("=" * 50)

    # Example 1: Simple transformations
    processor = DataProcessorAgent()
    processor.add_transformation(lambda x: x * 2)
    processor.add_transformation(lambda x: x + 10)

    data = [1, 2, 3, 4, 5]
    result = processor.execute(data, calculate_stats=True)
    print(f"\nOriginal: {data}")
    print(f"Transformed: {result}")
    print(f"Stats: {processor.get_stats()}")

    # Example 2: Filtering and validation
    processor2 = DataProcessorAgent()
    processor2.add_filter(lambda x: x > 5)
    processor2.add_transformation(lambda x: x ** 2)

    data2 = [1, 3, 5, 7, 9, 11]
    result2 = processor2.execute(data2)
    print(f"\nOriginal: {data2}")
    print(f"Filtered (>5) and squared: {result2}")

    # Example 3: Processing dictionaries
    processor3 = DataProcessorAgent()
    processor3.add_filter(lambda x: x['age'] >= 18)
    processor3.add_transformation(lambda x: {**x, 'adult': True})

    data3 = [
        {'name': 'Alice', 'age': 25},
        {'name': 'Bob', 'age': 17},
        {'name': 'Charlie', 'age': 30}
    ]
    result3 = processor3.execute(data3)
    print(f"\nOriginal: {data3}")
    print(f"Adults only: {result3}")
