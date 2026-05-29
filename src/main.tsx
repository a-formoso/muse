import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

async function init() {
  try {
    const res = await fetch('/api/config');
    const cfg = await res.json();
    (window as any).__SUPABASE_URL__ = cfg.supabaseUrl;
    (window as any).__SUPABASE_ANON_KEY__ = cfg.supabaseAnonKey;
  } catch (e) {
    console.error('Failed to load config', e);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

init();
