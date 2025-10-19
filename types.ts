export interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
}

export interface RecipeState {
  id: string; // Unique identifier for each recipe instance
  recipe: Recipe;
  multiplier: number;
  rating: number;
  notes: string;
  cost: number;
  checkedIngredients: string[];
}

export interface ImagePart {
    inlineData: {
        mimeType: string;
        data: string;
    }
}
