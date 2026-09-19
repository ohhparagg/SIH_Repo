/* ==========================================================================
   CRAFTORA - Clean Admin Portal Experience Views (Screens A1–A6)
   Strict Compliance: Approved Terminology & Mandatory Compliance Disclaimers.
   ========================================================================== */

import { appState } from '../../state.js';
import { renderIcon } from '../../components/Icons.js';

export function renderAdminView(screen) {
  const state = appState.data;
  const products = state.products;

  // STRICT RULE: Only users with role === 'admin' can access admin views. Normal Artisan and Buyer users cannot.
  if (state.currentRole !== 'admin') {
    // Non-admin attempting to access admin route is redirected away
    setTimeout(() => {
      if (state.currentRole === 'artisan') {
        appState.setArtisanScreen(state.artisanAuth?.isRegistered ? 'dashboard' : 'onboarding');
      } else if (state.currentRole === 'buyer') {
        appState.setBuyerScreen('explore');
      } else {
        appState.setRole('landing');
      }
    }, 0);
    return `
      <div style="padding: 40px 20px; text-align: center;">
        <div style="color: var(--danger); margin-bottom: 12px;">${renderIcon('alertCircle', '', 36)}</div>
        <h3 style="font-size: 18px; font-weight: 800; color: var(--danger); margin-bottom: 8px;">Access Denied</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          Admin Portal is restricted to authorized administrators. Redirecting...
        </p>
      </div>
    `;
  }

  // Admin must log in with demo credentials
  if (!state.adminAuth?.isLoggedIn) {
    return renderScreenA1_AdminLogin();
  }

  let content = '';
  switch (screen) {
    case 'login':
      content = renderScreenA1_AdminLogin();
      break;
    case 'artisan_list':
      content = renderScreenA3_ArtisanVerificationQueue(state);
      break;
    case 'product_list':
      content = renderScreenA4_ProductVerificationQueue(products);
      break;
    case 'provenance_logs':
      content = renderScreenA5_ProvenanceLogs(products);
      break;
    case 'review_detail':
      content = renderScreenA6_DetailedReview(state.adminReviewingTarget || products[0]);
      break;
    case 'dashboard':
    default:
      content = renderScreenA2_AdminDashboard(state);
      break;
  }

  if (state.showAdminSignOutModal) {
    content += `
      <div id="admin-signout-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); max-width: 360px; width: 100%; padding: 24px; text-align: center; box-shadow: var(--shadow-lg);">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(185, 28, 28, 0.1); color: var(--terracotta); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${renderIcon('logOut', '', 24)}
          </div>
          <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">Sign Out</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
            Are you sure you want to sign out?
          </p>

          <div style="display: flex; gap: 10px;">
            <button class="btn-secondary" style="flex: 1; padding: 10px;" onclick="window.cancelAdminSignOut()">
              Cancel
            </button>
            <button class="btn-primary" style="flex: 1; padding: 10px; background: var(--terracotta); border-color: var(--terracotta);" onclick="window.confirmAdminSignOut()">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return content;
}

// Screen A1 — Admin Login Portal
function renderScreenA1_AdminLogin() {
  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="color: var(--copper); margin-bottom: 8px;">
        ${renderIcon('shield', '', 36)}
      </div>
      <h2 style="font-size: 20px; margin-bottom: 2px;">CRAFTORA ADMIN</h2>
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 24px;">
        VERIFICATION PORTAL (DEMO ADMIN LOGIN)
      </div>

      <div class="craft-card" style="text-align: left; max-width: 340px; margin: 0 auto 20px;">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          ${renderIcon('shield', '', 16)} Authorized Admin Access
        </div>

        <div id="admin_login_error" style="display:none; padding:10px 12px; background:var(--danger-pale); border:1px solid var(--danger); border-radius:var(--radius-sm); color:var(--danger); font-size:12px; margin-bottom:14px;"></div>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="admin_login_username" class="form-input" placeholder="admin" autocomplete="username">
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="admin_login_password" class="form-input" placeholder="admin123" autocomplete="current-password">
        </div>

        <button class="btn-primary" onclick="window.submitAdminLogin()">
          Sign In as Admin ${renderIcon('arrowRight', '', 16)}
        </button>

        <div style="margin-top: 14px; padding: 10px; background: var(--bg-elevated); border-radius: var(--radius-xs); font-size: 11px; color: var(--text-secondary);">
          <strong>Demo Admin Credentials:</strong><br>
          Username: <code style="font-weight:700; color:var(--text-primary);">admin</code><br>
          Password: <code style="font-weight:700; color:var(--text-primary);">admin123</code>
        </div>
      </div>

      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 14px;">
        🔒 Demo authentication only • Access restricted to ADMIN role.
      </div>

      <button class="btn-secondary" style="max-width: 220px; margin: 0 auto; font-size: 12px; padding: 8px 14px;" onclick="window.exitAdminMode()">
        ← Back to CRAFTORA Home
      </button>
    </div>
  `;
}

// Screen A2 — Admin Dashboard
function renderScreenA2_AdminDashboard(state) {
  const stats = state.adminStats;

  return `
    <div style="padding: 20px;">
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 20px; font-weight: 800;">Verification Dashboard</h2>
          <div style="font-size: 13px; color: var(--text-secondary);">Logged in: <strong>${state.adminAuth?.adminId || 'admin'}</strong> (Demo Admin)</div>
        </div>
        <button class="btn-secondary" style="padding: 6px 12px; font-size: 11px; width: auto; display: flex; align-items: center; gap: 4px;" onclick="window.requestAdminSignOut()">
          ${renderIcon('logOut', '', 12)} Sign Out
        </button>
      </div>

      <!-- Overview Metrics -->
      <div class="grid-2" style="margin-bottom: 20px;">
        <div class="craft-card" style="padding: 16px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">ARTISANS</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--copper);">${stats.registeredArtisans}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">Registered</div>
        </div>

        <div class="craft-card" style="padding: 16px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">PRODUCTS</div>
          <div style="font-size: 26px; font-weight: 800; color: var(--copper);">${stats.registeredProducts}</div>
          <div style="font-size: 11px; color: var(--text-secondary);">Registered</div>
        </div>
      </div>

      <!-- Needs Attention Section -->
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--terracotta); margin-bottom: 10px; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
        ${renderIcon('alertCircle', '', 14)} Needs Attention
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
        <div class="craft-card" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-left: 3px solid var(--text-copper);" onclick="window.navAdmin('artisan_list')">
          <div>
            <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px;">
              ${renderIcon('user', '', 16)} Artisan Verification
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">New profiles awaiting review</div>
          </div>
          <span class="badge-pill badge-gold">${stats.artisanVerificationPending} pending →</span>
        </div>

        <div class="craft-card" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-left: 3px solid var(--terracotta);" onclick="window.navAdmin('product_list')">
          <div>
            <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px;">
              ${renderIcon('package', '', 16)} Product Verification
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">Products awaiting review</div>
          </div>
          <span class="badge-pill badge-terracotta">${stats.productVerificationPending} pending →</span>
        </div>
      </div>

      <!-- Recent Activity Stream -->
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 10px; letter-spacing: 0.05em;">
        Recent System Activity Log
      </div>

      <div class="craft-card" style="font-size: 12px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Product registered: Bamboo Basket</span>
          <span style="color: var(--text-muted);">10 min ago</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Artisan profile submitted: Ramesh Kumar</span>
          <span style="color: var(--text-muted);">25 min ago</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Provenance record log created</span>
          <span style="color: var(--text-muted);">1 hr ago</span>
        </div>
      </div>
    </div>
  `;
}

// Screen A3 — Artisan Verification List
function renderScreenA3_ArtisanVerificationQueue(state) {
  const artisans = state.artisans;

  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">🧑‍🎨 Artisan Verification</h2>
      <div style="font-size: 12px; color: var(--copper); font-weight: 700; margin-bottom: 16px;">
        ⚠️ 8 Profiles Awaiting Review
      </div>

      <div class="craft-card craft-card-glow" style="margin-bottom: 20px;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <img src="${artisans[0].photoUrl}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid var(--text-copper);">
          <div>
            <h3 style="font-size: 16px; margin-bottom: 2px;">${artisans[0].name}</h3>
            <div style="font-size: 12px; color: var(--copper); font-weight: 600;">${artisans[0].craftCategory}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">📍 ${artisans[0].location}</div>
          </div>
        </div>

        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
          Submitted: ${artisans[0].registeredAt}
        </div>

        <div style="background: var(--bg-elevated); padding: 10px; border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 14px;">
          <div style="color: var(--success); display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Name & Credentials provided</div>
          <div style="color: var(--success); display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Craft Category verified</div>
          <div style="color: var(--success); display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} District / State Location verified</div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" style="padding: 8px 14px; font-size: 12px;" onclick="window.approveArtisan('${artisans[0].id}')">
            ✓ Verification Approved
          </button>
          <button class="btn-secondary" style="padding: 8px 14px; font-size: 12px;" onclick="alert('Verification request sent to artisan')">
            Request Info
          </button>
        </div>
      </div>
    </div>
  `;
}

// Screen A4 — Product Verification List
function renderScreenA4_ProductVerificationQueue(products) {
  const pending = products[0];

  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">📦 Product Verification</h2>
      <div style="font-size: 12px; color: var(--copper); font-weight: 700; margin-bottom: 16px;">
        ⚠️ 12 Products Awaiting Audit Review
      </div>

      <div class="craft-card craft-card-glow" style="margin-bottom: 20px;">
        <img src="${pending.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 12px;">

        <h3 style="font-size: 16px; margin-bottom: 2px;">${pending.title}</h3>
        <div style="font-size: 11px; color: var(--copper); font-weight: 700; margin-bottom: 10px;">
          PRODUCT ID: ${pending.id}
        </div>

        <div style="font-size: 12px; margin-bottom: 4px;">
          🧑‍🎨 <strong>Artisan:</strong> ${pending.artisanName} (${pending.artisanLocation})
        </div>
        <div style="font-size: 12px; margin-bottom: 10px;">
          🌿 <strong>Material:</strong> ${pending.materials.join(', ')}
        </div>

        <div style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.2); padding: 10px; border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 14px;">
          <div style="font-weight: 700; color: var(--copper); display: flex; align-items: center; gap: 6px;">
            ${renderIcon('sparkles', '', 14)} AI Classification: ${pending.category} (94% confidence)
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
            ⚠️ Manual audit review required before verification approval.
          </div>
        </div>

        <button class="btn-primary" onclick="window.inspectProductDetail('${pending.id}')">
          Inspect & Review Product ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>
    </div>
  `;
}

// Screen A5 — Provenance / Blockchain Records
function renderScreenA5_ProvenanceLogs(products) {
  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">🔗 Provenance Records</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Inspect prototype blockchain-backed product history records.
      </p>

      <div style="margin-bottom: 16px;">
        <input type="text" class="form-input" value="CRF-BAM-001284" placeholder="Search Product ID...">
      </div>

      <div class="craft-card">
        <h4 style="font-size: 15px; margin-bottom: 2px;">${products[0].title}</h4>
        <div style="font-size: 11px; color: var(--copper); font-weight: 700; margin-bottom: 10px;">
          Product ID: ${products[0].id}
        </div>

        <div style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.25); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--terracotta);">
            Network: Polygon Testnet Demo
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">
            Record Status: Prototype Blockchain Record
          </div>
        </div>

        <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Product Registration Recorded (17 Sep 2026)</div>
          <div style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Product Details Recorded (17 Sep 2026)</div>
          <div style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Verification Review: Verification Approved</div>
        </div>
      </div>
    </div>
  `;
}

// Screen A6 — Detailed Verification Review Screen
function renderScreenA6_DetailedReview(product) {
  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">Verification Review Audit</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Inspect details & issue formal verification decision.
      </p>

      <div class="craft-card">
        <img src="${product.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 12px;">

        <h3 style="font-size: 16px; margin-bottom: 2px;">${product.title}</h3>
        <div style="font-size: 11px; color: var(--copper); font-weight: 700; margin-bottom: 12px;">
          Product ID: ${product.id}
        </div>

        <div style="font-size: 12px; margin-bottom: 4px;">🧑‍🎨 <strong>Artisan:</strong> ${product.artisanName} (${product.artisanLocation})</div>
        <div style="font-size: 12px; margin-bottom: 4px;">🌿 <strong>Material:</strong> ${product.materials.join(', ')}</div>
        <div style="font-size: 12px; margin-bottom: 14px;">⏱️ <strong>Production Time:</strong> ${product.productionTimeDays} Days</div>

        <div class="form-group">
          <label class="form-label">Review Note / Verification Memo</label>
          <textarea id="admin_review_note" class="form-textarea" rows="2" placeholder="Add verification note..."></textarea>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <button class="btn-primary" onclick="window.submitAdminDecision('${product.id}', 'approve')">
            ✓ Verification Approved
          </button>
          <button class="btn-secondary" style="border-color: var(--terracotta); color: var(--terracotta);" onclick="window.submitAdminDecision('${product.id}', 'request_changes')">
            ↩ Request Changes
          </button>
        </div>
      </div>

      <!-- MANDATORY COMPLIANCE DISCLAIMER -->
      <div class="disclaimer-box">
        <span>${renderIcon('alertCircle', '', 16)}</span>
        <div>
          <strong>Compliance Disclaimer:</strong><br>
          Approval confirms reviewed registration information; blockchain provides a tamper-evident record of registered provenance events, but does not independently prove physical authenticity.
        </div>
      </div>
    </div>
  `;
}

// Global Admin Handlers
window.inspectProductDetail = (id) => {
  const p = appState.data.products.find(item => item.id === id);
  appState.setAdminScreen('review_detail', { target: p });
};

window.approveArtisan = (id) => {
  alert(`Artisan ${id} verification approved!`);
};

window.submitAdminDecision = (productId, decision) => {
  const note = document.getElementById('admin_review_note')?.value || '';
  appState.adminDecision(productId, decision, note);
  alert(`Verification decision [${decision === 'approve' ? 'Approved' : 'Changes Requested'}] recorded.`);
  appState.setAdminScreen('dashboard');
};

window.submitAdminLogin = () => {
  const user = document.getElementById('admin_login_username')?.value?.trim() || '';
  const pass = document.getElementById('admin_login_password')?.value || '';
  const errEl = document.getElementById('admin_login_error');

  const result = appState.loginAdmin(user, pass);
  if (!result.success) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = result.message;
    } else {
      alert(result.message);
    }
  }
};

window.requestAdminSignOut = () => {
  appState.data.showAdminSignOutModal = true;
  appState.notify();
};

window.cancelAdminSignOut = () => {
  delete appState.data.showAdminSignOutModal;
  appState.notify();
};

window.confirmAdminSignOut = () => {
  appState.logoutAdmin();
};

window.logoutAdmin = () => {
  window.requestAdminSignOut();
};

window.exitAdminMode = () => {
  appState.logoutAdmin();
  appState.setRole('landing');
};
