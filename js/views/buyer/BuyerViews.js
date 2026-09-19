/* ==========================================================================
   CRAFTORA - Clean Buyer Experience Views (Screens 2B–B9)
   Marketplace Aesthetic: Discover → Understand → Trust → Connect
   ========================================================================== */

import { appState } from '../../state.js';
import { renderDigitalProductPassportCard } from '../../components/DigitalProductPassportCard.js';
import { renderQRScannerModal } from '../../components/QRScannerModal.js';
import { renderIcon } from '../../components/Icons.js';

export function renderBuyerView(screen) {
  const state = appState.data;
  const products = state.products;
  const artisans = state.artisans;

  const selectedProduct = state.selectedProductId
    ? products.find(p => p.id === state.selectedProductId)
    : products[0];
  const selectedArtisan = artisans.find(a => a.id === state.selectedArtisanId) || artisans[0];

  let content = '';
  switch (screen) {
    case 'welcome':
      content = renderScreen2B_BuyerWelcome();
      break;
    case 'buyer_mobile':
      content = renderScreen2B_BuyerMobile();
      break;
    case 'buyer_otp':
      content = renderScreen2B_BuyerOTP();
      break;
    case 'register':
      content = renderScreen3B_BuyerRegistration();
      break;
    case 'buyer_signin':
      content = renderScreen2B_BuyerSignIn();
      break;
    case 'product_detail':
      content = renderScreenB4_ProductDetails(selectedProduct);
      break;
    case 'artisan_story':
      content = renderScreenB5_ArtisanStory(selectedArtisan, products);
      break;
    case 'passport':
      content = renderScreenB6_BuyerPassport(selectedProduct);
      break;
    case 'scan_qr':
      content = renderScreenB7_QRScan();
      break;
    case 'scan_qr_result':
      content = renderScreenB7_QRScanResult(state.scannedQRProduct || selectedProduct);
      break;
    case 'connect':
      content = renderScreenB8_ConnectForm(selectedProduct);
      break;
    case 'connect_success':
      content = renderScreenB8_ConnectSuccess();
      break;
    case 'profile':
      if (!state.buyerAuth?.isRegistered && !state.buyerAuth?.isGuest) {
        content = renderScreen2B_BuyerWelcome();
      } else {
        content = renderScreenB9_BuyerProfile(state);
      }
      break;
    case 'explore':
    default:
      content = renderScreenB3_BuyerHome(products);
      break;
  }

  if (state.showBuyerSignOutModal) {
    content += `
      <div id="buyer-signout-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); max-width: 360px; width: 100%; padding: 24px; text-align: center; box-shadow: var(--shadow-lg);">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(185, 28, 28, 0.1); color: var(--terracotta); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${renderIcon('logOut', '', 24)}
          </div>
          <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">Sign Out</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
            Are you sure you want to sign out?
          </p>

          <div style="display: flex; gap: 10px;">
            <button class="btn-secondary" style="flex: 1; padding: 10px;" onclick="window.cancelBuyerSignOut()">
              Cancel
            </button>
            <button class="btn-primary" style="flex: 1; padding: 10px; background: var(--terracotta); border-color: var(--terracotta);" onclick="window.confirmBuyerSignOut()">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return content;
}

// Screen 2B — Welcome Buyer
function renderScreen2B_BuyerWelcome() {
  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        BUYER AUTHENTICATION
      </div>
      <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800;">Welcome, Buyer 👋</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
        Discover authentic handmade crafts & meet the artisans behind them.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px; margin: 0 auto 20px;">
        <button class="btn-primary" onclick="window.navBuyer('buyer_mobile')">
          ${renderIcon('smartphone', '', 18)} Continue with Mobile
        </button>

        <div style="font-size: 12px; color: var(--text-muted); font-weight: 700; margin: 2px 0;">OR</div>

        <button class="btn-secondary" style="font-weight: 700; border-color: var(--green); color: var(--green);" onclick="window.navBuyer('buyer_signin')">
          ${renderIcon('user', '', 18)} Sign In
        </button>

        <button class="btn-secondary" style="font-weight: 700;" onclick="window.navBuyer('buyer_mobile')">
          ${renderIcon('plus', '', 18)} Create New Account / Register
        </button>

        <button class="btn-secondary" style="margin-top: 4px; font-size: 12px;" onclick="window.continueAsGuest()">
          ${renderIcon('store', '', 16)} Continue as Guest (Browse & Verify)
        </button>
      </div>

      <div style="font-size: 12px; color: var(--text-muted); margin-top: 14px;">
        Already registered? <a href="#" onclick="window.navBuyer('buyer_signin'); return false;" style="color: var(--copper); text-decoration: underline; font-weight: 600;">Sign In</a>
      </div>
    </div>
  `;
}

// Screen 2B-2 — Buyer Mobile Input
function renderScreen2B_BuyerMobile() {
  const draft = appState.data.buyerDraft || {};
  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        BUYER AUTHENTICATION · STEP 1 OF 3
      </div>
      <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800;">Enter Mobile Number</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
        We'll send a 4-digit demo OTP to verify your account.
      </p>

      <div class="craft-card" style="text-align: left; max-width: 340px; margin: 0 auto 20px;">
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <div style="display: flex; gap: 8px;">
            <span style="display: flex; align-items: center; padding: 10px 12px; background: var(--bg-elevated); border: 1.5px solid var(--border-light); border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; color: var(--text-primary);">
              🇮🇳 +91
            </span>
            <input type="tel" id="buyer_mobile_input" class="form-input" maxlength="10"
                   value="${draft.mobileNumber || ''}" placeholder="10-digit number" style="font-size: 15px; letter-spacing: 0.05em; font-weight: 600;">
          </div>
        </div>

        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
          ${renderIcon('shield', '', 14)} Secure verification. Demo OTP (1234) provided.
        </div>

        <button class="btn-primary" onclick="window.submitBuyerMobile()">
          Send Demo OTP ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
        <div style="font-size: 12px; color: var(--text-muted);">
          Already registered? <a href="#" onclick="window.navBuyer('buyer_signin'); return false;" style="color: var(--copper); text-decoration: underline; font-weight: 600;">Sign In</a>
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">
          <a href="#" onclick="window.continueAsGuest(); return false;" style="color: var(--text-secondary);">Continue as Guest</a>
        </div>
      </div>
    </div>
  `;
}

// Screen 2B-3 — Buyer Demo OTP Verification
function renderScreen2B_BuyerOTP() {
  const draft = appState.data.buyerDraft || {};
  const phone = draft.mobileNumber || '9876543210';

  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        BUYER AUTHENTICATION · STEP 2 OF 3
      </div>
      <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800;">Verify Mobile Number</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
        Enter the 4-digit demo OTP sent to <strong>+91 ${phone}</strong>
      </p>

      <div class="craft-card" style="text-align: left; max-width: 340px; margin: 0 auto 20px;">
        <div id="buyer_otp_error" style="display:none; padding:8px 10px; background:var(--danger-pale); border:1px solid var(--danger); border-radius:var(--radius-sm); color:var(--danger); font-size:12px; margin-bottom:12px;"></div>

        <div class="form-group" style="text-align: center;">
          <label class="form-label" style="text-align: center;">Enter 4-Digit OTP</label>
          <input type="text" id="buyer_otp_input" class="form-input" maxlength="4" value="1234"
                 style="text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 0.4em; width: 180px; margin: 0 auto; color: var(--green);">
        </div>

        <div class="notice-box" style="margin-bottom: 16px; font-size: 12px; text-align: left;">
          ${renderIcon('sparkles', '', 14)}
          <div><strong>Demo Mode Active:</strong><br>Use OTP <strong>1234</strong> to simulate instant verification.</div>
        </div>

        <button class="btn-primary" onclick="window.verifyBuyerOTP()">
          Verify & Continue ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>

      <div style="font-size: 12px; color: var(--text-muted);">
        Didn't receive code? <a href="#" onclick="alert('Demo OTP is 1234'); return false;" style="color: var(--copper); font-weight: 600;">Resend OTP</a> • <a href="#" onclick="window.navBuyer('buyer_mobile'); return false;" style="color: var(--text-secondary);">Change Number</a>
      </div>
    </div>
  `;
}

// Screen 3B — Buyer Registration / Profile
function renderScreen3B_BuyerRegistration() {
  const draft = appState.data.buyerDraft || {};
  return `
    <div style="padding: 24px 20px;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        BUYER REGISTRATION · STEP 3 OF 3
      </div>
      <h2 style="font-size: 20px; margin-bottom: 4px; font-weight: 800;">Setup Buyer Profile</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
        Join CRAFTORA to discover handmade crafts directly from master artisans.
      </p>

      <div class="form-group">
        <label class="form-label">Your Name</label>
        <input type="text" id="buyer_reg_name" class="form-input" value="${draft.name || ''}" placeholder="Enter your name">
      </div>

      <div class="form-group">
        <label class="form-label">City / Delivery Location</label>
        <input type="text" id="buyer_reg_city" class="form-input" value="${draft.city || ''}" placeholder="Enter your city">
      </div>

      <div class="form-group">
        <label class="form-label">Verified Mobile Number</label>
        <input type="text" id="buyer_reg_phone" class="form-input" value="+91 ${draft.mobileNumber || '9876543210'}" readonly style="background:var(--bg-elevated); color:var(--text-secondary);">
      </div>

      <button class="btn-primary" onclick="window.submitBuyerRegistration()">
        Complete Registration & Explore ${renderIcon('arrowRight', '', 16)}
      </button>

      <div style="font-size: 11px; color: var(--text-muted); margin-top: 14px; text-align: center;">
        Your permanent Buyer ID (CRF-BUY-XXXXX) will be generated.
      </div>
    </div>
  `;
}

// Screen 2B-4 — Existing Buyer Sign In
function renderScreen2B_BuyerSignIn() {
  return `
    <div style="padding: 24px 20px; text-align: center;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: var(--text-copper); text-transform: uppercase; margin-bottom: 6px;">
        BUYER SIGN IN
      </div>
      <h2 style="font-size: 22px; margin-bottom: 6px; font-weight: 800;">Welcome Back 👋</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
        Sign in to your CRAFTORA buyer account.
      </p>

      <div class="craft-card" style="text-align: left; max-width: 340px; margin: 0 auto 20px;">
        <div class="form-group">
          <label class="form-label">Registered Mobile Number</label>
          <div style="display: flex; gap: 8px;">
            <span style="display: flex; align-items: center; padding: 10px 12px; background: var(--bg-elevated); border: 1.5px solid var(--border-light); border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; color: var(--text-primary);">
              🇮🇳 +91
            </span>
            <input type="tel" id="buyer_signin_phone" class="form-input" maxlength="10"
                   value="9876543210" placeholder="10-digit number" style="font-size: 15px; letter-spacing: 0.05em; font-weight: 600;">
          </div>
        </div>

        <div class="notice-box" style="margin-bottom: 16px; font-size: 11px;">
          ${renderIcon('sparkles', '', 13)}
          <div><strong>Demo Buyer Account:</strong><br>+91 9876543210 (Arjun Sharma)</div>
        </div>

        <button class="btn-primary" onclick="window.submitBuyerSignIn()">
          Sign In with Demo OTP ${renderIcon('arrowRight', '', 16)}
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; max-width: 320px; margin: 0 auto;">
        <div style="font-size: 12px; color: var(--text-muted);">
          New buyer? <a href="#" onclick="window.navBuyer('welcome'); return false;" style="color: var(--copper); text-decoration: underline; font-weight: 600;">Create an Account</a>
        </div>
      </div>
    </div>
  `;
}

// Screen B3 — Buyer Home / Discover Crafts
function renderScreenB3_BuyerHome(products) {
  const state = appState.data;
  const searchQuery = (state.buyerSearchQuery || '').trim().toLowerCase();
  const selectedCategory = state.buyerSelectedCategory || 'all';

  // Standard Indian Craft Categories + any from products
  const standardCategories = [
    'All',
    'Bamboo Craft',
    'Madhubani Painting',
    'Phulkari',
    'Blue Pottery',
    'Hand Block Printing',
    'Terracotta',
    'Wood Craft',
    'Handloom'
  ];

  // Dynamic filter matching search & category
  const filteredProducts = products.filter(p => {
    // 1. Category check
    const matchesCategory = (
      selectedCategory === 'all' ||
      selectedCategory.toLowerCase() === 'all crafts' ||
      selectedCategory.toLowerCase() === 'all categories' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!matchesCategory) return false;

    // 2. Search check
    if (!searchQuery) return true;

    const inTitle = (p.title || '').toLowerCase().includes(searchQuery);
    const inArtisan = (p.artisanName || '').toLowerCase().includes(searchQuery);
    const inCategory = (p.category || '').toLowerCase().includes(searchQuery);
    const inMaterials = Array.isArray(p.materials) && p.materials.some(m => m.toLowerCase().includes(searchQuery));
    const inTags = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(searchQuery));
    const inDesc = (p.description || '').toLowerCase().includes(searchQuery);

    return inTitle || inArtisan || inCategory || inMaterials || inTags || inDesc;
  });

  return `
    <div style="padding: 20px;">
      <!-- Search Header -->
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 21px; font-weight: 800;">Discover Handmade Crafts</h2>
        <div style="font-size: 13px; color: var(--text-secondary);">
          Meet the master artisans behind them. (${filteredProducts.length} ${filteredProducts.length === 1 ? 'craft available' : 'crafts available'})
        </div>
      </div>

      <!-- Search Input -->
      <div style="margin-bottom: 16px; position: relative;">
        <div style="position: absolute; left: 14px; top: 12px; color: var(--text-muted); pointer-events: none;">
          ${renderIcon('search', '', 18)}
        </div>
        <input type="text" id="buyer_search_input" class="form-input"
               placeholder="Search product, artisan, craft, or material..."
               style="padding-left: 42px; padding-right: 36px;"
               value="${state.buyerSearchQuery || ''}"
               oninput="window.filterCrafts(this.value)">
        ${state.buyerSearchQuery ? `
          <button onclick="window.clearBuyerSearch()" title="Clear search" aria-label="Clear search"
                  style="position: absolute; right: 10px; top: 10px; background: none; border: none; font-size: 16px; color: var(--text-muted); cursor: pointer; padding: 2px 6px;">
            ✕
          </button>
        ` : ''}
      </div>

      <!-- Category Filter Pills -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em;">
          Explore by Craft
        </div>
        ${(selectedCategory !== 'all' || state.buyerSearchQuery) ? `
          <button onclick="window.clearAllBuyerFilters()" style="background: none; border: none; font-size: 11px; color: var(--terracotta); font-weight: 700; cursor: pointer; padding: 2px 4px;">
            Reset Filters
          </button>
        ` : ''}
      </div>

      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 20px; scrollbar-width: none;">
        ${standardCategories.map(cat => {
          const isSelected = (cat === 'All' && selectedCategory === 'all') || (selectedCategory.toLowerCase() === cat.toLowerCase());
          return `
            <button class="badge-pill ${isSelected ? 'badge-emerald' : 'badge-gold'}"
                    style="cursor: pointer; padding: 6px 14px; font-size: 12px; font-weight: ${isSelected ? '700' : '600'}; white-space: nowrap; border: 1.5px solid ${isSelected ? 'var(--green)' : 'var(--border-medium)'}; ${isSelected ? 'background: var(--green); color: #fff;' : 'background: #fff; color: var(--text-primary);'}"
                    onclick="window.selectCategory('${cat === 'All' ? 'all' : cat}')">
              ${cat === 'All' ? 'All Categories' : cat}
            </button>
          `;
        }).join('')}
      </div>

      <!-- QR Quick Verification CTA Card -->
      <div class="craft-card craft-card-glow" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: var(--copper);">${renderIcon('qr', '', 22)}</span>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: var(--copper);">Scan a Product QR</div>
            <div style="font-size: 11px; color: var(--text-secondary);">Verify craft provenance & authenticity</div>
          </div>
        </div>
        <button class="btn-primary" style="padding: 6px 14px; font-size: 12px; width: auto;" onclick="window.navBuyer('scan_qr')">
          Scan Now
        </button>
      </div>

      <!-- Featured Crafts Listing Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.05em;">
          Featured Crafts
        </div>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">
          Showing ${filteredProducts.length} of ${products.length}
        </span>
      </div>

      <!-- Crafts Cards Listing or Empty State -->
      <div id="crafts_container" style="display: flex; flex-direction: column; gap: 16px;">
        ${filteredProducts.length === 0 ? `
          <div class="craft-card" style="text-align: center; padding: 40px 20px; margin: 10px 0;">
            <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No products found</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; max-width: 280px; margin-left: auto; margin-right: auto;">
              No crafts matched your filter. Try a different search term or select All Categories.
            </p>
            <button class="btn-secondary" style="font-size: 12px; padding: 7px 16px; width: auto; margin: 0 auto;" onclick="window.clearAllBuyerFilters()">
              Clear Search & Filters
            </button>
          </div>
        ` : filteredProducts.map(p => {
          const artisan = (appState.data.artisans || []).find(a => a.id === p.artisanId) || { rating: p.rating, ratingCount: p.ratingCount };
          const rating = (typeof artisan.rating === 'number') ? artisan.rating : 0;
          const ratingCount = (typeof artisan.ratingCount === 'number') ? artisan.ratingCount : 0;
          return `
          <div class="craft-card" style="padding: 0; overflow: hidden; cursor: pointer;" onclick="window.viewProductDetails('${p.id}')">
            <div style="height: 190px; width: 100%; overflow: hidden; position: relative; background: #000;">
              <img src="${p.imageUrl}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;">
              <span class="badge-pill badge-emerald" style="position: absolute; top: 12px; right: 12px; background: rgba(16, 185, 129, 0.9); color: #fff;">
                🌐 Product Passport
              </span>
            </div>

            <div style="padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                <h3 style="font-size: 16px;">${p.title}</h3>
                <strong style="font-size: 16px; color: var(--copper);">₹${p.price}</strong>
              </div>

              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span>${renderIcon('user', '', 14)} ${p.artisanName}</span>
                <span style="font-weight: 700; color: var(--gold); font-size: 12px;">${ratingCount > 0 ? `⭐ ${rating} · ${ratingCount} ratings` : '⭐ 0 · No ratings yet'}</span>
              </div>

              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
                ${renderIcon('mappin', '', 12)} ${p.artisanLocation}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-light); padding-top: 10px;">
                <span style="font-size: 11px; color: var(--text-muted);">${p.category}</span>
                <span style="font-size: 12px; font-weight: 700; color: var(--copper); display: flex; align-items: center; gap: 4px;">
                  View Craft ${renderIcon('arrowRight', '', 14)}
                </span>
              </div>
            </div>
          </div>
        `;}).join('')}
      </div>
    </div>
  `;
}

// Screen B4 — Buyer Product Details
function renderScreenB4_ProductDetails(product) {
  if (!product) {
    return `
      <div style="padding: 30px 20px; text-align: center;">
        <div style="color: var(--copper); font-size: 32px; margin-bottom: 12px;">📦</div>
        <h3 style="font-size: 18px; margin-bottom: 6px;">Product Not Found</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          This product is no longer active in the CRAFTORA catalogue.
        </p>
        <button class="btn-primary" onclick="window.navBuyer('explore')">
          Return to Marketplace
        </button>
      </div>
    `;
  }

  const artisan = (appState.data.artisans || []).find(a => a.id === product.artisanId) || {
    rating: product.rating || 4.8,
    ratingCount: product.ratingCount || 24
  };

  return `
    <div style="padding: 20px;">
      <!-- Hero Image -->
      <div style="position: relative; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; border: 1px solid var(--border-medium); max-height: 240px;">
        <img src="${product.imageUrl}" style="width: 100%; height: 240px; object-fit: cover;">
        <button class="btn-icon" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6);" onclick="alert('Saved to favorites!')">
          ${renderIcon('heart', '', 18)}
        </button>
      </div>

      <h2 style="font-size: 22px; margin-bottom: 4px;">${product.title}</h2>
      <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">Handmade ${product.category}</div>
      <div style="font-size: 22px; font-weight: 800; color: var(--copper); margin-bottom: 16px;">₹${product.price}</div>

      <!-- Artisan Info Tile -->
      <div class="craft-card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px; margin-bottom: 16px; cursor: pointer;" onclick="window.viewArtisanProfile('${product.artisanId}')">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${product.artisanPhoto}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--text-copper);">
          <div>
            <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              🧑‍🎨 ${product.artisanName}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              📍 ${product.artisanLocation} • <span style="color: var(--gold); font-weight: 700;">${(artisan.ratingCount || 0) > 0 ? `⭐ ${artisan.rating || 0} · Based on ${artisan.ratingCount} ratings (Demo Data)` : '⭐ 0 · No ratings yet'}</span>
            </div>
          </div>
        </div>
        <span style="font-size: 12px; color: var(--copper); font-weight: 700; display: flex; align-items: center; gap: 4px;">
          View Story ${renderIcon('arrowRight', '', 14)}
        </span>
      </div>

      <!-- Specs & Details -->
      <div class="craft-card" style="margin-bottom: 16px;">
        <h4 style="font-size: 14px; margin-bottom: 8px;">About this craft</h4>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.6;">
          ${product.description}
        </p>

        <div style="font-size: 12px; margin-bottom: 6px;">
          🌿 <strong>Materials:</strong> ${product.materials.join(', ')}
        </div>
        <div style="font-size: 12px; display: flex; align-items: center; gap: 6px;">
          ${renderIcon('clock', '', 14)} <strong>Production Time:</strong> ${product.productionTimeDays} Days
        </div>
      </div>

      <!-- Demo Buyer Rating Section -->
      <div class="craft-card" style="margin-bottom: 16px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-size: 13px; font-weight: 700;">Rate Artisan Craftsmanship</h4>
          <span class="badge-pill badge-gold" style="font-size: 10px;">Demo Data</span>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
          Leave a verified prototype rating for ${product.artisanName}:
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${[1, 2, 3, 4, 5].map(star => `
            <button type="button" class="btn-secondary" style="padding: 6px 12px; font-size: 12px; font-weight: 700; color: var(--gold); border-color: var(--gold);"
                    onclick="window.submitArtisanRating('${product.artisanId}', ${star})">
              ${star} ⭐
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Trust Badges -->
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); padding: 12px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--success); display: flex; align-items: center; gap: 6px;">
          ${renderIcon('shield', '', 16)} Registered Product • Blockchain-backed provenance record
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn-primary" onclick="window.connectWithArtisan('${product.id}')">
          ${renderIcon('store', '', 18)} Connect with Artisan ${renderIcon('arrowRight', '', 16)}
        </button>

        <button class="btn-secondary" onclick="window.navBuyer('passport')">
          ${renderIcon('globe', '', 18)} View Digital Product Passport
        </button>
      </div>
    </div>
  `;
}

// Screen B5 — Artisan Profile / Story
function renderScreenB5_ArtisanStory(artisan, products) {
  const artisanProducts = products.filter(p => p.artisanId === artisan.id);

  return `
    <div style="padding: 20px;">
      <!-- Profile Header Card -->
      <div class="craft-card craft-card-glow" style="text-align: center; padding: 24px 18px; margin-bottom: 20px;">
        <img src="${artisan.photoUrl}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--text-copper); margin: 0 auto 12px;">
        <h2 style="font-size: 20px; margin-bottom: 4px;">${artisan.name}</h2>
        <div style="font-size: 13px; color: var(--copper); font-weight: 600; margin-bottom: 6px;">
          🧺 ${artisan.craftCategory} • 📍 ${artisan.location}
        </div>
        <div style="margin-bottom: 8px; display: inline-flex; align-items: center; gap: 6px; background: var(--bg-elevated); padding: 4px 12px; border-radius: var(--radius-full); font-size: 13px; font-weight: 700; color: var(--gold);">
          ${(artisan.ratingCount || 0) > 0 ? `⭐ ${artisan.rating || 0} <span style="color: var(--text-secondary); font-size: 11px; font-weight: 500;">(Based on ${artisan.ratingCount} ratings · Demo Data)</span>` : `⭐ 0 <span style="color: var(--text-secondary); font-size: 11px; font-weight: 500;">(No ratings yet)</span>`}
        </div>
        <div>
          <span class="badge-pill badge-emerald">✓ Registered Artisan</span>
        </div>
      </div>

      <!-- About Story -->
      <div class="craft-card" style="margin-bottom: 20px;">
        <h4 style="font-size: 14px; margin-bottom: 8px;">About the Artisan</h4>
        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          ${artisan.bio}
        </p>
        <div style="font-size: 12px; color: var(--copper);">
          Craft & Experience: ${artisan.craftExperience || 'Traditional Handcrafted Masterwork'}
        </div>
      </div>

      <!-- Products Grid -->
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; letter-spacing: 0.05em;">
        Artisan's Products (${artisanProducts.length})
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        ${artisanProducts.map(p => `
          <div class="craft-card" style="padding: 10px; cursor: pointer;" onclick="window.viewProductDetails('${p.id}')">
            <img src="${p.imageUrl}" style="width: 100%; height: 100px; object-fit: cover; border-radius: var(--radius-sm); margin-bottom: 8px;">
            <div style="font-size: 13px; font-weight: 700; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${p.title}</div>
            <div style="font-size: 12px; color: var(--copper); font-weight: 700;">₹${p.price}</div>
          </div>
        `).join('')}
      </div>

      <!-- Digital Identity -->
      <div class="craft-card" style="background: var(--bg-elevated); margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: var(--text-copper); text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
          ${renderIcon('globe', '', 14)} Digital Identity
        </div>
        <div style="font-size: 13px; font-weight: 700; margin-top: 4px;">Artisan ID: ${artisan.id}</div>
        <div style="font-size: 11px; color: var(--text-muted);">Registered on CRAFTORA</div>
      </div>

      <button class="btn-primary" onclick="window.connectWithArtisan('${artisanProducts[0]?.id || ''}')">
        ${renderIcon('store', '', 18)} Connect with Artisan ${renderIcon('arrowRight', '', 16)}
      </button>
    </div>
  `;
}

// Screen B6 — Buyer View of Passport
function renderScreenB6_BuyerPassport(product) {
  if (!product) {
    return `
      <div style="padding: 30px 20px; text-align: center;">
        <div style="color: var(--copper); font-size: 32px; margin-bottom: 12px;">📜</div>
        <h3 style="font-size: 18px; margin-bottom: 6px;">Product Passport Inactive</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          This product passport is no longer active in the CRAFTORA catalogue.
        </p>
        <button class="btn-primary" onclick="window.navBuyer('explore')">
          Return to Marketplace
        </button>
      </div>
    `;
  }

  return `
    <div style="padding: 20px;">
      ${renderDigitalProductPassportCard(product, true)}
    </div>
  `;
}

// Screen B7 — QR Scanner State 1
function renderScreenB7_QRScan() {
  return `
    <div style="padding: 20px;">
      ${renderQRScannerModal()}
    </div>
  `;
}

// Screen B7 — State 2: Verified Product View (Post-Scan Authenticity Result)
function renderScreenB7_QRScanResult(product) {
  if (!product) {
    return `
      <div style="padding: 30px 20px; text-align: center;">
        <div style="color: var(--copper); margin-bottom: 12px;">${renderIcon('alertCircle', '', 40)}</div>
        <h3 style="font-size: 18px; margin-bottom: 6px; color: var(--text-primary);">Product Not Registered</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          This QR code is not associated with an active registered product in the CRAFTORA catalogue.
        </p>
        <button class="btn-primary" onclick="window.navBuyer('explore')">
          Return to Marketplace
        </button>
      </div>
    `;
  }

  return `
    <div style="padding: 20px;">
      <div class="craft-card craft-card-glow" style="text-align: center; border-color: var(--success); padding: 24px 18px;">
        <div style="color: var(--success); margin-bottom: 8px;">
          ${renderIcon('shield', '', 40)}
        </div>
        <h3 style="font-size: 18px; color: var(--success); margin-bottom: 4px;">
          Registered Product
        </h3>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
          Verified product information match found on CRAFTORA.
        </p>

        <img src="${product.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 14px;">
        <h4 style="font-size: 16px; margin-bottom: 2px;">${product.title}</h4>
        <div style="font-size: 12px; color: var(--copper); font-weight: 700; margin-bottom: 14px;">
          Product ID: ${product.id}
        </div>

        <div style="background: var(--bg-elevated); border-radius: var(--radius-md); padding: 12px; font-size: 12px; text-align: left; margin-bottom: 16px;">
          <div>🧑‍🎨 <strong>Crafted by:</strong> ${product.artisanName}</div>
          <div style="margin-top: 4px;">📍 <strong>Origin:</strong> ${product.artisanLocation}</div>
        </div>

        <div style="text-align: left; font-size: 12px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; color: var(--success);">
          <div style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Registration recorded</div>
          <div style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Product details recorded</div>
          <div style="display: flex; align-items: center; gap: 6px;">${renderIcon('check', '', 14)} Blockchain-backed provenance record available</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-primary" onclick="window.navBuyer('passport')">
            View Full Product Passport ${renderIcon('arrowRight', '', 16)}
          </button>

          <button class="btn-secondary" onclick="window.viewArtisanProfile('${product.artisanId}')">
            View Artisan Profile ${renderIcon('arrowRight', '', 16)}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Screen B8 — Connect with Artisan Form
function renderScreenB8_ConnectForm(product) {
  return `
    <div style="padding: 20px;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">Connect with Artisan</h2>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        Send an inquiry or order request directly to the maker.
      </p>

      <div class="craft-card" style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
        <img src="${product.imageUrl}" style="width: 60px; height: 60px; border-radius: var(--radius-sm); object-fit: cover;">
        <div>
          <div style="font-weight: 700; font-size: 14px;">${product.title}</div>
          <div style="font-size: 12px; color: var(--copper);">₹${product.price} • ${product.artisanName}</div>
        </div>
      </div>

      <div class="craft-card">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 10px; letter-spacing: 0.05em;">
          What are you interested in?
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="interest_type" value="Buy this product" checked> Buy this product
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="interest_type" value="Bulk / Wholesale Order"> Bulk / Wholesale Order
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="interest_type" value="Retail Partnership"> Retail Partnership
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="interest_type" value="Custom Order"> Custom Order
          </label>
        </div>

        <div class="form-group">
          <label class="form-label">Quantity</label>
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn-secondary" style="width: 40px; padding: 6px;" onclick="window.adjustQuantity(-1)">-</button>
            <span id="qty_display" style="font-size: 16px; font-weight: 700;">1</span>
            <button class="btn-secondary" style="width: 40px; padding: 6px;" onclick="window.adjustQuantity(1)">+</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Message (Optional)</label>
          <textarea id="connect_msg" class="form-textarea" rows="3">I'm interested in this craft and would like to learn more.</textarea>
        </div>

        <button class="btn-primary" onclick="window.submitConnectInterest('${product.id}')">
          Send Interest ${renderIcon('arrowRight', '', 16)}
        </button>

        <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px; text-align: center;">
          🔒 Your contact details are shared only after connection.
        </div>
      </div>
    </div>
  `;
}

// Screen B8 — Confirmation
function renderScreenB8_ConnectSuccess() {
  return `
    <div style="padding: 20px; text-align: center;">
      <div class="craft-card craft-card-glow" style="padding: 30px 20px;">
        <div style="color: var(--success); margin-bottom: 12px;">
          ${renderIcon('check', '', 48)}
        </div>
        <h3 style="font-size: 20px; margin-bottom: 6px;">Interest Sent</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
          Your request has been sent to the artisan.<br>CRAFTORA will notify you when the artisan responds.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 280px; margin: 0 auto;">
          <button class="btn-primary" onclick="window.navBuyer('profile')">
            View My Requests
          </button>

          <button class="btn-secondary" onclick="window.navBuyer('explore')">
            ← Continue Exploring
          </button>
        </div>
      </div>
    </div>
  `;
}

// Screen B9 — Buyer Profile
function renderScreenB9_BuyerProfile(state) {
  const buyer = state.buyerAuth;

  return `
    <div style="padding: 20px;">
      <div class="craft-card" style="text-align: center; padding: 20px;">
        <div style="width: 70px; height: 70px; border-radius: 50%; background: var(--bg-elevated); border: 2px solid var(--text-copper); margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: var(--copper);">
          ${renderIcon('user', '', 32)}
        </div>
        <h3 style="font-size: 18px; margin-bottom: 2px;">${buyer.buyerName}</h3>
        <div style="font-size: 12px; color: var(--text-secondary);">${buyer.isGuest ? 'Guest Buyer' : 'Registered Buyer'}</div>
      </div>

      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 10px; letter-spacing: 0.05em;">
        My Activity
      </div>

      <div class="craft-card" style="margin-bottom: 12px; cursor: pointer;" onclick="alert('4 saved products')">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="display: flex; align-items: center; gap: 8px;">${renderIcon('heart', '', 16)} Saved Crafts</span>
          <span style="font-weight: 700; color: var(--copper);">4 saved products →</span>
        </div>
      </div>

      <div class="craft-card" style="margin-bottom: 20px; cursor: pointer;" onclick="window.navBuyer('connect_success')">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="display: flex; align-items: center; gap: 8px;">${renderIcon('store', '', 16)} My Requests</span>
          <span style="font-weight: 700; color: var(--copper);">${state.buyerRequests.length} interest requests →</span>
        </div>
      </div>

      <button class="btn-secondary" style="width: 100%; border-color: var(--terracotta); color: var(--terracotta); font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px;" onclick="window.requestBuyerSignOut()">
        ${renderIcon('logOut', '', 16)} Sign Out
      </button>
    </div>
  `;
}

// Buyer Sign Out Modal Handlers
window.requestBuyerSignOut = () => {
  appState.data.showBuyerSignOutModal = true;
  appState.notify();
};

window.cancelBuyerSignOut = () => {
  delete appState.data.showBuyerSignOutModal;
  appState.notify();
};

window.confirmBuyerSignOut = () => {
  appState.signOutBuyer();
};

// Global Buyer Handlers
window.continueAsGuest = () => {
  appState.continueBuyerAsGuest();
};

window.submitBuyerMobile = () => {
  const phone = document.getElementById('buyer_mobile_input')?.value?.trim() || '';
  if (!appState.data.buyerDraft) appState.data.buyerDraft = {};
  appState.data.buyerDraft.mobileNumber = phone;
  appState.data.buyerDraft.isSignIn = false;
  appState.setBuyerScreen('buyer_otp');
};

window.verifyBuyerOTP = () => {
  const otp = document.getElementById('buyer_otp_input')?.value?.trim() || '1234';
  const errEl = document.getElementById('buyer_otp_error');
  if (otp.length !== 4) {
    if (errEl) {
      errEl.style.display = 'block';
      errEl.textContent = 'Please enter a 4-digit OTP (Demo OTP: 1234)';
    } else {
      alert('Please enter a 4-digit OTP (Demo OTP: 1234)');
    }
    return;
  }
  if (!appState.data.buyerDraft) appState.data.buyerDraft = {};
  appState.data.buyerDraft.otp = otp;

  if (appState.data.buyerDraft.isSignIn) {
    appState.loginReturningBuyer(appState.data.buyerDraft.mobileNumber);
  } else {
    appState.setBuyerScreen('register');
  }
};

window.submitBuyerRegistration = () => {
  const name = document.getElementById('buyer_reg_name')?.value?.trim() || 'Valued Buyer';
  const city = document.getElementById('buyer_reg_city')?.value?.trim() || 'India';
  const phone = appState.data.buyerDraft?.mobileNumber || '9876543210';

  appState.completeBuyerRegistration(name, city, phone);
};

window.submitBuyerSignIn = () => {
  const phone = document.getElementById('buyer_signin_phone')?.value?.trim() || '9876543210';
  if (!appState.data.buyerDraft) appState.data.buyerDraft = {};
  appState.data.buyerDraft.mobileNumber = phone;
  appState.data.buyerDraft.isSignIn = true;
  appState.setBuyerScreen('buyer_otp');
};

window.completeBuyerAuth = () => {
  window.submitBuyerRegistration();
};

window.viewProductDetails = (id) => {
  appState.setBuyerScreen('product_detail', { productId: id });
};

window.viewArtisanProfile = (artisanId) => {
  appState.setBuyerScreen('artisan_story', { artisanId });
};

window.connectWithArtisan = (productId) => {
  appState.setBuyerScreen('connect', { productId });
};

let currentQty = 1;
window.adjustQuantity = (delta) => {
  currentQty = Math.max(1, currentQty + delta);
  const el = document.getElementById('qty_display');
  if (el) el.innerText = currentQty;
};

window.submitConnectInterest = (productId) => {
  const product = appState.data.products.find(p => p.id === productId);
  const radios = document.getElementsByName('interest_type');
  let selectedType = 'Buy this product';
  for (const r of radios) {
    if (r.checked) selectedType = r.value;
  }
  const msg = document.getElementById('connect_msg')?.value || '';

  appState.addBuyerRequest({
    id: 'REQ-' + Date.now(),
    buyerName: appState.data.buyerAuth.buyerName,
    productTitle: product ? product.title : 'Craft Item',
    productId: productId,
    artisanName: product ? product.artisanName : 'Artisan',
    interestType: selectedType,
    quantity: currentQty,
    message: msg,
    status: 'Interest Sent',
    createdAt: new Date().toLocaleDateString('en-GB')
  });

  appState.setBuyerScreen('connect_success');
};

window.filterCrafts = (query) => {
  if (!appState.data) return;
  appState.data.buyerSearchQuery = query;
  appState.notify();
  // Preserve cursor focus if the input element is active
  setTimeout(() => {
    const input = document.getElementById('buyer_search_input');
    if (input && document.activeElement !== input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 10);
};

window.selectCategory = (cat) => {
  if (!appState.data) return;
  appState.data.buyerSelectedCategory = (!cat || cat === 'All' || cat === 'all' || cat === 'All Categories') ? 'all' : cat;
  appState.notify();
};

window.clearBuyerSearch = () => {
  if (!appState.data) return;
  appState.data.buyerSearchQuery = '';
  appState.notify();
};

window.clearAllBuyerFilters = () => {
  if (!appState.data) return;
  appState.data.buyerSearchQuery = '';
  appState.data.buyerSelectedCategory = 'all';
  appState.notify();
};

window.submitArtisanRating = (artisanId, stars) => {
  const res = appState.rateArtisan(artisanId, stars);
  if (res && res.success) {
    alert(`Thank you! Demo rating of ${stars} stars recorded for artisan. Updated rating: ⭐ ${res.rating} (${res.ratingCount} ratings).`);
  } else if (res && res.reason === 'artisan_self_rating_denied') {
    alert('Artisans cannot rate themselves.');
  }
};
