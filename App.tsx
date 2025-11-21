import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Registration } from './components/Registration';
import { VideoPlayer } from './components/VideoPlayer';
import { ClickstreamExport } from './components/ClickstreamExport';
import { User, Bookmark, ClickstreamEvent, Page } from './types';
import { VIDEO_SOURCE } from './constants';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('registration');
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [clickstream, setClickstream] = useState<ClickstreamEvent[]>([]);
  
  // Video Source State
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_SOURCE);

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

  const handleRegister = (username: string, videoFile: File | null) => {
    const newUser = { username, sessionId: crypto.randomUUID() };
    setUser(newUser);
    
    // Handle custom video file
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoSrc(url);
    } else {
      setVideoSrc(VIDEO_SOURCE);
    }

    setCurrentPage('player');
    
    const loginEvent: ClickstreamEvent = {
      id: crypto.randomUUID(),
      userId: username,
      sessionId: newUser.sessionId,
      timestamp: Date.now(),
      eventType: 'SESSION_START',
      details: { customVideo: !!videoFile },
      page: 'registration'
    };
    setClickstream([loginEvent]);
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

  const handleFinishSession = () => {
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
    setCurrentPage('registration');
  };

  return (
    <Layout isDark={isDark} toggleTheme={toggleTheme} username={user?.username}>
      {currentPage === 'registration' && (
        <Registration onRegister={handleRegister} />
      )}
      
      {currentPage === 'player' && user && (
        <VideoPlayer 
          videoSrc={videoSrc}
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