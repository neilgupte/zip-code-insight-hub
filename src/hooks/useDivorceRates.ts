
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async () => {
    try {
      console.log("Fetching divorce rates for state:", selectedState);
      
      let query = supabase.from('divorce_rate').select('*');
      
      // If a specific state is selected, filter by state
      if (selectedState !== 'all') {
        const stateCapitalized = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
        console.log("Filtering by state:", stateCapitalized);
        query = query.eq('State', stateCapitalized);
      }
      
      const { data: divorceRates, error } = await query;
      
      if (error) {
        console.error("Error fetching divorce rates:", error);
        toast.error("Error loading divorce rate data");
        return [];
      }
      
      if (!divorceRates || divorceRates.length === 0) {
        console.log("No divorce rate data found");
        return [];
      }
      
      console.log(`Found ${divorceRates.length} divorce rate entries`);
      
      // Group data by year
      const yearlyRates = divorceRates.reduce((acc: any, curr) => {
        const year = curr.Year ? String(curr.Year) : ''; 
        if (!acc[year]) {
          acc[year] = { rates: [], year };
        }
        const rate = parseFloat(String(curr["Divorce Rate"]));
        if (!isNaN(rate)) {
          acc[year].rates.push(rate);
        }
        return acc;
      }, {});
      
      // Generate state average based on real data
      const processedData = Object.values(yearlyRates || {}).map((yearData: any) => ({
        year: parseInt(yearData.year),
        rate: yearData.rates.length > 0 
          ? (yearData.rates.reduce((sum: number, rate: number) => sum + rate, 0) / yearData.rates.length)
          : 0,
        avgState: yearData.rates.length > 0 
          ? (yearData.rates.reduce((sum: number, rate: number) => sum + rate, 0) / yearData.rates.length)
          : 0,
        avgNational: 0 // We'll calculate this based on all data
      }));
      
      const result = processedData.sort((a: any, b: any) => a.year - b.year);
      
      // Calculate national average if there's data
      if (result.length > 0) {
        const nationalAvg = result.reduce((sum: number, item: any) => sum + item.rate, 0) / result.length;
        result.forEach((item: any) => {
          item.avgNational = nationalAvg;
        });
      }
      
      console.log("Processed divorce rate data:", result);
      
      return result;
    } catch (error) {
      console.error("Error fetching divorce rates:", error);
      toast.error("Error loading divorce rate data");
      return [];
    }
  };

  return useQuery({
    queryKey: ['divorce_rates', selectedState],
    queryFn: fetchDivorceRates
  });
};
