
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async () => {
  try {
    const { data, error } = await supabase
      .from("divorce_rate")
      .select("Year, State, Divorce Rate");

    if (error || !data) {
      console.error("Error loading divorce rates:", error?.message);
      throw new Error("Failed to load divorce rate data.");
    }

    // Clean and normalize values
    const cleanedData = data.map((row) => ({
      year: Number(row.Year),
      state: row.State,
      rate: typeof row["Divorce Rate"] === "string"
        ? parseFloat(row["Divorce Rate"].replace("%", "")) / 100
        : Number(row["Divorce Rate"]) / 100,
    }));

    // Group by year and compute averages
    const grouped: Record<number, { stateRates: number[]; nationalRates: number[] }> = {};

    for (const row of cleanedData) {
      if (!grouped[row.year]) {
        grouped[row.year] = { stateRates: [], nationalRates: [] };
      }

      grouped[row.year].nationalRates.push(row.rate);

      if (
        selectedState === "all" ||
        row.state.toLowerCase() === selectedState.toLowerCase()
      ) {
        grouped[row.year].stateRates.push(row.rate);
      }
    }

    const result = Object.entries(grouped).map(
      ([yearStr, { stateRates, nationalRates }]) => {
        const year = Number(yearStr);
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

    return result.sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error("Error in fetchDivorceRates:", error);
    throw error;
  }
};


  return useQuery({
    queryKey: ['divorce_rates', selectedState],
    queryFn: fetchDivorceRates
  });
};
