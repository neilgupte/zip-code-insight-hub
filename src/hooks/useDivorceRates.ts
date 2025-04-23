// src/hooks/useDivorceRates.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stateNameToAbbreviation } from "@/utils/stateMapping";

export interface DivorceRateChartData {
  year: number;
  avgState: number;    // percent, e.g. 8.1
  avgNational: number; // percent, e.g. 7.4
}

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async (): Promise<DivorceRateChartData[]> => {
    // Pull every row from your aggregated table
    const { data, error } = await supabase
      .from("state_year_divorce_")
      .select<{
        state:           string;
        year:            string;
        avg_divorce_pct: string;
      }>("state, year, avg_divorce_pct");

    if (error) {
      console.error("Error loading state_year_divorce table:", error);
      throw error;
    }
    if (!data.length) {
      console.warn("No rows in state_year_divorce");
      return [];  // fallback to empty
    }

    // Normalize into typed records
    type AggRow = { state: string; year: number; avgPct: number };
    const rows: AggRow[] = data.map((r) => ({
      state:  r.state,
      year:   Number(r.year),
      avgPct: Number(r.avg_divorce_pct),
    }));

    // Group by year
    const byYear = rows.reduce<Record<number, AggRow[]>>((acc, cur) => {
      (acc[cur.year] ||= []).push(cur);
      return acc;
    }, {});

    // Build the 2020–2023 result
    const YEARS = [2020, 2021, 2022, 2023];
    const stateCode =
      selectedState === "all"
        ? null
        : stateNameToAbbreviation[selectedState.toLowerCase()].toUpperCase();

    return YEARS.map((year) => {
      const list = byYear[year] || [];

      // national = mean of all states’ avgPct
      const avgNational =
        list.length > 0
          ? Number(
              (
                list.reduce((sum, r) => sum + r.avgPct, 0) / list.length
              ).toFixed(1)
            )
          : 0;

      // state = that state’s avgPct, or national if “all”
      const avgState =
        selectedState === "all"
          ? avgNational
          : Number(
              (
                list.find((r) => r.state.toUpperCase() === stateCode)
                  ?.avgPct ?? 0
              ).toFixed(1)
            );

      return { year, avgState, avgNational };
    });
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
