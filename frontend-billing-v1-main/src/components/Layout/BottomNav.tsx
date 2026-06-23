import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  Users,
  MoreHorizontal,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { colors, themeConfig } from "../../theme/colors";

const navItems = [
  {
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    path: "/billing/create",
    icon: CreditCard,
    label: "Billing",
  },
  {
    path: "/loans/active",
    icon: Banknote,
    label: "Loans",
  },
  {
    path: "/customers",
    icon: Users,
    label: "Customers",
  },
];

const moreItems = [
  { path: "/transactions", icon: BarChart3, label: "Transactions" },
  { path: "/transactions/report", icon: BarChart3, label: "Reports" },
  { path: "/admin/profile", icon: Settings, label: "Admin Profile" },
  { path: "/admin/items", icon: Settings, label: "Item Management" },
  { path: "/admin/managers", icon: Settings, label: "Manager Management" },
  { path: "/admin/modern-finance", icon: Settings, label: "Finance Management" },
  { path: "/admin/expenses", icon: Settings, label: "Expense Management" },
  { path: "/admin/shop-details", icon: Settings, label: "Shop Details" },
  { path: "/admin/interest-rates", icon: Settings, label: "Interest Rate Config" },
  { path: "/admin/gold-rates", icon: Settings, label: "Gold & Silver Rates" },
];

export const BottomNav = () => {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  return (
    <>
      {showMore && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl border-t border-gray-200 dark:border-gray-700 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                More
              </span>
              <button onClick={() => setShowMore(false)}>
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-2">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? colors.primary.medium : undefined,
                  })}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 w-full">
        <div className="flex items-center justify-around py-1.5 sm:py-2 px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center space-y-0.5 sm:space-y-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors ${
                  isActive ? "text-white" : "text-gray-600 dark:text-gray-400"
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? colors.primary.medium : undefined,
              })}
            >
              <item.icon size={18} className="sm:w-5 sm:h-5" />
              <span className="text-xs font-medium truncate max-w-[50px] sm:max-w-none">
                {item.label}
              </span>
            </NavLink>
          ))}

          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center space-y-0.5 sm:space-y-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
          >
            <MoreHorizontal size={18} className="sm:w-5 sm:h-5" />
            <span className="text-xs font-medium truncate max-w-[50px] sm:max-w-none">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};