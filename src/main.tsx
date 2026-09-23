import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles/globals.css';

const root = document.getElementById('root')!;
const app = <StrictMode><App /></StrictMode>;
/* Production HTML is prerendered (scripts/prerender.mjs); the dev server is not. */
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
