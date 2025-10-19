import React, { useState, useCallback, useEffect } from 'react';
import { extractRecipesFromFile } from '../services/geminiService';
import type { Recipe } from '../types';
import { UploadCloudIcon, AlertTriangleIcon, LoaderIcon } from './Icons';

interface FileUploadProps {
  onRecipesExtracted: (recipes: Recipe[]) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

const bakingTips = [
  "For fluffier cakes, ensure your butter and eggs are at room temperature.",
  "Measure flour correctly by spooning it into the cup and leveling, not scooping.",
  "A pinch of salt enhances flavor, even in sweet recipes.",
  "Let cookies cool on the baking sheet for a few minutes before moving them.",
  "Use an oven thermometer to ensure your oven's temperature is accurate.",
  "Toast your nuts before adding them to batters for a deeper flavor."
];

const FileUpload: React.FC<FileUploadProps> = ({ onRecipesExtracted, setError, setIsLoading, isLoading, error }) => {
  const [dragActive, setDragActive] = useState(false);
  const [currentTip, setCurrentTip] = useState(bakingTips[0]);

  useEffect(() => {
    if (isLoading) {
      const tipInterval = setInterval(() => {
        setCurrentTip(prevTip => {
          const currentIndex = bakingTips.indexOf(prevTip);
          const nextIndex = (currentIndex + 1) % bakingTips.length;
          return bakingTips[nextIndex];
        });
      }, 3000); // Change tip every 3 seconds

      return () => clearInterval(tipInterval);
    }
  }, [isLoading]);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, WEBP, or PDF file.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const extractedRecipes = await extractRecipesFromFile(file);
      if (extractedRecipes.length === 0) {
        setError("We couldn't find any recipes in that file. Please try another one.");
      } else {
        onRecipesExtracted(extractedRecipes);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onRecipesExtracted, setError, setIsLoading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-stone-700 mb-2">Upload Your Recipe File</h2>
      <p className="text-stone-500 mb-6">Drop a PDF or image, and we'll find all the recipes inside.</p>
      
      <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} aria-describedby={error ? "error-message" : undefined}>
        <input type="file" id="input-file-upload" className="hidden" accept="image/*,.pdf" onChange={handleChange} disabled={isLoading} />
        <label
          htmlFor="input-file-upload"
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${dragActive ? 'border-amber-600 bg-amber-100' : 'border-stone-300 bg-white hover:bg-stone-50'}`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoaderIcon className="h-12 w-12 text-amber-600 animate-spin" />
              <p className="text-lg text-stone-600 font-semibold">Scanning for recipes...</p>
              <p className="text-sm text-stone-500 italic text-center px-4">"{currentTip}"</p>
            </div>
          ) : (
            <>
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="absolute inset-0 w-full h-full"></div>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloudIcon className="w-10 h-10 mb-3 text-stone-400" />
                <p className="mb-2 text-sm text-stone-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-stone-500">PDF, PNG, JPG or WEBP</p>
              </div>
            </>
          )}
        </label>
      </form>

      {error && (
        <div id="error-message" className="mt-6 flex items-center justify-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
          <AlertTriangleIcon className="h-5 w-5 mr-3" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;