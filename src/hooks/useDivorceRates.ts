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
    // 1) Fetch all from your aggregated table
    const { data, error } = await supabase
      .from("state_year_divorce_")
      .select<{
        state:           string;
        year:            string;
        avg_divorce_pct: string;
      }>("state, year, avg_divorce_pct")
      .range(0, -1);

    if (error || !data) {
      console.error("Error loading state_year_divorce_:", error);
      throw error || new Error("No data from state_year_divorce_");
    }

    // 2) Normalize
    type Row = { state: string; year: number; avgPct: number };
    const rows: Row[] = data.map((r) => ({
      state:  r.state,
      year:   Number(r.year),
      avgPct: Number(r.avg_divorce_pct),
    }));

    // 3) Group by year
    const byYear = rows.reduce<Record<number, Row[]>>((acc, cur) => {
      (acc[cur.year] ||= []).push(cur);
      return acc;
    }, {});

    // 4) Compute your stateCode _once_
    const safe = selectedState.trim().toUpperCase();
    const stateCode =
      safe === "ALL"
        ? null
        : safe.length === 2
          ? safe
          : stateNameToAbbreviation[safe.toLowerCase()]?.toUpperCase();
    console.log("🔑 stateCode for", selectedState, "→", stateCode);

    // 5) Build final 2020–2023 averages
    const YEARS = [2020, 2021, 2022, 2023];
    const result = YEARS.map((year) => {
      const list = byYear[year] || [];

      const avgNational = list.length
        ? Number(
            (
              list.reduce((sum, r) => sum + r.avgPct, 0) /
              list.length
            ).toFixed(1)
          )
        : 0;

      const avgState =
        stateCode === null
          ? avgNational
          : Number(
              (
                list.find((r) => r.state.toUpperCase() === stateCode)
                  ?.avgPct ?? 0
              ).toFixed(1)
            );

      return { year, avgState, avgNational };
    });

    console.log("🔍 final chart data:", result);
    return result;
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
