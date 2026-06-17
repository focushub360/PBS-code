import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { User, Moon, Sun, ChevronDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.tsx";
import { useTheme } from "../../hooks/useTheme.tsx";
import { colors } from "../../theme/colors";

export const Header = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // minimal dropdown control
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    // close dropdowns on route change
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  const linkBaseClasses =
    "px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200";
  const activeClasses =
    "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white";

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 pb-4 pt-4 w-full">
      <div className="mx-auto px-2 sm:px-4 lg:px-8 max-w-full">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left: Logo/Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ backgroundColor: colors.primary.medium }}
            >
              C
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                BILLING SOFTWARE
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {user?.role === "admin"
                  ? "Only for Administration Purpose"
                  : "Manager Dashboard"}
              </p>
            </div>
          </div>

          {/* Center: Top Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/billing/create"
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Billing
            </NavLink>

            {/* Loans dropdown */}
            <div className="relative">
              <button
                className={`${linkBaseClasses} flex items-center space-x-1`}
                onClick={() =>
                  setOpenMenu(openMenu === "loans" ? null : "loans")
                }
              >
                <span>Loans</span>
                <ChevronDown size={16} />
              </button>
              {openMenu === "loans" && (
                <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1">
                  <NavLink
                    to="/loans/active"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Active Loans
                  </NavLink>
                  <NavLink
                    to="/loans/inactive"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Pledged
                  </NavLink>
                  {/* <NavLink
                    to="/repayment"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Search Pledged
                  </NavLink> */}
                </div>
              )}
            </div>

            {/* <NavLink
              to="/repayments/manage"
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Pledged
            </NavLink> */}

            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Customers
            </NavLink>

            {/* Transactions */}
            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Transactions
            </NavLink>

            {/* Reports */}
            <NavLink
              to="/transactions/report"
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Reports
            </NavLink>

            {/* Admin dropdown */}
            <div className="relative">
              <button
                className={`${linkBaseClasses} flex items-center space-x-1`}
                onClick={() =>
                  setOpenMenu(openMenu === "admin" ? null : "admin")
                }
              >
                <span>Admin</span>
                <ChevronDown size={16} />
              </button>
              {openMenu === "admin" && (
                <div className="absolute right-0 z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1">
                  <NavLink
                    to="/admin/profile"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Admin Profile
                  </NavLink>
                  <NavLink
                    to="/admin/items"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Item Management
                  </NavLink>
                  <NavLink
                    to="/admin/managers"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Manager Management
                  </NavLink>
                  <NavLink
                    to="/admin/modern-finance"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Finance Management
                  </NavLink>
                  <NavLink
                    to="/admin/expenses"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Expense Management
                  </NavLink>
                  <NavLink
                    to="/admin/shop-details"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Shop Details
                  </NavLink>
                  <NavLink
                    to="/admin/interest-rates"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Interest Rate Config
                  </NavLink>
                  <NavLink
                    to="/admin/gold-rates"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${
                        isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                      }`
                    }
                  >
                    Gold & Silver Rates
                  </NavLink>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Theme + User */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? (
                <Sun size={18} className="sm:w-5 sm:h-5" />
              ) : (
                <Moon size={18} className="sm:w-5 sm:h-5" />
              )}
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: colors.primary.dark }}
              >
                <User size={14} className="sm:w-4 sm:h-4" />
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] lg:max-w-none">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === "admin" ? "Administrator" : "Manager"}
                  {user?.branch && ` • Branch: ${user.branch}`}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
