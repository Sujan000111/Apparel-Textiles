export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'netbanking', label: 'Net Banking' },
];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export const INVENTORY_CHANGE_TYPES = [
  { value: 'restock', label: 'Restock' },
  { value: 'sale', label: 'Sale' },
  { value: 'adjustment', label: 'Manual Adjustment' },
  { value: 'return', label: 'Return' },
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  ADMIN_LIMIT: 20,
};

export const STORAGE_BUCKET = 'product-images';

export const CART_STORAGE_KEY = 'apparel_textiles_cart';
