"""
Social Media Content Generator - Create engaging social media posts

Generate posts for Instagram, Facebook, Twitter/X, LinkedIn with captions,
hashtags, and scheduling suggestions
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import List, Dict, Any, Optional
import json


class SocialMediaGenerator(BaseAgent):
    """Generate social media content for multiple platforms"""

    def _initialize(self) -> None:
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self.state['model'] = self.config.get('model', 'claude-3-5-sonnet-20241022')
        self.state['brand_voice'] = self.config.get('brand_voice', 'friendly and engaging')
        self.state['target_audience'] = self.config.get('target_audience', 'general audience')
        self.state['business_type'] = self.config.get('business_type', 'business')
        
        self._init_llm()

    def _init_llm(self) -> None:
        provider = self.state['llm_provider']
        if provider == 'anthropic':
            try:
                import anthropic
                self.state['llm_client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
            except ImportError:
                self.state['llm_client'] = None
        else:
            self.state['llm_client'] = None

    def execute(
        self,
        topic: str,
        platform: str = 'instagram',
        content_type: str = 'promotional',
        product_name: Optional[str] = None,
        image_description: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate social media content
        
        Args:
            topic: Main topic/theme
            platform: instagram, facebook, twitter, linkedin
            content_type: promotional, educational, engagement, announcement
            product_name: Product name (optional)
            image_description: Description of accompanying image
            
        Returns:
            Dictionary with caption, hashtags, best_time, char_count
        """
        if not self._initialized:
            self.initialize()

        # Generate caption
        caption = self._generate_caption(topic, platform, content_type, product_name, image_description)
        
        # Generate hashtags
        hashtags = self._generate_hashtags(topic, platform)
        
        # Suggest posting time
        best_time = self._suggest_posting_time(platform, content_type)
        
        # Platform-specific formatting
        formatted_post = self._format_for_platform(caption, hashtags, platform)
        
        return {
            'platform': platform,
            'caption': caption,
            'hashtags': hashtags,
            'full_post': formatted_post,
            'best_time': best_time,
            'char_count': len(formatted_post),
            'content_type': content_type
        }

    def _generate_caption(self, topic, platform, content_type, product_name, image_desc) -> str:
        if not self.state['llm_client']:
            return f"Check out our amazing {topic}! #awesome #{topic.replace(' ', '')}"

        platform_limits = {
            'instagram': 2200,
            'twitter': 280,
            'facebook': 500,
            'linkedin': 700
        }

        prompt = f"""Create a {content_type} social media caption for {platform}.

Topic: {topic}
Product: {product_name or 'N/A'}
Image: {image_desc or 'N/A'}
Brand Voice: {self.state['brand_voice']}
Target Audience: {self.state['target_audience']}
Business: {self.state['business_type']}

Requirements:
- Max {platform_limits.get(platform, 500)} characters
- Engaging and {self.state['brand_voice']}
- Include call-to-action if promotional
- Do NOT include hashtags (they'll be added separately)
- Use emojis appropriately for {platform}

Write just the caption:"""

        try:
            response = self.state['llm_client'].messages.create(
                model=self.state['model'],
                max_tokens=300,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return response.content[0].text.strip()
        except:
            return f"Exciting news about {topic}! Learn more."

    def _generate_hashtags(self, topic: str, platform: str) -> List[str]:
        counts = {'instagram': 15, 'facebook': 5, 'twitter': 3, 'linkedin': 5}
        max_tags = counts.get(platform, 5)
        
        if not self.state['llm_client']:
            return [f"#{topic.replace(' ', '')}", "#business", "#today"]

        prompt = f"""Generate {max_tags} relevant hashtags for a {platform} post about: {topic}

Requirements:
- Mix of popular and niche hashtags
- Relevant to {self.state['business_type']}
- No spaces in hashtags
- Return ONLY hashtags, one per line, starting with #"""

        try:
            response = self.state['llm_client'].messages.create(
                model=self.state['model'],
                max_tokens=150,
                messages=[{'role': 'user', 'content': prompt}]
            )
            tags = [line.strip() for line in response.content[0].text.strip().split('\n') if line.strip().startswith('#')]
            return tags[:max_tags]
        except:
            return [f"#{topic.replace(' ', '')}"]

    def _suggest_posting_time(self, platform: str, content_type: str) -> str:
        best_times = {
            'instagram': 'Wed-Fri 11AM-1PM',
            'facebook': 'Wed 1-3PM',
            'twitter': 'Wed 9-11AM',
            'linkedin': 'Tue-Wed 10AM-12PM'
        }
        return best_times.get(platform, 'Weekdays 10AM-2PM')

    def _format_for_platform(self, caption: str, hashtags: List[str], platform: str) -> str:
        if platform == 'instagram':
            return f"{caption}\n\n{''.join(hashtags)}"
        elif platform == 'twitter':
            hash_str = ' '.join(hashtags[:3])
            return f"{caption} {hash_str}"
        else:
            return f"{caption}\n\n{' '.join(hashtags)}"

    def generate_campaign(self, topic: str, platforms: List[str]) -> Dict[str, Any]:
        """Generate content for multiple platforms"""
        return {
            platform: self.execute(topic, platform)
            for platform in platforms
        }


if __name__ == '__main__':
    print("Social Media Content Generator Example")
    
    agent = SocialMediaGenerator({
        'brand_voice': 'warm and friendly',
        'business_type': 'bakery',
        'target_audience': 'cake lovers'
    })

    with agent:
        result = agent.execute(
            topic="chocolate cake special",
            platform="instagram",
            content_type="promotional",
            product_name="Triple Chocolate Cake"
        )
        
        print(f"\nPlatform: {result['platform']}")
        print(f"Caption: {result['caption']}")
        print(f"Hashtags: {result['hashtags']}")
        print(f"Best time: {result['best_time']}")
        print(f"\nFull post:\n{result['full_post']}")
