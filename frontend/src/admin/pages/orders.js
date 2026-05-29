import { OrdersService } from '../../services/orders.service.js';
import { formatCurrency, formatDate, formatDateTime, statusBadge } from '../../utils/helpers.js';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../../utils/constants.js';

export async function ordersPage(container, params) {
  if (params?.id) {
    return renderOrderDetail(container, params.id);
  }
  return renderOrderList(container);
}

async function renderOrderList(container) {
  let currentPage = 1;
  const limit = 15;
  let currentStatus = '';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0;">Orders</h2>
    </div>

    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem;" id="status-filters">
      <button class="btn btn-primary" data-status="">All Orders</button>
      ${ORDER_STATUSES.map(s => `<button class="btn btn-ghost" data-status="${s}" style="text-transform: capitalize;">${s}</button>`).join('')}
    </div>

    <div class="glass-card table-container" id="orders-table-container">
      <div class="skeleton" style="height: 300px; width: 100%;"></div>
    </div>
    
    <div id="pagination-controls" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; align-items: center;"></div>
  `;

  const tableContainer = container.querySelector('#orders-table-container');
  const paginationControls = container.querySelector('#pagination-controls');
  const statusBtns = container.querySelectorAll('#status-filters button');

  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => { b.className = 'btn btn-ghost'; b.style.textTransform = 'capitalize'; });
      btn.className = 'btn btn-primary';
      currentStatus = btn.dataset.status;
      currentPage = 1;
      loadOrders();
    });
  });

  async function loadOrders() {
    tableContainer.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';
    
    const { data, count, error } = await OrdersService.getAll({
      status: currentStatus || null,
      page: currentPage,
      limit
    });

    if (error) {
      tableContainer.innerHTML = `<div style="color: var(--danger)">Error: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      tableContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No orders found.</div>`;
      paginationControls.innerHTML = '';
      return;
    }

    tableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(o => `
            <tr style="cursor: pointer;" onclick="window.location.hash='#/orders/${o.id}'">
              <td style="font-weight: 600; color: var(--primary);">${o.order_number}</td>
              <td>${formatDate(o.order_date)}</td>
              <td>${o.customers?.full_name || o.customers?.email || 'Unknown'}</td>
              <td style="font-weight: 600;">${formatCurrency(o.total_amount)}</td>
              <td>${statusBadge(o.payment_status)} <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase;">(${o.payment_method})</span></td>
              <td>${statusBadge(o.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const totalPages = Math.ceil(count / limit);
    paginationControls.innerHTML = `
      <span style="color: var(--text-secondary); font-size: 0.9rem;">Page ${currentPage} of ${totalPages || 1}</span>
      <div>
        <button class="btn btn-ghost" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
        <button class="btn btn-ghost" id="next-page" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
      </div>
    `;

    if (currentPage > 1) container.querySelector('#prev-page').addEventListener('click', () => { currentPage--; loadOrders(); });
    if (currentPage < totalPages) container.querySelector('#next-page').addEventListener('click', () => { currentPage++; loadOrders(); });
  }

  await loadOrders();
  return () => {};
}

async function renderOrderDetail(container, orderId) {
  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <a href="#/orders" style="color: var(--text-secondary); text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;"><i class="fas fa-arrow-left"></i> Back to Orders</a>
    </div>
    <div id="order-detail-content"><div class="skeleton" style="height: 400px;"></div></div>
  `;

  const content = container.querySelector('#order-detail-content');
  const { data: order, error } = await OrdersService.getById(orderId);

  if (error || !order) {
    content.innerHTML = `<div class="glass-card" style="color: var(--danger)">Error loading order details.</div>`;
    return () => {};
  }

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start;">
      
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Order Header -->
        <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0 0 0.5rem 0; color: var(--primary);">${order.order_number}</h2>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">Placed on ${formatDateTime(order.order_date)}</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
            <div style="display:flex; align-items:center; gap: 0.5rem;">
              <span style="font-size:0.85rem; color:var(--text-secondary);">Order Status:</span>
              <select id="update-status" class="form-control" style="padding: 0.25rem 0.5rem; text-transform: capitalize;">
                ${ORDER_STATUSES.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div style="display:flex; align-items:center; gap: 0.5rem;">
              <span style="font-size:0.85rem; color:var(--text-secondary);">Payment:</span>
              <select id="update-payment" class="form-control" style="padding: 0.25rem 0.5rem; text-transform: capitalize;">
                ${PAYMENT_STATUSES.map(s => `<option value="${s}" ${order.payment_status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="glass-card">
          <h3 style="margin: 0 0 1rem 0;">Order Items</h3>
          <table style="width: 100%;">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.order_items || []).map(item => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap: 1rem;">
                      <img src="${item.products?.image_url || ''}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; background: rgba(255,255,255,0.05);" onerror="this.style.display='none'">
                      <div>${item.products?.name || 'Unknown Product'}</div>
                    </div>
                  </td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${item.quantity}</td>
                  <td style="text-align: right; font-weight: 600;">${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; padding-top: 1rem;"><strong>Grand Total:</strong></td>
                <td style="text-align: right; padding-top: 1rem; font-size: 1.1rem; color: var(--primary);"><strong>${formatCurrency(order.total_amount)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Customer & Shipping -->
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="glass-card">
          <h3 style="margin: 0 0 1rem 0;">Customer Info</h3>
          <div style="margin-bottom: 0.5rem;"><strong>${order.customers?.full_name || 'Guest'}</strong></div>
          <div style="color: var(--text-secondary); margin-bottom: 0.5rem;"><i class="fas fa-envelope" style="width: 20px;"></i> ${order.customers?.email}</div>
          <div style="color: var(--text-secondary);"><i class="fas fa-phone" style="width: 20px;"></i> ${order.customers?.phone || 'N/A'}</div>
        </div>

        <div class="glass-card">
          <h3 style="margin: 0 0 1rem 0;">Shipping Address</h3>
          <div style="line-height: 1.6; color: var(--text-secondary);">
            ${order.shipping_address ? order.shipping_address.replace(/\n/g, '<br>') : 'Address not provided.'}
          </div>
        </div>
      </div>

    </div>
  `;

  // Status updates
  container.querySelector('#update-status').addEventListener('change', async (e) => {
    const { error } = await OrdersService.updateStatus(orderId, e.target.value);
    if (!error) showToast('Order status updated', 'success');
  });

  container.querySelector('#update-payment').addEventListener('change', async (e) => {
    const { error } = await OrdersService.updatePaymentStatus(orderId, e.target.value);
    if (!error) showToast('Payment status updated', 'success');
  });

  return () => {};
}
