"""Code Review Agent - Automated code review with AI"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from base.agent import BaseAgent

class CodeReviewAgent(BaseAgent):
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
    
    def execute(self, code: str, language: str = 'python') -> dict:
        if not self._initialized: self.initialize()
        
        prompt = f"""Review this {language} code for:
1. Security issues
2. Performance problems
3. Best practices
4. Code style
5. Potential bugs

Code:
```{language}
{code}
```

Provide specific feedback with line references where possible."""
        
        if not self.state['client']:
            return {"review": "Code review requires LLM"}
        
        try:
            resp = self.state['client'].messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=2000,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {"review": resp.content[0].text, "language": language}
        except:
            return {"error": "Review failed"}

__all__ = ['CodeReviewAgent']
