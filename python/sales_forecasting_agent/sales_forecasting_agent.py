"""Sales Forecasting Agent - Predict sales trends"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from base.agent import BaseAgent
from typing import List, Dict

class SalesForecastingAgent(BaseAgent):
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
    
    def execute(self, historical_data: List[Dict], forecast_days: int = 30) -> Dict:
        if not self._initialized: self.initialize()
        
        # Simple moving average fallback
        if not self.state['client'] or len(historical_data) < 7:
            recent = historical_data[-7:] if len(historical_data) >= 7 else historical_data
            avg = sum(d.get('sales', 0) for d in recent) / len(recent) if recent else 0
            return {
                "forecast": [{"day": i+1, "predicted_sales": avg} for i in range(forecast_days)],
                "method": "simple_average",
                "confidence": "low"
            }
        
        data_str = "\n".join([f"Day {i+1}: ${d.get('sales', 0)}" for i, d in enumerate(historical_data[-30:])])
        
        prompt = f"""Analyze this sales data and predict next {forecast_days} days:

{data_str}

Identify:
1. Trends (growing/declining)
2. Seasonality patterns
3. Anomalies
4. Forecast for next {forecast_days} days

Format forecast as JSON array with 'day' and 'predicted_sales'."""
        
        try:
            resp = self.state['client'].messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=1500,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {"analysis": resp.content[0].text, "historical_days": len(historical_data)}
        except:
            return {"error": "Forecasting failed"}

__all__ = ['SalesForecastingAgent']
