import { ProductsService } from '../../services/products.service.js';
import { CategoriesService } from '../../services/categories.service.js';
import { formatCurrency, generateSlug, showToast, debounce } from '../../utils/helpers.js';

export async function productsPage(container) {
  let currentPage = 1;
  const limit = 10;
  let currentSearch = '';
  let currentCategory = '';
  let categories = [];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0;">Products</h2>
      <button id="btn-add-product" class="btn btn-primary"><i class="fas fa-plus"></i> Add Product</button>
    </div>

    <div class="glass-card" style="margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center;">
      <div style="flex: 1; position: relative;">
        <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
        <input type="text" id="search-input" class="form-control" placeholder="Search products..." style="width: 100%; padding-left: 2.5rem;">
      </div>
      <select id="category-filter" class="form-control" style="width: 200px;">
        <option value="">All Categories</option>
      </select>
    </div>

    <div class="glass-card table-container" id="products-table-container">
      <div class="skeleton" style="height: 300px; width: 100%;"></div>
    </div>
    
    <div id="pagination-controls" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; align-items: center;"></div>
  `;

  const tableContainer = container.querySelector('#products-table-container');
  const searchInput = container.querySelector('#search-input');
  const categoryFilter = container.querySelector('#category-filter');
  const paginationControls = container.querySelector('#pagination-controls');

  async function loadCategories() {
    const { data } = await CategoriesService.getAll();
    if (data) {
      categories = data;
      categoryFilter.innerHTML = '<option value="">All Categories</option>' + 
        data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }

  async function loadProducts() {
    tableContainer.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';
    
    const { data, count, error } = await ProductsService.getAll({
      search: currentSearch,
      category: currentCategory,
      page: currentPage,
      limit,
      active: null // Show both active and inactive
    });

    if (error) {
      tableContainer.innerHTML = `<div style="color: var(--danger)">Error: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      tableContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No products found.</div>`;
      paginationControls.innerHTML = '';
      return;
    }

    tableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${p.image_url ? `<img src="${p.image_url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=''; this.outerHTML='<i class=\\'fas fa-image\\' style=\\'color:var(--text-secondary)\\'></i>'">` : '<i class="fas fa-image" style="color:var(--text-secondary)"></i>'}
                  </div>
                  <div>
                    <div style="font-weight: 600;">${p.name}</div>
                  </div>
                </div>
              </td>
              <td>${p.categories?.name || '—'}</td>
              <td>${formatCurrency(p.price)}</td>
              <td>
                <span style="color: ${p.stock_quantity < 20 ? 'var(--warning)' : 'inherit'}">${p.stock_quantity}</span>
              </td>
              <td>
                <span style="display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.75rem; font-weight: 600; background: ${p.is_active ? 'rgba(0,184,148,0.15)' : 'rgba(214,48,49,0.15)'}; color: ${p.is_active ? 'var(--success)' : 'var(--danger)'};">
                  ${p.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button class="btn btn-ghost edit-btn" data-id="${p.id}" style="padding: 0.25rem 0.5rem;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-ghost toggle-btn" data-id="${p.id}" data-active="${p.is_active}" style="padding: 0.25rem 0.5rem;" title="${p.is_active ? 'Deactivate' : 'Activate'}">
                  <i class="fas ${p.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Pagination
    const totalPages = Math.ceil(count / limit);
    paginationControls.innerHTML = `
      <span style="color: var(--text-secondary); font-size: 0.9rem;">Page ${currentPage} of ${totalPages || 1}</span>
      <div>
        <button class="btn btn-ghost" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
        <button class="btn btn-ghost" id="next-page" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
      </div>
    `;

    if (currentPage > 1) {
      container.querySelector('#prev-page').addEventListener('click', () => { currentPage--; loadProducts(); });
    }
    if (currentPage < totalPages) {
      container.querySelector('#next-page').addEventListener('click', () => { currentPage++; loadProducts(); });
    }

    // Bind action buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductModal(data.find(p => p.id === btn.dataset.id)));
    });
    container.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const active = btn.dataset.active === 'true';
        btn.disabled = true;
        await ProductsService.toggleActive(id, !active);
        showToast(active ? 'Product deactivated' : 'Product activated', 'success');
        loadProducts();
      });
    });
  }

  // Search and Filter Listeners
  searchInput.addEventListener('input', debounce((e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadProducts();
  }, 500));

  categoryFilter.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    currentPage = 1;
    loadProducts();
  });

  // Add Product button
  container.querySelector('#btn-add-product').addEventListener('click', () => openProductModal());

  // Modal logic
  function openProductModal(product = null) {
    const existingModal = document.getElementById('product-modal');
    if (existingModal) existingModal.remove();

    const isEdit = !!product;
    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <form id="product-form">
          <div class="form-group">
            <label class="form-label" for="p-name">Name</label>
            <input type="text" id="p-name" class="form-control" required value="${product?.name || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="p-slug">Slug</label>
            <input type="text" id="p-slug" class="form-control" required value="${product?.slug || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="p-category">Category</label>
            <select id="p-category" class="form-control" required>
              <option value="">Select Category</option>
              ${categories.map(c => `<option value="${c.id}" ${product?.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="p-price">Price (₹)</label>
              <input type="number" id="p-price" class="form-control" min="0" step="0.01" required value="${product?.price || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="p-stock">Initial Stock</label>
              <input type="number" id="p-stock" class="form-control" min="0" step="1" required value="${product?.stock_quantity ?? 0}" ${isEdit ? 'disabled title="Use Inventory page to adjust stock"' : ''}>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="p-desc">Description</label>
            <textarea id="p-desc" class="form-control" rows="3">${product?.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="p-image">Image URL</label>
            <input type="url" id="p-image" class="form-control" value="${product?.image_url || ''}">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
            <button type="button" class="btn btn-ghost modal-close-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector('#p-name');
    const slugInput = modal.querySelector('#p-slug');
    if (!isEdit) {
      nameInput.addEventListener('input', () => {
        slugInput.value = generateSlug(nameInput.value);
      });
    }

    const closeModal = () => modal.remove();
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#product-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      const payload = {
        name: nameInput.value,
        slug: slugInput.value,
        category_id: modal.querySelector('#p-category').value,
        price: parseFloat(modal.querySelector('#p-price').value),
        description: modal.querySelector('#p-desc').value,
        image_url: modal.querySelector('#p-image').value,
      };

      if (!isEdit) {
        payload.stock_quantity = parseInt(modal.querySelector('#p-stock').value, 10);
      }

      const { error } = isEdit 
        ? await ProductsService.update(product.id, payload)
        : await ProductsService.create(payload);

      if (error) {
        showToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Product';
      } else {
        showToast(`Product ${isEdit ? 'updated' : 'created'} successfully`, 'success');
        closeModal();
        loadProducts();
      }
    });
  }

  // Init
  await loadCategories();
  await loadProducts();

  return () => {};
}
