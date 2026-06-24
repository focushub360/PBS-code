import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  CreditCard,
  Banknote,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import api from "../utils/api";
import { Transaction, TransactionSummary, GroupedTransaction } from "../types";
import { colors, themeConfig } from "../theme/colors";

const fetchTransactions = async (filters: {
  type?: string;
  mode?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
};

const fetchTransactionSummary = async (filters: {
  startDate?: string;
  endDate?: string;
}): Promise<TransactionSummary> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await api.get(`/transactions/summary?${params.toString()}`);
  return response.data;
};

// Group transactions by loan ID and type
const groupTransactions = (
  transactions: Transaction[]
): GroupedTransaction[] => {
  const grouped = transactions.reduce((acc, transaction) => {
    const loan = transaction.loanId as any;
    const key = `${loan?.loanId || "N/A"}-${transaction.type}`;

    if (!acc[key]) {
      acc[key] = {
        _id: key,
        loanId: loan?.loanId || "N/A",
        type: transaction.type,
        date: transaction.date,
        totalAmount: 0,
        customer: {
          name: loan?.customerId?.name || "N/A",
          phone: loan?.customerId?.phone || "",
        },
        paymentMethods: [],
      };
    }

    acc[key].totalAmount += transaction.amount;
    acc[key].paymentMethods.push({
      mode: transaction.mode,
      amount: transaction.amount,
      transactionId: transaction._id || "",
    });

    // Keep the latest transaction date
    if (new Date(transaction.date) > new Date(acc[key].date)) {
      acc[key].date = transaction.date;
    }

    return acc;
  }, {} as Record<string, GroupedTransaction>);

  return Object.values(grouped).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const TransactionsPage = () => {
  const [filters, setFilters] = useState({
    type: "",
    mode: "",
    startDate: "",
    endDate: "",
  });

  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set()
  );

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: [
      "transaction-summary",
      { startDate: filters.startDate, endDate: filters.endDate },
    ],
    queryFn: () =>
      fetchTransactionSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      mode: "",
      startDate: "",
      endDate: "",
    });
  };

  // Group transactions for display
  const groupedTransactions = transactions
    ? groupTransactions(transactions)
    : [];

  const toggleExpand = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const getTransactionIcon = (type: string, mode: string) => {
    if (type === "billing") {
      return mode === "cash" ? Banknote : CreditCard;
    }
    return mode === "cash" ? Banknote : CreditCard;
  };

  const getTransactionColor = (type: string) => {
    return type === "billing" ? "text-green-600" : "text-blue-600";
  };

  const getTransactionBg = (type: string) => {
    return type === "billing"
      ? "bg-green-50 dark:bg-green-900/20"
      : "bg-blue-50 dark:bg-blue-900/20";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all transactions
            </p>
          </div>
        </div>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Failed to load transactions
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-full overflow-x-hidden">
      {/* Header and Summary in a single row */}
      <div className="flex flex-col md:flex-row gap-2">
        {/* Header */}
        <div className="md:w-1/4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            View and manage all transactions ({groupedTransactions?.length || 0}{" "}
            grouped records, {transactions?.length || 0} total)
          </p>
        </div>

        {/* Summary Cards - Inline layout */}
        {summaryLoading ? (
          <div className="md:w-3/4 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : summary && summary.billing && summary.repayment ? (
          <div className="md:w-3/4 grid grid-cols-4 gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-1 bg-green-100 dark:bg-green-900/20 rounded-lg mr-1">
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Billing
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{(summary.billing?.total || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {summary.billing?.count || 0} txns
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-1">
                  <TrendingDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Pledged
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{(summary.repayment?.total || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {summary.repayment?.count || 0} txns
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg mr-1">
                  <Banknote className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Cash
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹
                    {(
                      (summary.billing?.breakdown?.cash?.amount || 0) +
                      (summary.repayment?.breakdown?.cash?.amount || 0)
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(summary.billing?.breakdown?.cash?.count || 0) +
                      (summary.repayment?.breakdown?.cash?.count || 0)}{" "}
                    txns
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/20 rounded-lg mr-1">
                  <CreditCard className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Online
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹
                    {(
                      (summary.billing?.breakdown?.online?.amount || 0) +
                      (summary.repayment?.breakdown?.online?.amount || 0)
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(summary.billing?.breakdown?.online?.count || 0) +
                      (summary.repayment?.breakdown?.online?.count || 0)}{" "}
                    txns
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:w-3/4 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No transaction data available
            </p>
          </div>
        )}
      </div>

      {/* Filters - Inline layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center mr-2">
            <Filter className="h-3 w-3 text-gray-600 dark:text-gray-400 mr-1" />
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white">
              Filters:
            </h2>
          </div>

          <div className="flex-1 flex flex-wrap gap-2">
            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">
                Type:
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="billing">Billing</option>
                <option value="repayment">Pledged</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">
                Mode:
              </label>
              <select
                value={filters.mode}
                onChange={(e) => handleFilterChange("mode", e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Modes</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">
                Start:
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">
                End:
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-auto"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List - Compact */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : groupedTransactions && groupedTransactions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {groupedTransactions.map((groupedTransaction) => {
                  const isExpanded = expandedTransactions.has(
                    groupedTransaction._id
                  );
                  const hasMultiplePayments =
                    groupedTransaction.paymentMethods.length > 1;

                  return (
                    <>
                      {/* Main Transaction Row */}
                      <tr
                        key={groupedTransaction._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-2 py-2 whitespace-nowrap">
                          {hasMultiplePayments && (
                            <button
                              onClick={() =>
                                toggleExpand(groupedTransaction._id)
                              }
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                          {new Date(groupedTransaction.date).toLocaleString()}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div
                              className={`p-0.5 rounded ${getTransactionBg(
                                groupedTransaction.type
                              )}`}
                            >
                              {groupedTransaction.type === "billing" ? (
                                <TrendingUp
                                  className={`h-3 w-3 ${getTransactionColor(
                                    groupedTransaction.type
                                  )}`}
                                />
                              ) : (
                                <TrendingDown
                                  className={`h-3 w-3 ${getTransactionColor(
                                    groupedTransaction.type
                                  )}`}
                                />
                              )}
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-white capitalize">
                              {groupedTransaction.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                          {groupedTransaction.loanId}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                          {groupedTransaction.customer.name}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {hasMultiplePayments ? (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {groupedTransaction.paymentMethods.length} methods
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              {getTransactionIcon(
                                groupedTransaction.type,
                                groupedTransaction.paymentMethods[0].mode
                              ) &&
                                React.createElement(
                                  getTransactionIcon(
                                    groupedTransaction.type,
                                    groupedTransaction.paymentMethods[0].mode
                                  ),
                                  { className: "h-3 w-3 text-gray-400" }
                                )}
                              <span className="text-xs text-gray-900 dark:text-white capitalize">
                                {groupedTransaction.paymentMethods[0].mode}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                          ₹{groupedTransaction.totalAmount.toLocaleString()}
                        </td>
                      </tr>

                      {/* Expanded Payment Methods */}
                      {isExpanded &&
                        hasMultiplePayments &&
                        groupedTransaction.paymentMethods.map(
                          (method, index) => (
                            <tr
                              key={`${groupedTransaction._id}-${method.transactionId}`}
                              className="bg-gray-50 dark:bg-gray-700/50"
                            >
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1"></td>
                              <td className="px-2 py-1 whitespace-nowrap">
                                <div className="flex items-center gap-1 pl-2">
                                  {React.createElement(
                                    getTransactionIcon(
                                      groupedTransaction.type,
                                      method.mode
                                    ),
                                    { className: "h-3 w-3 text-gray-400" }
                                  )}
                                  <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                                    {method.mode}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                                ₹{method.amount.toLocaleString()}
                              </td>
                            </tr>
                          )
                        )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            No transactions found
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Try adjusting your filters or date range
          </p>
        </div>
      )}
    </div>
  );
};
