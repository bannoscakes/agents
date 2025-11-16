"""
Recipe Management Agent - Manage bakery recipes with AI assistance

Store, search, scale recipes, suggest substitutions, detect allergens,
calculate nutrition, and optimize ingredient usage
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import List, Dict, Any, Optional
import json


class RecipeManagementAgent(BaseAgent):
    """Intelligent recipe management for bakeries"""

    def _initialize(self) -> None:
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self.state['model'] = self.config.get('model', 'claude-3-5-sonnet-20241022')
        self.state['recipes'] = self.config.get('recipes', {})
        self.state['allergens'] = ['milk', 'eggs', 'wheat', 'nuts', 'soy', 'fish']
        self._init_llm()

    def _init_llm(self) -> None:
        if self.state['llm_provider'] == 'anthropic':
            try:
                import anthropic
                self.state['llm_client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
            except ImportError:
                self.state['llm_client'] = None

    def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        """
        Execute recipe management action
        
        Actions:
        - scale: Scale recipe quantities
        - substitute: Suggest ingredient substitutions
        - allergens: Detect allergens
        - nutrition: Calculate nutrition (estimated)
        - search: Search recipes
        - optimize: Optimize for waste reduction
        """
        if not self._initialized:
            self.initialize()

        actions = {
            'scale': self.scale_recipe,
            'substitute': self.suggest_substitution,
            'allergens': self.detect_allergens,
            'nutrition': self.calculate_nutrition,
            'search': self.search_recipes,
            'optimize': self.optimize_recipe
        }

        func = actions.get(action)
        if func:
            return func(**kwargs)
        else:
            return {'error': f'Unknown action: {action}'}

    def scale_recipe(self, recipe: Dict, servings: int, original_servings: int = None) -> Dict:
        """Scale recipe to different serving size"""
        if not original_servings:
            original_servings = recipe.get('servings', 1)
        
        scale_factor = servings / original_servings
        
        scaled_ingredients = []
        for ingredient in recipe.get('ingredients', []):
            if 'amount' in ingredient:
                scaled = {
                    'name': ingredient['name'],
                    'amount': ingredient['amount'] * scale_factor,
                    'unit': ingredient.get('unit', ''),
                    'original_amount': ingredient['amount']
                }
                scaled_ingredients.append(scaled)
        
        return {
            'recipe_name': recipe.get('name', 'Recipe'),
            'original_servings': original_servings,
            'new_servings': servings,
            'scale_factor': scale_factor,
            'ingredients': scaled_ingredients
        }

    def suggest_substitution(self, ingredient: str, reason: str = 'allergy') -> Dict:
        """Suggest ingredient substitutions"""
        if not self.state['llm_client']:
            common_subs = {
                'butter': 'coconut oil or margarine',
                'milk': 'almond milk or oat milk',
                'eggs': 'flax eggs or applesauce',
                'flour': 'almond flour or gluten-free flour'
            }
            return {'ingredient': ingredient, 'substitutes': [common_subs.get(ingredient.lower(), 'no substitution found')]}

        prompt = f"""Suggest 3 substitutions for {ingredient} in baking.
Reason: {reason}

For each substitute, provide:
1. Name
2. Ratio (e.g., "1:1" or "1 cup = 3/4 cup substitute")
3. Notes on how it affects the recipe

Format as JSON array."""

        try:
            response = self.state['llm_client'].messages.create(
                model=self.state['model'],
                max_tokens=400,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {'ingredient': ingredient, 'reason': reason, 'substitutes': response.content[0].text}
        except:
            return {'ingredient': ingredient, 'substitutes': ['Unable to generate substitutions']}

    def detect_allergens(self, recipe: Dict) -> Dict:
        """Detect common allergens in recipe"""
        ingredients_text = ' '.join([ing.get('name', '').lower() for ing in recipe.get('ingredients', [])])
        
        detected = []
        for allergen in self.state['allergens']:
            if allergen in ingredients_text:
                detected.append(allergen)
        
        is_safe = {
            'dairy_free': 'milk' not in detected and 'butter' not in ingredients_text,
            'egg_free': 'eggs' not in detected,
            'nut_free': 'nuts' not in detected and 'almond' not in ingredients_text,
            'gluten_free': 'wheat' not in detected and 'flour' not in ingredients_text
        }
        
        return {
            'recipe_name': recipe.get('name'),
            'allergens_detected': detected,
            'is_safe_for': is_safe,
            'warning': 'Always verify ingredients for allergen safety' if detected else None
        }

    def calculate_nutrition(self, recipe: Dict) -> Dict:
        """Estimate nutrition info"""
        if not self.state['llm_client']:
            return {'message': 'Nutrition calculation requires LLM integration'}

        ingredients_list = '\n'.join([f"- {ing.get('amount', '')} {ing.get('unit', '')} {ing.get('name', '')}" 
                                       for ing in recipe.get('ingredients', [])])

        prompt = f"""Estimate nutrition information per serving for this recipe:

{recipe.get('name', 'Recipe')}
Servings: {recipe.get('servings', 1)}

Ingredients:
{ingredients_list}

Provide estimates for:
- Calories
- Protein (g)
- Carbs (g)
- Fat (g)
- Sugar (g)

Format as JSON."""

        try:
            response = self.state['llm_client'].messages.create(
                model=self.state['model'],
                max_tokens=300,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {'recipe_name': recipe.get('name'), 'nutrition': response.content[0].text, 'note': 'Estimates only'}
        except:
            return {'error': 'Could not calculate nutrition'}

    def search_recipes(self, query: str) -> List[Dict]:
        """Search stored recipes"""
        results = []
        query_lower = query.lower()
        
        for name, recipe in self.state['recipes'].items():
            if query_lower in name.lower():
                results.append(recipe)
        
        return results

    def optimize_recipe(self, recipe: Dict) -> Dict:
        """Optimize recipe for waste reduction"""
        if not self.state['llm_client']:
            return {'message': 'Optimization requires LLM'}

        ingredients_list = '\n'.join([f"- {ing.get('amount', '')} {ing.get('unit', '')} {ing.get('name', '')}" 
                                       for ing in recipe.get('ingredients', [])])

        prompt = f"""Analyze this recipe for waste reduction opportunities:

{ingredients_list}

Suggest:
1. Ingredient amounts that align with common package sizes
2. Ways to use leftover ingredients
3. Batch production recommendations

Be specific and practical."""

        try:
            response = self.state['llm_client'].messages.create(
                model=self.state['model'],
                max_tokens=500,
                messages=[{'role': 'user', 'content': prompt}]
            )
            return {'recipe_name': recipe.get('name'), 'optimization_suggestions': response.content[0].text}
        except:
            return {'error': 'Could not optimize recipe'}


if __name__ == '__main__':
    print("Recipe Management Agent Example\n")
    
    agent = RecipeManagementAgent()
    
    sample_recipe = {
        'name': 'Chocolate Cake',
        'servings': 8,
        'ingredients': [
            {'name': 'flour', 'amount': 2, 'unit': 'cups'},
            {'name': 'sugar', 'amount': 1.5, 'unit': 'cups'},
            {'name': 'eggs', 'amount': 3, 'unit': ''},
            {'name': 'milk', 'amount': 1, 'unit': 'cup'},
            {'name': 'butter', 'amount': 0.5, 'unit': 'cup'}
        ]
    }
    
    with agent:
        # Scale recipe
        print("1. Scaling recipe:")
        result = agent.execute('scale', recipe=sample_recipe, servings=12)
        print(f"   Scale factor: {result['scale_factor']}")
        print(f"   First ingredient: {result['ingredients'][0]}")
        
        # Detect allergens
        print("\n2. Allergen detection:")
        result = agent.execute('allergens', recipe=sample_recipe)
        print(f"   Allergens: {result['allergens_detected']}")
        print(f"   Dairy-free: {result['is_safe_for']['dairy_free']}")
        
        # Suggest substitution
        print("\n3. Substitution:")
        result = agent.execute('substitute', ingredient='eggs', reason='vegan')
        print(f"   For {result['ingredient']}: {result['substitutes'][:100]}...")
