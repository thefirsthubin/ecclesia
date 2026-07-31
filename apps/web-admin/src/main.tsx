/**
 * Entry point for the Ecclesia Admin Console (PRD §11.9, Blueprint §8.2:
 * the React web client used by the Resident Pastor, Assistant Pastors,
 * and Church Administrators).
 *
 * This Sprint 0 milestone renders a single placeholder screen - no real
 * screens, routing, or Cognito-authenticated session exist yet (those
 * are explicitly out of scope per this milestone's brief).
 */
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { App } from './app/app';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found - index.html must contain <div id="root"></div>');
}

const root = ReactDOM.createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
