import React from 'react';
import { LogOut, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { ClickstreamEvent } from '../types';

interface ClickstreamExportProps {
  clickstream: ClickstreamEvent[];
  onLogout: () => void;
}

export const ClickstreamExport: React.FC<ClickstreamExportProps> = ({ clickstream, onLogout }) => {
  
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
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 lg:p-12 text-center">
          
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
            <CheckCircle size={48} />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Session Complete</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            You have successfully recorded <span className="font-bold text-slate-900 dark:text-white">{clickstream.length}</span> interaction events during your viewing session.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="group relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all"
            >
              <FileSpreadsheet size={24} className="group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <span className="block text-sm font-bold">Download Event Log</span>
                <span className="block text-xs opacity-75">CSV Format</span>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="group relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut size={24} className="group-hover:translate-x-1 transition-transform" />
              <div className="text-left">
                <span className="block text-sm font-bold">Logout</span>
                <span className="block text-xs opacity-75">End Session</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};