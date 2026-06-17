import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../utils/api";

interface MetalRates {
  gold24k: number;
  gold22k: number;
  gold18k: number;
  silver: number;
  updatedAt?: string;
}

const fetchMetalRates = async (): Promise<MetalRates> => {
  try {
    const res = await api.get("/metal-rates");
    return res.data?.data || { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
  } catch {
    return { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
  }
};

const saveMetalRates = async (rates: MetalRates) => {
  const res = await api.post("/metal-rates", rates);
  return res.data;
};

export default function GoldRateSettingsPage() {
  const queryClient = useQueryClient();
  const { data: savedRates } = useQuery({
    queryKey: ["metal-rates"],
    queryFn: fetchMetalRates,
  });

  const [gold24k, setGold24k] = useState(0);
  const [gold22k, setGold22k] = useState(0);
  const [gold18k, setGold18k] = useState(0);
  const [silver, setSilver] = useState(0);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (savedRates) {
      setGold24k(savedRates.gold24k || 0);
      setGold22k(savedRates.gold22k || 0);
      setGold18k(savedRates.gold18k || 0);
      setSilver(savedRates.silver || 0);
    }
  }, [savedRates]);

  const mutation = useMutation({
    mutationFn: saveMetalRates,
    onSuccess: () => {
      toast.success("Rates updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["metal-rates"] });
      setEdited(false);
    },
    onError: () => toast.error("Failed to save rates"),
  });

  const handleSave = () => {
    mutation.mutate({ gold24k, gold22k, gold18k, silver });
  };

  const autoFillFrom24k = () => {
    setGold22k(Math.round(gold24k * (22 / 24)));
    setGold18k(Math.round(gold24k * (18 / 24)));
    setEdited(true);
  };

  // ── OPTION A: Coral for gold, Gray for silver ──────────────
  const rateFields = [
    { label: "24 karat gold", value: gold24k, setValue: setGold24k, cardClass: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800", labelClass: "text-orange-700 dark:text-orange-400", valueClass: "text-orange-900 dark:text-orange-200" },
    { label: "22 karat gold", value: gold22k, setValue: setGold22k, cardClass: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800", labelClass: "text-orange-700 dark:text-orange-400", valueClass: "text-orange-900 dark:text-orange-200" },
    { label: "18 karat gold", value: gold18k, setValue: setGold18k, cardClass: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800", labelClass: "text-orange-700 dark:text-orange-400", valueClass: "text-orange-900 dark:text-orange-200" },
    { label: "Silver", value: silver, setValue: setSilver, cardClass: "bg-gray-100 dark:bg-gray-700/40 border-gray-300 dark:border-gray-600", labelClass: "text-gray-600 dark:text-gray-400", valueClass: "text-gray-800 dark:text-gray-200" },
  ];

  return (
    <div className="w-full p-4 dark:bg-gray-900 min-h-screen">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Gold &amp; silver rate settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update today's rates per gram — used to auto-calculate item value in Create Billing
        </p>
      </div>

      {savedRates?.updatedAt && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-xs text-blue-700 dark:text-blue-400">
            Last updated: {new Date(savedRates.updatedAt).toLocaleString("en-IN")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {rateFields.map((field) => (
          <div
            key={field.label}
            className={`border rounded-md px-3 py-2.5 ${field.cardClass}`}
          >
            <p className={`text-xs mb-0.5 ${field.labelClass}`}>{field.label}</p>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-sm ${field.labelClass}`}>₹</span>
              <input
                type="number"
                value={field.value || ""}
                onChange={(e) => { field.setValue(Number(e.target.value)); setEdited(true); }}
                className={`bg-transparent border-none p-0 h-auto text-base font-medium w-16 focus:outline-none focus:ring-0 ${field.valueClass}`}
                placeholder="0"
              />
              <span className={`text-xs ${field.labelClass}`}>/g</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={autoFillFrom24k}
          disabled={!gold24k}
          className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Auto-fill 22K &amp; 18K from 24K
        </button>
        <button
          onClick={handleSave}
          disabled={mutation.isPending || !edited}
          className="px-3 py-1.5 text-xs border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? "Saving..." : edited ? "Save" : "Saved"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          How auto-calculation works in billing
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
          1. In Create Billing, select master item, carat, and enter weight.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
          2. Estimated value auto-fills as weight × rate per gram.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          3. Staff can still manually edit the calculated value.
        </p>
      </div>
    </div>
  );
}
