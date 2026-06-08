import React, { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../utils/api";
import { BillingCreateRequest } from "../types";
import { SearchableDistrictDropdown } from "../components/SearchableDistrictDropdown";
import { colors } from "../theme/colors";

// Simple, compact, single-page billing form
// - Full width
// - All fields visible
// - 2 rows x 2 columns (Customer | Items) on first row and (Loan | Payment) on second row
// - Uses project theme colors

const createBilling = async (data: BillingCreateRequest) => {
  const response = await api.post("/billing/create", data);
  return response.data;
};

export default function SimpleCreateBillingPage() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BillingCreateRequest>({
    defaultValues: {
      customer: {
        name: "",
        phone: "",
        address: {
          doorNo: "",
          street: "",
          town: "",
          district: "",
          pincode: "",
        },
        nominee: "",
      },
      items: [
        {
          code: "",
          name: "",
          category: "",
          carat: "",
          weight: "" as unknown as number,
          estimatedValue: "" as unknown as number,
        },
      ],
      loan: {
        amount: "" as unknown as number,
        interestType: "monthly",
        interestPercent: 2.5,
        validity: "6",
      },
      payment: {
        cash: "" as unknown as number,
        online: "" as unknown as number,
      },
    },
  });

  // Live completeness checks for step gating
  const watchedItems = watch("items");
  const watchedCustomer = watch("customer");

  const totalEstimated = (
    Array.isArray(watchedItems) ? watchedItems : []
  ).reduce((sum, it: any) => sum + (Number(it?.estimatedValue) || 0), 0);

  const isCustomerComplete = Boolean(
    watchedCustomer?.name &&
      /^[0-9]{10}$/.test(watchedCustomer?.phone || "") &&
      watchedCustomer?.address?.doorNo &&
      watchedCustomer?.address?.street &&
      watchedCustomer?.address?.town &&
      watchedCustomer?.address?.district &&
      watchedCustomer?.address?.pincode &&
      watchedCustomer?.nominee
  );

  const isItemsComplete =
    Array.isArray(watchedItems) &&
    watchedItems.length > 0 &&
    watchedItems.every((it: any) => Number(it?.estimatedValue) > 0);

  const canEnterLoan = isCustomerComplete && isItemsComplete;

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Bring master-items and selection state from advanced page
  const fetchMasterItems = async () => {
    const response = await api.get("/items/master");
    return response.data;
  };
  const {
    data: masterItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["master-items"],
    queryFn: fetchMasterItems,
  });

  const [selectedMasterItems, setSelectedMasterItems] = useState<{
    [key: number]: any;
  }>({});
  const handleMasterItemSelect = (index: number, masterItemId: string) => {
    if (!masterItemId) {
      setSelectedMasterItems((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setValue(`items.${index}.code`, "");
      setValue(`items.${index}.name`, "");
      setValue(`items.${index}.category`, "");
      setValue(`items.${index}.carat`, "");
      return;
    }
    const masterItem = masterItems.find((it: any) => it._id === masterItemId);

    if (masterItem) {
      setSelectedMasterItems((prev) => ({ ...prev, [index]: masterItem }));
      setValue(`items.${index}.code`, masterItem.code || "");
      setValue(`items.${index}.name`, masterItem.name || "");
      // Clear category and carat when master item changes
      setValue(`items.${index}.category`, "");
      setValue(`items.${index}.carat`, "");
    }
  };

  const handleCategoryChange = (index: number, categoryName: string) => {
    setValue(`items.${index}.category`, categoryName);
    // Don't clear carat since carats are available for all categories in this master item
  };

  const handleCaratChange = (index: number, caratValue: string) => {
    setValue(`items.${index}.carat`, caratValue);
  };

  const mutation = useMutation({
    mutationFn: createBilling,
    onSuccess: () => {
      toast.success("Billing created successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });
      reset();
    },
    onError: (error: any) => {
      console.error(error);
      const msg = error?.response?.data?.message || "Failed to create billing";
      toast.error(msg);
    },
  });

  const onSubmit = (data: BillingCreateRequest) => {
    const parsed = {
      ...data,
      items: data.items.map((it, i) => ({
        ...it,
        code: it.code || `BILLING_${Date.now()}_${i}`,
        weight:
          typeof it.weight === "string"
            ? (Number(it.weight) as unknown as any)
            : it.weight,
        estimatedValue:
          typeof (it as any).estimatedValue === "string"
            ? Number((it as any).estimatedValue)
            : (it as any).estimatedValue,
      })) as any,
      loan: {
        ...data.loan,
        amount:
          typeof data.loan.amount === "string"
            ? Number(data.loan.amount)
            : data.loan.amount,
        interestPercent:
          typeof data.loan.interestPercent === "string"
            ? Number(data.loan.interestPercent)
            : data.loan.interestPercent,
        validity: String(data.loan.validity),
      },
      payment: {
        cash:
          typeof data.payment.cash === "string"
            ? Number(data.payment.cash)
            : data.payment.cash,
        online:
          typeof data.payment.online === "string"
            ? Number(data.payment.online)
            : data.payment.online,
      },
    } as BillingCreateRequest;

    // Frontend validation mirroring backend requirements
    // Check customer data
    if (
      !parsed.customer.name ||
      !parsed.customer.phone ||
      !parsed.customer.nominee
    ) {
      toast.error("Customer name, phone, and nominee are required.");
      return;
    }

    // Check address data
    if (
      !parsed.customer.address ||
      !parsed.customer.address.doorNo ||
      !parsed.customer.address.street ||
      !parsed.customer.address.town ||
      !parsed.customer.address.district ||
      !parsed.customer.address.pincode
    ) {
      toast.error("All customer address fields are required.");
      return;
    }

    // Check items data
    const itemsInvalid = (parsed.items as any[]).some(
      (it) =>
        !it.name ||
        !it.category ||
        !it.weight ||
        it.weight <= 0 ||
        !it.estimatedValue ||
        it.estimatedValue <= 0
    );
    if (itemsInvalid) {
      toast.error(
        "Please select master item and category, and enter weight and estimated value (> 0) for all items."
      );
      return;
    }

    const totalPayment =
      (parsed.payment.cash || 0) + (parsed.payment.online || 0);
    if (totalPayment > parsed.loan.amount) {
      toast.error("Total payment cannot exceed loan amount.");
      return;
    }

    mutation.mutate(parsed);
  };

  const sectionStyle: React.CSSProperties = {
    // Light theme subtle border tint
    borderColor: colors.primary[100],
  };

  const sectionTitleStyle: React.CSSProperties = {
    // Ensure readable title color in light theme
    color: undefined, // use class-based color; reserved for future tweaks
  };

  const primaryButtonStyle: React.CSSProperties = {
    // Make submit button visible in light theme
    backgroundColor: colors.primary.medium,
  };

  const outlineButtonStyle: React.CSSProperties = {
    // Improve outline visibility in light theme
    borderColor: colors.primary[200],
    color: colors.primary.dark,
  };

  // Enforce max loan = total estimated
  const loanAmount = Number(watch("loan.amount")) || 0;
  if (loanAmount > totalEstimated && totalEstimated > 0) {
    setValue("loan.amount", totalEstimated as any, { shouldValidate: true });
  }

  return (
    <div className="w-full p-3 sm:p-4 dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
        Create Billing
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Customer | Items */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Customer */}
          <section
            className="space-y-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            style={sectionStyle}
          >
            <h2
              className="text-base sm:text-lg font-medium dark:text-white"
              style={sectionTitleStyle}
            >
              Customer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Customer name"
                  {...register("customer.name", {
                    required: "Name is required",
                  })}
                />
                {errors.customer?.name && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {errors.customer.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Phone *
                </label>
                <input
                  type="tel"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="10-digit phone"
                  {...register("customer.phone", {
                    required: "Phone is required",
                    pattern: {
                      value: /^[0-9]{10}$/ as unknown as RegExp,
                      message: "Must be 10 digits",
                    },
                  })}
                />
                {errors.customer?.phone && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {errors.customer.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Door No *
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.doorNo", {
                    required: "Required",
                  })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Street *
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.street", {
                    required: "Required",
                  })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Town *
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.town", {
                    required: "Required",
                  })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  District *
                </label>
                <SearchableDistrictDropdown
                  value={watch("customer.address.district") || ""}
                  onChange={(value) =>
                    setValue("customer.address.district", value)
                  }
                  error={errors.customer?.address?.district?.message}
                  placeholder="Select district"
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Pincode *
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.pincode", {
                    required: "Required",
                  })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Nominee *
                </label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nominee name"
                  {...register("customer.nominee", {
                    required: "Nominee is required",
                  })}
                />
                {errors.customer?.nominee && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {errors.customer.nominee.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Items */}
          <section
            className="space-y-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            style={sectionStyle}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-base sm:text-lg font-medium dark:text-white"
                style={sectionTitleStyle}
              >
                Items
              </h2>
              <button
                type="button"
                className="px-2 py-1 border rounded text-xs dark:border-gray-500 dark:text-gray-300 hover:dark:bg-gray-700"
                style={outlineButtonStyle}
                onClick={() =>
                  append({
                    code: "",
                    name: "",
                    category: "",
                    carat: "",
                    weight: "" as unknown as number,
                    estimatedValue: "" as unknown as number,
                  })
                }
              >
                + Add Item
              </button>
            </div>

            {fields.map((field, index) => {
              const selectedMaster = selectedMasterItems[index];
              // Categories are just strings in the backend
              const categories = selectedMaster?.categories || [];
              const watchedCategory = watch(`items.${index}.category`);
              // Carats are available for all categories of this master item
              const carats = selectedMaster?.carats || [];

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded p-2 dark:border-gray-600"
                  style={{ borderColor: colors.primary[100] }}
                >
                  <div className="md:col-span-3">
                    <label className="block text-xs mb-1 dark:text-gray-300">
                      Master Item
                    </label>
                    <select
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={selectedMaster?._id || ""}
                      onChange={(e) =>
                        handleMasterItemSelect(index, e.target.value)
                      }
                      disabled={isLoading}
                    >
                      <option value="">
                        {isLoading ? "Loading..." : "Select master item"}
                      </option>
                      {masterItems.map((item: any) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={watch(`items.${index}.category`) || ""}
                      onChange={(e) =>
                        handleCategoryChange(index, e.target.value)
                      }
                      disabled={!selectedMaster}
                    >
                      <option value="">Select category</option>
                      {categories.map((categoryName: string) => (
                        <option key={categoryName} value={categoryName}>
                          {categoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">
                      Carat
                    </label>
                    <select
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={watch(`items.${index}.carat`) || ""}
                      onChange={(e) => handleCaratChange(index, e.target.value)}
                      disabled={!selectedMaster}
                    >
                      <option value="">Select carat</option>
                      {carats.map((carat: string) => (
                        <option key={carat} value={carat}>
                          {carat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">
                      Weight
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      {...register(`items.${index}.weight` as const)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">
                      Estimated Value *
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      {...register(`items.${index}.estimatedValue` as const, {
                        required: "Required",
                      })}
                    />
                  </div>
                  <div className="md:col-span-1 flex gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 border rounded text-xs dark:border-gray-600 dark:text-gray-300"
                      onClick={() => remove(index)}
                    >
                      −
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        {/* Row 2: Loan | Payment */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Amount *
                </label>
                <div className="relative">
                  {/* Background hint shows total estimated when loan not yet entered */}
                  {!Number(watch("loan.amount")) && totalEstimated > 0 && (
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-gray-400 dark:text-gray-500">
                      Est: {totalEstimated}
                    </span>
                  )}
                  <input
                    type="number"
                    className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60"
                    {...register("loan.amount", { required: "Required" })}
                    disabled={!canEnterLoan}
                  />
                </div>
                {!canEnterLoan && (
                  <p className="text-[11px] mt-1 text-gray-500 dark:text-gray-400">
                    Fill customer and items (with estimated value) first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Interest Type
                </label>
                <select
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("loan.interestType")}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Interest %
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("loan.interestPercent", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Validity (months)
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("loan.validity")}
                />
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Cash
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("payment.cash")}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Online
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("payment.online")}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
            style={primaryButtonStyle}
          >
            {mutation.isPending ? "Saving..." : "Create Billing"}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 border rounded dark:border-gray-500 dark:text-gray-300 hover:dark:bg-gray-700"
            style={outlineButtonStyle}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
