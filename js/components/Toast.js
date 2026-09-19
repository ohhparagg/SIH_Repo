/* ==========================================================================
   CRAFTORA - Global UI Toast Notification & Transaction Error Handler
   Displays elegant, accessible notifications for cloud sync, transaction states,
   and provides step-by-step guidance for Firebase Firestore permission resolution.
   ========================================================================== */

let toastContainer = null;

function ensureToastContainer() {
  if (typeof document === 'undefined' || !document.createElement) {
    return null;
  }
  if (!toastContainer) {
    toastContainer = document.getElementById('craftora-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'craftora-toast-container';
      toastContainer.className = 'toast-container';
      if (document.body && document.body.appendChild) {
        document.body.appendChild(toastContainer);
      }
    }
  }
  return toastContainer;
}

export function showAppToast({
  type = 'info', // 'warning' | 'error' | 'success' | 'info'
  title = '',
  message = '',
  actionLabel = '',
  onAction = null,
  duration = 6500
}) {
  const container = ensureToastContainer();
  if (!container || !document.createElement) return;

  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const card = document.createElement('div');
  card.id = toastId;
  card.className = `toast-card toast-${type}`;

  const iconMap = {
    warning: '⚠️',
    error: '❌',
    success: '✅',
    info: 'ℹ️'
  };

  card.innerHTML = `
    <span style="font-size: 17px; line-height: 1; flex-shrink: 0; margin-top: 1px;">
      ${iconMap[type] || '🔔'}
    </span>
    <div style="flex: 1; min-width: 0;">
      ${title ? `<div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">${title}</div>` : ''}
      <div style="font-size: 12px; line-height: 1.45;">${message}</div>
      ${actionLabel ? `
        <button class="toast-btn" id="btn-${toastId}">
          ${actionLabel}
        </button>
      ` : ''}
    </div>
    <button onclick="this.closest('.toast-card').remove()"
            style="background:none; border:none; color:inherit; opacity:0.6; cursor:pointer; font-size:14px; line-height:1; padding:2px;"
            aria-label="Close">✕</button>
  `;

  container.appendChild(card);

  if (actionLabel && typeof onAction === 'function') {
    const btn = card.querySelector(`#btn-${toastId}`);
    if (btn) {
      btn.onclick = () => {
        onAction();
        card.remove();
      };
    }
  }

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (document.getElementById(toastId)) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-12px) scale(0.95)';
        setTimeout(() => card.remove(), 250);
      }
    }, duration);
  }
}

// Make globally accessible
if (typeof window !== 'undefined') {
  window.showAppToast = showAppToast;

  window.showFirebaseRulesModal = () => {
    let overlay = document.getElementById('firebase-rules-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'firebase-rules-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.65);
        z-index: 100000; display: flex; align-items: center; justify-content: center;
        padding: 20px; backdrop-filter: blur(4px);
      `;
      document.body.appendChild(overlay);
    }

    const rulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

    overlay.innerHTML = `
      <div style="background: white; border-radius: 14px; max-width: 460px; width: 100%;
                  padding: 22px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); font-family: var(--font-body); color: #1C1917;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #BC4E2F; display: flex; align-items: center; gap: 6px;">
              🔥 Enable Firebase Firestore Rules
            </h3>
            <div style="font-size: 11px; color: #78716C;">Project: <strong>sihdatabaase</strong></div>
          </div>
          <button onclick="document.getElementById('firebase-rules-overlay').remove()"
                  style="background:none; border:none; font-size:18px; cursor:pointer; color:#78716C;">✕</button>
        </div>

        <p style="font-size: 12px; color: #44403C; line-height: 1.5; margin-bottom: 12px;">
          Your Firebase database is currently in <strong>locked mode</strong> (denying writes). To permit read/write operations during your hackathon demo:
        </p>

        <ol style="font-size: 12px; color: #1C1917; padding-left: 18px; line-height: 1.6; margin-bottom: 14px;">
          <li>Open <a href="https://console.firebase.google.com/project/sihdatabaase/firestore/rules" target="_blank" style="color: #215036; font-weight: 700; text-decoration: underline;">Firestore Rules in Firebase Console</a>.</li>
          <li>Paste the test-mode rules below and click <strong>Publish</strong>:</li>
        </ol>

        <div style="position: relative; background: #1C2A23; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <pre style="margin: 0; font-family: monospace; font-size: 11px; color: #D4E9DC; overflow-x: auto;"><code>${rulesSnippet}</code></pre>
          <button id="copy-firebase-rules-btn"
                  onclick="navigator.clipboard.writeText(\`${rulesSnippet}\`); this.textContent = '✓ Copied!'; setTimeout(() => this.textContent = '📋 Copy Rules', 2000); if (window.showAppToast) window.showAppToast({ type: 'success', title: 'Rules Copied', message: 'Paste into Firebase Console and click Publish.', duration: 4000 });"
                  style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.15);
                         border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 4px;
                         padding: 4px 10px; font-size: 11px; cursor: pointer; font-weight: 600;">
            📋 Copy Rules
          </button>
        </div>

        <div style="display: flex; gap: 10px;">
          <a href="https://console.firebase.google.com/project/sihdatabaase/firestore/rules" target="_blank" rel="noopener noreferrer"
             class="btn-primary" style="flex: 1; text-align: center; text-decoration: none; font-size: 12px; padding: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            Open Firebase Console ↗
          </a>
          <button class="btn-secondary" onclick="document.getElementById('firebase-rules-overlay').remove()"
                  style="flex: 1; font-size: 12px; padding: 10px;">
            Done / Close
          </button>
        </div>
      </div>
    `;
  };
}
