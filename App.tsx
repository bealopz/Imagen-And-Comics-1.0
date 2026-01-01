
import React, { useState, useCallback } from 'react';
import { GeneratedImage, AppState } from './types';
import { generateImage, editImage, generateComicPanels } from './services/geminiService';
import PromptForm from './components/PromptForm';
import ImageDisplay from './components/ImageDisplay';
import ComicDisplay from './components/ComicDisplay';
import Loader from './components/Loader';
import { downloadImage, downloadComic } from './utils/fileUtils';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [comicPanels, setComicPanels] = useState<GeneratedImage[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleError = (message: string, error: any) => {
    console.error(message, error);
    setError(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerateImage = useCallback(async (prompt: string) => {
    setAppState(AppState.LOADING);
    setLoadingMessage('Summoning pixels from the digital ether...');
    setError(null);
    setGeneratedImage(null);
    setComicPanels([]);
    try {
      const image = await generateImage(prompt);
      setGeneratedImage(image);
      setAppState(AppState.IMAGE_DISPLAYED);
    } catch (e) {
      handleError('Failed to generate image. Please try a different prompt.', e);
    }
  }, []);

  const handleEditImage = useCallback(async (prompt: string) => {
    if (!generatedImage) return;
    setAppState(AppState.LOADING);
    setLoadingMessage('Applying artistic alterations...');
    setError(null);
    try {
      const editedImage = await editImage(prompt, generatedImage);
      setGeneratedImage(editedImage);
      setAppState(AppState.IMAGE_DISPLAYED);
    } catch (e) {
      handleError('Failed to edit image. The AI might be feeling stubborn.', e);
    }
  }, [generatedImage]);

  const handleCreateComic = useCallback(async () => {
    if (!generatedImage) return;
    setAppState(AppState.LOADING);
    setLoadingMessage('Generating a universe, one panel at a time...');
    setError(null);
    try {
      const panels = await generateComicPanels(generatedImage);
      setComicPanels(panels);
      setAppState(AppState.COMIC_DISPLAYED);
    } catch (e) {
      handleError('Failed to create comic. The story took an unexpected turn.', e);
    }
  }, [generatedImage]);

  const handleDownloadImage = useCallback(() => {
    if (generatedImage) {
      downloadImage(generatedImage.url, 'ai-generated-image.png');
    }
  }, [generatedImage]);

  const handleDownloadComic = useCallback(async () => {
    if (comicPanels.length > 0) {
      setAppState(AppState.LOADING);
      setLoadingMessage('Stitching panels together...');
      await downloadComic(comicPanels.map(p => p.url), 'ai-comic.png');
      setAppState(AppState.COMIC_DISPLAYED);
    }
  }, [comicPanels]);

  const handleStartOver = () => {
    setAppState(AppState.IDLE);
    setGeneratedImage(null);
    setComicPanels([]);
    setError(null);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.LOADING:
        return <Loader message={loadingMessage} />;
      case AppState.IMAGE_DISPLAYED:
        return generatedImage && (
          <ImageDisplay
            image={generatedImage}
            onCreateComic={handleCreateComic}
            onDownload={handleDownloadImage}
            onStartOver={handleStartOver}
          />
        );
      case AppState.COMIC_DISPLAYED:
        return (
          <ComicDisplay
            panels={comicPanels}
            onDownload={handleDownloadComic}
            onStartOver={handleStartOver}
          />
        );
      case AppState.ERROR:
         return (
          <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={handleStartOver}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case AppState.IDLE:
      default:
        return (
            <div className="text-center text-gray-500">
                <p>Your generated content will appear here.</p>
            </div>
        );
    }
  };
  
  const isFormDisabled = appState === AppState.LOADING || appState === AppState.COMIC_DISPLAYED;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
        <header className="w-full max-w-2xl text-center mb-8">
             <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              AI Image & Comic Creator
            </h1>
            <p className="text-gray-400">
              Turn your imagination into visuals. What story will you tell?
            </p>
        </header>

        <div className="w-full max-w-2xl mb-8">
            {appState === AppState.IDLE && (
                 <PromptForm 
                    onSubmit={handleGenerateImage} 
                    placeholder="A cyberpunk city skyline at dusk, glowing neon signs..." 
                    buttonText="Generate Image"
                    disabled={isFormDisabled}
                />
            )}
            {appState === AppState.IMAGE_DISPLAYED && (
                 <PromptForm 
                    onSubmit={handleEditImage} 
                    placeholder="Add a retro film grain effect, make the sky orange..." 
                    buttonText="Edit Image"
                    disabled={isFormDisabled}
                />
            )}
        </div>

      <main className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center flex-grow">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
