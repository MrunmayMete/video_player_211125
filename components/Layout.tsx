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
      
      {/* Background with modern gradient */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />

      {/* Header / Navigation Bar */}
      <header className="w-full h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/25 ring-1 ring-white/20">
            S
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
            StreamInsight
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {username && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {username}
              </span>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:scale-105 active:scale-95"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-[calc(100dvh-4rem)] overflow-hidden relative">
        <div className="w-full h-full max-w-[1920px] mx-auto p-4 lg:p-6 lg:px-8">
           {children}
        </div>
      </main>
    </div>
  );
};