/* ==========================================================================
   CRAFTORA - Clean Context-Aware Bottom Navigation Bar
   ========================================================================== */

import { appState } from '../state.js';
import { renderIcon } from './Icons.js';

export function renderBottomNav() {
  const state = appState.data;
  const role = state.currentRole;

  if (role === 'artisan') {
    const active = state.activeArtisanScreen;
    if (['onboarding', 'onboarding_otp', 'profile_step1'].includes(active)) {
      return '';
    }
    return `
      <nav class="bottom-nav">
        <button class="nav-tab ${active === 'dashboard' ? 'active' : ''}" onclick="window.navArtisan('dashboard')">
          <span class="nav-tab-icon">${renderIcon('home', '', 18)}</span>
          <span>Home</span>
        </button>
        <button class="nav-tab ${active === 'my_crafts' || active === 'product_detail' ? 'active' : ''}" onclick="window.navArtisan('my_crafts')">
          <span class="nav-tab-icon">${renderIcon('palette', '', 18)}</span>
          <span>Crafts</span>
        </button>
        <button class="nav-tab ${active === 'market_matches' ? 'active' : ''}" onclick="window.navArtisan('market_matches')">
          <span class="nav-tab-icon">${renderIcon('users', '', 18)}</span>
          <span>Buyers</span>
        </button>
        <button class="nav-tab ${active === 'artisan_id_card' ? 'active' : ''}" onclick="window.navArtisan('artisan_id_card')">
          <span class="nav-tab-icon">${renderIcon('user', '', 18)}</span>
          <span>Me</span>
        </button>
      </nav>
    `;
  }

  if (role === 'buyer') {
    const active = state.activeBuyerScreen;
    if (['welcome', 'buyer_mobile', 'buyer_otp', 'register', 'buyer_signin'].includes(active)) {
      return '';
    }
    return `
      <nav class="bottom-nav">
        <button class="nav-tab ${active === 'explore' ? 'active' : ''}" onclick="window.navBuyer('explore')">
          <span class="nav-tab-icon">${renderIcon('home', '', 18)}</span>
          <span>Explore</span>
        </button>
        <button class="nav-tab ${active === 'explore' ? 'active' : ''}" onclick="window.navBuyer('explore')">
          <span class="nav-tab-icon">${renderIcon('search', '', 18)}</span>
          <span>Search</span>
        </button>
        <button class="nav-tab ${active === 'scan_qr' ? 'active' : ''}" onclick="window.navBuyer('scan_qr')">
          <span class="nav-tab-icon">${renderIcon('qr', '', 18)}</span>
          <span>Scan</span>
        </button>
        <button class="nav-tab ${active === 'profile' ? 'active' : ''}" onclick="window.navBuyer('profile')">
          <span class="nav-tab-icon">${renderIcon('user', '', 18)}</span>
          <span>Profile</span>
        </button>
      </nav>
    `;
  }

  if (role === 'admin') {
    if (!state.adminAuth?.isLoggedIn) return '';
    const active = state.activeAdminScreen;
    return `
      <nav class="bottom-nav">
        <button class="nav-tab ${active === 'dashboard' || active === 'artisan_list' ? 'active' : ''}" onclick="window.navAdmin('artisan_list')">
          <span class="nav-tab-icon">${renderIcon('users', '', 18)}</span>
          <span>Artisans</span>
        </button>
        <button class="nav-tab ${active === 'product_list' ? 'active' : ''}" onclick="window.navAdmin('product_list')">
          <span class="nav-tab-icon">${renderIcon('package', '', 18)}</span>
          <span>Products</span>
        </button>
        <button class="nav-tab ${active === 'provenance_logs' ? 'active' : ''}" onclick="window.navAdmin('provenance_logs')">
          <span class="nav-tab-icon">${renderIcon('shield', '', 18)}</span>
          <span>Provenance</span>
        </button>
        <button class="nav-tab ${active === 'dashboard' ? 'active' : ''}" onclick="window.navAdmin('dashboard')">
          <span class="nav-tab-icon">${renderIcon('sliders', '', 18)}</span>
          <span>Settings</span>
        </button>
      </nav>
    `;
  }

  return '';
}

window.navArtisan = (screen) => {
  appState.setArtisanScreen(screen);
};

window.navBuyer = (screen) => {
  appState.setBuyerScreen(screen);
};

window.navAdmin = (screen) => {
  appState.setAdminScreen(screen);
};
