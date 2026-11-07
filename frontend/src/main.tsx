import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import your providers
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext'; // 👈 The new one we just created

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>
</React.StrictMode>
);