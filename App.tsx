import React, { useState, useEffect } from 'react';
import type { Recipe, RecipeState } from './types';
import FileUpload from './components/FileUpload';
import RecipeDisplay from './components/RecipeDisplay';
import RecipeList from './components/RecipeList';
import { ChefHatIcon, ChevronLeftIcon } from './components/Icons';

const LOCAL_STORAGE_KEY = 'bakers-recipes-list';

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeState[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load recipes from local storage on initial mount
  useEffect(() => {
    try {
      const savedRecipesJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedRecipesJSON) {
        setRecipes(JSON.parse(savedRecipesJSON));
      }
    } catch (e) {
      console.error("Failed to load recipes from local storage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  // Save recipes to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recipes));
    } catch (e)      {
      console.error("Failed to save recipes to local storage", e);
    }
  }, [recipes]);

  const handleGoToList = () => {
    setActiveRecipeId(null);
  };

  const handleRecipesExtracted = (newRecipes: Recipe[]) => {
    const newRecipeStates: RecipeState[] = newRecipes.map((recipe, index) => ({
      id: `recipe-${Date.now()}-${index}`,
      recipe: recipe,
      multiplier: 1,
      rating: 0,
      notes: '',
      cost: 0,
      checkedIngredients: [],
    }));
    
    const updatedRecipes = [...recipes, ...newRecipeStates];
    setRecipes(updatedRecipes);
    setActiveRecipeId(null); // Go back to the list view to see all new recipes
  };

  const handleUpdateActiveRecipe = (updates: Partial<Omit<RecipeState, 'recipe' | 'id'>>) => {
    setRecipes(prevRecipes =>
      prevRecipes.map(r =>
        r.id === activeRecipeId ? { ...r, ...updates } : r
      )
    );
  };

  const handleDeleteRecipe = (idToDelete: string) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== idToDelete));
      if (activeRecipeId === idToDelete) {
        setActiveRecipeId(null);
      }
    }
  };
  
  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800 font-sans">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <ChefHatIcon className="h-8 w-8 text-amber-600" />
              <h1 className="text-2xl font-bold text-stone-700 tracking-tight">
                Baker's Digital Recipe Book
              </h1>
            </div>
            {activeRecipe && (
              <button
                onClick={handleGoToList}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200 text-sm font-semibold shadow"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span>Recipe Library</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {activeRecipe ? (
          <RecipeDisplay recipeState={activeRecipe} onUpdate={handleUpdateActiveRecipe} />
        ) : (
          <div>
            <div className="mb-12">
              <FileUpload
                onRecipesExtracted={handleRecipesExtracted}
                setError={setError}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
                error={error}
              />
            </div>
            <RecipeList
              recipes={recipes}
              onSelectRecipe={setActiveRecipeId}
              onDeleteRecipe={handleDeleteRecipe}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;