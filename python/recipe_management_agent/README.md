# Recipe Management Agent

Intelligent recipe management system for bakeries and food businesses. Scale recipes, find substitutions, detect allergens, calculate nutrition, and optimize for waste reduction.

## Features

- **Scale Recipes** - Adjust to any serving size with precision
- **Ingredient Substitutions** - Vegan, gluten-free, allergy-friendly
- **Allergen Detection** - Identify common allergens automatically
- **Nutrition Calculation** - Estimate calories, protein, carbs, fat
- **Waste Reduction** - Optimize ingredient amounts
- **Recipe Search** - Find recipes by name or ingredient
- **Batch Production** - Recommendations for efficient production

## Quick Start

```python
from recipe_management_agent import RecipeManagementAgent

agent = RecipeManagementAgent()

recipe = {
    'name': 'Chocolate Cake',
    'servings': 8,
    'ingredients': [
        {'name': 'flour', 'amount': 2, 'unit': 'cups'},
        {'name': 'sugar', 'amount': 1.5, 'unit': 'cups'},
        {'name': 'eggs', 'amount': 3, 'unit': ''},
        {'name': 'milk', 'amount': 1, 'unit': 'cup'}
    ]
}

with agent:
    # Scale recipe
    scaled = agent.execute('scale', recipe=recipe, servings=12)
    
    # Detect allergens
    allergens = agent.execute('allergens', recipe=recipe)
    
    # Suggest substitution
    sub = agent.execute('substitute', ingredient='eggs', reason='vegan')
    
    # Calculate nutrition
    nutrition = agent.execute('nutrition', recipe=recipe)
```

## Actions

### Scale Recipe

```python
result = agent.execute('scale', recipe=recipe, servings=12)
# Automatically adjusts all ingredient amounts
```

### Ingredient Substitution

```python
result = agent.execute('substitute', ingredient='butter', reason='vegan')
# Suggests: coconut oil, vegan butter, applesauce
```

### Allergen Detection

```python
result = agent.execute('allergens', recipe=recipe)
# Returns: {
#   'allergens_detected': ['milk', 'eggs', 'wheat'],
#   'is_safe_for': {
#     'dairy_free': False,
#     'egg_free': False,
#     'gluten_free': False
#   }
# }
```

### Nutrition Calculation

```python
result = agent.execute('nutrition', recipe=recipe)
# Estimates per serving: calories, protein, carbs, fat, sugar
```

### Optimize for Waste

```python
result = agent.execute('optimize', recipe=recipe)
# Suggests package-aligned amounts and batch sizes
```

## Perfect for Bakeries!

Monitor ingredient usage, reduce waste, accommodate dietary restrictions, and scale production efficiently.

## License

MIT
