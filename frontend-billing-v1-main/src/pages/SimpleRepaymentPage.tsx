import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../utils/api";
import { Payment, RepaymentSearchResult } from "../types";
import { colors } from "../theme/colors";

// Simple, compact, single-page repayment form
// - Full width
// - Minimal fields
// - Two sections: Loan | Payment (similar to SimpleCreateBillingPage sections)

const searchLoanForRepayment = async (
  identifier: string
): Promise<RepaymentSearchResult> => {
  const response = await api.get(`/repayment/search/${identifier}`);
  return response.data;
};

const processRepayment = async (data: { loanId: string; payment: Payment }) => {
  const response = await api.post("/repayment/pay", data);
  return response.data;
};

export default function SimpleRepaymentPage() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<{ payment: Payment }>({
    defaultValues: {
      payment: {
        cash: 0,
        online: 0,
      },
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLoan, setSelectedLoan] =
    useState<RepaymentSearchResult | null>(null);

  const repaymentMutation = useMutation({
    mutationFn: processRepayment,
    onSuccess: () => {
      toast.success("Repayment processed successfully!");
      queryClient.invalidateQueries({ queryKey: ["active-loans"] });
      queryClient.invalidateQueries({ queryKey: ["inactive-loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedLoan(null);
      setSearchTerm("");
      reset();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to process repayment"
      );
    },
  });

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchTerm.trim()) {
        toast.error("Please enter a loan ID or phone number");
        return;
      }
      setIsSearching(true);
      setSelectedLoan(null);
      try {
        const result = await searchLoanForRepayment(searchTerm.trim());
        setSelectedLoan(result);
        setValue("payment.cash", result.loan.totalDue, {
          shouldValidate: true,
        });
        setValue("payment.online", 0, { shouldValidate: true });
        toast.success("Loan found successfully!");
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Loan not found");
      } finally {
        setIsSearching(false);
      }
    },
    [searchTerm, setValue]
  );

  const watchedPayment = watch("payment");
  const totalPayment =
    Number(watchedPayment?.cash || 0) + Number(watchedPayment?.online || 0);
  const amountDue = selectedLoan?.loan.totalDue || 0;
  const balance = amountDue - totalPayment;

  const onSubmit = async (data: { payment: Payment }) => {
    if (!selectedLoan) {
      toast.error("No loan selected");
      return;
    }

    if (totalPayment !== amountDue) {
      toast.error("Payment amount must equal total due amount");
      return;
    }

    await repaymentMutation.mutateAsync({
      loanId: selectedLoan.loan.loanId,
      payment: {
        cash: Number(data.payment.cash),
        online: Number(data.payment.online),
      },
    });
  };

  const sectionStyle: React.CSSProperties = {
    borderColor: colors.primary[200],
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: colors.primary.dark,
  };

  const outlineButtonStyle: React.CSSProperties = {
    borderColor: colors.primary[300],
    color: colors.primary.dark,
  };

  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: colors.primary.dark,
  };

  return (
    <div className="w-full p-3 sm:p-4 dark:bg-gray-900 min-h-screen">
      <h1
        className="text-xl sm:text-2xl font-semibold mb-3 dark:text-white"
        style={sectionTitleStyle}
      >
        Repayment
      </h1>

      {/* Row: Loan | Payment */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
      >
        {/* Loan */}
        <section
          className="space-y-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          style={sectionStyle}
        >
          <h2
            className="text-base sm:text-lg font-medium dark:text-white"
            style={sectionTitleStyle}
          >
            Loan
          </h2>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter loan ID or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className="px-3 py-1.5 border rounded text-sm dark:border-gray-500 dark:text-gray-300 hover:dark:bg-gray-700"
              style={outlineButtonStyle}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {selectedLoan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Loan ID
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedLoan.loan.loanId}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Customer
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={
                    typeof selectedLoan.loan.customerId === "object"
                      ? selectedLoan.loan.customerId.name
                      : ""
                  }
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Total Due
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={`₹${selectedLoan.loan.totalDue.toLocaleString()}`}
                  readOnly
                />
              </div>
            </div>
          )}
        </section>

        {/* Payment */}
        <section
          className="space-y-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          style={sectionStyle}
        >
          <h2
            className="text-base sm:text-lg font-medium dark:text-white"
            style={sectionTitleStyle}
          >
            Payment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 dark:text-gray-300">
                Cash
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0"
                {...register("payment.cash", {
                  required: "Required",
                  min: { value: 0, message: "Cannot be negative" },
                })}
              />
              {errors.payment?.cash && (
                <p className="text-xs text-red-600 mt-0.5">
                  {errors.payment.cash.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1 dark:text-gray-300">
                Online
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0"
                {...register("payment.online", {
                  min: { value: 0, message: "Cannot be negative" },
                })}
              />
              {errors.payment?.online && (
                <p className="text-xs text-red-600 mt-0.5">
                  {errors.payment.online.message}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-300">Total Payment</span>
              <span className="font-medium dark:text-white">
                ₹{totalPayment.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-300">Amount Due</span>
              <span className="font-medium dark:text-white">
                ₹{amountDue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-300">Balance</span>
              <span
                className={`font-medium ${
                  balance === 0
                    ? "text-green-600 dark:text-green-400"
                    : balance < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                ₹{balance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (selectedLoan) {
                  setValue("payment.cash", selectedLoan.loan.totalDue, {
                    shouldValidate: true,
                  });
                  setValue("payment.online", 0, { shouldValidate: true });
                }
              }}
              className="px-3 py-1.5 border rounded text-sm dark:border-gray-500 dark:text-gray-300 hover:dark:bg-gray-700"
              style={outlineButtonStyle}
              disabled={!selectedLoan}
            >
              Fill Exact Amount
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded text-white text-sm"
              style={primaryButtonStyle}
              disabled={
                !selectedLoan || balance !== 0 || repaymentMutation.isPending
              }
            >
              {repaymentMutation.isPending
                ? "Processing..."
                : "Process Payment"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
