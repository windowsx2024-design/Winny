const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const STORE_PATH = path.join(__dirname, '..', '..', 'store.json');

const initialData = {
  dashboard: { storeName: 'Northstar Goods', netSales: 12480, orders: 186, conversion: 3.8, profit: 4990, payout: 2180.40 },
  queue: [],
  users: [
    { id: 'alex-chen', name: 'Alex Chen', email: 'alex@northstargoods.com', plan: 'Growth', revenue: 12480, views: 6800000, purchases: 186, status: 'Active' },
    { id: 'maya-singh', name: 'Maya Singh', email: 'maya@oceanroom.com', plan: 'Starter', revenue: 4360, views: 1200000, purchases: 73, status: 'Active' },
    { id: 'jordan-lee', name: 'Jordan Lee', email: 'jordan@northmarket.com', plan: 'Growth', revenue: 21890, views: 9100000, purchases: 312, status: 'Active' }
  ],
  accessRequests: [
    { id: 'request-sam-rivera', name: 'Sam Rivera', email: 'sam@rivera.store', requestedAt: '2026-09-05T09:30:00.000Z', status: 'pending' }
  ],
  plans: [
    { id: 'starter', name: 'Starter', price: 19, description: 'For your first product tests.', features: ['10 product saves', 'Basic sales signals', 'CSV exports'] },
    { id: 'growth', name: 'Growth', price: 79, description: 'Scale with more products and signals.', features: ['100 product saves', 'Advanced signals', 'Shopify export'] }
  ],
  products: [
    { id: 'magnetic-phone-mount', title: 'Magnetic Phone Mount', cost: 3.82, rating: 4.8, supplierOrders: '2,000+' },
    { id: 'pet-hair-remover', title: 'Pet Hair Remover', cost: 4.25, rating: 4.9, supplierOrders: '1,000+' },
    { id: 'portable-blender', title: 'Portable Blender', cost: 8.90, rating: 4.7, supplierOrders: '500+' }
  ]
};

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return JSON.parse(JSON.stringify(initialData));
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function generateUserId() {
  return uuidv4();
}

function generateUserCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function setCookieHeaders(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

module.exports = { readStore, writeStore, generateUserId, generateUserCode, setCookieHeaders };
