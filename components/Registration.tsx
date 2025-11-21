import React, { useState } from 'react';
import { ArrowRight, UserCircle, Upload, Film, FileText, X, Loader2, PlayCircle } from 'lucide-react';

interface RegistrationProps {
  onRegister: (username: string, videoFile: File | null, captionFile: File | null) => void;
  isProcessing: boolean;
}

export const Registration: React.FC<RegistrationProps> = ({ onRegister, isProcessing }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCaptionFile, setSelectedCaptionFile] = useState<File | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingCaption, setIsDraggingCaption] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onRegister(input.trim(), selectedFile, selectedCaptionFile);
    }
  };

  // Video Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOverVideo = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingVideo(true); };
  const handleDragLeaveVideo = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingVideo(false); };
  const handleDropVideo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      }
    }
  };

  // Caption Handlers
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedCaptionFile(e.target.files[0]);
    }
  };

  const handleDragOverCaption = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingCaption(true); };
  const handleDragLeaveCaption = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingCaption(false); };
  const handleDropCaption = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCaption(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.json') || 
        file.name.endsWith('.vtt') || 
        file.name.endsWith('.srt') ||
        file.type.includes('text') || 
        file.type.includes('json')
      ) {
        setSelectedCaptionFile(file);
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-4xl my-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 lg:p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/50 ring-1 ring-slate-900/5">
          
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Header & Info */}
            <div className="w-full md:w-1/3 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30 mb-2">
                <PlayCircle size={32} />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  Start Session
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                  Configure your environment. You can use the default sample video or upload your own content for analysis.
                </p>
              </div>

              <div className="hidden md:block p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Supported Formats</h4>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Film size={14} /> Video: MP4, WebM, MKV
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText size={14} /> Captions: JSON, WebVTT, SRT
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="w-full md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Username Input */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">
                    Participant ID / Username
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      id="username"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isProcessing}
                      className="w-full pl-11 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 disabled:opacity-50 text-base font-medium shadow-sm"
                      placeholder="Enter unique identifier..."
                      autoFocus
                    />
                  </div>
                </div>

                {/* File Upload Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  {/* Video Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Video Source
                    </label>
                    {!selectedFile ? (
                      <div 
                        className={`relative h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${isDraggingVideo ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        onDragOver={handleDragOverVideo}
                        onDragLeave={handleDragLeaveVideo}
                        onDrop={handleDropVideo}
                      >
                        <input 
                          type="file" 
                          accept="video/*"
                          onChange={handleFileChange}
                          disabled={isProcessing}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary-500 transition-colors mb-2">
                          <Upload size={20} />
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Select Video</p>
                      </div>
                    ) : (
                      <div className="h-32 relative p-4 bg-slate-50 dark:bg-slate-800/50 border border-primary-200 dark:border-primary-900/30 rounded-xl flex flex-col justify-center items-center text-center group">
                        <Film size={24} className="text-primary-500 mb-2" />
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[90%]">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <button 
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Caption Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Captions (Optional)
                    </label>
                    {!selectedCaptionFile ? (
                      <div 
                        className={`relative h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${isDraggingCaption ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        onDragOver={handleDragOverCaption}
                        onDragLeave={handleDragLeaveCaption}
                        onDrop={handleDropCaption}
                      >
                        <input 
                          type="file" 
                          accept=".json,.vtt,.srt,text/vtt,application/json,text/plain"
                          onChange={handleCaptionChange}
                          disabled={isProcessing}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2">
                          <FileText size={20} />
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Upload Captions</p>
                      </div>
                    ) : (
                      <div className="h-32 relative p-4 bg-slate-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-900/30 rounded-xl flex flex-col justify-center items-center text-center group">
                        <FileText size={24} className="text-indigo-500 mb-2" />
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[90%]">{selectedCaptionFile.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{selectedCaptionFile.name.split('.').pop()}</p>
                        <button 
                          type="button"
                          onClick={() => setSelectedCaptionFile(null)}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Preparing Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Player</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
        <p className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
          StreamInsight v1.2 • Secure Local Processing
        </p>
      </div>
    </div>
  );
};