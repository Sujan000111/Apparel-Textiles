import './admin.css';
import { Router } from '../utils/router.js';
import { dashboardPage } from './pages/dashboard.js';
import { productsPage } from './pages/products.js';
import { ordersPage } from './pages/orders.js';
import { customersPage } from './pages/customers.js';
import { inventoryPage } from './pages/inventory.js';

class AdminApp {
  constructor() {
    this.container = document.getElementById('app');
    this.router = new Router(this.container);
    this.init();
  }

  init() {
    this.setupRoutes();
    this.render();

    // Remove initial loader
    const loader = document.getElementById('app-loader');
    if (loader) loader.remove();
  }

  setupRoutes() {
    // App wrapper layout
    const withLayout = (pageHandler, title, navId) => (container, params) => {
      container.innerHTML = this.getLayoutHTML(title, navId);
      const contentArea = container.querySelector('.content-area');
      return pageHandler(contentArea, params);
    };

    this.router.addRoute('/', withLayout(dashboardPage, 'Dashboard', 'nav-dashboard'));
    this.router.addRoute('/dashboard', withLayout(dashboardPage, 'Dashboard', 'nav-dashboard'));
    this.router.addRoute('/products', withLayout(productsPage, 'Products', 'nav-products'));
    this.router.addRoute('/orders', withLayout(ordersPage, 'Orders', 'nav-orders'));
    this.router.addRoute('/orders/:id', withLayout(ordersPage, 'Order Details', 'nav-orders'));
    this.router.addRoute('/customers', withLayout(customersPage, 'Customers', 'nav-customers'));
    this.router.addRoute('/inventory', withLayout(inventoryPage, 'Inventory', 'nav-inventory'));

    this.router.start();
  }

  getLayoutHTML(title, activeNavId) {
    return `
      <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <i class="fas fa-chart-pie" style="margin-right: 10px;"></i>
            A&T Admin
          </div>
          <nav class="sidebar-nav">
            <a href="#/" class="nav-link ${activeNavId === 'nav-dashboard' ? 'active' : ''}">
              <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="#/products" class="nav-link ${activeNavId === 'nav-products' ? 'active' : ''}">
              <i class="fas fa-box"></i> Products
            </a>
            <a href="#/orders" class="nav-link ${activeNavId === 'nav-orders' ? 'active' : ''}">
              <i class="fas fa-shopping-cart"></i> Orders
            </a>
            <a href="#/customers" class="nav-link ${activeNavId === 'nav-customers' ? 'active' : ''}">
              <i class="fas fa-users"></i> Customers
            </a>
            <a href="#/inventory" class="nav-link ${activeNavId === 'nav-inventory' ? 'active' : ''}">
              <i class="fas fa-warehouse"></i> Inventory
            </a>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <header class="top-header">
            <div class="header-title">${title}</div>
            <div class="header-actions">
              <span class="admin-email">admin (bypass)</span>
            </div>
          </header>
          
          <div class="content-area">
            <!-- Page content injected here -->
          </div>
        </main>
      </div>
    `;
  }

  render() {
    // Router handles rendering based on hash
    this.router._onHashChange();
  }
}

// Start app
new AdminApp();
