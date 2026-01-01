
import React from 'react';
import { GeneratedImage } from '../types';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

interface ComicDisplayProps {
  panels: GeneratedImage[];
  onDownload: () => void;
  onStartOver: () => void;
}

const ComicDisplay: React.FC<ComicDisplayProps> = ({ panels, onDownload, onStartOver }) => {
  return (
    <div className="w-full max-w-5xl text-center">
      <h2 className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Your Comic Awaits!</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {panels.map((panel, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={panel.url}
              alt={`Comic panel ${index + 1}`}
              className="rounded-lg shadow-lg w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onDownload}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors text-lg"
        >
          <ArrowDownTrayIcon />
          Download Comic
        </button>
        <button
          onClick={onStartOver}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-600 transition-colors text-lg"
        >
          <ChevronLeftIcon />
          Start Over
        </button>
      </div>
    </div>
  );
};

export default ComicDisplay;
