import React, { useState, useEffect, useRef } from 'react';
import type { Recipe, RecipeState } from '../types';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import { multiplyIngredient } from '../utils/recipeUtils';
import { updateInstructionsWithMultiplier } from '../services/geminiService';
import { ClockIcon, UsersIcon, BookOpenIcon, StarIcon, DollarSignIcon, SunIcon, MoonIcon, ShoppingCartIcon, ClipboardIcon, ClipboardCheckIcon, LoaderIcon } from './Icons';

type UpdateFn = (updates: Partial<Omit<RecipeState, 'recipe' | 'id'>>) => void;

interface RecipeDisplayProps {
  recipeState: RecipeState;
  onUpdate: UpdateFn;
}

type Tab = 'recipe' | 'rating' | 'metrics';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode; controls: string; id: string; }> = ({ active, onClick, children, icon, controls, id }) => (
  <button
    id={id}
    role="tab"
    aria-selected={active}
    aria-controls={controls}
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
      ${active ? 'border-amber-600 text-amber-700 bg-amber-50' : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-100'}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

interface RecipeTabProps {
  recipe: Recipe;
  multiplier: number;
  checkedIngredients: string[];
  onUpdate: UpdateFn;
}

const RecipeTab: React.FC<RecipeTabProps> = ({ recipe, multiplier, checkedIngredients, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const [dynamicInstructions, setDynamicInstructions] = useState<string[]>(recipe.instructions);
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(false);
  const [instructionError, setInstructionError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const checkedSet = new Set(checkedIngredients);

  // Effect to update instructions when multiplier changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  
    if (multiplier === 1) {
      setDynamicInstructions(recipe.instructions);
      setInstructionError(null);
      return;
    }
    
    debounceTimeoutRef.current = window.setTimeout(async () => {
      setIsLoadingInstructions(true);
      setInstructionError(null);
      try {
        const updatedInstructions = await updateInstructionsWithMultiplier(recipe.instructions, multiplier);
        setDynamicInstructions(updatedInstructions);
      } catch (err) {
        console.error("Failed to update instructions:", err);
        setInstructionError("Could not update instructions automatically. Please adjust manually.");
      } finally {
        setIsLoadingInstructions(false);
      }
    }, 750); // Debounce API call
  
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [multiplier, recipe.instructions]);


  const setMultiplier = (valueOrFn: number | ((prev: number) => number)) => {
    const newMultiplier = typeof valueOrFn === 'function' ? valueOrFn(multiplier) : valueOrFn;
    onUpdate({ multiplier: Math.max(0.1, newMultiplier) }); // Prevent multiplier from being 0 or negative
  };

  const handleToggleIngredient = (ingredient: string) => {
    const newChecked = new Set(checkedSet);
    if (newChecked.has(ingredient)) {
      newChecked.delete(ingredient);
    } else {
      newChecked.add(ingredient);
    }
    onUpdate({ checkedIngredients: Array.from(newChecked) });
  };
  
  const handleCopyIngredients = () => {
    const ingredientsText = recipe.ingredients
      .map(ing => `• ${multiplyIngredient(ing, multiplier)}`)
      .join('\n');
    
    navigator.clipboard.writeText(ingredientsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy ingredients:', err);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-stone-700 flex items-center">
                <ShoppingCartIcon className="h-5 w-5 mr-2" />Ingredients
            </h3>
            <button 
                onClick={handleCopyIngredients}
                className={`flex items-center space-x-1.5 text-sm font-semibold py-1 px-2.5 rounded-md transition-all duration-200 ${
                    copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                disabled={copied}
            >
                {copied ? <ClipboardCheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy List'}</span>
            </button>
        </div>
        <div className="flex items-center justify-between mb-4 bg-stone-100 p-2 rounded-lg">
          <label htmlFor="multiplier" className="font-semibold text-sm text-stone-600">Recipe Yield:</label>
          <div className="flex items-center space-x-2">
            <button onClick={() => setMultiplier(m => m - 0.25)} className="h-8 w-8 rounded-full bg-amber-200 text-amber-800 hover:bg-amber-300">-</button>
            <input
              type="number"
              id="multiplier"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-16 text-center font-bold bg-white border border-stone-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
              step="0.25"
            />
            <button onClick={() => setMultiplier(m => m + 0.25)} className="h-8 w-8 rounded-full bg-amber-200 text-amber-800 hover:bg-amber-300">+</button>
          </div>
        </div>
        <ul className="space-y-3">
          {recipe.ingredients.map((ing, index) => (
            <li key={index} className="flex items-center">
              <input 
                type="checkbox"
                id={`ingredient-${index}`}
                checked={checkedSet.has(ing)}
                onChange={() => handleToggleIngredient(ing)}
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor={`ingredient-${index}`} className={`ml-3 text-stone-700 cursor-pointer ${checkedSet.has(ing) ? 'line-through text-stone-400' : ''}`}>
                {multiplyIngredient(ing, multiplier)}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-2 relative">
        <h3 className="text-xl font-bold text-stone-700 mb-4 border-b pb-2">Instructions</h3>
        
        {instructionError && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm" role="alert">
            {instructionError}
          </div>
        )}
        
        <div className="relative">
            {isLoadingInstructions && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                    <div className="flex items-center space-x-2 text-stone-600">
                        <LoaderIcon className="h-6 w-6 animate-spin" />
                        <span className="font-semibold">Updating measurements...</span>
                    </div>
                </div>
            )}
            <ol className={`space-y-4 ${isLoadingInstructions ? 'opacity-50' : ''}`}>
              {dynamicInstructions.map((step, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold mr-4">{index + 1}</div>
                  <p className="text-stone-700 leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
        </div>
      </div>
    </div>
  );
};

interface RatingTabProps {
  rating: number;
  notes: string;
  onUpdate: UpdateFn;
}

const RatingTab: React.FC<RatingTabProps> = ({ rating, notes, onUpdate }) => {
    return (
        <div>
            <h3 className="text-xl font-bold text-stone-700 mb-4 border-b pb-2">My Rating & Notes</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Your Rating</label>
                    <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => onUpdate({ rating: star })} className="focus:outline-none">
                                <StarIcon className={`h-8 w-8 transition-colors ${star <= rating ? 'text-yellow-400' : 'text-stone-300'}`} />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-2">Baking Notes</label>
                    <textarea 
                        id="notes"
                        rows={8}
                        className="w-full p-3 border border-stone-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500"
                        placeholder="How did it turn out? Any changes for next time?"
                        value={notes}
                        onChange={e => onUpdate({ notes: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};

interface MetricsTabProps {
  recipe: Recipe;
  cost: number;
  onUpdate: UpdateFn;
}

const MetricsTab: React.FC<MetricsTabProps> = ({ recipe, cost, onUpdate }) => {
    const servingsValue = parseInt(recipe.servings.match(/\d+/)?.[0] || '1', 10);
    const costPerServing = cost > 0 && servingsValue > 0 ? (cost / servingsValue).toFixed(2) : '0.00';

    return (
        <div>
            <h3 className="text-xl font-bold text-stone-700 mb-4 border-b pb-2">Time, Yield & Cost</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-stone-600 mb-2">Time Breakdown</h4>
                    <div className="flex items-center text-stone-700 mb-2"><ClockIcon className="h-5 w-5 mr-3 text-amber-600" /> Prep Time: <strong>{recipe.prepTime || 'N/A'}</strong></div>
                    <div className="flex items-center text-stone-700"><ClockIcon className="h-5 w-5 mr-3 text-amber-600" /> Cook Time: <strong>{recipe.cookTime || 'N/A'}</strong></div>
                </div>
                 <div className="bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-stone-600 mb-2">Yield</h4>
                    <div className="flex items-center text-stone-700"><UsersIcon className="h-5 w-5 mr-3 text-amber-600" /> {recipe.servings || 'N/A'}</div>
                </div>
                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
                    <h4 className="font-semibold text-stone-600 mb-3">Cost Calculator</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                        <div className="flex-1">
                            <label htmlFor="total-cost" className="block text-sm font-medium text-stone-700">Total Ingredient Cost</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <DollarSignIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input 
                                    type="number" 
                                    id="total-cost"
                                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-amber-500 focus:ring-amber-500 sm:text-sm" 
                                    placeholder="0.00"
                                    value={cost || ''}
                                    onChange={e => onUpdate({ cost: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex-1 text-center bg-amber-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-stone-700">Cost Per Serving</p>
                            <p className="text-2xl font-bold text-amber-700">${costPerServing}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipeState, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('recipe');
  const { isSupported, isWakeLockActive, requestWakeLock, releaseWakeLock } = useScreenWakeLock();
  const { recipe } = recipeState;

  const getTabPanelId = (tab: Tab) => `tabpanel-${tab}`;
  const getTabId = (tab: Tab) => `tab-${tab}`;

  return (
    <div className="bg-white shadow-xl rounded-2xl p-4 sm:p-6 lg:p-8">
      <div className="border-b border-stone-200 pb-4 mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 tracking-tight">{recipe.title}</h2>
        <p className="mt-2 text-stone-500 max-w-3xl">{recipe.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-600">
          <span className="flex items-center"><ClockIcon className="h-5 w-5 mr-1.5 text-amber-500" /> Prep: {recipe.prepTime || 'N/A'}</span>
          <span className="flex items-center"><ClockIcon className="h-5 w-5 mr-1.5 text-amber-500" /> Cook: {recipe.cookTime || 'N/A'}</span>
          <span className="flex items-center"><UsersIcon className="h-5 w-5 mr-1.5 text-amber-500" /> Yield: {recipe.servings || 'N/A'}</span>
        </div>
        {isSupported && (
          <div className="mt-4">
            <button
                onClick={isWakeLockActive ? releaseWakeLock : requestWakeLock}
                className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-full transition-colors
                    ${isWakeLockActive ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
                {isWakeLockActive ? <SunIcon className="h-4 w-4 mr-1.5" /> : <MoonIcon className="h-4 w-4 mr-1.5" />}
                {isWakeLockActive ? 'Screen Lock Active' : 'Keep Screen Awake'}
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-stone-200 mb-6">
        <div role="tablist" className="-mb-px flex space-x-4" aria-label="Recipe details">
          <TabButton id={getTabId('recipe')} controls={getTabPanelId('recipe')} active={activeTab === 'recipe'} onClick={() => setActiveTab('recipe')} icon={<BookOpenIcon className="h-5 w-5"/>}>Recipe</TabButton>
          <TabButton id={getTabId('rating')} controls={getTabPanelId('rating')} active={activeTab === 'rating'} onClick={() => setActiveTab('rating')} icon={<StarIcon className="h-5 w-5"/>}>Rating & Notes</TabButton>
          <TabButton id={getTabId('metrics')} controls={getTabPanelId('metrics')} active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} icon={<DollarSignIcon className="h-5 w-5"/>}>Metrics</TabButton>
        </div>
      </div>
      
      <div>
        <div id={getTabPanelId('recipe')} role="tabpanel" tabIndex={0} aria-labelledby={getTabId('recipe')} hidden={activeTab !== 'recipe'}>
           {activeTab === 'recipe' && <RecipeTab recipe={recipe} multiplier={recipeState.multiplier} checkedIngredients={recipeState.checkedIngredients} onUpdate={onUpdate} />}
        </div>
        <div id={getTabPanelId('rating')} role="tabpanel" tabIndex={0} aria-labelledby={getTabId('rating')} hidden={activeTab !== 'rating'}>
           {activeTab === 'rating' && <RatingTab rating={recipeState.rating} notes={recipeState.notes} onUpdate={onUpdate} />}
        </div>
        <div id={getTabPanelId('metrics')} role="tabpanel" tabIndex={0} aria-labelledby={getTabId('metrics')} hidden={activeTab !== 'metrics'}>
          {activeTab === 'metrics' && <MetricsTab recipe={recipe} cost={recipeState.cost} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
};

export default RecipeDisplay;