import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { X, CheckCircle } from "lucide-react";
import api from "../utils/api";
import { Loan, Payment } from "../types";
import { colors } from "../theme/colors";
import { InvoiceViewButtons } from "../components/InvoiceViewButtons";

interface LoanWithCustomer extends Loan {
  customer: {
    _id: string;
    name: string;
    phone: string;
    address: {
      doorNo: string;
      street: string;
      town: string;
      district: string;
      pincode: string;
    };
  };
  interestAmount: number;
  totalAmount: number;
  daysPending: number;
}

// Minimal, clean version of Loan Repayment Management page
// - Lightweight header
// - Simple search by phone/name/loan ID
// - Compact list rows with essential data only
// - Uses central colors for borders and emphasis

const fetchActiveLoansForRepayment = async (): Promise<LoanWithCustomer[]> => {
  const response = await api.get("/loans/active-for-repayment");
  return response.data;
};

const processRepayment = async (data: { loanId: string; payment: Payment }) => {
  const response = await api.post("/repayment/pay", data);
  return response.data;
};

export const LoanRepaymentManagementPage = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] =
    useState<LoanWithCustomer | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentSuccess, setRepaymentSuccess] = useState<any>(null);

  const {
    data: loans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["active-loans-repayment"],
    queryFn: fetchActiveLoansForRepayment,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ cash: number; online: number }>();

  const repaymentMutation = useMutation({
    mutationFn: processRepayment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-loans-repayment"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setRepaymentSuccess({
        loanId: data.loanId,
        loanObjectId: selectedLoanForRepayment?._id,
        customer: selectedLoanForRepayment?.customer,
        amount: data.totalAmount,
        interestAmount: data.interestAmount,
      });

      setShowRepaymentModal(false);
      reset();
    },
    onError: (error: any) => {
      console.error("Repayment error:", error);
    },
  });

  // Filter loans based on search
  const filteredLoans =
    loans?.filter((loan) => {
      return (
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.customer.phone.includes(searchTerm)
      );
    }) || [];

  const handleRepayClick = (loan: LoanWithCustomer) => {
    setSelectedLoanForRepayment(loan);
    setShowRepaymentModal(true);
  };

  const onRepaymentSubmit = (data: { cash: number; online: number }) => {
    if (!selectedLoanForRepayment) return;

    const payment: Payment = {
      cash: parseFloat(data.cash.toString()) || 0,
      online: parseFloat(data.online.toString()) || 0,
    };

    if (
      payment.cash + payment.online !==
      selectedLoanForRepayment.totalAmount
    ) {
      alert(
        `Total payment must equal ₹${selectedLoanForRepayment.totalAmount.toLocaleString()}`
      );
      return;
    }

    repaymentMutation.mutate({
      loanId: selectedLoanForRepayment._id,
      payment,
    });
  };

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
    color: colors.primary.dark,
  };

  return (
    <div className="w-full p-3 sm:p-4 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-3">
        <h1
          className="text-xl sm:text-2xl font-semibold dark:text-white"
          style={sectionTitleStyle}
        >
          Pledge Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Process loan repayments with automatic interest calculation (
          {filteredLoans.length} loans)
        </p>
      </div>

      {/* Search */}
      <section
        className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 mb-4"
        style={sectionStyle}
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by phone, name, or loan ID"
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
          Loading loans for repayment...
        </div>
      )}

      {error && (
        <div className="p-4 border rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 mb-4">
          Failed to load loans for repayment
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredLoans.length === 0 && !isLoading ? (
          <div
            className="p-4 border rounded-lg dark:border-gray-600 text-gray-700 dark:text-gray-300"
            style={sectionStyle}
          >
            No loans found for repayment.
          </div>
        ) : (
          filteredLoans.map((loan) => {
            return (
              <div
                key={loan._id}
                className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                style={sectionStyle}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  {/* Left: Customer */}
                  <div>
                    <div className="font-medium dark:text-white">
                      {loan.customer?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {loan.customer?.phone}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Loan ID: {loan.loanId}
                    </div>
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
                        ₹{loan.interestAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Due
                      </div>
                      <div className="font-semibold text-red-700 dark:text-red-400">
                        ₹{loan.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Meta + Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <div className="text-sm dark:text-gray-200">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Days
                      </div>
                      <div className="font-medium">{loan.daysPending} days</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {loan.interestPercent}% {loan.interestType}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRepayClick(loan)}
                        className="px-3 py-1.5 rounded text-sm text-white hover:opacity-90"
                        style={primaryButtonStyle}
                      >
                        Repay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Repayment Modal */}
      {showRepaymentModal && selectedLoanForRepayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                Process Pledge
              </h3>
              <button
                onClick={() => setShowRepaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer & Loan Info */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Customer:</strong>{" "}
                  {selectedLoanForRepayment.customer.name}
                </div>
                <div>
                  <strong>Loan ID:</strong> {selectedLoanForRepayment.loanId}
                </div>
                <div>
                  <strong>Principal:</strong> ₹
                  {selectedLoanForRepayment.amount.toLocaleString()}
                </div>
                <div>
                  <strong>Interest:</strong> ₹
                  {selectedLoanForRepayment.interestAmount.toLocaleString()}
                </div>
                <div>
                  <strong className="text-base">Total:</strong>{" "}
                  <span className="text-lg font-bold">
                    ₹{selectedLoanForRepayment.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form
              onSubmit={handleSubmit(onRepaymentSubmit)}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Cash (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cash", { min: 0 })}
                    className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Online (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("online", { min: 0 })}
                    className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRepaymentModal(false)}
                  className="px-3 py-1.5 border rounded text-sm hover:opacity-90"
                  style={outlineButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={repaymentMutation.isPending}
                  className="px-3 py-1.5 rounded text-sm text-white hover:opacity-90 disabled:opacity-50"
                  style={primaryButtonStyle}
                >
                  {repaymentMutation.isPending ? "Processing..." : "Process"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {repaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 relative">
                <button
                  onClick={() => setRepaymentSuccess(null)}
                  className="absolute top-3 right-3 p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full"
                >
                  <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                </button>

                <div className="flex items-center gap-3 pr-8">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Payment Successful!
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Loan {repaymentSuccess.loanId} has been fully repaid.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <InvoiceViewButtons
                  loanObjectId={repaymentSuccess.loanObjectId}
                  loanId={repaymentSuccess.loanId}
                  customerName={repaymentSuccess.customer?.name || "Customer"}
                  billingAvailable={true}
                  repaymentAvailable={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
