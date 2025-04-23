import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stateNameToAbbreviation } from "@/utils/stateMapping";

interface DivorceRateChartData {
  year: number;
  avgState: number;
  avgNational: number;
}

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async (): Promise<DivorceRateChartData[]> => {
    const { data, error } = await supabase
      .from("divorce_rate")
      .select("year, state, divorce_rate");

    if (error || !data) {
      console.error("Error loading divorce rates:", error);
      throw new Error("Failed to load divorce rate data.");
    }
  
    console.log("🚀 raw divorce_rate rows:", data);
    
    const cleanedData = data.map((row) => ({
      year: Number(row.year),
      state: row.state,
      rate: Number(row.divorce_rate),
    }));

    const stateCode = selectedState !== "all"
      ? stateNameToAbbreviation[selectedState.toLowerCase()]
      : null;

    const grouped: Record<number, { stateRates: number[]; nationalRates: number[] }> = {};

    for (const row of cleanedData) {
      if (!grouped[row.year]) {
        grouped[row.year] = { stateRates: [], nationalRates: [] };
      }

      grouped[row.year].nationalRates.push(row.rate);

      if (selectedState === "all" || row.state === stateCode) {
        grouped[row.year].stateRates.push(row.rate);
      }
    }

    const result: DivorceRateChartData[] = Object.entries(grouped).map(
      ([yearStr, { stateRates, nationalRates }]) => {
        const year = parseInt(yearStr);
        const avg = (arr: number[]) =>
          arr.length > 0
            ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4))
            : 0;

        return {
          year,
          avgState: avg(stateRates),
          avgNational: avg(nationalRates),
        };
      }
    );

    console.log("✅ Divorce rate chart data:", result);
    return result.sort((a, b) => a.year - b.year);
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
