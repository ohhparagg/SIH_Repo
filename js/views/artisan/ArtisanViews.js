/* ==========================================================================
   CRAFTORA - Clean Artisan Experience Views (Screens 2–16)
   Strict Visual Polish matching Artisan Screen.pdf
   ========================================================================== */

import { appState } from '../../state.js';
import { renderSmartPricingCalculator } from '../../components/SmartPricingCalculator.js';
import { renderDigitalProductPassportCard } from '../../components/DigitalProductPassportCard.js';
import { renderAIChecklist } from '../../components/AIChecklist.js';
import { renderIcon } from '../../components/Icons.js';
import { apiService } from '../../services/api.js';
import { analyzeProductImagePipeline } from '../../services/aiProductAnalysis.js';

let _productCameraStream = null;

export function renderArtisanView(screen) {
  const state = appState.data;

  // 1. Admin must NOT be treated as Artisan
  if (state.currentRole === 'admin') {
    return `
      <div style="padding: 40px 20px; text-align: center;">
        <div style="color: var(--copper); font-size: 32px; margin-bottom: 12px;">🔒</div>
        <h3 style="font-size: 18px; margin-bottom: 8px;">Access Denied</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          Admin cannot access artisan workspace.
        </p>
      </div>
    `;
  }

  // 2. Authenticated Buyer must NOT access Artisan My Crafts
  if (state.currentRole === 'buyer') {
    return `
      <div style="padding: 40px 20px; text-align: center;">
        <div style="color: var(--copper); font-size: 32px; margin-bottom: 12px;">🔒</div>
        <h3 style="font-size: 18px; margin-bottom: 8px;">Access Denied</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          Buyers cannot access Artisan My Crafts.
        </p>
        <button class="btn-primary" onclick="window.navBuyer('explore')">
          Return to Marketplace
        </button>
      </div>
    `;
  }

  // 3. Unauthenticated user attempting to access protected artisan screen
  const protectedScreens = [
    'dashboard', 'my_crafts', 'product_detail', 'edit_product',
    'add_product', 'ai_analysis', 'review_product', 'smart_pricing',
    'market_matches', 'passport', 'provenance'
  ];
  if (protectedScreens.includes(screen) && !state.artisanAuth?.isRegistered) {
    return renderScreen2_MobileInput();
  }

  const products = state.products || [];
  const currentArtisan = state.artisanAuth?.artisanProfile
    || (state.selectedArtisanId && state.savedArtisans && state.savedArtisans.find(a => a.id === state.selectedArtisanId))
    || (state.savedArtisans && state.savedArtisans[0])
    || { id: state.selectedArtisanId || 'CRF-ART-001284', name: 'Artisan', rating: 0, ratingCount: 0 };
  const currentArtisanId = currentArtisan.id || state.selectedArtisanId || 'CRF-ART-001284';
  const myProducts = products.filter(p => p.artisanId === currentArtisanId);
  const selectedProduct = products.find(p => p.id === state.selectedProductId) || myProducts[0] || products[0];

  let html = '';
  switch (screen) {
    case 'onboarding':
      html = renderScreen2_MobileInput(); break;
    case 'onboarding_otp':
      html = renderScreen2_DemoOTP(); break;
    case 'profile_step1':
      html = renderScreen3_ProfileSetup(); break;
    case 'artisan_id_card':
      html = renderScreen3_ArtisanIdCard(); break;
    case 'welcome':
      html = renderScreen4_Welcome(); break;
    case 'add_product':
      html = renderScreen5_ProductCreationEntry(); break;
    case 'ai_analysis':
      html = renderScreen6_AIAnalysis(); break;
    case 'review_product':
      html = renderScreen7_ReviewProduct(selectedProduct); break;
    case 'smart_pricing':
      html = renderScreen8_SmartPricing(selectedProduct); break;
    case 'market_matches':
      html = renderScreen9_MarketMatches(selectedProduct); break;
    case 'passport':
      html = renderScreen10_Passport(selectedProduct); break;
    case 'provenance':
      html = renderScreen11_Provenance(selectedProduct); break;
    case 'my_crafts':
      html = renderScreen14_MyCrafts(myProducts); break;
    case 'product_detail':
      html = renderScreen15_ProductDetail(selectedProduct); break;
    case 'edit_product':
      html = renderScreen16_EditProduct(selectedProduct); break;
    case 'dashboard':
    default:
      html = renderScreen13_Dashboard(state); break;
  }

  if (state.deleteConfirmProductId) {
    const targetProduct = (state.products || []).find(p => p.id === state.deleteConfirmProductId);
    if (targetProduct) {
      html += renderDeleteConfirmationModal(targetProduct);
    }
  }

  if (state.showArtisanSignOutModal) {
    html += renderArtisanSignOutModal();
  }

  return html;
}

function renderArtisanSignOutModal() {
  return `
    <div id="artisan-signout-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); max-width: 360px; width: 100%; padding: 24px; text-align: center; box-shadow: var(--shadow-lg);">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(185, 28, 28, 0.1); color: var(--terracotta); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          ${renderIcon('logOut', '', 24)}
        </div>
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">Sign Out</h3>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
          Are you sure you want to sign out?
        </p>
        <div style="display: flex; gap: 10px;">
          <button class="btn-secondary" style="flex: 1; padding: 10px;" onclick="window.cancelArtisanSignOut()">
            Cancel
          </button>
          <button class="btn-primary" style="flex: 1; padding: 10px; background: var(--terracotta); border-color: var(--terracotta);" onclick="window.confirmArtisanSignOut()">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDeleteConfirmationModal(product) {
  if (product.isDemo) {
    return `
      <div class="qr-modal-overlay" style="z-index: 3000;" onclick="if(event.target === this) window.cancelDeleteProduct()">
        <div class="qr-modal-card" style="max-width: 360px; text-align: center; border-color: var(--gold); padding: 24px 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--gold-pale); color: var(--gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${renderIcon('shield', '', 22)}
          </div>
          <h3 style="font-size: 17px; font-weight: 800; margin-bottom: 6px; color: var(--text-primary);">Demo Product Protected</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.4;">
            This demo product is protected from deletion in the prototype demonstration.
          </p>
          <button class="btn-primary" style="width: 100%;" onclick="window.cancelDeleteProduct()">
            Cancel
          </button>
        </div>
      </div>
    `;
  }

  if (product.hasSalesHistory) {
    return `
      <div class="qr-modal-overlay" style="z-index: 3000;" onclick="if(event.target === this) window.cancelDeleteProduct()">
        <div class="qr-modal-card" style="max-width: 360px; text-align: center; border-color: var(--terracotta); padding: 24px 20px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(188, 78, 47, 0.1); color: var(--terracotta); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${renderIcon('alertCircle', '', 22)}
          </div>
          <h3 style="font-size: 17px; font-weight: 800; margin-bottom: 6px; color: var(--text-primary);">Sales History Record</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.4;">
            This product has sales history and cannot be deleted from active records.
          </p>
          <button class="btn-primary" style="width: 100%;" onclick="window.cancelDeleteProduct()">
            Cancel
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="qr-modal-overlay" style="z-index: 3000;" onclick="if(event.target === this) window.cancelDeleteProduct()">
      <div class="qr-modal-card" style="max-width: 360px; text-align: center; border-color: rgba(185, 28, 28, 0.4); padding: 24px 20px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(185, 28, 28, 0.1); color: var(--danger); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          ${renderIcon('trash', '', 22)}
        </div>
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 6px; color: var(--text-primary);">Delete this product?</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.4;">
          This product will be removed from your CRAFTORA catalogue.
        </p>

        <div class="craft-card" style="background: var(--bg-elevated); padding: 10px 12px; margin-bottom: 18px; text-align: left; display: flex; align-items: center; gap: 10px;">
          <img src="${product.imageUrl}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;">
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 700; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.title}</div>
            <div style="font-size: 11px; color: var(--copper); font-weight: 700;">₹${product.price}</div>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn-secondary" style="flex: 1; padding: 10px;" onclick="window.cancelDeleteProduct()">
            Cancel
          </button>
          <button class="btn-primary" style="flex: 1; padding: 10px; background: var(--danger); border-color: var(--danger);" onclick="window.confirmDeleteProduct('${product.id}')">
            Delete Product
          </button>
        </div>
      </div>
    </div>
  `;
}

// Screen 2 — Artisan Mobile Authentication (Sign In & Register)
function renderScreen2_MobileInput() {
  const draft = appState.data.onboardingDraft || {};
  const authMode = draft.authMode || 'register'; // 'signin' | 'register'
  const isSignIn = authMode === 'signin';

  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        ARTISAN ONBOARDING · AUTHENTICATION
      </div>
      <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800;">Welcome, Artisan 👋</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
        ${isSignIn ? 'Sign in to access your registered craft business.' : 'Register your craft business on CRAFTORA.'}
      </p>

      <!-- Clear Distinct Auth Mode Options -->
      <div style="display: flex; gap: 8px; max-width: 340px; margin: 0 auto 16px; background: var(--bg-elevated); padding: 4px; border-radius: var(--radius-md); border: 1.5px solid var(--border-light);">
        <button type="button" class="${isSignIn ? 'btn-primary' : 'btn-secondary'}"
                style="flex: 1; padding: 8px 10px; font-size: 12px; font-weight: 700; ${isSignIn ? 'background: var(--green); border-color: var(--green);' : ''}"
                onclick="window.setArtisanAuthMode('signin')">
          ${renderIcon('user', '', 14)} Sign In
        </button>
        <button type="button" class="${!isSignIn ? 'btn-primary' : 'btn-secondary'}"
                style="flex: 1; padding: 8px 10px; font-size: 12px; font-weight: 700; ${!isSignIn ? 'background: var(--green); border-color: var(--green);' : ''}"
                onclick="window.setArtisanAuthMode('register')">
          ${renderIcon('plus', '', 14)} Create New Account / Register
        </button>
      </div>

      <div class="craft-card" style="text-align: left; max-width: 340px; margin: 0 auto 20px;">
        <div id="artisan_mobile_error" style="display:none; padding:8px 10px; background:var(--danger-pale); border:1px solid var(--danger); border-radius:var(--radius-sm); color:var(--danger); font-size:12px; margin-bottom:12px; font-weight:600;"></div>

        <div class="form-group">
          <label class="form-label">${isSignIn ? 'Registered Mobile Number' : 'Mobile Number'}</label>
          <div style="display: flex; gap: 8px;">
            <span style="display: flex; align-items: center; padding: 10px 12px; background: var(--bg-elevated); border: 1.5px solid var(--border-light); border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; color: var(--text-primary);">
              🇮🇳 +91
            </span>
            <input type="tel" id="artisan_mobile_input" class="form-input" maxlength="15"
                   value="${draft.mobileNumber || (isSignIn ? '9876543210' : '')}" placeholder="10-digit number" style="font-size: 15px; letter-spacing: 0.05em; font-weight: 600;">
          </div>
        </div>

        ${isSignIn ? `
          <div class="notice-box" style="margin-bottom: 14px; font-size: 11px;">
            ${renderIcon('sparkles', '', 13)}
            <div>
              <strong>Demo Existing Artisans:</strong><br>
              • 9876543210 (Ramesh Kumar · Bamboo Craft)<br>
              • 9876543211 (Meera Devi · Madhubani Painting)<br>
              • 9876543212 (Harpreet Singh · Phulkari)
            </div>
          </div>
        ` : `
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
            ${renderIcon('shield', '', 14)} Secure registration. Demo OTP (1234) provided.
          </div>
        `}

        <button class="btn-primary" onclick="window.submitArtisanMobile()">
          ${isSignIn ? 'Sign In with Demo OTP' : 'Continue with Mobile & Register'} ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
        ${!isSignIn ? `
          <button class="btn-voice" onclick="window.openVoiceAssistantProfile()">
            ${renderIcon('mic', '', 16)} Or register using Voice Assistant
          </button>
        ` : ''}

        <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
          ${isSignIn ? `
            New artisan? <a href="#" onclick="window.setArtisanAuthMode('register'); return false;" style="color: var(--copper); text-decoration: underline; font-weight: 600;">Create New Account / Register</a>
          ` : `
            Already registered? <a href="#" onclick="window.setArtisanAuthMode('signin'); return false;" style="color: var(--copper); text-decoration: underline; font-weight: 600;">Sign In</a>
          `}
        </div>
      </div>
    </div>
  `;
}

// Screen 2B — Demo OTP Verification
function renderScreen2_DemoOTP() {
  const draft = appState.data.onboardingDraft || {};
  const phone = draft.mobileNumber || '9876543210';
  const isSignIn = draft.authMode === 'signin';

  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        ARTISAN ONBOARDING · STEP 2 OF 3
      </div>
      <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800;">${isSignIn ? 'Sign In Verification' : 'Verify Mobile Number'}</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
        Enter the 4-digit demo OTP sent to <strong>+91 ${phone}</strong>
      </p>

      <div class="craft-card" style="text-align: left; max-width: 340px; margin: 0 auto 20px;">
        <div id="artisan_otp_error" style="display:none; padding:8px 10px; background:var(--danger-pale); border:1px solid var(--danger); border-radius:var(--radius-sm); color:var(--danger); font-size:12px; margin-bottom:12px;"></div>

        <div class="form-group" style="text-align: center;">
          <label class="form-label" style="text-align: center;">Enter 4-Digit OTP</label>
          <input type="text" id="artisan_otp_input" class="form-input" maxlength="4" value="1234"
                 style="text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 0.4em; width: 180px; margin: 0 auto; color: var(--green);">
        </div>

        <div class="notice-box" style="margin-bottom: 16px; font-size: 12px; text-align: left;">
          ${renderIcon('sparkles', '', 14)}
          <div><strong>Demo Mode Active:</strong><br>Use OTP <strong>1234</strong> to simulate instant verification.</div>
        </div>

        <button class="btn-primary" onclick="window.verifyArtisanOTP()">
          ${isSignIn ? 'Sign In & Enter Dashboard' : 'Verify & Continue'} ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>

      <div style="font-size: 12px; color: var(--text-muted);">
        Didn't receive code? <a href="#" onclick="alert('Demo OTP is 1234'); return false;" style="color: var(--copper); font-weight: 600;">Resend OTP</a> • <a href="#" onclick="window.navArtisan('onboarding'); return false;" style="color: var(--text-secondary);">Change Number</a>
      </div>
    </div>
  `;
}

// Screen 3 — Profile Setup Step (No Aadhaar collection)
function renderScreen3_ProfileSetup() {
  const draft = appState.data.onboardingDraft || {};
  return `
    <div style="padding: 24px 20px;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        ARTISAN ONBOARDING · STEP 3 OF 3
      </div>
      <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">Setup Artisan Profile</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
        Tell us about your craft. You can type or use your voice in English or Hindi.
      </p>

      ${draft.isVoiceExtracted ? `
        <div class="notice-box" style="margin-bottom: 16px; font-size: 12px; text-align: left; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderIcon('sparkles', '', 16)}
            <div>
              <strong>Voice-Suggested Profile:</strong> Fields populated from your transcript. Review and edit as needed.
            </div>
          </div>
          <span class="badge-pill badge-emerald" style="font-size: 10px; white-space: nowrap;">Voice AI</span>
        </div>
      ` : ''}

      <div style="text-align: center; margin-bottom: 18px;">
        <div style="width: 76px; height: 76px; border-radius: 50%; background: var(--bg-elevated); border: 2px dashed var(--text-copper); margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; color: var(--copper); cursor: pointer;" onclick="alert('Profile photo selected!')">
          ${renderIcon('camera', '', 28)}
        </div>
        <div style="font-size: 12px; color: var(--copper); font-weight: 600;">Add Workshop Photo (Optional)</div>
      </div>

      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="artisan_name_input" class="form-input" value="${draft.name || ''}" placeholder="Enter your name">
      </div>

      <div class="form-group">
        <label class="form-label">Primary Craft Category</label>
        <select id="artisan_craft_select" class="form-select">
          <option value="" disabled ${!draft.craftCategory ? 'selected' : ''}>Select your craft</option>
          <option value="Bamboo Craft" ${draft.craftCategory === 'Bamboo Craft' ? 'selected' : ''}>Bamboo Craft (Assam)</option>
          <option value="Madhubani Painting" ${draft.craftCategory === 'Madhubani Painting' ? 'selected' : ''}>Madhubani Painting (Bihar)</option>
          <option value="Blue Pottery" ${draft.craftCategory === 'Blue Pottery' ? 'selected' : ''}>Blue Pottery (Jaipur, Rajasthan)</option>
          <option value="Phulkari Embroidery" ${draft.craftCategory === 'Phulkari Embroidery' ? 'selected' : ''}>Phulkari Embroidery (Punjab)</option>
          <option value="Banarasi Weaving" ${draft.craftCategory === 'Banarasi Weaving' ? 'selected' : ''}>Banarasi Weaving (Varanasi, UP)</option>
          <option value="Terracotta Clay Work" ${draft.craftCategory === 'Terracotta Clay Work' ? 'selected' : ''}>Terracotta Clay Work (Bankura, West Bengal)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Workshop Location</label>
        <input type="text" id="artisan_location_input" class="form-input" value="${draft.location || ''}" placeholder="Enter your location">
      </div>

      <button class="btn-voice" style="margin-bottom: 16px;" onclick="window.openVoiceAssistantProfile()">
        ${renderIcon('mic', '', 18)} Speak by Voice (English / हिन्दी)
      </button>

      <!-- Explicit Aadhaar-free compliance note -->
      <div class="disclaimer-box" style="margin-bottom: 16px;">
        <span>${renderIcon('shield', '', 15)}</span>
        <div>
          <strong>Document-Free Digital Verification:</strong><br>
          CRAFTORA uses OTP authentication and peer review. No physical Aadhaar card images or biometric files are collected or stored.
        </div>
      </div>

      <button class="btn-primary" onclick="window.completeProfileSetup()">
        Generate CRAFTORA Identity ${renderIcon('arrowRight', '', 16)}
      </button>
    </div>
  `;
}

// Screen 3B — CRAFTORA User ID Issued Card
function renderScreen3_ArtisanIdCard() {
  const profile = appState.data.artisanAuth.artisanProfile || {};
  const artisanId = profile.id || 'CRF-ART-001284';

  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--success-pale); color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
        ${renderIcon('check', '', 28)}
      </div>
      <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 4px;">Registration Complete! 🎉</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
        Your official CRAFTORA Artisan Identity Card has been created.
      </p>

      <!-- Digital Identity Card -->
      <div class="craft-card craft-card-glow"
           style="text-align: left; max-width: 340px; margin: 0 auto 20px; border-top: 4px solid var(--green); padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
          <div style="font-family: var(--font-heading); font-weight: 800; font-size: 14px; color: var(--green);">
            CRAFTORA ARTISAN PASS
          </div>
          <span class="badge-pill badge-emerald">✓ Verified Identity</span>
        </div>

        <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--bg-elevated); border: 2px solid var(--border-green); display: flex; align-items: center; justify-content: center; color: var(--green);">
            ${renderIcon('user', '', 28)}
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text-primary);">${profile.name || 'Ramesh Kumar'}</div>
            <div style="font-size: 12px; color: var(--copper); font-weight: 600;">${profile.craftCategory || 'Bamboo Craft'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${profile.location || 'Assam, India'}</div>
          </div>
        </div>

        <div style="background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">
            Permanent CRAFTORA User ID:
          </div>
          <div style="font-family: monospace; font-size: 16px; font-weight: 800; color: var(--green); margin-top: 2px;">
            ${artisanId}
          </div>
        </div>

        <div style="background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">
              Artisan Rating ${(profile.ratingCount || 0) > 0 ? '(Demo Data)' : ''}
            </div>
            <div style="font-size: 15px; font-weight: 800; color: var(--gold); margin-top: 2px;">
              ${(profile.ratingCount || 0) > 0
                ? `⭐ ${profile.rating || 0} <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">(${profile.ratingCount} ratings)</span>`
                : `⭐ 0 <span style="font-size: 11px; color: var(--text-secondary); font-weight: 500;">(No ratings yet)</span>`
              }
            </div>
          </div>
          <span class="badge-pill ${(profile.ratingCount || 0) > 0 ? 'badge-gold' : 'badge-copper'}" style="font-size: 10px;">
            ${(profile.ratingCount || 0) > 0 ? '⭐ Verified' : 'New Artisan'}
          </span>
        </div>

        <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
          This ID links all your catalogue items to digital product passports and provenance records.
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
        <button class="btn-primary" onclick="window.enterArtisanDashboard()">
          Go to Artisan Dashboard ${renderIcon('arrowRight', '', 16)}
        </button>
        <button class="btn-secondary" style="border-color: var(--terracotta); color: var(--terracotta); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; margin-top: 4px;" onclick="window.requestArtisanSignOut()">
          ${renderIcon('logOut', '', 16)} Sign Out
        </button>
      </div>
    </div>
  `;
}

// Screen 4 — First-time Artisan Welcome
function renderScreen4_Welcome() {
  return `
    <div style="padding: 24px 20px; text-align: center;">
      <h2 style="font-size: 22px; margin-bottom: 4px;">Welcome to CRAFTORA 👋</h2>
      <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 28px;">
        Your digital craft journey starts here.<br>What would you like to do?
      </p>

      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 340px; margin: 0 auto 24px;">
        <button class="btn-primary" onclick="window.navArtisan('dashboard')">
          ${renderIcon('sparkles', '', 18)} Explore CRAFTORA ${renderIcon('arrowRight', '', 16)}
          <div style="font-size: 11px; font-weight: 400; opacity: 0.9;">Discover your workspace</div>
        </button>

        <button class="btn-secondary" style="border-color: var(--text-copper);" onclick="window.navArtisan('add_product')">
          ${renderIcon('palette', '', 18)} Add My First Product ${renderIcon('arrowRight', '', 16)}
          <div style="font-size: 11px; font-weight: 400; opacity: 0.9;">Create your first listing</div>
        </button>
      </div>

      <a href="#" onclick="window.navArtisan('dashboard'); return false;" style="font-size: 13px; color: var(--text-muted);">
        Maybe later
      </a>
    </div>
  `;
}

// Screen 5 — Product Creation Entry (Two Options: Choose Existing Image & Capture with Camera)
function renderScreen5_ProductCreationEntry() {
  const state = appState.data;
  const isCameraActive = Boolean(state.productCameraActive);
  const capturedPhoto = state.productCapturedPhoto;

  if (isCameraActive) {
    return `
      <div style="padding: 24px 20px; text-align: center; max-width: 440px; margin: 0 auto;">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.08em;">
          OPTION 2 · WEBCAM CAPTURE
        </div>
        <h2 style="font-size: 20px; margin-bottom: 4px;">Capture with Camera</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
          Position your craft in front of your laptop webcam and snap a clear photo.
        </p>

        <!-- Camera Viewfinder / Preview Frame -->
        <div style="position: relative; width: 100%; max-width: 360px; height: 260px; margin: 0 auto 16px; border-radius: var(--radius-md); overflow: hidden; background: #000; border: 2px solid var(--green); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.15);">
          <!-- Live Video Stream -->
          <video id="product_webcam_video" autoplay playsinline muted
                 style="width: 100%; height: 100%; object-fit: cover; ${capturedPhoto ? 'display: none;' : 'display: block;'}"></video>

          <!-- Captured Photo Frozen Preview -->
          ${capturedPhoto ? `
            <img id="product_webcam_preview" src="${capturedPhoto}" alt="Captured Product"
                 style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          ` : ''}

          <!-- Fallback Box (When camera API is denied or unavailable) -->
          <div id="camera_fallback_box"
               style="display: none; position: absolute; inset: 0; background: rgba(28, 25, 23, 0.95); color: #fff; padding: 20px; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #fff;">
              Camera unavailable. You can choose an existing product image instead.
            </div>
            <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 14px;">
              Please check your browser permissions or select an image file from your device.
            </p>
            <button class="btn-primary" style="font-size: 12px; padding: 8px 16px; width: auto;"
                    onclick="document.getElementById('artisan_fallback_file_input').click()">
              ${renderIcon('image', '', 14)} Choose Existing Product Image
            </button>
            <input type="file" id="artisan_fallback_file_input" accept="image/*" style="display: none;"
                   onchange="window.handleProductImageFileInput(event)">
          </div>
        </div>

        <!-- Camera Controls -->
        ${!capturedPhoto ? `
          <div style="display: flex; gap: 10px; max-width: 360px; margin: 0 auto;">
            <button class="btn-primary" style="flex: 1;" onclick="window.captureProductPhoto()">
              ${renderIcon('camera', '', 18)} Capture Photo
            </button>
            <button class="btn-secondary" style="width: auto; padding: 0 16px;" onclick="window.closeProductCamera()">
              Cancel
            </button>
          </div>
        ` : `
          <div style="display: flex; gap: 10px; max-width: 360px; margin: 0 auto;">
            <button class="btn-secondary" style="flex: 1;" onclick="window.retakeProductPhoto()">
              ${renderIcon('rotateCcw', '', 16)} Retake
            </button>
            <button class="btn-primary" style="flex: 1; background: var(--green);" onclick="window.useProductPhoto()">
              ${renderIcon('check', '', 16)} Use Photo
            </button>
          </div>
        `}

        <div style="font-size: 11px; color: var(--text-muted); margin-top: 14px;">
          After clicking "Use Photo", your image will be analyzed by CRAFTORA AI.
        </div>
      </div>
    `;
  }

  return `
    <div style="padding: 24px 20px; text-align: center; max-width: 440px; margin: 0 auto;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">Add Your Product</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 22px;">
        Let's turn your craft into a digital catalogue.
      </p>

      <!-- Option 1: Choose Existing Product Image -->
      <div class="craft-card craft-card-glow" style="padding: 20px 18px; margin-bottom: 14px; cursor: pointer; text-align: left; border: 1.5px solid var(--border-medium); display: flex; align-items: center; gap: 14px; transition: transform 0.2s ease;"
           onclick="document.getElementById('artisan_image_file_input').click()">
        <div style="width: 46px; height: 46px; border-radius: var(--radius-sm); background: var(--copper-pale); color: var(--copper); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${renderIcon('image', '', 24)}
        </div>
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-copper); text-transform: uppercase;">Option 1</div>
          <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Choose Existing Product Image</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Select photo from laptop or device files</div>
        </div>
        ${renderIcon('arrowRight', 'var(--text-muted)', 16)}
        <input type="file" id="artisan_image_file_input" accept="image/*" style="display: none;" onchange="window.handleProductImageFileInput(event)">
      </div>

      <!-- Option 2: Take Photo (Camera) -->
      <div class="craft-card craft-card-glow" style="padding: 20px 18px; margin-bottom: 20px; cursor: pointer; text-align: left; border: 1.5px solid var(--green); background: var(--green-pale); display: flex; align-items: center; gap: 14px; transition: transform 0.2s ease;"
           onclick="window.startProductCamera()">
        <div style="width: 46px; height: 46px; border-radius: var(--radius-sm); background: rgba(33, 80, 54, 0.15); color: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${renderIcon('camera', '', 24)}
        </div>
        <div style="flex: 1;">
          <div style="font-size: 11px; font-weight: 700; color: var(--green); text-transform: uppercase;">Option 2</div>
          <div style="font-weight: 700; font-size: 14px; color: var(--green);">Take Photo — Capture with Camera</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Use laptop webcam to take a live photo</div>
        </div>
        <button class="btn-primary" style="width: auto; padding: 6px 12px; font-size: 12px; background: var(--green);"
                onclick="event.stopPropagation(); window.startProductCamera()">
          Take Photo
        </button>
      </div>

      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 16px;">OR</div>

      <!-- Option 3: Describe by Voice -->
      <div class="craft-card" style="padding: 18px; margin-bottom: 24px; border-color: var(--terracotta); cursor: pointer;" onclick="window.openVoiceAssistantProduct()">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
          <span style="color: var(--terracotta);">${renderIcon('mic', '', 24)}</span>
          <div style="text-align: left;">
            <div style="font-weight: 700; font-size: 14px; color: var(--terracotta);">Describe by Voice</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Speak in Hindi or English to list product</div>
          </div>
        </div>
      </div>

      ${renderAIChecklist(false)}
    </div>
  `;
}

// Screen 6 — AI Catalogue Processing State
function renderScreen6_AIAnalysis() {
  const state = appState.data;
  const draft = state.productCreationDraft || {};
  const currentProduct = (state.products || []).find(p => p.id === state.selectedProductId) || draft;
  const pipeline = state.aiAnalysisPipeline || { status: 'success' };
  const displayImage = pipeline.enhancedImage || draft.imageUrl || currentProduct.imageUrl || 'assets/bamboo_basket.png';
  const displayTitle = currentProduct.title || draft.title || 'Handcrafted Bamboo Basket';
  const displayCategory = currentProduct.category || draft.category || 'Bamboo Craft';
  const displayMaterials = Array.isArray(currentProduct.materials)
    ? currentProduct.materials.join(', ')
    : (Array.isArray(draft.materials) ? draft.materials.join(', ') : (draft.materials || 'Natural Bamboo'));
  const confidence = currentProduct.confidence || pipeline.data?.confidence || 'Needs review';

  // 1. Analyzing State
  if (pipeline.status === 'analyzing') {
    return `
      <div style="padding: 24px 20px; text-align: center;">
        <h2 style="font-size: 20px; margin-bottom: 12px; color: var(--copper); display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${renderIcon('sparkles', '', 20)} Analyzing Your Product
        </h2>
        <div style="border-radius: var(--radius-md); overflow: hidden; max-height: 220px; margin: 0 auto 16px; border: 1.5px solid var(--border-green); background: #000;">
          <img src="${displayImage}" alt="Uploaded Image" style="width: 100%; height: 220px; object-fit: cover;">
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          CRAFTORA AI Vision is inspecting visual contours, materials, and category...
        </div>
        <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--bg-elevated); padding: 8px 16px; border-radius: var(--radius-full); font-size: 12px; color: var(--copper); font-weight: 700;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--gold); animation: pulse 1.2s infinite;"></span>
          Running Multimodal Vision Analysis...
        </div>
      </div>
    `;
  }

  // 2. Quality Check Failed State
  if (pipeline.status === 'quality_failed') {
    return `
      <div style="padding: 24px 20px; text-align: center; max-width: 400px; margin: 0 auto;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(185, 28, 28, 0.1); color: var(--terracotta); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          ${renderIcon('alertCircle', '', 28)}
        </div>
        <h2 style="font-size: 19px; font-weight: 800; margin-bottom: 6px; color: var(--text-primary);">
          Image Quality Insufficient
        </h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.4;">
          Image quality is insufficient for reliable analysis.<br>
          <span style="font-size: 12px; color: var(--terracotta); font-weight: 600;">${pipeline.message || 'The photo is too dark, blurry, or lacks clear contours.'}</span>
        </p>

        <div style="border-radius: var(--radius-md); overflow: hidden; max-height: 160px; margin: 0 auto 20px; border: 1px solid var(--border-light); opacity: 0.85;">
          <img src="${pipeline.rawImage || displayImage}" alt="Uploaded Image" style="width: 100%; height: 160px; object-fit: cover;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-primary" onclick="window.startProductCamera()">
            ${renderIcon('camera', '', 16)} Retake Photo
          </button>
          <button class="btn-secondary" onclick="document.getElementById('artisan_image_file_input_fallback').click()">
            ${renderIcon('image', '', 16)} Upload Another Image
          </button>
          <input type="file" id="artisan_image_file_input_fallback" accept="image/*" style="display: none;" onchange="window.handleProductImageFileInput(event)">
          <button class="btn-secondary" style="border-color: var(--border-medium); color: var(--text-secondary);" onclick="window.continueWithManualEntry()">
            Continue with Manual Entry →
          </button>
        </div>
      </div>
    `;
  }

  // 3. Service Error State
  if (pipeline.status === 'error') {
    return `
      <div style="padding: 24px 20px; text-align: center; max-width: 400px; margin: 0 auto;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(217, 119, 6, 0.1); color: var(--gold); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          ${renderIcon('alertCircle', '', 28)}
        </div>
        <h2 style="font-size: 19px; font-weight: 800; margin-bottom: 6px; color: var(--text-primary);">
          AI analysis is currently unavailable.
        </h2>
        <div style="font-size: 12px; font-weight: 600; color: var(--gold); margin-bottom: 8px;">(AI Analysis Unavailable)</div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.4;">
          AI analysis is currently unavailable.<br>
          <span style="font-size: 11px; color: var(--text-muted);">${pipeline.message || 'Vision service did not return a response.'}</span>
        </p>

        <div style="border-radius: var(--radius-md); overflow: hidden; max-height: 160px; margin: 0 auto 20px; border: 1px solid var(--border-light);">
          <img src="${pipeline.rawImage || displayImage}" alt="Uploaded Image" style="width: 100%; height: 160px; object-fit: cover;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-primary" onclick="window.retryAIAnalysis()">
            ${renderIcon('rotateCcw', '', 16)} Retry
          </button>
          <button class="btn-secondary" onclick="document.getElementById('artisan_image_file_input_fallback').click()">
            ${renderIcon('image', '', 16)} Upload Another Image
          </button>
          <input type="file" id="artisan_image_file_input_fallback" accept="image/*" style="display: none;" onchange="window.handleProductImageFileInput(event)">
          <button class="btn-secondary" style="border-color: var(--border-medium); color: var(--text-secondary);" onclick="window.continueWithManualEntry()">
            Enter Details Manually →
          </button>
        </div>
      </div>
    `;
  }

  const displayTags = Array.isArray(currentProduct.tags)
    ? currentProduct.tags.join(', ')
    : (Array.isArray(draft.tags) ? draft.tags.join(', ') : (draft.tags || 'craft, handmade'));

  // 4. Successful Structured Output State
  return `
    <div style="padding: 24px 20px; text-align: center;">
      <h2 style="font-size: 20px; margin-bottom: 4px; color: var(--copper); display: flex; align-items: center; justify-content: center; gap: 8px;">
        ${renderIcon('sparkles', '', 20)} AI Generated — Review Before Publishing
      </h2>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
        AI Generated — Review Before Publishing
      </p>

      <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; max-height: 200px; margin: 0 auto 16px; border: 1px solid var(--border-green); background: #000;">
        <img src="${displayImage}" alt="${displayTitle}" style="width: 100%; height: 200px; object-fit: cover;">
        <span class="badge-pill badge-gold" style="position: absolute; bottom: 8px; left: 8px;">
          ${renderIcon('sparkles', '', 12)} Image Enhanced
        </span>
        <span class="badge-pill badge-emerald" style="position: absolute; bottom: 8px; right: 8px;">
          ${confidence}
        </span>
      </div>

      ${renderAIChecklist(true)}

      <div class="craft-card" style="text-align: left; margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-copper); text-transform: uppercase;">
            Structured AI Output
          </div>
          <span class="badge-pill badge-emerald" style="font-size: 10px;">${confidence}</span>
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${displayTitle}</div>
        <div style="font-size: 12px; color: var(--copper); font-weight: 600; margin-bottom: 2px;"><strong>Category:</strong> ${displayCategory}</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;"><strong>Materials:</strong> ${displayMaterials}</div>
        <div style="font-size: 12px; color: var(--text-muted); font-style: italic; line-height: 1.4; margin-bottom: 6px;"><strong>Description:</strong> ${currentProduct.description || draft.description || ''}</div>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
          <strong style="color: var(--text-primary);">Tags:</strong> ${displayTags}
        </div>
      </div>

      <button class="btn-primary" style="margin-top: 16px;" onclick="window.navArtisan('review_product')">
        ${renderIcon('sparkles', '', 16)} Review & Edit ${renderIcon('arrowRight', '', 16)}
      </button>
    </div>
  `;
}

// Screen 7 — Review & Edit Draft
function renderScreen7_ReviewProduct(product) {
  const state = appState.data;
  const voiceSuggestion = state.productVoiceSuggestion;

  return `
    <div style="padding: 24px 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">Review Your Product</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        AI has prepared a draft listing.
      </p>

      ${voiceSuggestion ? `
        <div class="notice-box" style="margin-bottom: 16px; font-size: 12px; text-align: left; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderIcon('sparkles', '', 16)}
            <div>
              <strong>Voice Suggestion:</strong> ${
                voiceSuggestion.updatedFields && voiceSuggestion.updatedFields.length
                  ? `Updated <strong>${voiceSuggestion.updatedFields.join(', ')}</strong> from: <em>"${voiceSuggestion.transcript}"</em>`
                  : `Voice Input: <em>"${voiceSuggestion.transcript}"</em> — review or edit fields below.`
              }
            </div>
          </div>
          <span class="badge-pill badge-emerald" style="font-size: 10px; white-space: nowrap;">Voice Suggestion</span>
        </div>
      ` : ''}

      <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 16px; border: 1px solid var(--border-medium);">
        <img src="${product.imageUrl}" style="width: 100%; height: 180px; object-fit: cover;">
        <span class="badge-pill badge-gold" style="position: absolute; bottom: 10px; right: 10px;">
          ${renderIcon('sparkles', '', 12)} AI Enhanced
        </span>
      </div>

      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input type="text" id="edit_draft_title" class="form-input" value="${product.title}" oninput="window.syncProductDraftField('title', this.value)">
      </div>

      <div class="form-group">
        <label class="form-label">Category</label>
        <input type="text" id="edit_draft_cat" class="form-input" value="${product.category}" oninput="window.syncProductDraftField('category', this.value)">
      </div>

      <div class="form-group">
        <label class="form-label">Materials</label>
        <input type="text" id="edit_draft_mat" class="form-input" value="${Array.isArray(product.materials) ? product.materials.join(', ') : (product.materials || '')}" oninput="window.syncProductDraftField('materials', this.value)">
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="edit_draft_desc" class="form-textarea" rows="3" oninput="window.syncProductDraftField('description', this.value)">${product.description}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Tags</label>
        <input type="text" id="edit_draft_tags" class="form-input" value="${Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '')}" oninput="window.syncProductDraftField('tags', this.value)">
      </div>

      <button class="btn-voice" style="margin-bottom: 16px;" onclick="window.openVoiceAssistantProduct()">
        ${renderIcon('mic', '', 18)} Make changes by voice | Speak in your language
      </button>

      <button class="btn-primary" onclick="window.saveDraftAndContinuePricing('${product.id}')">
        ${renderIcon('sparkles', '', 16)} Continue to Pricing ${renderIcon('arrowRight', '', 16)}
      </button>
    </div>
  `;
}

// Screen 8 — Smart Pricing
function renderScreen8_SmartPricing(product) {
  return `
    <div style="padding: 24px 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
        ${renderIcon('rupee', '', 20)} Smart Pricing
      </h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Price your craft fairly based on costs & sample market benchmarks.
      </p>

      ${renderSmartPricingCalculator(product)}

      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
        <button class="btn-primary" onclick="window.completeProductCreation('${product.id}')">
          ${renderIcon('check', '', 16)} Complete & View in My Crafts
        </button>
        <button class="btn-secondary" onclick="window.continueToMarketLinkage('${product.id}')">
          Continue to Market Linkage ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>
    </div>
  `;
}

// Screen 9 — Market Linkage & AI-Assisted Buyer Matching
function renderScreen9_MarketMatches(product) {
  return `
    <div style="padding: 24px 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
        ${renderIcon('users', '', 20)} Find Your Market
      </h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Connect with relevant buyers using AI-Assisted Buyer Matching.
      </p>

      <div class="craft-card" style="display: flex; gap: 12px; align-items: center; margin-bottom: 20px;">
        <img src="${product.imageUrl}" style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover;">
        <div>
          <div style="font-weight: 700; font-size: 14px;">${product.title}</div>
          <div style="font-size: 12px; color: var(--copper);">₹${product.price} • ${product.category}</div>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-copper); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        ${renderIcon('sparkles', '', 14)} AI-Assisted Buyer Matching
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Potential Buyer Matches based on your product profile:</div>

      ${product.buyerMatches.map(m => `
        <div class="craft-card" style="margin-bottom: 12px; border-left: 3px solid var(--text-copper);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 14px; display: flex; align-items: center; gap: 6px;">
              ${renderIcon('store', '', 16)} ${m.buyerCategory}
            </strong>
            <span class="badge-pill badge-gold">Match: ${m.matchPercentage}%</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
            <strong>Looking for:</strong> ${m.lookingFor}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
            Requirements: ${m.requirement || 'Bulk handmade inventory'}
          </div>
          <button class="btn-secondary" style="font-size: 12px; padding: 6px 12px;" onclick="window.viewOpportunity('${m.buyerCategory}')">
            View Opportunity ${renderIcon('arrowRight', '', 14)}
          </button>
        </div>
      `).join('')}

      <div class="disclaimer-box" style="margin-top: 14px;">
        <span>${renderIcon('alertCircle', '', 16)}</span>
        <div>
          <strong>AI Matching Disclaimer:</strong> Buyer matches reflect target market profile demand.
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
        <button class="btn-primary" onclick="window.navArtisan('passport')">
          Continue → Digital Product Passport ${renderIcon('arrowRight', '', 16)}
        </button>
        <button class="btn-secondary" onclick="window.navArtisan('my_crafts')">
          ${renderIcon('palette', '', 16)} View in My Crafts
        </button>
      </div>
    </div>
  `;
}

// Screen 10 — Passport View
function renderScreen10_Passport(product) {
  return `
    <div style="padding: 24px 20px;">
      ${renderDigitalProductPassportCard(product)}
      
      <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
        <button class="btn-primary" onclick="window.navArtisan('provenance')">
          ${renderIcon('shield', '', 16)} View Verification History
        </button>
        <button class="btn-secondary" onclick="window.navArtisan('my_crafts')">
          ${renderIcon('palette', '', 16)} View in My Crafts
        </button>
      </div>
    </div>
  `;
}

// Screen 11 — Provenance & Verification History
function renderScreen11_Provenance(product) {
  return `
    <div style="padding: 24px 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
        ${renderIcon('shield', '', 20)} Blockchain-Backed Provenance Record
      </h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Product history &amp; verification events.
      </p>

      <div class="craft-card">
        <h4 style="font-size: 16px;">${product.title}</h4>
        <div style="font-size: 11px; color: var(--copper); font-weight: 700;">PRODUCT ID: ${product.id}</div>
        <span class="badge-pill badge-emerald" style="margin-top: 8px;">Registered Product</span>
      </div>

      <div class="craft-card">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-copper); margin-bottom: 12px;">
          VERIFICATION HISTORY LOG
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
          <div style="border-left: 2px solid var(--success); padding-left: 10px;">
            <div style="font-weight: 700; color: var(--success);">✓ Product Registered</div>
            <div style="font-size: 11px; color: var(--text-secondary);">17 Sep 2026 • Artisan: ${product.artisanName}</div>
          </div>

          <div style="border-left: 2px solid var(--success); padding-left: 10px;">
            <div style="font-weight: 700; color: var(--success);">✓ Product Details Recorded</div>
            <div style="font-size: 11px; color: var(--text-secondary);">17 Sep 2026 • Provenance record created</div>
          </div>

          <div style="border-left: 2px solid var(--text-copper); padding-left: 10px;">
            <div style="font-weight: 700; color: var(--copper);">o Verification Review</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Pending / Verification Approved</div>
          </div>
        </div>
      </div>

      <!-- Prototype Blockchain Box -->
      <div class="craft-card" style="border-color: var(--terracotta);">
        <div style="font-size: 12px; font-weight: 700; color: var(--terracotta); text-transform: uppercase; margin-bottom: 8px;">
          🔐 Prototype Blockchain Record
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">
          Network: Polygon Testnet Demo
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">
          Record Status: Recorded (Simulated ledger record)
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
        <button class="btn-primary" onclick="window.navArtisan('my_crafts')">
          ${renderIcon('palette', '', 16)} View in My Crafts
        </button>
        <button class="btn-secondary" onclick="window.navArtisan('dashboard')">
          Back to Artisan Dashboard ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>
    </div>
  `;
}

// Screen 13 — Artisan Dashboard / Home (With Emotional Brand Message)
function renderScreen13_Dashboard(state) {
  const artisan = state.artisanAuth?.artisanProfile
    || (state.selectedArtisanId && state.savedArtisans && state.savedArtisans.find(a => a.id === state.selectedArtisanId))
    || (state.savedArtisans && state.savedArtisans[0])
    || { name: 'Artisan', rating: 0, ratingCount: 0 };
  const products = state.products || [];
  const currentArtisanId = artisan.id || state.selectedArtisanId || 'CRF-ART-001284';
  const myProducts = products.filter(p => p.artisanId === currentArtisanId);
  const artisanRating = (typeof artisan.rating === 'number') ? artisan.rating : 0;
  const ratingCount = (typeof artisan.ratingCount === 'number') ? artisan.ratingCount : 0;

  const isDemoArtisan = (artisan.id === 'CRF-ART-001284');
  const productsSold = (artisan.productsSold !== undefined) ? artisan.productsSold : (isDemoArtisan ? 18 : 0);
  const totalEarnings = (artisan.totalEarnings !== undefined) ? artisan.totalEarnings : (isDemoArtisan ? 18650 : 0);
  const ordersCompleted = (artisan.ordersCompleted !== undefined) ? artisan.ordersCompleted : (isDemoArtisan ? 14 : 0);
  const recentSales = Array.isArray(artisan.recentSales) ? artisan.recentSales : (isDemoArtisan ? [
    { title: 'Bamboo Woven Table Lamp', buyer: 'Boutique Home Decor · 2 days ago', price: 1450 },
    { title: 'Bamboo Storage Basket', buyer: 'Handicraft Retailer · 5 days ago', price: 680 },
    { title: 'Handwoven Bamboo Basket', buyer: 'Eco Dining Store · 1 week ago', price: 520 }
  ] : []);

  return `
    <div style="padding: 20px;">
      <!-- Greeting Header -->
      <div style="margin-bottom: 18px;">
        <h2 style="font-size: 21px; font-weight: 800;">नमस्ते, ${artisan.name || 'Artisan'} 👋</h2>
        <div style="font-size: 13px; color: var(--copper); font-weight: 600; margin-top: 2px;">
          Master Artisan · ${artisan.craftCategory || 'Bamboo Craft'} • ${artisan.location || 'Assam, India'}
        </div>
      </div>

      <!-- Rating Summary Card -->
      <div class="craft-card" style="margin-bottom: 16px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-left: 3px solid var(--gold);">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Artisan Rating ${ratingCount > 0 ? '(Demo Data)' : ''}</div>
          <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;">
            <span style="font-size: 22px; font-weight: 800; color: var(--text-primary);">⭐ ${artisanRating}</span>
            <span style="font-size: 12px; color: var(--text-secondary);">${ratingCount > 0 ? `Based on ${ratingCount} ratings` : 'No ratings yet'}</span>
          </div>
        </div>
        <span class="badge-pill ${ratingCount > 0 ? 'badge-gold' : 'badge-copper'}" style="font-size: 10px;">${ratingCount > 0 ? '⭐ Verified Rating' : 'New Artisan'}</span>
      </div>

      <!-- Voice Assistant Feedback Banner -->
      ${state.dashboardVoiceFeedback ? `
        <div class="notice-box" style="margin-bottom: 16px; text-align: left; display: flex; align-items: flex-start; justify-content: space-between; ${state.dashboardVoiceFeedback.success ? 'border-left: 3px solid var(--green);' : 'border-left: 3px solid var(--danger);'}">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">Voice Command: "${state.dashboardVoiceFeedback.transcript}"</div>
            <div style="font-size: 13px; font-weight: 600; color: ${state.dashboardVoiceFeedback.success ? 'var(--green)' : 'var(--danger)'}; margin-top: 2px;">
              ${state.dashboardVoiceFeedback.message || state.dashboardVoiceFeedback.error}
            </div>
          </div>
          <button onclick="delete appState.data.dashboardVoiceFeedback; appState.notify();" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px;">✕</button>
        </div>
      ` : ''}

      <!-- Summary Stats Card -->
      <div class="craft-card craft-card-glow" style="margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-copper); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          ${renderIcon('palette', '', 14)} YOUR CRAFT SUMMARY
        </div>
        
        <div style="display: flex; gap: 24px; margin-bottom: 16px;">
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--text-primary);">${myProducts.length}</div>
            <div style="font-size: 12px; color: var(--text-muted);">Products</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--copper);">${myProducts.filter(p=>p.passportAvailable).length}</div>
            <div style="font-size: 12px; color: var(--text-muted);">Passports</div>
          </div>
        </div>

        <button class="btn-secondary" style="padding: 8px 14px; font-size: 13px;" onclick="window.navArtisan('my_crafts')">
          View My Crafts ${renderIcon('arrowRight', '', 14)}
        </button>
      </div>

      <!-- Business Overview Card (Zero state for new artisan / Demo benchmark for demo artisan) -->
      <div class="craft-card" style="margin-bottom: 20px; border-left: 3px solid var(--green);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--green); letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
            ${renderIcon('store', '', 14)} Business Overview
          </div>
          <span class="badge-pill ${isDemoArtisan ? 'badge-gold' : 'badge-copper'}" style="font-size: 10px;">${isDemoArtisan ? 'Sample Benchmark' : 'Live Artisan'}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; text-align: center;">
          <div style="background: var(--bg-elevated); padding: 10px 6px; border-radius: var(--radius-sm);">
            <div style="font-size: 18px; font-weight: 800; color: var(--text-primary);">${productsSold}</div>
            <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Products Sold</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 10px 6px; border-radius: var(--radius-sm);">
            <div style="font-size: 18px; font-weight: 800; color: var(--copper);">₹${totalEarnings.toLocaleString('en-IN')}</div>
            <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Earnings</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 10px 6px; border-radius: var(--radius-sm);">
            <div style="font-size: 18px; font-weight: 800; color: var(--green);">${ordersCompleted}</div>
            <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${isDemoArtisan ? 'Orders Done' : 'Orders Completed'}</div>
          </div>
        </div>

        <!-- Recent Sales Section -->
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.04em;">
          Recent Sales${isDemoArtisan ? ' (Sample Data)' : ''}
        </div>
        ${recentSales.length === 0 ? `
          <div style="padding: 16px; text-align: center; background: var(--bg-elevated); border-radius: var(--radius-sm); border: 1px dashed var(--border-light); color: var(--text-muted); font-size: 12.5px; margin-bottom: 10px;">
            No sales yet
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px; margin-bottom: 10px;">
            ${recentSales.map((s, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; ${idx < recentSales.length - 1 ? 'border-bottom: 1px dashed var(--border-light);' : ''}">
                <div>
                  <div style="font-weight: 600; color: var(--text-primary);">${s.title}</div>
                  <div style="font-size: 10.5px; color: var(--text-muted);">${s.buyer}</div>
                </div>
                <span style="font-weight: 700; color: var(--copper);">₹${s.price.toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>
        `}

        <div style="font-size: 10px; color: var(--text-muted); font-style: italic; text-align: center; border-top: 1px solid var(--border-light); padding-top: 6px;">
          ${isDemoArtisan ? '*Prototype simulated sales records for SIH demo demonstration.' : '*Live sales and orders will update automatically upon buyer order completion.'}
        </div>
      </div>

      <!-- Actions Section -->
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.05em;">
        What would you like to do?
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
        <button class="btn-primary" onclick="window.navArtisan('add_product')">
          ${renderIcon('camera', '', 18)} ADD NEW CRAFT
          <div style="font-size: 11px; font-weight: 400; opacity: 0.9;">Take a photo or speak</div>
        </button>

        <div class="grid-2">
          <button class="btn-secondary" onclick="window.navArtisan('smart_pricing')">
            ${renderIcon('rupee', '', 16)} Suggested Prices
          </button>
          <button class="btn-secondary" onclick="window.navArtisan('market_matches')">
            ${renderIcon('users', '', 16)} Find Buyers
          </button>
        </div>

        <button class="btn-secondary" onclick="window.navArtisan('passport')">
          ${renderIcon('globe', '', 16)} My Product Passports
        </button>

        <button class="btn-voice" onclick="window.openVoiceAssistantDashboard()">
          ${renderIcon('mic', '', 18)} Speak to CRAFTORA (Voice Assistant)
        </button>
      </div>

      <!-- EMPTY STATE IF 0 PRODUCTS -->
      ${myProducts.length === 0 ? `
        <div class="craft-card" style="text-align: center; padding: 28px;">
          <div style="color: var(--copper); margin-bottom: 8px;">${renderIcon('palette', '', 36)}</div>
          <h4 style="font-size: 15px; margin-bottom: 4px;">No Crafts Added Yet</h4>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
            Create your first digital craft catalog using photo or voice.
          </p>
          <button class="btn-primary" onclick="window.navArtisan('add_product')">
            ${renderIcon('plus', '', 16)} Add First Craft
          </button>
        </div>
      ` : ''}

      <!-- Incoming Buyer Inquiries Box -->
      ${state.buyerRequests.length > 0 ? `
        <div class="craft-card" style="border-left: 3px solid var(--terracotta);">
          <div style="font-size: 11px; font-weight: 700; color: var(--terracotta); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            ${renderIcon('store', '', 14)} INCOMING BUYER INQUIRY (${state.buyerRequests.length})
          </div>
          <div style="font-size: 14px; font-weight: 700;">${state.buyerRequests[0].buyerName}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
            "${state.buyerRequests[0].message}"
          </div>
          <span class="badge-pill badge-gold">${state.buyerRequests[0].interestType}</span>
        </div>
      ` : ''}
    </div>
  `;
}

// Screen 14 — My Crafts / Product Library
function renderScreen14_MyCrafts(products) {
  if (products.length === 0) {
    return `
      <div style="padding: 20px; text-align: center;">
        <h2 style="font-size: 20px; margin-bottom: 4px;">🎨 My Crafts</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">Your handmade products</p>
        
        <div class="craft-card" style="padding: 30px 20px;">
          <div style="color: var(--copper); margin-bottom: 10px;">${renderIcon('package', '', 40)}</div>
          <h3 style="font-size: 16px; margin-bottom: 6px;">No products yet</h3>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 20px;">
            Add your first craft to start building your digital catalogue.
          </p>
          <button class="btn-primary" onclick="window.navArtisan('add_product')">
            ${renderIcon('plus', '', 16)} Add New Product
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">🎨 My Crafts</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Your handmade products catalog.
      </p>

      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
        ${products.map(p => `
          <div class="craft-card" style="display: flex; gap: 14px; align-items: center;">
            <img src="${p.imageUrl}" style="width: 80px; height: 80px; border-radius: var(--radius-md); object-fit: cover;">
            <div style="flex: 1;">
              <h4 style="font-size: 15px; margin-bottom: 2px;">${p.title}</h4>
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">${p.category}</div>
              <div style="font-size: 14px; font-weight: 800; color: var(--copper);">₹${p.price}</div>
              <div style="margin-top: 4px;">
                <span class="badge-pill badge-emerald">🌐 Passport Available</span>
              </div>
            </div>
            <button class="btn-icon" onclick="window.viewArtisanProductDetail('${p.id}')">
              ${renderIcon('arrowRight', '', 16)}
            </button>
          </div>
        `).join('')}
      </div>

      <button class="btn-primary" onclick="window.navArtisan('add_product')">
        ${renderIcon('plus', '', 16)} Add New Craft
      </button>
    </div>
  `;
}

// Screen 15 — Single Product Details
function renderScreen15_ProductDetail(product) {
  if (!product) {
    return `
      <div style="padding: 30px 20px; text-align: center;">
        <h3 style="font-size: 18px; margin-bottom: 6px;">Product Not Found</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          This product is no longer available in your catalogue.
        </p>
        <button class="btn-primary" onclick="window.navArtisan('my_crafts')">
          View My Crafts
        </button>
      </div>
    `;
  }

  const state = appState.data;
  const currentArtisan = state.artisanAuth?.artisanProfile
    || (state.selectedArtisanId && state.savedArtisans && state.savedArtisans.find(a => a.id === state.selectedArtisanId))
    || (state.savedArtisans && state.savedArtisans[0]);
  const currentArtisanId = currentArtisan?.id || state.selectedArtisanId;
  const isOwner = Boolean(state.currentRole === 'artisan' && currentArtisanId && product.artisanId === currentArtisanId);

  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 14px;">My Product</h2>

      <div class="craft-card">
        <img src="${product.imageUrl}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 14px;">

        <h3 style="font-size: 18px; margin-bottom: 4px;">${product.title}</h3>
        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">${product.category}</div>

        <div style="font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          ${renderIcon('rupee', '', 16)} <strong>Selling Price:</strong> ₹${product.price}
        </div>
        <div style="font-size: 13px; margin-bottom: 6px;">
          🌿 <strong>Material:</strong> ${Array.isArray(product.materials) ? product.materials.join(', ') : (product.materials || '')}
        </div>
        <div style="font-size: 13px; display: flex; align-items: center; gap: 6px;">
          ${renderIcon('mappin', '', 14)} <strong>Made in:</strong> ${product.artisanLocation}
        </div>
      </div>

      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.05em;">
        What would you like to do?
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn-secondary" onclick="window.navArtisan('edit_product')">
          ${renderIcon('palette', '', 16)} Edit Product
        </button>

        <button class="btn-secondary" onclick="window.navArtisan('smart_pricing')">
          ${renderIcon('rupee', '', 16)} Change Price
        </button>

        <button class="btn-secondary" onclick="window.navArtisan('passport')">
          ${renderIcon('globe', '', 16)} View Product Passport
        </button>

        <button class="btn-primary" onclick="window.navArtisan('passport')">
          ${renderIcon('qr', '', 16)} Show QR Code
        </button>

        ${isOwner ? `
          <button class="btn-secondary" style="color: var(--danger); border-color: rgba(185, 28, 28, 0.35); background: rgba(185, 28, 28, 0.04); margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="window.requestDeleteProduct('${product.id}')">
            ${renderIcon('trash', '', 15)} Delete Product
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Screen 16 — Edit Your Product
function renderScreen16_EditProduct(product) {
  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">✏️ Edit Your Product</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Make changes if needed.
      </p>

      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input type="text" id="edit_p_name" class="form-input" value="${product.title}">
      </div>

      <div class="form-group">
        <label class="form-label">Craft</label>
        <input type="text" id="edit_p_cat" class="form-input" value="${product.category}">
      </div>

      <div class="form-group">
        <label class="form-label">Material</label>
        <input type="text" id="edit_p_mat" class="form-input" value="${product.materials.join(', ')}">
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="edit_p_desc" class="form-textarea" rows="3">${product.description}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Tags</label>
        <input type="text" id="edit_p_tags" class="form-input" value="${product.tags.join(', ')}">
      </div>

      <button class="btn-voice" style="margin-bottom: 16px;" onclick="window.openVoiceAssistantProduct()">
        ${renderIcon('mic', '', 18)} Change by voice | Speak in your language
      </button>

      <button class="btn-primary" onclick="window.saveProductEdits('${product.id}')">
        Save Changes ✓
      </button>
    </div>
  `;
}

// Global Artisan Handlers
window.syncProductDraftField = (field, value) => {
  const p = appState.data.products.find(item => item.id === appState.data.selectedProductId) || appState.data.products[0];
  if (p) {
    if (field === 'materials') {
      p.materials = value.split(',').map(s => s.trim()).filter(Boolean);
    } else if (field === 'tags') {
      p.tags = value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      p[field] = value;
    }
  }
};

window.setArtisanAuthMode = (mode) => {
  if (!appState.data.onboardingDraft) appState.data.onboardingDraft = {};
  appState.data.onboardingDraft.authMode = mode;
  appState.notify();
};

window.submitArtisanMobile = (mode) => {
  const phone = (typeof document !== 'undefined' ? document.getElementById('artisan_mobile_input')?.value?.trim() : '') || appState.data.onboardingDraft?.mobileNumber || '';
  const errEl = typeof document !== 'undefined' ? document.getElementById('artisan_mobile_error') : null;
  if (!/^[0-9]{10}$/.test(phone)) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = 'Enter a valid 10-digit mobile number.';
    } else if (typeof alert === 'function') {
      alert('Enter a valid 10-digit mobile number.');
    }
    return;
  }
  if (errEl) errEl.style.display = 'none';

  if (!appState.data.onboardingDraft) appState.data.onboardingDraft = {};
  appState.data.onboardingDraft.mobileNumber = phone;
  if (mode) appState.data.onboardingDraft.authMode = mode;
  appState.setArtisanScreen('onboarding_otp');
};

window.verifyArtisanOTP = () => {
  const otp = document.getElementById('artisan_otp_input')?.value?.trim() || '1234';
  const errEl = document.getElementById('artisan_otp_error');
  if (otp.length !== 4) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = 'Please enter a 4-digit OTP (Demo OTP: 1234)';
    } else {
      alert('Please enter a 4-digit OTP (Demo OTP: 1234)');
    }
    return;
  }
  if (!appState.data.onboardingDraft) appState.data.onboardingDraft = {};
  appState.data.onboardingDraft.otp = otp;

  if (appState.data.onboardingDraft?.authMode === 'signin') {
    const mobile = appState.data.onboardingDraft?.mobileNumber || '9876543210';
    appState.loginReturningArtisan(mobile);
  } else {
    appState.setArtisanScreen('profile_step1');
  }
};

window.completeProfileSetup = () => {
  const nameVal = document.getElementById('artisan_name_input')?.value?.trim() || '';
  const craftVal = document.getElementById('artisan_craft_select')?.value || '';
  const locVal = document.getElementById('artisan_location_input')?.value?.trim() || '';
  const phone = appState.data.onboardingDraft?.mobileNumber || '9876543210';

  appState.completeArtisanRegistration(nameVal, craftVal, locVal, phone);

  apiService.createArtisan({
    name: nameVal,
    craft: craftVal,
    location: locVal
  }).catch(err => console.warn('Artisan registration sync warning:', err));
};

window.loginAsReturningArtisan = () => {
  appState.loginReturningArtisan();
};

window.enterArtisanDashboard = () => {
  appState.setArtisanScreen('dashboard');
};

// Sign Out Artisan Handlers
window.requestArtisanSignOut = () => {
  appState.data.showArtisanSignOutModal = true;
  appState.notify();
};

window.cancelArtisanSignOut = () => {
  delete appState.data.showArtisanSignOutModal;
  appState.notify();
};

window.confirmArtisanSignOut = () => {
  appState.signOutArtisan();
};

window.startProductCamera = async () => {
  appState.data.productCameraActive = true;
  appState.data.productCapturedPhoto = null;
  appState.notify();

  setTimeout(async () => {
    const video = document.getElementById('product_webcam_video');
    const fallback = document.getElementById('camera_fallback_box');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (fallback) fallback.style.display = 'flex';
      if (video) video.style.display = 'none';
      return;
    }

    try {
      if (_productCameraStream) {
        _productCameraStream.getTracks().forEach(t => t.stop());
      }
      _productCameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      if (video) {
        video.srcObject = _productCameraStream;
        await video.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Webcam access error:', err);
      if (fallback) fallback.style.display = 'flex';
      if (video) video.style.display = 'none';
    }
  }, 60);
};

window.captureProductPhoto = () => {
  const video = document.getElementById('product_webcam_video');
  if (video && video.videoWidth && video.videoHeight) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      appState.data.productCapturedPhoto = dataUrl;
      appState.notify();
      return;
    } catch (e) {
      console.warn('Canvas webcam snapshot notice:', e);
    }
  }
  // Controlled demo fallback
  appState.data.productCapturedPhoto = 'assets/bamboo_basket.png';
  appState.notify();
};

window.retakeProductPhoto = () => {
  appState.data.productCapturedPhoto = null;
  appState.notify();
  setTimeout(() => {
    const video = document.getElementById('product_webcam_video');
    if (video && _productCameraStream) {
      video.srcObject = _productCameraStream;
      video.play().catch(() => {});
    }
  }, 60);
};

window.stopProductCameraStream = () => {
  if (_productCameraStream) {
    try {
      _productCameraStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    _productCameraStream = null;
  }
};

window.closeProductCamera = () => {
  window.stopProductCameraStream();
  appState.data.productCameraActive = false;
  appState.data.productCapturedPhoto = null;
  appState.notify();
};

window.useProductPhoto = () => {
  const photo = appState.data.productCapturedPhoto;
  window.stopProductCameraStream();
  appState.data.productCameraActive = false;
  window.proceedWithProductImage(photo || 'assets/bamboo_basket.png');
};

window.handleProductImageFileInput = (event) => {
  const file = event.target && event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof FileReader !== 'undefined') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      window.proceedWithProductImage(dataUrl);
    };
    reader.readAsDataURL(file);
  } else {
    window.proceedWithProductImage('assets/bamboo_basket.png');
  }
};

window.proceedWithProductImage = (imageUrl) => {
  const currentArtisan = appState.data.artisanAuth?.artisanProfile
    || (appState.data.selectedArtisanId && appState.data.savedArtisans && appState.data.savedArtisans.find(a => a.id === appState.data.selectedArtisanId))
    || (appState.data.savedArtisans && appState.data.savedArtisans[0])
    || { id: 'CRF-ART-001284', name: 'Ramesh Kumar', location: 'Assam, India', rating: 4.8, ratingCount: 24 };
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newProductId = `CRF-PRD-${randomSuffix}`;

  const currentArtisanId = currentArtisan.id || appState.data.selectedArtisanId || 'CRF-ART-001284';
  const currentRating = (typeof currentArtisan.rating === 'number') ? currentArtisan.rating : 0;
  const currentRatingCount = (typeof currentArtisan.ratingCount === 'number') ? currentArtisan.ratingCount : 0;

  const isBambooDemoAsset = Boolean(imageUrl && (imageUrl === 'assets/bamboo_basket.png' || imageUrl === 'bamboo_basket.png'));

  const newDraft = {
    id: newProductId,
    artisanId: currentArtisanId,
    artisanName: currentArtisan.name || 'Artisan Partner',
    artisanLocation: currentArtisan.location || 'India',
    artisanPhoto: currentArtisan.photoUrl || 'assets/artisan_ramesh.png',
    title: isBambooDemoAsset ? 'Handcrafted Bamboo Basket' : 'Analyzing with AI...',
    category: isBambooDemoAsset ? (currentArtisan.craftCategory || 'Bamboo Craft') : 'Analyzing...',
    materials: isBambooDemoAsset ? ['Natural Bamboo', 'Cane'] : ['Analyzing...'],
    productionTimeDays: 2,
    description: isBambooDemoAsset
      ? 'Authentic handcrafted bamboo product woven with traditional techniques. Lightweight, durable, and eco-friendly.'
      : 'AI vision is inspecting visual contours and materials...',
    tags: isBambooDemoAsset ? ['Handmade', 'Eco-friendly', 'Bamboo', 'Craft'] : ['craft', 'handmade'],
    price: 650,
    rating: currentRating,
    ratingCount: currentRatingCount,
    confidence: isBambooDemoAsset ? 'High confidence' : 'Needs review',
    costBreakdown: { materialCost: 180, labourCost: 250, productionTimeDays: 2, packagingCost: 40, totalEstimatedCost: 470 },
    aiInsight: { marketDemand: 'High', similarPriceRange: { min: 550, max: 750 }, indicativePriceRange: { min: 620, max: 680 }, suggestedPrice: 650, confidenceScore: 0.94 },
    buyerMatches: [ { id: 'M1', buyerCategory: 'Handicraft Retailer', matchPercentage: 92, lookingFor: 'Crafts', requirement: 'Seeking authentic crafts' } ],
    blockchainRecord: { network: 'Polygon Testnet Demo', recordType: 'Prototype Blockchain Record', status: 'Recorded', recordedAt: new Date().toLocaleDateString('en-GB'), isDemo: true, events: [{ title: 'Product Registration', date: new Date().toLocaleDateString('en-GB'), status: 'Completed' }] },
    status: 'draft',
    imageUrl: imageUrl || 'assets/bamboo_basket.png',
    passportAvailable: true,
    isDemo: false
  };

  appState.data.productCreationDraft = newDraft;
  appState.addProduct(newDraft);
  appState.data.selectedProductId = newDraft.id;

  if (isBambooDemoAsset) {
    appState.data.aiAnalysisPipeline = {
      status: 'success',
      enhancedImage: 'assets/bamboo_basket.png',
      rawImage: imageUrl,
      productId: newDraft.id,
      data: {
        productName: 'Handcrafted Bamboo Basket',
        category: 'Bamboo Craft',
        materials: 'Natural Bamboo, Cane',
        description: 'Authentic handcrafted bamboo product woven with traditional techniques. Lightweight, durable, and eco-friendly.',
        tags: ['Handmade', 'Eco-friendly', 'Bamboo', 'Craft'],
        confidence: 'High confidence',
        isDemoFallback: true
      }
    };
  } else {
    appState.data.aiAnalysisPipeline = {
      status: 'analyzing',
      enhancedImage: imageUrl,
      rawImage: imageUrl,
      productId: newDraft.id
    };
  }

  appState.setArtisanScreen('ai_analysis', { productId: newDraft.id });

  if (!isBambooDemoAsset) {
    window.runAIVisionPipeline(imageUrl, newDraft.id, currentArtisanId);
  }
};

window.runAIVisionPipeline = async (imageUrl, productId, artisanId) => {
  try {
    const result = await analyzeProductImagePipeline(imageUrl, {
      artisanId,
      language: appState.data.language || 'en'
    });

    const targetProduct = (appState.data.products || []).find(p => p.id === productId);

    if (result.analysisStatus === 'quality_failed') {
      appState.data.aiAnalysisPipeline = {
        status: 'quality_failed',
        message: result.message || 'Image quality is insufficient for reliable analysis.',
        rawImage: imageUrl,
        productId
      };
      appState.notify();
      return;
    }

    if (result.analysisStatus === 'error') {
      appState.data.aiAnalysisPipeline = {
        status: 'error',
        message: result.message || 'AI analysis is temporarily unavailable.',
        errorType: result.errorType || 'service_unavailable',
        rawImage: imageUrl,
        productId
      };
      appState.notify();
      return;
    }

    // Success
    const enhancedImg = result.enhancedImageUrl || imageUrl;
    appState.data.aiAnalysisPipeline = {
      status: 'success',
      data: result,
      enhancedImage: enhancedImg,
      productId
    };

    const mats = Array.isArray(result.materials)
      ? result.materials
      : (result.materials ? [result.materials] : ['Natural Materials']);

    if (targetProduct) {
      targetProduct.title = result.productName;
      targetProduct.category = result.category;
      targetProduct.materials = mats;
      targetProduct.description = result.description;
      targetProduct.tags = Array.isArray(result.tags) ? result.tags : ['handmade', 'craft'];
      targetProduct.imageUrl = enhancedImg;
      targetProduct.confidence = result.confidence;
      if (result.suggestedPrice) {
        targetProduct.price = result.suggestedPrice;
      }
    }

    if (appState.data.productCreationDraft && appState.data.productCreationDraft.id === productId) {
      appState.data.productCreationDraft.title = result.productName;
      appState.data.productCreationDraft.category = result.category;
      appState.data.productCreationDraft.materials = mats;
      appState.data.productCreationDraft.description = result.description;
      appState.data.productCreationDraft.tags = Array.isArray(result.tags) ? result.tags : ['handmade', 'craft'];
      appState.data.productCreationDraft.imageUrl = enhancedImg;
      appState.data.productCreationDraft.confidence = result.confidence;
    }

    appState.notify();
  } catch (err) {
    console.warn('AI vision pipeline execution notice:', err);
    appState.data.aiAnalysisPipeline = {
      status: 'error',
      message: 'Unable to complete AI analysis right now. Vision service unavailable.',
      errorType: 'service_unavailable',
      rawImage: imageUrl,
      productId
    };
    appState.notify();
  }
};

window.continueWithManualEntry = () => {
  const pId = appState.data.aiAnalysisPipeline?.productId || appState.data.selectedProductId;
  const p = (appState.data.products || []).find(item => item.id === pId);
  if (p) {
    if (p.title === 'Analyzing with AI...') p.title = 'New Product Listing';
    if (p.category === 'Analyzing...') p.category = 'Needs Review';
    if (p.materials?.[0] === 'Analyzing...') p.materials = ['Please enter materials'];
    if (p.description?.includes('AI vision')) p.description = 'Please enter product description';
  }
  if (appState.data.productCreationDraft) {
    if (appState.data.productCreationDraft.title === 'Analyzing with AI...') appState.data.productCreationDraft.title = 'New Product Listing';
    if (appState.data.productCreationDraft.category === 'Analyzing...') appState.data.productCreationDraft.category = 'Needs Review';
    if (appState.data.productCreationDraft.materials?.[0] === 'Analyzing...') appState.data.productCreationDraft.materials = ['Please enter materials'];
    if (appState.data.productCreationDraft.description?.includes('AI vision')) appState.data.productCreationDraft.description = 'Please enter product description';
  }
  appState.setArtisanScreen('review_product', { productId: pId });
};

window.retryAIAnalysis = () => {
  const pipeline = appState.data.aiAnalysisPipeline;
  if (pipeline && pipeline.rawImage && pipeline.productId) {
    appState.data.aiAnalysisPipeline.status = 'analyzing';
    appState.notify();
    window.runAIVisionPipeline(pipeline.rawImage, pipeline.productId, appState.data.selectedArtisanId);
  }
};

window.triggerProductImageUpload = () => {
  window.proceedWithProductImage('assets/bamboo_basket.png');
};

window.saveDraftAndContinuePricing = (id) => {
  const existing = (appState.data.products || []).find(p => p.id === id);
  const title = document.getElementById('edit_draft_title')?.value;
  const cat = document.getElementById('edit_draft_cat')?.value;
  const mat = document.getElementById('edit_draft_mat')?.value;
  const desc = document.getElementById('edit_draft_desc')?.value;

  appState.updateProduct({
    id,
    title: title || existing?.title || 'Handcrafted Item',
    category: cat || existing?.category || 'Bamboo Craft',
    materials: mat ? mat.split(',').map(s=>s.trim()) : (existing?.materials || ['Natural Bamboo']),
    description: desc || existing?.description || 'Handmade item'
  });

  appState.setArtisanScreen('smart_pricing', { productId: id });
};

window.completeProductCreation = (id) => {
  const currentArtisan = appState.data.artisanAuth?.artisanProfile
    || (appState.data.selectedArtisanId && appState.data.savedArtisans && appState.data.savedArtisans.find(a => a.id === appState.data.selectedArtisanId))
    || (appState.data.savedArtisans && appState.data.savedArtisans[0])
    || { id: 'CRF-ART-001284' };
  const currentArtisanId = currentArtisan.id || appState.data.selectedArtisanId || 'CRF-ART-001284';

  const priceInput = document.getElementById('final_selling_price');
  const sellingPrice = priceInput ? (parseFloat(priceInput.value) || 650) : 650;

  const targetId = id || appState.data.selectedProductId;
  appState.updateProduct({
    id: targetId,
    price: sellingPrice,
    status: 'verified',
    passportAvailable: true,
    artisanId: currentArtisanId
  });

  appState.setArtisanScreen('my_crafts');
};

window.continueToMarketLinkage = (id) => {
  const currentArtisan = appState.data.artisanAuth?.artisanProfile
    || (appState.data.selectedArtisanId && appState.data.savedArtisans && appState.data.savedArtisans.find(a => a.id === appState.data.selectedArtisanId))
    || (appState.data.savedArtisans && appState.data.savedArtisans[0])
    || { id: 'CRF-ART-001284' };
  const currentArtisanId = currentArtisan.id || appState.data.selectedArtisanId || 'CRF-ART-001284';

  const priceInput = document.getElementById('final_selling_price');
  const sellingPrice = priceInput ? (parseFloat(priceInput.value) || 650) : 650;

  const targetId = id || appState.data.selectedProductId;
  appState.updateProduct({
    id: targetId,
    price: sellingPrice,
    status: 'verified',
    passportAvailable: true,
    artisanId: currentArtisanId
  });

  appState.setArtisanScreen('market_matches', { productId: targetId });
};

window.viewOpportunity = (category) => {
  alert(`Sample market opportunity details for: ${category}`);
};

window.viewArtisanProductDetail = (id) => {
  appState.setArtisanScreen('product_detail', { productId: id });
};

window.saveProductEdits = (id) => {
  const existing = (appState.data.products || []).find(p => p.id === id);
  const title = document.getElementById('edit_p_name')?.value;
  const cat = document.getElementById('edit_p_cat')?.value;
  const mat = document.getElementById('edit_p_mat')?.value;
  const desc = document.getElementById('edit_p_desc')?.value;
  const tags = document.getElementById('edit_p_tags')?.value;

  appState.updateProduct({
    id,
    title: title || existing?.title || 'Handcrafted Item',
    category: cat || existing?.category || 'Bamboo Craft',
    materials: mat ? mat.split(',').map(s=>s.trim()) : (existing?.materials || ['Natural Bamboo']),
    description: desc || existing?.description || 'Handmade item',
    tags: tags ? tags.split(',').map(s=>s.trim()) : (existing?.tags || ['Handmade'])
  });

  alert("Product changes saved successfully!");
  appState.setArtisanScreen('product_detail', { productId: id });
};

window.logoutArtisan = () => {
  appState.logoutArtisan();
};

window.requestDeleteProduct = (id) => {
  const currentArtisan = appState.data.artisanAuth?.artisanProfile
    || (appState.data.selectedArtisanId && appState.data.savedArtisans && appState.data.savedArtisans.find(a => a.id === appState.data.selectedArtisanId))
    || (appState.data.savedArtisans && appState.data.savedArtisans[0]);
  const currentArtisanId = currentArtisan?.id || appState.data.selectedArtisanId;
  const product = (appState.data.products || []).find(p => p.id === id);
  if (!product || product.artisanId !== currentArtisanId) return;
  appState.data.deleteConfirmProductId = id;
  appState.notify();
};

window.cancelDeleteProduct = () => {
  delete appState.data.deleteConfirmProductId;
  appState.notify();
};

window.confirmDeleteProduct = (id) => {
  const targetId = id || appState.data.deleteConfirmProductId;
  const currentArtisan = appState.data.artisanAuth?.artisanProfile
    || (appState.data.selectedArtisanId && appState.data.savedArtisans && appState.data.savedArtisans.find(a => a.id === appState.data.selectedArtisanId))
    || (appState.data.savedArtisans && appState.data.savedArtisans[0]);
  const currentArtisanId = currentArtisan?.id || appState.data.selectedArtisanId;
  appState.deleteProduct(targetId, currentArtisanId);
};
