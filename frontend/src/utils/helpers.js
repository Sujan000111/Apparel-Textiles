/**
 * Format a number as Indian Rupee currency.
 * @param {number} amount
 * @returns {string} e.g. "₹1,29,999"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/**
 * Format a date string/Date to "29 May 2026".
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format a date string/Date to "29 May 2026, 8:30 AM".
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/**
 * Generate a URL-friendly slug from a string.
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Debounce a function.
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Show a toast notification. Auto-dismisses after `duration` ms.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = 3500) {
  const existing = document.getElementById('toast-container');
  const container = existing || document.createElement('div');
  if (!existing) {
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.75rem;pointer-events:none;';
    document.body.appendChild(container);
  }

  const colors = {
    success: { bg: 'rgba(0,184,148,0.15)', border: '#00b894', icon: 'fa-check-circle' },
    error:   { bg: 'rgba(214,48,49,0.15)', border: '#d63031', icon: 'fa-times-circle' },
    warning: { bg: 'rgba(253,203,110,0.15)', border: '#fdcb6e', icon: 'fa-exclamation-triangle' },
    info:    { bg: 'rgba(108,92,231,0.15)', border: '#6c5ce7', icon: 'fa-info-circle' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:${c.bg};backdrop-filter:blur(12px);border:1px solid ${c.border};
    border-radius:12px;padding:1rem 1.25rem;color:#f0f0f8;font-size:0.9rem;
    display:flex;align-items:center;gap:0.75rem;pointer-events:auto;
    animation:toastIn 0.35s cubic-bezier(0.16,1,0.3,1);
    box-shadow:0 8px 32px rgba(0,0,0,0.3);max-width:400px;
  `;
  toast.innerHTML = `<i class="fas ${c.icon}" style="color:${c.border};font-size:1.1rem;"></i><span>${message}</span>`;
  container.appendChild(toast);

  // Inject animation if not present
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      @keyframes toastIn { from { opacity:0; transform:translateX(100px); } to { opacity:1; transform:translateX(0); } }
      @keyframes toastOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(100px); } }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(str, length = 50) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '…' : str;
}

/**
 * Get status badge HTML.
 */
export function statusBadge(status) {
  const colors = {
    pending: '#fdcb6e',
    confirmed: '#0984e3',
    processing: '#a29bfe',
    shipped: '#00cec9',
    delivered: '#00b894',
    cancelled: '#d63031',
    paid: '#00b894',
    failed: '#d63031',
    refunded: '#fdcb6e',
  };
  const color = colors[status] || '#a0a0b0';
  return `<span style="
    display:inline-flex;align-items:center;gap:0.35rem;
    padding:0.25rem 0.75rem;border-radius:100px;font-size:0.75rem;font-weight:600;
    background:${color}18;color:${color};border:1px solid ${color}30;text-transform:capitalize;
  "><span style="width:6px;height:6px;border-radius:50%;background:${color};"></span>${status}</span>`;
}
