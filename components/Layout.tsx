import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  toggleTheme: () => void;
  username?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, isDark, toggleTheme, username }) => {
  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      {/* Header / Navigation Bar */}
      <header className="w-full h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
            S
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            StreamInsight
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {username && (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Hi, {username}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
        <div className="w-full h-full max-w-[1920px] mx-auto p-6 lg:p-10">
           {children}
        </div>
      </main>
    </div>
  );
};