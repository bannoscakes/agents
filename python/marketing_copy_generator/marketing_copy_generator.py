"""Marketing Copy Generator - Generate marketing content"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from base.agent import BaseAgent

class MarketingCopyGenerator(BaseAgent):
    def _initialize(self):
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self.state['brand_voice'] = self.config.get('brand_voice', 'professional')
        self._init_llm()
    
    def _init_llm(self):
        if self.state['llm_provider'] == 'anthropic':
            try:
                import anthropic
                self.state['client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
            except: self.state['client'] = None
    
    def execute(self, content_type: str, product: str, **kwargs) -> dict:
        """
        Generate marketing copy
        
        Types: product_description, email_campaign, ad_copy, landing_page, seo_content
        """
        if not self._initialized: self.initialize()
        
        templates = {
            "product_description": f"Introducing {product} - a premium product",
            "email_campaign": f"Subject: Special offer on {product}!\n\nDear customer...",
            "ad_copy": f"Get {product} today! Limited time offer.",
            "landing_page": f"# {product}\n\nThe best choice for...",
            "seo_content": f"{product} - Top Quality Product"
        }
        
        if not self.state['client']:
            return {"copy": templates.get(content_type, "Marketing copy"), "type": content_type}
        
        target_audience = kwargs.get('target_audience', 'general audience')
        key_features = kwargs.get('features', [])
        tone = kwargs.get('tone', self.state['brand_voice'])
        
        prompts = {
            "product_description": f"""Write a compelling product description for: {product}

Target audience: {target_audience}
Key features: {', '.join(key_features) if key_features else 'N/A'}
Tone: {tone}

Include:
- Attention-grabbing intro
- Key benefits (not just features)
- Social proof or trust elements
- Call-to-action

Length: 150-200 words""",
            
            "email_campaign": f"""Write an email campaign for: {product}

Target: {target_audience}
Tone: {tone}

Include:
- Subject line (under 50 chars)
- Pre-header text
- Email body (3-4 paragraphs)
- Clear CTA button text
- P.S. line

Make it personal and conversion-focused.""",
            
            "ad_copy": f"""Write 3 ad copy variations for: {product}

Platform: {kwargs.get('platform', 'Google Ads')}
Audience: {target_audience}
Max length: {kwargs.get('max_length', 90)} characters

Focus on benefits, use power words, include CTA.""",
            
            "landing_page": f"""Write landing page copy for: {product}

Sections needed:
1. Hero headline + subheadline
2. Problem statement
3. Solution (the product)
4. Key benefits (3-5)
5. Social proof
6. FAQ (3 questions)
7. Final CTA

Tone: {tone}
Audience: {target_audience}""",
            
            "seo_content": f"""Write SEO-optimized content for: {product}

Target keyword: {kwargs.get('keyword', product)}
Word count: {kwargs.get('word_count', 800)}

Include:
- SEO title (60 chars)
- Meta description (155 chars)
- H1, H2, H3 structure
- Natural keyword placement
- Internal linking suggestions"""
        }
        
        prompt = prompts.get(content_type, f"Write marketing copy for {product}")
        
        try:
            resp = self.state['client'].messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=1500,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {
                "copy": resp.content[0].text,
                "type": content_type,
                "product": product,
                "tone": tone
            }
        except:
            return {"error": "Generation failed"}

__all__ = ['MarketingCopyGenerator']
