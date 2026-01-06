
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

  const handleError = (contextMessage: string, error: any) => {
    console.error(contextMessage, error);
    let errorMessage = contextMessage;
    let rawErrorDetails: string | null = null;

    if (error instanceof Error) {
        rawErrorDetails = error.message;
    } else if (typeof error === 'object' && error !== null) {
        rawErrorDetails = JSON.stringify(error, null, 2);
    } else if (typeof error === 'string') {
        rawErrorDetails = error;
    }

    if (rawErrorDetails) {
        errorMessage += `\nDetalles del error: ${rawErrorDetails}`;
    }

    // Add general guidance for API key issues, as the RPC error is very indicative of this.
    errorMessage += "\n\nAcción Requerida: Los fallos en las llamadas a la API, especialmente 'Rpc failed due to xhr error' o '500 Internal Server Error', a menudo indican un problema con tu clave API de Google Gemini o su cuenta de facturación asociada. Por favor, asegúrate de que tu clave API sea válida y esté vinculada a un proyecto con la facturación activa. Visita ai.google.dev/gemini-api/docs/billing para más información.";

    setError(errorMessage);
    setAppState(AppState.ERROR);
  };

  const handleGenerateImage = useCallback(async (prompt: string) => {
    setAppState(AppState.LOADING);
    setLoadingMessage('Invocando píxeles del éter digital...');
    setError(null);
    setGeneratedImage(null);
    setComicPanels([]);
    try {
      const image = await generateImage(prompt);
      setGeneratedImage(image);
      setAppState(AppState.IMAGE_DISPLAYED);
    } catch (e) {
      handleError('Fallo al generar la imagen. Intenta con un prompt diferente.', e);
    }
  }, []);

  const handleEditImage = useCallback(async (prompt: string) => {
    if (!generatedImage) return;
    setAppState(AppState.LOADING);
    setLoadingMessage('Aplicando alteraciones artísticas...');
    setError(null);
    try {
      const editedImage = await editImage(prompt, generatedImage);
      setGeneratedImage(editedImage);
      setAppState(AppState.IMAGE_DISPLAYED);
    } catch (e) {
      handleError('Fallo al editar la imagen. La IA podría estar un poco testaruda.', e);
    }
  }, [generatedImage]);

  const handleCreateComic = useCallback(async () => {
    if (!generatedImage) return;
    setAppState(AppState.LOADING);
    setLoadingMessage('Generando un universo, un panel a la vez...');
    setError(null);
    try {
      const panels = await generateComicPanels(generatedImage);
      setComicPanels(panels);
      setAppState(AppState.COMIC_DISPLAYED);
    } catch (e) {
      handleError('Fallo al crear el cómic. La historia tomó un giro inesperado.', e);
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
      setLoadingMessage('Uniendo paneles...');
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
          <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-red-400 mb-4">¡Ocurrió un Error!</h2>
            <p className="text-red-300 mb-6 whitespace-pre-wrap text-left p-4 bg-red-900/40 rounded-md overflow-auto max-h-60">
                {error}
            </p>
            <button
              onClick={handleStartOver}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
            >
              Intentar de Nuevo
            </button>
          </div>
        );
      case AppState.IDLE:
      default:
        return (
            <div className="text-center text-gray-500">
                <p>Tu contenido generado aparecerá aquí.</p>
            </div>
        );
    }
  };
  
  const isFormDisabled = appState === AppState.LOADING || appState === AppState.COMIC_DISPLAYED;

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
        <header className="w-full max-w-2xl text-center mb-8">
             <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              AI Image & Comic Creator
            </h1>
            <p className="text-gray-400">
              Convierte tu imaginación en imágenes. ¿Qué historia contarás?
            </p>
        </header>

        <div className="w-full max-w-2xl mb-8">
            {appState === AppState.IDLE && (
                 <PromptForm 
                    onSubmit={handleGenerateImage} 
                    placeholder="Un horizonte de ciudad cyberpunk al anochecer, letreros de neón brillantes..." 
                    buttonText="Generar Imagen"
                    disabled={isFormDisabled}
                />
            )}
            {appState === AppState.IMAGE_DISPLAYED && (
                 <PromptForm 
                    onSubmit={handleEditImage} 
                    placeholder="Añade un efecto de grano de película retro, haz el cielo naranja..." 
                    buttonText="Editar Imagen"
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