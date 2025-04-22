
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchIncomeDataForState } from "@/utils/incomeDataUtils";
import type { TransformedIncomeData } from "@/utils/incomeDataUtils";

export const useIncomeDistribution = (selectedState: string) => {
  return useQuery({
    queryKey: ["income_distribution", selectedState],
    queryFn: async (): Promise<TransformedIncomeData[]> => {
      try {
        return await fetchIncomeDataForState(supabase, selectedState);
      } catch (e) {
        console.error("Income fetch error:", e);
        toast.error("Error loading income data");
        return [];
      }
    },
  });
};
