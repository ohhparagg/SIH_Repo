/* ==========================================================================
   CRAFTORA - Unified Header Navigation (Light Theme)
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

export function renderTopNav(showBack = false) {
  const state = appState.data;
  const lang = state.language;
  const role = state.currentRole;

  let roleLabel = 'DIGITAL PLATFORM';
  if (role === 'artisan') roleLabel = 'ARTISAN WORKSPACE';
  if (role === 'buyer') roleLabel = 'BUYER DISCOVERY';
  if (role === 'admin') roleLabel = 'ADMIN VERIFICATION';

  const isLanding = (role === 'landing') || (role === 'artisan' && state.activeArtisanScreen === 'landing');

  return `
    <header class="craftora-header">
      <div style="display: flex; align-items: center; gap: 10px;">
        ${showBack ? `
          <button class="btn-icon" onclick="window.historyBack()" title="Back" aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
        ` : ''}
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="assets/craftora_logo.png" alt="CRAFTORA" style="height: 28px; width: auto; max-width: 125px; object-fit: contain; display: block;" />
          ${!isLanding ? `
            <div style="border-left: 1.5px solid var(--border-medium); padding-left: 8px; margin-left: 2px;">
              <div class="brand-subtitle" style="font-size: 9px; letter-spacing: 0.08em; color: var(--copper); font-weight: 700; text-transform: uppercase;">${roleLabel}</div>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        ${role === 'admin' && state.adminAuth?.isLoggedIn ? `
          <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; height: auto; border-radius: var(--radius-xs);" onclick="window.requestAdminSignOut()" title="Sign Out">
            Sign Out
          </button>
        ` : ''}
        <button class="lang-selector" onclick="window.toggleLanguage()" aria-label="Toggle language">
          ${renderIcon('globe', '', 14)}
          <span>${lang === 'EN' ? 'EN' : 'हिं'}</span>
        </button>
      </div>
    </header>
  `;
}

window.toggleLanguage = () => {
  const newLang = appState.data.language === 'EN' ? 'HI' : 'EN';
  appState.setLanguage(newLang);
};

window.historyBack = () => {
  if (typeof window.stopProductCameraStream === 'function') {
    window.stopProductCameraStream();
  }
  if (appState.data.productCameraActive) {
    appState.data.productCameraActive = false;
    appState.data.productCapturedPhoto = null;
  }
  appState.goBack();
};
