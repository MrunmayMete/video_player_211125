import React, { useState } from 'react';
import { ArrowRight, UserCircle, Upload, Film, X } from 'lucide-react';

interface RegistrationProps {
  onRegister: (username: string, videoFile: File | null) => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onRegister }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onRegister(input.trim(), selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
              <UserCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400">Configure your session parameters</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="e.g. user_123"
                autoFocus
              />
            </div>

            {/* Video Selection Area */}
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Video Source <span className="text-slate-400 font-normal ml-1">(Optional)</span>
              </label>
              
              {!selectedFile ? (
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Select local video file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    or drag and drop here
                  </p>
                </div>
              ) : (
                <div className="relative flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl">
                   <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                      <Film size={20} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                   </div>
                   <button 
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                   >
                     <X size={18} />
                   </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-2 text-right">
                 {selectedFile ? 'Using local file' : 'Using default sample video'}
              </p>
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
            >
              <span>Start Session</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
        <p className="text-center mt-8 text-xs text-slate-400">
          Local files are processed in your browser and not uploaded to any server.
        </p>
      </div>
    </div>
  );
};