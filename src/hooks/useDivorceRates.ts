// src/hooks/useDivorceRates.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stateNameToAbbreviation } from "@/utils/stateMapping";

export interface DivorceRateChartData {
  year:       number;
  avgState:   number;  // e.g. 8.1
  avgNational:number;  // e.g. 7.4
}

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async (): Promise<DivorceRateChartData[]> => {
    // 1) Fetch every row from your state_year_divorce view
    const { data, error } = await supabase
      .from("state_year_divorce")
      .select<{
        state:             string;
        year:              string;
        avg_divorce_pct:   string;  // numeric gets returned as string
      }>("state, year, avg_divorce_pct")
      .range(0, -1);  // pull all rows

    if (error) {
      console.error("Error loading state_year_divorce view:", error);
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from state_year_divorce view");
    }

    // 2) Normalize into typed records
    type Row = { state:string; year:number; avgPct:number };
    const rows: Row[] = data.map((r) => ({
      state: r.state,
      year:  Number(r.year),
      avgPct: Number(r.avg_divorce_pct),
    }));

    // 3) Group by year
    const byYear = rows.reduce<Record<number, Row[]>>((acc, cur) => {
      (acc[cur.year] ||= []).push(cur);
      return acc;
    }, {});

    // 4) For each year 2020–2023 compute state & national averages
    const YEARS = [2020, 2021, 2022, 2023];
    const stateCode =
      selectedState === "all"
        ? null
        : stateNameToAbbreviation[selectedState.toLowerCase()].toUpperCase();

    const result: DivorceRateChartData[] = YEARS.map((year) => {
      const list = byYear[year] || [];

      // national avg = mean of all states’ avgPct
      const avgNational =
        list.length > 0
          ? Number((list.reduce((sum, r) => sum + r.avgPct, 0) / list.length).toFixed(1))
          : 0;

      // state avg = that state’s avgPct (or = national if “all”)
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

    return result;
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
