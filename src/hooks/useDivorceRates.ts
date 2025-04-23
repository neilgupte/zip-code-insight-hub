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
    // 1) Fetch from the aggregated view
    const { data, error } = await supabase
      .from("state_year_divorce_")
      .select<{
        state:           string;
        year:            string;
        avg_divorce_pct: string;
      }>("state, year, avg_divorce_pct")
      .range(0, -1);

    console.log("🔍 [view] raw rows:", data);
    console.log("🔍 [view] row count:", data?.length);

    if (error || !data) {
      console.error("Error loading state_year_divorce view:", error);
      throw error || new Error("No data from state_year_divorce");
    }

    // 2) Normalize into typed rows
    type Row = { state: string; year: number; avgPct: number };
    const rows: Row[] = data.map((r) => ({
      state: r.state,
      year: Number(r.year),
      avgPct: Number(r.avg_divorce_pct),
    }));
    console.log("🔍 [view] normalized rows (first 10):", rows.slice(0, 10));

    // 3) Group by year
    const byYear = rows.reduce<Record<number, Row[]>>((acc, cur) => {
      (acc[cur.year] ||= []).push(cur);
      return acc;
    }, {});
    console.log(
      "🔍 [view] grouped counts by year:",
      Object.entries(byYear).map(([yr, arr]) => [yr, arr.length])
    );

    // 4) Build the final 2020–2023 data
    const YEARS = [2020, 2021, 2022, 2023];

    // Log selected state and mapped code
    console.log("Selected state:", selectedState);
    console.log(
      "Mapped abbreviation:",
      stateNameToAbbreviation[selectedState.toLowerCase()]
    );

    const stateCode =
      selectedState === "all"
        ? null
        : stateNameToAbbreviation[selectedState.toLowerCase()]?.toUpperCase();

// Add this log:
console.log("🔑 stateCode for", selectedState, "→", stateCode);

    const result: DivorceRateChartData[] = YEARS.map((year) => {
      const list = byYear[year] || [];

      // national average = mean of all states’ avgPct
      const avgNational =
        list.length > 0
          ? Number(
              (
                list.reduce((sum, r) => sum + r.avgPct, 0) /
                list.length
              ).toFixed(1)
            )
          : 0;

      // state average = that state’s avgPct (or same as national if “all”)
      const avgState =
        selectedState === "all"
          ? avgNational
          : Number(
              (
                list.find((r) => r.state.toUpperCase() === stateCode)?.avgPct ?? 0
              ).toFixed(1)
            );

      return { year, avgState, avgNational };
    });

    console.log("🔍 [hook] final chart data:", result);
    return result;
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
