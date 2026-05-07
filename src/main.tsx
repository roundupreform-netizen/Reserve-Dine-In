import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { OutletProvider } from './contexts/OutletContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OutletProvider>
        <App />
      </OutletProvider>
    </AuthProvider>
  </StrictMode>,
);
