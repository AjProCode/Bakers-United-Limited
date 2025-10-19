import React, { useState, useEffect } from 'react';
import type { Recipe, RecipeState } from './types';
import FileUpload from './components/FileUpload';
import RecipeDisplay from './components/RecipeDisplay';
import RecipeList from './components/RecipeList';
import { ChefHatIcon, ChevronLeftIcon } from './components/Icons';
import { listenToRecipes, addRecipes, updateRecipe, deleteRecipe } from './services/firebaseService';

const App: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeState[]>([]);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Listen to Firebase for recipe changes
  useEffect(() => {
    const unsubscribe = listenToRecipes((recipesFromDb) => {
      setRecipes(recipesFromDb);
      setIsAppLoading(false);
    });
    
    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  const handleGoToList = () => {
    setActiveRecipeId(null);
  };

  const handleRecipesExtracted = async (newRecipes: Recipe[]) => {
    try {
      await addRecipes(newRecipes);
      setActiveRecipeId(null); // Go back to the list view to see all new recipes
    } catch (e) {
      console.error("Failed to save recipes to Firebase", e);
      setError("There was a problem saving your recipes. Please try again.");
    }
  };

  const handleUpdateActiveRecipe = (updates: Partial<Omit<RecipeState, 'recipe' | 'id'>>) => {
    if (activeRecipeId) {
      updateRecipe(activeRecipeId, updates);
    }
  };

  const handleDeleteRecipe = (idToDelete: string) => {
    if (window.confirm("Are you sure you want to delete this recipe? This will delete it for everyone.")) {
      deleteRecipe(idToDelete);
      if (activeRecipeId === idToDelete) {
        setActiveRecipeId(null);
      }
    }
  };
  
  const activeRecipe = recipes.find(r => r.id === activeRecipeId);

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
              <ChefHatIcon className="h-16 w-16 text-amber-600 animate-pulse" />
              <p className="text-lg text-stone-600 font-semibold">Connecting to Recipe Library...</p>
          </div>
      </div>
    );
  }

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
                setIsLoading={setIsUploading}
                isLoading={isUploading}
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