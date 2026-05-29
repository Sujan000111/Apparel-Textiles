import { CustomersService } from '../../services/customers.service.js';
import { formatCurrency, formatDate, debounce } from '../../utils/helpers.js';

export async function customersPage(container) {
  let currentPage = 1;
  const limit = 15;
  let currentSearch = '';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0;">Customers</h2>
    </div>

    <div class="glass-card" style="margin-bottom: 1.5rem; display: flex; align-items: center;">
      <div style="flex: 1; position: relative; max-width: 400px;">
        <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
        <input type="text" id="search-input" class="form-control" placeholder="Search by name, email, or phone..." style="width: 100%; padding-left: 2.5rem;">
      </div>
    </div>

    <div class="glass-card table-container" id="customers-table-container">
      <div class="skeleton" style="height: 300px; width: 100%;"></div>
    </div>
    
    <div id="pagination-controls" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; align-items: center;"></div>
  `;

  const tableContainer = container.querySelector('#customers-table-container');
  const searchInput = container.querySelector('#search-input');
  const paginationControls = container.querySelector('#pagination-controls');

  async function loadCustomers() {
    tableContainer.innerHTML = '<div class="skeleton" style="height: 300px; width: 100%;"></div>';
    
    const { data, count, error } = await CustomersService.getAll({
      search: currentSearch,
      page: currentPage,
      limit
    });

    if (error) {
      tableContainer.innerHTML = `<div style="color: var(--danger)">Error: ${error.message}</div>`;
      return;
    }

    if (!data || data.length === 0) {
      tableContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No customers found.</div>`;
      paginationControls.innerHTML = '';
      return;
    }

    tableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Location</th>
            <th>Joined Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td style="font-weight: 600;">${c.full_name}</td>
              <td>
                <div><a href="mailto:${c.email}" style="color: var(--primary); text-decoration: none;">${c.email}</a></div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${c.phone || 'No phone'}</div>
              </td>
              <td>${c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '—'}</td>
              <td>${formatDate(c.created_at)}</td>
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

    if (currentPage > 1) container.querySelector('#prev-page').addEventListener('click', () => { currentPage--; loadCustomers(); });
    if (currentPage < totalPages) container.querySelector('#next-page').addEventListener('click', () => { currentPage++; loadCustomers(); });
  }

  searchInput.addEventListener('input', debounce((e) => {
    currentSearch = e.target.value;
    currentPage = 1;
    loadCustomers();
  }, 500));

  await loadCustomers();
  return () => {};
}
