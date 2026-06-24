import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../utils/api";

// ── Types ────────────────────────────────────────────────────
interface InterestConfig {
  _id?: string;
  baseRate: number;       // e.g. 1 (= 1% per month)
  incrementRate: number;  // e.g. 1 (added every 3 months)
  effectiveFrom?: string;
}

interface MonthRow {
  month: number;
  slab: number;
  rate: number;
  interest: number;
  cumulativeInterest: number;
}

// ── Helpers ──────────────────────────────────────────────────
export function getSlabRate(
  monthNumber: number,   // 1-based, counted from loan start
  baseRate: number,
  incrementRate: number
): number {
  const slabIndex = Math.floor((monthNumber - 1) / 3); // 0,1,2,...
  return baseRate + slabIndex * incrementRate;
}

export function buildMonthTable(
  principal: number,
  baseRate: number,
  incrementRate: number,
  totalMonths = 30
): MonthRow[] {
  let cumulative = 0;
  return Array.from({ length: totalMonths }, (_, i) => {
    const month = i + 1;
    const slab = Math.floor(i / 3) + 1;
    const rate = baseRate + Math.floor(i / 3) * incrementRate;
    const interest = parseFloat(((principal * rate) / 100).toFixed(2));
    cumulative = parseFloat((cumulative + interest).toFixed(2));
    return { month, slab, rate, interest, cumulativeInterest: cumulative };
  });
}

// ── Fetch / Save config via API ──────────────────────────────
const fetchConfig = async (): Promise<InterestConfig> => {
  try {
    const res = await api.get("/interest-config");
    return res.data?.data || { baseRate: 1, incrementRate: 1 };
  } catch {
    // fallback if endpoint doesn't exist yet
    return { baseRate: 1, incrementRate: 1 };
  }
};

const saveConfig = async (config: InterestConfig) => {
  const res = await api.post("/interest-config", config);
  return res.data;
};

// ── Component ────────────────────────────────────────────────
export default function InterestRatePage() {
  const queryClient = useQueryClient();

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ["interest-config"],
    queryFn: fetchConfig,
  });

  const [baseRate, setBaseRate] = useState(1);
  const [incrementRate, setIncrementRate] = useState(1);
  const [principal, setPrincipal] = useState(100000);
  const [edited, setEdited] = useState(false);

  useEffect(() => {
    if (savedConfig) {
      setBaseRate(savedConfig.baseRate);
      setIncrementRate(savedConfig.incrementRate);
    }
  }, [savedConfig]);

  const mutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      toast.success("Interest config saved!");
      queryClient.invalidateQueries({ queryKey: ["interest-config"] });
      setEdited(false);
    },
    onError: () => {
      toast.error("Failed to save. Check backend /interest-config endpoint.");
    },
  });

  const rows = buildMonthTable(principal, baseRate, incrementRate, 30);
  const currentMonthRate = getSlabRate(1, baseRate, incrementRate);

  const slabColors = ["#EFF6FF", "#F0FDF4", "#FFF7ED", "#FDF4FF", "#FFF1F2", "#F0FDFA", "#FFFBEB", "#F8FAFC", "#FAF5FF", "#FFF8F0"];
  const slabBorders = ["#BFDBFE", "#BBF7D0", "#FED7AA", "#E9D5FF", "#FECDD3", "#99F6E4", "#FDE68A", "#CBD5E1", "#DDD6FE", "#FDBA74"];

  return (
    <div className="w-full p-4 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Interest Rate Configuration
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Set base rate and increment — applied automatically to all active loans
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* ── Config Card ── */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              ⚙️ Rate Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Base Interest Rate (% per month)
                </label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={baseRate}
                  onChange={(e) => { setBaseRate(Number(e.target.value)); setEdited(true); }}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Applied for months 1–3</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Increment per Slab (% added every 3 months)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={incrementRate}
                  onChange={(e) => { setIncrementRate(Number(e.target.value)); setEdited(true); }}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">e.g. 1% → Month 4-6 becomes {baseRate + incrementRate}%</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Preview Principal (₹)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Only for preview table — not saved</p>
              </div>

              <button
                onClick={() => mutation.mutate({ baseRate, incrementRate })}
                disabled={mutation.isPending || !edited}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                {mutation.isPending ? "Saving..." : edited ? "💾 Save Config" : "✓ Saved"}
              </button>
            </div>
          </div>

          {/* Slab Summary */}
          <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">📊 Slab Summary</h3>
            <div className="space-y-2">
              {Array.from({ length: 10 }, (_, i) => {
                const slab = i + 1;
                const rate = baseRate + i * incrementRate;
                const monthStart = i * 3 + 1;
                const monthEnd = i * 3 + 3;
                return (
                  <div
                    key={slab}
                    className="flex justify-between items-center px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: slabColors[i], border: `1px solid ${slabBorders[i]}` }}
                  >
                    <span className="font-medium" style={{ color: "#1F2937" }}>Slab {slab} (Month {monthStart}–{monthEnd})</span>
                    <span className="font-bold" style={{ color: "#111827" }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 30-Month Table ── */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                📅 30-Month Interest Schedule
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Principal: ₹{principal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="overflow-auto max-h-[600px]">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {["Month", "Slab", "Rate %", "Interest (₹)", "Cumulative (₹)", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isSlabStart = (row.month - 1) % 3 === 0 && row.month !== 1;
                    return (
                      <tr
                        key={row.month}
                        className={`border-t border-gray-100 dark:border-gray-700 ${
                          isSlabStart ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                          Month {row.month}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap inline-block"
                            style={{ backgroundColor: slabColors[(row.slab - 1) % 10], border: `1px solid ${slabBorders[(row.slab - 1) % 10]}`, color: "#374151" }}
                          >
                            Slab {row.slab}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-blue-600 dark:text-blue-400">
                          {row.rate}%
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 dark:text-white">
                          ₹{row.interest.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          ₹{row.cumulativeInterest.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-2.5">
                          {isSlabStart ? (
                            <span className="text-xs text-orange-600 font-semibold">⬆️ Rate increase</span>
                          ) : (
                            <span className="text-xs text-green-600">Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overdue Alert Legend */}
          <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">⚠️ Overdue Alert Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-2xl">🟡</span>
                <div>
                  <div className="text-sm font-semibold text-yellow-800">3 Months Overdue</div>
                  <div className="text-xs text-yellow-700 mt-0.5">Customer hasn't paid for 3 months. Yellow warning shown on loan list.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-2xl">🔴</span>
                <div>
                  <div className="text-sm font-semibold text-red-800">6 Months Overdue</div>
                  <div className="text-xs text-red-700 mt-0.5">Critical overdue. Red alert shown. Immediate follow-up required.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-2xl">📈</span>
                <div>
                  <div className="text-sm font-semibold text-blue-800">Rate Increases Automatically</div>
                  <div className="text-xs text-blue-700 mt-0.5">Every 3 months from loan date, rate increases by {incrementRate}% regardless of payment status.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="text-sm font-semibold text-green-800">Unpaid months use old rate</div>
                  <div className="text-xs text-green-700 mt-0.5">Months 1-3 unpaid = calculated at 1%. Month 4+ = calculated at new rate.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
