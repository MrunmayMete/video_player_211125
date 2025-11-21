import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Registration } from './components/Registration';
import { VideoPlayer } from './components/VideoPlayer';
import { ClickstreamExport } from './components/ClickstreamExport';
import { User, Bookmark, ClickstreamEvent, Page } from './types';
import { VIDEO_SOURCE, MOCK_CAPTIONS } from './constants';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('registration');
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [clickstream, setClickstream] = useState<ClickstreamEvent[]>([]);
  
  // Video Source State
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_SOURCE);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Pre-generated captions passed to player
  const [initialCaptions, setInitialCaptions] = useState<any[]>(MOCK_CAPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Theme
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const logEvent = useCallback((type: string, details: any = {}) => {
    if (!user) return;

    const event: ClickstreamEvent = {
      id: crypto.randomUUID(),
      userId: user.username,
      sessionId: user.sessionId,
      timestamp: Date.now(),
      eventType: type,
      details,
      page: currentPage
    };

    setClickstream(prev => [...prev, event]);
    console.log('Log:', event);
  }, [user, currentPage]);

  const parseVTT = (vttText: string) => {
    const items = [];
    const lines = vttText.split('\n');
    let currentStart = null;
    let currentEnd = null;
    let currentText = [];

    const timeToSeconds = (timeStr: string) => {
      const parts = timeStr.split(':');
      let seconds = 0;
      if (parts.length === 3) {
        seconds += parseFloat(parts[0]) * 3600;
        seconds += parseFloat(parts[1]) * 60;
        seconds += parseFloat(parts[2]);
      } else if (parts.length === 2) {
        seconds += parseFloat(parts[0]) * 60;
        seconds += parseFloat(parts[1]);
      }
      return seconds;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        const times = line.split('-->');
        currentStart = timeToSeconds(times[0].trim());
        currentEnd = timeToSeconds(times[1].trim());
      } else if (line === '' && currentStart !== null) {
        if (currentText.length > 0) {
          items.push({
            start: currentStart,
            end: currentEnd,
            text: currentText.join(' ')
          });
        }
        currentStart = null;
        currentEnd = null;
        currentText = [];
      } else if (currentStart !== null && line !== 'WEBVTT' && !line.match(/^\d+$/)) {
         currentText.push(line);
      }
    }
    if (currentStart !== null && currentText.length > 0) {
       items.push({
          start: currentStart,
          end: currentEnd,
          text: currentText.join(' ')
       });
    }
    return items;
  };

  const parseSRT = (srtText: string) => {
    const items = [];
    // Normalize newlines
    const normalized = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split('\n\n');

    const timeToSeconds = (timeStr: string) => {
      // SRT Time format: HH:MM:SS,ms
      // regex to split parts
      const match = timeStr.match(/(\d+):(\d+):(\d+),(\d+)/);
      if (!match) return 0;
      
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      const milliseconds = parseInt(match[4], 10);

      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    };

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      // Line 0 is index (ignored)
      // Line 1 is timestamp
      const timeLine = lines[1];
      if (!timeLine.includes('-->')) continue;

      const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
      
      const start = timeToSeconds(startStr);
      const end = timeToSeconds(endStr);

      // Remaining lines are text
      const text = lines.slice(2).join(' ');

      if (text) {
        items.push({ start, end, text });
      }
    }
    return items;
  };

  const handleRegister = async (username: string, file: File | null, captionFile: File | null) => {
    setIsProcessing(true);
    
    try {
      const newUser = { username, sessionId: crypto.randomUUID() };
      let captions = MOCK_CAPTIONS;

      // Handle Video File
      if (file) {
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setVideoFile(file);
        // Reset captions if we are uploading a custom video but no custom captions
        if (!captionFile) {
          captions = [];
        }
      } else {
        setVideoSrc(VIDEO_SOURCE);
        setVideoFile(null);
        // Default video keeps mock captions unless overridden below (which shouldn't happen if video logic is correct)
      }

      // Handle Caption File
      if (captionFile) {
        const text = await captionFile.text();
        if (captionFile.name.endsWith('.vtt')) {
          captions = parseVTT(text);
        } else if (captionFile.name.endsWith('.srt')) {
          captions = parseSRT(text);
        } else {
          try {
            captions = JSON.parse(text);
          } catch (e) {
            console.error("Failed to parse JSON captions", e);
            alert("Failed to parse JSON caption file. Please ensure it matches the expected format.");
            captions = [];
          }
        }
      }

      setUser(newUser);
      setInitialCaptions(captions);
      setCurrentPage('player');
      
      const loginEvent: ClickstreamEvent = {
        id: crypto.randomUUID(),
        userId: username,
        sessionId: newUser.sessionId,
        timestamp: Date.now(),
        eventType: 'SESSION_START',
        details: { 
          customVideo: !!file, 
          customCaptions: !!captionFile,
          captionsCount: captions.length 
        },
        page: 'registration'
      };
      setClickstream([loginEvent]);

    } catch (e) {
      console.error("Registration error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddBookmark = (time: number, note: string) => {
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      time,
      note
    };
    setBookmarks(prev => [...prev, newBookmark]);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    logEvent('BOOKMARK_DELETE', { bookmarkId: id });
  };

  const handleFinishSession = (answers?: Record<number, number>) => {
    if (answers) {
      logEvent('QUIZ_COMPLETED', { answers });
    }
    logEvent('SESSION_END_REQUEST', {});
    setCurrentPage('export');
  };

  const handleLogout = () => {
    // Clean up object URL if needed
    if (videoSrc !== VIDEO_SOURCE) {
      URL.revokeObjectURL(videoSrc);
    }
    
    setUser(null);
    setBookmarks([]);
    setClickstream([]);
    setVideoSrc(VIDEO_SOURCE);
    setVideoFile(null);
    setInitialCaptions(MOCK_CAPTIONS);
    setCurrentPage('registration');
  };

  return (
    <Layout isDark={isDark} toggleTheme={toggleTheme} username={user?.username}>
      {currentPage === 'registration' && (
        <Registration onRegister={handleRegister} isProcessing={isProcessing} />
      )}
      
      {currentPage === 'player' && user && (
        <VideoPlayer 
          videoSrc={videoSrc}
          videoFile={videoFile}
          initialCaptions={initialCaptions}
          bookmarks={bookmarks}
          onAddBookmark={handleAddBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onLogEvent={logEvent}
          onFinish={handleFinishSession}
        />
      )}

      {currentPage === 'export' && (
        <ClickstreamExport 
          clickstream={clickstream}
          onLogout={handleLogout}
        />
      )}
    </Layout>
  );
};

export default App;