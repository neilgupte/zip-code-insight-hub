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
    const { data, error } = await supabase
      .from("divorce_rate")
      .select("Year, State, divorce_rate");

    if (error || !data) {
      console.error("Error loading divorce rates:", error);
      throw new Error("Failed to load divorce rate data.");
    }

    // turn strings into numbers
    const cleaned = data.map((row) => ({
      year: Number(row.Year),
      state: row.State,
      rate: Number(row.divorce_rate), // e.g. 0.081
    }));
                      console.log("🗂 raw years present:", [
                        ...new Set(cleaned.map((r) => r.year)),
                      ]);
    // group by year
    const grouped: Record<number, { stateRates: number[]; nationalRates: number[] }> = {};
    const stateCode =
      selectedState !== "all"
        ? stateNameToAbbreviation[selectedState.toLowerCase()]
        : null;

    for (const { year, state, rate } of cleaned) {
      if (!grouped[year]) {
        grouped[year] = { stateRates: [], nationalRates: [] };
      }
      grouped[year].nationalRates.push(rate);
      if (selectedState === "all" || state === stateCode) {
        grouped[year].stateRates.push(rate);
      }
    }
                      console.log("🗃 grouped keys:", Object.keys(grouped));
    // explicitly fill 2020–2023
    const YEARS = [2020, 2021, 2022, 2023];
    const result: DivorceRateChartData[] = YEARS.map((year) => {
      const { stateRates = [], nationalRates = [] } = grouped[year] || {};
      const avg = (arr: number[]) =>
        arr.length > 0
          ? Number(((arr.reduce((a, b) => a + b, 0) / arr.length) * 100).toFixed(1))
          : 0;
      return {
        year,
        avgState: avg(stateRates),       // now in percent units
        avgNational: avg(nationalRates), // now in percent units
      };
    });

    return result;
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
