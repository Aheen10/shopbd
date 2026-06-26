'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import { ordersAPI, productsAPI, settingsAPI, returnsAPI, couponsAPI, flashSaleAPI } from '../lib/api';

const EMPTY_PRODUCT = {
  name: '', description: '', price: '', oldPrice: '',
  category: 'kitchen', emoji: '📦', stock: '', specifications: ''
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_BADGES = [
  { emoji: '🚚', title: 'Fast Delivery', subtitle: 'Free shipping over ৳2000' },
  { emoji: '✅', title: 'Quality Products', subtitle: 'Verified & authenticated' },
  { emoji: '📞', title: 'Customer Support', subtitle: '9am to 9pm daily' },
  { emoji: '💳', title: 'Secure Payment', subtitle: 'bKash, Nagad & COD' },
];

const BG_GRADIENTS = [
  'from-orange-600 to-red-600', 'from-blue-600 to-purple-600',
  'from-green-600 to-teal-600', 'from-pink-600 to-rose-600', 'from-yellow-500 to-orange-500',
];

export default function AdminPage() {
  const { user } = useStore();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(['kitchen', 'home', 'bedroom', 'bathroom', 'cleaning']);
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [trustBadges, setTrustBadges] = useState<any[]>(DEFAULT_BADGES);
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [showFlashSaleModal, setShowFlashSaleModal] = useState(false);
  const [flashSaleForm, setFlashSaleForm] = useState({ title: '', startTime: '', endTime: '' });
  const [selectedFlashSale, setSelectedFlashSale] = useState<any>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [flashSaleItemForm, setFlashSaleItemForm] = useState({ productId: '', discountType: 'percentage', discountValue: '' });
  const [savingFlashSale, setSavingFlashSale] = useState(false);
  const [insideDhakaCharge, setInsideDhakaCharge] = useState(60);
  const [outsideDhakaCharge, setOutsideDhakaCharge] = useState(120);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(10000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true});
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: '', value: '', price: '', stock: '0', sku: '' });
  const [editingProductVariants, setEditingProductVariants] = useState<any[]>([]);
  const [bannerImageFiles, setBannerImageFiles] = useState<{ [key: number]: File }>({});
  const bannerFileRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    const userStr = localStorage.getItem('shopbd_user');
    if (!token || !userStr) { router.push('/login'); return; }
    const u = JSON.parse(userStr);
    if (u.role !== 'admin') { router.push('/'); return; }
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, returnsRes] = await Promise.all([
        ordersAPI.allOrders(),
        productsAPI.getAll({ page: 1 }),
        returnsAPI.allReturns(),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data.products);
      setReturns(returnsRes.data);
      const productCats = [...new Set(productsRes.data.products.map((p: any) => p.category))];
      setCategories([...new Set([...categories, ...productCats])] as string[]);
      const couponRes = await couponsAPI.adminGetAll();
      setCoupons(couponRes.data);
      const flashSalesRes = await flashSaleAPI.adminGetAll();
      setFlashSales(flashSalesRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSiteSettings(res.data);
      setBanners(res.data.banners || []);
      setTrustBadges(res.data.trustBadges || DEFAULT_BADGES);
      setShippingPolicy(res.data.shippingPolicy || '');
      setReturnPolicy(res.data.returnPolicy || '');
      setInsideDhakaCharge(res.data.insideDhakaCharge ?? 60);
      setOutsideDhakaCharge(res.data.outsideDhakaCharge ?? 120);
      setFreeDeliveryAbove(res.data.freeDeliveryAbove ?? 10000);
    } catch (err) {}
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updatedBanners = [...banners];
      for (const [indexStr, file] of Object.entries(bannerImageFiles)) {
        const index = parseInt(indexStr);
        const res = await settingsAPI.uploadBannerImage(file);
        updatedBanners[index] = { ...updatedBanners[index], imageUrl: res.data.imageUrl };
      }
      await settingsAPI.update({ banners: updatedBanners, trustBadges, shippingPolicy, returnPolicy, insideDhakaCharge, outsideDhakaCharge, freeDeliveryAbove });
      setBanners(updatedBanners);
      setBannerImageFiles({});
      toast.success('Homepage updated! ✅');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const addBanner = () => setBanners([...banners, { title: 'New Banner', subtitle: 'Banner subtitle', emoji: '🎉', bg: 'from-orange-600 to-red-600', imageUrl: null, link: '/' }]);
  const removeBanner = (index: number) => setBanners(banners.filter((_, i) => i !== index));
  const updateBanner = (index: number, field: string, value: string) => { const updated = [...banners]; updated[index] = { ...updated[index], [field]: value }; setBanners(updated); };
  const updateBadge = (index: number, field: string, value: string) => { const updated = [...trustBadges]; updated[index] = { ...updated[index], [field]: value }; setTrustBadges(updated); };

  const getMonthlySalesData = () => MONTHS.map((month, i) => {
    const monthOrders = orders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === selectedYear && d.getMonth() === i;
    });
    return { month, orders: monthOrders.length, revenue: monthOrders.reduce((s: number, o: any) => s + o.total, 0), customers: new Set(monthOrders.map((o: any) => o.userId)).size };
  });

  const downloadSalesReport = () => {
    const doc = new jsPDF();
    const data = getMonthlySalesData();
    doc.setFillColor(255, 107, 53); doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('ShopBD - Sales Report', 14, 20); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Year: ${selectedYear}`, 14, 28);
    const totalRev = data.reduce((s, d) => s + d.revenue, 0);
    doc.setTextColor(50, 50, 50); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(`Total Revenue: Tk ${totalRev.toLocaleString()}`, 14, 48);
    doc.text(`Total Orders: ${data.reduce((s, d) => s + d.orders, 0)}`, 14, 56);
    let y = 70;
    doc.setFillColor(255, 107, 53); doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Month', 16, y + 5.5); doc.text('Orders', 65, y + 5.5); doc.text('Customers', 100, y + 5.5); doc.text('Revenue (Tk)', 145, y + 5.5);
    y += 10;
    data.forEach((row, i) => {
      if (i % 2 === 0) { doc.setFillColor(255, 248, 245); doc.rect(14, y - 2, 182, 9, 'F'); }
      doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(row.month, 16, y + 4); doc.text(String(row.orders), 65, y + 4); doc.text(String(row.customers), 100, y + 4); doc.text(`Tk ${row.revenue.toLocaleString()}`, 145, y + 4);
      y += 10;
    });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 107, 53);
    doc.text(`Annual Total: Tk ${totalRev.toLocaleString()}`, 14, y + 10);
    doc.save(`ShopBD-Sales-Report-${selectedYear}.pdf`);
    toast.success('Sales report downloaded! 📊');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setImageFiles([]);
    setEditingProductVariants([]);
    setShowProductModal(false);
    setTimeout(() => setShowProductModal(true), 0);
  };
  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description || '', price: p.price, oldPrice: p.oldPrice || '', category: p.category, emoji: p.emoji, stock: p.stock, specifications: p.specifications || '' });
    setImageFiles([]);
    setShowProductModal(true);
    // Fetch variants
    productsAPI.getVariants(p.id).then(res => setEditingProductVariants(res.data)).catch(() => {});
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.stock) { toast.error('Name, price and stock are required'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(productForm).forEach(([k, v]) => { if (v !== '') formData.append(k, String(v)); });
      imageFiles.forEach(file => formData.append('images', file));
      if (editingProduct) { await productsAPI.update(editingProduct.id, formData); toast.success('Product updated! ✅'); }
      else { await productsAPI.create(formData); toast.success('Product added! ✅'); }
      setShowProductModal(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save product'); }
    finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try { await productsAPI.delete(id); toast.success('Product deleted'); fetchData(); }
    catch (err) { toast.error('Failed to delete product'); }
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    try { await ordersAPI.updateStatus(id, status); toast.success('Order status updated!'); fetchData(); }
    catch (err) { toast.error('Failed to update status'); }
  };

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0);
  const lowStockProducts = products.filter((p: any) => p.stock <= 5);
  const warningProducts = products.filter((p: any) => p.stock > 5 && p.stock <= 10);

  const customersMap = new Map();
  orders.forEach((o: any) => {
    if (o.user) {
      const existing = customersMap.get(o.userId);
      const phone = o.user.phone || o.deliveryPhone || existing?.phone || null;
      customersMap.set(o.userId, { ...o.user, userId: o.userId, phone });
    }
  });
  const allCustomers = Array.from(customersMap.values());
  const filteredCustomers = allCustomers.filter((c: any) => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.email?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch));
  const filteredOrders = orders.filter((o: any) => !orderSearch || o.uniqueId?.toLowerCase().includes(orderSearch.toLowerCase()) || o.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) || o.user?.phone?.includes(orderSearch) || o.user?.email?.toLowerCase().includes(orderSearch.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cod_pending': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600';
  };

  const monthlySalesData = getMonthlySalesData();
  const maxRevenue = Math.max(...monthlySalesData.map(d => d.revenue), 1);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-orange-500 text-xl animate-pulse">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Admin <span className="text-orange-500">Dashboard</span></h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name} ⚙️</p>
          </div>
          {lowStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold animate-pulse">
              🔔 {lowStockProducts.length} Low Stock Alert!
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: `৳${totalRevenue.toLocaleString()}`, color: 'text-orange-500' },
            { label: 'Total Orders', value: orders.length, color: 'text-yellow-500' },
            { label: 'Customers', value: allCustomers.length, color: 'text-green-500' },
            { label: 'Low Stock', value: lowStockProducts.length, color: 'text-red-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['dashboard', 'orders', 'products', 'customers', 'reports', 'homepage', 'returns','coupons','flashsale'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-500 hover:text-orange-500'}`}>
              {tab === 'dashboard' && '📊 '}
              {tab === 'orders' && '📦 '}
              {tab === 'products' && '🏪 '}
              {tab === 'customers' && '👥 '}
              {tab === 'reports' && '📈 '}
              {tab === 'homepage' && '🏠 '}
              {tab === 'returns' && '🔄 '}
              {tab === 'coupons' && '🎟️ '}
              {tab === 'flashsale' && '⚡ '}
              {tab === 'flashsale' ? 'Flash Sale' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {(lowStockProducts.length > 0 || warningProducts.length > 0) && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">🔔 Stock Alerts</h2>
                <div className="space-y-2">
                  {lowStockProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3"><span className="text-2xl">{p.emoji}</span><span className="text-sm font-medium">{p.name}</span></div>
                      <div className="flex items-center gap-3"><span className="text-red-500 font-bold text-sm">Only {p.stock} left!</span><span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">CRITICAL</span></div>
                    </div>
                  ))}
                  {warningProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3"><span className="text-2xl">{p.emoji}</span><span className="text-sm font-medium">{p.name}</span></div>
                      <div className="flex items-center gap-3"><span className="text-yellow-600 font-bold text-sm">{p.stock} remaining</span><span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full font-bold">WARNING</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">📦 Recent Orders</h2>
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left pb-3">Order ID</th><th className="text-left pb-3">Customer</th><th className="text-left pb-3">Amount</th><th className="text-left pb-3">Status</th><th className="text-left pb-3">Date</th></tr></thead>
                <tbody>
                  {orders.slice(0, 5).map((order: any) => (
                    <tr key={order.id} onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                      className="border-b border-gray-50 hover:bg-orange-50 cursor-pointer transition">
                      <td className="py-3 text-orange-500 font-bold">{order.uniqueId || `#${order.id}`}</td>
                      <td className="py-3"><div className="font-medium">{order.user?.name || 'N/A'}</div><div className="text-gray-400 text-xs">{order.user?.phone || order.deliveryPhone || order.user?.email}</div></td>
                      <td className="py-3 font-bold">৳{order.total.toLocaleString()}</td>
                      <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span></td>
                      <td className="py-3 text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">📦 All Orders ({orders.length})</h2>
              <input type="text" placeholder="🔍 Search by ID, name, phone..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 w-64" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left pb-3">Order ID</th><th className="text-left pb-3">Customer</th><th className="text-left pb-3">Address</th><th className="text-left pb-3">Items</th><th className="text-left pb-3">Amount</th><th className="text-left pb-3">Status</th><th className="text-left pb-3">Payment</th><th className="text-left pb-3">Update</th><th className="text-left pb-3">Date</th></tr></thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id}
                      onClick={(e) => { if ((e.target as HTMLElement).tagName !== 'SELECT') { setSelectedOrder(order); setShowOrderModal(true); } }}
                      className="border-b border-gray-50 hover:bg-orange-50 cursor-pointer transition">
                      <td className="py-3 text-orange-500 font-bold">{order.uniqueId || `#${order.id}`}</td>
                      <td className="py-3">
                        <div className="font-medium">{order.user?.name || 'N/A'}</div>
                        <div className="text-gray-400 text-xs">{order.user?.phone || order.deliveryPhone || '-'}</div>
                        <div className="text-gray-400 text-xs">{order.user?.email}</div>
                      </td>
                      <td className="py-3">
                        {order.deliveryAddress ? (
                          <div className="text-xs text-gray-500">
                            <div className="font-medium text-gray-700">{order.deliveryAddress.thana}, {order.deliveryAddress.district}</div>
                            <div className="text-gray-400 truncate max-w-32">{order.deliveryAddress.fullAddress}</div>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="py-3 text-gray-500">{order.orderItems?.length} items</td>
                      <td className="py-3 font-bold">৳{order.total.toLocaleString()}</td>
                      <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span></td>
                      <td className="py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus === 'paid' ? '✅ Paid' : '💵 COD'}</span></td>
                      <td className="py-3" onClick={e => e.stopPropagation()}>
                        <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500">
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="py-3 text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">🏪 Products ({products.length})</h2>
              <button onClick={openAddModal} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">➕ Add Product</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left pb-3">Product</th><th className="text-left pb-3">Category</th><th className="text-left pb-3">Price</th><th className="text-left pb-3">Stock</th><th className="text-left pb-3">Status</th><th className="text-left pb-3">Actions</th></tr></thead>
                <tbody>
                  {products.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {p.imageUrl ? <img src={`http://localhost:5000${p.imageUrl}`} className="w-10 h-10 rounded-lg object-cover" /> : <span className="text-xl">{p.emoji}</span>}
                          <div><div className="font-medium">{p.name}</div><div className="text-gray-400 text-xs line-clamp-1">{p.description}</div></div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 capitalize">{p.category}</td>
                      <td className="py-3"><div className="font-bold text-orange-500">৳{p.price.toLocaleString()}</div>{p.oldPrice && <div className="text-gray-400 text-xs line-through">৳{p.oldPrice.toLocaleString()}</div>}</td>
                      <td className="py-3 font-bold">{p.stock}</td>
                      <td className="py-3">
                        {p.stock === 0 ? <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">OUT OF STOCK</span>
                          : p.stock <= 5 ? <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">CRITICAL</span>
                          : p.stock <= 10 ? <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full font-bold">WARNING</span>
                          : <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-bold">IN STOCK</span>}
                      </td>
                      <td className="py-3"><div className="flex gap-2"><button onClick={() => openEditModal(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg transition">✏️ Edit</button><button onClick={() => handleDeleteProduct(p.id)} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition">🗑️ Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">👥 Customers ({allCustomers.length})</h2>
              <input type="text" placeholder="🔍 Search by name, phone, email..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 w-64" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left pb-3">Name</th><th className="text-left pb-3">Phone</th><th className="text-left pb-3">Email</th><th className="text-left pb-3">Orders</th><th className="text-left pb-3">Total Spent</th><th className="text-left pb-3"></th></tr></thead>
                <tbody>
                  {filteredCustomers.map((customer: any, i) => {
                    const customerOrders = orders.filter((o: any) => o.userId === customer.userId);
                    const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + o.total, 0);
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-orange-50 cursor-pointer transition" onClick={() => { setSelectedCustomer(customer); setShowCustomerModal(true); }}>
                        <td className="py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">{customer?.name?.[0]?.toUpperCase()}</div><span className="font-medium">{customer?.name}</span></div></td>
                        <td className="py-3 text-gray-700 font-medium">{customer?.phone || '-'}</td>
                        <td className="py-3 text-gray-500">{customer?.email || '-'}</td>
                        <td className="py-3 font-bold">{customerOrders.length}</td>
                        <td className="py-3 font-bold text-orange-500">৳{totalSpent.toLocaleString()}</td>
                        <td className="py-3 text-gray-300 text-lg">›</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">📈 Yearly Sales Report</h2>
                <div className="flex items-center gap-3">
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={downloadSalesReport} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">📄 Download PDF</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Revenue', value: `৳${monthlySalesData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}`, color: 'text-orange-500' },
                  { label: 'Total Orders', value: monthlySalesData.reduce((s, d) => s + d.orders, 0), color: 'text-blue-500' },
                  { label: 'Total Customers', value: monthlySalesData.reduce((s, d) => s + d.customers, 0), color: 'text-green-500' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-600 mb-4">Revenue by Month</h3>
                <div className="flex items-end gap-2 h-40">
                  {monthlySalesData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 font-bold">{d.revenue > 0 ? `৳${(d.revenue / 1000).toFixed(1)}k` : ''}</span>
                      <div className="w-full bg-orange-500 rounded-t-lg hover:bg-orange-400 relative group" style={{ height: `${(d.revenue / maxRevenue) * 120}px`, minHeight: d.revenue > 0 ? '4px' : '0' }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">{d.orders} orders</div>
                      </div>
                      <span className="text-xs text-gray-400">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left pb-3">Month</th><th className="text-left pb-3">Orders</th><th className="text-left pb-3">Customers</th><th className="text-left pb-3">Revenue</th></tr></thead>
                <tbody>
                  {monthlySalesData.map((d, i) => (
                    <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${d.orders === 0 ? 'opacity-40' : ''}`}>
                      <td className="py-3 font-medium">{d.month} {selectedYear}</td>
                      <td className="py-3">{d.orders}</td>
                      <td className="py-3">{d.customers}</td>
                      <td className="py-3 font-bold text-orange-500">৳{d.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Homepage */}
        {activeTab === 'homepage' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">🖼️ Banner Slider</h2>
                <button onClick={addBanner} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">➕ Add Banner</button>
              </div>
              <div className="space-y-4">
                {banners.map((banner: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-600">Banner {i + 1}</span>
                      <button onClick={() => removeBanner(i)} className="text-red-400 hover:text-red-600 text-xs font-bold">🗑️ Remove</button>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-medium block mb-1">Banner Image</label>
                      <input type="file" accept="image/*" ref={el => bannerFileRefs.current[i] = el}
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) setBannerImageFiles({ ...bannerImageFiles, [i]: file }); }} className="hidden" />
                      <div className="flex gap-3 items-center">
                        <button onClick={() => bannerFileRefs.current[i]?.click()}
                          className="flex-1 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-orange-500 hover:text-orange-500 transition text-center">
                          {bannerImageFiles[i] ? `✅ ${bannerImageFiles[i].name}` : banner.imageUrl ? '✅ Image uploaded' : '📷 Upload ad image'}
                        </button>
                        {(banner.imageUrl || bannerImageFiles[i]) && (
                          <img src={bannerImageFiles[i] ? URL.createObjectURL(bannerImageFiles[i]) : `http://localhost:5000${banner.imageUrl}`} className="w-20 h-12 object-cover rounded-lg border border-gray-200" />
                        )}
                      </div>
                      {banner.imageUrl && !bannerImageFiles[i] && (
                        <button onClick={() => updateBanner(i, 'imageUrl', '')} className="text-xs text-red-400 hover:text-red-600 mt-1">✕ Remove image</button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-gray-500 text-xs font-medium block mb-1">Title</label><input type="text" value={banner.title || ''} onChange={(e) => updateBanner(i, 'title', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" /></div>
                      <div><label className="text-gray-500 text-xs font-medium block mb-1">Subtitle</label><input type="text" value={banner.subtitle || ''} onChange={(e) => updateBanner(i, 'subtitle', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-gray-500 text-xs font-medium block mb-1">Link</label><input type="text" value={banner.link || '/'} onChange={(e) => updateBanner(i, 'link', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" /></div>
                      <div><label className="text-gray-500 text-xs font-medium block mb-1">Background</label>
                        <select value={banner.bg || 'from-orange-600 to-red-600'} onChange={(e) => updateBanner(i, 'bg', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                          {BG_GRADIENTS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">✅ Trust Badges</h2>
              <div className="grid grid-cols-2 gap-4">
                {trustBadges.map((badge: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-gray-500 text-xs font-medium block mb-1">Emoji</label><input type="text" value={badge.emoji} onChange={(e) => updateBadge(i, 'emoji', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" /></div>
                      <div className="col-span-2"><label className="text-gray-500 text-xs font-medium block mb-1">Title</label><input type="text" value={badge.title} onChange={(e) => updateBadge(i, 'title', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" /></div>
                    </div>
                    <div><label className="text-gray-500 text-xs font-medium block mb-1">Subtitle</label><input type="text" value={badge.subtitle} onChange={(e) => updateBadge(i, 'subtitle', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">🚚 Shipping & Return Policy</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">🚚 Delivery Policy (প্রতিটা line আলাদা point হবে)</label>
                  <textarea value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} rows={5}
                    placeholder="Inside Dhaka: Delivery within 24-48 hours. Charge: ৳60\nOutside Dhaka: Delivery within 3-5 days. Charge: ৳120\nFree delivery on orders above ৳2,000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none" />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">↩️ Return Policy (প্রতিটা line আলাদা point হবে)</label>
                  <textarea value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} rows={5}
                    placeholder="Returns accepted within 7 days of delivery\nProduct must be in original condition\nReturn shipping fees apply unless product is defective"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none" />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">💰 Delivery Charges</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">📍 Inside Dhaka (৳)</label>
                  <input type="number" value={insideDhakaCharge} onChange={(e) => setInsideDhakaCharge(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">🚚 Outside Dhaka (৳)</label>
                  <input type="number" value={outsideDhakaCharge} onChange={(e) => setOutsideDhakaCharge(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">🎁 Free Delivery Above (৳)</label>
                  <input type="number" value={freeDeliveryAbove} onChange={(e) => setFreeDeliveryAbove(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-blue-600 text-xs font-medium">💡 অর্ডার total এই amount এর বেশি হলে free delivery হবে। District "Dhaka" হলে inside charge, অন্য সব district এ outside charge apply হবে।</p>
              </div>
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl transition text-lg">
              {savingSettings ? 'Saving...' : '💾 Save Homepage Settings'}
            </button>
          </div>
        )}

        {/* Returns */}
        {activeTab === 'returns' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">🔄 Return Requests ({returns.length})</h2>
            </div>
            {returns.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🔄</div>
                <p>No return requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {returns.map((ret: any) => (
                  <div key={ret.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-orange-500 font-black text-sm">{ret.order?.uniqueId || `#${ret.orderId}`}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ret.status === 'approved' ? 'bg-green-100 text-green-700' : ret.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {ret.status === 'pending' ? '⏳ Pending' : ret.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          </span>
                          <span className="text-gray-400 text-xs">{new Date(ret.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-black">{ret.user?.name?.[0]?.toUpperCase()}</div>
                          <span className="text-sm font-medium text-gray-700">{ret.user?.name}</span>
                          <span className="text-gray-400 text-xs">{ret.user?.phone || ret.user?.email}</span>
                        </div>
                        <p className="text-gray-500 text-sm"><span className="font-semibold text-gray-700">Reason:</span> {ret.reason}</p>
                        {ret.adminNote && (
                          <p className="text-gray-400 text-xs mt-1 bg-gray-50 rounded-lg px-3 py-1.5">
                            <span className="text-orange-500 font-semibold">Your Note:</span> {ret.adminNote}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {ret.order?.orderItems?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                              {item.product?.imageUrl ? <img src={`http://localhost:5000${item.product.imageUrl}`} className="w-5 h-5 rounded object-cover" /> : <span className="text-xs">{item.product?.emoji}</span>}
                              <span className="text-xs text-gray-600">{item.product?.name}</span>
                              <span className="text-xs text-gray-400">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {ret.status === 'pending' && (
                        <button onClick={() => { setSelectedReturn(ret); setShowReturnModal(true); setReturnNote(''); }}
                          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex-shrink-0">
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>{/* ← closes max-w-7xl mx-auto */}

      {/* Coupons */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">🎟️ Coupon Management ({coupons.length})</h2>
              <button onClick={() => setShowCouponModal(true)}
                className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
                ➕ Create Coupon
              </button>
            </div>

            {coupons.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🎟️</div>
                <p>No coupons yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-3">Code</th>
                      <th className="text-left pb-3">Type</th>
                      <th className="text-left pb-3">Value</th>
                      <th className="text-left pb-3">Min Order</th>
                      <th className="text-left pb-3">Uses</th>
                      <th className="text-left pb-3">Expires</th>
                      <th className="text-left pb-3">Status</th>
                      <th className="text-left pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon: any) => (
                      <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-black text-orange-500">{coupon.code}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {coupon.type === 'percentage' ? '% Off' : '৳ Off'}
                          </span>
                        </td>
                        <td className="py-3 font-bold">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                        </td>
                        <td className="py-3 text-gray-500">৳{coupon.minOrderAmount}</td>
                        <td className="py-3 text-gray-500">
                          {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''}
                        </td>
                        <td className="py-3 text-gray-500">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No expiry'}
                        </td>
                        <td className="py-3">
                          <button onClick={async () => {
                            await couponsAPI.adminUpdate(coupon.id, { isActive: !coupon.isActive });
                            fetchData();
                            toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}!`);
                          }}
                            className={`px-2 py-1 rounded-full text-xs font-bold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {coupon.isActive ? '✅ Active' : '⏸ Inactive'}
                          </button>
                        </td>
                        <td className="py-3">
                          <button onClick={async () => {
                            if (!confirm('Delete this coupon?')) return;
                            await couponsAPI.adminDelete(coupon.id);
                            toast.success('Coupon deleted');
                            fetchData();
                          }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flash Sale */}
      {activeTab === 'flashsale' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">⚡ Flash Sale Management</h2>
              <button onClick={() => setShowFlashSaleModal(true)}
                className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
                ➕ Create Flash Sale
              </button>
            </div>

            {flashSales.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">⚡</div>
                <p>No flash sales yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flashSales.map((sale: any) => {
                  const now = new Date();
                  const start = new Date(sale.startTime);
                  const end = new Date(sale.endTime);
                  const isActive = sale.isActive && now >= start && now <= end;
                  const isUpcoming = now < start;
                  const isExpired = now > end;

                  return (
                    <div key={sale.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      {/* Sale Header */}
                      <div className={`px-5 py-4 flex items-center justify-between ${isActive ? 'bg-gradient-to-r from-red-50 to-orange-50 border-b border-orange-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>⚡</span>
                          <div>
                            <p className="font-black text-gray-800">{sale.title}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {new Date(sale.startTime).toLocaleString()} → {new Date(sale.endTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isActive ? 'bg-green-100 text-green-700' :
                            isUpcoming ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {isActive ? '🟢 Live' : isUpcoming ? '🔵 Upcoming' : '⚫ Expired'}
                          </span>
                          <button onClick={async () => {
                            await flashSaleAPI.adminUpdate(sale.id, { isActive: !sale.isActive });
                            toast.success(`Flash sale ${sale.isActive ? 'deactivated' : 'activated'}!`);
                            fetchData();
                          }}
                            className={`px-3 py-1 rounded-full text-xs font-bold ${sale.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {sale.isActive ? '✅ Active' : '⏸ Inactive'}
                          </button>
                          <button onClick={() => { setSelectedFlashSale(sale); setShowAddItemModal(true); }}
                            className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                            ➕ Add Product
                          </button>
                          <button onClick={async () => {
                            if (!confirm('Delete this flash sale?')) return;
                            await flashSaleAPI.adminDelete(sale.id);
                            toast.success('Flash sale deleted');
                            fetchData();
                          }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition">
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Sale Items */}
                      {sale.items.length === 0 ? (
                        <div className="px-5 py-4 text-gray-400 text-sm text-center">No products added yet</div>
                      ) : (
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {sale.items.map((item: any) => {
                            const flashPrice = item.discountType === 'percentage'
                              ? Math.round(item.product.price * (1 - item.discountValue / 100))
                              : Math.max(0, item.product.price - item.discountValue);
                            return (
                              <div key={item.id} className="bg-gray-50 rounded-xl p-3 relative">
                                <button onClick={async () => {
                                  if (!confirm('Remove this product?')) return;
                                  await flashSaleAPI.adminRemoveItem(item.id);
                                  toast.success('Product removed');
                                  fetchData();
                                }}
                                  className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                                  ✕
                                </button>
                                <div className="w-full h-20 bg-white rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                                  {item.product.imageUrl
                                    ? <img src={`http://localhost:5000${item.product.imageUrl}`} className="w-full h-full object-cover" />
                                    : <span className="text-3xl">{item.product.emoji}</span>}
                                </div>
                                <p className="text-xs font-semibold text-gray-700 line-clamp-1">{item.product.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-orange-500 font-black text-xs">৳{flashPrice.toLocaleString()}</span>
                                  <span className="text-gray-400 text-xs line-through">৳{item.product.price.toLocaleString()}</span>
                                </div>
                                <span className="inline-block mt-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {item.discountType === 'percentage' ? `${item.discountValue}% OFF` : `৳${item.discountValue} OFF`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Return Review Modal */}
      {showReturnModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReturnModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-black">🔄 Review Return Request</h2>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-700 mb-1">Order: <span className="text-orange-500">{selectedReturn.order?.uniqueId}</span></p>
                <p className="text-sm text-gray-600"><span className="font-semibold">Customer:</span> {selectedReturn.user?.name}</p>
                <p className="text-sm text-gray-600 mt-2"><span className="font-semibold">Reason:</span> {selectedReturn.reason}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-2 block">Admin Note (optional)</label>
                <textarea placeholder="Add a note for the customer..." value={returnNote} onChange={(e) => setReturnNote(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={async () => {
                  try {
                    await returnsAPI.updateStatus(selectedReturn.id, 'approved', returnNote);
                    toast.success('Return request approved! ✅');
                    setShowReturnModal(false);
                    fetchData();
                  } catch { toast.error('Failed to update'); }
                }} className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition text-sm">
                  ✅ Approve
                </button>
                <button onClick={async () => {
                  try {
                    await returnsAPI.updateStatus(selectedReturn.id, 'rejected', returnNote);
                    toast.success('Return request rejected');
                    setShowReturnModal(false);
                    fetchData();
                  } catch { toast.error('Failed to update'); }
                }} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl transition text-sm">
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCouponModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">🎟️ Create Coupon</h2>
              <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Coupon Code *</label>
                <input type="text" placeholder="e.g. SAVE20" value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 font-bold tracking-wider" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">Type *</label>
                  <select value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">
                    Value * {couponForm.type === 'percentage' ? '(%)' : '(৳)'}
                  </label>
                  <input type="number" placeholder={couponForm.type === 'percentage' ? '10' : '100'}
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">Min Order (৳)</label>
                  <input type="number" placeholder="0" value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">Max Uses</label>
                  <input type="number" placeholder="Unlimited" value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Expiry Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="datetime-local" value={couponForm.expiresAt}
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-orange-500" />
                <label htmlFor="isActive" className="text-gray-600 text-sm font-semibold">Active immediately</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={async () => {
                  if (!couponForm.code || !couponForm.value) { toast.error('Code and value are required'); return; }
                  setSavingCoupon(true);
                  try {
                    await couponsAPI.adminCreate({
                      code: couponForm.code,
                      type: couponForm.type,
                      value: parseFloat(couponForm.value),
                      minOrderAmount: parseFloat(couponForm.minOrderAmount) || 0,
                      maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
                      expiresAt: couponForm.expiresAt || null,
                      isActive: couponForm.isActive,
                    });
                    toast.success('Coupon created! 🎟️');
                    setShowCouponModal(false);
                    setCouponForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true });
                    fetchData();
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Failed to create coupon');
                  } finally {
                    setSavingCoupon(false);
                  }
                }} disabled={savingCoupon}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition">
                  {savingCoupon ? 'Creating...' : '🎟️ Create Coupon'}
                </button>
                <button onClick={() => setShowCouponModal(false)}
                  className="px-6 border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flash Sale Create Modal */}
      {showFlashSaleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFlashSaleModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">⚡ Create Flash Sale</h2>
              <button onClick={() => setShowFlashSaleModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Sale Title *</label>
                <input type="text" placeholder="e.g. Eid Special Sale"
                  value={flashSaleForm.title}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Start Time *</label>
                <input type="datetime-local"
                  value={flashSaleForm.startTime}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, startTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">End Time *</label>
                <input type="datetime-local"
                  value={flashSaleForm.endTime}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={async () => {
                  if (!flashSaleForm.title || !flashSaleForm.startTime || !flashSaleForm.endTime) {
                    toast.error('All fields required'); return;
                  }
                  setSavingFlashSale(true);
                  try {
                    await flashSaleAPI.adminCreate({
                      title: flashSaleForm.title,
                      startTime: flashSaleForm.startTime,
                      endTime: flashSaleForm.endTime,
                    });
                    toast.success('Flash sale created! ⚡');
                    setShowFlashSaleModal(false);
                    setFlashSaleForm({ title: '', startTime: '', endTime: '' });
                    fetchData();
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Failed');
                  } finally { setSavingFlashSale(false); }
                }} disabled={savingFlashSale}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition">
                  {savingFlashSale ? 'Creating...' : '⚡ Create'}
                </button>
                <button onClick={() => setShowFlashSaleModal(false)}
                  className="px-6 border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product to Flash Sale Modal */}
      {showAddItemModal && selectedFlashSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddItemModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">➕ Add Product to Flash Sale</h2>
              <button onClick={() => setShowAddItemModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Select Product *</label>
                <select value={flashSaleItemForm.productId}
                  onChange={(e) => setFlashSaleItemForm({ ...flashSaleItemForm, productId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500">
                  <option value="">Select a product...</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} — ৳{p.price.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">Discount Type *</label>
                  <select value={flashSaleItemForm.discountType}
                    onChange={(e) => setFlashSaleItemForm({ ...flashSaleItemForm, discountType: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">
                    Discount Value * {flashSaleItemForm.discountType === 'percentage' ? '(%)' : '(৳)'}
                  </label>
                  <input type="number" placeholder={flashSaleItemForm.discountType === 'percentage' ? '20' : '100'}
                    value={flashSaleItemForm.discountValue}
                    onChange={(e) => setFlashSaleItemForm({ ...flashSaleItemForm, discountValue: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              {flashSaleItemForm.productId && flashSaleItemForm.discountValue && (
                <div className="bg-orange-50 rounded-xl p-3 text-sm">
                  {(() => {
                    const p = products.find((p: any) => p.id === parseInt(flashSaleItemForm.productId)) as any;
                    if (!p) return null;
                    const flashPrice = flashSaleItemForm.discountType === 'percentage'
                      ? Math.round(p.price * (1 - parseFloat(flashSaleItemForm.discountValue) / 100))
                      : Math.max(0, p.price - parseFloat(flashSaleItemForm.discountValue));
                    return (
                      <p className="text-gray-700">
                        Original: <span className="line-through text-gray-400">৳{p.price.toLocaleString()}</span>
                        {' → '}
                        Flash Price: <span className="text-orange-500 font-black">৳{flashPrice.toLocaleString()}</span>
                      </p>
                    );
                  })()}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={async () => {
                  if (!flashSaleItemForm.productId || !flashSaleItemForm.discountValue) {
                    toast.error('All fields required'); return;
                  }
                  try {
                    await flashSaleAPI.adminAddItem(selectedFlashSale.id, {
                      productId: parseInt(flashSaleItemForm.productId),
                      discountType: flashSaleItemForm.discountType,
                      discountValue: parseFloat(flashSaleItemForm.discountValue),
                    });
                    toast.success('Product added to flash sale! ⚡');
                    setFlashSaleItemForm({ productId: '', discountType: 'percentage', discountValue: '' });
                    setShowAddItemModal(false);
                    fetchData();
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Failed');
                  }
                }}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition">
                  ➕ Add Product
                </button>
                <button onClick={() => setShowAddItemModal(false)}
                  className="px-6 border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-black text-orange-500">{selectedOrder.uniqueId || `#${selectedOrder.id}`}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus === 'paid' ? '✅ Paid' : '💵 COD Pending'}</span>
                <button onClick={() => setShowOrderModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-medium mb-2">👤 Customer</p>
                  <p className="font-bold text-gray-800">{selectedOrder.user?.name}</p>
                  <p className="text-gray-500 text-sm mt-1">{selectedOrder.user?.phone || selectedOrder.deliveryPhone || '—'}</p>
                  <p className="text-gray-400 text-xs mt-1">{selectedOrder.user?.email || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-400 text-xs font-medium mb-2">📍 Delivery Address</p>
                  {selectedOrder.deliveryAddress ? (
                    <>
                      <p className="font-bold text-gray-800 text-sm">{selectedOrder.deliveryAddress.name}</p>
                      <p className="text-gray-600 text-sm mt-1">{selectedOrder.deliveryAddress.fullAddress}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {selectedOrder.deliveryAddress.area && `${selectedOrder.deliveryAddress.area}, `}
                        {selectedOrder.deliveryAddress.thana}, {selectedOrder.deliveryAddress.district}
                      </p>
                      <p className="text-orange-500 text-xs font-semibold mt-1">📞 {selectedOrder.deliveryAddress.phone}</p>
                    </>
                  ) : <p className="text-gray-400 text-sm">No address provided</p>}
                </div>
              </div>
              <div>
                <p className="text-gray-700 font-bold mb-3">📦 Order Items ({selectedOrder.orderItems?.length})</p>
                <div className="space-y-2">
                  {selectedOrder.orderItems?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                        {item.product?.imageUrl
                          ? <img src={`http://localhost:5000${item.product.imageUrl}`} className="w-full h-full object-cover" />
                          : <span className="text-2xl">{item.product?.emoji}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{item.product?.name}</p>
                        <p className="text-gray-400 text-xs capitalize">{item.product?.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                        <p className="font-bold text-orange-500 text-sm">৳{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Amount</p>
                  <p className="text-2xl font-black text-orange-500">৳{selectedOrder.total.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs mb-2">Update Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={async (e) => {
                      await handleUpdateOrderStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({ ...selectedOrder, status: e.target.value });
                    }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCustomerModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md">
                  {selectedCustomer?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">{selectedCustomer?.name}</h2>
                  <p className="text-gray-400 text-sm">Customer Profile</p>
                </div>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition">✕</button>
            </div>
            <div className="p-6 space-y-5">
              {(() => {
                const customerOrders = orders.filter((o: any) => o.userId === selectedCustomer.userId);
                const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + o.total, 0);
                const deliveredCount = customerOrders.filter((o: any) => o.status === 'delivered').length;
                const pendingCount = customerOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
                const latestOrderWithPhone = customerOrders.find((o: any) => o.deliveryPhone);
                const latestOrderWithAddress = customerOrders.find((o: any) => o.deliveryAddress);
                const displayPhone = selectedCustomer?.phone || latestOrderWithPhone?.deliveryPhone;
                const deliveryAddress = latestOrderWithAddress?.deliveryAddress;
                return (
                  <>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-400 text-xs font-medium mb-1">📱 Phone</p>
                          <p className="font-bold text-gray-800">{displayPhone || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-400 text-xs font-medium mb-1">📧 Email</p>
                          <p className="font-bold text-gray-800 text-sm break-all">{selectedCustomer?.email || 'Not provided'}</p>
                        </div>
                      </div>
                      {deliveryAddress && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <p className="text-blue-500 text-xs font-bold mb-2">📍 Latest Delivery Address</p>
                          <p className="font-bold text-gray-800 text-sm">{deliveryAddress.name} · {deliveryAddress.phone}</p>
                          <p className="text-gray-600 text-sm mt-1">{deliveryAddress.fullAddress}</p>
                          <p className="text-gray-500 text-xs mt-1">{deliveryAddress.area && `${deliveryAddress.area}, `}{deliveryAddress.thana}, {deliveryAddress.district}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Total Orders', value: customerOrders.length, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'Total Spent', value: `৳${totalSpent.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Delivered', value: deliveredCount, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Pending', value: pendingCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                      ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} rounded-xl p-3 text-center`}>
                          <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3">📦 Order History</h3>
                      {customerOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl"><p className="text-3xl mb-2">📭</p><p className="text-sm">No orders yet</p></div>
                      ) : (
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {customerOrders.map((order: any) => (
                            <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="text-orange-500 font-black text-sm">{order.uniqueId || `#${order.id}`}</span>
                                  <span className="text-gray-400 text-xs ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span>
                                  <span className="font-black text-orange-500 text-sm">৳{order.total.toLocaleString()}</span>
                                </div>
                              </div>
                              {order.deliveryAddress && (
                                <div className="text-xs text-gray-400 mb-2 bg-gray-50 rounded-lg px-3 py-1.5">
                                  📍 {order.deliveryAddress.thana}, {order.deliveryAddress.district} · {order.deliveryPhone || order.deliveryAddress.phone}
                                </div>
                              )}
                              <div className="space-y-1.5">
                                {order.orderItems?.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                                    {item.product?.imageUrl ? <img src={`http://localhost:5000${item.product.imageUrl}`} className="w-6 h-6 rounded object-cover" /> : <span className="text-sm">{item.product?.emoji}</span>}
                                    <span className="flex-1 text-xs text-gray-600 font-medium">{item.product?.name}</span>
                                    <span className="text-xs text-gray-400">×{item.quantity}</span>
                                    <span className="text-xs font-bold text-gray-700">৳{(item.price * item.quantity).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">{editingProduct ? '✏️ Edit Product' : '➕ Add Product'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div><label className="text-gray-600 text-sm font-medium mb-1 block">Product Name *</label><input type="text" placeholder="e.g. Non-Stick Frying Pan" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
              <div><label className="text-gray-600 text-sm font-medium mb-1 block">Description</label><textarea placeholder="Product description..." value={productForm.description} rows={3} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-gray-600 text-sm font-medium mb-1 block">Price (৳) *</label><input type="number" placeholder="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
                <div><label className="text-gray-600 text-sm font-medium mb-1 block">Old Price (৳)</label><input type="number" placeholder="0" value={productForm.oldPrice} onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Category *</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="New category..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500" />
                    <button onClick={() => { if (newCategory.trim()) { setCategories([...categories, newCategory.trim().toLowerCase()]); setProductForm({ ...productForm, category: newCategory.trim().toLowerCase() }); setNewCategory(''); toast.success('Category added!'); } }} className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-400 transition">+ Add</button>
                  </div>
                </div>
                <div><label className="text-gray-600 text-sm font-medium mb-1 block">Stock *</label><input type="number" placeholder="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
              </div>
              <div><label className="text-gray-600 text-sm font-medium mb-1 block">Emoji</label><input type="text" placeholder="📦" value={productForm.emoji} onChange={(e) => setProductForm({ ...productForm, emoji: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Product Images (Max 5) 📷</label>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 5))} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-500 hover:border-orange-500 hover:text-orange-500 transition">
                  {imageFiles.length > 0 ? `✅ ${imageFiles.length} image(s) selected` : '📷 Click to upload images'}
                </button>
                {imageFiles.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {imageFiles.map((f, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                        {i === 0 && <span className="absolute -top-1 -left-1 bg-orange-500 text-white text-xs px-1 rounded-full">Main</span>}
                        <button onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {editingProduct?.images && imageFiles.length === 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-2">Current images:</p>
                    <div className="flex gap-2 flex-wrap">
                      {JSON.parse(editingProduct.images).map((img: string, i: number) => (
                        <img key={i} src={`http://localhost:5000${img}`} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Specifications</label>
                <textarea placeholder={`Size: 42cm x 18cm\nColor: Black\nMaterial: Stainless Steel`} value={productForm.specifications} rows={4} onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                <p className="text-gray-400 text-xs mt-1">প্রতিটা line এ একটা specification লেখো</p>
              </div>
              {/* Variants Section — only show when editing */}
              {editingProduct && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <label className="text-gray-600 text-sm font-bold block">📦 Product Variants</label>

                  {/* Add New Variant Form */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <p className="text-xs font-bold text-orange-600 mb-2">➕ Add New Variant</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Type *</label>
                        <input type="text" placeholder="e.g. Size / Color / Weight"
                          value={newVariant.name}
                          onChange={e => setNewVariant({ ...newVariant, name: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Value *</label>
                        <input type="text" placeholder="e.g. XL / Red / 1kg"
                          value={newVariant.value}
                          onChange={e => setNewVariant({ ...newVariant, value: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Price (৳) <span className="text-gray-400">optional</span></label>
                        <input type="number" placeholder="Default price"
                          value={newVariant.price}
                          onChange={e => setNewVariant({ ...newVariant, price: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Stock *</label>
                        <input type="number" placeholder="0"
                          value={newVariant.stock}
                          onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">SKU <span className="text-gray-400">optional</span></label>
                        <input type="text" placeholder="e.g. SKU-001"
                          value={newVariant.sku}
                          onChange={e => setNewVariant({ ...newVariant, sku: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!newVariant.name || !newVariant.value) { toast.error('Type and value required'); return; }
                        try {
                          await productsAPI.addVariant(editingProduct.id, {
                            name: newVariant.name,
                            value: newVariant.value,
                            price: newVariant.price ? parseFloat(newVariant.price) : null,
                            stock: parseInt(newVariant.stock) || 0,
                            sku: newVariant.sku || null,
                          });
                          toast.success('Variant added! ✅');
                          setNewVariant({ name: '', value: '', price: '', stock: '0', sku: '' });
                          const res = await productsAPI.getVariants(editingProduct.id);
                          setEditingProductVariants(res.data);
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || 'Failed');
                        }
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-2 rounded-lg text-xs transition">
                      ➕ Add Variant
                    </button>
                  </div>

                  {/* Variants Table */}
                  {editingProductVariants.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Type</th>
                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Value</th>
                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Price</th>
                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Stock</th>
                            <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editingProductVariants.map((v: any, idx: number) => (
                            <tr key={v.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 font-semibold text-gray-600">{v.name}</td>
                              <td className="px-3 py-2 font-bold text-gray-800">{v.value}</td>
                              <td className="px-3 py-2 text-orange-500 font-semibold">
                                {v.price ? `৳${v.price}` : <span className="text-gray-400">Default</span>}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  defaultValue={v.stock}
                                  onBlur={async (e) => {
                                    const newStock = parseInt(e.target.value);
                                    if (newStock === v.stock) return;
                                    try {
                                      await productsAPI.updateVariant(editingProduct.id, v.id, { stock: newStock });
                                      toast.success('Stock updated!');
                                      const res = await productsAPI.getVariants(editingProduct.id);
                                      setEditingProductVariants(res.data);
                                    } catch { toast.error('Failed'); }
                                  }}
                                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500 text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Delete "${v.value}"?`)) return;
                                    try {
                                      await productsAPI.deleteVariant(editingProduct.id, v.id);
                                      toast.success('Deleted');
                                      const res = await productsAPI.getVariants(editingProduct.id);
                                      setEditingProductVariants(res.data);
                                    } catch { toast.error('Failed'); }
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold px-2 py-1 rounded-lg transition">
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveProduct} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition">
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button onClick={() => setShowProductModal(false)} className="px-6 border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}