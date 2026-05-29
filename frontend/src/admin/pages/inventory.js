import { InventoryService } from '../../services/inventory.service.js';
import { formatCurrency, formatDateTime, showToast } from '../../utils/helpers.js';
import { INVENTORY_CHANGE_TYPES } from '../../utils/constants.js';

export async function inventoryPage(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0;">Inventory Management</h2>
    </div>

    <div id="low-stock-alert"></div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start;">
      <div class="glass-card">
        <h3 style="margin: 0 0 1rem 0;">Current Stock</h3>
        <div class="table-container" id="inventory-table">
          <div class="skeleton" style="height: 300px;"></div>
        </div>
      </div>

      <div class="glass-card">
        <h3 style="margin: 0 0 1rem 0;">Recent Adjustments</h3>
        <div id="inventory-log">
          <div class="skeleton" style="height: 300px;"></div>
        </div>
      </div>
    </div>
  `;

  const alertContainer = container.querySelector('#low-stock-alert');
  const tableContainer = container.querySelector('#inventory-table');
  const logContainer = container.querySelector('#inventory-log');

  let stockData = [];

  async function loadData() {
    const [summaryRes, logRes, lowStockRes] = await Promise.all([
      InventoryService.getStockSummary(),
      InventoryService.getLog(null, 10),
      InventoryService.getLowStock(20)
    ]);

    stockData = summaryRes.data || [];

    // Low Stock Alert
    if (lowStockRes.data && lowStockRes.data.length > 0) {
      alertContainer.innerHTML = `
        <div style="background: rgba(253,203,110,0.15); border: 1px solid var(--warning); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; color: var(--warning);">
          <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
          <div>
            <strong>Low Stock Warning</strong><br>
            <span style="font-size: 0.9rem;">${lowStockRes.data.length} product(s) have critically low stock (< 20 units).</span>
          </div>
        </div>
      `;
    } else {
      alertContainer.innerHTML = '';
    }

    // Main Table
    if (stockData.length === 0) {
      tableContainer.innerHTML = '<div style="text-align:center; padding: 2rem; color:var(--text-secondary);">No active products found.</div>';
    } else {
      tableContainer.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Value</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${stockData.map(p => {
              const val = p.price * p.stock_quantity;
              const isLow = p.stock_quantity < 20;
              return `
              <tr>
                <td style="font-weight: 600;">${p.name}</td>
                <td>${p.categories?.name || '—'}</td>
                <td>
                  <span style="display:inline-block; padding:0.2rem 0.5rem; border-radius:4px; font-weight:600; background: ${isLow ? 'rgba(253,203,110,0.2)' : 'rgba(255,255,255,0.05)'}; color: ${isLow ? 'var(--warning)' : 'inherit'};">
                    ${p.stock_quantity}
                  </span>
                </td>
                <td>${formatCurrency(val)}</td>
                <td style="text-align: right;">
                  <button class="btn btn-ghost adjust-btn" data-id="${p.id}" style="font-size: 0.8rem; padding: 0.25rem 0.75rem;">Adjust</button>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.adjust-btn').forEach(btn => {
        btn.addEventListener('click', () => openAdjustModal(stockData.find(p => p.id === btn.dataset.id)));
      });
    }

    // Logs
    if (!logRes.data || logRes.data.length === 0) {
      logContainer.innerHTML = '<div style="text-align:center; padding: 2rem; color:var(--text-secondary);">No recent logs.</div>';
    } else {
      logContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${logRes.data.map(log => `
            <div style="border-bottom: 1px solid var(--surface-border); padding-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <strong style="color: var(--primary);">${log.products?.name || 'Unknown'}</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${formatDateTime(log.created_at)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
                <span style="text-transform: capitalize; color: var(--text-secondary);">${log.change_type}</span>
                <span style="color: ${log.quantity_change > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                  ${log.quantity_change > 0 ? '+' : ''}${log.quantity_change}
                </span>
                <i class="fas fa-arrow-right" style="font-size: 0.7rem; color: var(--text-secondary);"></i>
                <span>${log.stock_after}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  function openAdjustModal(product) {
    const existingModal = document.getElementById('adjust-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'adjust-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h2>Adjust Stock</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div style="margin-bottom: 1.5rem;">
          <div style="color: var(--text-secondary); font-size: 0.9rem;">Product</div>
          <div style="font-weight: 600; font-size: 1.1rem; color: var(--primary);">${product.name}</div>
          <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">Current Stock: <span style="color: var(--text-primary); font-weight: 600;">${product.stock_quantity}</span></div>
        </div>
        <form id="adjust-form">
          <div class="form-group">
            <label class="form-label" for="change-type">Adjustment Type</label>
            <select id="change-type" class="form-control" required>
              ${INVENTORY_CHANGE_TYPES.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="qty-change">Quantity Change (+/-)</label>
            <input type="number" id="qty-change" class="form-control" required placeholder="e.g. 5 or -2">
          </div>
          <div class="form-group">
            <label class="form-label" for="notes">Notes (Optional)</label>
            <input type="text" id="notes" class="form-control">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
            <button type="button" class="btn btn-ghost modal-close-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Stock</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#adjust-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

      const type = modal.querySelector('#change-type').value;
      const qty = parseInt(modal.querySelector('#qty-change').value, 10);
      const notes = modal.querySelector('#notes').value;

      const { error } = await InventoryService.adjustStock(product.id, qty, type, notes);

      if (error) {
        showToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Update Stock';
      } else {
        showToast('Stock updated successfully', 'success');
        closeModal();
        loadData();
      }
    });
  }

  await loadData();
  return () => {};
}
