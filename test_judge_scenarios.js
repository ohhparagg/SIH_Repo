/* ==========================================================================
   CRAFTORA - Dedicated Judge Test Scenarios Verification Suite (A through I)
   ========================================================================== */

global.window = global;
global.document = {
  getElementById: (id) => null
};
try {
  if (!global.navigator) global.navigator = {};
} catch(e) {}
global.QRCode = { toCanvas: () => {} };

const _storage = new Map();
global.localStorage = {
  getItem: (k) => _storage.get(k) || null,
  setItem: (k, v) => _storage.set(k, String(v)),
  removeItem: (k) => _storage.delete(k),
  clear: () => _storage.clear()
};

import { appState } from './js/state.js';
import { renderArtisanView } from './js/views/artisan/ArtisanViews.js';
import { renderBuyerView } from './js/views/buyer/BuyerViews.js';
import { renderTopNav } from './js/components/TopNav.js';
import { renderBottomNav } from './js/components/BottomNav.js';
import { evaluateImageQualityAsync, checkImageQuality, enhanceImageLocally, analyzeProductImagePipeline } from './js/services/aiProductAnalysis.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

async function runJudgeScenarios() {
  console.log('\n======================================================');
  console.log('--- STARTING JUDGE TEST SCENARIOS (A THROUGH I) ---');
  console.log('======================================================\n');

  // ------------------------------------------------------------------------
  // SCENARIO F: MOBILE NUMBER VALIDATION (Artisan & Buyer)
  // ------------------------------------------------------------------------
  console.log('--- SCENARIO F: MOBILE NUMBER VALIDATION (EXACTLY 10 DIGITS) ---');
  appState.initDefaultState();
  appState.startNewArtisanRegistration();

  // Test 1: Fewer than 10 digits
  appState.data.onboardingDraft.mobileNumber = '123456789';
  window.submitArtisanMobile('register');
  assert(appState.data.activeArtisanScreen === 'onboarding', 'Scenario F: 9 digits rejected for Artisan');

  // Test 2: More than 10 digits
  appState.data.onboardingDraft.mobileNumber = '12345678901';
  window.submitArtisanMobile('register');
  assert(appState.data.activeArtisanScreen === 'onboarding', 'Scenario F: 11 digits rejected for Artisan');

  // Test 3: Letters / non-digits
  appState.data.onboardingDraft.mobileNumber = '98765abcde';
  window.submitArtisanMobile('register');
  assert(appState.data.activeArtisanScreen === 'onboarding', 'Scenario F: Alphabetic characters rejected for Artisan');

  // Test 4: Exactly 10 digits succeeds
  appState.data.onboardingDraft.mobileNumber = '1234567890';
  window.submitArtisanMobile('register');
  assert(appState.data.activeArtisanScreen === 'onboarding_otp', 'Scenario F: Exactly 10 digits accepted for Artisan');

  // Complete registration and verify initial zero state
  window.verifyArtisanOTP();
  assert(appState.data.activeArtisanScreen === 'profile_step1', 'Scenario F: Reached profile step 1');
  window.completeProfileSetup();
  assert(appState.data.activeArtisanScreen === 'artisan_id_card', 'Scenario F: Generated Artisan ID');
  const profile = appState.data.artisanAuth.artisanProfile;
  assert(profile.rating === 0, 'Scenario F: Rating starts at 0');
  assert(profile.ratingCount === 0, 'Scenario F: Rating count starts at 0');
  assert(profile.productsSold === 0, 'Scenario F: Products sold starts at 0');
  assert(profile.totalEarnings === 0, 'Scenario F: Total earnings starts at ₹0');
  assert(profile.ordersCompleted === 0, 'Scenario F: Orders completed starts at 0');

  // Test Buyer Mobile Validation
  appState.startBuyerAuth();
  appState.data.buyerDraft.mobileNumber = '98765';
  window.submitBuyerMobile();
  assert(appState.data.activeBuyerScreen === 'welcome', 'Scenario F: 5 digits rejected for Buyer registration');

  appState.data.buyerDraft.mobileNumber = '987654321099';
  window.submitBuyerMobile();
  assert(appState.data.activeBuyerScreen === 'welcome', 'Scenario F: 12 digits rejected for Buyer registration');

  appState.data.buyerDraft.mobileNumber = '9876543210';
  window.submitBuyerMobile();
  assert(appState.data.activeBuyerScreen === 'buyer_otp', 'Scenario F: Exactly 10 digits accepted for Buyer registration');

  // Test Buyer Sign In Mobile Validation
  appState.data.buyerDraft.mobileNumber = 'abc9876543';
  window.submitBuyerSignIn();
  assert(appState.data.activeBuyerScreen === 'buyer_otp', 'Scenario F: Validated Buyer Sign In');

  // ------------------------------------------------------------------------
  // SCENARIO G: ARTISAN SIGN OUT
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO G: ARTISAN SIGN OUT ---');
  appState.loginReturningArtisan('9876543210');
  assert(appState.data.artisanAuth.isRegistered === true, 'Scenario G: Artisan authenticated');
  assert(appState.data.activeArtisanScreen === 'dashboard', 'Scenario G: Arrived at Artisan Dashboard');

  // Navigate to Me
  window.navArtisan('artisan_id_card');
  assert(appState.data.activeArtisanScreen === 'artisan_id_card', 'Scenario G: Navigated to Artisan Me');

  // Verify Sign Out button is rendered in Me
  const meHtml = renderArtisanView('artisan_id_card');
  assert(meHtml.includes('Sign Out'), 'Scenario G: Sign Out button rendered in Artisan Me section');

  // Request Sign Out -> Confirmation Dialog
  window.requestArtisanSignOut();
  assert(appState.data.showArtisanSignOutModal === true, 'Scenario G: showArtisanSignOutModal set in state');
  const meWithModal = renderArtisanView('artisan_id_card');
  assert(meWithModal.includes('Are you sure you want to sign out?'), 'Scenario G: Confirmation dialog message displayed');
  assert(meWithModal.includes('Cancel') && meWithModal.includes('Sign Out'), 'Scenario G: Cancel and Sign Out buttons present');

  // Cancel -> does nothing
  window.cancelArtisanSignOut();
  assert(!appState.data.showArtisanSignOutModal, 'Scenario G: Cancel dismissed sign out modal');
  assert(appState.data.artisanAuth.isRegistered === true, 'Scenario G: Artisan session still active on Cancel');

  // Confirm Sign Out -> Clears session, returns to Onboarding/Login
  window.requestArtisanSignOut();
  window.confirmArtisanSignOut();
  assert(appState.data.artisanAuth.isRegistered === false, 'Scenario G: Authenticated artisan session cleared');
  assert(appState.data.activeArtisanScreen === 'onboarding', 'Scenario G: Returned to Artisan Onboarding/Login screen');
  assert(appState.data.savedArtisans.length >= 3, 'Scenario G: Saved artisan profiles preserved');
  assert(appState.data.products.length >= 8, 'Scenario G: Products preserved');

  // Protected screens must not be accessible
  window.navArtisan('dashboard');
  assert(appState.data.activeArtisanScreen === 'onboarding', 'Scenario G: Unauthenticated access to dashboard redirects to onboarding');
  window.navArtisan('my_crafts');
  assert(appState.data.activeArtisanScreen === 'onboarding', 'Scenario G: Unauthenticated access to my_crafts redirects to onboarding');

  // Browser Back must not restore session
  appState.goBack();
  assert(appState.data.artisanAuth.isRegistered === false, 'Scenario G: Browser Back does not restore authenticated session');

  // ------------------------------------------------------------------------
  // SCENARIO H: BUYER SIGN OUT
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO H: BUYER SIGN OUT ---');
  appState.loginReturningBuyer('9876543210');
  assert(appState.data.buyerAuth.isRegistered === true, 'Scenario H: Buyer authenticated');
  assert(appState.data.activeBuyerScreen === 'explore', 'Scenario H: Buyer on explore');

  // Navigate to Buyer Profile
  window.navBuyer('profile');
  assert(appState.data.activeBuyerScreen === 'profile', 'Scenario H: Buyer on Profile');
  const buyerProfileHtml = renderBuyerView('profile');
  assert(buyerProfileHtml.includes('Sign Out'), 'Scenario H: Sign Out button present in Buyer Profile');

  // Request Sign Out -> Confirmation Dialog
  window.requestBuyerSignOut();
  assert(appState.data.showBuyerSignOutModal === true, 'Scenario H: showBuyerSignOutModal set in state');
  const buyerWithModal = renderBuyerView('profile');
  assert(buyerWithModal.includes('Are you sure you want to sign out?'), 'Scenario H: Buyer Sign Out confirmation message displayed');

  // Cancel -> does nothing
  window.cancelBuyerSignOut();
  assert(!appState.data.showBuyerSignOutModal, 'Scenario H: Cancel dismissed modal');
  assert(appState.data.buyerAuth.isRegistered === true, 'Scenario H: Buyer session remains active on Cancel');

  // Confirm Sign Out -> Clears session, returns to Buyer Welcome/Login
  window.requestBuyerSignOut();
  window.confirmBuyerSignOut();
  assert(appState.data.buyerAuth.isRegistered === false, 'Scenario H: Authenticated buyer session cleared');
  assert(appState.data.activeBuyerScreen === 'welcome', 'Scenario H: Returned to Buyer Welcome/Login');
  assert(appState.data.savedBuyers.length >= 1, 'Scenario H: Saved buyer profile preserved');
  assert(appState.data.products.length >= 8, 'Scenario H: Products preserved');

  // ------------------------------------------------------------------------
  // SCENARIO A: BAMBOO BASKET DEMO PIPELINE
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO A: BAMBOO BASKET DEMO PIPELINE ---');
  appState.loginReturningArtisan('9876543210');
  window.navArtisan('add_product');
  window.proceedWithProductImage('assets/bamboo_basket.png');
  assert(appState.data.activeArtisanScreen === 'ai_analysis', 'Scenario A: Navigated to ai_analysis');
  assert(appState.data.aiAnalysisPipeline.status === 'success', 'Scenario A: Bamboo basket demo analysis is success');
  assert(appState.data.productCreationDraft.title === 'Handcrafted Bamboo Basket', 'Scenario A: Title generated correctly');
  assert(appState.data.productCreationDraft.category === 'Bamboo Craft', 'Scenario A: Category generated correctly');
  assert(appState.data.productCreationDraft.confidence === 'High confidence', 'Scenario A: Confidence generated correctly');
  const aiHtmlA = renderArtisanView('ai_analysis');
  assert(aiHtmlA.includes('Handcrafted Bamboo Basket'), 'Scenario A: AI Catalogue renders generated title');
  assert(aiHtmlA.includes('Review & Edit'), 'Scenario A: Review & Edit button available');

  // ------------------------------------------------------------------------
  // SCENARIO B: UNSEEN OBJECT (e.g. PEN)
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO B: UNSEEN OBJECT (e.g. PEN) ---');
  // Upload a synthetic unseen pen image (base64 data URL with "pen" tag in test)
  const penDataUri = 'data:image/jpeg;base64,' + Buffer.from('pen_test_image_data_sample_content_for_pipeline').toString('base64');
  const penResult = await analyzeProductImagePipeline(penDataUri, {
    artisanId: 'CRF-ART-001284',
    filename: 'metal_ballpoint_pen.jpg'
  });

  // Check that the system does NOT return bamboo basket data!
  assert(penResult.productName !== 'Handcrafted Bamboo Basket', 'Scenario B: Unseen object does NOT return Bamboo Basket title');
  assert(penResult.category !== 'Bamboo Craft', 'Scenario B: Unseen object does NOT return Bamboo Craft category');
  if (penResult.analysisStatus === 'error') {
    assert(penResult.errorType === 'service_unavailable', 'Scenario B: Honest service_unavailable reported when vision API key is absent');
  } else {
    assert(penResult.analysisStatus === 'success', 'Scenario B: Real vision analysis succeeded');
    assert(penResult.productName.toLowerCase().includes('pen') || penResult.category.toLowerCase().includes('writing') || penResult.category === 'Needs Review', 'Scenario B: Returned object-specific title/category');
  }

  // ------------------------------------------------------------------------
  // SCENARIO C: ANOTHER UNKNOWN OBJECT
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO C: ANOTHER UNKNOWN OBJECT ---');
  const unknownDataUri = 'data:image/jpeg;base64,' + Buffer.from('leather_shoe_sample_image_content').toString('base64');
  const shoeResult = await analyzeProductImagePipeline(unknownDataUri, {
    artisanId: 'CRF-ART-001284',
    filename: 'leather_shoe.jpg'
  });
  assert(shoeResult.productName !== 'Handcrafted Bamboo Basket', 'Scenario C: Shoe does NOT return Bamboo Basket data');
  assert(!shoeResult.isDemoFallback, 'Scenario C: Unseen object does NOT use demo fallback');

  // ------------------------------------------------------------------------
  // SCENARIO D: BAD IMAGE QUALITY CHECK
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO D: BAD IMAGE QUALITY CHECK ---');
  // Pass a severely pitch black / corrupt image identifier
  const badImageQuality = checkImageQuality('data:image/jpeg;base64,pitchblack_severeblur_corrupt_test');
  assert(badImageQuality.pass === false, 'Scenario D: Low-quality/corrupt image fails quality check');
  assert(badImageQuality.reason.includes('insufficient for reliable analysis') || badImageQuality.reason.includes('dark or blurry'), 'Scenario D: Meaningful reason provided');

  const pipelineBad = await analyzeProductImagePipeline('data:image/jpeg;base64,pitchblack_severeblur_corrupt_test');
  assert(pipelineBad.analysisStatus === 'quality_failed', 'Scenario D: Pipeline returns quality_failed status');
  assert(pipelineBad.errorType === 'insufficient_quality', 'Scenario D: Error type is insufficient_quality');

  // Verify renderScreen6_AIAnalysis renders quality failed state with 3 action buttons
  appState.data.aiAnalysisPipeline = {
    status: 'quality_failed',
    message: pipelineBad.message,
    rawImage: 'data:image/jpeg;base64,pitchblack_severeblur_corrupt_test'
  };
  const qualityFailedHtml = renderArtisanView('ai_analysis');
  assert(qualityFailedHtml.includes('Image Quality Insufficient'), 'Scenario D: Quality warning displayed in UI');
  assert(qualityFailedHtml.includes('Retake Photo'), 'Scenario D: Retake Photo button displayed');
  assert(qualityFailedHtml.includes('Upload Another Image'), 'Scenario D: Upload Another Image button displayed');
  assert(qualityFailedHtml.includes('Continue with Manual Entry'), 'Scenario D: Continue with Manual Entry button displayed');

  // ------------------------------------------------------------------------
  // SCENARIO E: AI SERVICE FAILURE HANDLING
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO E: AI SERVICE FAILURE HANDLING ---');
  appState.data.aiAnalysisPipeline = {
    status: 'error',
    message: 'AI analysis is temporarily unavailable. Vision service did not return a response.',
    errorType: 'service_unavailable',
    rawImage: 'assets/bamboo_basket.png'
  };
  const errorHtml = renderArtisanView('ai_analysis');
  assert(errorHtml.includes('AI Analysis Unavailable') || errorHtml.includes('Unable to Complete AI Analysis'), 'Scenario E: Friendly AI unavailable message rendered');
  assert(errorHtml.includes('Retry'), 'Scenario E: Retry button rendered');
  assert(errorHtml.includes('Upload Another Image'), 'Scenario E: Upload Another Image button rendered');
  assert(errorHtml.includes('Enter Details Manually'), 'Scenario E: Enter Details Manually button rendered');

  // Test Manual Entry transition
  window.continueWithManualEntry();
  assert(appState.data.activeArtisanScreen === 'review_product', 'Scenario E: Manual entry transitions to review_product');
  const manualReviewHtml = renderArtisanView('review_product');
  assert(manualReviewHtml.includes('Review Your Product'), 'Scenario E: Artisan can edit all fields manually');

  // ------------------------------------------------------------------------
  // SCENARIO I: VERIFY ALL EXISTING FEATURES REMAIN INTACT
  // ------------------------------------------------------------------------
  console.log('\n--- SCENARIO I: VERIFY ALL EXISTING WORKING FEATURES ---');
  assert(appState.data.artisans.length >= 3, 'Scenario I: All 3 demo artisans present');
  assert(appState.data.products.length >= 8, 'Scenario I: All 8 demo products present');

  // Test Smart Pricing
  appState.setArtisanScreen('smart_pricing', { productId: 'CRF-BAM-001284' });
  const pricingHtml = renderArtisanView('smart_pricing');
  assert(pricingHtml.includes('AI Indicative Price Recommendation'), 'Scenario I: Smart Pricing works');

  // Test Market Linkage
  appState.setArtisanScreen('market_matches', { productId: 'CRF-BAM-001284' });
  const matchesHtml = renderArtisanView('market_matches');
  assert(matchesHtml.includes('Potential Buyer Matches') || matchesHtml.includes('Handicraft Retailer'), 'Scenario I: Market Linkage works');

  // Test Passport
  appState.setArtisanScreen('passport', { productId: 'CRF-BAM-001284' });
  const passportHtml = renderArtisanView('passport');
  assert(passportHtml.includes('Digital Product Passport') && passportHtml.includes('Polygon Testnet Demo'), 'Scenario I: Digital Product Passport works');

  // Test Provenance
  appState.setArtisanScreen('provenance', { productId: 'CRF-BAM-001284' });
  const provHtml = renderArtisanView('provenance');
  assert(provHtml.includes('Blockchain-Backed Provenance Record'), 'Scenario I: Provenance works');

  // Test Admin Login
  appState.loginAdmin('admin', 'admin123');
  assert(appState.data.adminAuth.isLoggedIn === true, 'Scenario I: Admin login works');
  const adminHtml = renderArtisanView('dashboard');
  assert(adminHtml.includes('Access Denied'), 'Scenario I: Role separation strictly maintained');

  console.log('\n======================================================');
  console.log('--- ALL JUDGE TEST SCENARIOS (A THROUGH I) PASSED! ---');
  console.log('======================================================\n');
}

runJudgeScenarios().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
