# Social Media Content Generator

AI-powered social media content creation for Instagram, Facebook, Twitter/X, and LinkedIn. Generate engaging captions, hashtags, and multi-platform campaigns automatically.

## Features

- Multi-platform support (Instagram, Facebook, Twitter, LinkedIn)
- AI-generated captions with brand voice
- Automatic hashtag generation (trending + niche)
- Platform-specific character limits
- Best posting time recommendations
- Multi-platform campaigns
- Emoji integration
- Call-to-action optimization

## Quick Start

```python
from social_media_generator import SocialMediaGenerator

agent = SocialMediaGenerator({
    'brand_voice': 'warm and friendly',
    'business_type': 'bakery',
    'target_audience': 'cake lovers'
})

with agent:
    post = agent.execute(
        topic="chocolate cake special",
        platform="instagram",
        content_type="promotional",
        product_name="Triple Chocolate Cake"
    )
    
    print(f"Caption: {post['caption']}")
    print(f"Hashtags: {post['hashtags']}")
    print(f"Best time: {post['best_time']}")
    print(f"\nFull post:\n{post['full_post']}")
```

## Output Example

```
Platform: instagram
Caption: 🍫 Indulge in pure chocolate bliss! Our Triple Chocolate Cake
is back and better than ever. Three layers of rich, moist chocolate
perfection. 

Tag someone who needs this in their life! 💕

Hashtags: ['#ChocolateCake', '#Bakery', '#Dessert', '#ChocolateLovers', 
          '#Homemade']
Best time: Wed-Fri 11AM-1PM
```

## Platform Support

| Platform | Max Caption | Hashtags | Special Features |
|----------|-------------|----------|------------------|
| Instagram | 2200 chars | 15 | Emojis, visual focus |
| Facebook | 500 chars | 5 | Link previews |
| Twitter/X | 280 chars | 3 | Concise, punchy |
| LinkedIn | 700 chars | 5 | Professional tone |

## Content Types

- `promotional` - Product/service promotion
- `educational` - Tips, how-tos, insights
- `engagement` - Questions, polls, community
- `announcement` - News, updates, launches

## Multi-Platform Campaigns

```python
campaign = agent.generate_campaign(
    topic="summer sale",
    platforms=['instagram', 'facebook', 'twitter', 'linkedin']
)

for platform, content in campaign.items():
    print(f"\n{platform.upper()}:")
    print(content['full_post'])
```

## Cost: Free with LLM API (~$0.001 per post)

## License

MIT
