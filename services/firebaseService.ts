import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, update, remove, set } from 'firebase/database';
import type { Recipe, RecipeState } from '../types';

// --- IMPORTANT ---
// This configuration has been applied as requested.
const firebaseConfig = {
  apiKey: "AIzaSyDVlRjX9AmNij_zLcYNIT7VfXWmLR6B53Q",
  authDomain: "bmaw-e59af.firebaseapp.com",
  databaseURL: "https://bmaw-e59af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bmaw-e59af",
  storageBucket: "bmaw-e59af.appspot.com",
  messagingSenderId: "472651749517",
  appId: "1:472651749517:web:1653e65e01977dd58baac4",
  measurementId: "G-9NBDR674VP"
};

// --- SECURITY NOTE ---
// For production, make sure to secure your Firebase Realtime Database.
// Go to your Firebase console -> Realtime Database -> Rules.
// The default is public read/write. For a real app with users, you'd want rules like:
// {
//   "rules": {
//     "recipes": {
//       ".read": "auth != null",
//       ".write": "auth != null"
//     }
//   }
// }
// This example does not include authentication for simplicity.

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const recipesRef = ref(db, 'recipes');

/**
 * Listens for real-time updates to the recipes list and calls the callback with the updated list.
 * @param callback - The function to call with the new list of recipes.
 * @returns An unsubscribe function to detach the listener.
 */
export const listenToRecipes = (callback: (recipes: RecipeState[]) => void) => {
  return onValue(recipesRef, (snapshot) => {
    const data = snapshot.val();
    const recipesArray: RecipeState[] = [];
    if (data) {
      for (const id in data) {
        recipesArray.push({ id, ...data[id] });
      }
    }
    // Newest recipes will appear first in the list
    callback(recipesArray.reverse());
  });
};

/**
 * Adds an array of new recipes to the database.
 * @param newRecipes - An array of Recipe objects extracted from a file.
 */
export const addRecipes = async (newRecipes: Recipe[]) => {
  const promises = newRecipes.map(recipe => {
    const newRecipeState: Omit<RecipeState, 'id'> = {
      recipe: recipe,
      multiplier: 1,
      rating: 0,
      notes: '',
      cost: 0,
      checkedIngredients: [],
    };
    const newRecipeRef = push(recipesRef);
    return set(newRecipeRef, newRecipeState);
  });
  await Promise.all(promises);
};

/**
 * Updates an existing recipe in the database.
 * @param id - The unique ID of the recipe to update.
 * @param updates - An object containing the fields to update.
 */
export const updateRecipe = (id: string, updates: Partial<Omit<RecipeState, 'recipe' | 'id'>>) => {
  const recipeToUpdateRef = ref(db, `recipes/${id}`);
  return update(recipeToUpdateRef, updates);
};

/**
 * Deletes a recipe from the database.
 * @param id - The unique ID of the recipe to delete.
 */
export const deleteRecipe = (id: string) => {
  const recipeToDeleteRef = ref(db, `recipes/${id}`);
  return remove(recipeToDeleteRef);
};
