// src/hooks/useDivorceRates.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stateNameToAbbreviation } from "@/utils/stateMapping";

export interface DivorceRateChartData {
  year: number;
  avgState: number;    // in percent, e.g. 8.1
  avgNational: number; // in percent, e.g. 7.4
}

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async (): Promise<DivorceRateChartData[]> => {
    // Note the double-quotes around Year and State, and the AS aliases:
    const { data, error } = await supabase
      .from("divorce_rate")
      .select<{
        year: string;
        state: string;
        divorce_rate: string;
      }>(`"Year" AS year, "State" AS state, divorce_rate`);

    if (error || !data) {
      console.error("Error loading divorce_rate table:", error);
      throw new Error("Failed to load divorce rate data.");
    }

    // Parse strings into numbers:
    const cleaned = data.map((row) => ({
      year:   Number(row.year),
      state:  row.state,                  // two-letter code
      rate:   Number(row.divorce_rate),   // decimal, e.g. 0.081
    }));

    // Group zip-level rates by year:
    const grouped: Record<number, {
      stateRates:    number[];
      nationalRates: number[];
    }> = {};

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

    // Make sure 2020–2023 are always present, and convert to percent:
    const YEARS = [2020, 2021, 2022, 2023];
    return YEARS.map((year) => {
      const { stateRates = [], nationalRates = [] } = grouped[year] || {};
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
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn:   fetchDivorceRates,
  });
};
