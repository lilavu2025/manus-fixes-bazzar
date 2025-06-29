import React from 'react';
import CartSidebar from '@/components/CartSidebar';

const CartPage: React.FC = () => {
  // يمكنك إضافة أي منطق إضافي للصفحة هنا إذا أردت
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <CartSidebar isOpen={true} onClose={() => window.history.back()} />
    </div>
  );
};

export default CartPage;
