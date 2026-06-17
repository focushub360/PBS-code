import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

interface MetalRates {
  gold24k: number;
  gold22k: number;
  gold18k: number;
  silver: number;
}

const fetchMetalRates = async (): Promise<MetalRates> => {
  try {
    const res = await api.get("/metal-rates");
    return res.data?.data || { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
  } catch {
    return { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
  }
};

export function useMetalRates() {
  const { data, isLoading } = useQuery({
    queryKey: ["metal-rates"],
    queryFn: fetchMetalRates,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Calculate estimated value based on master item name, carat, and weight.
   * masterItemName: "Gold" | "Silver" (case-insensitive)
   * carat: "24k" | "22k" | "18k" | "916" | "999" etc (for silver this is ignored)
   */
  const calculateValue = (masterItemName: string, carat: string, weight: number): number => {
    if (!data || !weight) return 0;
    const name = masterItemName?.toLowerCase() || "";
    const caratClean = carat?.toLowerCase().replace(/\D/g, ""); // strips "k", keeps digits

    if (name.includes("silver")) {
      return Math.round(weight * data.silver);
    }

    if (name.includes("gold")) {
      // Map both "24k" and "999" style carats to 24K rate
      if (caratClean === "24" || caratClean === "999") {
        return Math.round(weight * data.gold24k);
      }
      if (caratClean === "22" || caratClean === "916") {
        return Math.round(weight * data.gold22k);
      }
      if (caratClean === "18" || caratClean === "750") {
        return Math.round(weight * (data.gold18k || data.gold24k * 0.75));
      }
      // Default to 22K if carat unrecognized
      return Math.round(weight * data.gold22k);
    }

    return 0;
  };

  return { rates: data, isLoading, calculateValue };
}
