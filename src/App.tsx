import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { lazy, Suspense, memo, useEffect, useRef, useState, useCallback } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { getSetting } from "@/services/settingsService";
import MobileBottomNavBar from "@/components/MobileBottomNavBar";
import Header from "@/components/Header";
import CartSidebar from "@/components/CartSidebar";
import { useConnectionMonitor } from "@/hooks/useConnectionMonitor";
import ErrorBoundary from "@/components/ErrorBoundary";
import SEO from "@/components/SEO";
import PerformanceMonitorComponent from "@/components/PerformanceMonitor";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NativeSplashScreen } from "@/components/splash";
import { useSplash } from "@/hooks/useSplash";

// Critical pages - Regular imports for initial load
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AccountDeleted from "@/pages/AccountDeleted";

// Lazy load all other pages for better performance
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const EmailConfirmation = lazy(() => import("./pages/EmailConfirmation"));

// Lazy load less frequently accessed pages with preload hints
const Orders = lazy(() =>
  import("./pages/Orders").then((module) => ({ default: module.default })),
);
const Profile = lazy(() =>
  import("./pages/Profile").then((module) => ({ default: module.default })),
);
const Contact = lazy(() =>
  import("./pages/Contact").then((module) => ({ default: module.default })),
);
const Offers = lazy(() =>
  import("./pages/Offers").then((module) => ({ default: module.default })),
);
const Checkout = lazy(() =>
  import("./pages/Checkout").then((module) => ({ default: module.default })),
);
const AdminDashboard = lazy(() =>
  import("./pages/AdminDashboard").then((module) => ({
    default: module.default,
  })),
);
const CartPage = lazy(() => import("./pages/Cart"));
const SystemTest = lazy(() => import("./pages/SystemTest"));

// Enhanced loading component with better UX
const PageLoader = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p className="text-gray-600 animate-pulse">Loading...</p>
  </div>
));

const LoadingSpinner = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground animate-pulse">
        جاري التحميل...
      </p>
    </div>
  </div>
));

// Preload critical routes
const preloadRoutes = () => {
  const routes = [Products, Categories, ProductDetails];
  routes.forEach((route) => {
    const componentImport = route as unknown;
    if (typeof componentImport === "function") {
      setTimeout(() => (componentImport as () => void)(), 100);
    }
  });
};

// Component to trigger preloading
const RoutePreloader = memo(() => {
  useEffect(() => {
    // Preload critical routes after initial render
    const preloadRoutesAsync = async () => {
      try {
        await Promise.all([
          import("./pages/Products"),
          import("./pages/Categories"),
          import("./pages/ProductDetails"),
        ]);
      } catch (error) {
        console.warn("Route preloading failed:", error);
      }
    };

    // Delay preloading to not interfere with initial render
    const timer = setTimeout(preloadRoutesAsync, 2000);
    return () => clearTimeout(timer);
  }, []);
  return null;
});

// Enhanced QueryClient configuration for better performance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Component to handle connection monitoring and smart refresh
const ConnectionManager = memo(() => {
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = createQueryClient();
  }
  const queryClient = queryClientRef.current;

  // مراقبة الاتصال
  const { isOnline } = useConnectionMonitor({
    onReconnect: useCallback(() => {
      console.log("Connection restored, refreshing data...");
      queryClient.refetchQueries({ type: "all" });
    }, [queryClient]),
  });

  // عرض رسالة عدم الاتصال
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
        لا يوجد اتصال بالإنترنت
      </div>
    );
  }

  return null;
});

// إخفاء جميع console.log إلا في بيئة الاختبار فقط
if (typeof console !== "undefined" && typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "test") {
  console.log = () => {};
}

const App = () => {
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }
  const queryClient = queryClientRef.current;

  // استخدام هوك السبلاش
  const { showSplash, isInitialized, handleSplashFinish, duration } = useSplash({
    duration: 3500,
    enableOnMobile: true,
    enableOnDesktop: false
  });

  const [hideOffers, setHideOffers] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openCart, setOpenCart] = useState(false);

  // عرض صفحة السبلاش إذا كانت مطلوبة - داخل LanguageProvider
  const SplashWrapper = () => {
    if (showSplash) {
      return (
        <LanguageProvider>
          <NativeSplashScreen onFinish={handleSplashFinish} duration={duration} />
        </LanguageProvider>
      );
    }
    return null;
  };

  // عرض السبلاش مع دعم الترجمة
  if (showSplash) {
    return <SplashWrapper />;
  }

  // انتظار التهيئة
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // useEffect(() => {
  //   getSetting('hide_offers_page').then(val => setHideOffers(val === 'true'));
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <ScrollToTop />
          <ErrorBoundary>
            <LanguageProvider>
              <AuthProvider>
                <CartProvider>
                  <TooltipProvider>
                    <div className="min-h-screen bg-background font-sans antialiased">
                      <SEO />
                      <Toaster />
                      <Sonner />
                      <PerformanceMonitorComponent />
                      <ConnectionManager />
                      <RoutePreloader />
                      <AppHeaderWrapper
                        setOpenCart={setOpenCart}
                        setOpenMobileMenu={setOpenMobileMenu}
                        openMobileMenu={openMobileMenu}
                        openCart={openCart}
                      />
                      <CartSidebar
                        isOpen={openCart}
                        onClose={() => setOpenCart(false)}
                      />
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          <Route
                            path="/"
                            element={<Index />}
                          />
                          <Route path="/auth" element={<Auth />} />
                          <Route
                            path="/email-confirmation"
                            element={<EmailConfirmation />}
                          />
                          <Route path="/products" element={<Products />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route
                            path="/product/:id"
                            element={<ProductDetails />}
                          />
                          <Route
                            path="/offers"
                            element={
                              hideOffers ? (
                                <Navigate to="/" replace />
                              ) : (
                                <Suspense fallback={<PageLoader />}>
                                  <Offers />
                                </Suspense>
                              )
                            }
                          />
                          <Route
                            path="/contact"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Contact />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/cart"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <CartPage />
                              </Suspense>
                            }
                          />

                          {/* Protected Routes */}
                          <Route
                            path="/orders"
                            element={
                              <ProtectedRoute>
                                <Suspense fallback={<PageLoader />}>
                                  <Orders />
                                </Suspense>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <Suspense fallback={<PageLoader />}>
                                  <Profile />
                                </Suspense>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/checkout"
                            element={
                              <ProtectedRoute>
                                <Suspense fallback={<PageLoader />}>
                                  <Checkout />
                                </Suspense>
                              </ProtectedRoute>
                            }
                          />

                          {/* Admin Routes */}
                          <Route
                            path="/admin/*"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Suspense fallback={<PageLoader />}>
                                  <AdminDashboard />
                                </Suspense>
                              </ProtectedRoute>
                            }
                          />

                          {/* System Test Route - Admin Only */}
                          <Route
                            path="/system-test"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Suspense fallback={<PageLoader />}>
                                  <SystemTest />
                                </Suspense>
                              </ProtectedRoute>
                            }
                          />

                          {/* Catch-all route */}
                          <Route
                            path="/account-deleted"
                            element={<AccountDeleted />}
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                      {/* البوتوم ناف بار يظهر فقط على الجوال */}
                      <MobileBottomNavBarWrapper
                        onMenuClick={() => {
                          setOpenMobileMenu(true);
                          setOpenCart(false);
                        }}
                        onCartClick={(open) => {
                          setOpenCart(open);
                          setOpenMobileMenu(false);
                        }}
                        onHomeClick={() => {
                          setOpenCart(false);
                          setOpenMobileMenu(false);
                          window.location.pathname = "/";
                        }}
                      />
                    </div>
                  </TooltipProvider>
                </CartProvider>
              </AuthProvider>
            </LanguageProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;

function AppHeaderWrapper(props: {
  setOpenCart: (b: boolean) => void;
  setOpenMobileMenu: (b: boolean) => void;
  openMobileMenu: boolean;
  openCart: boolean;
}) {
  const location = useLocation();
  
  if (location.pathname.startsWith("/admin") || location.pathname === "/auth")
    return null;
  return (
    <Header
      onCartClick={() => props.setOpenCart(true)}
      onMenuClick={() => props.setOpenMobileMenu(true)}
      mobileMenuOpen={props.openMobileMenu}
      setMobileMenuOpen={props.setOpenMobileMenu}
    />
  );
}

// MobileBottomNavBarWrapper لإخفاء البوتوم بار في صفحات لوحة الإدارة
function MobileBottomNavBarWrapper(props: {
  onMenuClick: () => void;
  onCartClick: (open: boolean) => void;
  onHomeClick: () => void;
}) {
  const location = useLocation();
  // طباعة المسار الحالي للتشخيص
  if (typeof window !== 'undefined') {
    console.log('MobileBottomNavBarWrapper pathname:', location.pathname);
  }
  if (location.pathname.startsWith("/admin")) return null;
  return (
    <div className="md:hidden">
      <MobileBottomNavBar {...props} />
    </div>
  );
}
