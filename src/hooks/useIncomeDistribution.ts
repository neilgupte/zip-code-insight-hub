
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchIncomeData } from "@/utils/incomeDataUtils";
import type { TransformedIncomeData } from "@/utils/incomeDataUtils";

export const useIncomeDistribution = () => {
  return useQuery({
    queryKey: ["income_distribution"],
    queryFn: async (): Promise<TransformedIncomeData[]> => {
      try {
        return await fetchIncomeData(supabase);
      } catch (e) {
        console.error("Income fetch error:", e);
        toast.error("Error loading income data");
        return [];
      }
    },
  });
};
