import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { Loan, Customer } from "../types";
import { colors } from "../theme/colors";

// Minimal, clean version of Active Loans page, styled similar to SimpleCreateBillingPage
// - Lightweight header
// - Simple search by phone
// - Compact list rows with essential data only
// - Uses central colors for borders and emphasis

const fetchActiveLoans = async (): Promise<Loan[]> => {
  const response = await api.get("/loans/active");
  return response.data;
};

const searchLoansByPhone = async (phone: string): Promise<Loan[]> => {
  const response = await api.get(`/loans/search/${phone}`);
  return response.data;
};

export default function SimpleActiveLoansPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "due-soon" | "overdue">("all");

  const {
    data: loans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["active-loans-minimal"],
    queryFn: fetchActiveLoans,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["search-loans-minimal", searchTerm],
    queryFn: () => searchLoansByPhone(searchTerm),
    enabled: searchTerm.length >= 10,
  });

  const displayLoans = searchTerm.length >= 10 ? searchResults : loans;
  const items = displayLoans || [];

  // Overdue classification
  const getOverdueStatus = (daysPassed: number) => {
    if (daysPassed >= 90) return "overdue";
    if (daysPassed >= 30) return "due-soon";
    return "active";
  };

  const overdueCount = items.filter(l => getOverdueStatus(l.daysPassed || 0) === "overdue").length;
  const dueSoonCount = items.filter(l => getOverdueStatus(l.daysPassed || 0) === "due-soon").length;

  const filteredItems = filterStatus === "all" 
    ? items 
    : items.filter(l => getOverdueStatus(l.daysPassed || 0) === filterStatus);

  const sectionStyle: React.CSSProperties = {
    borderColor: colors.primary[200],
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: colors.primary.dark,
  };

  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: colors.primary.dark,
  };

  const outlineButtonStyle: React.CSSProperties = {
    borderColor: colors.primary[300],
    color: colors.primary[300],
  };

  return (
    <div className="w-full p-3 sm:p-4 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-3">
        <h1
          className="text-xl sm:text-2xl font-semibold dark:text-white"
          style={sectionTitleStyle}
        >
          Active Loans
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage active loans and track payments ({items.length} loans)
        </p>
      </div>
      {/* Overdue Summary + Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStatus === "all" ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"}`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setFilterStatus("active")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStatus === "active" ? "bg-green-600 text-white border-green-600" : "border-green-300 text-green-700 dark:text-green-400"}`}
        >
          🟢 Active ({items.length - dueSoonCount - overdueCount})
        </button>
        <button
          onClick={() => setFilterStatus("due-soon")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStatus === "due-soon" ? "bg-yellow-500 text-white border-yellow-500" : "border-yellow-300 text-yellow-700 dark:text-yellow-400"}`}
        >
          🟡 Due Soon ({dueSoonCount})
        </button>
        <button
          onClick={() => setFilterStatus("overdue")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStatus === "overdue" ? "bg-red-600 text-white border-red-600" : "border-red-300 text-red-700 dark:text-red-400"}`}
        >
          🔴 Overdue ({overdueCount})
        </button>
      </div>

      {/* Search */}
      <section
        className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 mb-4"
        style={sectionStyle}
      >
        <div className="flex gap-2 items-center">
          <input
            type="tel"
            placeholder="Search by 10-digit phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 border rounded text-sm hover:opacity-90"
            style={outlineButtonStyle}
          >
            Refresh
          </button>
        </div>
      </section>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading active loans...
        </div>
      )}

      {error && (
        <div className="p-4 border rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 mb-4">
          Failed to load active loans
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 && !isLoading ? (
          <div
            className="p-4 border rounded-lg dark:border-gray-600 text-gray-700 dark:text-gray-300"
            style={sectionStyle}
          >
            No active loans found.
          </div>
        ) : (
          filteredItems.map((loan) => {
            const customer = loan.customerId as Customer;
            const daysPassed = loan.daysPassed || 0;
            const currentInterest = loan.currentInterest || 0;
            const status = getOverdueStatus(daysPassed);
            const statusColor = status === "overdue" 
              ? "border-l-4 border-l-red-500" 
              : status === "due-soon" 
              ? "border-l-4 border-l-yellow-500" 
              : "border-l-4 border-l-green-500";
            const statusBadge = status === "overdue" 
              ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">🔴 Overdue</span>
              : status === "due-soon"
              ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">🟡 Due Soon</span>
              : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">🟢 Active</span>;
            const totalDue = loan.totalDue || loan.amount;

            return (
              <div
                key={loan.loanId}
                className={`p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 ${statusColor}`}
                style={sectionStyle}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  {/* Left: Customer */}
                  <div>
                    <div className="font-medium text-white">
                      {customer?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {customer?.phone}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Loan ID: {loan.loanId}
                    </div>
                    <div className="mt-1">{statusBadge}</div>
                  </div>

                  {/* Middle: Amounts */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Principal
                      </div>
                      <div className="font-semibold dark:text-white">
                        ₹{loan.amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Interest
                      </div>
                      <div className="font-semibold text-yellow-700 dark:text-yellow-400">
                        ₹{currentInterest.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Due
                      </div>
                      <div className="font-semibold text-red-700 dark:text-red-400">
                        ₹{totalDue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Meta + Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <div className="text-sm dark:text-gray-200">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Days
                      </div>
                      <div className="font-medium">{daysPassed} days</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {loan.interestPercent}% {loan.interestType},{" "}
                        {loan.validity} mo
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/repayment/${loan.loanId}`}
                        className="px-3 py-1.5 rounded text-sm text-white hover:opacity-90"
                        style={primaryButtonStyle}
                      >
                        Pay
                      </Link>
                      <Link
                        to={`/loans/${loan.loanId}`}
                        className="px-3 py-1.5 border rounded text-sm hover:opacity-90"
                        style={outlineButtonStyle}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
