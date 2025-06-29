import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";

interface EnhancedBreadcrumbItem {
  label: string;
  href?: string;
  translationKey?: string;
}

interface EnhancedBreadcrumbProps {
  items?: EnhancedBreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const EnhancedBreadcrumb: React.FC<EnhancedBreadcrumbProps> = ({
  items = [],
  className = "",
  showHome = true,
}) => {
  const { t, isRTL } = useLanguage();
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if no items provided
  const generateBreadcrumbs = (): EnhancedBreadcrumbItem[] => {
    const pathnames = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: EnhancedBreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({
        label: t("home"),
        href: "/",
        translationKey: "home",
      });
    }

    pathnames.forEach((pathname, index) => {
      const href = `/${pathnames.slice(0, index + 1).join("/")}`;
      
      // Map common paths to translation keys
      const pathTranslations: { [key: string]: string } = {
        products: "products",
        categories: "categories",
        orders: "orders",
        profile: "profile",
        admin: "dashboard",
        dashboard: "dashboard",
        contact: "contact",
        cart: "cart",
        checkout: "checkout",
        auth: "login",
      };

      const translationKey = pathTranslations[pathname];
      
      breadcrumbs.push({
        label: translationKey ? t(translationKey) : pathname,
        href: index === pathnames.length - 1 ? undefined : href, // Last item shouldn't be clickable
        translationKey,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb for single item
  }

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm text-gray-600 ${isRTL ? "rtl space-x-reverse" : "ltr"} ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={t("breadcrumb") || "Breadcrumb"}
    >
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight 
              className={`h-4 w-4 text-gray-400 ${isRTL ? "rotate-180" : ""}`} 
            />
          )}
          
          {item.href ? (
            <Link
              to={item.href}
              className="hover:text-gray-900 transition-colors duration-200 flex items-center gap-1"
            >
              {index === 0 && showHome && (
                <Home className="h-4 w-4" />
              )}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="text-gray-900 font-medium flex items-center gap-1">
              {index === 0 && showHome && (
                <Home className="h-4 w-4" />
              )}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default EnhancedBreadcrumb;
