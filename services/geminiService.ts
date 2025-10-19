import { GoogleGenAI, Type } from "@google/genai";
import type { ImagePart, Recipe } from '../types';

const API_KEY = "AIzaSyCbh_6qTmDTtX6FERoy0gqD4j4A530MZIs";

const ai = new GoogleGenAI({ apiKey: API_KEY });

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the recipe." },
    description: { type: Type.STRING, description: "A brief, enticing description of the recipe. If none, create one." },
    prepTime: { type: Type.STRING, description: "Preparation time, e.g., '20 minutes'." },
    cookTime: { type: Type.STRING, description: "Cooking or baking time, e.g., '1 hour'." },
    servings: { type: Type.STRING, description: "The yield of the recipe, e.g., 'Makes 12 cookies'." },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of ingredients with quantities and units.",
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step instructions for preparing the recipe.",
    },
  },
  required: ["title", "description", "prepTime", "cookTime", "servings", "ingredients", "instructions"],
};

const recipesArraySchema = {
  type: Type.ARRAY,
  items: recipeSchema,
};

const instructionsArraySchema = {
  type: Type.ARRAY,
  items: { type: Type.STRING },
};


export const extractRecipesFromFile = async (file: File): Promise<Recipe[]> => {
  const base64File = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

  const imagePart: ImagePart = {
    inlineData: {
      mimeType: file.type,
      data: base64File,
    },
  };

  const prompt = `
    You are an expert recipe parsing assistant.
    Analyze the provided document, which may contain multiple recipes. Identify and extract EVERY SINGLE recipe you find.
    Skip introductory pages, indexes, or general guides that are not specific recipes.
    For each recipe, extract its details.
    Provide the output as a JSON array, where each object in the array matches the provided schema for a single recipe.
    If a value isn't found for a field, use an empty string or an empty array.
    If no recipes are found in the document, return an empty array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          { text: prompt },
          imagePart,
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipesArraySchema,
        thinkingConfig: { thinkingBudget: 16384 }, // Increased budget for larger documents
      },
    });

    const jsonText = response.text.trim();
    const recipeData = JSON.parse(jsonText);
    
    // Basic validation
    if (!Array.isArray(recipeData)) {
      throw new Error("The API did not return a list of recipes.");
    }

    return recipeData as Recipe[];
  } catch (error) {
    console.error("Error processing recipe with Gemini API:", error);
    throw new Error("Could not understand the recipes from the file. Please try a clearer image or a different file.");
  }
};

export const updateInstructionsWithMultiplier = async (instructions: string[], multiplier: number): Promise<string[]> => {
  const prompt = `
    You are a helpful kitchen assistant specializing in baking. The user is scaling a recipe.
    The scaling multiplier is ${multiplier}.
    Please rewrite the following recipe instructions, carefully adjusting any quantities or measurements (like grams, cups, tsp, ml, etc.).
    Do not change the core steps of the recipe, only the values associated with measurements.
    Maintain the original structure, tone, and number of steps.
    Original instructions are provided as a JSON string array.
    Return the updated instructions as a JSON array of strings with the same number of elements as the original.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
          parts: [
              { text: prompt },
              { text: `Original Instructions: ${JSON.stringify(instructions)}` },
          ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: instructionsArraySchema,
      },
    });
    
    const jsonText = response.text.trim();
    const instructionData = JSON.parse(jsonText);

    if (!Array.isArray(instructionData) || instructionData.some(i => typeof i !== 'string')) {
       throw new Error("API did not return a valid string array for instructions.");
    }

    return instructionData;

  } catch (error) {
    console.error("Error updating instructions with Gemini API:", error);
    throw new Error("Could not update instructions automatically.");
  }
};