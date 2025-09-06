import config from "@/configs/activeConfig";


export const arTranslations = {
  // Store & Brand
  storeName: config.names.ar,
  storeDescription: config.descriptions.ar,
  storeSubtitle: "تسوق بثقة وراحة",
  readyText: "جاهز للاستخدام",

  // Product Messages
  exceededStockQuantity: "لا يمكن إضافة كمية أكثر من المخزون المتاح",

  // Navigation
  home: "الرئيسية",
  product: "المنتج",
  products: "المنتجات",
  categories: "الفئات",
  offers: "العروض",
  contact: "اتصل بنا",
  profile: "الملف الشخصي",
  orders: "الطلبات",
  dashboard: "لوحة التحكم",
  checkout: "الدفع",
  notifications: "إشعارات",

  // Welcome Messages
  welcomeBack: "أهلاً وسهلاً بك في متجرنا",
  welcomeUser: "أهلاً وسهلاً {name}",

  // Authentication
  login: "تسجيل الدخول",
  signup: "إنشاء حساب",
  logout: "تسجيل الخروج",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  confirmPassword: "تأكيد كلمة المرور",
  fullName: "الاسم الكامل",
  phone: "رقم الهاتف",
  loginSuccess: "تم تسجيل الدخول بنجاح",
  signupSuccess: "تم إنشاء الحساب بنجاح! يرجى تأكيد بريدك الإلكتروني",
  loginError: "خطأ في تسجيل الدخول",
  signupError: "خطأ في إنشاء الحساب",
  passwordMismatch: "كلمات المرور غير متطابقة",
  emailNotConfirmed: "يرجى تأكيد بريدك الإلكتروني أولاً",
  emailNotConfirmedAdmin: "الحساب غير مؤكد من قبل العميل",
  invalidEmail: "البريد الإلكتروني غير صالح",
  passwordTooShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  invalidPhone: "رقم الهاتف غير صحيح، يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام",

  // Phone Authentication
  loginWithPhone: "تسجيل الدخول بالهاتف",
  signupWithPhone: "إنشاء حساب بالهاتف",
  enterPhone: "أدخل رقم هاتفك",
  verificationCode: "رمز التحقق",
  enterCode: "أدخل رمز التحقق",
  sendCode: "إرسال الرمز",
  verifyCode: "تحقق من الرمز",
  resendCode: "إعادة إرسال الرمز",
  codeExpired: "انتهت صلاحية الرمز",
  invalidCode: "رمز التحقق غير صحيح",
  phoneVerificationSent: "تم إرسال رمز التحقق إلى هاتفك",
  phoneVerified: "تم التحقق من الهاتف بنجاح",
  phoneAuthError: "خطأ في المصادقة بالهاتف",
  
  // Google Authentication
  loginWithGoogle: "تسجيل الدخول بـ Google",
  signupWithGoogle: "إنشاء حساب بـ Google",
  continueWithGoogle: "المتابعة بـ Google",
  googleAuthError: "خطأ في المصادقة بـ Google",
  
  // Pre-Google Auth Form
  completeProfileBeforeGoogle: "أكمل بياناتك أولاً",
  enterDetailsBeforeGoogleAuth: "يرجى إدخال اسمك الكامل ورقم هاتفك قبل المتابعة مع Google",
  fullNameRequired: "الاسم الكامل مطلوب",
  phoneRequired: "رقم الهاتف مطلوب",
  fullNameTooShort: "الاسم الكامل يجب أن يكون حرفين على الأقل",
  fullNamePlaceholder: "أدخل اسمك الكامل",
  phonePlaceholder: "أدخل رقم هاتفك (05xxxxxxxx)",
  
  // Post-Google Auth Profile Completion
  completeYourProfile: "أكمل ملفك الشخصي",
  completeProfileAfterGoogle: "لإكمال التسجيل، يرجى إدخال اسمك الكامل ورقم هاتفك",
  completeProfile: "إكمال الملف الشخصي",
  profileCompletionRequired: "هذه المعلومات مطلوبة لإكمال حسابك",
  profileCompletedSuccess: "تم إكمال ملفك الشخصي بنجاح!",
  profileCompletionError: "خطأ في إكمال الملف الشخصي",
  pleaseCompleteYourProfile: "يرجى إكمال بياناتك لمتابعة استخدام التطبيق",
  orYouCanLogout: "أو يمكنك تسجيل الخروج",
  
  // Alternative Login Methods
  loginWith: "سجل الدخول بواسطة",
  signupWith: "أنشئ حساب بواسطة",
  or: "أو",
  alternativeLogin: "طرق تسجيل دخول أخرى",

  // Email Confirmation
  confirmYourEmail: "تأكيد البريد الإلكتروني",
  checkYourEmail: "تحقق من بريدك الإلكتروني",
  sentConfirmationEmail: "لقد أرسلنا رابط التأكيد إلى",
  clickLinkToConfirm: "انقر على الرابط في البريد الإلكتروني لتأكيد حسابك",
  resendEmail: "إعادة إرسال البريد",
  resendIn: "إعادة الإرسال في ",
  seconds: " ثانية",
  backToSignup: "العودة إلى التسجيل",
  didntReceiveEmail: "لم تستلم البريد الإلكتروني؟",
  checkSpamFolder: "تحقق من مجلد الرسائل المزعجة",
  confirmationEmailResent: "تم إعادة إرسال بريد التأكيد",
  resendEmailError: "خطأ في إعادة إرسال البريد",
  verifyingEmail: "جاري التحقق من البريد الإلكتروني...",
  emailConfirmed: "تم تأكيد البريد الإلكتروني",
  confirmationFailed: "فشل في التأكيد",
  emailConfirmedSuccess: "تم تأكيد بريدك الإلكتروني بنجاح! أهلاً بك",
  emailConfirmationError: "حدث خطأ في تأكيد البريد الإلكتروني",
  invalidConfirmationLink: "رابط التأكيد غير صالح أو منتهي الصلاحية",
  redirectingToHome: "جاري التوجه إلى الصفحة الرئيسية...",
  goToHome: "الذهاب إلى الرئيسية",
  backToLogin: "العودة إلى تسجيل الدخول",
  waitingForConfirmation: "في انتظار تأكيد البريد الإلكتروني",
  checkYourEmailAndClickConfirmation:
    "تحقق من بريدك الإلكتروني واضغط على رابط التأكيد",
  autoCheckingEvery3Seconds: "فحص تلقائي كل 3 ثوانٍ",
  remaining: "متبقي",
  autoCheckTimeExpired:
    "انتهت مدة الفحص التلقائي. يرجى إعادة إرسال رابط التأكيد",
  confirmingEmail: "جاري تأكيد البريد الإلكتروني",
  pleaseWait: "يرجى الانتظار",
  confirmationExpired: "انتهت صلاحية التأكيد",
  confirmationLinkExpired: "انتهت صلاحية رابط التأكيد",

  // Admin Panel
  adminDashboard: "لوحة التحكم الإدارية",
  adminPanel: "لوحة الإدارة",
  manageContactInfo: "معلومات الاتصال",
  managementPanel: "لوحة الإدارة",
  manageProducts: "إدارة المنتجات",
  manageCategories: "إدارة الفئات",
  manageOrders: "إدارة الطلبات",
  manageUsers: "إدارة المستخدمين",
  manageBanners: "إدارة البنرات",
  backToStore: "العودة للمتجر",
  addProduct: "إضافة منتج",
  editProduct: "تعديل المنتج",
  deleteProduct: "حذف المنتج",
  viewProduct: "عرض المنتج",
  productName: "اسم المنتج",
  productDescription: "وصف المنتج",
  productPrice: "سعر المنتج",
  productCategory: "فئة المنتج",
  productImages: "صور المنتج",
  categoryImage: "صورة الفئة",
  categoryInfo: "معلومات الفئة",
  uploadImages: "رفع الصور",
  mainImage: "الصورة الرئيسية",
  additionalImages: "صور إضافية",
  uploadMainImage: "رفع الصورة الرئيسية",
  uploadAdditionalImages: "رفع صور إضافية",
  categoryAndTags: "الفئة والعلامات",
  stockAndStatus: "المخزون والحالة",
  tags: "العلامات",
  tagsPlaceholder: "أدخل العلامات",
  productDeleted: "تم حذف المنتج",
  productDeletedSuccessfully: "تم حذف المنتج بنجاح",
  errorDeletingProduct: "حدث خطأ أثناء حذف المنتج",
  productAdded: "تم إضافة المنتج",
  productUpdated: "تم تحديث المنتج",
  registeredUsers: "المستخدمون المسجلون",
  userManagement: "إدارة المستخدمين",
  manageAndMonitorUsers: "إدارة ومراقبة جميع المستخدمين المسجلين في النظام",
  totalUsers: "إجمالي المستخدمين",
  adminUsers: "المدراء",
  wholesaleUsers: "مستخدمو الجملة",
  retailUsers: "مستخدمو التجزئة",
  recentUsers: "المستخدمون الجدد",
  ordersByStatus: "توزيع الطلبات حسب الحالة",

  // Common
  success: "نجح",
  error: "خطأ",
  validationError: "خطأ في التحقق",
  loading: "جاري التحميل...",
  loadingData: "جاري تحميل البيانات...",
  loadingOrders: "جاري تحميل الطلبات...",
  loadingProducts: "جاري تحميل المنتجات...",
  loadingCategories: "جاري تحميل الفئات...",
  loadingUsers: "جاري تحميل المستخدمين...",
  loadingBanners: "جاري تحميل البنرات...",
  loadingOffers: "جاري تحميل العروض...",
  loadingProfile: "جاري تحميل الملف الشخصي...",
  loadingCart: "جاري تحميل السلة...",
  loadingCheckout: "جاري تحميل صفحة الدفع...",
  loadingContact: "جاري تحميل صفحة الاتصال...",
  loadingSearchResults: "جاري تحميل نتائج البحث...",
  loadingAdminDashboard: "جاري تحميل لوحة الإدارة...",
  save: "حفظ",
  cancel: "إلغاء",
  confirmAndSave: "تأكيد وحفظ",
  noChangesDetected: "لم يتم رصد تغييرات واضحة.",
  delete: "حذف",
  edit: "تعديل",
  add: "إضافة",
  search: "بحث",
  searchProducts: "البحث عن المنتجات...",
  searchOffers: "البحث عن العروض...",
  searchUsersPlaceholder: "البحث بالاسم أو الإيميل...",
  searchByName: "بحث بالاسم",
  searchByNameProductPlaceholder: "اكتب اسم المنتج...",
  searchByNameOfferPlaceholder: "اكتب اسم العرض...",
  searchByNameBannerPlaceholder: "اكتب اسم البنر...",
  bannerContent: "محتوى البانر",
  bannerSubtitle: "وصف البانر",
  bannerTitle: "عنوان البانر",
  bannerLink: "رابط البانر",
  bannerImage: "صورة البانر",
  activeBanner: "البانر نشط",
  bannerVisible: "البنر مرئي للمستخدمين",
  bannerHidden: "البانر مخفي عن المستخدمين",
  bannerSettings: "إعدادات البانر",
  userInformation: "معلومات المستخدم",
  imageAndStatus: "الصورة والحالة",
  clickToUpload: "انقر للتحميل",
  imageFormat: "صيغة الصورة: PNG, JPG, JPEG",
  pasteImageUrl: "ألصق رابط الصورة هنا",
  searchByOrderNumberNameOrPhone: "بحث برقم الطلب أو اسم العميل ...",
  searchResults: "نتائج البحث",
  noProductsFound: "لم يتم العثور على منتجات",
  noResults: "لا توجد نتائج",
  tryChangingFilters: "جرب تغيير معايير البحث أو الفلاتر",
  viewAll: "عرض الكل",
  viewAllProducts: "عرض جميع المنتجات",
  clearInput: "مسح الحقل",
  featuredProducts: "منتجات مميزة",
  featuredProduct: "منتج مميز",
  noFeaturedProducts: "لا توجد منتجات مميزة",
  browseAllProducts: "تصفح جميع المنتجات",

  // Cart & Shopping
  addToCart: "إضافة للسلة",
  cart: "السلة",
  quantity: "الكمية",
  price: "السعر",
  total: "المجموع الكلي",
  emptyCart: "السلة فارغة",
  showMore: "عرض المزيد",
  showLess: "عرض أقل",

  // Product
  newProduct: "منتج جديد",
  relatedProducts: "منتجات ذات صلة",
  productDetails: "تفاصيل المنتج",
  inStock: "متوفر",
  outOfStock: "نفذ من المخزون",
  productOutOfStockMessage: "هذا المنتج غير متوفر حالياً وسيعود قريباً!",
  productInfo: "معلومات المنتج",

  // User Management
  users: "المستخدمين",
  user: "المستخدم",
  userType: "نوع المستخدم",
  admin: "مدير",
  wholesale: "جملة",
  retail: "تجزئة",
  active: "نشط",
  inactive: "غير نشط",
  confirmed: "مؤكد",
  unconfirmed: "غير مؤكد",
  createdAt: "تاريخ الإنشاء",
  registrationDate: "تاريخ التسجيل",
  lastLogin: "آخر دخول",
  lastOrder: "آخر طلبية",
  highestOrder: "أكبر طلبية",
  name: "الاسم",
  contactInfo: "معلومات الاتصال",
  type: "النوع",
  status: "الحالة",
  actions: "الإجراءات",
  viewDetails: "عرض التفاصيل",
  viewOrders: "عرض الطلبيات",
  viewAllCategories: "عرض جميع الفئات",
  allProducts: "جميع المنتجات",
  noUsers: "لا يوجد مستخدمين",
  userDetails: "تفاصيل المستخدم",
  personalInformation: "المعلومات الشخصية",
  userOrders: "طلبات المستخدم",
  noOrders: "لا توجد طلبات",
  orderDate: "تاريخ الطلب",
  orderStatus: "حالة الطلب",
  orderTotal: "مجموع الطلب",
  viewOrderDetails: "عرض التفاصيل",
  orderDetailsDescription: "عرض جميع تفاصيل الطلبية والمنتجات",
  orderInfo: "معلومات الطلبية",
  orderProducts: "منتجات الطلبية",
  unitPrice: "سعر الوحدة",
  productId: "رقم المنتج",
  discountEnabled: "تمكين الخصم",
  close: "إغلاق",
  notProvided: "غير محدد",
  allTypes: "جميع الأنواع",
  allStatuses: "جميع الحالات",
  confirmationStatus: "حالة التأكيد",
  sortBy: "ترتيب حسب",
  sortOrder: "الترتيب",
  ascending: "تصاعدي",
  descending: "تنازلي",
  count: "العدد",

  // Profile & Account
  profileUpdated: "تم تحديث الملف الشخصي بنجاح",
  manageYourAccount: "إدارة معلومات وإعدادات حسابك",
  accountInfo: "معلومات الحساب",
  settings: "الإعدادات",
  profileInfo: "معلومات الملف الشخصي",
  addresses: "العناوين",
  emailCannotBeChanged: "لا يمكن تغيير البريد الإلكتروني",
  updateProfile: "تحديث الملف الشخصي",
  savedAddresses: "العناوين المحفوظة",
  noAddressesSaved: "لم يتم حفظ أي عناوين بعد",
  default: "افتراضي",
  floor: "الطابق",
  apartment: "الشقة",

  // Filters & Sorting
  filters: "الفلاتر",
  category: "الفئة",
  allCategories: "جميع الفئات",
  priceRange: "نطاق السعر",
  min: "الحد الأدنى",
  max: "الحد الأقصى",
  clearFilters: "مسح الفلاتر",
  newest: "الأحدث",
  priceLowHigh: "السعر: من الأقل للأعلى",
  priceHighLow: "السعر: من الأعلى للأقل",
  topRated: "الأعلى تقييماً",

  // Product Details
  productNotFound: "المنتج غير موجود",
  backToHome: "العودة للرئيسية",
  productOutOfStock: "المنتج غير متوفر في المخزون",
  errorBuyingNow: "خطأ في معالجة الشراء",
  buyNow: "اشتر الآن",

  // Orders
  trackYourOrders: "تتبع وإدارة طلباتك",
  noOrdersDescription: "لم تقم بأي طلبات بعد",
  startShopping: "ابدأ التسوق",
  orderNumber: "رقم الطلب",
  paymentMethod: "طريقة الدفع",

  // Offers
  specialOffers: "عروض وخصومات خاصة",
  specialOffer: "عرض خاص",
  productsOnSale: "منتجات في التخفيضات",
  limitedTimeOffers: "عروض لفترة محدودة",
  dontMissOut: "لا تفوت هذه الصفقات المذهلة!",
  noOffersAvailable: "لا توجد عروض متاحة",
  checkBackLater: "تحقق لاحقاً للحصول على صفقات جديدة",

  // Contact
  getInTouch: "تواصل معنا لأي استفسار أو اقتراح",
  quickContacts: "طرق التواصل السريعة",
  whatsapp: "واتساب",
  emailContact: "البريد الإلكتروني",
  sendMessage: "إرسال رسالة",
  subject: "الموضوع",
  message: "الرسالة",
  sending: "جاري الإرسال...",
  messageSubmitted: "تم إرسال رسالتك بنجاح! سنرد عليك قريبًا.",
  errorSendingMessage: "حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.",
  defaultPhone: "0500000000",
  defaultEmail: "info@example.com",
  defaultAddress: "العنوان غير محدد",
  address: "العنوان",
  workingHours: "ساعات العمل",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",

  // Checkout
  pleaseLogin: "يرجى تسجيل الدخول للمتابعة",
  cartIsEmpty: "سلة التسوق فارغة",
  fillRequiredFields: "يرجى ملء جميع الحقول المطلوبة",
  orderPlaced: "تم تقديم الطلب بنجاح",
  orderFailed: "فشل في تقديم الطلب",
  addItemsToCheckout: "أضف منتجات إلى سلتك للدفع",
  completeYourOrder: "راجع وأكمل طلبك",
  shippingAddress: "عنوان الشحن",
  city: "المدينة",
  area: "المنطقة",
  street: "الشارع",
  building: "المبنى",
  orderNotes: "ملاحظات الطلب",
  orderNotesPlaceholder: "أي تعليمات خاصة لطلبك...",
  cashOnDelivery: "الدفع عند الاستلام",
  creditCard: "بطاقة ائتمان",
  comingSoon: "قريباً",
  orderSummary: "ملخص الطلب",
  placingOrder: "جاري تقديم الطلب...",
  placeOrder: "تقديم الطلب",
  completed: "مكتمل",

  // Categories
  browseProductCategories: "تصفح فئات المنتجات",
  noCategoriesFound: "لم يتم العثور على فئات",
  errorLoadingData: "خطأ في تحميل البيانات",
  searchCategories: "ابحث في الفئات...",
  noCategoriesAvailable: "لا توجد فئات متاحة",
  noItemsAvailable: "لا توجد عناصر متاحة",
  showing: "يتم عرض",

  // Product Actions
  linkCopied: "تم نسخ الرابط",
  addedToCart: "تم إضافة المنتج للسلة",
  addedToFavorites: "تم إضافة المنتج للمفضلة",
  removedFromFavorites: "تم إزالة المنتج من المفضلة",
  openMenu: "فتح القائمة",
  menu: "القائمة",
  errorAddingToCart: "خطأ في الإضافة للسلة",
  errorTogglingFavorite: "خطأ في تحديث المفضلة",
  sharedSuccessfully: "تمت المشاركة بنجاح",
  shareError: "خطأ في المشاركة",
  inCart: "في السلة",
  removeFromFavorites: "إزالة من المفضلة",
  addToFavorites: "إضافة للمفضلة",
  share: "مشاركة",
  shareViaWhatsapp: "مشاركة عبر واتساب",
  shareViaEmail: "مشاركة عبر الإيميل",
  copyLink: "نسخ الرابط",
  shareSystem: "مشاركة النظام",

  // Cart
  cartEmpty: "سلة التسوق فارغة",
  noProductsAdded: "لم تتم إضافة منتجات بعد",
  browseProducts: "تصفح المنتجات",
  continueShopping: "متابعة التسوق",

  // Product
  featured: "مميز",
  discount: "خصم",
  reviews: "تقييمات",
  currency: "₪",

  // Admin Products
  image: "الصورة",
  noImage: "لا توجد صورة",
  productImage: "صورة المنتج",
  productNameArabic: "اسم المنتج (عربي)",
  productNameEnglish: "اسم المنتج (إنجليزي)",
  productNameHebrew: "اسم المنتج (عبري)",
  descriptionArabic: "الوصف (عربي)",
  descriptionEnglish: "الوصف (إنجليزي)",
  descriptionHebrew: "الوصف (عبري)",
  originalPrice: "السعر الأصلي",
  wholesalePrice: "سعر الجملة",
  stockQuantity: "كمية المخزون",
  view: "عرض",
  deleteProductConfirmation: "هل أنت متأكد من حذف",
  noProducts: "لا توجد منتجات بعد",
  addYourFirstProduct: "أضف أول منتج لك للبدء",
  productNames: "أسماء المنتج",
  arabic: "عربي",
  english: "إنجليزي",
  hebrew: "عبري",
  descriptions: "الأوصاف",
  pricing: "التسعير",
  selectCategory: "اختر فئة",
  updating: "جاري التحديث...",
  productUpdatedSuccessfully: "تم تحديث المنتج بنجاح",
  errorUpdatingProduct: "خطأ في تحديث المنتج",

  // Admin Categories
  categoryDeleted: "تم حذف الفئة",
  categoryDeletedSuccessfully: "تم حذف الفئة بنجاح",
  errorDeletingCategory: "خطأ في حذف الفئة",
  noCategories: "لا توجد فئات بعد",
  addYourFirstCategory: "أضف أول فئة لك للبدء",
  categoryName: "اسم الفئة",
  categoryIcon: "أيقونة الفئة",
  productCount: "عدد المنتجات",
  deleteCategory: "حذف الفئة",
  deleteCategoryConfirmation: "هل أنت متأكد من حذف",
  viewCategory: "عرض الفئة",
  editCategory: "تعديل الفئة",
  addCategory: "إضافة فئة",
  categoryNameArabic: "اسم الفئة (عربي)",
  categoryNameEnglish: "اسم الفئة (إنجليزي)",
  categoryNameHebrew: "اسم الفئة (عبري)",
  categoryAdded: "تمت إضافة الفئة",
  categoryAddedSuccessfully: "تمت إضافة الفئة بنجاح",
  errorAddingCategory: "خطأ في إضافة الفئة",
  categoryUpdated: "تم تحديث الفئة",
  categoryUpdatedSuccessfully: "تم تحديث الفئة بنجاح",
  errorUpdatingCategory: "خطأ في تحديث الفئة",
  adding: "جاري الإضافة...",
  categoryNames: "أسماء الفئة",
  statistics: "الإحصائيات",

  // Admin Orders
  noOrdersWillAppearHere: "ستظهر الطلبات هنا",
  ordersWillAppearHere: "ستظهر الطلبات هنا عندما يقوم العملاء بتقديمها",
  openOrders: "الطلبات المفتوحة",
  processingOrders: "طلبات قيد التنفيذ",
  readyOrders: "طلبات جاهزة",
  cancelledOrders: "طلبات ملغية",
  // Admin Dashboard
  totalProducts: "إجمالي المنتجات",
  totalOrders: "إجمالي الطلبات",
  totalRevenue: "إجمالي الإيرادات",
  activeProducts: "المنتجات النشطة",
  thisMonth: "هذا الشهر",
  usersDistribution: "توزيع المستخدمين",
  productsByCategory: "المنتجات حسب الفئة",
  ordersAndRevenueTrend: "اتجاه الطلبات والإيرادات",
  recentActivity: "النشاط الأخير",
  newUserRegistered: "تم تسجيل مستخدم جديد",
  newOrderReceived: "تم استلام طلب جديد",
  orderCancelled: "تم إلغاء الطلب",
  revenue: "الإيرادات",
  totalRevenueHint: "إجمالي الإيرادات",
  pendingOrdersHint: "طلبات بانتظار المعالجة",
  orderDetails: "تفاصيل الطلب",
  unknownCustomer: "عميل غير محدد",
  andMore: "والمزيد...",
  lowStockProductsHint: "منتجات بحاجة لإعادة التوريد",

  // Address Management
  addAddress: "إضافة عنوان",
  addNewAddress: "إضافة عنوان جديد",
  editAddress: "تعديل العنوان",
  deleteAddress: "حذف العنوان",
  confirmDeleteAddress: "هل أنت متأكد من حذف هذا العنوان",
  actionCannotBeUndone: "لا يمكن التراجع عن هذا الإجراء",
  setAsDefault: "تعيين كافتراضي",
  updateAddress: "تحديث العنوان",
  deleting: "جاري الحذف...",

  // Admin Offers
  manageOffers: "إدارة العروض",
  addOffer: "إضافة عرض",
  addOfferDesc: "أدخل بيانات العرض الجديد",
  editOffer: "تعديل العرض",
  editOfferDesc: "تعديل بيانات العرض",
  deleteOffer: "حذف العرض",

  // Manual Order Creation
  addNewOrder: "إضافة طلبية جديدة",
  createOrder: "إنشاء طلبية",
  selectCustomer: "اختر العميل",
  selectPaymentMethod: "اختر طريقة الدفع",
  phoneNumber: "رقم الهاتف",
  orderItems: "عناصر الطلبية",
  addItem: "إضافة عنصر",
  selectProduct: "اختر المنتج",
  removeItem: "إزالة العنصر",
  totalAmount: "المبلغ الإجمالي",
  notes: "ملاحظات",
  creating: "جاري الإنشاء...",
  orderCreatedSuccessfully: "تم إنشاء الطلبية بنجاح",
  failedToCreateOrder: "فشل في إنشاء الطلبية",
  pleaseSelectCustomer: "يرجى اختيار العميل",
  pleaseAddAtLeastOneItem: "يرجى إضافة عنصر واحد على الأقل",
  pleaseSelectProduct: "يرجى اختيار المنتج",
  quantityMustBeGreaterThanZero: "يجب أن تكون الكمية أكبر من صفر",
  priceMustBeGreaterThanZero: "يجب أن يكون السعر أكبر من صفر",
  deleteOfferConfirmation: "هل أنت متأكد من حذف هذا العرض؟",
  noOffers: "لا توجد عروض",
  noOffersDesc: "لم يتم إنشاء أي عروض بعد",
  addFirstOffer: "إضافة أول عرض",
  titles: "العناوين",
  title: "العنوان",
  offerContent: "محتوى العرض",
  offerDetails: "تفاصيل العرض",
  dateAndStatus: "التاريخ والحالة",
  titleEnglish: "العنوان بالإنجليزية",
  titleArabic: "العنوان بالعربية",
  titleHebrew: "العنوان بالعبرية",
  discountPercent: "نسبة الخصم",
  discountAmount: "مبلغ الخصم",
  percentageDiscount: "خصم بالنسبة المئوية",
  fixedAmountDiscount: "خصم بمبلغ ثابت",
  invalidDiscountAmount: "مبلغ الخصم يجب أن يكون أكبر من 0",
  imageUrl: "رابط الصورة",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
  activeOffer: "عرض نشط",
  expired: "منتهي الصلاحية",
  pleaseCompleteRequiredFields: "يرجى إكمال الحقول المطلوبة",
  invalidDiscountPercent: "نسبة الخصم يجب أن تكون بين 1 و 100",
  endDateMustBeAfterStartDate: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  errorLoadingOffers: "خطأ في تحميل العروض",
  errorAddingOffer: "خطأ في إضافة العرض",
  errorUpdatingOffer: "خطأ في تحديث العرض",
  errorDeletingOffer: "خطأ في حذف العرض",
  offerAddedSuccessfully: "تم إضافة العرض بنجاح",
  offerUpdatedSuccessfully: "تم تحديث العرض بنجاح",
  offerDeletedSuccessfully: "تم حذف العرض بنجاح",
  noOfferSelected: "لم يتم تحديد عرض",
  unexpectedError: "حدث خطأ غير متوقع",

  // Banner Management
  manageBannersDescription: "إدارة البنرات المعروضة في الصفحة الرئيسية",
  addBanner: "إضافة بنر",
  addNewBanner: "إضافة بنر جديد",
  editBanner: "تعديل البنر",
  deleteBanner: "حذف البنر",
  subtitleArabic: "العنوان الفرعي بالعربية",
  subtitleEnglish: "العنوان الفرعي بالإنجليزية",
  subtitleHebrew: "العنوان الفرعي بالعبرية",
  enterTitleArabic: "أدخل العنوان بالعربية",
  enterTitleEnglish: "أدخل العنوان بالإنجليزية",
  enterTitleHebrew: "أدخل العنوان بالعبرية",
  enterSubtitleArabic: "أدخل العنوان الفرعي بالعربية",
  enterSubtitleEnglish: "أدخل العنوان الفرعي بالإنجليزية",
  enterSubtitleHebrew: "أدخل العنوان الفرعي بالعبرية",
  enterBannerLink: "أدخل رابط البنر",
  selectImage: "اختر صورة",
  changeImage: "تغيير الصورة",
  enterSortOrder: "أدخل ترتيب العرض",
  noBannersFound: "لا توجد بنرات",
  noBanners: "لا توجد بنرات بعد",
  noBannersDesc: "لم يتم إضافة أي بنر بعد. يمكنك البدء بإضافة أول بنر الآن!",
  addFirstBanner: "إضافة أول بنر",
  pleaseEnterAllTitles: "يرجى إدخال جميع العناوين",
  pleaseSelectImage: "يرجى اختيار صورة",
  bannerAddedSuccessfully: "تم إضافة البنر بنجاح",
  bannerUpdatedSuccessfully: "تم تحديث البنر بنجاح",
  bannerDeletedSuccessfully: "تم حذف البنر بنجاح",
  bannerStatusUpdated: "تم تحديث حالة البنر",
  errorAddingBanner: "خطأ في إضافة البنر",
  errorUpdatingBanner: "خطأ في تحديث البنر",
  errorDeletingBanner: "خطأ في حذف البنر",
  errorUpdatingBannerStatus: "خطأ في تحديث حالة البنر",
  deleteBannerConfirmation:
    "هل أنت متأكد من حذف هذا البنر؟ لا يمكن التراجع عن هذا الإجراء.",
  updateBanner: "تحديث البنر",
  optional: "اختياري",
  disableUser: "تعطيل المستخدم",
  enableUser: "تفعيل المستخدم",
  deleteUser: "حذف المستخدم",
  confirmDeleteUser: "هل أنت متأكد من حذف المستخدم؟",
  disabled: "معطل",
  enabled: "مفعل",
  showActivityLog: "عرض سجل النشاط",
  hideActivityLog: "إخفاء سجل النشاط",
  activityLog: "سجل نشاط الأدمن",
  details: "تفاصيل",
  date: "التاريخ",
  tracking: "تتبع الشحن",
  newCustomer: "عميل جديد",

  // --- Custom Statuses & UI ---
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
  favorites: "المفضلة",
  onSale: "تخفيضات",
  favoriteProducts: "منتجات مفضلة",
  clearAll: "مسح الكل",
  newOrders: "طلبات جديدة",
  ordersPendingProcessing: "طلبات بانتظار المعالجة",
  lowStockProducts: "منتجات منخفضة المخزون",
  restockNeededProducts: "منتجات بحاجة لإعادة التوريد",
  since2days: "منذ 2 يوم",
  lowStock: "منخفضة المخزون",
  stock: "المخزون",
  allStock: "كل المخزون",
  lowStockOnly: "منخفض المخزون فقط",
  allStatus: "كل الحالات",
  resetFilters: "إعادة تعيين الفلاتر",
  exportExcel: "تصدير Excel",
  updateProduct: "تحديث المنتج",

  // Image upload translations
  imagesUploaded: "صور مرفوعة",
  imageUploadedSuccess: "تم رفع الصور بنجاح",
  imageUploadFailed: "فشل رفع الصورة",
  uploadImage: "رفع صورة",
  uploading: "جاري الرفع...",
  removeImage: "حذف الصورة",
  dragAndDropArea: "منطقة رفع الصور",
  dragAndDropHint: "اسحب وأسقط الصور هنا أو اضغط لاختيار الملفات",

  sortByName: "ترتيب حسب الاسم",
  sortByProductCount: "ترتيب حسب عدد المنتجات",
  updateCategory: "تحديث الفئة",
  fillCategoryDetails: "يرجى تعبئة تفاصيل الفئة",
  preview: "معاينة",
  searchByCustomerOrOrder: "بحث بالعميل أو رقم الطلب",
  all: "الكل",
  cash: "نقداً",
  bankTransfer: "تحويل بنكي",
  fillAllRequiredFieldsCarefully:
    "يرجى تعبئة جميع الحقول المطلوبة بعناية. جميع الحقول بعلامة * مطلوبة.",
  customer: "العميل",
  searchOrSelectCustomer: "ابحث أو اختر العميل",
  shippingInfo: "معلومات الشحن",
  enterFullName: "أدخل الاسم الكامل",
  enterPhoneNumber: "أدخل رقم الهاتف",
  enterCity: "أدخل المدينة",
  enterArea: "أدخل المنطقة",
  enterStreet: "أدخل الشارع",
  buildingNumber: "رقم المبنى",
  enterBuildingNumber: "أدخل رقم المبنى",
  enterFloorOptional: "أدخل الطابق (اختياري)",
  apartmentNumber: "رقم الشقة",
  enterApartmentNumber: "أدخل رقم الشقة",
  addOrder: "إضافة الطلب",
  searchOrSelectProduct: "ابحث أو اختر المنتج",
  wholesalers: "تجار الجملة",
  retailers: "تجار التجزئة",
  exportUsersExcel: "تصدير المستخدمين (Excel)",
  adminRole: "مدير",
  id: "المعرف",
  accountActive: "الحساب فعال",
  accountDisabled: "الحساب معطل",
  lastAccountUpdate: "تاريخ اخر تعديل للحساب",
  order: "طلبية",
  backToOrders: "العودة للطلبيات",
  reorderFields: "ترتيب الحقول (اسحب وغير الترتيب):",
  facebookLink: "رابط فيسبوك",
  instagramLink: "رابط انستغرام",
  whatsappNumber: "رقم واتساب",
  saveChanges: "حفظ التغييرات",
  enterAdditionalNotesOptional: "أدخل ملاحظات إضافية (اختياري)",
  orderCreator: "منشئ الطلبية",
  orderCreatedFromAdminPanel:
    "تم إنشاء الطلب من قبل الأدمن",
  noFavorites: "لا يوجد منتجات مفضلة",
  addFavoritesHint: "أضف منتجات إلى المفضلة ليتم عرضها هنا",
  noFavoritesYet: "لم تقم بإضافة أي منتجات مفضلة بعد",
  minutesAgo: "منذ {count} دقيقة",
  hoursAgo: "منذ {count} ساعة",
  daysAgo: "منذ {count} يوم",
  now: "الآن",
  january: "يناير",
  february: "فبراير",
  march: "مارس",
  april: "أبريل",
  may: "مايو",
  june: "يونيو",
  july: "يوليو",
  august: "أغسطس",
  september: "سبتمبر",
  october: "أكتوبر",
  november: "نوفمبر",
  december: "ديسمبر",
  fillAllRequiredFields:
    "يرجى تعبئة جميع الحقول المطلوبة بعناية. جميع الحقول بعلامة * مطلوبة.",
  shareOnWhatsapp: "مشاركة على واتساب",
  updateDate: "تاريخ التحديث",
  customerInfo: "معلومات العميل",
  orderedProducts: "المنتجات المطلوبة",
  confirmDeleteOrder: "هل أنت متأكد أنك تريد حذف هذه الطلبية؟",
  orderDeletedSuccessfully: "تم حذف الطلبية بنجاح",
  areYouSureDeleteOrder: "هل أنت متأكد أنك تريد حذف هذه الطلبية؟",
  confirmDelete: "تأكيد الحذف",
  orderStatusUpdated: "تم تحديث حالة الطلبية",
  editOrder: "تعديل الطلبية",
  orderUpdatedSuccessfully: "تم تحديث الطلبية بنجاح",
  errorUpdatingOrder: "خطأ في تحديث الطلبية",
  errorDeletingOrder: "خطأ في حذف الطلبية",
  orderDetailsNotFound: "تفاصيل الطلبية غير موجودة",
  orderNotFound: "الطلبية غير موجودة",
  orderHistory: "سجل الطلبات",
  orderHistoryDescription: "عرض سجل الطلبات السابقة الخاصة بك",
  noOrderHistory: "لا يوجد سجل طلبات",
  customerName: "اسم العميل",
  customerEmail: "البريد الإلكتروني للعميل",
  accountStatusAndDates: "حالة الحساب وتواريخ التسجيل",
  accountActiveStatus: "حالة الحساب نشط",
  accountInactiveStatus: "حالة الحساب غير نشط",
  lastAccountActivity: "تاريخ آخر نشاط للحساب",
  orderStats: "إحصائيات الطلبات",
  totalOrdersPlaced: "إجمالي الطلبات المقدمة",
  updateUser: "تحديث المستخدم",
  userUpdatedSuccessfully: "تم تحديث بيانات المستخدم بنجاح",
  errorUpdatingUser: "خطأ في تحديث المستخدم",
  editUser: "تعديل بيانات المستخدم",
  deleteUserConfirmation:
    "هل أنت متأكد أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية.",
  userDeletedSuccessfully: "تم حذف المستخدم بنجاح",
  userDeleted: "تم حذف المستخدم بنجاح",
  userDisabledSuccess: "تم تعطيل المستخدم بنجاح",
  userEnabledSuccess: "تم تفعيل المستخدم بنجاح",
  userStatusUpdateFailed: "فشل في تحديث حالة المستخدم",
  editUserDescription: "قم بتعديل معلومات المستخدم وحفظ التغييرات.",
  adminSystem: "نظام الإدارة",
  wholesaleCustomer: "عميل جملة",
  retailCustomer: "عميل تجزئة",
  items: "العناصر",
  back: "رجوع",
  validUntil: "صالح حتى",
  viewOffer: "تفاصيل العرض",
  createdBy: "أنشأها",
  createdByAdmin: "أنشئت من الأدمن",
  cancelledByAdmin: "أُلغي بواسطة الأدمن",
  cancelledByUser: "أُلغي بواسطة المستخدم",
  contactInfoTitle: "معلومات اتصل بنا",
  fieldsOrderHint: "ترتيب الحقول (اسحب وغير الترتيب):",
  loadingContactInfo: "جاري تحميل معلومات الاتصال...",
  errorLoadingContactInfo: "خطأ في تحميل معلومات الاتصال",
  workingHoursPlaceholder: "مثال: من 9 صباحاً حتى 5 مساءً\nالجمعة مغلق",
  saving: "جاري الحفظ...",
  contactInfoUpdated: "تم تحديث المعلومات بنجاح",
  copy: "نسخ",
  whatsappChat: "محادثة واتساب",
  visitFacebook: "زيارة فيسبوك",
  visitInstagram: "زيارة انستغرام",
  working_hours: "ساعات العمل",
  drag_indicator: "سحب لتغيير الترتيب",
  searchByClientOrOrderNumber: "البحث بواسطة العميل أو رقم الطلب",
  payOnDeliveryDescription: "الدفع نقدا عند الاستلام",
  completeDirectPurchase: "إتمام الشراء المباشر",
  directPurchase: "شراء مباشر",
  editProfile: "تعديل الملف الشخصي",
  updateProfileSuccess: "تم تحديث الملف الشخصي بنجاح",
  changePassword: "تغيير كلمة المرور",
  currentPassword: "كلمة المرور الحالية",
  newPassword: "كلمة المرور الجديدة",
  confirmNewPassword: "تأكيد كلمة المرور الجديدة",
  passwordChanged: "تم تغيير كلمة المرور بنجاح",
  passwordChangeError: "خطأ في تغيير كلمة المرور",
  passwordChangeHint:
    "يرجى إدخال كلمة المرور الحالية وكلمة المرور الجديدة لتغييرها.",
  changePasswordHint: "تغيير كلمة المرور",
  passwordRequirements: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
  weakPassword: "كلمة مرور ضعيفة. يجب أن تحتوي على 6 أحرف على الأقل.",
  passwordMismatchError:
    "كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين.",
  newPasswordSameAsCurrent: "كلمة المرور الجديدة يجب أن تختلف عن الحالية.",
  currentPasswordIncorrect: "كلمة المرور الحالية غير صحيحة.",
  invalidLoginCredentials: "بيانات تسجيل الدخول غير صحيحة",
  passwordsDoNotMatch: "كلمتا المرور غير متطابقتين",

  addressSeparator: " - ",
  pageNotFound: "عذرًا، الصفحة غير موجودة.",
  returnToHome: "العودة للرئيسية",

  // Account Deleted
  accountDeletedTitle: "تم حذف حسابك",
  accountDeletedDescription: "تم حذف حسابك وجميع بياناتك من النظام. إذا كان لديك أي استفسار أو ترغب في استعادة حسابك، يرجى التواصل مع الدعم.",
  backToLoginButton: "العودة لتسجيل الدخول",

  // Orders
  orderStatusUpdatedSuccess: "تم تحديث حالة الطلب بنجاح",
  orderAddedSuccess: "تم إضافة الطلب بنجاح",
  orderEditedSuccess: "تم تعديل الطلب بنجاح",
  orderDeletedSuccess: "تم حذف الطلب بنجاح",
  userDeleteFailed: "فشل حذف المستخدم",
  orderStatusUpdateFailed: "فشل في تحديث حالة الطلب",
  selectCustomerRequired: "يرجى اختيار العميل أو تعبئة بيانات عميل جديد",
  addAtLeastOneProduct: "يرجى إضافة منتج واحد على الأقل",
  enterShippingInfo: "يرجى إدخال معلومات الشحن الأساسية",
  orderAddFailed: "فشل في إضافة الطلب",
  orderEditFailed: "فشل في تعديل الطلب",
  orderDeleteFailed: "فشل في حذف الطلب",
  orderMustHaveItems: "يجب أن يحتوي الطلب على عناصر",
  adminOrderInfoTitle: "طلب أنشئ من الأدمن",
  adminOrderInfoDesc: "تم إنشاء هذا الطلب من قبل الأدمن عبر لوحة التحكم. غالبًا تم إنشاؤه لمساعدتك أو بناءً على تواصلك مع خدمة العملاء.",
  profileUpdatedSuccessfully: "تم تحديث الملف الشخصي بنجاح",
  profileUpdateFailed: "فشل في تحديث الملف الشخصي",
  passwordChangedSuccessfully: "تم تغيير كلمة المرور بنجاح",
  passwordChangeFailed: "فشل في تغيير كلمة المرور",
  offersHidden: "العروض مخفية من واجهة المستخدم",
  offersVisible: "العروض ظاهرة للمستخدمين",
  loadingSetting: "جاري التحميل...",
  chooseSavedAddress: "اختر عنوانًا محفوظًا",
  chooseAddressPlaceholder: "اختر عنوان...",
  noAddressesFound: "لا يوجد عناوين محفوظة لهذا العميل",
  totalAfterDiscount: "المجموع النهائي بعد الخصم",
  discountType: "نوع الخصم",
  fixedAmount: "مبلغ ثابت", 
  discountValue: "قيمة الخصم",
  savings: "المبلغ الموفر",
  amount: "المبلغ",
  percent: "النسبة المئوية",
  unit: "الوحدة",
  userHasNoOrders: "لا يوجد طلبات لهذا المستخدم",
  userHasNoFavorites: "لا يوجد مفضلات لهذا المستخدم",
  searchOrders: "بحث في الطلبات...",
  noOrdersForStatus : "لا توجد طلبات لهذه الحالة",
  noOrdersForStatusDesc: "لا توجد طلبات في هذه الحالة حاليًا. جرب تغيير الفلاتر أو التحقق لاحقًا.",
  noOrdersFound: "لم يتم العثور على طلبات",
  tryChangingFilterToShowOtherOrders: "جرب تغيير الفلاتر أو البحث عن طلبات أخرى",
  orderDetailsNotAvailable: "تفاصيل الطلب غير متاحة",
  previous: "السابق",
  next: "التالي",
  itemsPerPage: "العناصر لكل صفحة",
  page: "الصفحة",
  loadingMore: "تحميل المزيد...",
  confirmEditOrder: "تأكيد تعديل الطلبية",
  areYouSureYouWantToSaveTheFollowingChanges: "هل أنت متأكد أنك تريد حفظ التغييرات التالية؟",
  item: "العنصر",
  oldValue: "القيمة السابقة",
  newValue: "القيمة الجديدة",
  atPrice : "بسعر",
  topSelling: "الأكثر مبيعًا",
  noTopProducts: "لا توجد منتجات مميزة",
  topProducts: "المنتجات المميزة",
  topSellingReport: "تقرير المنتجات الأكثر مبيعًا",
  reports: "التقارير",
  revenueReport: "تقرير الإيرادات",
  customersReport: "تقرير العملاء",
  adminUsersReport: "المستخدمون الإداريون",
  newUsersReport: "المستخدمون الجدد",
  completedOrdersReport: "الطلبات المكتملة",
  pendingOrdersReport: "الطلبات قيد الانتظار",
  shippingOrdersReport: "الطلبات قيد الشحن",
  paidOrdersReport: "الطلبات المدفوعة",
  cancelledOrdersReport: "الطلبات الملغاة",
  lowStockProductsReport: "المنتجات منخفضة المخزون",
  outOfStockProductsReport: "المنتجات منتهية المخزون",
  activeProductsReport: "المنتجات المفعلة",
  inactiveProductsReport: "المنتجات غير المفعلة",
  wholesaleUsersReport: "مستخدمو الجملة",
  retailUsersReport: "مستخدمو التجزئة",
  userCount: "عدد المستخدمين",
  customerCount: "عدد العملاء",
  orderCount: "عدد الطلبات",
  noRevenue: "لا توجد إيرادات",
  noCustomers: "لا يوجد عملاء",
  noAdmins: "لا يوجد مستخدمون إداريون",
  noNewUsers: "لا يوجد مستخدمون جدد",
  noCompletedOrders: "لا توجد طلبات مكتملة",
  noPendingOrders: "لا توجد طلبات قيد الانتظار",
  noProcessingOrders: "لا توجد طلبات قيد المعالجة",
  noShippingOrders: "لا توجد طلبات قيد الشحن",
  noPaidOrders: "لا توجد طلبات مدفوعة",
  noCancelledOrders: "لا توجد طلبات ملغاة",
  noLowStock: "لا توجد منتجات منخفضة المخزون",
  noOutOfStock: "لا توجد منتجات منتهية المخزون",
  noActiveProducts: "لا توجد منتجات مفعلة",
  noInactiveProducts: "لا توجد منتجات غير مفعلة",
  noTopSellingProducts: "لا توجد منتجات أكثر مبيعًا",
  processingOrdersReport: "الطلبات قيد المعالجة",
  readyOrdersReport: "الطلبات الجاهزة",
  salesCount: "عدد المبيعات",
  salesPercent: "نسبة المبيعات",
  barChart: "مخطط الأعمدة",
  totalSales: "إجمالي المبيعات",
  updateTopSellingNow: "تحديث المنتجات الأكثر مبيعًا الآن",
  topOrderedProducts: "المنتجات الأكثر طلبًا",
  learnMore: "اكتشف المزيد",
  shopNow: "تسوق الآن",
  topOrdered: "الأكثر طلبًا",

  // Navigation & Access Control Messages
  accessDenied: "تم رفض الوصول",
  accessDeniedMessage: "ليس لديك صلاحية للوصول إلى هذه الصفحة",
  adminAccessRequired: "صلاحيات الإدارة مطلوبة",
  redirectingToHomePage: "جاري إعادة التوجيه إلى الصفحة الرئيسية...",
  unauthorizedAccess: "وصول غير مصرح به",
  
  // Toast Messages for Operations
  operationSuccessful: "تمت العملية بنجاح",
  operationFailed: "فشلت العملية",
  dataLoadFailed: "فشل في تحميل البيانات",
  connectionError: "خطأ في الاتصال بالخادم",
  unexpectedErrorOccurred: "حدث خطأ غير متوقع",
  
  // Loading and Progress Messages
  loadingPage: "جاري تحميل الصفحة...",
  processingRequest: "جاري معالجة الطلب...",
  savingChanges: "جاري حفظ التغييرات...",
  deletingItem: "جاري حذف العنصر...",
  
  // Status Icons and Indicators
  statusPending: "⏳ قيد الانتظار",
  statusProcessing: "🔄 قيد المعالجة", 
  statusCompleted: "✅ مكتمل",
  statusCancelled: "❌ ملغي",
  statusShipped: "🚚 تم الشحن",
  statusDelivered: "📦 تم التسليم",
  
  // Date Formatting
  todayText: "اليوم",
  yesterdayText: "أمس",
  daysAgoText: "منذ {count} أيام",
  weeksAgoText: "منذ {count} أسابيع",
  monthsAgoText: "منذ {count} أشهر",
  
  // Additional UI Messages
  noActivityFound: "لا توجد أنشطة مسجلة",
  seeMore: "عرض المزيد",
  showAll: "عرض الكل",
  hideDetails: "إخفاء التفاصيل",
  showDetails: "عرض التفاصيل",
  
  // Common Actions for Activity Log  
  createAction: "إنشاء",
  updateAction: "تحديث", 
  deleteAction: "حذف",
  viewAction: "عرض",
  loginAction: "تسجيل دخول",
  logoutAction: "تسجيل خروج",
  orderAction: "طلب",
  userAction: "مستخدم",
  productAction: "منتج",
  categoryAction: "فئة",
  
  // Responsive Messages
  mobileViewOptimized: "تم تحسين العرض للهواتف",
  desktopViewOptimized: "تم تحسين العرض لأجهزة الكمبيوتر",
  
  // Enhanced Dialog
  confirm: "تأكيد",
  ok: "موافق",
  
  // Search Results
  searchingFor: "البحث عن",
  of: "من",
  results: "نتيجة", 
  found: "تم العثور عليها",
  breadcrumb: "مسار التصفح",
  limitedStock: "كمية محدودة",
  new: "جديد",
  priceDrop: "خصم",
  
  // System Test Page
  systemTestPage: "صفحة فحص النظام",
  systemTestDescription: "فحص شامل لجميع وظائف وميزات النظام",
  runningTests: "جاري تشغيل الاختبارات...",
  runSystemTests: "تشغيل فحص النظام",
  testToast: "اختبار الإشعارات",
  testToastMessage: "هذه رسالة اختبار للتوست!",
  systemTestCompleted: "اكتمل فحص النظام بنجاح!",
  systemTestComplete: "اكتمل فحص النظام",
  systemTestSummary: "تم فحص جميع المكونات الأساسية للنظام",

  // Additional translations for hard-coded strings
  enterArabicTitlePlaceholder: "أدخل العنوان بالعربية",
  enterArabicDescriptionPlaceholder: "أدخل الوصف بالعربية",
  categoriesLoading: "جاري التحميل...",
  categoriesLoadError: "خطأ في تحميل الفئات",
  noOffersDataFound: "لم يتم العثور على بيانات العروض",
  orderFileDownloaded: "📎 تم تحميل ملف الطلب — يمكنك الآن إرساله كمرفق على واتساب ✅",
  invalidPhoneFormat: "رقم الجوال يجب أن يبدأ بـ 05 ويكون مكونًا من 10 أرقام",
  passwordRequirement: "كلمة السر يجب أن تكون 6 أحرف على الأقل وتحتوي على رقم",
  noUserEmail: "لا يوجد بريد إلكتروني للمستخدم",
  enterCurrentPassword: "يرجى إدخال كلمة السر الحالية",
  newPasswordDifferent: "كلمة السر الجديدة يجب أن تختلف عن الحالية",
  showAllProducts: "عرض الكل",
  showTopSellingProducts: "عرض الأكثر مبيعاً",
  topSellingProducts: "الأكثر مبيعاً",
  orderCancelledByAdmin: "ألغي الطلب بواسطة الأدمن",
  errorAddingToCartLog: "خطأ في إضافة المنتج للسلة:",
  errorProcessingOrderLog: "خطأ في عملية الشراء المباشر:",
  pleaseLoginToCheckout: "يرجى تسجيل الدخول لإتمام عملية الدفع",
  noInternetConnection: "لا يوجد اتصال بالإنترنت",
  emailResendFailed: "فشل في إعادة إرسال البريد الإلكتروني",
  emailResendSuccess: "تم إعادة إرسال البريد الإلكتروني بنجاح",
  errorPlacingOrder: "خطأ في إتمام الطلب",
  productLowStock: "المنتج في مخزون منخفض",
  outOfStockProducts: "المنتجات منتهية المخزون",

  // Additional Banner Management Keys
  bannerManagement: "إدارة البانرات",
  searchBanners: "البحث في البانرات...",
  newestFirst: "الأحدث أولاً",
  oldestFirst: "الأقدم أولاً",
  titleAZ: "العنوان أ-ي",
  titleZA: "العنوان ي-أ",
  sortOrderAsc: "الترتيب ↑",
  sortOrderDesc: "الترتيب ↓",
  tryModifyingSearchOrFilters: "جرب تعديل البحث أو المرشحات",
  startByCreatingFirstBanner: "ابدأ بإنشاء أول بانر",
  createFirstBanner: "إنشاء أول بانر",
  errorLoadingBanners: "خطأ في تحميل البانرات",
  failedToLoadBanners: "فشل في تحميل البانرات. يرجى المحاولة مرة أخرى.",
  bannerCreatedSuccessfully: "تم إنشاء البانر بنجاح!",
  failedToCreateBanner: "فشل في إنشاء البانر",
  createBanner: "إنشاء بانر",
  failedToUpdateBanner: "فشل في تحديث البانر",
  failedToDeleteBanner: "فشل في حذف البانر",
  banners: "البانرات",
  banner: "بانر",
  activated: "تفعيل",
  deactivated: "إلغاء تفعيل",
  successfully: "البانر بنجاح!",
  failedToUpdateBannerStatus: "فشل في تحديث حالة البانر",
  deleteConfirmationMessage: "هل أنت متأكد من أنك تريد حذف هذا البانر؟ هذا الإجراء لا يمكن التراجع عنه.",
  deleteConfirm: "حذف نهائياً",
  enterDescriptionArabic: "أدخل وصف البانر بالعربية",
  enterDescriptionEnglish: "أدخل وصف البانر بالإنجليزية", 
  enterDescriptionHebrew: "أدخل وصف البانر بالعبرية",
  totalBanners: "إجمالي البانرات",
  activeBanners: "النشطة",
  bannersWithImages: "بصور",
  bannersWithLinks: "بروابط",
  untitledBanner: "بانر بدون عنوان",
  hasLink: "له رابط",
  noLink: "بدون رابط",
  subtotal: "المجموع",
  shipping: "الشحن",
  bankTransferDescription: "الدفع عن طريق التحويل البنكي",
  free: "مجاني",
  emailConfirmationSent: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني وتأكيد حسابك",
  signupFailedCreateAccount: "فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى",
  userNotLoggedIn: "المستخدم غير مسجل الدخول",
  
  // Data error messages
  noUsersDataFound: "لم يتم العثور على بيانات المستخدمين",
  noOrdersDataFound: "لم يتم العثور على بيانات الطلبات",
  noCategoriesDataFound: "لم يتم العثور على بيانات الفئات",
  noProductsDataFound: "لم يتم العثور على بيانات المنتجات",
  
  // Admin operations
  categoryAddFailed: "لم يتم إضافة الفئة",
  productAddFailed: "لم يتم إضافة المنتج",
  invalidCredentials: "بيانات الدخول غير صحيحة",
  serverError: "خطأ في الخادم، يرجى المحاولة لاحقاً",
  // Activity Log Enhanced
  changesDetails: "تفاصيل التغييرات",
  fieldChanged: "تم تغيير الحقل",
  fromValue: "من",
  toValue: "إلى",
  multipleChanges: "تحديث متعدد",
  changes: "تغييرات",
  changesSummary: "ملخص التغييرات",
  targetField: "الحقل المعدل",
  changeHistory: "تاريخ التغييرات",
  noChangesRecorded: "لم يتم تسجيل تغييرات",
  activityLogEnhanced: "سجل النشاط المحسن",

  prices: "الأسعار",
  activeOnly: "نشط فقط",
  inactiveOnly: "غير نشط فقط",
  remove: "إزالة",

  //order invoice
  orderInvoice: "فاتورة الطلب",
  printedAt: "تمت الطباعة في",
  printedBy: "تمت الطباعة بواسطة",
  orderPrint: "طباعة الطلبية",
  downloadOrder: "تحميل الطلبية",
  downloadPdf: "تحميل PDF",

  // Touch & Swipe Navigation
  swipeToNavigate: "اسحب للتنقل",
  swipeToNavigateImages: "اسحب للتنقل بين الصور",
  swipeLeft: "اسحب يساراً",
  swipeRight: "اسحب يميناً",
  touchToNavigate: "المس للتنقل",
  swipeGestures: "إيماءات السحب",
  touchSupported: "دعم اللمس متوفر",

  noBestSellingProducts: "لا يوجد منتجات أكثر مبيعاً حالياً",
  from: "من",
  noSearchResults: "لا توجد نتائج للبحث",
  tryDifferentSearch: "جرب بحثاً مختلفاً",
  clearSearch: "مسح البحث",
  // Activity Log
  activityDetails: "تفاصيل النشاط",
  actionPerformed: "العملية المنفذة",
  actionId: "معرف العملية",
  adminInfo: "معلومات المدير",
  whoPerformedAction: "من قام بالعملية",
  targetUser: "المستخدم المستهدف",
  affectedUser: "المستخدم المتأثر بالعملية",
  changeDetails: "تفاصيل التغيير",
  whatChanged: "ما الذي تم تغييره",
  changedField: "الحقل المتغير",
  additionalDetails: "تفاصيل إضافية",
  moreInfo: "معلومات إضافية عن العملية",
  totalActivities: "إجمالي العمليات",
  deletions: "حذف",
  disables: "تعطيل",
  enables: "تفعيل",
  updates: "تحديث",
  admins: "مدراء",
  affectedUsers: "مستخدمين متأثرين",
  noActivities: "لا توجد عمليات",
  noActivitiesDescription: "لم يتم تسجيل أي نشاط للأدمن بعد",
  adminActivityDescription: "سجل جميع عمليات الأدمن على النظام",
  dateAndDetails: "التاريخ والتفاصيل",
  
  // Activity Log Dialog
  deletedUserInfo: "معلومات المستخدم المحذوف",
  userName: "اسم المستخدم",
  multipleUpdatesInfo: "معلومات التحديث المتعدد",
  numberOfChanges: "عدد التغييرات",
  operationType: "نوع العملية",
  bulkOperation: "عملية متعددة",
  bulkOperationNote: "تم تحديث عدة عناصر في نفس الوقت",
  adminDetails: "تفاصيل المدير",
  adminName: "اسم المدير",
  adminEmail: "بريد المدير",
  affectedUserDetails: "تفاصيل المستخدم المتأثر",
  userEmail: "بريد المستخدم",
  operationTime: "وقت العملية",
  time: "الوقت",
  otherInfo: "معلومات أخرى",
  relevantInfo: "معلومات ذات صلة",
  noAdditionalInfo: "لا توجد معلومات إضافية",
  
  // Field and Value Labels  
  accountStatus: "حالة الحساب",
  enabledStatus: "مفعل",
  disabledStatus: "معطل",
  arabicLang: "العربية",
  englishLang: "الإنجليزية",
  hebrewLang: "العبرية",
  previousValue: "القيمة السابقة",
  currentValue: "القيمة الجديدة",
  yes: "نعم",
  no: "لا",
  
  // Activity Log Filters
  logFilters: "فلاتر السجل",
  fromDate: "من تاريخ",
  toDate: "إلى تاريخ",
  actionType: "نوع الإجراء",
  selectAction: "اختر الإجراء",
  allActions: "جميع الإجراءات",
  searchInLog: "البحث في السجل",
  resetLogFilters: "إعادة تعيين الفلاتر",
  showingLogResults: "عرض {{count}} من أصل {{total}} نتيجة",
  
  // User Management Filters
  userFilters: "فلاتر المستخدمين",
  selectUserType: "اختر نوع المستخدم",
  selectStatus: "اختر الحالة",
  selectSort: "اختر الترتيب",
  filterResults: "نتائج الفلترة",
  confirmedUsers: "مستخدمين مؤكدين",
  disabledUsers: "مستخدمين معطلين",
  showingUsers: "عرض {{count}} مستخدم",
  desc: "تنازلي",
  asc: "تصاعدي",
  adminActivityLog: "سجل نشاط الأدمن",
  trackAdminActions: "تتبع إجراءات المدراء على المستخدمين",
  export: "تصدير",
  
  // Date Filter for Dashboard
  dateFilter: "فلتر التاريخ",
  selectedPeriod: "الفترة المختارة",
  fromDateFilter: "من",
  toDateFilter: "إلى",
  last7Days: "آخر 7 أيام",
  last30Days: "آخر 30 يوم",
  last90Days: "آخر 90 يوم",
  thisYear: "هذا العام",
  filteredStatistics: "الإحصائيات المفلترة",
  newProducts: "منتجات جديدة",
  newUsers: "مستخدمون جدد",
  filterApplied: "فلتر مطبق",
  
  // Pagination
  showingResults: "عرض",
  paginationOf: "من",
  paginationResults: "نتيجة",
  first: "الأول",
  last: "الأخير",
  
  // User Activity Labels
  unknownUser: "مستخدم غير معروف",
  unknownAdmin: "مدير غير معروف", 
  emailNotAvailable: "البريد غير متوفر",
  userUpdate: "تحديث بيانات المستخدم",
  userDelete: "حذف المستخدم", 
  userDisable: "تعطيل المستخدم",
  userEnable: "تفعيل المستخدم",
  createUser: "إنشاء مستخدم جديد",
  userLogin: "دخول المستخدم",
  userLogout: "خروج المستخدم",
  profileUpdate: "تحديث الملف الشخصي",
  userTypeChange: "تغيير نوع المستخدم",
  userUnavailable: "مستخدم غير متوفر",

  offerType: "نوع العرض",
  regularDiscount: "خصم على كل المنتجات",
  productDiscount: "خصم على منتج معين",
  on: "على",
  buyGetOffer: "اشترِ واحصل على عرض",
  linkedProduct: "منتج مرتبط",
  buyQuantity : "اشترِ كمية",
  getProduct: "احصل على المنتج",
  getDiscountType: "احصل على نوع الخصم",
  discountPercentage: "نسبة الخصم",
  fixedDiscount: "خصم ثابت",
  getDiscount: "احصل على خصم",
  getFree: "احصل على منتج مجاني",
  buy: "اشترِ",

  // نصوص العروض الإضافية
  totalOffers: "إجمالي العروض",
  appliedOffers: "العروض المطبقة",
  youSave: "توفر",
  offerAnalytics: "تحليلات العروض",
  performanceScore: "نقاط الأداء",
  usageCount: "عدد الاستخدامات",
  totalDiscount: "إجمالي الخصم",
  averageDiscount: "متوسط الخصم",
  offerPerformance: "أداء العرض",
  excellent: "ممتاز",
  
  // Product Details Offers
  specialDiscount: "خصم خاص",
  good: "جيد",
  fair: "مقبول",
  poor: "ضعيف",
  noUsage: "لم يُستخدم بعد",
  offText: "خصم",
  offerValue: "قيمة",
  offerStats: "إحصائيات العرض",
  offerDiscount: "إجمالي الخصومات",
  offerOrders: "عدد الطلبات",
  offersDiscount: "خصم العروض",
  overallStats: "الإحصائيات العامة",
  activeOffers: "العروض النشطة", 
  totalUsage: "إجمالي الاستخدامات",
  totalSavings: "إجمالي التوفير",
  bestPerformingOffer: "أفضل عرض أداءً",
  expiringSoon: "تنتهي قريباً",
  offersExpireWithinWeek: "عروض تنتهي خلال أسبوع",
  usages: "مرات",
  saved: "وفر",
  moderate: "متوسط",
  validFrom: "صالح من",
  validTo: "صالح حتى",
  performance: "الأداء",
  freeItems: "عناصر مجانية",
  freeItem: "عنصر مجاني",
  fromOffer: "من العرض",
  averageOrderValue: "متوسط قيمة الطلب",
  conversionRate: "معدل التحويل",
  statisticsPeriod: "فترة الإحصائيات",
  value: "قيمة",

  freeProductsDiscount: "خصم المنتجات المجانية",

  // Product Variants
  hasVariants: "يحتوي على فيرنتس",
  variants: "الفيرنتس",
  variantsNote: "ملاحظة: يمكنك إدارة الفيرنتس بعد إضافة المنتج من خلال قائمة المنتجات",
  manageVariants: "إدارة الفيرنتس",
  manageProductVariants: "إدارة فيرنتس المنتج",
  selectVariant: "اختر المواصفات",
  pleaseSelectOption: "يرجى اختيار",
  pleaseSelectAllVariants: "يرجى اختيار جميع المواصفات المطلوبة",
  variantNotAvailable: "هذا الخيار غير متوفر",
  moreOptionsAvailable: "خيارات أخرى متاحة",
  
  // Variant Management
  options: "الخيارات",
  addNewOption: "إضافة خيار جديد",
  optionName: "اسم الخيار",
  optionValues: "قيم الخيار",
  optionNamePlaceholder: "مثل: اللون، الحجم",
  optionValuesPlaceholder: "أحمر، أزرق، أخضر",
  pleaseEnterOptionNameAndValues: "يرجى إدخال اسم الخيار والقيم",
  pleaseEnterValidValues: "يرجى إدخال قيم صحيحة",
  optionAdded: "تم إضافة الخيار",
  optionDeleted: "تم حذف الخيار",
  generateAllVariants: "توليد جميع الفيرنتس",
  pleaseAddOptionsFirst: "يرجى إضافة الخيارات أولاً",
  generating: "جاري التوليد...",
  variantsGenerated: "تم توليد الفيرنتس",
  noVariantsYet: "لا توجد فيرنتس بعد",
  addOptionsFirstThenGenerate: "أضف الخيارات أولاً ثم قم بتوليد الفيرنتس",
  pleaseAddVariantsOrRemoveOptions: "يرجى إضافة فيرنتس أو إزالة الخيارات",
  pleaseCompleteVariantData: "يرجى إكمال بيانات جميع الفيرنتس",
  variantsSaved: "تم حفظ الفيرنتس",
  errorSavingVariants: "خطأ في حفظ الفيرنتس",
  previouslyUsedOptions: "خيارات مستخدمة سابقاً",
  addValue: "إضافة قيمة",
  optionValuePlaceholder: "مثل: أحمر، كبير",
  updateOption: "تحديث الخيار",
  addOption: "إضافة الخيار",
  editingOption: "تعديل الخيار",
  optionUpdated: "تم تحديث الخيار",
  valuesAddedToExistingOption: "تم إضافة القيم للخيار الموجود",
  pleaseEnterOptionName: "يرجى إدخال اسم الخيار",
  variantDeleted: "تم حذف الفيرنت",
  expand: "توسيع",
  collapse: "طي",
  variantImage: "صورة الفيرنت",
  uploadVariantImage: "رفع صورة الفيرنت",
  
  // Bulk Edit Features
  bulkEdit: "تحرير مجمع",
  bulkEditVariants: "تحرير مجمع للفيرنتس",
  selectAll: "تحديد الكل",
  selectNone: "إلغاء التحديد",
  selectedVariants: "فيرنتس محددة",
  selectedVariant: "الفيرنت المحدد",
  applyToSelected: "تطبيق على المحدد",
  bulkPrice: "السعر المجمع",
  bulkWholesalePrice: "سعر الجملة المجمع",
  bulkStockQuantity: "الكمية المجمعة",
  bulkInStock: "الحالة المجمعة",
  bulkActive: "النشاط المجمع",
  applyBulkChanges: "تطبيق التغييرات المجمعة",
  bulkChangesApplied: "تم تطبيق التغييرات المجمعة",
  exitBulkEdit: "إنهاء التحرير المجمع",
  enableBulkEdit: "تفعيل التحرير المجمع",
  clearSelection: "مسح التحديد",
  selected: "المحدد",
  newPrice: "سعر جديد",
  newWholesalePrice: "سعر جملة جديد",
  newStockQuantity: "كمية جديدة",
  applyBulkEdit: "تطبيق التحرير المجمع",

  optionNameHebrew: "اسم الخيار (بالعبرية)",
  optionNameEnglish: "اسم الخيار (بالإنجليزية)",
  enterEnglishName: "يرجى إدخال اسم الخيار (بالإنجليزية)",
  enterHebrewName: "يرجى إدخال اسم الخيار (بالعبرية)",
  valueHebrewPlaceholder: "مثل: אדום, גדול",
  valueEnglishPlaceholder: "مثل: Red, Large",
  regenerateSkus: "إعادة توليد SKUs",
  skusRegenerated: "تم إعادة توليد SKUs",
  fullUsage: "استخدام كامل",
  optionNameOnly: "اسم الخيار فقط",
  getVariantScope: "الحصول على نطاق الفيرنت",
  specificVariants: "فيرنتس محددة",
  allVariants: "جميع الفيرنتس",
  youSaved: "لقد وفرت",
  buyVariantScope: "تطبيق شرط الشراء على",

  // مفاتيح مفقودة لإكمال الترجمة
  phoneMustBe10Digits: "رقم الهاتف يجب أن يكون 10 أرقام",
  phoneMustStartWith05: "رقم الهاتف يجب أن يبدأ بـ 05",
  phoneOnlyNumbers: "رقم الهاتف يجب أن يحتوي على أرقام فقط",
  searchInput: "حقل البحث",
  viewYourOrders: "عرض طلباتك",
  unknownProduct: "منتج غير معروف",
  manualDiscount: "خصم يدوي",
  noPhone: "لا يوجد رقم هاتف",

};
