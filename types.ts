export type Page = 'registration' | 'player' | 'export';

export interface User {
  username: string;
  sessionId: string;
}

export interface Bookmark {
  id: string;
  time: number;
  note: string;
  thumbnail?: string;
}

export interface ClickstreamEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  eventType: string;
  details: Record<string, any>;
  page: Page;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export interface AppState {
  user: User | null;
  currentPage: Page;
  bookmarks: Bookmark[];
  clickstream: ClickstreamEvent[];
}