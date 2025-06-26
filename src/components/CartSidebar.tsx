import * as React from "react";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/utils/languageContextUtils";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { state, updateQuantity, removeItem, getTotalItems } = useCart();
  const cartItems = state.items;
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const enhancedToast = useEnhancedToast();

  // دالة مخصصة للتعامل مع الدفع
  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      enhancedToast.error(t("pleaseLoginToCheckout"));
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} h-full w-full sm:max-w-md bg-white z-50 transform transition-transform duration-300 shadow-2xl ${
          isOpen
            ? "translate-x-0"
            : isRTL
              ? "-translate-x-full"
              : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">{t("cart")}</h2>
              {getTotalItems() > 0 && (
                <Badge variant="secondary">{getTotalItems()}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10"
              aria-label="إغلاق السلة" /* Close cart */
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

          {/* Content */}
          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 p-4 sm:p-6">
              <ShoppingBag className="h-16 w-16 sm:h-24 sm:w-24 text-gray-300" />
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                  {t("cartEmpty")}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">{t("noProductsAdded")}</p>
                <Button onClick={onClose} asChild className="text-sm sm:text-base">
                  <Link to="/products">{t("browseProducts")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <ScrollArea className="flex-1 p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg animate-fade-in"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-2">
                          {item.product.name}
                        </h4>
                        <p className="text-primary font-bold text-xs sm:text-sm">
                          {item.product.price} {t("currency")}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                  item.product.id,
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>

                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                  item.product.id,
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(item.id, item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t("total")}:</span>
                  <span className="text-2xl font-bold text-primary">
                    {state.total.toFixed(2)} {t("currency")}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button className="w-full" size="lg" asChild>
                    <Link to="/checkout" onClick={handleCheckoutClick}>
                      {t("checkout")}
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onClose}
                    asChild
                  >
                    <Link to="/products">{t("continueShopping")}</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
