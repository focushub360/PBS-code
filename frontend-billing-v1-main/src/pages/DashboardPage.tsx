import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Clock,
  Users,
  Package,
  ArrowRight,
  DollarSign,
  Target,
  Activity,
  Plus,
  Eye,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { DashboardStats } from "../types";
import { colors, themeConfig } from "../theme/colors";

const fetchActiveLoansForOverdue = async () => {
  try {
    const response = await api.get("/loans/active");
    return response.data || [];
  } catch {
    return [];
  }
};
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch pawn shop statistics
    const [loanStats, billingStats, transactionStats] = await Promise.all([
      api.get("/loans/statistics"),
      api.get("/billing/stats"),
      api.get("/transactions/statistics"),
    ]);

    console.log("Pawn shop stats response:", {
      loanStats: loanStats.data,
      billingStats: billingStats.data,
    });

    // Combine stats from different endpoints
    const combinedStats: DashboardStats = {
      totalLoans: loanStats.data.totalLoans || 0,
      activeLoans: loanStats.data.activeLoans || 0,
      repaidLoans: loanStats.data.repaidLoans || 0,
      totalActiveLoanAmount: loanStats.data.totalActiveLoanAmount || 0,
      totalRepaidLoanAmount: loanStats.data.totalRepaidLoanAmount || 0,
      totalCurrentInterest: loanStats.data.totalCurrentInterest || 0,
      todayBillingAmount: billingStats.data.totalLoanAmount || 0,
      todayRepaymentAmount: loanStats.data.todayRepaymentAmount || 0,
      todayLoanAmount: loanStats.data.todayLoanAmount || 0,
      todayProfit: loanStats.data.todayProfit || 0,
      totalItems: transactionStats.data.totalItems || 0,
      pledgedItems: transactionStats.data.pledgedItems || 0,
      availableItems: transactionStats.data.availableItems || 0,
    };

    return combinedStats;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);

    // If endpoints don't exist, return default stats
    return {
      totalLoans: 0,
      activeLoans: 0,
      repaidLoans: 0,
      totalActiveLoanAmount: 0,
      totalRepaidLoanAmount: 0,
      totalCurrentInterest: 0,
      todayBillingAmount: 0,
      todayRepaymentAmount: 0,
      todayLoanAmount: 0,
      todayProfit: 0,
      totalItems: 0,
      pledgedItems: 0,
      availableItems: 0,
    };
  }
};

export const DashboardPage = () => {
  const { data: activeLoans = [] } = useQuery({
    queryKey: ["active-loans-overdue-check"],
    queryFn: fetchActiveLoansForOverdue,
    refetchInterval: 30000,
  });

  const overdueLoans = activeLoans.filter((l: any) => (l.daysPassed || 0) >= 90);
  const dueSoonLoans = activeLoans.filter((l: any) => (l.daysPassed || 0) >= 30 && (l.daysPassed || 0) < 90);
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading loan management statistics...
              </p>
            </div>
            <Link
              to="/billing/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Billing</span>
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time Loan Management & Performance Metrics
              </p>
            </div>
            <Link
              to="/billing/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Billing</span>
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center max-w-md">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-800/20 rounded-full mb-3">
                <RefreshCw className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                Failed to load dashboard statistics
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
                {error instanceof Error
                  ? error.message
                  : "An unexpected error occurred"}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Key performance indicators
  const kpiCards = [
    {
      title: "Active Loans",
      value: stats?.activeLoans || 0,
      icon: Activity,
      color: "blue",
      trend: "+5.2%",
      trendUp: true,
    },
    {
      title: "Active Amount",
      value: `₹${(stats?.totalActiveLoanAmount || 0).toLocaleString()}`,
      icon: Banknote,
      color: "green",
      trend: "+12.8%",
      trendUp: true,
    },
    {
      title: "Current Interest",
      value: `₹${(stats?.totalCurrentInterest || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "amber",
      trend: "+8.4%",
      trendUp: true,
    },
    {
      title: "Total Items",
      value: stats?.totalItems || 0,
      icon: Package,
      color: "purple",
      trend: "+2.1%",
      trendUp: true,
    },
  ];

  // Today's metrics
  const todayMetrics = [
    {
      label: "Loans Given",
      value: `₹${(stats?.todayLoanAmount || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "blue",
    },
    {
      label: "Pledged Amount",
      value: `₹${(stats?.todayRepaymentAmount || 0).toLocaleString()}`,
      icon: Target,
      color: "green",
    },
    {
      label: "Today's Profit",
      value: `₹${(stats?.todayProfit || 0).toLocaleString()}`,
      icon: DollarSign,
      color: (stats?.todayProfit || 0) >= 0 ? "green" : "red",
    },
  ];

  const getColorClasses = (
    color: string,
    variant: "bg" | "text" | "border" = "bg"
  ) => {
    const colorMap = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/10",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
      },
      amber: {
        bg: "bg-amber-50 dark:bg-amber-900/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/10",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
      },
      red: {
        bg: "bg-red-50 dark:bg-red-900/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
      },
    };
    return (
      colorMap[color as keyof typeof colorMap]?.[variant] ||
      colorMap.blue[variant]
    );
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Dashboard
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <Link
              to="/billing/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Billing</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <Link
              to="/loans/active"
              className="flex flex-col items-center gap-1 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group"
            >
              <div className="p-1.5 bg-green-100 dark:bg-green-800/20 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-300 text-center">
                Active Loans
              </span>
            </Link>

            <Link
              to="/repayment"
              className="flex flex-col items-center gap-1 p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <div className="p-1.5 bg-purple-100 dark:bg-purple-800/20 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
                <IndianRupee className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300 text-center">
                Pledges
              </span>
            </Link>

            <Link
              to="/transactions"
              className="flex flex-col items-center gap-1 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
            >
              <div className="p-1.5 bg-amber-100 dark:bg-amber-800/20 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/30 transition-colors">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300 text-center">
                Transactions
              </span>
            </Link>

            <Link
              to="/reports"
              className="flex flex-col items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group"
            >
              <div className="p-1.5 bg-blue-100 dark:bg-blue-800/20 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 text-center">
                Reports
              </span>
            </Link>

            <Link
              to="/customers"
              className="flex flex-col items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors group"
            >
              <div className="p-1.5 bg-gray-100 dark:bg-gray-600/50 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-600/70 transition-colors">
                <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                Customers
              </span>
            </Link>

            <Link
              to="/analytics"
              className="flex flex-col items-center gap-1 p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors group"
            >
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-800/20 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/30 transition-colors">
                <PieChart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 text-center">
                Analytics
              </span>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {kpiCards.map((kpi, index) => {
            const IconComponent = kpi.icon;

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${getColorClasses(
                      kpi.color,
                      "bg"
                    )}`}
                  >
                    <IconComponent
                      className={`h-4 w-4 ${getColorClasses(
                        kpi.color,
                        "text"
                      )}`}
                    />
                  </div>
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      kpi.trendUp
                        ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {kpi.trendUp ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    <span className="text-xs">{kpi.trend}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                    {kpi.title}
                  </h3>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {kpi.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue Alert Banner */}
        {(overdueLoans.length > 0 || dueSoonLoans.length > 0) && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueLoans.length > 0 && (
              <Link
                to="/loans/active"
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-lg">
                    🔴
                  </div>
                  <div>
                    <div className="text-sm font-bold text-red-800 dark:text-red-300">
                      {overdueLoans.length} Loan{overdueLoans.length > 1 ? "s" : ""} Overdue!
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      90+ days — Immediate action required
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-red-600" />
              </Link>
            )}
            {dueSoonLoans.length > 0 && (
              <Link
                to="/loans/active"
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-lg">
                    🟡
                  </div>
                  <div>
                    <div className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                      {dueSoonLoans.length} Loan{dueSoonLoans.length > 1 ? "s" : ""} Due Soon
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      30-90 days — Follow up needed
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-yellow-600" />
              </Link>
            )}
          </div>
        )}
        
        {/* Main Content Grid - Scrollable Container */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Today's Performance */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Today's Performance
                  </h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {todayMetrics.map((metric, index) => {
                    const IconComponent = metric.icon;

                    return (
                      <div
                        key={index}
                        className={`p-2 rounded-lg border ${getColorClasses(
                          metric.color,
                          "bg"
                        )} ${getColorClasses(metric.color, "border")}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <IconComponent
                            className={`h-4 w-4 ${getColorClasses(
                              metric.color,
                              "text"
                            )}`}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {metric.label}
                          </span>
                        </div>
                        <p
                          className={`text-lg font-bold ${getColorClasses(
                            metric.color,
                            "text"
                          )}`}
                        >
                          {metric.value}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Monthly Overview */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Monthly Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Total Loans
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₹
                        {(
                          (stats?.totalActiveLoanAmount || 0) +
                          (stats?.totalRepaidLoanAmount || 0)
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Total Repaid
                      </p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        ₹{(stats?.totalRepaidLoanAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Interest Earned
                      </p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        ₹{(stats?.totalCurrentInterest || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Status & Inventory */}
            <div className="space-y-4">
              {/* Profit Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Profit Status
                </h3>
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-2 ${
                      (stats?.todayProfit || 0) >= 0
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "bg-red-100 dark:bg-red-900/20"
                    }`}
                  >
                    <Target
                      className={`h-7 w-7 ${
                        (stats?.todayProfit || 0) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Today's Profit
                  </p>
                  <p
                    className={`text-xl font-bold mb-1 ${
                      (stats?.todayProfit || 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {(stats?.todayProfit || 0) >= 0 ? "+" : ""}₹
                    {(stats?.todayProfit || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Interest earned from repayments
                  </p>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Inventory Status
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Total Items
                      </span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {stats?.totalItems || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Pledged
                      </span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {stats?.pledgedItems || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        Available
                      </span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                      {stats?.availableItems || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
