/* ==========================================================================
   CRAFTORA - Central Application Router & View Assembler
   ========================================================================== */

import { appState } from './state.js';
import { renderDemoControlBar } from './components/DemoControlBar.js';
import { renderTopNav } from './components/TopNav.js';
import { renderBottomNav } from './components/BottomNav.js';
import { renderVoiceModal } from './components/VoiceModal.js';
import './components/Toast.js';

import { renderLandingView } from './views/shared/LandingView.js';
import { renderArtisanView } from './views/artisan/ArtisanViews.js';
import { renderBuyerView } from './views/buyer/BuyerViews.js';
import { renderAdminView } from './views/admin/AdminViews.js';

function renderApp() {
  const root = document.getElementById('app');
  if (!root) return;

  const state = appState.data;
  const role = state.currentRole;

  // Header back button condition
  let showBack = false;
  if (role === 'artisan' && state.activeArtisanScreen !== 'dashboard' && state.activeArtisanScreen !== 'landing') showBack = true;
  if (role === 'buyer' && state.activeBuyerScreen !== 'explore') showBack = true;
  if (role === 'admin' && state.activeAdminScreen !== 'dashboard' && state.activeAdminScreen !== 'login') showBack = true;

  // Determine active view content
  let mainContent = '';
  if (role === 'landing') {
    mainContent = renderLandingView();
  } else if (role === 'artisan') {
    if (state.activeArtisanScreen === 'landing') {
      mainContent = renderLandingView();
    } else {
      mainContent = renderArtisanView(state.activeArtisanScreen);
    }
  } else if (role === 'buyer') {
    mainContent = renderBuyerView(state.activeBuyerScreen);
  } else if (role === 'admin') {
    if (!state.adminAuth?.isLoggedIn) {
      mainContent = renderAdminView('login');
    } else {
      mainContent = renderAdminView(state.activeAdminScreen);
    }
  }

  const isWideMode = (role === 'admin') || (role === 'artisan' && state.activeArtisanScreen === 'dashboard');

  root.innerHTML = `
    <!-- Top Demo Control Bar for Hackathon Evaluation -->
    ${renderDemoControlBar(state)}

    <!-- Main Mobile/Responsive Viewport Shell -->
    <main class="view-viewport ${isWideMode ? 'wide-mode' : ''}">
      ${renderTopNav(showBack)}
      
      <div style="flex: 1;">
        ${mainContent}
      </div>

      ${renderBottomNav()}
    </main>

    <!-- Voice Assistant Overlay Modal -->
    ${renderVoiceModal()}
  `;
}

// Global Transaction & Async Error Handler to prevent raw popups
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const msg = reason?.message || String(reason || 'Unknown error');
  const code = reason?.code || '';
  console.warn('⚡ Transaction async event notice:', reason);

  const isPerm = msg.toLowerCase().includes('permission') ||
                 msg.toLowerCase().includes('insufficient') ||
                 code === 'permission-denied';

  if (isPerm) {
    event.preventDefault?.();
    if (typeof window.showAppToast === 'function') {
      window.showAppToast({
        type: 'warning',
        title: '🔥 Firebase Security Rules Denied',
        message: 'Transaction was rejected by Firebase (Missing or insufficient permissions). Data saved locally. Click below to unlock rules.',
        actionLabel: 'Unlock Rules',
        onAction: () => {
          if (typeof window.showFirebaseRulesModal === 'function') {
            window.showFirebaseRulesModal();
          }
        },
        duration: 9000
      });
    }
  }
});

// Initial render & Subscribe to state changes
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  appState.subscribe(() => {
    renderApp();
  });

  // Handle browser native Back button
  window.addEventListener('popstate', () => {
    appState.goBack();
  });
});
