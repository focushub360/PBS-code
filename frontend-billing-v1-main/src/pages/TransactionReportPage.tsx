import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
} from "lucide-react";
import api from "../utils/api";
import { colors } from "../theme/colors";
import XLSX from "xlsx-js-style";

interface Transaction {
  _id: string;
  loanId: string;
  customerName: string;
  customerPhone: string;
  type: "billing" | "repayment";
  mode: "cash" | "online";
  amount: number;
  date: string;
  loanAmount?: number;
  interestAmount?: number;
  totalAmount?: number;
  status?: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  billingAmount: number;
  repaymentAmount: number;
  cashAmount: number;
  onlineAmount: number;
  interestEarned: number;
}

const TransactionReportPage = () => {
  const [filterType, setFilterType] = useState<string>("all_time");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [paymentMode, setPaymentMode] = useState<string>("all");

  // Calculate date ranges based on filter type
  const getDateRange = () => {
    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Get current date for each calculation to avoid timezone issues
    const getCurrentDate = () => new Date();

    switch (filterType) {
      case "all_time":
        return {
          startDate: "", // No start date filter
          endDate: "", // No end date filter
        };
      case "today":
        const todayDate = getCurrentDate();
        const todayStr = formatLocalDate(todayDate);
        return {
          startDate: todayStr,
          endDate: todayStr,
        };
      case "yesterday":
        const yesterdayDate = getCurrentDate();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = formatLocalDate(yesterdayDate);
        return {
          startDate: yesterdayStr,
          endDate: yesterdayStr,
        };
      case "this_week":
        // Last 7 days including today
        const thisWeekEnd = getCurrentDate();
        const sevenDaysAgo = getCurrentDate();
        sevenDaysAgo.setDate(thisWeekEnd.getDate() - 6); // 6 days ago + today = 7 days
        return {
          startDate: formatLocalDate(sevenDaysAgo),
          endDate: formatLocalDate(thisWeekEnd),
        };
      case "last_week":
        const lastWeekRef = getCurrentDate();
        const lastWeekStart = getCurrentDate();
        lastWeekStart.setDate(lastWeekRef.getDate() - lastWeekRef.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return {
          startDate: formatLocalDate(lastWeekStart),
          endDate: formatLocalDate(lastWeekEnd),
        };
      case "this_month":
        const thisMonthRef = getCurrentDate();
        const startOfMonth = new Date(
          thisMonthRef.getFullYear(),
          thisMonthRef.getMonth(),
          1
        );
        return {
          startDate: formatLocalDate(startOfMonth),
          endDate: formatLocalDate(thisMonthRef),
        };
      case "last_month":
        const lastMonthRef = getCurrentDate();
        const lastMonthStart = new Date(
          lastMonthRef.getFullYear(),
          lastMonthRef.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(
          lastMonthRef.getFullYear(),
          lastMonthRef.getMonth(),
          0
        );
        return {
          startDate: formatLocalDate(lastMonthStart),
          endDate: formatLocalDate(lastMonthEnd),
        };
      case "this_year":
        const thisYearRef = getCurrentDate();
        const startOfYear = new Date(thisYearRef.getFullYear(), 0, 1);
        return {
          startDate: formatLocalDate(startOfYear),
          endDate: formatLocalDate(thisYearRef),
        };
      case "last_year":
        const lastYearRef = getCurrentDate();
        const lastYearStart = new Date(lastYearRef.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(lastYearRef.getFullYear() - 1, 11, 31);
        return {
          startDate: formatLocalDate(lastYearStart),
          endDate: formatLocalDate(lastYearEnd),
        };
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
      default:
        const defaultDate = getCurrentDate();
        const defaultStr = formatLocalDate(defaultDate);
        return {
          startDate: defaultStr,
          endDate: defaultStr,
        };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Debug: Log the date range with more details
  const debugNow = new Date();
  console.log("🕐 Current time:", debugNow.toISOString());
  console.log("🕐 Current local time:", debugNow.toLocaleString());
  console.log("📅 Current date parts:", {
    year: debugNow.getFullYear(),
    month: debugNow.getMonth() + 1,
    date: debugNow.getDate(),
  });
  console.log("📅 Date range calculated:", { filterType, startDate, endDate });
  console.log(
    "📅 Expected today:",
    `${debugNow.getFullYear()}-${String(debugNow.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(debugNow.getDate()).padStart(2, "0")}`
  );

  // Test date calculations for debugging
  if (filterType === "yesterday") {
    const testYesterday = new Date(debugNow);
    testYesterday.setDate(testYesterday.getDate() - 1);
    console.log("🧪 Yesterday calculation test:");
    console.log("  Original date:", debugNow.toISOString());
    console.log("  Yesterday date:", testYesterday.toISOString());
    console.log(
      "  Yesterday formatted:",
      `${testYesterday.getFullYear()}-${String(
        testYesterday.getMonth() + 1
      ).padStart(2, "0")}-${String(testYesterday.getDate()).padStart(2, "0")}`
    );
    console.log("  Should be 2025-08-07 if today is 2025-08-08");
  }

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "transaction-report",
      startDate,
      endDate,
      transactionType,
      paymentMode,
    ],
    queryFn: async (): Promise<Transaction[]> => {
      const params = new URLSearchParams();
      // Only add date filters if they exist (not empty for all_time)
      if (startDate && startDate.trim()) params.append("startDate", startDate);
      if (endDate && endDate.trim()) params.append("endDate", endDate);
      if (transactionType !== "all") params.append("type", transactionType);
      if (paymentMode !== "all") params.append("mode", paymentMode);

      // Fetch transactions with filters
      console.log("🔍 Fetching with filters:", params.toString());
      const response = await api.get(`/transactions?${params.toString()}`);
      console.log("📊 Filtered response:", response.data);
      console.log("📊 Filtered count:", response.data.length);

      // Use the filtered data (even if empty - that's what filtering means!)
      const dataToUse = response.data;
      console.log("📊 Using filtered data:", dataToUse.length, "records");

      // Transform the data to match our interface
      const transformedData = dataToUse.map((transaction: any) => ({
        _id: transaction._id,
        loanId: transaction.loanId?.loanId || transaction.loanId || "N/A",
        customerName: transaction.loanId?.customerId?.name || "Unknown",
        customerPhone: transaction.loanId?.customerId?.phone || "N/A",
        type: transaction.type,
        mode: transaction.mode,
        amount: transaction.amount,
        date: transaction.date,
        loanAmount: transaction.loanId?.amount,
        interestAmount: transaction.interestAmount || 0,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
      }));

      console.log("✅ Final transformed data:", transformedData);
      return transformedData;
    },
    enabled: true, // Always enabled, let the API handle empty dates
  });

  // Calculate summary
  const summary: TransactionSummary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    billingAmount: transactions
      .filter((t) => t.type === "billing")
      .reduce((sum, t) => sum + t.amount, 0),
    repaymentAmount: transactions
      .filter((t) => t.type === "repayment")
      .reduce((sum, t) => sum + t.amount, 0),
    cashAmount: transactions
      .filter((t) => t.mode === "cash")
      .reduce((sum, t) => sum + t.amount, 0),
    onlineAmount: transactions
      .filter((t) => t.mode === "online")
      .reduce((sum, t) => sum + t.amount, 0),
    interestEarned: transactions
      .filter((t) => t.type === "repayment")
      .reduce((sum, t) => sum + (t.interestAmount || 0), 0),
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!transactions.length) {
      toast.error("No data to export");
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["FOCUS PAWN SHOP - TRANSACTION REPORT"],
      [""],
      ["Report Period:", `${startDate} to ${endDate}`],
      ["Generated On:", new Date().toLocaleString()],
      ["Filter Type:", filterType.replace("_", " ").toUpperCase()],
      ["Transaction Type:", transactionType.toUpperCase()],
      ["Payment Mode:", paymentMode.toUpperCase()],
      [""],
      ["SUMMARY"],
      ["Total Transactions:", summary.totalTransactions],
      ["Total Amount:", `₹${summary.totalAmount.toLocaleString()}`],
      ["Billing Amount:", `₹${summary.billingAmount.toLocaleString()}`],
      ["Pledged Amount:", `₹${summary.repaymentAmount.toLocaleString()}`],
      ["Cash Amount:", `₹${summary.cashAmount.toLocaleString()}`],
      ["Online Amount:", `₹${summary.onlineAmount.toLocaleString()}`],
      ["Interest Earned:", `₹${summary.interestEarned.toLocaleString()}`],
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);

    // Merge and style header title
    summaryWS["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title merge A1:F1
      { s: { r: 7, c: 0 }, e: { r: 7, c: 5 } }, // SUMMARY section header
    ];

    const setCell = (addr: string, v: any, s: any) => {
      // Ensure cell exists
      // @ts-ignore
      summaryWS[addr] = { v, t: typeof v === "number" ? "n" : "s", s };
    };

    // Title style
    setCell("A1", "FOCUS PAWN SHOP - TRANSACTION REPORT", {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { patternType: "solid", fgColor: { rgb: "FF1E3A8A" } }, // Indigo-700
    });

    // Section header "SUMMARY"
    setCell("A8", "SUMMARY", {
      font: { bold: true, sz: 13, color: { rgb: "FF1F2937" } },
      alignment: { horizontal: "left" },
      fill: { patternType: "solid", fgColor: { rgb: "FFE0E7FF" } }, // Indigo-100
      border: {
        top: { style: "thin", color: { rgb: "FF94A3B8" } },
        bottom: { style: "thin", color: { rgb: "FF94A3B8" } },
      },
    });

    // Labels style (left column)
    const labelStyle = {
      font: { bold: true, color: { rgb: "FF111827" } },
      fill: { patternType: "solid", fgColor: { rgb: "FFF3F4F6" } }, // gray-100
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
    } as const;

    // Values style (right column)
    const valueStyle = {
      font: { bold: false, color: { rgb: "FF111827" } },
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
    } as const;

    // Apply styles to the info block (Report Period .. Payment Mode)
    const infoRows = [3, 4, 5, 6, 7]; // A3:B7
    infoRows.forEach((r) => {
      const addrA = `A${r}`;
      const addrB = `B${r}`;
      // Preserve existing values
      // @ts-ignore
      const vA = summaryWS[addrA]?.v; // label
      // @ts-ignore
      const vB = summaryWS[addrB]?.v; // value
      setCell(addrA, vA, labelStyle);
      setCell(addrB, vB, valueStyle);
    });

    // Apply styles to summary metric rows starting at A10:B15
    const summaryRows = [10, 11, 12, 13, 14, 15];
    const accentColors = [
      "FF10B981",
      "FF3B82F6",
      "FF8B5CF6",
      "FFF59E0B",
      "FF6366F1",
      "FFEF4444",
    ];
    summaryRows.forEach((r, idx) => {
      const addrA = `A${r}`;
      const addrB = `B${r}`;
      // @ts-ignore
      const vA = summaryWS[addrA]?.v; // label
      // @ts-ignore
      const vB = summaryWS[addrB]?.v; // value
      const color = accentColors[idx % accentColors.length];
      setCell(addrA, vA, {
        ...labelStyle,
        fill: { patternType: "solid", fgColor: { rgb: color } },
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
      });
      setCell(addrB, vB, {
        ...valueStyle,
        font: { bold: true, sz: 12, color: { rgb: "FF111827" } },
      });
    });

    // Column widths
    summaryWS["!cols"] = [
      { wch: 28 },
      { wch: 32 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Transactions Sheet
    const transactionData = [
      [
        "Date",
        "Loan ID",
        "Customer Name",
        "Phone",
        "Type",
        "Mode",
        "Amount",
        "Interest Amount",
        "Total Amount",
        "Status",
      ],
      ...transactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.loanId,
        t.customerName,
        t.customerPhone,
        t.type === "repayment" ? "PLEDGED" : "BILLING",
        t.mode.toUpperCase(),
        t.amount,
        t.interestAmount || 0,
        t.totalAmount || t.amount,
        t.status || "COMPLETED",
      ]),
    ];

    const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
    // Style header row
    const headerCells = [
      "A1",
      "B1",
      "C1",
      "D1",
      "E1",
      "F1",
      "G1",
      "H1",
      "I1",
      "J1",
    ];
    headerCells.forEach((addr) => {
      // @ts-ignore
      if (transactionWS[addr])
        transactionWS[addr].s = {
          font: { bold: true, color: { rgb: "FFFFFFFF" } },
          alignment: { horizontal: "center" },
          fill: { patternType: "solid", fgColor: { rgb: "FF0EA5E9" } }, // cyan-600
          border: {
            bottom: { style: "thin", color: { rgb: "FF0891B2" } },
          },
        };
    });
    // Column widths
    transactionWS["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 14 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, transactionWS, "Transactions");

    // Billing Summary Sheet
    const billingTransactions = transactions.filter(
      (t) => t.type === "billing"
    );
    if (billingTransactions.length > 0) {
      const billingData = [
        ["BILLING TRANSACTIONS"],
        [""],
        ["Date", "Loan ID", "Customer Name", "Phone", "Mode", "Amount"],
        ...billingTransactions.map((t) => [
          new Date(t.date).toLocaleDateString(),
          t.loanId,
          t.customerName,
          t.customerPhone,
          t.mode.toUpperCase(),
          t.amount,
        ]),
      ];
      const billingWS = XLSX.utils.aoa_to_sheet(billingData);
      XLSX.utils.book_append_sheet(wb, billingWS, "Billing");
    }

    // Repayment Summary Sheet
    const repaymentTransactions = transactions.filter(
      (t) => t.type === "repayment"
    );
    if (repaymentTransactions.length > 0) {
      const repaymentData = [
        ["PLEDGED TRANSACTIONS"],
        [""],
        [
          "Date",
          "Loan ID",
          "Customer Name",
          "Phone",
          "Mode",
          "Principal",
          "Interest",
          "Total",
        ],
        ...repaymentTransactions.map((t) => [
          new Date(t.date).toLocaleDateString(),
          t.loanId,
          t.customerName,
          t.customerPhone,
          t.mode.toUpperCase(),
          (t.totalAmount || t.amount) - (t.interestAmount || 0),
          t.interestAmount || 0,
          t.totalAmount || t.amount,
        ]),
      ];
      const repaymentWS = XLSX.utils.aoa_to_sheet(repaymentData);
      // Style header
      const repHeader = ["A1"];
      repHeader.forEach((addr) => {
        // @ts-ignore
        if (repaymentWS[addr])
          repaymentWS[addr].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFFFF" } },
            alignment: { horizontal: "center" },
            fill: { patternType: "solid", fgColor: { rgb: "FF16A34A" } }, // green-600
          };
      });
      repaymentWS["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      repaymentWS["!cols"] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 20 },
        { wch: 14 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, repaymentWS, "Pledged");
    }

    // Save file
    const fileName = `Transaction_Report_${filterType}_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Report exported successfully!");
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "this_week":
        return "This Week";
      case "last_week":
        return "Last Week";
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      case "this_year":
        return "This Year";
      case "last_year":
        return "Last Year";
      case "custom":
        return "Custom Range";
      default:
        return "Today";
    }
  };

  return (
    <div className="p-3 space-y-3 max-w-full">
      {/* Header and Action Buttons in a single row */}
      <div className="flex flex-col md:flex-row gap-2">
        {/* Header */}
        <div className="md:w-2/3 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Transaction Reports
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Analysis and export of {transactions.length} transactions
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="md:w-1/3 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            disabled={!transactions.length}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {/* Filters - Compact Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <Filter className="h-3 w-3 text-gray-600 dark:text-gray-400 mr-1" />
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Time Period Filter */}
          <div className="flex items-center">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1 whitespace-nowrap">
              Period:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all_time">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div className="flex items-center">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1 whitespace-nowrap">
              Type:
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="billing">Billing Only</option>
              <option value="repayment">Pledged Only</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex items-center">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1 whitespace-nowrap">
              Mode:
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash Only</option>
              <option value="online">Online Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range - Inline */}
        {filterType === "custom" && (
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">
              Custom Range:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Current Filter Display - Compact */}
        <div className="mt-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Filter:</strong> {getFilterLabel()}
            {startDate && endDate && ` (${startDate} to ${endDate})`}
            {transactionType !== "all" && ` • ${transactionType.toUpperCase()}`}
            {paymentMode !== "all" && ` • ${paymentMode.toUpperCase()}`}
            <span className="ml-1 text-blue-600 dark:text-blue-300">
              • {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalTransactions}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{summary.totalAmount.toLocaleString()}
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Billing Amount
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹{summary.billingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.type === "billing").length}{" "}
                transactions
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pledged Amount
              </p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{summary.repaymentAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.type === "repayment").length}{" "}
                transactions
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cash Amount
              </p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{summary.cashAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.mode === "cash").length}{" "}
                transactions
              </p>
            </div>
            <Banknote className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Online Amount
              </p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{summary.onlineAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.mode === "online").length}{" "}
                transactions
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Interest Earned
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                ₹{summary.interestEarned.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">From pledged</p>
            </div>
            <BarChart3 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unique Customers
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {new Set(transactions.map((t) => t.customerPhone)).size}
              </p>
              <p className="text-xs text-gray-500">Active customers</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div> */}

      {/* Transaction List - Compact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
            Transaction Details ({transactions.length} records)
          </h3>

          {/* Summary Stats - Compact Inline */}
          <div className="flex gap-2 text-xs">
            <span className="text-green-600 dark:text-green-400 font-medium">
              Billing: ₹{summary.billingAmount.toLocaleString()}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Pledged: ₹{summary.repaymentAmount.toLocaleString()}
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              Interest: ₹{summary.interestEarned.toLocaleString()}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-3">
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-2">
              <FileText className="h-8 w-8 mx-auto mb-1" />
              <p className="text-sm font-medium">Error loading transactions</p>
              <p className="text-xs text-gray-500 mt-1">{error.message}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No transactions found for the selected period
            </p>
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => {
                  // Reset to show all data
                  setFilterType("all_time");
                  setTransactionType("all");
                  setPaymentMode("all");
                  refetch();
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={() => (window.location.href = "/loan-management")}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Loans
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interest
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-blue-600 dark:text-blue-400">
                      {transaction.loanId}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {transaction.customerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                          transaction.type === "billing"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {transaction.type === "billing" ? (
                          <>
                            <TrendingUp className="h-2 w-2 mr-1" />
                            Billing
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-2 w-2 mr-1" />
                            Pledged
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                          transaction.mode === "cash"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        }`}
                      >
                        {transaction.mode === "cash" ? (
                          <>
                            <Banknote className="h-2 w-2 mr-1" />
                            Cash
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-2 w-2 mr-1" />
                            Online
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">
                      {transaction.interestAmount
                        ? `₹${transaction.interestAmount.toLocaleString()}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionReportPage;
