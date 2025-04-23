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
    // 1) Page through the raw `divorce_rate` table
    const pageSize = 1000;
    let page = 0;
    let allRows: { Year: string; State: string; divorce_rate: string }[] = [];

    while (true) {
      const from = page * pageSize;
      const to   = from + pageSize - 1;

      const { data, error } = await supabase
        .from("divorce_rate")
        // Make sure to quote your mixed-case columns exactly:
        .select<{ Year: string; State: string; divorce_rate: string }>(
          `"Year", "State", divorce_rate`
        )
        .range(from, to);

      if (error) {
        console.error("Error fetching divorce_rate page", page, error);
        throw error;
      }

      console.log(`🔍 fetched page ${page}, rows:`, data?.length);
      if (!data || data.length === 0) break;

      allRows.push(...data);
      page++;
    }

    console.log("🔍 total ZIP rows fetched:", allRows.length);
    console.log("🔍 sample rows:", allRows.slice(0, 5));

    // 2) Convert and group by year
    type ZipRow = { year: number; state: string; rate: number };
    const cleaned: ZipRow[] = allRows.map((r) => ({
      year:  Number(r.Year),
      state: r.State.toUpperCase(),
      rate:  Number(r.divorce_rate),
    }));

    console.log("🔍 cleaned rows count by year:",
      cleaned.reduce((acc, cur) => {
        acc[cur.year] = (acc[cur.year] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    );

    const grouped: Record<number, { stateRates: number[]; nationalRates: number[] }> = {};
    cleaned.forEach(({ year, rate }) => {
      if (!grouped[year]) grouped[year] = { stateRates: [], nationalRates: [] };
      grouped[year].nationalRates.push(rate);
    });

    console.log("🔍 grouped counts by year:",
      Object.entries(grouped).map(([yr, v]) => [yr, v.nationalRates.length])
    );

    // 3) Compute stateCode
    const safeKey = selectedState.trim().toUpperCase();
    const stateCode =
      safeKey === "ALL"
        ? null
        : safeKey.length === 2
          ? safeKey
          : stateNameToAbbreviation[safeKey.toLowerCase()]?.toUpperCase() ?? null;
    console.log("🔑 mapping", selectedState, "→", stateCode);

    // 4) Populate stateRates
    cleaned.forEach(({ year, state, rate }) => {
      if (stateCode === null || state === stateCode) {
        grouped[year].stateRates.push(rate);
      }
    });

    console.log("🔍 grouped after state filter:",
      Object.entries(grouped).map(([yr, v]) => [yr, v.stateRates.length])
    );

    // 5) Build final 2020–2023 averages
    const YEARS = [2020, 2021, 2022, 2023];
    const result: DivorceRateChartData[] = YEARS.map((year) => {
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

    console.log("🔍 final chart data:", result);
    return result;
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};
