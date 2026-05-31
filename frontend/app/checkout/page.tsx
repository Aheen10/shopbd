'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { ordersAPI, paymentAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

// Bangladesh Districts
const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Narayanganj', 'Gazipur', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail',
  'Kishoreganj', 'Netrokona', 'Sherpur', 'Jamalpur', 'Bogura', 'Joypurhat', 'Naogaon',
  'Natore', 'Chapainawabganj', 'Pabna', 'Sirajganj', 'Dinajpur', 'Thakurgaon', 'Panchagarh',
  'Nilphamari', 'Lalmonirhat', 'Kurigram', 'Gaibandha', 'Jashore', 'Satkhira', 'Meherpur',
  'Chuadanga', 'Kushtia', 'Magura', 'Jhenaidah', 'Narail', 'Bagerhat', 'Pirojpur',
  'Jhalokati', 'Bhola', 'Patuakhali', 'Barguna', 'Sunamganj', 'Habiganj', 'Moulvibazar',
  'Brahmanbaria', 'Chandpur', 'Lakshmipur', 'Noakhali', 'Feni', "Cox's Bazar", 'Bandarban',
  'Khagrachhari', 'Rangamati'
];

// Thana/Upazila by District
const THANAS: { [key: string]: string[] } = {
  'Dhaka': ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mohammadpur', 'Uttara', 'Motijheel', 'Lalbagh', 'Kotwali', 'Demra', 'Badda', 'Khilgaon', 'Sabujbagh', 'Rampura', 'Bangshal', 'Sutrapur', 'Hazaribagh', 'Kamrangirchar', 'Keraniganj', 'Savar', 'Dohar', 'Nawabganj', 'Wari', 'Shyampur', 'Jatrabari', 'Kadamtali', 'Adabor', 'Pallabi', 'Kafrul', 'Cantonment', 'Shah Ali', 'Tejgaon', 'Turag'],
  'Chittagong': ['Kotwali', 'Double Mooring', 'Pahartali', 'Panchlaish', 'Chandgaon', 'Bayazid', 'Hathazari', 'Raozan', 'Boalkhali', 'Patiya', 'Anwara', 'Banshkhali', 'Lohagara', 'Satkania', 'Chakaria', 'Cox\'s Bazar Sadar', 'Sitakunda', 'Mirsarai', 'Sandwip', 'Fatikchhari'],
  'Gazipur': ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj', 'Tongi'],
  'Narayanganj': ['Narayanganj Sadar', 'Bandar', 'Araihazar', 'Rupganj', 'Sonargaon'],
  'Rajshahi': ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Paba', 'Godagari', 'Tanore', 'Bagmara', 'Charghat', 'Durgapur'],
  'Khulna': ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Khan Jahan Ali', 'Daulatpur', 'Batiaghata', 'Dumuria', 'Fultala', 'Dighalia', 'Rupsa', 'Terokhada', 'Koyra', 'Paikgachha'],
  'Sylhet': ['Sylhet Sadar', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmaninagar', 'South Surma', 'Zakiganj', 'Balaganj'],
  'Barishal': ['Barishal Sadar', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Agailjhara', 'Babuganj', 'Muladi', 'Mehendiganj', 'Hiron', 'Wazirpur'],
  'Rangpur': ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
  'Mymensingh': ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal'],
  'Comilla': ['Comilla Sadar', 'Adarsha Sadar', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Lalmai', 'Meghna', 'Monohorganj', 'Muradnagar', 'Nangalkot', 'Titas'],
  'Tangail': ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'],
};

const getThanas = (district: string): string[] => {
  return THANAS[district] || ['Sadar', 'Pourashava'];
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, cartTotal, clearCart } = useStore();
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod'>('bkash');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [uniqueOrderId, setUniqueOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Address Form
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    district: '',
    thana: '',
    area: '',
    fullAddress: '',
  });

  const [thanaSearch, setThanaSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showThanaDropdown, setShowThanaDropdown] = useState(false);

  const filteredDistricts = DISTRICTS.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const filteredThanas = getThanas(address.district).filter(t =>
    t.toLowerCase().includes(thanaSearch.toLowerCase())
  );

  const handleAddressSubmit = async () => {
    if (!user) { toast.error('Please login first'); router.push('/login'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (!address.phone) { toast.error('Phone number is required'); return; }
    if (!/^(\+8801|8801|01)[3-9]\d{8}$/.test(address.phone)) {
      toast.error('Invalid phone number'); return;
    }
    if (!address.district) { toast.error('District is required'); return; }
    if (!address.thana) { toast.error('Thana/Upazila is required'); return; }
    if (!address.fullAddress) { toast.error('Full address is required'); return; }

    // Save address to localStorage
    localStorage.setItem('shopbd_address', JSON.stringify(address));

    setLoading(true);
    try {
      const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
      const res = await ordersAPI.place(items);
      setOrderId(res.data.order.id);
      setUniqueOrderId(res.data.order.uniqueId);
      setStep('payment');
      toast.success('Order placed! Now complete payment.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Transaction ID is required');
      return;
    }
    setVerifyingPayment(true);
    // Simulate verification (in real app, call backend to verify)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setVerifyingPayment(false);
    setPaymentVerified(true);
    toast.success('Payment verified! ✅');
  };

  const handlePayment = async () => {
    if (!orderId) return;

    if (paymentMethod !== 'cod') {
      if (!paymentPhone) { toast.error('Phone number required'); return; }
      if (!paymentVerified) { toast.error('Please verify your payment first'); return; }
    }

    setLoading(true);
    try {
      if (paymentMethod === 'bkash') {
        await paymentAPI.bkash({ orderId, phone: paymentPhone, amount: cartTotal() });
      } else if (paymentMethod === 'nagad') {
        await paymentAPI.nagad({ orderId, phone: paymentPhone, amount: cartTotal() });
      } else {
        await paymentAPI.cod(orderId);
      }
      clearCart();
      setStep('success');
      toast.success('Payment successful! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { key: 'address', label: 'Delivery Address', num: 1 },
              { key: 'payment', label: 'Payment', num: 2 },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${step === s.key ? 'text-orange-500' : step === 'payment' && s.key === 'address' ? 'text-green-500' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    step === s.key ? 'border-orange-500 bg-orange-500 text-white' :
                    step === 'payment' && s.key === 'address' ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-200 text-gray-400'
                  }`}>
                    {step === 'payment' && s.key === 'address' ? '✓' : s.num}
                  </div>
                  <span className="text-sm font-semibold hidden md:block">{s.label}</span>
                </div>
                {i < 1 && <div className="w-12 h-0.5 bg-gray-200 mx-1"></div>}
              </div>
            ))}
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 px-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-3xl font-black mb-2 text-gray-800">Order Confirmed!</h1>
            <p className="text-gray-400 mb-2">Thank you for shopping with ShopBD!</p>
            <p className="text-orange-500 font-bold mb-8">{uniqueOrderId || `Order #${orderId}`}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-full transition">
                Continue Shopping
              </button>
              <button onClick={() => router.push('/orders')} className="border-2 border-gray-200 hover:border-orange-500 text-gray-600 hover:text-orange-500 font-bold px-8 py-3 rounded-full transition">
                My Orders
              </button>
            </div>
          </div>
        )}

        {/* Address Step */}
        {step === 'address' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-black mb-6">📍 Delivery Address</h1>

            {/* Cart Summary */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-2">Order Summary ({cart.length} items)</p>
              <div className="space-y-1 mb-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.emoji} {item.name} ×{item.quantity}</span>
                    <span className="font-semibold">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-orange-100 pt-2 flex justify-between font-black">
                <span>Total</span>
                <span className="text-orange-500">৳{cartTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Full Name *</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Phone Number * <span className="text-orange-500">(Delivery contact)</span></label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* District */}
              <div className="relative">
                <label className="text-gray-600 text-sm font-semibold mb-1 block">District * </label>
                <input
                  type="text"
                  placeholder="Search district..."
                  value={districtSearch || address.district}
                  onChange={(e) => {
                    setDistrictSearch(e.target.value);
                    setAddress({ ...address, district: '', thana: '' });
                    setShowDistrictDropdown(true);
                  }}
                  onFocus={() => setShowDistrictDropdown(true)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                {address.district && !showDistrictDropdown && (
                  <span className="absolute right-3 top-9 text-green-500 text-sm">✓ {address.district}</span>
                )}
                {showDistrictDropdown && filteredDistricts.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
                    {filteredDistricts.map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setAddress({ ...address, district: d, thana: '' });
                          setDistrictSearch('');
                          setThanaSearch('');
                          setShowDistrictDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-500 transition"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Thana */}
              <div className="relative">
                <label className="text-gray-600 text-sm font-semibold mb-1 block">
                  Thana / Upazila * {!address.district && <span className="text-gray-400 font-normal">(Select district first)</span>}
                </label>
                <input
                  type="text"
                  placeholder={address.district ? "Search thana/upazila..." : "Select district first"}
                  value={thanaSearch || address.thana}
                  disabled={!address.district}
                  onChange={(e) => {
                    setThanaSearch(e.target.value);
                    setAddress({ ...address, thana: '' });
                    setShowThanaDropdown(true);
                  }}
                  onFocus={() => address.district && setShowThanaDropdown(true)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {address.thana && !showThanaDropdown && (
                  <span className="absolute right-3 top-9 text-green-500 text-sm">✓ {address.thana}</span>
                )}
                {showThanaDropdown && address.district && filteredThanas.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
                    {filteredThanas.map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setAddress({ ...address, thana: t });
                          setThanaSearch('');
                          setShowThanaDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-500 transition"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Area */}
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Area / Village <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Mirpur-10, Dhanmondi-32"
                  value={address.area}
                  onChange={(e) => setAddress({ ...address, area: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Full Address */}
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Full Address * <span className="text-orange-500">(House/Road/Block)</span></label>
                <textarea
                  placeholder="House no, Road no, Block, Area..."
                  value={address.fullAddress}
                  onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <button
                onClick={handleAddressSubmit}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-bold py-4 rounded-2xl transition text-base"
              >
                {loading ? 'Processing...' : 'Continue to Payment →'}
              </button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-black mb-2">💳 Payment</h1>
            <p className="text-gray-400 text-sm mb-6">{uniqueOrderId || `Order #${orderId}`} — ৳{cartTotal().toLocaleString()}</p>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
              <p className="font-bold text-gray-700 mb-1">📍 Delivery to:</p>
              <p className="text-gray-600">{address.name} · {address.phone}</p>
              <p className="text-gray-500">{address.fullAddress}, {address.area && `${address.area}, `}{address.thana}, {address.district}</p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'bkash', label: 'bKash', emoji: '💳', color: 'pink', number: '01XXXXXXXXX' },
                { id: 'nagad', label: 'Nagad', emoji: '🔶', color: 'orange', number: '01XXXXXXXXX' },
                { id: 'cod', label: 'Cash on Delivery', emoji: '💵', color: 'green', number: null },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => { setPaymentMethod(method.id as any); setPaymentVerified(false); setTransactionId(''); }}
                  className={`p-4 rounded-2xl border-2 text-center transition ${
                    paymentMethod === method.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{method.emoji}</div>
                  <div className="text-xs font-bold text-gray-700">{method.label}</div>
                </button>
              ))}
            </div>

            {/* bKash / Nagad Payment Instructions */}
            {paymentMethod !== 'cod' && (
              <div className="space-y-4 mb-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="font-bold text-blue-700 text-sm mb-2">
                    {paymentMethod === 'bkash' ? '💳 bKash' : '🔶 Nagad'} Payment Instructions:
                  </p>
                  <ol className="text-blue-600 text-sm space-y-1 list-decimal list-inside">
                    <li>Open your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app</li>
                    <li>Go to <strong>Send Money</strong></li>
                    <li>Send <strong>৳{cartTotal().toLocaleString()}</strong> to <strong>01XXXXXXXXX</strong></li>
                    <li>Copy the <strong>Transaction ID</strong></li>
                    <li>Enter it below and click Verify</li>
                  </ol>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">
                    Your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">
                    Transaction ID *
                    {paymentVerified && <span className="text-green-500 ml-2">✅ Verified</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. AB1234567890"
                      value={transactionId}
                      onChange={(e) => { setTransactionId(e.target.value); setPaymentVerified(false); }}
                      disabled={paymentVerified}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 disabled:bg-gray-50"
                    />
                    {!paymentVerified && (
                      <button
                        onClick={handleVerifyPayment}
                        disabled={verifyingPayment || !transactionId.trim()}
                        className="bg-blue-500 hover:bg-blue-400 disabled:bg-gray-200 text-white font-bold px-4 py-3 rounded-xl text-sm transition whitespace-nowrap"
                      >
                        {verifyingPayment ? '⏳ Verifying...' : '✓ Verify'}
                      </button>
                    )}
                  </div>
                  {!paymentVerified && (
                    <p className="text-gray-400 text-xs mt-1">Enter the transaction ID from your payment confirmation</p>
                  )}
                </div>
              </div>
            )}

            {/* COD */}
            {paymentMethod === 'cod' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="font-bold text-green-700 mb-1">💵 Cash on Delivery</p>
                <p className="text-green-600 text-sm">Pay <strong>৳{cartTotal().toLocaleString()}</strong> when your order arrives at your doorstep.</p>
                <p className="text-green-500 text-xs mt-2">📍 {address.thana}, {address.district}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading || (paymentMethod !== 'cod' && !paymentVerified)}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition text-base"
            >
              {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Confirm Order 🎉' : paymentVerified ? `Confirm Payment ৳${cartTotal().toLocaleString()} 🎉` : 'Verify Payment First'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}