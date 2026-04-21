import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import App from './App.jsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#15151c',
          colorInputBackground: '#0b0b0f',
          colorInputText: '#e5e7eb',
          colorText: '#e5e7eb',
          colorTextSecondary: '#a1a1aa',
          borderRadius: '0.75rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
        elements: {
          card: 'bg-bg-panel border border-border-subtle shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton:
            'bg-bg-elev border-border-subtle hover:bg-bg-soft text-white',
          formButtonPrimary:
            'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white',
          footerActionLink: 'text-violet-400 hover:text-violet-300',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);