import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";
import { getSlabRate } from "../pages/InterestRatePage";

interface InterestConfig {
  baseRate: number;
  incrementRate: number;
}

const fetchConfig = async (): Promise<InterestConfig> => {
  try {
    const res = await api.get("/interest-config");
    return res.data?.data || { baseRate: 1, incrementRate: 1 };
  } catch {
    return { baseRate: 1, incrementRate: 1 };
  }
};

/**
 * Returns the correct interest rate for a given loan month.
 * monthNumber = how many months since loan start (1-based).
 * If no loan start date given, defaults to month 1 (new loan).
 */
export function useCurrentInterestRate(loanStartDate?: string) {
  const { data: config } = useQuery({
    queryKey: ["interest-config"],
    queryFn: fetchConfig,
    staleTime: 5 * 60 * 1000, // cache 5 mins
  });

  if (!config) return { rate: null, isLoading: true };

  let monthNumber = 1;
  if (loanStartDate) {
    const start = new Date(loanStartDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    monthNumber = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)) + 1);
  }

  const rate = getSlabRate(monthNumber, config.baseRate, config.incrementRate);

  return {
    rate,
    monthNumber,
    baseRate: config.baseRate,
    incrementRate: config.incrementRate,
    isLoading: false,
  };
}
