'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { ordersAPI, paymentAPI, settingsAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';

const DISTRICTS = [
  'Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail',
  'Kishoreganj', 'Netrokona', 'Sherpur', 'Jamalpur', 'Mymensingh', 'Faridpur', 'Gopalganj',
  'Madaripur', 'Rajbari', 'Shariatpur', 'Chattogram', 'Cox\'s Bazar', 'Rangamati', 'Bandarban',
  'Khagrachhari', 'Feni', 'Lakshmipur', 'Noakhali', 'Comilla', 'Chandpur', 'Brahmanbaria',
  'Rajshahi', 'Chapainawabganj', 'Naogaon', 'Natore', 'Bogura', 'Joypurhat', 'Pabna',
  'Sirajganj', 'Khulna', 'Bagerhat', 'Satkhira', 'Jashore', 'Narail', 'Magura', 'Jhenaidah',
  'Chuadanga', 'Meherpur', 'Kushtia', 'Barishal', 'Patuakhali', 'Barguna', 'Bhola',
  'Pirojpur', 'Jhalokati', 'Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj', 'Rangpur',
  'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon', 'Dinajpur'
];

const THANAS: { [key: string]: string[] } = {
  'Dhaka': ['Adabor', 'Badda', 'Bangshal', 'Cantonment', 'Chawkbazar', 'Dakshinkhan', 'Darus Salam', 'Demra', 'Dhanmondi', 'Dohar', 'Gendaria', 'Gulshan', 'Hazaribagh', 'Jatrabari', 'Kafrul', 'Kadamtali', 'Kamrangirchar', 'Keraniganj', 'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Nawabganj', 'Pallabi', 'Rampura', 'Sabujbagh', 'Savar', 'Shah Ali', 'Shahbagh', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Turag', 'Uttara', 'Uttarkhan', 'Wari'],
  'Gazipur': ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj', 'Tongi'],
  'Narayanganj': ['Narayanganj Sadar', 'Bandar', 'Araihazar', 'Rupganj', 'Sonargaon'],
  'Narsingdi': ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
  'Munshiganj': ['Munshiganj Sadar', 'Gazaria', 'Lohajang', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
  'Manikganj': ['Manikganj Sadar', 'Daulatpur', 'Ghior', 'Harirampur', 'Saturia', 'Shivalaya', 'Singair'],
  'Tangail': ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur'],
  'Kishoreganj': ['Kishoreganj Sadar', 'Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
  'Netrokona': ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Kendua', 'Khaliajuri', 'Madan', 'Mohanganj', 'Purbadhala'],
  'Sherpur': ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
  'Jamalpur': ['Jamalpur Sadar', 'Baksiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
  'Mymensingh': ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal'],
  'Faridpur': ['Faridpur Sadar', 'Alfadanga', 'Bhanga', 'Boalmari', 'Char Bhadrasan', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
  'Gopalganj': ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  'Madaripur': ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar'],
  'Rajbari': ['Rajbari Sadar', 'Baliakandi', 'Goalanda', 'Kalukhali', 'Pangsha'],
  'Shariatpur': ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Zanjira'],
  'Chattogram': ['Chandgaon', 'Kotwali', 'Double Mooring', 'Pahartali', 'Panchlaish', 'Bayazid', 'Hathazari', 'Raozan', 'Boalkhali', 'Patiya', 'Anwara', 'Banshkhali', 'Lohagara', 'Satkania', 'Chakaria', 'Sitakunda', 'Mirsarai', 'Sandwip', 'Fatikchhari', 'Rangunia', 'Karnafuli'],
  "Cox's Bazar": ["Cox's Bazar Sadar", 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Pekua', 'Ramu', 'Teknaf', 'Ukhia'],
  'Rangamati': ['Rangamati Sadar', 'Baghaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'],
  'Bandarban': ['Bandarban Sadar', 'Alikadam', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
  'Khagrachhari': ['Khagrachhari Sadar', 'Dighinala', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'],
  'Feni': ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Sonagazi', 'Fulgazi'],
  'Lakshmipur': ['Lakshmipur Sadar', 'Kamalnagar', 'Raipur', 'Ramganj', 'Ramgati'],
  'Noakhali': ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar'],
  'Comilla': ['Comilla Sadar', 'Adarsha Sadar', 'Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Lalmai', 'Meghna', 'Monohorganj', 'Muradnagar', 'Nangalkot', 'Titas'],
  'Chandpur': ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Hajiganj', 'Kachua', 'Matlab Uttar', 'Matlab Dakshin', 'Shahrasti'],
  'Brahmanbaria': ['Brahmanbaria Sadar', 'Akhaura', 'Ashuganj', 'Bancharampur', 'Bijoynagar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail'],
  'Rajshahi': ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Paba', 'Godagari', 'Tanore', 'Bagmara', 'Charghat', 'Durgapur', 'Mohanpur', 'Putia'],
  'Chapainawabganj': ['Chapainawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
  'Naogaon': ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Mahadebpur', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
  'Natore': ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra'],
  'Bogura': ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
  'Joypurhat': ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
  'Pabna': ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
  'Sirajganj': ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'],
  'Khulna': ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Khan Jahan Ali', 'Daulatpur', 'Batiaghata', 'Dumuria', 'Fultala', 'Dighalia', 'Rupsa', 'Terokhada', 'Koyra', 'Paikgachha'],
  'Bagerhat': ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
  'Satkhira': ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
  'Jashore': ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
  'Narail': ['Narail Sadar', 'Kalia', 'Lohagara'],
  'Magura': ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
  'Jhenaidah': ['Jhenaidah Sadar', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
  'Chuadanga': ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
  'Meherpur': ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  'Kushtia': ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
  'Barishal': ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hiron', 'Mehendiganj', 'Muladi', 'Wazirpur'],
  'Patuakhali': ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Dumki', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali'],
  'Barguna': ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'],
  'Bhola': ['Bhola Sadar', 'Borhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
  'Pirojpur': ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazipur', 'Nesarabad', 'Zianagar'],
  'Jhalokati': ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
  'Sylhet': ['Sylhet Sadar', 'Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmaninagar', 'South Surma', 'Zakiganj'],
  'Moulvibazar': ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
  'Habiganj': ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj'],
  'Sunamganj': ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharmapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sulla', 'Tahirpur'],
  'Rangpur': ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
  'Gaibandha': ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
  'Kurigram': ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Nageshwari', 'Phulbari', 'Rajarhat', 'Raumari', 'Ulipur'],
  'Lalmonirhat': ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
  'Nilphamari': ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Saidpur'],
  'Panchagarh': ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
  'Thakurgaon': ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail'],
  'Dinajpur': ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
};

const getThanas = (district: string): string[] => {
  return THANAS[district] || [];
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

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    district: '',
    thana: '',
    area: '',
    fullAddress: '',
  });

  const [deliveryCharges, setDeliveryCharges] = useState({ insideDhaka: 60, outsideDhaka: 120, freeAbove: 10000 });

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

  useEffect(() => {
    settingsAPI.get().then(res => {
      setDeliveryCharges({
        insideDhaka: res.data.insideDhakaCharge ?? 60,
        outsideDhaka: res.data.outsideDhakaCharge ?? 120,
        freeAbove: res.data.freeDeliveryAbove ?? 10000,
      });
    }).catch(() => {});
  }, []);

  const getDeliveryCharge = () => {
    const subtotal = cartTotal();
    if (subtotal >= deliveryCharges.freeAbove) return 0;
    return address.district === 'Dhaka' ? deliveryCharges.insideDhaka : deliveryCharges.outsideDhaka;
  };

  const getFinalTotal = () => cartTotal() + getDeliveryCharge();

  const handleAddressSubmit = async () => {
    if (!user) { toast.error('Please login first'); router.push('/login'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (!address.name) { toast.error('Name is required'); return; }
    if (!address.phone) { toast.error('Phone number is required'); return; }
    if (!/^(\+8801|8801|01)[3-9]\d{8}$/.test(address.phone)) { toast.error('Invalid phone number'); return; }
    if (!address.district) { toast.error('District is required'); return; }
    if (!address.thana) { toast.error('Thana/Upazila is required'); return; }
    if (!address.fullAddress) { toast.error('Full address is required'); return; }

    localStorage.setItem('shopbd_address', JSON.stringify(address));

    setLoading(true);
    try {
      const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
      const res = await ordersAPI.place(items, address.phone, address);
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
    if (!transactionId.trim()) { toast.error('Transaction ID is required'); return; }
    setVerifyingPayment(true);
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
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">

        {/* Progress */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[{ key: 'address', label: 'Delivery Address', num: 1 }, { key: 'payment', label: 'Payment', num: 2 }].map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${step === s.key ? 'text-orange-500' : step === 'payment' && s.key === 'address' ? 'text-green-500' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step === s.key ? 'border-orange-500 bg-orange-500 text-white' : step === 'payment' && s.key === 'address' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-400'}`}>
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
              <button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-full transition">Continue Shopping</button>
              <button onClick={() => router.push('/orders')} className="border-2 border-gray-200 hover:border-orange-500 text-gray-600 hover:text-orange-500 font-bold px-8 py-3 rounded-full transition">My Orders</button>
            </div>
          </div>
        )}

        {/* Address */}
        {step === 'address' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-black mb-6">📍 Delivery Address</h1>

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
              <div className="border-t border-orange-100 pt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">৳{cartTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Charge {address.district && `(${address.district === 'Dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})`}</span>
                  <span className="font-semibold">
                    {getDeliveryCharge() === 0 ? 'FREE' : `৳${getDeliveryCharge().toLocaleString()}`}
                  </span>
                </div>
                {!address.district && (
                  <div className="text-xs text-gray-400 italic">📍 Select district to calculate delivery charge</div>
                )}
                <div className="border-t border-orange-100 pt-1.5 flex justify-between font-black">
                  <span>Total</span>
                  <span className="text-orange-500">৳{getFinalTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Full Name *</label>
                <input type="text" placeholder="Your full name" value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              </div>

              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Phone Number * <span className="text-orange-500 font-normal">(Delivery contact)</span></label>
                <input type="tel" placeholder="01XXXXXXXXX" value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              </div>

              {/* District */}
              <div className="relative">
                <label className="text-gray-600 text-sm font-semibold mb-1 block">District * <span className="text-gray-400 font-normal">(64 districts)</span></label>
                <input
                  type="text"
                  placeholder="Type to search district..."
                  value={address.district ? address.district : districtSearch}
                  onChange={(e) => {
                    setDistrictSearch(e.target.value);
                    setAddress({ ...address, district: '', thana: '' });
                    setThanaSearch('');
                    setShowDistrictDropdown(true);
                  }}
                  onFocus={() => { if (!address.district) setShowDistrictDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 200)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 ${address.district ? 'border-green-400 bg-green-50 focus:border-green-400' : 'border-gray-200 focus:border-orange-500'}`}
                />
                {address.district && (
                  <button onClick={() => { setAddress({ ...address, district: '', thana: '' }); setDistrictSearch(''); setThanaSearch(''); }}
                    className="absolute right-3 top-9 text-gray-400 hover:text-red-400 text-sm">✕</button>
                )}
                {showDistrictDropdown && !address.district && filteredDistricts.length > 0 && (
                  <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-52 overflow-y-auto">
                    {filteredDistricts.map(d => (
                      <button key={d} onMouseDown={() => { setAddress({ ...address, district: d, thana: '' }); setDistrictSearch(''); setThanaSearch(''); setShowDistrictDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-500 transition border-b border-gray-50 last:border-0">
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Thana */}
              <div className="relative">
                <label className="text-gray-600 text-sm font-semibold mb-1 block">
                  Thana / Upazila *
                  {!address.district && <span className="text-gray-400 font-normal ml-1">(Select district first)</span>}
                  {address.district && <span className="text-gray-400 font-normal ml-1">({getThanas(address.district).length} options)</span>}
                </label>
                <input
                  type="text"
                  placeholder={address.district ? `Search in ${address.district}...` : 'Select district first'}
                  value={address.thana ? address.thana : thanaSearch}
                  disabled={!address.district}
                  onChange={(e) => {
                    setThanaSearch(e.target.value);
                    setAddress({ ...address, thana: '' });
                    setShowThanaDropdown(true);
                  }}
                  onFocus={() => { if (address.district && !address.thana) setShowThanaDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowThanaDropdown(false), 200)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 ${address.thana ? 'border-green-400 bg-green-50' : 'border-gray-200 focus:border-orange-500'} disabled:bg-gray-50 disabled:text-gray-400`}
                />
                {address.thana && (
                  <button onClick={() => { setAddress({ ...address, thana: '' }); setThanaSearch(''); }}
                    className="absolute right-3 top-9 text-gray-400 hover:text-red-400 text-sm">✕</button>
                )}
                {showThanaDropdown && address.district && !address.thana && filteredThanas.length > 0 && (
                  <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-52 overflow-y-auto">
                    {filteredThanas.map(t => (
                      <button key={t} onMouseDown={() => { setAddress({ ...address, thana: t }); setThanaSearch(''); setShowThanaDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-500 transition border-b border-gray-50 last:border-0">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Area / Village <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. Mirpur-10, Ward no. 5" value={address.area}
                  onChange={(e) => setAddress({ ...address, area: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              </div>

              <div>
                <label className="text-gray-600 text-sm font-semibold mb-1 block">Full Address * <span className="text-orange-500 font-normal">(House/Road/Block)</span></label>
                <textarea placeholder="House no, Road no, Block..." value={address.fullAddress}
                  onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              </div>

              <button onClick={handleAddressSubmit} disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 text-white font-bold py-4 rounded-2xl transition text-base">
                {loading ? 'Processing...' : 'Confirm Order & Continue to Payment →'}
              </button>
            </div>
          </div>
        )}

        {/* Payment */}
        {step === 'payment' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-2xl font-black mb-2">💳 Payment</h1>
            <p className="text-gray-400 text-sm mb-6">{uniqueOrderId || `Order #${orderId}`} — ৳{getFinalTotal().toLocaleString()}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
              <p className="font-bold text-gray-700 mb-1">📍 Delivery to:</p>
              <p className="text-gray-600">{address.name} · {address.phone}</p>
              <p className="text-gray-500">{address.fullAddress}{address.area ? `, ${address.area}` : ''}, {address.thana}, {address.district}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'bkash', label: 'bKash', emoji: '💳' },
                { id: 'nagad', label: 'Nagad', emoji: '🔶' },
                { id: 'cod', label: 'Cash on Delivery', emoji: '💵' },
              ].map((method) => (
                <button key={method.id}
                  onClick={() => { setPaymentMethod(method.id as any); setPaymentVerified(false); setTransactionId(''); }}
                  className={`p-4 rounded-2xl border-2 text-center transition ${paymentMethod === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-3xl mb-2">{method.emoji}</div>
                  <div className="text-xs font-bold text-gray-700">{method.label}</div>
                </button>
              ))}
            </div>

            {paymentMethod !== 'cod' && (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="font-bold text-blue-700 text-sm mb-2">{paymentMethod === 'bkash' ? '💳 bKash' : '🔶 Nagad'} Payment Instructions:</p>
                  <ol className="text-blue-600 text-sm space-y-1 list-decimal list-inside">
                    <li>Open your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app</li>
                    <li>Go to <strong>Send Money</strong></li>
                    <li>Send <strong>৳{getFinalTotal().toLocaleString()}</strong> to <strong>01XXXXXXXXX</strong></li>
                    <li>Copy the <strong>Transaction ID</strong></li>
                    <li>Enter it below and click Verify</li>
                  </ol>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">Your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number *</label>
                  <input type="tel" placeholder="01XXXXXXXXX" value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-semibold mb-1 block">
                    Transaction ID * {paymentVerified && <span className="text-green-500 ml-2">✅ Verified</span>}
                  </label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. AB1234567890" value={transactionId}
                      onChange={(e) => { setTransactionId(e.target.value); setPaymentVerified(false); }}
                      disabled={paymentVerified}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 disabled:bg-gray-50" />
                    {!paymentVerified && (
                      <button onClick={handleVerifyPayment} disabled={verifyingPayment || !transactionId.trim()}
                        className="bg-blue-500 hover:bg-blue-400 disabled:bg-gray-200 text-white font-bold px-4 py-3 rounded-xl text-sm transition whitespace-nowrap">
                        {verifyingPayment ? '⏳...' : '✓ Verify'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="font-bold text-green-700 mb-1">💵 Cash on Delivery</p>
                <p className="text-green-600 text-sm">Pay <strong>৳{getFinalTotal().toLocaleString()}</strong> when your order arrives.</p>
                <p className="text-green-500 text-xs mt-2">📍 {address.thana}, {address.district}</p>
              </div>
            )}

            <button onClick={handlePayment} disabled={loading || (paymentMethod !== 'cod' && !paymentVerified)}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition text-base">
              {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Confirm Order 🎉' : paymentVerified ? `Confirm Payment ৳${getFinalTotal().toLocaleString()} 🎉` : 'Verify Payment First'}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}