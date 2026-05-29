/**
 * Lightweight hash-based SPA router.
 * Usage:
 *   const router = new Router(document.getElementById('app'));
 *   router.addRoute('/', homePage);
 *   router.addRoute('/products', productsPage);
 *   router.addRoute('/products/:id', productDetailPage);
 *   router.start();
 */
export class Router {
  constructor(container) {
    this.container = container;
    this.routes = [];
    this.currentCleanup = null;
    this._onHashChange = this._onHashChange.bind(this);
  }

  addRoute(pattern, handler) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      pattern,
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
      handler,
    });
    return this;
  }

  start() {
    window.addEventListener('hashchange', this._onHashChange);
    this._onHashChange();
  }

  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  navigate(path) {
    window.location.hash = `#${path}`;
  }

  getCurrentPath() {
    return window.location.hash.slice(1) || '/';
  }

  _onHashChange() {
    const path = this.getCurrentPath();

    // Run cleanup from previous page
    if (typeof this.currentCleanup === 'function') {
      this.currentCleanup();
      this.currentCleanup = null;
    }

    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        const cleanup = route.handler(this.container, params);
        if (typeof cleanup === 'function') {
          this.currentCleanup = cleanup;
        }
        return;
      }
    }

    // 404 fallback
    this.container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:1rem;">
        <h1 style="font-size:4rem;opacity:0.3;">404</h1>
        <p style="opacity:0.6;">Page not found</p>
        <a href="#/" style="color:#a78bfa;text-decoration:none;">← Go Home</a>
      </div>
    `;
  }
}
