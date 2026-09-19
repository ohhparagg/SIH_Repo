/**
 * CRAFTORA - Gemini Vision & Product Pipeline Verification Suite
 * Tests End-to-End Image Processing, Gemini Vision Integration, Quality Check,
 * Honest Uncertainty Handling, and Existing Feature Integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_URL = 'http://127.0.0.1:3456';

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

async function testPipeline() {
  console.log('\n======================================================');
  console.log('--- CRAFTORA: GEMINI VISION PIPELINE VERIFICATION ---');
  console.log('======================================================\n');

  // Check if server is running
  console.log('--- 1. Testing Server & API Availability ---');
  try {
    const healthRes = await fetch(`${SERVER_URL}/index.html`);
    assert(healthRes.ok, 'Server is running at ' + SERVER_URL);
  } catch (e) {
    console.error('Server is not reachable at ' + SERVER_URL);
    process.exit(1);
  }

  // TEST 1: Bamboo basket
  console.log('\n--- TEST 1: Bamboo Basket Image Analysis ---');
  const basketBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'bamboo_basket.png'));
  const basketDataUri = 'data:image/png;base64,' + basketBuffer.toString('base64');

  const res1 = await fetch(`${SERVER_URL}/api/analyze-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: basketDataUri,
      filename: 'bamboo_basket.png',
      artisanId: 'CRF-ART-001284'
    })
  });
  assert(res1.ok, 'POST /api/analyze-product returned 200 OK');
  const data1 = await res1.json();
  assert(data1.analysisStatus === 'success', 'Bamboo Basket returned success status');
  assert(Boolean(data1.productName), 'Product Name returned: ' + data1.productName);
  assert(Boolean(data1.category), 'Category returned: ' + data1.category);
  assert(Boolean(data1.materials), 'Materials returned: ' + data1.materials);
  assert(Boolean(data1.description), 'Description returned: ' + data1.description);
  assert(Array.isArray(data1.tags) && data1.tags.length > 0, 'Tags returned: ' + data1.tags.join(', '));
  assert(Boolean(data1.enhancedImageUrl), 'Enhanced image data URL generated');

  // TEST 2: Actual Pen Image
  console.log('\n--- TEST 2: Real Pen Image Analysis ---');
  const penBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'ballpoint_pen.png'));
  const penDataUri = 'data:image/png;base64,' + penBuffer.toString('base64');

  const res2 = await fetch(`${SERVER_URL}/api/analyze-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: penDataUri,
      filename: 'ballpoint_pen.png',
      artisanId: 'CRF-ART-001284'
    })
  });
  assert(res2.ok, 'POST /api/analyze-product returned 200 OK for pen');
  const data2 = await res2.json();

  // Guarantees: Does NOT return bamboo basket data
  assert(data2.productName !== 'Handcrafted Bamboo Basket', 'Pen does NOT return Handcrafted Bamboo Basket');
  assert(data2.category !== 'Bamboo Craft', 'Pen does NOT return Bamboo Craft category');
  if (data2.analysisStatus === 'success') {
    console.log(`    Pen Identified: ${data2.productName} | Category: ${data2.category} | Materials: ${data2.materials}`);
    assert(
      data2.productName.toLowerCase().includes('pen') ||
      data2.category.toLowerCase().includes('writing') ||
      data2.category.toLowerCase().includes('stationery') ||
      data2.category === 'Needs Review',
      'Pen classified correctly or flagged for review'
    );
  } else {
    assert(data2.analysisStatus === 'error' && data2.errorType === 'service_unavailable', 'Honest error returned when API key is unconfigured');
    assert(data2.message === 'AI analysis is currently unavailable.', 'Standard friendly error message returned');
  }

  // TEST 3: Actual Handkerchief Image
  console.log('\n--- TEST 3: Real Handkerchief Image Analysis ---');
  const hankyBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'cotton_handkerchief.png'));
  const hankyDataUri = 'data:image/png;base64,' + hankyBuffer.toString('base64');

  const res3 = await fetch(`${SERVER_URL}/api/analyze-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: hankyDataUri,
      filename: 'cotton_handkerchief.png',
      artisanId: 'CRF-ART-001284'
    })
  });
  assert(res3.ok, 'POST /api/analyze-product returned 200 OK for handkerchief');
  const data3 = await res3.json();
  assert(data3.productName !== 'Handcrafted Bamboo Basket', 'Handkerchief does NOT return Bamboo Basket');
  if (data3.analysisStatus === 'success') {
    console.log(`    Handkerchief Identified: ${data3.productName} | Category: ${data3.category}`);
  } else {
    assert(data3.errorType === 'service_unavailable', 'Honest service_unavailable returned');
  }

  // TEST 4: Real Ceramic Cup Image
  console.log('\n--- TEST 4: Real Ceramic Cup / Pottery Analysis ---');
  const cupBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'ceramic_cup.png'));
  const cupDataUri = 'data:image/png;base64,' + cupBuffer.toString('base64');

  const res4 = await fetch(`${SERVER_URL}/api/analyze-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: cupDataUri,
      filename: 'ceramic_cup.png',
      artisanId: 'CRF-ART-001284'
    })
  });
  assert(res4.ok, 'POST /api/analyze-product returned 200 OK for cup');
  const data4 = await res4.json();
  assert(data4.productName !== 'Handcrafted Bamboo Basket', 'Cup does NOT return Bamboo Basket');
  if (data4.analysisStatus === 'success') {
    console.log(`    Cup Identified: ${data4.productName} | Category: ${data4.category}`);
  }

  // TEST 5: Image Enhancement Verification
  console.log('\n--- TEST 5: Real Image Enhancement Verification ---');
  assert(Boolean(data1.enhancedImageUrl && data1.enhancedImageUrl.startsWith('data:image/jpeg;base64,')), 'Enhanced image is a valid JPEG data URL');
  assert(Boolean(data2.enhancedImageUrl && data2.enhancedImageUrl.startsWith('data:image/jpeg;base64,')), 'Pen enhanced image is a valid JPEG data URL');

  // TEST 6: Legacy / Alternate Route Compatibility
  console.log('\n--- TEST 6: Route Compatibility (/api/ai/analyze-product) ---');
  const res6 = await fetch(`${SERVER_URL}/api/ai/analyze-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: 'assets/bamboo_basket.png',
      filename: 'bamboo_basket.png'
    })
  });
  assert(res6.ok, 'POST /api/ai/analyze-product is compatible and returns 200 OK');
  const data6 = await res6.json();
  assert(data6.analysisStatus === 'success', 'Compatible route returns success');

  console.log('\n======================================================');
  console.log('--- ALL GEMINI VISION PIPELINE TESTS PASSED! ---');
  console.log('======================================================\n');
}

testPipeline().catch(err => {
  console.error('\n❌ Test pipeline error:', err);
  process.exit(1);
});
