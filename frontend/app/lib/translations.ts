export const translations = {
  en: {
    // Navbar
    search: 'Search products...',
    cart: 'Cart',
    login: 'Login',
    logout: 'Logout',
    myOrders: 'My Orders',
    profile: 'Profile',
    admin: 'Admin',

    // Homepage
    shopByCategory: 'SHOP BY CATEGORY',
    allProducts: 'All Products',
    shopNow: 'Shop Now →',
    filter: 'Filter',
    newest: 'Newest',
    priceLowHigh: 'Price: Low to High',
    priceHighLow: 'Price: High to Low',
    noProducts: 'No products found',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    filterByPrice: 'Filter by Price',
    apply: 'Apply',
    clear: 'Clear',

    // Product
    inStock: 'In Stock',
    onlyLeft: 'Only {n} left!',
    quantity: 'Quantity',
    buyNow: 'Buy Now',
    specifications: 'Specifications',
    productDetails: 'Product Details',
    category: 'Category',
    stock: 'Stock',
    save: 'Save',

    // Orders
    myOrdersTitle: 'My Orders',
    ordersFound: '{n} order(s) found',
    noOrders: 'No orders yet!',
    startShopping: 'Start Shopping →',
    orderPlaced: 'Order Placed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',

    // Login
    welcomeBack: 'Welcome back!',
    createAccount: 'Create your account',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    register: 'Register',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
  },
  bn: {
    // Navbar
    search: 'পণ্য খুঁজুন...',
    cart: 'কার্ট',
    login: 'লগইন',
    logout: 'লগআউট',
    myOrders: 'আমার অর্ডার',
    profile: 'প্রোফাইল',
    admin: 'অ্যাডমিন',

    // Homepage
    shopByCategory: 'বিভাগ অনুযায়ী কেনাকাটা',
    allProducts: 'সব পণ্য',
    shopNow: 'এখনই কিনুন →',
    filter: 'ফিল্টার',
    newest: 'নতুন',
    priceLowHigh: 'দাম: কম থেকে বেশি',
    priceHighLow: 'দাম: বেশি থেকে কম',
    noProducts: 'কোনো পণ্য পাওয়া যায়নি',
    addToCart: 'কার্টে যোগ করুন',
    outOfStock: 'স্টক নেই',
    filterByPrice: 'দাম অনুযায়ী ফিল্টার',
    apply: 'প্রয়োগ করুন',
    clear: 'মুছুন',

    // Product
    inStock: 'স্টকে আছে',
    onlyLeft: 'মাত্র {n}টি বাকি!',
    quantity: 'পরিমাণ',
    buyNow: 'এখনই কিনুন',
    specifications: 'বিশেষত্ব',
    productDetails: 'পণ্যের বিবরণ',
    category: 'বিভাগ',
    stock: 'স্টক',
    save: 'সংরক্ষণ করুন',

    // Orders
    myOrdersTitle: 'আমার অর্ডার',
    ordersFound: '{n}টি অর্ডার পাওয়া গেছে',
    noOrders: 'এখনো কোনো অর্ডার নেই!',
    startShopping: 'কেনাকাটা শুরু করুন →',
    orderPlaced: 'অর্ডার হয়েছে',
    processing: 'প্রক্রিয়াকরণ',
    shipped: 'পাঠানো হয়েছে',
    delivered: 'পৌঁছে গেছে',

    // Login
    welcomeBack: 'স্বাগতম!',
    createAccount: 'নতুন অ্যাকাউন্ট তৈরি করুন',
    fullName: 'পুরো নাম',
    phoneNumber: 'ফোন নম্বর',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    signIn: 'সাইন ইন',
    register: 'নিবন্ধন করুন',
    alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    dontHaveAccount: 'অ্যাকাউন্ট নেই?',
  }
};

export type Language = 'en' | 'bn';
export type TranslationKey = keyof typeof translations.en;