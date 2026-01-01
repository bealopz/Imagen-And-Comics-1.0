
import React, { useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  placeholder: string;
  buttonText: string;
  initialValue?: string;
  disabled?: boolean;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onSubmit,
  placeholder,
  buttonText,
  initialValue = '',
  disabled = false,
}) => {
  const [prompt, setPrompt] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row items-center gap-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full flex-grow bg-gray-800 border-2 border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !prompt.trim()}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300"
      >
        <SparklesIcon />
        {buttonText}
      </button>
    </form>
  );
};

export default PromptForm;
