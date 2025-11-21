import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Maximize, Minimize, 
  Volume2, VolumeX, Bookmark, Settings, 
  MessageSquare, List, Trash2, CheckCircle2,
  Clock, HelpCircle, Check, GripVertical, Gauge
} from 'lucide-react';
import { VIDEO_TITLE, QUIZ_QUESTIONS } from '../constants';
import { Bookmark as BookmarkType } from '../types';

interface VideoPlayerProps {
  videoSrc: string;
  videoFile: File | null;
  initialCaptions: Caption[];
  bookmarks: BookmarkType[];
  onAddBookmark: (time: number, note: string) => void;
  onDeleteBookmark: (id: string) => void;
  onLogEvent: (type: string, details: any) => void;
  onFinish: (answers?: Record<number, number>) => void;
}

interface Caption {
  start: number;
  end: number;
  text: string;
}

// Helper to format seconds to MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoSrc,
  videoFile,
  initialCaptions,
  bookmarks, 
  onAddBookmark, 
  onDeleteBookmark,
  onLogEvent,
  onFinish 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(initialCaptions.length > 0);
  
  // Captions State
  const [captions] = useState<Caption[]>(initialCaptions);

  // UI State
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'questions' | 'settings'>('bookmarks');
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(25); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  // Quiz State
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Autohide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to Toggle Play
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }

      // Speed Control Shortcuts
      // Shift + > (Increase Speed)
      if (e.shiftKey && (e.key === '>' || e.key === '.')) {
        e.preventDefault();
        const newRate = Math.min(playbackRate + 0.25, 4.0);
        changeSpeed(newRate);
      }
      // Shift + < (Decrease Speed)
      if (e.shiftKey && (e.key === '<' || e.key === ',')) {
        e.preventDefault();
        const newRate = Math.max(playbackRate - 0.25, 0.25);
        changeSpeed(newRate);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackRate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onLogEvent('PAUSE', { time: videoRef.current.currentTime });
      } else {
        videoRef.current.play();
        onLogEvent('PLAY', { time: videoRef.current.currentTime });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      onLogEvent('SEEK', { to: time });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
      onLogEvent('FULLSCREEN_ENTER', {});
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      onLogEvent('FULLSCREEN_EXIT', {});
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
      onLogEvent('MUTE_TOGGLE', { muted: newMuteState });
    }
  };

  const changeSpeed = (rate: number) => {
    const safeRate = parseFloat(rate.toFixed(2)); // avoid floating point errors
    if (videoRef.current) {
      videoRef.current.playbackRate = safeRate;
      setPlaybackRate(safeRate);
      onLogEvent('SPEED_CHANGE', { rate: safeRate });
    }
    setIsSpeedMenuOpen(false);
  };

  const addBookmark = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      onAddBookmark(time, `Bookmark at ${formatTime(time)}`);
      onLogEvent('BOOKMARK_ADD', { time });
    }
  };

  const jumpToBookmark = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
      onLogEvent('BOOKMARK_JUMP', { time });
    }
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      // Allow deselection
      if (newAnswers[questionId] === optionIndex) {
        delete newAnswers[questionId];
        onLogEvent('QUIZ_ANSWER_REMOVED', { questionId });
      } else {
        newAnswers[questionId] = optionIndex;
        onLogEvent('QUIZ_ANSWER_SELECTED', { questionId, optionIndex });
      }
      return newAnswers;
    });
  };

  const handleFinish = () => {
    if (Object.keys(answers).length < QUIZ_QUESTIONS.length) {
      setActiveTab('questions');
      return;
    }
    onFinish(answers);
  };

  // Resize Logic
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
    
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;
    const container = wrapperRef.current;
    const containerWidth = container ? container.getBoundingClientRect().width : 1000;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Calculate delta X. Sidebar is on the right.
      // Moving mouse to Left (negative delta) increases sidebar width.
      // Moving mouse to Right (positive delta) decreases sidebar width.
      const currentX = mouseMoveEvent.clientX;
      const deltaPixels = startX - currentX;
      const deltaPercentage = (deltaPixels / containerWidth) * 100;
      
      // Calculate new width
      const newWidth = Math.min(Math.max(startWidth + deltaPercentage, 15), 50); // Clamp between 15% and 50%
      setSidebarWidth(newWidth);
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth]);

  // Render active caption
  const currentCaption = showCaptions 
    ? captions.find(c => currentTime >= c.start && currentTime <= c.end) 
    : null;
  
  const isQuizComplete = Object.keys(answers).length === QUIZ_QUESTIONS.length;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden animate-fade-in p-4">
      
      {/* 
          Scaled Container: 
          Updated to w-full to stretch sidebar/layout horizontally to edges.
      */}
      <div 
        ref={wrapperRef} 
        className="flex flex-col lg:flex-row gap-3 w-full h-[60vh] lg:h-[80vh] transition-all duration-500"
      >
        
        {/* Video Player Container */}
        <div 
          ref={containerRef}
          className={`relative group bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 flex flex-col justify-center min-w-0 flex-1 h-full ${isFullscreen ? 'w-full h-full fixed inset-0 z-50 rounded-none' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            crossOrigin="anonymous"
          />

          {/* Caption Overlay */}
          {currentCaption && (
             <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none transition-all duration-200 px-4 z-20">
               <span className="inline-block bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-md shadow-lg">
                 {currentCaption.text}
               </span>
             </div>
          )}

          {/* Custom Controls Overlay */}
          <div 
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-20 pb-4 px-4 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {/* Progress Bar */}
            <div className="group/slider relative w-full h-4 flex items-center cursor-pointer mb-2">
               <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm transition-all group-hover/slider:h-1.5">
                  <div 
                    className="h-full bg-primary-500 relative transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
               </div>
               <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>

            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={togglePlay}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-16 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none"
                  />
                </div>

                <div className="bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/5">
                  <span className="text-white/90 text-[10px] font-medium font-mono tracking-wide">
                    {formatTime(currentTime)} <span className="text-white/40 mx-0.5">/</span> {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                
                {/* Enhanced Speed Control Button */}
                <div className="relative">
                  <button 
                    onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 border border-transparent ${
                      isSpeedMenuOpen || playbackRate !== 1 
                        ? 'bg-white/20 text-white border-white/10 shadow-sm' 
                        : 'hover:bg-white/10 text-white/80 hover:text-white'
                    }`}
                    title="Playback Speed"
                  >
                    <Gauge size={16} />
                    <span className="text-xs font-semibold min-w-[24px] text-left">{playbackRate}x</span>
                  </button>
                  
                  {isSpeedMenuOpen && (
                    <>
                      {/* Backdrop to close */}
                      <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setIsSpeedMenuOpen(false)} />
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 min-w-[140px] bg-black/90 border border-white/10 rounded-xl p-1.5 backdrop-blur-xl shadow-2xl animate-fade-in z-40">
                        <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold px-2 py-1.5 border-b border-white/10 mb-1 flex justify-between items-center">
                          <span>Speed</span>
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto custom-scrollbar p-0.5 space-y-0.5">
                          {PLAYBACK_SPEEDS.map(rate => (
                            <button 
                              key={rate}
                              onClick={() => changeSpeed(rate)}
                              className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                                playbackRate === rate 
                                  ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20' 
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span>{rate}x</span>
                              {playbackRate === rate && <Check size={12} />}
                            </button>
                          ))}
                        </div>

                        <div className="mt-1 pt-1 border-t border-white/10 px-1">
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/5 focus-within:border-primary-500/50 transition-colors">
                            <span className="text-[10px] text-white/50">Custom</span>
                            <input 
                              type="number" 
                              step="0.1"
                              min="0.1"
                              max="4.0"
                              defaultValue={playbackRate}
                              onBlur={(e) => {
                                  let val = parseFloat(e.target.value);
                                  if(!isNaN(val)) changeSpeed(val);
                              }}
                              onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                  let val = parseFloat(e.currentTarget.value);
                                  if(!isNaN(val)) changeSpeed(val);
                                }
                              }}
                              className="w-full bg-transparent text-xs font-mono text-white text-right focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-px h-4 bg-white/10 mx-0.5"></div>

                <button 
                  onClick={() => {
                     if (!showCaptions && captions.length === 0) {
                       setActiveTab('settings');
                     }
                     setShowCaptions(!showCaptions);
                     onLogEvent('CAPTION_TOGGLE', { active: !showCaptions });
                  }}
                  className={`p-1.5 rounded-full transition-all ${showCaptions ? 'text-white bg-primary-600 shadow-lg shadow-primary-600/30' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  title={captions.length === 0 ? "No Captions Available" : "Toggle Captions"}
                  disabled={captions.length === 0}
                >
                  <MessageSquare size={16} className={captions.length === 0 ? 'opacity-40' : ''} />
                </button>

                <button 
                  onClick={addBookmark}
                  className="p-1.5 text-white/80 hover:text-yellow-400 hover:bg-white/10 rounded-full transition-colors"
                  title="Add Bookmark"
                >
                  <Bookmark size={16} />
                </button>

                <button 
                  onClick={toggleFullscreen}
                  className="p-1.5 text-white/80 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        {!isFullscreen && (
          <div
            onMouseDown={startResizing}
            className="hidden lg:flex w-4 -mx-2 cursor-col-resize items-center justify-center z-20 group/resizer hover:scale-110 transition-transform"
            title="Drag to resize"
          >
            <div className={`w-1 h-16 rounded-full transition-all duration-200 flex flex-col items-center justify-center gap-1 shadow-sm ${isResizing ? 'bg-primary-500 w-1.5' : 'bg-slate-300 dark:bg-slate-700 group-hover/resizer:bg-primary-400'}`}>
               {/* Optional grip texture */}
               <div className={`w-0.5 h-0.5 rounded-full bg-white/50 ${isResizing ? 'opacity-100' : 'opacity-0 group-hover/resizer:opacity-100'}`} />
               <div className={`w-0.5 h-0.5 rounded-full bg-white/50 ${isResizing ? 'opacity-100' : 'opacity-0 group-hover/resizer:opacity-100'}`} />
               <div className={`w-0.5 h-0.5 rounded-full bg-white/50 ${isResizing ? 'opacity-100' : 'opacity-0 group-hover/resizer:opacity-100'}`} />
            </div>
          </div>
        )}

        {/* Sidebar (Bookmarks & Meta) */}
        <div 
          className={`flex-none h-full flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-slate-800 overflow-hidden transition-colors ${isFullscreen ? 'hidden' : ''}`}
          style={{ 
             // Use CSS variable for width to work with Tailwind arbitrary values if needed, or just inline width
             // On mobile (default) width is 100%, on lg it uses the state
             width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarWidth}%` : '100%' 
          }}
        >
          
          {/* Sidebar Tabs - Compact Segmented Control */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
            <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 relative isolate">
              <button 
                onClick={() => setActiveTab('bookmarks')}
                className={`relative z-10 flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${activeTab === 'bookmarks' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <List size={14} strokeWidth={2.5} />
              </button>

              <button 
                onClick={() => setActiveTab('questions')}
                className={`relative z-10 flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${activeTab === 'questions' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <div className="flex items-center gap-1">
                  <HelpCircle size={14} strokeWidth={2.5} />
                  <span className="text-[10px] opacity-80">{Object.keys(answers).length}/10</span>
                </div>
                {/* Active Indicator for Tab */}
                {activeTab === 'questions' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full translate-y-1.5" />
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('settings')}
                className={`relative z-10 flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${activeTab === 'settings' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Settings size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Sidebar Content Area */}
          <div className="flex-1 overflow-y-auto p-3 relative custom-scrollbar min-h-0 scroll-smooth">
            
            {/* TAB: BOOKMARKS */}
            {activeTab === 'bookmarks' && (
              <div className="space-y-2">
                {bookmarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-center opacity-60">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                       <Bookmark size={16} />
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No bookmarks</p>
                  </div>
                ) : (
                  bookmarks.map((b) => (
                    <div 
                      key={b.id} 
                      className="group bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all cursor-pointer flex items-start gap-2 animate-fade-in"
                      onClick={() => jumpToBookmark(b.time)}
                    >
                      <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-bold px-2 py-1.5 rounded min-w-[44px] text-center tracking-tight flex flex-col items-center justify-center">
                        <Clock size={10} className="mb-0.5 opacity-80" />
                        {formatTime(b.time)}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">{b.note}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteBookmark(b.id); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: QUIZ (QUESTIONS) */}
            {activeTab === 'questions' && (
              <div className="space-y-6 pb-4">
                {/* Info Box - Sticky at top of scroll view */}
                <div className="sticky top-0 z-10 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-3 rounded-lg backdrop-blur-md shadow-sm">
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed text-center font-medium">
                    Please answer all 10 questions to enable session completion. Results will be shown after the session ends.
                  </p>
                </div>

                {QUIZ_QUESTIONS.map((q, index) => (
                  <div key={q.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 leading-snug">
                      {q.id}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => {
                         const isSelected = answers[q.id] === optIndex;
                         return (
                          <button
                            key={optIndex}
                            onClick={() => handleAnswerSelect(q.id, optIndex)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center gap-3 group ${
                              isSelected 
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-500 ring-1 ring-primary-500' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 group-hover:border-primary-400'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className={`${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-slate-600 dark:text-slate-300'}`}>
                              {option}
                            </span>
                          </button>
                         );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: SETTINGS (INFO) */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Video Meta */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 break-words leading-snug">
                    {videoFile ? videoFile.name : VIDEO_TITLE}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      {videoFile ? 'Local File' : 'Sample'}
                    </p>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/20">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    Shortcuts
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <li className="flex justify-between items-center">
                      <span>Play/Pause</span> 
                      <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">Spc</kbd>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Seek</span> 
                      <div className="flex gap-1">
                        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">←</kbd>
                        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">→</kbd>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Speed</span> 
                      <div className="flex gap-1">
                        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">⇧ + &lt;</kbd>
                        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">⇧ + &gt;</kbd>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Finish Button */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0">
             <button 
               onClick={handleFinish}
               className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all transform flex flex-col items-center justify-center gap-1 ring-1 ring-white/20 ${
                 isQuizComplete 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
               }`}
               title={!isQuizComplete ? "Complete the quiz to finish" : "Finish Session"}
             >
               <div className="flex items-center gap-2">
                 <span>Finish Session</span>
                 <CheckCircle2 size={14} />
               </div>
               {!isQuizComplete && (
                 <span className="text-[10px] font-normal opacity-80">
                   Quiz: {Object.keys(answers).length}/{QUIZ_QUESTIONS.length}
                 </span>
               )}
             </button>
          </div>

        </div>

      </div>
    </div>
  );
};