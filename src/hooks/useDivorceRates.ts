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
    // 1) select the raw columns (mixed-case names are quoted)
    const { data, error } = await supabase
      .from("divorce_rate")
      .select<{
        Year:        string;
        State:       string;
        divorce_rate: string;
      }>(`"Year", "State", divorce_rate`)
      .range(0, (count || 0) - 1);

    if (error || !data) {
      console.error("Error loading divorce_rate table:", error);
      throw new Error("Failed to load divorce rate data.");
    }

    // 2) map using the exact property names returned
    const cleaned = data.map((row) => ({
      year:  Number(row.Year),
      state: row.State,
      rate:  Number(row.divorce_rate),
    }));

 console.log("🔍 [hook] cleaned rows by ZIP:", cleaned);

    // 3) group by year
    const grouped: Record<number, { stateRates: number[]; nationalRates: number[] }> = {};
    const stateCode =
      selectedState === "all"
        ? null
        : stateNameToAbbreviation[selectedState.toLowerCase()].toUpperCase();

    for (const { year, state, rate } of cleaned) {
      if (!grouped[year]) {
        grouped[year] = { stateRates: [], nationalRates: [] };
      }
      grouped[year].nationalRates.push(rate);
      if (selectedState === "all" || state.toUpperCase() === stateCode) {
        grouped[year].stateRates.push(rate);
      }
    }
 console.log("🔍 [hook] grouped by year:", grouped);
    // 4) build your 2020–2023 array and average
    const YEARS = [2020, 2021, 2022, 2023];
    const result = YEARS.map((year) => {
      const { stateRates = [], nationalRates = [] } = grouped[year] || [];
      const avg = (arr: number[]) =>
        arr.length > 0
          ? Number(((arr.reduce((a, b) => a + b, 0) / arr.length) * 100).toFixed(1))
          : 0;
      return {
        year,
        avgState:    avg(stateRates),
        avgNational: avg(nationalRates),
      };
    });

  console.log("🔍 [hook] final chart data:", result);
    return result;
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
