'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { ordersAPI, productsAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

const EMPTY_PRODUCT = {
  name: '', description: '', price: '', oldPrice: '',
  category: 'kitchen', emoji: '📦', stock: '', specifications: ''
};

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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    const userStr = localStorage.getItem('shopbd_user');
    if (!token || !userStr) { router.push('/login'); return; }
    const u = JSON.parse(userStr);
    if (u.role !== 'admin') { router.push('/'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        ordersAPI.allOrders(),
        productsAPI.getAll({ page: 1 }),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data.products);

      // Extract unique categories from products
      const productCats = [...new Set(productsRes.data.products.map((p: any) => p.category))];
      const allCats = [...new Set([...categories, ...productCats])];
      setCategories(allCats as string[]);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setImageFiles([]);
    setShowProductModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      oldPrice: p.oldPrice || '',
      category: p.category,
      emoji: p.emoji,
      stock: p.stock,
      specifications: p.specifications || '',
    });
    setImageFiles([]);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.stock) {
      toast.error('Name, price and stock are required');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(productForm).forEach(([k, v]) => { if (v !== '') formData.append(k, String(v)); });
      imageFiles.forEach(file => formData.append('images', file));

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
        toast.success('Product updated! ✅');
      } else {
        await productsAPI.create(formData);
        toast.success('Product added! ✅');
      }
      setShowProductModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    try {
      await ordersAPI.updateStatus(id, status);
      toast.success('Order status updated!');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const totalRevenue = orders.filter((o: any) => o.status === 'paid').reduce((sum: number, o: any) => sum + o.total, 0);
  const lowStockProducts = products.filter((p: any) => p.stock <= 5);
  const warningProducts = products.filter((p: any) => p.stock > 5 && p.stock <= 10);

  // Get unique customers from orders
  const customersMap = new Map();
  orders.forEach((o: any) => {
    if (o.user && !customersMap.has(o.userId)) {
      customersMap.set(o.userId, { ...o.user, userId: o.userId });
    }
  });
  const allCustomers = Array.from(customersMap.values());

  // Filter customers by search
  const filteredCustomers = allCustomers.filter((c: any) => {
    if (!customerSearch) return true;
    return (
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
    );
  });

  // Filter orders by search
  const filteredOrders = orders.filter((o: any) => {
    if (!orderSearch) return true;
    return (
      o.uniqueId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user?.phone?.includes(orderSearch) ||
      o.user?.email?.toLowerCase().includes(orderSearch.toLowerCase())
    );
  });

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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl animate-pulse">Loading...</div>
    </div>
  );

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
          {['dashboard', 'orders', 'products', 'customers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-500 hover:text-orange-500'
              }`}
            >
              {tab === 'dashboard' && '📊 '}
              {tab === 'orders' && '📦 '}
              {tab === 'products' && '🏪 '}
              {tab === 'customers' && '👥 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {(lowStockProducts.length > 0 || warningProducts.length > 0) && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">🔔 Stock Alerts</h2>
                <div className="space-y-2">
                  {lowStockProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-500 font-bold text-sm">Only {p.stock} left!</span>
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">CRITICAL</span>
                      </div>
                    </div>
                  ))}
                  {warningProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-600 font-bold text-sm">{p.stock} remaining</span>
                        <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full font-bold">WARNING</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">📦 Recent Orders</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-3">Order ID</th>
                    <th className="text-left pb-3">Customer</th>
                    <th className="text-left pb-3">Amount</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order: any) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-orange-500 font-bold">{order.uniqueId || `#${order.id}`}</td>
                      <td className="py-3">
                        <div className="font-medium">{order.user?.name || 'N/A'}</div>
                        <div className="text-gray-400 text-xs">{order.user?.phone || order.user?.email}</div>
                      </td>
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

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">📦 All Orders ({orders.length})</h2>
              <input
                type="text"
                placeholder="🔍 Search by ID, name, phone..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-3">Order ID</th>
                    <th className="text-left pb-3">Customer</th>
                    <th className="text-left pb-3">Items</th>
                    <th className="text-left pb-3">Amount</th>
                    <th className="text-left pb-3">Payment</th>
                    <th className="text-left pb-3">Delivery</th>
                    <th className="text-left pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-orange-500 font-bold">{order.uniqueId || `#${order.id}`}</td>
                      <td className="py-3">
                        <div className="font-medium">{order.user?.name || 'N/A'}</div>
                        <div className="text-gray-400 text-xs">{order.user?.phone}</div>
                        <div className="text-gray-400 text-xs">{order.user?.email}</div>
                      </td>
                      <td className="py-3 text-gray-500">{order.orderItems?.length} items</td>
                      <td className="py-3 font-bold">৳{order.total.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-orange-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="paid">Paid</option>
                          <option value="cod_pending">COD Pending</option>
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

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">🏪 Products ({products.length})</h2>
              <button
                onClick={openAddModal}
                className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition"
              >
                ➕ Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-3">Product</th>
                    <th className="text-left pb-3">Category</th>
                    <th className="text-left pb-3">Price</th>
                    <th className="text-left pb-3">Stock</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {p.imageUrl ? (
                            <img src={`http://localhost:5000${p.imageUrl}`} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <span className="text-xl">{p.emoji}</span>
                          )}
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-gray-400 text-xs line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 capitalize">{p.category}</td>
                      <td className="py-3">
                        <div className="font-bold text-orange-500">৳{p.price.toLocaleString()}</div>
                        {p.oldPrice && <div className="text-gray-400 text-xs line-through">৳{p.oldPrice.toLocaleString()}</div>}
                      </td>
                      <td className="py-3 font-bold">{p.stock}</td>
                      <td className="py-3">
                        {p.stock === 0 ? (
                          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">OUT OF STOCK</span>
                        ) : p.stock <= 5 ? (
                          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold">CRITICAL</span>
                        ) : p.stock <= 10 ? (
                          <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full font-bold">WARNING</span>
                        ) : (
                          <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-bold">IN STOCK</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg transition">✏️ Edit</button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">👥 Customers ({allCustomers.length})</h2>
              <input
                type="text"
                placeholder="🔍 Search by name, phone, email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-3">Name</th>
                    <th className="text-left pb-3">Phone</th>
                    <th className="text-left pb-3">Email</th>
                    <th className="text-left pb-3">Orders</th>
                    <th className="text-left pb-3">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer: any, i) => {
                    const customerOrders = orders.filter((o: any) => o.userId === customer.userId);
                    const totalSpent = customerOrders.reduce((sum: number, o: any) => sum + o.total, 0);
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {customer?.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium">{customer?.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-700 font-medium">{customer?.phone || '-'}</td>
                        <td className="py-3 text-gray-500">{customer?.email || '-'}</td>
                        <td className="py-3 font-bold">{customerOrders.length}</td>
                        <td className="py-3 font-bold text-orange-500">৳{totalSpent.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">{editingProduct ? '✏️ Edit Product' : '➕ Add Product'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Non-Stick Frying Pan"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Description</label>
                <textarea
                  placeholder="Product description..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Price (৳) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Old Price (৳)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.oldPrice}
                    onChange={(e) => setProductForm({ ...productForm, oldPrice: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {/* Add new category */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="New category..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={() => {
                        if (newCategory.trim()) {
                          setCategories([...categories, newCategory.trim().toLowerCase()]);
                          setProductForm({ ...productForm, category: newCategory.trim().toLowerCase() });
                          setNewCategory('');
                          toast.success('Category added!');
                        }
                      }}
                      className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-400 transition"
                    >
                      + Add
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Stock *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Emoji</label>
                <input
                  type="text"
                  placeholder="📦"
                  value={productForm.emoji}
                  onChange={(e) => setProductForm({ ...productForm, emoji: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Multiple Image Upload */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Product Images (Max 5) 📷</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 5))}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-500 hover:border-orange-500 hover:text-orange-500 transition"
                >
                  {imageFiles.length > 0 ? `✅ ${imageFiles.length} image(s) selected` : '📷 Click to upload images'}
                </button>

                {imageFiles.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {imageFiles.map((f, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(f)} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                        {i === 0 && <span className="absolute -top-1 -left-1 bg-orange-500 text-white text-xs px-1 rounded-full">Main</span>}
                        <button
                          onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                        >✕</button>
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

              {/* Specifications */}
              <div>
                <label className="text-gray-600 text-sm font-medium mb-1 block">Specifications</label>
                <textarea
                  placeholder={`Size: 42cm x 18cm\nColor: Black\nMaterial: Stainless Steel\nWeight: 2kg`}
                  value={productForm.specifications}
                  onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                />
                <p className="text-gray-400 text-xs mt-1">প্রতিটা line এ একটা specification লেখো</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveProduct}
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="px-6 border border-gray-200 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}