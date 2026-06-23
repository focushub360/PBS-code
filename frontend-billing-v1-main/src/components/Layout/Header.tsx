import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { User, Moon, Sun, ChevronDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.tsx";
import { useTheme } from "../../hooks/useTheme.tsx";

export const Header = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  const linkBaseClasses =
    "px-3 py-2 text-sm font-medium rounded-md hover:bg-white/5 text-gray-300 transition-colors";
  const activeClasses = "bg-white/10 text-yellow-400";

  const dropdownItemClasses = (isActive: boolean) =>
    `block px-3 py-2 text-sm rounded-md hover:bg-white/5 text-gray-300 transition-colors ${
      isActive ? "bg-white/10 text-yellow-400" : ""
    }`;

  return (
    <header className="bg-[#0a0f24] border-b border-white/10 pb-4 pt-4 w-full">
      <div className="mx-auto px-2 sm:px-4 lg:px-8 max-w-full">
        <div className="flex justify-between items-center h-14 sm:h-16">

          {/* Left: Logo/Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black font-bold text-base flex-shrink-0 bg-gradient-to-br from-yellow-400 to-yellow-600">
              C
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">
                BILLING SOFTWARE
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
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
              className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : ""}`}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/billing/create"
              className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : ""}`}
            >
              Billing
            </NavLink>

            {/* Loans dropdown */}
            <div className="relative">
              <button
                className={`${linkBaseClasses} flex items-center space-x-1`}
                onClick={() => setOpenMenu(openMenu === "loans" ? null : "loans")}
              >
                <span>Loans</span>
                <ChevronDown size={16} />
              </button>
              {openMenu === "loans" && (
                <div className="absolute z-50 mt-1 w-56 bg-[#0f1530] border border-white/10 rounded-md shadow-xl shadow-black/40 p-1">
                  <NavLink to="/loans/active" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Active Loans
                  </NavLink>
                  <NavLink to="/loans/inactive" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Pledged
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink
              to="/customers"
              className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : ""}`}
            >
              Customers
            </NavLink>

            <NavLink
              to="/transactions"
              className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : ""}`}
            >
              Transactions
            </NavLink>

            <NavLink
              to="/transactions/report"
              className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : ""}`}
            >
              Reports
            </NavLink>

            {/* Admin dropdown */}
            <div className="relative">
              <button
                className={`${linkBaseClasses} flex items-center space-x-1`}
                onClick={() => setOpenMenu(openMenu === "admin" ? null : "admin")}
              >
                <span>Admin</span>
                <ChevronDown size={16} />
              </button>
              {openMenu === "admin" && (
                <div className="absolute right-0 z-50 mt-1 w-72 bg-[#0f1530] border border-white/10 rounded-md shadow-xl shadow-black/40 p-1">
                  <NavLink to="/admin/profile" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Admin Profile
                  </NavLink>
                  <NavLink to="/admin/items" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Item Management
                  </NavLink>
                  <NavLink to="/admin/managers" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Manager Management
                  </NavLink>
                  <NavLink to="/admin/modern-finance" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Finance Management
                  </NavLink>
                  <NavLink to="/admin/expenses" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Expense Management
                  </NavLink>
                  <NavLink to="/admin/shop-details" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Shop Details
                  </NavLink>
                  <NavLink to="/admin/interest-rates" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Interest Rate Config
                  </NavLink>
                  <NavLink to="/admin/gold-rates" className={({ isActive }) => dropdownItemClasses(isActive)}>
                    Gold &amp; Silver Rates
                  </NavLink>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Theme + User */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
            >
              {isDark ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-black flex-shrink-0 bg-gradient-to-br from-yellow-400 to-yellow-600">
                <User size={14} className="sm:w-4 sm:h-4" />
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-medium text-white truncate max-w-[120px] lg:max-w-none">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.role === "admin" ? "Administrator" : "Manager"}
                  {user?.branch && ` • Branch: ${user.branch}`}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 whitespace-nowrap transition-colors"
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