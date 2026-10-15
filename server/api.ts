/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  db,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  subscribeToNotifications,
} from './db.ts';
import { Product, User } from '../src/types.ts';

export const apiRouter = Router();

// Middleware: Authenticate User
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'লগইন করা আবশ্যক (Unauthorized)' });
  }
  const token = authHeader.split(' ')[1];
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: 'সেশন শেষ হয়ে গেছে, অনুগ্রহ করে পুনরায় লগইন করুন' });
  }
  (req as any).user = session;
  next();
}

// Middleware: Require Admin Role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'অ্যাডমিন অনুমতি আবশ্যক (Unauthorized)' });
  }
  const token = authHeader.split(' ')[1];
  const session = verifySessionToken(token);
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    return res.status(403).json({ error: 'এই সেকশনে প্রবেশের অনুমতি নেই (Forbidden)' });
  }
  (req as any).admin = session;
  next();
}

// ==================== AUTHENTICATION ====================

// Register Customer
apiRouter.post('/auth/register', (req, res) => {
  const { name, email, phone, password, district, thana, streetAddress } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'নাম, মোবাইল নম্বর এবং পাসওয়ার্ড আবশ্যক।' });
  }

  // Validate Bangladeshi Phone Number
  const cleanPhone = phone.replace(/\D/g, '');
  if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'অনুগ্রহ করে সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।' });
  }

  if (db.getUserByPhone(cleanPhone)) {
    return res.status(400).json({ error: 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' });
  }

  if (email && db.getUserByEmail(email)) {
    return res.status(400).json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।' });
  }

  const userId = `usr-${Date.now()}`;
  const newUser: User = {
    id: userId,
    name,
    email: email || `${cleanPhone}@myagrofarm.local`,
    phone: cleanPhone,
    role: 'customer',
    addresses: streetAddress
      ? [
          {
            id: `addr-${Date.now()}`,
            label: 'বাড়ি',
            recipientName: name,
            phone: cleanPhone,
            district: district || 'কুড়িগ্রাম',
            thana: thana || 'কুড়িগ্রাম সদর',
            streetAddress,
            isDefault: true,
          },
        ]
      : [],
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser, password);
  const token = createSessionToken(userId, 'customer');

  res.status(201).json({
    message: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।',
    token,
    user: newUser,
  });
});

// Login Customer
apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body; // Can be phone or email
  if (!identifier || !password) {
    return res.status(400).json({ error: 'মোবাইল/ইমেইল এবং পাসওয়ার্ড দিন।' });
  }

  const cleanIdent = identifier.trim();
  const user = cleanIdent.includes('@') ? db.getUserByEmail(cleanIdent) : db.getUserByPhone(cleanIdent.replace(/\D/g, ''));

  if (!user) {
    return res.status(401).json({ error: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড।' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড।' });
  }

  const token = createSessionToken(user.id, user.role);
  const { passwordHash, salt, ...safeUser } = user;

  res.json({
    message: 'সফলভাবে লগইন হয়েছে।',
    token,
    user: safeUser,
  });
});

// Admin Login
apiRouter.post('/auth/admin-login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'অ্যাডমিন ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' });
  }

  const user = db.getUserByEmail(email.trim());
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'অননুমোদিত অ্যাডমিন অ্যাকাউন্ট।' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'ভুল অ্যাডমিন ক্রেডেনশিয়াল।' });
  }

  const token = createSessionToken(user.id, user.role);
  const { passwordHash, salt, ...safeUser } = user;

  db.addAuditLog(user.name, 'অ্যাডমিন লগইন', 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করেছেন।');

  res.json({
    message: 'অ্যাডমিন লগইন সফল হয়েছে।',
    token,
    user: safeUser,
  });
});

// Check Session / Current User
apiRouter.get('/auth/me', requireAuth, (req, res) => {
  const session = (req as any).user;
  const user = db.getUserById(session.userId);
  if (!user) return res.status(404).json({ error: 'ইউজার পাওয়া যায়নি।' });

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update Profile
apiRouter.put('/auth/profile', requireAuth, (req, res) => {
  const session = (req as any).user;
  const { name, phone, addresses } = req.body;

  const updated = db.updateUser(session.userId, {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(addresses && { addresses }),
  });

  if (!updated) return res.status(404).json({ error: 'আপডেট ব্যর্থ হয়েছে।' });
  const { passwordHash, salt, ...safeUser } = updated;
  res.json({ message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে।', user: safeUser });
});

// ==================== PRODUCTS & CATEGORIES ====================

// Get All Products with Filters
apiRouter.get('/products', (req, res) => {
  const { category, search, minPrice, maxPrice, inStock, sort, featured, bestSeller } = req.query;

  let products = db.getProducts();

  // Filter: Category
  if (category && category !== 'all') {
    products = products.filter((p) => p.categorySlug === category);
  }

  // Filter: Search (Bengali or English)
  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    products = products.filter(
      (p) =>
        p.nameBn.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.descriptionBn.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q) ||
        p.farmOriginBn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  // Filter: Price Range
  if (minPrice) {
    products = products.filter((p) => (p.discountPrice || p.price) >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter((p) => (p.discountPrice || p.price) <= Number(maxPrice));
  }

  // Filter: Stock
  if (inStock === 'true') {
    products = products.filter((p) => p.stock > 0);
  }

  // Filter: Featured & Best Seller
  if (featured === 'true') {
    products = products.filter((p) => p.featured);
  }
  if (bestSeller === 'true') {
    products = products.filter((p) => p.bestSeller);
  }

  // Sorting
  if (sort === 'price_asc') {
    products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sort === 'price_desc') {
    products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default popularity / best sellers first
    products.sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || b.reviewCount - a.reviewCount);
  }

  res.json({ products, total: products.length });
});

// Single Product Details
apiRouter.get('/products/:id', (req, res) => {
  const prod = db.getProductById(req.params.id) || db.getProducts().find((p) => p.slug === req.params.id);
  if (!prod) return res.status(404).json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি।' });

  // Get related products in the same category
  const related = db
    .getProducts()
    .filter((p) => p.categorySlug === prod.categorySlug && p.id !== prod.id)
    .slice(0, 4);

  // Get approved reviews
  const reviews = db.getReviews(prod.id);

  res.json({ product: prod, related, reviews });
});

// Categories
apiRouter.get('/categories', (req, res) => {
  res.json({ categories: db.getCategories() });
});

// ==================== ORDERS & CHECKOUT ====================

// Create Order (Atomic Stock Checked)
apiRouter.post('/orders', (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryZone,
    items,
    couponCode,
    paymentMethod,
    customerNotes,
    paymentTrxId,
    bankSlipRef,
  } = req.body;

  if (!customerName || !customerPhone || !deliveryAddress || !items || !items.length) {
    return res.status(400).json({ error: 'সকল প্রয়োজনীয় তথ্য প্রদান করুন।' });
  }

  // Phone Validation
  const cleanPhone = customerPhone.replace(/\D/g, '');
  if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।' });
  }

  // Calculate items subtotal on the server to prevent manipulation
  let subtotal = 0;
  for (const item of items) {
    const p = db.getProductById(item.productId);
    if (!p) {
      return res.status(400).json({ error: `পণ্য পাওয়া যায়নি: ${item.nameBn || item.productId}` });
    }
    const actualPrice = p.discountPrice || p.price;
    subtotal += actualPrice * item.quantity;
  }

  // Delivery charge calculation based on settings and zone
  const settings = db.getSettings();
  let deliveryCharge = settings.deliveryFees.nationwide;
  if (deliveryZone === 'kurigram_sadar') {
    deliveryCharge = settings.deliveryFees.kurigramSadar;
  } else if (deliveryZone === 'rangpur_division') {
    deliveryCharge = settings.deliveryFees.rangpurDivision;
  }

  // Free delivery threshold check
  if (subtotal >= settings.freeDeliveryThreshold) {
    deliveryCharge = 0;
  }

  // Calculate coupon discount
  let discount = 0;
  if (couponCode) {
    const valResult = db.validateCoupon(couponCode, subtotal);
    if (valResult.coupon) {
      const c = valResult.coupon;
      if (c.discountType === 'percentage') {
        discount = Math.round((subtotal * c.discountValue) / 100);
        if (c.maxDiscount && discount > c.maxDiscount) {
          discount = c.maxDiscount;
        }
      } else {
        discount = c.discountValue;
      }
    }
  }

  const total = Math.max(0, subtotal - discount + deliveryCharge);

  // Check if authenticated user token exists
  const authHeader = req.headers.authorization;
  let userId: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = verifySessionToken(authHeader.split(' ')[1]);
    if (session) userId = session.userId;
  }

  // Call Atomic Order Creator
  const result = db.createOrder({
    userId,
    customerName,
    customerEmail,
    customerPhone: cleanPhone,
    deliveryAddress,
    deliveryZone: deliveryZone || 'nationwide',
    deliveryCharge,
    items,
    subtotal,
    discount,
    couponCode: discount > 0 ? couponCode : undefined,
    total,
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : (paymentTrxId ? 'verified' : 'pending'),
    paymentTrxId,
    bankSlipRef,
    status: 'Pending',
    customerNotes,
  });

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    message: 'অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।',
    order: result.order,
  });
});

// Track Order
apiRouter.get('/orders/track', (req, res) => {
  const { orderNumber, phone } = req.query;
  if (!orderNumber || !phone) {
    return res.status(400).json({ error: 'অর্ডার নম্বর এবং মোবাইল নম্বর উভয়ই প্রদান করুন।' });
  }

  const order = db.getOrderByTracking(String(orderNumber), String(phone));
  if (!order) {
    return res.status(404).json({ error: 'কোনো অর্ডার পাওয়া যায়নি। নম্বর এবং ফোন নম্বর সঠিক কিনা নিশ্চিত করুন।' });
  }

  res.json({ order });
});

// Get User Orders
apiRouter.get('/orders/user', requireAuth, (req, res) => {
  const session = (req as any).user;
  const orders = db.getOrdersByUserId(session.userId);
  res.json({ orders });
});

// Single Order by ID
apiRouter.get('/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'অর্ডার পাওয়া যায়নি।' });
  res.json({ order });
});

// Validate Coupon
apiRouter.post('/coupons/validate', (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'কুপন কোড দিন।' });

  const result = db.validateCoupon(code, Number(cartTotal || 0));
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  let discount = 0;
  const c = result.coupon!;
  if (c.discountType === 'percentage') {
    discount = Math.round((Number(cartTotal) * c.discountValue) / 100);
    if (c.maxDiscount && discount > c.maxDiscount) {
      discount = c.maxDiscount;
    }
  } else {
    discount = c.discountValue;
  }

  res.json({
    valid: true,
    coupon: c,
    discount,
    message: `কুপন কোড প্রয়োগ হয়েছে! ছাড়: ৳${discount}`,
  });
});

// ==================== REVIEWS & COMPLAINTS ====================

// Get Reviews
apiRouter.get('/reviews', (req, res) => {
  const { productId } = req.query;
  const reviews = db.getReviews(productId ? String(productId) : undefined);
  res.json({ reviews });
});

// Submit Product Review
apiRouter.post('/reviews', (req, res) => {
  const { productId, userName, rating, commentBn } = req.body;
  if (!productId || !userName || !rating || !commentBn) {
    return res.status(400).json({ error: 'সকল তথ্য প্রদান করুন।' });
  }

  // Check verified purchase
  const authHeader = req.headers.authorization;
  let isVerified = false;
  let userId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = verifySessionToken(authHeader.split(' ')[1]);
    if (session) {
      userId = session.userId;
      const userOrders = db.getOrdersByUserId(session.userId);
      isVerified = userOrders.some(
        (o) => o.status === 'Delivered' && o.items.some((i) => i.productId === productId)
      );
    }
  }

  const review = db.addReview({
    productId,
    userId,
    userName,
    rating: Number(rating),
    commentBn,
    verifiedPurchase: isVerified,
  });

  res.status(201).json({
    message: 'আপনার মূল্যবান মতামতের জন্য ধন্যবাদ!',
    review,
  });
});

// Submit Customer Complaint / Return Request
apiRouter.post('/complaints', (req, res) => {
  const { orderNumber, customerName, customerPhone, issueType, description, refundRequested, refundAmount } =
    req.body;

  if (!orderNumber || !customerName || !customerPhone || !description) {
    return res.status(400).json({ error: 'সকল ঘর পূরণ করুন।' });
  }

  const complaint = db.addComplaint({
    orderNumber,
    customerName,
    customerPhone,
    issueType: issueType || 'quality',
    description,
    refundRequested: Boolean(refundRequested),
    refundAmount: refundAmount ? Number(refundAmount) : undefined,
  });

  res.status(201).json({
    message: 'আপনার অভিযোগ সফলভাবে নিবন্ধিত হয়েছে। আমাদের কাস্টমার সাপোর্ট দ্রুত সমাধান করবে।',
    complaint,
  });
});

// Verify Payment Simulator
apiRouter.post('/payments/verify-test', (req, res) => {
  const { method, phone, amount } = req.body;
  if (!phone || !amount) {
    return res.status(400).json({ error: 'ফোন নম্বর এবং টাকার পরিমাণ আবশ্যক।' });
  }

  // Generate verified test TrxID
  const trxId = `${method.toUpperCase()}${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  res.json({
    success: true,
    trxId,
    amount,
    message: `${method.toUpperCase()} পেমেন্ট ভেরিফিকেশন সফল হয়েছে।`,
  });
});

// Settings & Contact Info
apiRouter.get('/settings', (req, res) => {
  res.json({ settings: db.getSettings() });
});

// ==================== PROTECTED ADMIN API ====================

// Admin Dashboard Overview Statistics
apiRouter.get('/admin/stats', requireAdmin, (req, res) => {
  const orders = db.getOrders();
  const products = db.getProducts();
  const users = db.getUsers().filter((u) => u.role === 'customer');
  const complaints = db.getComplaints();

  const totalSales = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = orders
    .filter((o) => o.status !== 'Cancelled' && o.createdAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const pendingComplaints = complaints.filter((c) => c.status === 'under_review').length;

  res.json({
    stats: {
      totalSales,
      todaySales,
      totalOrders: orders.length,
      pendingOrders,
      deliveredOrders,
      totalCustomers: users.length,
      totalProducts: products.length,
      lowStockCount,
      pendingComplaints,
    },
    recentOrders: orders.slice(0, 8),
  });
});

// Admin Orders List & Filter
apiRouter.get('/admin/orders', requireAdmin, (req, res) => {
  const { status, search } = req.query;
  let orders = db.getOrders();

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }

  res.json({ orders });
});

// Admin Update Order Status
apiRouter.put('/admin/orders/:id/status', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const adminUser = db.getUserById(session.userId);
  const adminName = adminUser ? adminUser.name : 'অ্যাডমিন';

  const { status, internalNotes, courierName, trackingId, timelineNoteBn } = req.body;
  if (!status) return res.status(400).json({ error: 'স্ট্যাটাস দিন।' });

  const updated = db.updateOrderStatus(req.params.id, status, adminName, {
    internal: internalNotes,
    courier: courierName,
    trackingId,
    timelineNoteBn,
  });

  if (!updated) return res.status(404).json({ error: 'অর্ডার পাওয়া যায়নি।' });
  res.json({ message: 'অর্ডার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।', order: updated });
});

// Admin Products CRUD
apiRouter.post('/admin/products', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const productData: Product = {
    ...req.body,
    id: `prod-${Date.now()}`,
    createdAt: new Date().toISOString(),
    rating: 5.0,
    reviewCount: 0,
  };

  const created = db.addProduct(productData, adminName);
  res.status(201).json({ message: 'নতুন পণ্য তৈরি হয়েছে।', product: created });
});

apiRouter.put('/admin/products/:id', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const updated = db.updateProduct(req.params.id, req.body, adminName);
  if (!updated) return res.status(404).json({ error: 'পণ্য পাওয়া যায়নি।' });
  res.json({ message: 'পণ্য সফলভাবে আপডেট করা হয়েছে।', product: updated });
});

apiRouter.delete('/admin/products/:id', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const ok = db.deleteProduct(req.params.id, adminName);
  if (!ok) return res.status(404).json({ error: 'পণ্য পাওয়া যায়নি।' });
  res.json({ message: 'পণ্য মুছে ফেলা হয়েছে।' });
});

// Admin Review Moderation
apiRouter.get('/admin/reviews', requireAdmin, (req, res) => {
  res.json({ reviews: db.getReviews() });
});

apiRouter.put('/admin/reviews/:id', requireAdmin, (req, res) => {
  const { status, adminReply } = req.body;
  const updated = db.updateReviewStatus(req.params.id, status, adminReply);
  if (!updated) return res.status(404).json({ error: 'রিভিউ পাওয়া যায়নি।' });
  res.json({ message: 'রিভিউ স্ট্যাটাস আপডেট হয়েছে।', review: updated });
});

// Admin Complaints Moderation
apiRouter.get('/admin/complaints', requireAdmin, (req, res) => {
  res.json({ complaints: db.getComplaints() });
});

apiRouter.put('/admin/complaints/:id', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const { status, resolutionNotes } = req.body;
  const updated = db.updateComplaintStatus(req.params.id, status, resolutionNotes, adminName);
  if (!updated) return res.status(404).json({ error: 'অভিযোগ পাওয়া যায়নি।' });
  res.json({ message: 'অভিযোগ আপডেট হয়েছে।', complaint: updated });
});

// Admin Coupons
apiRouter.get('/admin/coupons', requireAdmin, (req, res) => {
  res.json({ coupons: db.getCoupons() });
});

apiRouter.post('/admin/coupons', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const coupon = {
    ...req.body,
    id: `coup-${Date.now()}`,
    usedCount: 0,
    isActive: true,
  };
  const created = db.addCoupon(coupon, adminName);
  res.status(201).json({ message: 'কুপন সফলভাবে তৈরি হয়েছে।', coupon: created });
});

apiRouter.delete('/admin/coupons/:id', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const ok = db.deleteCoupon(req.params.id, adminName);
  if (!ok) return res.status(404).json({ error: 'কুপন পাওয়া যায়নি।' });
  res.json({ message: 'কুপন মুছে ফেলা হয়েছে।' });
});

// Admin Customers
apiRouter.get('/admin/customers', requireAdmin, (req, res) => {
  const customers = db
    .getUsers()
    .filter((u) => u.role === 'customer')
    .map(({ passwordHash, salt, ...safe }) => {
      const orders = db.getOrdersByUserId(safe.id);
      const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
      return {
        ...safe,
        ordersCount: orders.length,
        totalSpent,
      };
    });
  res.json({ customers });
});

// Admin Notifications
apiRouter.get('/admin/notifications', requireAdmin, (req, res) => {
  res.json({ notifications: db.getNotifications() });
});

apiRouter.put('/admin/notifications/:id/read', requireAdmin, (req, res) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ message: 'নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে।' });
});

apiRouter.put('/admin/notifications/read-all', requireAdmin, (req, res) => {
  db.markAllNotificationsAsRead();
  res.json({ message: 'সকল নোটিফিকেশন পঠিত হয়েছে।' });
});

// Real-Time Notification Stream (SSE)
apiRouter.get('/admin/notifications/stream', (req, res) => {
  // Check auth via query param for EventSource compatibility
  const token = (req.query.token as string) || '';
  const session = verifySessionToken(token);
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    return res.status(403).json({ error: 'অনুমোদনহীন অ্যাক্সেস।' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection ping
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  const unsubscribe = subscribeToNotifications((notif) => {
    res.write(`data: ${JSON.stringify(notif)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req, res) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

// Admin Settings
apiRouter.get('/admin/settings', requireAdmin, (req, res) => {
  res.json({ settings: db.getSettings() });
});

apiRouter.put('/admin/settings', requireAdmin, (req, res) => {
  const session = (req as any).admin;
  const admin = db.getUserById(session.userId);
  const adminName = admin ? admin.name : 'অ্যাডমিন';

  const updated = db.updateSettings(req.body, adminName);
  res.json({ message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।', settings: updated });
});
