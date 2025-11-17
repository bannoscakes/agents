"""FAQ Generator - Auto-generate FAQs from documentation"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from base.agent import BaseAgent
from typing import List, Dict

class FAQGeneratorAgent(BaseAgent):
    def _initialize(self):
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self._init_llm()
    
    def _init_llm(self):
        if self.state['llm_provider'] == 'anthropic':
            try:
                import anthropic
                self.state['client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
            except: self.state['client'] = None
    
    def execute(self, content: str, num_faqs: int = 10) -> List[Dict]:
        if not self._initialized: self.initialize()
        prompt = f"""Generate {num_faqs} frequently asked questions from this content:

{content[:3000]}

Format as JSON array with "question" and "answer" fields."""
        
        if not self.state['client']:
            return [{"question": "What is this?", "answer": "Generated from content"}]
        
        try:
            resp = self.state['client'].messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=2000,
                messages=[{'role': 'user', 'content': prompt}]
            )
            import json
            return json.loads(resp.content[0].text)
        except:
            return [{"error": "Could not generate FAQs"}]

__all__ = ['FAQGeneratorAgent']
