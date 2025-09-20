import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import './tests/inline'; // run inline tests in dev/prod

if (typeof document !== 'undefined'){
  const root = document.getElementById('root') || (()=>{ const el=document.createElement('div'); el.id='root'; document.body.appendChild(el); return el; })();
  createRoot(root).render(<App/>);
}