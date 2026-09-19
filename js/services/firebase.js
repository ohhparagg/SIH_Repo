/* ==========================================================================
   CRAFTORA - Firebase Cloud Database (Cloud Firestore) Integration
   Project ID: sihdatabaase
   Provides real-time cloud data synchronization across devices and browsers
   with comprehensive error handling and user-friendly transaction notices.
   ========================================================================== */

import { showAppToast } from "../components/Toast.js";

// Firestore function holders
let initializeApp = null;
let getFirestore = null;
let collection = null;
let doc = null;
let setDoc = null;
let getDocs = null;
let getDoc = null;
let updateDoc = null;
let onSnapshot = null;
let getAnalytics = null;
let isAnalyticsSupported = null;

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA93NgLz0-szaNsB3AEo4rFuvvDjQ8QrMk",
  authDomain: "sihdatabaase.firebaseapp.com",
  projectId: "sihdatabaase",
  storageBucket: "sihdatabaase.firebasestorage.app",
  messagingSenderId: "573865707978",
  appId: "1:573865707978:web:d419d23a5a6bf3cf886733",
  measurementId: "G-TNKCV9XPDJ"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.analytics = null;
    this.isConnected = false;
    this.isSeeded = false;
    this.hasNotifiedPermission = false;
    this.init();
  }

  async init() {
    if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.versions?.node)) {
      // In Node.js / CLI test runner environment
      return;
    }
    try {
      const appMod = await import("firebase/app");
      const firestoreMod = await import("firebase/firestore");
      const analyticsMod = await import("firebase/analytics");

      initializeApp = appMod.initializeApp;
      getFirestore = firestoreMod.getFirestore;
      collection = firestoreMod.collection;
      doc = firestoreMod.doc;
      setDoc = firestoreMod.setDoc;
      getDocs = firestoreMod.getDocs;
      getDoc = firestoreMod.getDoc;
      updateDoc = firestoreMod.updateDoc;
      onSnapshot = firestoreMod.onSnapshot;
      getAnalytics = analyticsMod.getAnalytics;
      isAnalyticsSupported = analyticsMod.isSupported;

      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.isConnected = true;
      console.log('🔥 Firebase App initialized successfully. Project: sihdatabaase');

      const supported = await isAnalyticsSupported().catch(() => false);
      if (supported) {
        this.analytics = getAnalytics(this.app);
        console.log('📊 Firebase Analytics active');
      }
    } catch (error) {
      this.isConnected = false;
      this.handleFirebaseError(error, 'init');
    }
  }

  // ── Centralized Error Handler ─────────────────────────────────────────
  handleFirebaseError(error, context = 'operation') {
    const msg = error?.message || String(error);
    const code = error?.code || '';
    console.warn(`Firestore [${context}] notice:`, error);

    const isPermissionError = msg.toLowerCase().includes('permission') ||
                              msg.toLowerCase().includes('insufficient') ||
                              code === 'permission-denied';

    const isWriteAction = context.includes('save') ||
                          context.includes('update') ||
                          context.includes('delete') ||
                          context.includes('add') ||
                          context.includes('seed') ||
                          context.includes('create') ||
                          context.includes('Inquiry');

    if (isPermissionError) {
      // Always show for user-initiated write transactions or first-time read error
      if (isWriteAction || !this.hasNotifiedPermission) {
        this.hasNotifiedPermission = true;
        showAppToast({
          type: 'warning',
          title: '🔥 Firebase Firestore Rules Locked',
          message: `Firestore rejected [${context}]: Missing or insufficient permissions. Your record was preserved in local memory and backend. Click below to unlock Firestore rules.`,
          actionLabel: 'Fix Rules (1-Click)',
          onAction: () => {
            if (typeof window !== 'undefined' && window.showFirebaseRulesModal) {
              window.showFirebaseRulesModal();
            }
          },
          duration: 10000
        });
      }
    } else if (isWriteAction) {
      showAppToast({
        type: 'error',
        title: 'Cloud Transaction Alert',
        message: `Cloud transaction failed for [${context}]: ${msg}. Local and backend data remain safe.`,
        duration: 6000
      });
    }
  }

  // ── Auto-Seed Initial Data if Firestore is Empty ─────────────────────
  async autoSeedInitialData(initialArtisans = [], initialProducts = [], initialInquiries = []) {
    if (!this.isConnected || !this.db || this.isSeeded) return;

    try {
      const prodSnapshot = await getDocs(collection(this.db, 'products'));
      if (prodSnapshot.empty && initialProducts.length > 0) {
        console.log('🌱 Seeding initial authentic Indian craft data to Firebase Firestore (sihdatabaase)...');

        for (const prod of initialProducts) {
          await setDoc(doc(this.db, 'products', prod.id), prod, { merge: true });
        }

        for (const art of initialArtisans) {
          const artId = art.id || art.artisan_id || 'CRF-ART-001284';
          await setDoc(doc(this.db, 'artisans', artId), art, { merge: true });
        }

        for (const inq of initialInquiries) {
          const inqId = inq.id || inq.inquiry_id || 'REQ-001';
          await setDoc(doc(this.db, 'inquiries', inqId), inq, { merge: true });
        }

        console.log('✅ Firebase Firestore successfully seeded with CRAFTORA initial records!');
      }
      this.isSeeded = true;
    } catch (err) {
      this.handleFirebaseError(err, 'autoSeedInitialData');
    }
  }

  // ── Products Collection CRUD ──────────────────────────────────────────
  async getProducts() {
    if (!this.isConnected || !this.db) return null;
    try {
      const snapshot = await getDocs(collection(this.db, 'products'));
      if (snapshot.empty) return [];
      const prods = [];
      snapshot.forEach(docSnap => {
        prods.push({ id: docSnap.id, ...docSnap.data() });
      });
      return prods;
    } catch (err) {
      this.handleFirebaseError(err, 'getProducts');
      return null;
    }
  }

  async saveProduct(product) {
    if (!this.isConnected || !this.db) return false;
    try {
      const prodId = product.id || product.product_id;
      if (!prodId) return false;
      const cleanData = JSON.parse(JSON.stringify(product));
      await setDoc(doc(this.db, 'products', prodId), cleanData, { merge: true });
      console.log('🔥 Product synced to Firebase Firestore:', prodId);
      return true;
    } catch (err) {
      this.handleFirebaseError(err, 'saveProduct');
      return false;
    }
  }

  async updateProduct(productId, updates) {
    if (!this.isConnected || !this.db || !productId) return false;
    try {
      const prodRef = doc(this.db, 'products', productId);
      const cleanData = JSON.parse(JSON.stringify(updates));
      await setDoc(prodRef, cleanData, { merge: true });
      console.log('🔥 Product updated in Firebase Firestore:', productId);
      return true;
    } catch (err) {
      this.handleFirebaseError(err, 'updateProduct');
      return false;
    }
  }

  async deleteProduct(productId) {
    if (!this.isConnected || !this.db || !productId) return false;
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(this.db, 'products', productId));
      console.log('🔥 Product deleted from Firebase Firestore:', productId);
      return true;
    } catch (err) {
      this.handleFirebaseError(err, 'deleteProduct');
      return false;
    }
  }

  // ── Artisans Collection CRUD ──────────────────────────────────────────
  async getArtisans() {
    if (!this.isConnected || !this.db) return null;
    try {
      const snapshot = await getDocs(collection(this.db, 'artisans'));
      if (snapshot.empty) return [];
      const artisans = [];
      snapshot.forEach(docSnap => {
        artisans.push({ id: docSnap.id, ...docSnap.data() });
      });
      return artisans;
    } catch (err) {
      this.handleFirebaseError(err, 'getArtisans');
      return null;
    }
  }

  async saveArtisan(artisan) {
    if (!this.isConnected || !this.db) return false;
    try {
      const artId = artisan.id || artisan.artisan_id || `CRF-ART-${Date.now()}`;
      await setDoc(doc(this.db, 'artisans', artId), artisan, { merge: true });
      console.log('🔥 Artisan synced to Firebase Firestore:', artId);
      return true;
    } catch (err) {
      this.handleFirebaseError(err, 'saveArtisan');
      return false;
    }
  }

  // ── Inquiries Collection CRUD ────────────────────────────────────────
  async getInquiries() {
    if (!this.isConnected || !this.db) return null;
    try {
      const snapshot = await getDocs(collection(this.db, 'inquiries'));
      if (snapshot.empty) return [];
      const inquiries = [];
      snapshot.forEach(docSnap => {
        inquiries.push({ id: docSnap.id, ...docSnap.data() });
      });
      return inquiries;
    } catch (err) {
      this.handleFirebaseError(err, 'getInquiries');
      return null;
    }
  }

  async saveInquiry(inquiry) {
    if (!this.isConnected || !this.db) return false;
    try {
      const inqId = inquiry.id || inquiry.inquiry_id || `REQ-${Date.now()}`;
      await setDoc(doc(this.db, 'inquiries', inqId), inquiry, { merge: true });
      console.log('🔥 Inquiry synced to Firebase Firestore:', inqId);
      return true;
    } catch (err) {
      this.handleFirebaseError(err, 'saveInquiry');
      return false;
    }
  }

  // ── Realtime Listener for Multi-Tab / Multi-Device Sync ─────────────
  subscribeToProducts(callback) {
    if (!this.isConnected || !this.db) return () => {};
    try {
      const unsub = onSnapshot(collection(this.db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const prods = [];
          snapshot.forEach(docSnap => {
            prods.push({ id: docSnap.id, ...docSnap.data() });
          });
          callback(prods);
        }
      }, (err) => {
        this.handleFirebaseError(err, 'subscribeToProducts');
      });
      return unsub;
    } catch (err) {
      return () => {};
    }
  }

  subscribeToInquiries(callback) {
    if (!this.isConnected || !this.db) return () => {};
    try {
      const unsub = onSnapshot(collection(this.db, 'inquiries'), (snapshot) => {
        if (!snapshot.empty) {
          const inqs = [];
          snapshot.forEach(docSnap => {
            inqs.push({ id: docSnap.id, ...docSnap.data() });
          });
          callback(inqs);
        }
      }, (err) => {
        this.handleFirebaseError(err, 'subscribeToInquiries');
      });
      return unsub;
    } catch (err) {
      return () => {};
    }
  }
}

export const firebaseService = new FirebaseService();
