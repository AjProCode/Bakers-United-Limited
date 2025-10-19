import React from 'react';
import type { RecipeState } from '../types';
import { StarIcon, TrashIcon } from './Icons';

interface RecipeListProps {
  recipes: RecipeState[];
  onSelectRecipe: (id: string) => void;
  onDeleteRecipe: (id: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, onDeleteRecipe }) => {
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click when deleting
    onDeleteRecipe(id);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRecipe(id);
    }
  };


  if (recipes.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-stone-700">Your Recipe Library is Empty</h2>
        <p className="text-stone-500 mt-2">Upload your first recipe above to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-stone-700 mb-6 border-b pb-3">My Recipe Library</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipeState) => (
          <div 
            key={recipeState.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRecipe(recipeState.id)}
            onKeyDown={(e) => handleKeyDown(e, recipeState.id)}
            className="group relative bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            <div className="p-5">
              <h3 className="text-lg font-bold text-stone-800 truncate group-hover:text-amber-600 transition-colors">
                {recipeState.recipe.title}
              </h3>
              <p className="text-sm text-stone-500 mt-1 h-10 overflow-hidden">
                {recipeState.recipe.description}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon key={star} className={`h-5 w-5 ${star <= recipeState.rating ? 'text-yellow-400' : 'text-stone-300'}`} />
                  ))}
                </div>
                <button
                  onClick={(e) => handleDelete(e, recipeState.id)}
                  className="p-2 rounded-full text-stone-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  aria-label="Delete recipe"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;