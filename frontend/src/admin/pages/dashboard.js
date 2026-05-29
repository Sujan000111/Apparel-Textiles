import { AnalyticsService } from '../../services/analytics.service.js';
import { formatCurrency, statusBadge, formatDate } from '../../utils/helpers.js';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Theme colors for charts
Chart.defaults.color = '#8888a0';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
const brandColors = ['#6c5ce7','#a29bfe','#fd79a8','#e17055','#00b894','#0984e3','#fdcb6e','#d63031','#00cec9','#2d3436'];

export async function dashboardPage(container) {
  // Initial loading state
  container.innerHTML = `
    <div class="kpi-grid">
      ${Array(4).fill('<div class="glass-card skeleton" style="height: 100px;"></div>').join('')}
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
      <div class="glass-card skeleton" style="height: 400px;"></div>
      <div class="glass-card skeleton" style="height: 400px;"></div>
    </div>
  `;

  try {
    // Fetch dashboard stats (optimizing parallel fetches could be done, but getDashboardStats is comprehensive)
    const { data: stats, error: statsError } = await AnalyticsService.getDashboardStats();
    const { data: productSales } = await AnalyticsService.getProductSalesSummary();
    const { data: categoryShare } = await AnalyticsService.getCategoryRevenueShare();
    const { data: unitsSold } = await AnalyticsService.getUnitsSoldByProduct();
    const { data: recentOrders } = await AnalyticsService.getRecentOrders(5);

    if (statsError) throw statsError;

    container.innerHTML = `
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-icon" style="background: rgba(108,92,231,0.1); color: #6c5ce7;">
            <i class="fas fa-rupee-sign"></i>
          </div>
          <div class="kpi-info">
            <p>Total Revenue</p>
            <h3>${formatCurrency(stats.totalRevenue)}</h3>
          </div>
        </div>
        <div class="glass-card kpi-card">
          <div class="kpi-icon" style="background: rgba(0,184,148,0.1); color: #00b894;">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <div class="kpi-info">
            <p>Total Orders</p>
            <h3>${stats.totalOrders}</h3>
          </div>
        </div>
        <div class="glass-card kpi-card">
          <div class="kpi-icon" style="background: rgba(253,121,168,0.1); color: #fd79a8;">
            <i class="fas fa-tags"></i>
          </div>
          <div class="kpi-info">
            <p>Total Products</p>
            <h3>${stats.totalProducts}</h3>
          </div>
        </div>
        <div class="glass-card kpi-card">
          <div class="kpi-icon" style="background: rgba(9,132,227,0.1); color: #0984e3;">
            <i class="fas fa-users"></i>
          </div>
          <div class="kpi-info">
            <p>Customers</p>
            <h3>${stats.totalCustomers}</h3>
          </div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div class="glass-card">
            <h3 style="margin-top:0; font-size:1.1rem;">Total Sales by Product</h3>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="salesChart"></canvas>
            </div>
            </div>
            <div class="glass-card">
            <h3 style="margin-top:0; font-size:1.1rem;">Revenue Share by Category</h3>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="categoryChart"></canvas>
            </div>
            </div>
        </div>
      </div>

      <!-- Charts Row 2 & Recent Orders -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
        <div class="glass-card">
          <h3 style="margin-top:0; font-size:1.1rem;">Units Sold per Product</h3>
          <div style="position: relative; height: 300px; width: 100%;">
            <canvas id="unitsChart"></canvas>
          </div>
        </div>
        <div class="glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin:0; font-size:1.1rem;">Recent Orders</h3>
            <a href="#/orders" class="btn btn-ghost" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">View All</a>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${(recentOrders || []).map(order => `
                  <tr>
                    <td><a href="#/orders/${order.id}" style="color: var(--primary); text-decoration: none;">${order.order_number}</a></td>
                    <td>${order.customers?.full_name || 'Guest'}</td>
                    <td>${formatCurrency(order.total_amount)}</td>
                    <td>${statusBadge(order.status)}</td>
                  </tr>
                `).join('')}
                ${!(recentOrders?.length) ? '<tr><td colspan="4" style="text-align:center;">No recent orders</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render Charts
    if (productSales && productSales.length > 0) {
      new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: {
          labels: productSales.map(d => d.product),
          datasets: [{
            label: 'Total Sales (₹)',
            data: productSales.map(d => d.totalSales),
            backgroundColor: brandColors,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (categoryShare && categoryShare.length > 0) {
      new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
          labels: categoryShare.map(d => d.category),
          datasets: [{
            data: categoryShare.map(d => d.revenue),
            backgroundColor: brandColors.slice(0, 3),
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#e0e0f0' } }
          },
          cutout: '70%'
        }
      });
    }

    if (unitsSold && unitsSold.length > 0) {
      new Chart(document.getElementById('unitsChart'), {
        type: 'bar',
        data: {
          labels: unitsSold.map(d => d.product),
          datasets: [{
            label: 'Units Sold',
            data: unitsSold.map(d => d.unitsSold),
            backgroundColor: brandColors,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { grid: { display: false } }
          }
        }
      });
    }

  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="color:var(--danger)">Error loading dashboard: ${err.message}</div>`;
  }

  return () => {}; // Cleanup
}
