import React, { useState, useRef } from "react";
import { LivePhotoCapture } from "../components/LivePhotoCapture";
import { InvoiceModal } from "../components/InvoiceModal";
import { useCurrentInterestRate } from "../hooks/useCurrentInterestRate";
import { useMetalRates } from "../hooks/useMetalRates";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../utils/api";
import { BillingCreateRequest } from "../types";
import { SearchableDistrictDropdown } from "../components/SearchableDistrictDropdown";
import { colors } from "../theme/colors";

const createBilling = async (data: BillingCreateRequest) => {
  const response = await api.post("/billing/create", data);
  return response.data;
};

export default function SimpleCreateBillingPage() {
  const queryClient = useQueryClient();
  const { rate } = useCurrentInterestRate();
  const { calculateValue } = useMetalRates();

  // ── Invoice modal state ────────────────────────────────────
  const [invoiceState, setInvoiceState] = useState<{
    isOpen: boolean;
    loanId: string;
    loanObjectId: string;
    invoiceData: any;
  }>({ isOpen: false, loanId: "", loanObjectId: "", invoiceData: null });

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
        interestPercent: rate ?? 2.5,
        validity: "6",
      },
      payment: {
        cash: "" as unknown as number,
        online: "" as unknown as number,
      },
    },
  });

  // ── KYC state ──────────────────────────────────────────────
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarError, setAadhaarError] = useState("");

  const [livePhoto, setLivePhoto] = useState<File | null>(null);
  const [livePhotoPreview, setLivePhotoPreview] = useState<string | null>(null);

  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);

  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);

  const [otherID, setOtherID] = useState<File | null>(null);
  const [otherIDPreview, setOtherIDPreview] = useState<string | null>(null);

  const handleFileChange = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    if (!file) return;
    setFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      // PDF or non-image — show filename as "preview"
      setPreview(null);
    }
  };

  const validateAadhaar = (val: string) => {
    if (!/^\d{12}$/.test(val)) {
      setAadhaarError("Aadhaar must be exactly 12 digits");
    } else {
      setAadhaarError("");
    }
    setAadhaarNumber(val);
  };

  // ── existing logic ─────────────────────────────────────────
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

  const fetchMasterItems = async () => {
    const response = await api.get("/items/master");
    return response.data;
  };
  const {
    data: masterItems = [],
    isLoading,
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
      setValue(`items.${index}.category`, "");
      setValue(`items.${index}.carat`, "");
    }
  };

  const handleCategoryChange = (index: number, categoryName: string) => {
    setValue(`items.${index}.category`, categoryName);
  };

  const handleCaratChange = (index: number, caratValue: string) => {
    setValue(`items.${index}.carat`, caratValue);
    // Auto-calculate estimated value based on master item + carat + weight
    const masterItem = selectedMasterItems[index];
    const weight = Number(watch(`items.${index}.weight`)) || 0;
    if (masterItem?.name && weight > 0) {
      const autoValue = calculateValue(masterItem.name, caratValue, weight);
      if (autoValue > 0) {
        setValue(`items.${index}.estimatedValue`, autoValue as any, { shouldValidate: true });
      }
    }
  };

  const mutation = useMutation({
    mutationFn: createBilling,
    onSuccess: (response, variables) => {
      toast.success("Billing created successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["billing-stats"] });

      // Open existing InvoiceModal with API response
      setInvoiceState({
        isOpen: true,
        loanId: response?.data?.loanId || "",
        loanObjectId: response?.data?.loanObjectId || "",
        invoiceData: {
          customerName: variables.customer.name,
          customerPhone: variables.customer.phone,
          loanAmount: Number(variables.loan.amount),
          payment: variables.payment,
          items: (variables.items as any[]).map((it: any) => ({
            name: it.name,
            category: it.category,
            weight: it.weight,
            estimatedValue: it.estimatedValue,
          })),
        },
      });

      reset();
      setAadhaarNumber("");
      setLivePhoto(null); setLivePhotoPreview(null);
      setAadhaarFront(null); setAadhaarFrontPreview(null);
      setAadhaarBack(null); setAadhaarBackPreview(null);
      setOtherID(null); setOtherIDPreview(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to create billing";
      toast.error(msg);
    },
  });

  const onSubmit = (data: BillingCreateRequest) => {
    // KYC validation
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      toast.error("Enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (!livePhoto) {
      toast.error("Live photo capture is required.");
      return;
    }
    if (!aadhaarFront) {
      toast.error("Aadhaar front photo is required.");
      return;
    }
    if (!aadhaarBack) {
      toast.error("Aadhaar back photo is required.");
      return;
    }

    const parsed = {
      ...data,
      items: data.items.map((it, i) => ({
        ...it,
        code: it.code || `BILLING_${Date.now()}_${i}`,
        weight: typeof it.weight === "string" ? Number(it.weight) as any : it.weight,
        estimatedValue: typeof (it as any).estimatedValue === "string"
          ? Number((it as any).estimatedValue)
          : (it as any).estimatedValue,
      })) as any,
      loan: {
        ...data.loan,
        amount: typeof data.loan.amount === "string" ? Number(data.loan.amount) : data.loan.amount,
        interestPercent: typeof data.loan.interestPercent === "string"
          ? Number(data.loan.interestPercent)
          : data.loan.interestPercent,
        validity: String(data.loan.validity),
      },
      payment: {
        cash: typeof data.payment.cash === "string" ? Number(data.payment.cash) : data.payment.cash,
        online: typeof data.payment.online === "string" ? Number(data.payment.online) : data.payment.online,
      },
    } as BillingCreateRequest;

    if (!parsed.customer.name || !parsed.customer.phone || !parsed.customer.nominee) {
      toast.error("Customer name, phone, and nominee are required.");
      return;
    }
    if (
      !parsed.customer.address?.doorNo ||
      !parsed.customer.address?.street ||
      !parsed.customer.address?.town ||
      !parsed.customer.address?.district ||
      !parsed.customer.address?.pincode
    ) {
      toast.error("All customer address fields are required.");
      return;
    }
    const itemsInvalid = (parsed.items as any[]).some(
      (it) => !it.name || !it.category || !it.weight || it.weight <= 0 || !it.estimatedValue || it.estimatedValue <= 0
    );
    if (itemsInvalid) {
      toast.error("Please select master item and category, and enter weight and estimated value (> 0) for all items.");
      return;
    }
    const totalPayment = (parsed.payment.cash || 0) + (parsed.payment.online || 0);
    if (totalPayment > parsed.loan.amount) {
      toast.error("Total payment cannot exceed loan amount.");
      return;
    }

    // If your backend accepts FormData for file uploads, build FormData here.
    // Otherwise attach KYC data as additional fields:
    const formData = new FormData();
    formData.append("data", JSON.stringify({ ...parsed, aadhaarNumber }));
    if (livePhoto) formData.append("livePhoto", livePhoto);
    if (aadhaarFront) formData.append("aadhaarFront", aadhaarFront);
    if (aadhaarBack) formData.append("aadhaarBack", aadhaarBack);
    if (otherID) formData.append("otherIDProof", otherID);

    // mutation.mutate(formData as any);   ← use this when backend is ready for FormData
    mutation.mutate(parsed); // keep existing flow until backend is updated
  };

  const sectionStyle: React.CSSProperties = { borderColor: colors.primary[100] };
  const primaryButtonStyle: React.CSSProperties = { backgroundColor: colors.primary.medium };
  const outlineButtonStyle: React.CSSProperties = { borderColor: colors.primary[200], color: colors.primary.dark };

  const loanAmount = Number(watch("loan.amount")) || 0;
  if (loanAmount > totalEstimated && totalEstimated > 0) {
    setValue("loan.amount", totalEstimated as any, { shouldValidate: true });
  }

  // ── small reusable preview box ─────────────────────────────
  const PhotoPreview = ({ preview, file, label }: { preview: string | null; file: File | null; label: string }) => {
    if (!file) return null;
    return (
      <div className="mt-1.5 flex items-center gap-2">
        {preview ? (
          <img src={preview} alt={label} className="w-14 h-14 object-cover rounded border dark:border-gray-600" />
        ) : (
          <div className="w-14 h-14 flex items-center justify-center rounded border bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
            <span className="text-lg">📄</span>
          </div>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{file.name}</span>
      </div>
    );
  };

  return (
    <div className="w-full p-3 sm:p-4 dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
        Create Billing
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Customer | Items */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* ── Customer ── */}
          <section
            className="space-y-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            style={sectionStyle}
          >
            <h2 className="text-base sm:text-lg font-medium dark:text-white">Customer</h2>

            {/* Name + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Full Name *</label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Customer name"
                  {...register("customer.name", { required: "Name is required" })}
                />
                {errors.customer?.name && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.customer.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Phone *</label>
                <input
                  type="tel"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="10-digit phone"
                  {...register("customer.phone", {
                    required: "Phone is required",
                    pattern: { value: /^[0-9]{10}$/ as unknown as RegExp, message: "Must be 10 digits" },
                  })}
                />
                {errors.customer?.phone && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.customer.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Door No *</label>
                <input className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.doorNo", { required: "Required" })} />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Street *</label>
                <input className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.street", { required: "Required" })} />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Town *</label>
                <input className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.town", { required: "Required" })} />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">District *</label>
                <SearchableDistrictDropdown
                  value={watch("customer.address.district") || ""}
                  onChange={(value) => setValue("customer.address.district", value)}
                  error={errors.customer?.address?.district?.message}
                  placeholder="Select district"
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Pincode *</label>
                <input className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("customer.address.pincode", { required: "Required" })} />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Nominee *</label>
                <input
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nominee name"
                  {...register("customer.nominee", { required: "Nominee is required" })}
                />
                {errors.customer?.nominee && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.customer.nominee.message}</p>
                )}
              </div>
            </div>

            {/* ── KYC & Identity ── */}
            <div className="pt-2 border-t dark:border-gray-600">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                KYC &amp; Identity
              </h3>

              <div className="space-y-3">

                {/* Aadhaar Number */}
                <div>
                  <label className="block text-xs mb-1 dark:text-gray-300">Aadhaar Number *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => validateAadhaar(e.target.value.replace(/\D/g, ""))}
                    placeholder="12-digit Aadhaar number"
                    className={`w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white ${
                      aadhaarError ? "border-red-500" : "dark:border-gray-600"
                    }`}
                  />
                  {aadhaarError && <p className="text-xs text-red-600 mt-0.5">{aadhaarError}</p>}
                  {aadhaarNumber.length === 12 && !aadhaarError && (
                    <p className="text-xs text-green-600 mt-0.5">✓ Valid Aadhaar number</p>
                  )}
                </div>

                {/* Live Photo — WebRTC camera capture */}
                <div>
                  <LivePhotoCapture
                    captured={!!livePhoto}
                    onCapture={(file, preview) => {
                      setLivePhoto(file);
                      setLivePhotoPreview(preview);
                    }}
                  />
                  <PhotoPreview preview={livePhotoPreview} file={livePhoto} label="Live photo" />
                </div>

                {/* Aadhaar Front + Back side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1 dark:text-gray-300">Aadhaar Front *</label>
                    <label className="flex items-center gap-2 px-2 py-1.5 border rounded text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                      <span>🪪</span>
                      <span className="dark:text-gray-300">
                        {aadhaarFront ? aadhaarFront.name : "Upload front side"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(e.target.files?.[0] || null, setAadhaarFront, setAadhaarFrontPreview)
                        }
                      />
                    </label>
                    <PhotoPreview preview={aadhaarFrontPreview} file={aadhaarFront} label="Aadhaar front" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 dark:text-gray-300">Aadhaar Back *</label>
                    <label className="flex items-center gap-2 px-2 py-1.5 border rounded text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                      <span>🪪</span>
                      <span className="dark:text-gray-300">
                        {aadhaarBack ? aadhaarBack.name : "Upload back side"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileChange(e.target.files?.[0] || null, setAadhaarBack, setAadhaarBackPreview)
                        }
                      />
                    </label>
                    <PhotoPreview preview={aadhaarBackPreview} file={aadhaarBack} label="Aadhaar back" />
                  </div>
                </div>

                {/* Other ID Proof — optional */}
                <div>
                  <label className="block text-xs mb-1 dark:text-gray-300">
                    Other ID Proof{" "}
                    <span className="text-gray-400 font-normal">(optional — Voter ID, Passport, DL...)</span>
                  </label>
                  <label className="flex items-center gap-2 px-2 py-1.5 border rounded text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 border-dashed">
                    <span>📎</span>
                    <span className="dark:text-gray-300">
                      {otherID ? otherID.name : "Upload image or PDF"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] || null, setOtherID, setOtherIDPreview)
                      }
                    />
                  </label>
                  <PhotoPreview preview={otherIDPreview} file={otherID} label="Other ID" />
                </div>

              </div>
            </div>
            {/* end KYC */}

          </section>

          {/* ── Items ── */}
          <section
            className="space-y-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            style={sectionStyle}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-medium dark:text-white">Items</h2>
              <button
                type="button"
                className="px-2 py-1 border rounded text-xs dark:border-gray-500 dark:text-gray-300 hover:dark:bg-gray-700"
                style={outlineButtonStyle}
                onClick={() =>
                  append({
                    code: "", name: "", category: "", carat: "",
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
              const categories = selectedMaster?.categories || [];
              const carats = selectedMaster?.carats || [];

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded p-2 dark:border-gray-600"
                  style={{ borderColor: colors.primary[100] }}
                >
                  <div className="md:col-span-3">
                    <label className="block text-xs mb-1 dark:text-gray-300">Master Item</label>
                    <select
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={selectedMaster?._id || ""}
                      onChange={(e) => handleMasterItemSelect(index, e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">{isLoading ? "Loading..." : "Select master item"}</option>
                      {masterItems.map((item: any) => (
                        <option key={item._id} value={item._id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">Category</label>
                    <select
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={watch(`items.${index}.category`) || ""}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      disabled={!selectedMaster}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">Carat</label>
                    <select
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={watch(`items.${index}.carat`) || ""}
                      onChange={(e) => handleCaratChange(index, e.target.value)}
                      disabled={!selectedMaster}
                    >
                      <option value="">Select carat</option>
                      {carats.map((carat: string) => (
                        <option key={carat} value={carat}>{carat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">Weight</label>
                    <input
                      type="number" step="0.01"
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      {...register(`items.${index}.weight` as const, {
                        onChange: (e) => {
                          const masterItem = selectedMasterItems[index];
                          const carat = watch(`items.${index}.carat`);
                          const weight = Number(e.target.value) || 0;
                          if (masterItem?.name && carat && weight > 0) {
                            const autoValue = calculateValue(masterItem.name, carat, weight);
                            if (autoValue > 0) {
                              setValue(`items.${index}.estimatedValue`, autoValue as any, { shouldValidate: true });
                            }
                          }
                        },
                      })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs mb-1 dark:text-gray-300">
                      Estimated Value * <span className="text-gray-400 font-normal">(auto-calc, editable)</span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      {...register(`items.${index}.estimatedValue` as const, { required: "Required" })}
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
            <h2 className="text-base sm:text-lg font-medium dark:text-white">Loan</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Amount *</label>
                <div className="relative">
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
                    Fill customer and items first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Interest Type</label>
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
                <label className="block text-xs mb-1 dark:text-gray-300">Interest %</label>
                <input
                  type="number" step="0.01"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("loan.interestPercent", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Validity (months)</label>
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
            <h2 className="text-base sm:text-lg font-medium dark:text-white">Payment</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Cash</label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  {...register("payment.cash")}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">Online</label>
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
            onClick={() => {
              reset();
              setAadhaarNumber("");
              setLivePhoto(null); setLivePhotoPreview(null);
              setAadhaarFront(null); setAadhaarFrontPreview(null);
              setAadhaarBack(null); setAadhaarBackPreview(null);
              setOtherID(null); setOtherIDPreview(null);
            }}
            className="px-4 py-2 border rounded dark:border-gray-500 dark:text-gray-300 hover:dark:bg-gray-700"
            style={outlineButtonStyle}
          >
            Reset
          </button>
        </div>
      </form>

      {/* Invoice Modal — opens automatically after billing is created */}
      <InvoiceModal
        isOpen={invoiceState.isOpen}
        onClose={() => setInvoiceState(s => ({ ...s, isOpen: false }))}
        loanId={invoiceState.loanId}
        loanObjectId={invoiceState.loanObjectId}
        type="view"
        invoiceData={invoiceState.invoiceData}
      />
    </div>
  );
}
