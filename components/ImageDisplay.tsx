
import React from 'react';
import { GeneratedImage } from '../types';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

interface ImageDisplayProps {
  image: GeneratedImage;
  onCreateComic: () => void;
  onDownload: () => void;
  onStartOver: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  image,
  onCreateComic,
  onDownload,
  onStartOver,
}) => {
  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-8">
      <div className="w-full">
        <img
          src={image.url}
          alt="AI Generated"
          className="rounded-lg shadow-2xl shadow-purple-900/20 w-full aspect-square object-cover"
        />
      </div>
      <div className="w-full flex flex-col gap-4">
        <h3 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Next Steps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onCreateComic}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Comic
          </button>
          <button
            onClick={onDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
          >
            <ArrowDownTrayIcon />
            Download
          </button>
        </div>
        <button
          onClick={onStartOver}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-colors"
        >
          <ChevronLeftIcon />
          Start New Project
        </button>
      </div>
    </div>
  );
};

export default ImageDisplay;
