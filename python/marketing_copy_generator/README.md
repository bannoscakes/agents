# Marketing Copy Generator

Generate professional marketing content for products, emails, ads, landing pages, and SEO. Multiple formats and tone options.

## Features

- Product descriptions (SEO-optimized)
- Email campaigns with subject lines
- Ad copy (Google, Facebook, Instagram)
- Landing page content with structure
- SEO content with keyword optimization
- Multiple tone options (professional, friendly, luxury, etc.)
- Target audience customization

## Quick Start

```python
from marketing_copy_generator import MarketingCopyGenerator

agent = MarketingCopyGenerator({
    'brand_voice': 'professional',
    'llm_provider': 'anthropic',
    'llm_api_key': 'your-api-key'
})

with agent:
    # Product description
    copy = agent.execute(
        content_type='product_description',
        product='Artisan Sourdough Bread',
        target_audience='health-conscious foodies',
        features=['organic', 'hand-crafted', '48-hour fermentation']
    )
    
    print(copy['copy'])
```

## Content Types

### 1. Product Description

```python
copy = agent.execute(
    content_type='product_description',
    product='Your Product',
    features=['feature1', 'feature2'],
    tone='friendly'
)
```

### 2. Email Campaign

```python
copy = agent.execute(
    content_type='email_campaign',
    product='Summer Sale',
    target_audience='existing customers'
)
# Includes: subject line, pre-header, body, CTA
```

### 3. Ad Copy

```python
copy = agent.execute(
    content_type='ad_copy',
    product='Your Product',
    platform='Google Ads',
    max_length=90
)
# Returns 3 variations
```

### 4. Landing Page

```python
copy = agent.execute(
    content_type='landing_page',
    product='Your Product',
    tone='professional'
)
# Includes: hero, benefits, social proof, FAQ, CTA
```

### 5. SEO Content

```python
copy = agent.execute(
    content_type='seo_content',
    product='Your Product',
    keyword='best artisan bread',
    word_count=800
)
# Includes: SEO title, meta description, structured content
```

## Tone Options

- `professional` - Formal, authoritative
- `friendly` - Warm, approachable
- `luxury` - Premium, exclusive
- `playful` - Fun, energetic
- `technical` - Detailed, informative

## Output Format

```json
{
  "copy": "Generated marketing copy...",
  "type": "product_description",
  "product": "Artisan Bread",
  "tone": "professional"
}
```

## Use Cases

- E-commerce product listings
- Marketing campaigns
- Social media ads
- Website content
- SEO optimization

## Cost: ~$0.005-0.02 per copy depending on length

## License

MIT
