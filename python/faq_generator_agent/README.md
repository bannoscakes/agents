# FAQ Generator Agent

Automatically generate FAQs from documentation, content, or customer inquiries. Perfect for knowledge bases, help centers, and documentation.

## Features

- Extract common questions from content
- Generate clear, concise answers
- JSON output format for easy integration
- Customizable number of FAQs
- Works with any text content

## Quick Start

```python
from faq_generator_agent import FAQGeneratorAgent

agent = FAQGeneratorAgent({
    'llm_provider': 'anthropic',
    'llm_api_key': 'your-api-key'
})

content = """
Our bakery offers custom cakes for all occasions. We require 48 hours notice
for custom orders. Delivery is available within 10 miles for orders over $50.
We use organic ingredients and can accommodate dietary restrictions.
"""

with agent:
    faqs = agent.execute(content, num_faqs=5)
    
    for faq in faqs:
        print(f"Q: {faq['question']}")
        print(f"A: {faq['answer']}\n")
```

## Output Format

```json
[
  {
    "question": "How much notice do you need for custom cakes?",
    "answer": "We require 48 hours notice for all custom cake orders."
  },
  {
    "question": "Do you offer delivery?",
    "answer": "Yes, we offer delivery within 10 miles for orders over $50."
  }
]
```

## Use Cases

- Generate FAQs from product documentation
- Create help center content
- Update FAQs from customer support tickets
- Onboarding documentation

## License

MIT
