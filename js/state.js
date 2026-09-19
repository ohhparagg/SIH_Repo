/* ==========================================================================
   CRAFTORA - Global Reactive State Management & Persistence Store
   ========================================================================== */

import { INITIAL_ARTISANS, INITIAL_PRODUCTS, INITIAL_BUYER_REQUESTS, INITIAL_ADMIN_STATS } from './data/mockData.js';
import { apiService } from './services/api.js';
import { firebaseService } from './services/firebase.js';
import { showAppToast } from './components/Toast.js';

const STORAGE_KEY = 'CRAFTORA_STATE_V1';
const CUSTOM_PRODUCTS_KEY = 'CRAFTORA_CUSTOM_PRODUCTS_V1';

class AppStateStore {
  constructor() {
    this.listeners = [];
    this.loadState();
    this.syncWithBackend();
    this.syncWithFirebase();
  }

  getCustomProducts() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  persistCustomProduct(product) {
    if (typeof localStorage === 'undefined' || !product || !product.id) return;
    try {
      const list = this.getCustomProducts();
      const existingIdx = list.findIndex(p => p.id === product.id);
      if (existingIdx >= 0) {
        list[existingIdx] = product;
      } else {
        list.unshift(product);
      }
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not persist custom product to localStorage:', e);
    }
  }

  removeCustomProduct(productId) {
    if (typeof localStorage === 'undefined' || !productId) return;
    try {
      const list = this.getCustomProducts();
      const filtered = list.filter(p => p.id !== productId);
      localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Could not remove custom product from localStorage:', e);
    }
  }

  loadState() {
    if (typeof localStorage === 'undefined') {
      this.initDefaultState();
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        if (!this.data.navigationHistory) {
          this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
        }
        if (!Array.isArray(this.data.navigationHistory.artisan)) this.data.navigationHistory.artisan = [];
        if (!Array.isArray(this.data.navigationHistory.buyer)) this.data.navigationHistory.buyer = [];
        if (!Array.isArray(this.data.navigationHistory.admin)) this.data.navigationHistory.admin = [];
      } catch (e) {
        console.error('Failed to parse saved CRAFTORA state, resetting...', e);
        this.initDefaultState();
      }
    } else {
      this.initDefaultState();
    }

    // Ensure custom products from dedicated storage are ALWAYS retained across page reloads
    const customProds = this.getCustomProducts();
    if (customProds.length > 0 && Array.isArray(this.data.products)) {
      const existingIds = new Set(this.data.products.map(p => p.id));
      for (const cp of customProds) {
        if (!existingIds.has(cp.id)) {
          this.data.products.unshift(cp);
          existingIds.add(cp.id);
        }
      }
    }
  }

  initDefaultState() {
    this.data = {
      // Role & Navigation State — Default Screen 1 Role Selection Entry Point
      currentRole: 'landing', // 'landing' | 'artisan' | 'buyer' | 'admin'
      language: 'EN', // 'EN' | 'HI'
      activeArtisanScreen: 'onboarding', // 'onboarding', 'onboarding_otp', 'profile_step1', 'artisan_id_card', 'welcome', 'add_product', 'ai_analysis', 'review_product', 'smart_pricing', 'market_matches', 'passport', 'provenance', 'dashboard', 'my_crafts', 'product_detail', 'edit_product'
      activeBuyerScreen: 'welcome', // 'welcome', 'buyer_mobile', 'buyer_otp', 'register', 'buyer_signin', 'explore', 'product_detail', 'artisan_story', 'passport', 'scan_qr', 'connect', 'connect_success', 'profile'
      activeAdminScreen: 'login', // 'login', 'dashboard', 'artisan_list', 'product_list', 'provenance_logs', 'review_detail'

      // Authentication & Onboarding State
      artisanAuth: {
        isRegistered: false, // false = new artisan starts empty registration; true = returning artisan
        artisanProfile: null
      },
      buyerAuth: {
        isRegistered: false, // false = new or guest buyer, true = registered buyer
        isGuest: false,
        buyerProfile: null,
        buyerName: '',
        mobileNumber: '',
        city: ''
      },
      adminAuth: {
        isLoggedIn: false, // Default unauthenticated; demo login requires admin / admin123
        adminId: 'admin'
      },

      // New Artisan registration draft — ALWAYS starts completely empty
      onboardingDraft: {
        mobileNumber: '',
        otp: '',
        name: '',
        craftCategory: '',
        location: '',
        artisanId: '',
        voiceTranscript: '',
        isVoiceExtracted: false
      },

      // Buyer registration draft
      buyerDraft: {
        mobileNumber: '',
        otp: '',
        name: '',
        city: '',
        buyerId: ''
      },

      // Saved returning profiles for persistence (Separate from new registrations)
      savedArtisans: [
        {
          id: 'CRF-ART-001284',
          name: 'Ramesh Kumar',
          craftCategory: 'Bamboo Craft',
          location: 'Assam, India',
          mobileNumber: '9876543210',
          rating: 4.8,
          ratingCount: 24,
          productsSold: 18,
          totalEarnings: 18650,
          ordersCompleted: 14
        },
        {
          id: 'CRF-ART-001285',
          name: 'Meera Devi',
          craftCategory: 'Madhubani Painting',
          location: 'Bihar, India',
          mobileNumber: '9876543211',
          rating: 4.6,
          ratingCount: 18
        },
        {
          id: 'CRF-ART-001286',
          name: 'Harpreet Singh',
          craftCategory: 'Phulkari Embroidery',
          location: 'Punjab, India',
          mobileNumber: '9876543212',
          rating: 4.7,
          ratingCount: 15
        }
      ],
      savedBuyers: [
        {
          id: 'CRF-BUY-001001',
          name: 'Arjun Sharma',
          mobileNumber: '9876543210',
          city: 'New Delhi'
        }
      ],

      // Core Data Collections
      artisans: JSON.parse(JSON.stringify(INITIAL_ARTISANS)),
      products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
      buyerRequests: JSON.parse(JSON.stringify(INITIAL_BUYER_REQUESTS)),
      adminStats: JSON.parse(JSON.stringify(INITIAL_ADMIN_STATS)),

      // Active Selection & Temporary States
      selectedProductId: 'CRF-BAM-001284',
      selectedArtisanId: 'CRF-ART-001284',
      productCreationDraft: null,
      adminReviewingTarget: null, // { type: 'product'|'artisan', item: Object }
      isVoiceModalOpen: false,
      voiceTranscript: '',
      isQRScannerOpen: false,
      scannedQRProduct: null,
      buyerSearchQuery: '',
      buyerSelectedCategory: 'all',

      // Navigation History Stack
      navigationHistory: {
        artisan: [],
        buyer: [],
        admin: []
      }
    };
    this.saveState();
  }

  saveState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.saveState();
    this.listeners.forEach(listener => listener(this.data));
  }

  // State Mutators
  setRole(role) {
    this.data.currentRole = role;
    if (role === 'admin') {
      if (!this.data.adminAuth?.isLoggedIn) {
        this.data.activeAdminScreen = 'login';
      }
    } else if (role === 'artisan') {
      if (this.data.artisanAuth?.isRegistered) {
        if (!this.data.activeArtisanScreen || this.data.activeArtisanScreen === 'onboarding') {
          this.data.activeArtisanScreen = 'dashboard';
        }
      } else {
        this.data.activeArtisanScreen = 'onboarding';
      }
    }
    this.notify();
  }

  setLanguage(lang) {
    this.data.language = lang;
    this.notify();
  }

  setArtisanScreen(screen, params = {}, options = {}) {
    // 1. Admin must NOT be treated as Artisan
    if (this.data.currentRole === 'admin') {
      console.warn('Unauthorized access attempt to artisan route from admin');
      return { success: false, reason: 'admin_denied' };
    }

    // 2. Authenticated Buyer must NOT access Artisan My Crafts or any artisan screen
    if (this.data.currentRole === 'buyer') {
      console.warn('Unauthorized access attempt to artisan route from buyer');
      return { success: false, reason: 'buyer_denied' };
    }

    const protectedScreens = [
      'dashboard', 'my_crafts', 'product_detail', 'edit_product',
      'add_product', 'ai_analysis', 'review_product', 'smart_pricing',
      'market_matches', 'passport', 'provenance'
    ];

    const isProtected = protectedScreens.includes(screen);
    const isAuthenticated = Boolean(this.data.artisanAuth?.isRegistered);
    const isProfileCompleted = Boolean(this.data.artisanAuth?.profileCompleted);

    // 3. Unauthenticated user:
    // If not authenticated and trying to access a protected artisan route, redirect to Artisan Login ('onboarding')
    if (isProtected && !isAuthenticated) {
      console.warn('Unauthenticated access attempt to protected artisan route:', screen, '-> Redirecting to Artisan Login');
      this.data.currentRole = 'artisan';
      this.data.activeArtisanScreen = 'onboarding';
      this.notify();
      return { success: false, redirectedTo: 'onboarding' };
    }

    // 4. Artisan Profile Completion Gate (FEATURE 2):
    // An artisan must NOT be allowed to enter the Artisan Dashboard or create products until profile setup is completed.
    if (isProtected && !isProfileCompleted && screen !== 'profile_step1' && screen !== 'artisan_id_card') {
      console.warn('Profile incomplete! Redirecting artisan to setup-profile (/artisan/setup-profile)');
      this.data.currentRole = 'artisan';
      this.data.activeArtisanScreen = 'profile_step1';
      this.notify();
      return {
        success: false,
        code: 'PROFILE_INCOMPLETE',
        redirectedTo: 'profile_step1',
        message: 'Please complete your artisan profile before accessing the dashboard.'
      };
    }

    // 4. Record navigation history for forward navigation
    if (!options.isBack && !options.replace) {
      if (!this.data.navigationHistory) this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
      if (!Array.isArray(this.data.navigationHistory.artisan)) this.data.navigationHistory.artisan = [];

      const currentScreen = this.data.activeArtisanScreen;
      const currentProductId = this.data.selectedProductId;

      if (currentScreen && (currentScreen !== screen || (params.productId && params.productId !== currentProductId))) {
        this.data.navigationHistory.artisan.push({
          screen: currentScreen,
          params: {
            productId: currentProductId,
            artisanId: this.data.selectedArtisanId
          }
        });
        if (this.data.navigationHistory.artisan.length > 50) {
          this.data.navigationHistory.artisan.shift();
        }
      }
    }

    // 5. Authenticated Artisan:
    // Protected Artisan route -> allow access directly without login redirect
    this.data.currentRole = 'artisan';
    this.data.activeArtisanScreen = screen;
    if (params.productId) this.data.selectedProductId = params.productId;
    if (params.artisanId) this.data.selectedArtisanId = params.artisanId;
    this.notify();
    return { success: true, screen };
  }

  logoutArtisan() {
    this.data.artisanAuth.isRegistered = false;
    this.data.artisanAuth.artisanProfile = null;
    this.data.activeArtisanScreen = 'onboarding';
    if (this.data.navigationHistory) {
      this.data.navigationHistory.artisan = [];
    }
    this.notify();
  }

  setBuyerScreen(screen, params = {}, options = {}) {
    const protectedBuyerScreens = ['profile', 'connect', 'connect_success'];
    const isBuyerAuth = Boolean(this.data.buyerAuth?.isRegistered || this.data.buyerAuth?.isGuest);
    if (protectedBuyerScreens.includes(screen) && !isBuyerAuth) {
      console.warn('Unauthenticated access attempt to protected buyer route:', screen, '-> Redirecting to Buyer Welcome');
      this.data.activeBuyerScreen = 'welcome';
      this.notify();
      return;
    }

    if (!options.isBack && !options.replace) {
      if (!this.data.navigationHistory) this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
      if (!Array.isArray(this.data.navigationHistory.buyer)) this.data.navigationHistory.buyer = [];

      const currentScreen = this.data.activeBuyerScreen;
      const currentProductId = this.data.selectedProductId;
      if (currentScreen && (currentScreen !== screen || (params.productId && params.productId !== currentProductId))) {
        this.data.navigationHistory.buyer.push({
          screen: currentScreen,
          params: {
            productId: currentProductId,
            artisanId: this.data.selectedArtisanId
          }
        });
        if (this.data.navigationHistory.buyer.length > 50) {
          this.data.navigationHistory.buyer.shift();
        }
      }
    }

    this.data.activeBuyerScreen = screen;
    if (params.productId) this.data.selectedProductId = params.productId;
    if (params.artisanId) this.data.selectedArtisanId = params.artisanId;
    this.notify();
  }

  setAdminScreen(screen, params = {}, options = {}) {
    // Normal artisan/buyer users cannot access admin routes
    if (this.data.currentRole !== 'admin') {
      console.warn('Unauthorized access attempt to admin route from role:', this.data.currentRole);
      if (this.data.currentRole === 'artisan') {
        this.data.activeArtisanScreen = this.data.artisanAuth?.isRegistered ? 'dashboard' : 'onboarding';
      } else if (this.data.currentRole === 'buyer') {
        this.data.activeBuyerScreen = 'explore';
      } else {
        this.data.currentRole = 'landing';
      }
      this.notify();
      return;
    }

    if (!this.data.adminAuth?.isLoggedIn) {
      this.data.activeAdminScreen = 'login';
      this.notify();
      return;
    }

    if (!options.isBack && !options.replace) {
      if (!this.data.navigationHistory) this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
      if (!Array.isArray(this.data.navigationHistory.admin)) this.data.navigationHistory.admin = [];

      const currentScreen = this.data.activeAdminScreen;
      if (currentScreen && currentScreen !== screen) {
        this.data.navigationHistory.admin.push({
          screen: currentScreen,
          params: {
            target: this.data.adminReviewingTarget
          }
        });
        if (this.data.navigationHistory.admin.length > 50) {
          this.data.navigationHistory.admin.shift();
        }
      }
    }

    this.data.activeAdminScreen = screen;
    if (params.target) this.data.adminReviewingTarget = params.target;
    this.notify();
  }

  goBack() {
    const role = this.data.currentRole;
    if (role === 'landing') return false;

    if (!this.data.navigationHistory) {
      this.data.navigationHistory = { artisan: [], buyer: [], admin: [] };
    }

    if (role === 'artisan') {
      const current = this.data.activeArtisanScreen;
      if (current === 'onboarding') {
        this.setRole('landing');
        return true;
      }

      const history = this.data.navigationHistory.artisan || [];
      let prev = null;
      while (history.length > 0) {
        const candidate = history.pop();
        if (candidate && (candidate.screen !== current || (candidate.params?.productId && candidate.params.productId !== this.data.selectedProductId))) {
          prev = candidate;
          break;
        }
      }

      if (prev) {
        this.setArtisanScreen(prev.screen, prev.params || {}, { isBack: true });
        return true;
      } else {
        // Fallback: If no previous screen in current app flow, use appropriate role home/dashboard
        const fallbackScreen = this.data.artisanAuth?.isRegistered ? 'dashboard' : 'onboarding';
        if (current !== fallbackScreen) {
          this.setArtisanScreen(fallbackScreen, {}, { isBack: true });
          return true;
        } else if (this.data.artisanAuth?.isRegistered) {
          return false;
        } else {
          this.setRole('landing');
          return true;
        }
      }
    } else if (role === 'buyer') {
      const isBuyerAuth = Boolean(this.data.buyerAuth?.isRegistered || this.data.buyerAuth?.isGuest);
      const current = this.data.activeBuyerScreen;
      if (current === 'welcome' || !isBuyerAuth) {
        if (current !== 'welcome') {
          this.setBuyerScreen('welcome', {}, { isBack: true });
          return true;
        }
        this.setRole('landing');
        return true;
      }

      const history = this.data.navigationHistory.buyer || [];
      let prev = null;
      while (history.length > 0) {
        const candidate = history.pop();
        if (candidate && (candidate.screen !== current || (candidate.params?.productId && candidate.params.productId !== this.data.selectedProductId))) {
          prev = candidate;
          break;
        }
      }

      if (prev) {
        this.setBuyerScreen(prev.screen, prev.params || {}, { isBack: true });
        return true;
      } else {
        const fallbackScreen = 'explore';
        if (current !== fallbackScreen) {
          this.setBuyerScreen(fallbackScreen, {}, { isBack: true });
          return true;
        } else {
          this.setRole('landing');
          return true;
        }
      }
    } else if (role === 'admin') {
      const current = this.data.activeAdminScreen;
      if (current === 'login' || !this.data.adminAuth?.isLoggedIn) {
        if (current !== 'login') {
          this.setAdminScreen('login', {}, { isBack: true });
          return true;
        }
        this.setRole('landing');
        return true;
      }

      const history = this.data.navigationHistory.admin || [];
      let prev = null;
      while (history.length > 0) {
        const candidate = history.pop();
        if (candidate && candidate.screen !== current) {
          prev = candidate;
          break;
        }
      }

      if (prev) {
        this.setAdminScreen(prev.screen, prev.params || {}, { isBack: true });
        return true;
      } else {
        const fallbackScreen = 'dashboard';
        if (current !== fallbackScreen) {
          this.setAdminScreen(fallbackScreen, {}, { isBack: true });
          return true;
        } else {
          this.setRole('landing');
          return true;
        }
      }
    }
    return false;
  }

  loginAdmin(username, password) {
    if (username && username.trim() === 'admin' && password === 'admin123') {
      this.data.adminAuth.isLoggedIn = true;
      this.data.adminAuth.adminId = 'admin';
      this.data.currentRole = 'admin';
      this.data.activeAdminScreen = 'dashboard';
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Demo: admin / admin123' };
  }

  logoutAdmin() {
    delete this.data.showAdminSignOutModal;
    this.data.adminAuth.isLoggedIn = false;
    this.data.activeAdminScreen = 'login';
    this.data.currentRole = 'admin';
    if (this.data.navigationHistory) {
      this.data.navigationHistory.admin = [];
    }
    this.notify();
  }

  signOutArtisan() {
    delete this.data.showArtisanSignOutModal;
    this.data.artisanAuth = {
      isRegistered: false,
      artisanProfile: null
    };
    this.data.onboardingDraft = {
      mobileNumber: '',
      otp: '',
      name: '',
      craftCategory: '',
      location: '',
      artisanId: '',
      voiceTranscript: '',
      isVoiceExtracted: false
    };
    this.data.currentRole = 'artisan';
    this.data.activeArtisanScreen = 'onboarding';
    if (this.data.navigationHistory) {
      this.data.navigationHistory.artisan = [];
    }
    this.notify();
  }

  logoutArtisan() {
    this.signOutArtisan();
  }

  // Artisan Auth Flow Handlers
  startNewArtisanRegistration() {
    this.data.currentRole = 'artisan';
    this.data.activeArtisanScreen = 'onboarding';
    this.data.artisanAuth.isRegistered = false;
    this.data.artisanAuth.artisanProfile = null;
    this.data.onboardingDraft = {
      mobileNumber: '',
      otp: '',
      name: '',
      craftCategory: '',
      location: '',
      artisanId: '',
      voiceTranscript: '',
      isVoiceExtracted: false
    };
    this.notify();
  }

  completeArtisanRegistration(name, craftCategory, location, mobileNumber) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedId = `CRF-ART-${randomSuffix}`;

    const newProfile = {
      id: generatedId,
      name: name || this.data.onboardingDraft?.name || 'Artisan Partner',
      craftCategory: craftCategory || this.data.onboardingDraft?.craftCategory || 'Bamboo Craft',
      location: location || this.data.onboardingDraft?.location || 'India',
      mobileNumber: mobileNumber || this.data.onboardingDraft?.mobileNumber || '9876543210',
      rating: 0,
      ratingCount: 0,
      productsSold: 0,
      totalEarnings: 0,
      ordersCompleted: 0,
      recentSales: [],
      isNewArtisan: true
    };

    this.data.currentRole = 'artisan';
    this.data.artisanAuth.isRegistered = true;
    this.data.artisanAuth.profileCompleted = true;
    this.data.artisanAuth.artisanProfile = newProfile;
    this.data.selectedArtisanId = generatedId;

    if (!this.data.savedArtisans) this.data.savedArtisans = [];
    this.data.savedArtisans.push(newProfile);

    if (!this.data.artisans) this.data.artisans = [];
    this.data.artisans.push(newProfile);

    if (this.data.onboardingDraft) {
      this.data.onboardingDraft.artisanId = generatedId;
      this.data.onboardingDraft.name = newProfile.name;
      this.data.onboardingDraft.craftCategory = newProfile.craftCategory;
      this.data.onboardingDraft.location = newProfile.location;
    }

    this.data.activeArtisanScreen = 'artisan_id_card';
    this.notify();
    return newProfile;
  }

  completeArtisanProfileSetup(profileData) {
    const artId = this.data.artisanAuth?.artisanProfile?.id || this.data.selectedArtisanId || `CRF-ART-${Date.now()}`;
    const updated = {
      id: artId,
      artisan_id: artId,
      name: profileData.name || 'Master Artisan',
      email: profileData.email || this.data.artisanAuth?.email || '',
      phone: profileData.phone || '',
      craft: profileData.craft || 'Handicrafts',
      craftCategory: profileData.craft || 'Handicrafts',
      state: profileData.state || 'Assam',
      district: profileData.district || '',
      village: profileData.village || '',
      location: `${profileData.village || profileData.district || ''}, ${profileData.state || 'India'}`.replace(/^,\s*/, ''),
      experience: profileData.experience || 5,
      bio: profileData.bio || '',
      skills: profileData.skills || [profileData.craft],
      profileCompleted: true
    };

    this.data.artisanAuth.isRegistered = true;
    this.data.artisanAuth.profileCompleted = true;
    this.data.artisanAuth.artisanProfile = updated;
    this.data.selectedArtisanId = artId;

    if (!this.data.artisans) this.data.artisans = [];
    const idx = this.data.artisans.findIndex(a => a.id === artId);
    if (idx >= 0) this.data.artisans[idx] = { ...this.data.artisans[idx], ...updated };
    else this.data.artisans.push(updated);

    // Save to backend
    apiService.saveArtisanProfile(profileData, this.data.artisanAuth?.token).catch(err => console.warn('Profile sync notice:', err));

    this.data.activeArtisanScreen = 'dashboard';
    this.notify();
    return updated;
  }

  loginReturningArtisan(mobileNumber = '9876543210') {
    const cleanNumber = (mobileNumber || '').replace(/\D/g, '');
    const found = (this.data.savedArtisans || []).find(a => (a.mobileNumber || '').replace(/\D/g, '') === cleanNumber)
      || (this.data.artisans || []).find(a => (a.mobileNumber || '').replace(/\D/g, '') === cleanNumber)
      || (this.data.savedArtisans || [])[0]
      || INITIAL_ARTISANS[0];

    this.data.currentRole = 'artisan';
    this.data.artisanAuth.isRegistered = true;
    this.data.artisanAuth.profileCompleted = true;
    this.data.artisanAuth.artisanProfile = { ...found, profileCompleted: true };
    this.data.selectedArtisanId = found.id;
    this.data.activeArtisanScreen = 'dashboard';
    this.notify();
    return { success: true, profile: found };
  }

  toggleArtisanOnboardingState(isRegistered) {
    if (isRegistered) {
      this.loginReturningArtisan();
    } else {
      this.startNewArtisanRegistration();
    }
  }

  rateArtisan(artisanId, rating) {
    const num = Number(rating);
    if (!artisanId || isNaN(num) || num < 1 || num > 5) {
      return { success: false, reason: 'invalid_rating' };
    }
    // Prevent an artisan from rating themselves
    if (this.data.currentRole === 'artisan' && this.data.artisanAuth?.artisanProfile?.id === artisanId) {
      console.warn('Artisan cannot rate themselves');
      return { success: false, reason: 'artisan_self_rating_denied' };
    }

    const artisan = (this.data.artisans || []).find(a => a.id === artisanId);
    if (!artisan) return { success: false, reason: 'artisan_not_found' };

    const curCount = Number(artisan.ratingCount) || 1;
    const curRating = Number(artisan.rating) || 4.8;
    const newCount = curCount + 1;
    const newAvg = Math.round(((curRating * curCount + num) / newCount) * 10) / 10;

    artisan.rating = newAvg;
    artisan.ratingCount = newCount;

    const saved = (this.data.savedArtisans || []).find(a => a.id === artisanId);
    if (saved) {
      saved.rating = newAvg;
      saved.ratingCount = newCount;
    }

    (this.data.products || []).forEach(p => {
      if (p.artisanId === artisanId) {
        p.rating = newAvg;
        p.ratingCount = newCount;
      }
    });

    this.notify();
    return { success: true, rating: newAvg, ratingCount: newCount };
  }

  // Buyer Auth Flow Handlers
  startBuyerAuth() {
    delete this.data.showBuyerSignOutModal;
    this.data.currentRole = 'buyer';
    this.data.activeBuyerScreen = 'welcome';
    this.data.buyerDraft = {
      mobileNumber: '',
      otp: '',
      name: '',
      city: '',
      buyerId: ''
    };
    this.data.buyerAuth.isRegistered = false;
    this.data.buyerAuth.isGuest = false;
    this.notify();
  }

  signOutBuyer() {
    delete this.data.showBuyerSignOutModal;
    this.data.buyerAuth = {
      isRegistered: false,
      isGuest: false,
      buyerProfile: null,
      buyerName: '',
      mobileNumber: '',
      city: ''
    };
    this.data.buyerDraft = {
      mobileNumber: '',
      otp: '',
      name: '',
      city: '',
      buyerId: ''
    };
    this.data.currentRole = 'buyer';
    this.data.activeBuyerScreen = 'welcome';
    if (this.data.navigationHistory) {
      this.data.navigationHistory.buyer = [];
    }
    this.notify();
  }

  continueBuyerAsGuest() {
    this.data.currentRole = 'buyer';
    this.data.buyerAuth.isRegistered = false;
    this.data.buyerAuth.isGuest = true;
    this.data.buyerAuth.buyerName = 'Guest Explorer';
    this.data.activeBuyerScreen = 'explore';
    this.notify();
  }

  loginReturningBuyer(mobileNumber = '9876543210') {
    const cleanNumber = (mobileNumber || '').replace(/\D/g, '');
    const found = (this.data.savedBuyers || []).find(b => (b.mobileNumber || '').replace(/\D/g, '') === cleanNumber)
      || this.data.savedBuyers[0]
      || { id: 'CRF-BUY-001001', name: 'Arjun Sharma', mobileNumber: '9876543210', city: 'New Delhi' };

    this.data.currentRole = 'buyer';
    this.data.buyerAuth.isRegistered = true;
    this.data.buyerAuth.isGuest = false;
    this.data.buyerAuth.buyerProfile = { ...found };
    this.data.buyerAuth.buyerName = found.name;
    this.data.buyerAuth.mobileNumber = found.mobileNumber;
    this.data.buyerAuth.city = found.city;
    this.data.activeBuyerScreen = 'explore';
    this.notify();
    return { success: true, profile: found };
  }

  completeBuyerRegistration(name, city, mobileNumber) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedId = `CRF-BUY-${randomSuffix}`;
    const newBuyer = {
      id: generatedId,
      name: name || 'Valued Buyer',
      city: city || 'India',
      mobileNumber: mobileNumber || this.data.buyerDraft?.mobileNumber || '9876543210'
    };

    if (!this.data.savedBuyers) this.data.savedBuyers = [];
    this.data.savedBuyers.push(newBuyer);

    this.data.currentRole = 'buyer';
    this.data.buyerAuth.isRegistered = true;
    this.data.buyerAuth.isGuest = false;
    this.data.buyerAuth.buyerProfile = newBuyer;
    this.data.buyerAuth.buyerName = newBuyer.name;
    this.data.buyerAuth.mobileNumber = newBuyer.mobileNumber;
    this.data.buyerAuth.city = newBuyer.city;
    this.data.activeBuyerScreen = 'explore';
    this.notify();
    return newBuyer;
  }

  toggleBuyerAuthState(isRegistered, isGuest = false) {
    if (isGuest) {
      this.continueBuyerAsGuest();
    } else if (isRegistered) {
      this.loginReturningBuyer();
    } else {
      this.startBuyerAuth();
    }
  }

  async syncWithBackend() {
    try {
      const isOnline = await apiService.checkHealth();
      if (!isOnline) return;

      const [prods, adminDash, inqs] = await Promise.all([
        apiService.getProducts(),
        apiService.getAdminDashboard(),
        apiService.getInquiries()
      ]);

      if (Array.isArray(prods) && prods.length > 0) {
        // Smart merge: Preserve all local custom products
        const customProds = this.getCustomProducts();
        const customIds = new Set(customProds.map(p => p.id));
        const localCustoms = (this.data.products || []).filter(p => p.isCustom || customIds.has(p.id));
        
        const localCustomIds = new Set(localCustoms.map(p => p.id));
        this.data.products = [...localCustoms, ...prods.filter(p => !localCustomIds.has(p.id))];
      }

      if (adminDash) {
        this.data.adminStats = {
          registeredArtisans: adminDash.total_artisans,
          registeredProducts: adminDash.total_products,
          artisanVerificationPending: adminDash.pending_artisan_verification,
          productVerificationPending: adminDash.pending_products
        };
      }

      if (Array.isArray(inqs) && inqs.length > 0) {
        this.data.buyerRequests = inqs;
      }

      this.notify();
    } catch (e) {
      console.warn('Backend sync error:', e);
    }
  }

  async syncWithFirebase() {
    try {
      // 1. Auto-seed initial craft data if Firestore database is empty
      await firebaseService.autoSeedInitialData(
        INITIAL_ARTISANS,
        this.data.products || INITIAL_PRODUCTS,
        this.data.buyerRequests || INITIAL_BUYER_REQUESTS
      );

      // 2. Fetch cloud products from Firestore
      const cloudProds = await firebaseService.getProducts();
      if (Array.isArray(cloudProds) && cloudProds.length > 0) {
        const customProds = this.getCustomProducts();
        const customIds = new Set(customProds.map(p => p.id));
        const localCustoms = (this.data.products || []).filter(p => p.isCustom || customIds.has(p.id));

        const cloudIds = new Set(cloudProds.map(p => p.id));
        this.data.products = [...localCustoms.filter(p => !cloudIds.has(p.id)), ...cloudProds];
        this.saveState();
        this.notify();

        // Push any local custom products to Firestore if not yet present
        for (const lp of localCustoms) {
          if (!cloudIds.has(lp.id)) {
            firebaseService.saveProduct(lp).catch(() => {});
          }
        }
      }

      // 3. Set up real-time multi-device listeners
      firebaseService.subscribeToProducts((cloudProds) => {
        if (Array.isArray(cloudProds) && cloudProds.length > 0) {
          const customProds = this.getCustomProducts();
          const customIds = new Set(customProds.map(p => p.id));
          const localCustoms = (this.data.products || []).filter(p => p.isCustom || customIds.has(p.id));

          const cloudIds = new Set(cloudProds.map(p => p.id));
          this.data.products = [...localCustoms.filter(p => !cloudIds.has(p.id)), ...cloudProds];
          this.saveState();
          this.notify();
        }
      });

      firebaseService.subscribeToInquiries((cloudInqs) => {
        if (Array.isArray(cloudInqs) && cloudInqs.length > 0) {
          this.data.buyerRequests = cloudInqs;
          this.saveState();
          this.notify();
        }
      });
    } catch (e) {
      console.warn('Firebase state sync notice:', e);
    }
  }

  addProduct(newProduct) {
    if (newProduct.isDemo === undefined) {
      newProduct.isDemo = false;
    }
    newProduct.isCustom = true;
    this.persistCustomProduct(newProduct);

    this.data.products.unshift(newProduct);
    this.data.selectedProductId = newProduct.id;
    this.data.adminStats.productVerificationPending += 1;
    this.data.adminStats.registeredProducts += 1;
    this.notify();

    // Sync to Firebase Cloud Firestore
    firebaseService.saveProduct(newProduct).catch(err => console.warn('Firebase product sync notice:', err));

    showAppToast({
      type: 'success',
      title: 'Craft Saved',
      message: `"${newProduct.title || newProduct.name}" added to catalog and syncing to cloud.`,
      duration: 3500
    });

    // Asynchronously register in backend
    apiService.createProduct({
      product_id: newProduct.id,
      artisan_id: newProduct.artisanId || 'CRF-ART-001284',
      name: newProduct.title || newProduct.name,
      category: newProduct.category || 'Handicrafts',
      craft_type: newProduct.craft_type || newProduct.category,
      description: newProduct.description || '',
      materials: newProduct.materials || ['Natural Materials'],
      tags: newProduct.tags || ['Handmade'],
      production_days: newProduct.productionTimeDays || 2,
      image: newProduct.imageUrl || newProduct.image || 'assets/bamboo_basket.png',
      price: newProduct.price || 0,
      cost_breakdown: newProduct.costBreakdown ? {
        material_cost: newProduct.costBreakdown.materialCost || 0,
        labour_cost: newProduct.costBreakdown.labourCost || 0,
        production_days: newProduct.costBreakdown.productionTimeDays || 2,
        packaging_cost: newProduct.costBreakdown.packagingCost || 0,
        total_estimated_cost: newProduct.costBreakdown.totalEstimatedCost || 0
      } : undefined
    }).catch(err => console.warn('Product sync warning:', err));
  }

  updateProduct(updatedProduct) {
    const index = this.data.products.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      this.data.products[index] = { ...this.data.products[index], ...updatedProduct };
      if (this.data.products[index].isCustom) {
        this.persistCustomProduct(this.data.products[index]);
      }
      this.notify();

      const p = this.data.products[index];
      // Sync to Firebase Cloud Firestore
      firebaseService.updateProduct(p.id, p).catch(err => console.warn('Firebase update sync notice:', err));

      apiService.updateProduct(p.id, {
        name: p.title || p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        materials: p.materials,
        tags: p.tags,
        cost_breakdown: p.costBreakdown ? {
          material_cost: p.costBreakdown.materialCost || 0,
          labour_cost: p.costBreakdown.labourCost || 0,
          production_days: p.costBreakdown.productionTimeDays || 2,
          packaging_cost: p.costBreakdown.packagingCost || 0,
          total_estimated_cost: p.costBreakdown.totalEstimatedCost || 0
        } : undefined
      }).catch(err => console.warn('Update sync warning:', err));
    }
  }

  deleteProduct(productId, requestingArtisanId) {
    if (!productId) return { success: false, reason: 'missing_product_id' };

    const product = (this.data.products || []).find(p => p.id === productId);
    if (!product) return { success: false, reason: 'not_found' };

    // Role check: Only authenticated artisan can delete from artisan flow
    if (this.data.currentRole !== 'artisan') {
      return { success: false, reason: 'unauthorized_role' };
    }

    // Ownership check: must belong to the currently authenticated artisan
    const currentArtisan = this.data.artisanAuth?.artisanProfile
      || (this.data.selectedArtisanId && this.data.savedArtisans && this.data.savedArtisans.find(a => a.id === this.data.selectedArtisanId))
      || (this.data.savedArtisans && this.data.savedArtisans[0]);
    const authenticatedId = requestingArtisanId || currentArtisan?.id || this.data.selectedArtisanId;

    if (product.artisanId !== authenticatedId) {
      console.warn('Ownership check failed: Artisan cannot delete another artisan product');
      return { success: false, reason: 'unauthorized_not_owner' };
    }

    // Protection for demo products
    if (product.isDemo) {
      return {
        success: false,
        reason: 'demo_product_protected',
        message: 'This demo product is protected from deletion in the prototype demonstration.'
      };
    }

    // Protection for sold products with historical sales records
    if (product.hasSalesHistory) {
      return {
        success: false,
        reason: 'sales_history_protected',
        message: 'This product has sales history and cannot be deleted from active records.'
      };
    }

    // Central state removal: permanently removes from application state and custom storage
    this.data.products = this.data.products.filter(p => p.id !== productId);
    this.removeCustomProduct(productId);

    // Sync deletion to Firebase & Backend
    firebaseService.deleteProduct(productId).catch(err => console.warn('Firebase delete notice:', err));
    apiService.deleteProduct(productId).catch(err => console.warn('Backend delete notice:', err));

    // Update selectedProductId if pointing to the deleted product
    if (this.data.selectedProductId === productId) {
      const remainingMyProducts = this.data.products.filter(p => p.artisanId === authenticatedId);
      this.data.selectedProductId = remainingMyProducts.length > 0 ? remainingMyProducts[0].id : (this.data.products[0]?.id || null);
    }

    // Clean navigation history so back navigation does not return to deleted product
    if (this.data.navigationHistory?.artisan) {
      this.data.navigationHistory.artisan = this.data.navigationHistory.artisan.filter(h => h.params?.productId !== productId);
    }
    if (this.data.navigationHistory?.buyer) {
      this.data.navigationHistory.buyer = this.data.navigationHistory.buyer.filter(h => h.params?.productId !== productId);
    }

    // Clear confirmation dialog state
    delete this.data.deleteConfirmProductId;

    // Navigate to My Crafts
    this.data.activeArtisanScreen = 'my_crafts';

    this.notify();
    return { success: true, productId };
  }

  addBuyerRequest(request) {
    this.data.buyerRequests.unshift(request);
    this.notify();

    // Sync to Firebase Cloud Firestore
    firebaseService.saveInquiry(request).catch(err => console.warn('Firebase inquiry sync notice:', err));

    showAppToast({
      type: 'success',
      title: 'Inquiry Sent',
      message: `Your inquiry for "${request.productTitle || 'Craft'}" was transmitted to artisan.`,
      duration: 4000
    });

    let inqType = 'RETAIL_PURCHASE';
    const it = (request.interestType || '').toLowerCase();
    if (it.includes('wholesale') || it.includes('bulk')) inqType = 'BULK_WHOLESALE';
    else if (it.includes('custom') || it.includes('order')) inqType = 'CUSTOM_ORDER';

    apiService.createInquiry({
      buyer_id: this.data.buyerAuth?.buyerId || 'BUY-001',
      buyer_name: request.buyerName || this.data.buyerAuth?.buyerName || 'Arjun Sharma',
      artisan_id: request.artisanId || 'CRF-ART-001284',
      product_id: request.productId || 'CRF-BAM-001284',
      type: inqType,
      message: request.message || 'Direct inquiry from buyer discovery',
      quantity: request.quantity || 1
    }).catch(err => console.warn('Inquiry sync warning:', err));
  }

  adminDecision(productId, decision, reviewNote) {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      if (decision === 'approve') {
        product.status = 'verified';
        product.passportAvailable = true;
        if (!product.blockchainRecord) {
          product.blockchainRecord = { events: [] };
        }
        product.blockchainRecord.events.push({
          title: 'Verification Approved',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'Completed (Reviewed Registration Info)'
        });
        if (this.data.adminStats.productVerificationPending > 0) {
          this.data.adminStats.productVerificationPending -= 1;
        }

        showAppToast({
          type: 'success',
          title: 'Verification Approved',
          message: `Product ${productId} approved. Digital Product Passport issued.`,
          duration: 4000
        });

        // Sync to Firebase
        firebaseService.updateProduct(productId, {
          status: 'verified',
          passportAvailable: true,
          reviewNote: reviewNote || 'Approved by Administrator',
          blockchainRecord: product.blockchainRecord
        }).catch(err => console.warn('Firebase admin decision sync notice:', err));

        apiService.adminApproveProduct(productId, reviewNote || 'Approved by Administrator')
          .catch(err => console.warn('Approval sync warning:', err));
      } else if (decision === 'request_changes') {
        product.status = 'changes_requested';
        product.reviewNote = reviewNote;

        showAppToast({
          type: 'info',
          title: 'Changes Requested',
          message: `Review note recorded for product ${productId}.`,
          duration: 4000
        });

        // Sync to Firebase
        firebaseService.updateProduct(productId, {
          status: 'changes_requested',
          reviewNote: reviewNote
        }).catch(err => console.warn('Firebase admin decision sync notice:', err));

        apiService.adminRequestChanges(productId, reviewNote || 'Revisions requested')
          .catch(err => console.warn('Request changes sync warning:', err));
      }
      this.notify();
    }
  }

  openVoiceModal(onSpeechExtracted) {
    this.data.isVoiceModalOpen = true;
    this.onSpeechExtracted = onSpeechExtracted;
    this.notify();
  }

  closeVoiceModal() {
    this.data.isVoiceModalOpen = false;
    this.notify();
  }

  triggerVoiceDemo() {
    this.data.voiceTranscript = "मेरा नाम रमेश है। मैं असम से हूँ। मैं बाँस की टोकरी बनाता हूँ।";
    const extracted = {
      name: "Ramesh Kumar",
      craft: "Bamboo Craft",
      location: "Assam, India",
      materials: "Natural Bamboo",
      description: "Handcrafted bamboo basket made with traditional techniques."
    };
    if (!this.data.onboardingDraft) this.data.onboardingDraft = {};
    this.data.onboardingDraft.name = extracted.name;
    this.data.onboardingDraft.craftCategory = extracted.craft;
    this.data.onboardingDraft.location = extracted.location;
    this.data.onboardingDraft.voiceTranscript = this.data.voiceTranscript;
    this.data.onboardingDraft.isVoiceExtracted = true;
    if (this.data.currentRole === 'artisan') {
      this.data.activeArtisanScreen = 'profile_step1';
    }
    if (this.onSpeechExtracted) {
      this.onSpeechExtracted(extracted);
    }
    this.closeVoiceModal();
  }

  resetAllData() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.initDefaultState();
    this.notify();
  }
}

export const appState = new AppStateStore();
