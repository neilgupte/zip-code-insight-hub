
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async () => {
    try {
      console.log("Fetching divorce rates for state:", selectedState);
      
      let locationQuery = supabase
        .from('location')
        .select('zip');
        
      if (selectedState !== 'all') {
        locationQuery = locationQuery.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      }
      
      const { data: locations, error: locationError } = await locationQuery;
      
      if (locationError) {
        console.error("Location query failed:", locationError);
        toast.error("Error loading location data");
        return [];
      }
      
      if (!locations || locations.length === 0) {
        console.log("No location data found for state");
        return [];
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: divorceRates, error: divorceError } = await supabase
        .from('divorce_rate')
        .select('*')
        .in('Zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce rates query failed:", divorceError);
        toast.error("Error loading divorce rate data");
        return [];
      }
      
      // If no data, return empty array
      if (!divorceRates || divorceRates.length === 0) {
        console.log("No divorce rate data found");
        return [];
      }
      
      const yearlyRates = divorceRates.reduce((acc: any, curr) => {
        const year = curr.Year ? String(curr.Year) : ''; // Convert to string to fix type error
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
        year: yearData.year,
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
