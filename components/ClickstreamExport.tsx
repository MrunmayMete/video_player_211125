import React, { useMemo } from 'react';
import { LogOut, CheckCircle, FileSpreadsheet, Clock, Activity, Bookmark, MousePointer2 } from 'lucide-react';
import { ClickstreamEvent } from '../types';

interface ClickstreamExportProps {
  clickstream: ClickstreamEvent[];
  onLogout: () => void;
}

export const ClickstreamExport: React.FC<ClickstreamExportProps> = ({ clickstream, onLogout }) => {
  
  const stats = useMemo(() => {
    if (clickstream.length === 0) return { duration: '0s', events: 0, bookmarks: 0, interactions: 0 };

    const sorted = [...clickstream].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sorted[0].timestamp;
    const endTime = sorted[sorted.length - 1].timestamp;
    const durationMs = endTime - startTime;
    
    const mins = Math.floor(durationMs / 60000);
    const secs = Math.floor((durationMs % 60000) / 1000);
    
    const bookmarksCount = clickstream.filter(e => e.eventType === 'BOOKMARK_ADD').length;
    // Count interactions like Play, Pause, Seek, Speed
    const interactionsCount = clickstream.filter(e => 
      ['PLAY', 'PAUSE', 'SEEK', 'SPEED_CHANGE', 'MUTE_TOGGLE'].includes(e.eventType)
    ).length;

    return {
      duration: `${mins}m ${secs}s`,
      events: clickstream.length,
      bookmarks: bookmarksCount,
      interactions: interactionsCount
    };
  }, [clickstream]);

  const handleDownload = () => {
    // Sort events chronologically to ensure order within Case ID
    const sortedEvents = [...clickstream].sort((a, b) => a.timestamp - b.timestamp);

    // Define CSV Headers based on Process Mining / Event Log requirements
    const headers = ['Case ID', 'Activity', 'Timestamp', 'Page', 'Details'];

    // Helper to escape CSV fields (handle commas, quotes, newlines)
    const escapeCsvField = (field: any): string => {
      const stringValue = typeof field === 'object' ? JSON.stringify(field) : String(field);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Map events to CSV rows
    const rows = sortedEvents.map(event => {
      return [
        escapeCsvField(event.sessionId),          // Case ID
        escapeCsvField(event.eventType),          // Activity
        new Date(event.timestamp).toISOString(),  // Timestamp (ISO 8601 is sortable)
        escapeCsvField(event.page),               // Optional: Page
        escapeCsvField(event.details)             // Optional: Details
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event_log_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto py-8 animate-fade-in">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        
        {/* Main Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
          
          <div className="p-10 md:p-12 text-center border-b border-slate-100 dark:border-slate-800/50">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full mb-6 text-green-600 dark:text-green-400 shadow-sm">
              <CheckCircle size={48} strokeWidth={1.5} />
            </div>

            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Session Complete</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Data recording has finished successfully. Review your session summary below before exporting the event log.
            </p>
          </div>

          {/* Dashboard Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="p-6 text-center group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Time</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.duration}</p>
            </div>
            
            <div className="p-6 text-center group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <Activity size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.events}</p>
            </div>

            <div className="p-6 text-center group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <MousePointer2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Interactions</span>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.interactions}</p>
            </div>

            <div className="p-6 text-center group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <Bookmark size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Bookmarks</span>
              </div>
              <p className="text-2xl font-black text-amber-500">{stats.bookmarks}</p>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-8 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto min-w-[220px] group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5"
            >
              <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform" />
              <div className="text-left leading-tight">
                <span className="block text-sm">Download Log</span>
                <span className="block text-[10px] opacity-80 font-normal">CSV Format</span>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="w-full sm:w-auto min-w-[200px] group flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/50 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
              <div className="text-left leading-tight">
                <span className="block text-sm font-bold">End Session</span>
                <span className="block text-[10px] opacity-70 font-normal">Logout & Reset</span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};