import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Maximize, Minimize, 
  Volume2, VolumeX, Bookmark, Settings, 
  MessageSquare, List, MoreVertical, Trash2 
} from 'lucide-react';
import { VIDEO_TITLE, VIDEO_SUBTITLE, MOCK_CAPTIONS } from '../constants';
import { Bookmark as BookmarkType } from '../types';

interface VideoPlayerProps {
  videoSrc: string;
  bookmarks: BookmarkType[];
  onAddBookmark: (time: number, note: string) => void;
  onDeleteBookmark: (id: string) => void;
  onLogEvent: (type: string, details: any) => void;
  onFinish: () => void;
}

// Helper to format seconds to MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoSrc,
  bookmarks, 
  onAddBookmark, 
  onDeleteBookmark,
  onLogEvent,
  onFinish 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  
  // UI State
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'settings'>('bookmarks');
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

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
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

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
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      onLogEvent('SPEED_CHANGE', { rate });
    }
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

  // Render active caption based on mock data
  const currentCaption = showCaptions 
    ? MOCK_CAPTIONS.find(c => currentTime >= c.start && currentTime <= c.end) 
    : null;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* Video Player Container */}
      <div 
        ref={containerRef}
        className={`relative group bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex-1 flex flex-col justify-center ${isFullscreen ? 'w-full h-full' : 'w-full lg:w-3/4 h-[60vh] lg:h-auto'}`}
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
        />

        {/* Caption Overlay */}
        {currentCaption && (
           <div className="absolute bottom-24 left-0 right-0 text-center pointer-events-none">
             <span className="bg-black/70 text-white px-4 py-2 rounded text-lg font-medium backdrop-blur-sm">
               {currentCaption.text}
             </span>
           </div>
        )}

        {/* Custom Controls Overlay */}
        <div 
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 lg:p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Progress Bar */}
          <div className="group/slider relative w-full h-4 flex items-center cursor-pointer mb-4">
             <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 relative" 
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
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white hover:text-primary-400">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/50 rounded-lg appearance-none"
                />
              </div>

              <span className="text-white/80 text-xs font-medium tracking-wider font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Playback Speed Dropdown - Simple implementation */}
              <div className="relative group/speed">
                <button className="px-2 py-1 text-xs font-bold text-white bg-white/10 rounded hover:bg-white/20 transition-colors">
                  {playbackRate}x
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/speed:flex flex-col bg-black/90 rounded-lg p-1 backdrop-blur">
                  {[0.5, 1, 1.5, 2].map(rate => (
                    <button 
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-3 py-1 text-xs text-white hover:bg-primary-600 rounded ${playbackRate === rate ? 'text-primary-400' : ''}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                   setShowCaptions(!showCaptions);
                   onLogEvent('CAPTION_TOGGLE', { active: !showCaptions });
                }}
                className={`p-2 rounded-full transition-colors ${showCaptions ? 'text-primary-400 bg-white/10' : 'text-white hover:bg-white/10'}`}
                title="Captions"
              >
                <MessageSquare size={20} />
              </button>

              <button 
                onClick={addBookmark}
                className="p-2 text-white hover:text-yellow-400 hover:bg-white/10 rounded-full transition-colors"
                title="Add Bookmark"
              >
                <Bookmark size={20} />
              </button>

              <button 
                onClick={toggleFullscreen}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar (Bookmarks & Meta) */}
      <div className="w-full lg:w-1/4 h-auto lg:h-auto flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'bookmarks' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <List size={16} /> Bookmarks
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'settings' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Settings size={16} /> Info & Actions
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 relative">
          {activeTab === 'bookmarks' ? (
            <div className="space-y-3">
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                  <Bookmark size={48} className="mb-3 opacity-20" />
                  <p className="text-sm">No bookmarks yet.</p>
                  <p className="text-xs mt-1">Tap the bookmark icon while playing.</p>
                </div>
              ) : (
                bookmarks.map((b) => (
                  <div 
                    key={b.id} 
                    className="group bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 p-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-3"
                    onClick={() => jumpToBookmark(b.time)}
                  >
                    <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold px-2 py-1 rounded min-w-[50px] text-center">
                      {formatTime(b.time)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{b.note}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteBookmark(b.id); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{VIDEO_TITLE}</h3>
                <p className="text-xs text-slate-500">{VIDEO_SUBTITLE}</p>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Shortcuts</h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li className="flex justify-between"><span>Play/Pause</span> <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded border">Space</span></li>
                  <li className="flex justify-between"><span>Seek +/-</span> <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded border">Arrows</span></li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={onFinish}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Finish Session & Export Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};