import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setBasePath } from './api/jsonapi';
import { App } from './App';
import './index.css';

const rootEl = document.getElementById('media-hub-root');
if (!rootEl) throw new Error('#media-hub-root not found');

const basePath = rootEl.dataset['basePath'] ?? '/';
setBasePath(basePath);

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
