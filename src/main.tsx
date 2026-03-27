import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { polyfill } from 'mobile-drag-drop';
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour';

polyfill({
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
  holdToDrag: 200,
  dragImageOffset: { x: 0, y: 0 }
});

// Prevent default touch actions on draggable elements to ensure polyfill works
document.addEventListener('touchstart', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('[draggable="true"]')) {
    // We don't preventDefault here because it would break clicks
    // But we ensure touch-action is none
    (target.closest('[draggable="true"]') as HTMLElement).style.touchAction = 'none';
  }
}, { passive: true });

// Prevent scrolling when dragging
window.addEventListener('touchmove', (e) => {
  if (document.querySelector('[data-dragging="true"]')) {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
