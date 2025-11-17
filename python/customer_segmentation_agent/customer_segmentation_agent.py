"""Customer Segmentation Agent - Segment customers by behavior"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from base.agent import BaseAgent
from typing import List, Dict

class CustomerSegmentationAgent(BaseAgent):
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
    
    def execute(self, customers: List[Dict]) -> Dict:
        if not self._initialized: self.initialize()
        
        # Simple RFM segmentation fallback
        if not self.state['client']:
            segments = {"high_value": [], "medium_value": [], "at_risk": [], "new": []}
            for c in customers:
                total = c.get('total_spent', 0)
                if total > 500: segments["high_value"].append(c['email'])
                elif total > 100: segments["medium_value"].append(c['email'])
                else: segments["new"].append(c['email'])
            return {"segments": segments, "method": "simple_rfm"}
        
        # AI-powered segmentation
        customer_summary = "\n".join([
            f"- {c.get('email')}: ${c.get('total_spent', 0)}, {c.get('order_count', 0)} orders, last: {c.get('last_order_days', 'N/A')} days ago"
            for c in customers[:50]  # Limit to avoid token limits
        ])
        
        prompt = f"""Segment these {len(customers)} customers into meaningful groups:

{customer_summary}

Create 4-6 segments based on:
1. Purchase frequency
2. Total value
3. Recency
4. Product preferences (if available)

For each segment:
- Name
- Criteria
- Marketing recommendations
- Estimated size

Format as JSON."""
        
        try:
            resp = self.state['client'].messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=1500,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {"segmentation": resp.content[0].text, "total_customers": len(customers)}
        except:
            return {"error": "Segmentation failed"}

__all__ = ['CustomerSegmentationAgent']
