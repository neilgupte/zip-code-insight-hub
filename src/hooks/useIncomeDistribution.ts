
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IncomeData {
  [key: string]: string | number | null;
  Zip?: string | number | null;
}

interface TransformedIncomeData {
  incomeBracket: number;
  households: number;
}

export const useIncomeDistribution = (selectedState: string) => {
  const fetchIncomeData = async (): Promise<TransformedIncomeData[]> => {
    try {
      console.log("Fetching income data for state:", selectedState);
      
      // Step 1: Get ZIP codes for the selected state
      let locationQuery = supabase
        .from('location')
        .select('zip');
        
      if (selectedState !== 'all') {
        locationQuery = locationQuery.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      }
      
      const { data: locations, error: locationError } = await locationQuery;
      
      if (locationError) {
        console.error("Error fetching location data:", locationError);
        throw locationError;
      }
      
      console.log(`Found ${locations?.length || 0} locations matching filters`);
      
      if (!locations || locations.length === 0) {
        console.log("No locations found for the selected filters.");
        return [];
      }
      
      const zipCodes = locations
        .filter(loc => loc.zip !== null)
        .map(loc => loc.zip.toString());
      
      console.log(`Filtered to ${zipCodes.length} valid zip codes`);
      
      // Step 2: Fetch income data for these ZIP codes
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .in('Zip', zipCodes);
        
      if (incomeError) {
        console.error("Error fetching income data:", incomeError);
        throw incomeError;
      }
      
      if (!incomeData || incomeData.length === 0) {
        console.log("No income data found for the selected zip codes.");
        return [];
      }
      
      console.log(`Found ${incomeData.length} income entries for the zip codes`);
      
      // Step 3: Transform the data for the chart
      const incomeBrackets = [
        10000, 12500, 17500, 22500, 27500, 32500, 37500, 42500, 47500, 
        55000, 67500, 87500, 112500, 137500, 175000, 200000
      ];
      
      // Initialize the result array with zeros for all income brackets
      const aggregatedData: Record<number, number> = {};
      incomeBrackets.forEach(bracket => {
        aggregatedData[bracket] = 0;
      });
      
      // Aggregate households by income bracket
      for (const row of incomeData as IncomeData[]) {
        for (const bracket of incomeBrackets) {
          const bracketStr = bracket.toString();
          if (bracketStr in row && row[bracketStr] !== null) {
            let households = 0;
            const value = row[bracketStr];
            
            if (typeof value === 'string') {
              households = parseInt(value, 10);
            } else if (typeof value === 'number') {
              households = value;
            }
            
            if (!isNaN(households) && households > 0) {
              aggregatedData[bracket] += households;
            }
          }
        }
      }
      
      // Convert to array format for the chart
      const transformedData: TransformedIncomeData[] = Object.entries(aggregatedData)
        .map(([bracket, households]) => ({
          incomeBracket: parseInt(bracket, 10),
          households: households
        }))
        .sort((a, b) => a.incomeBracket - b.incomeBracket);
      
      console.log(`Final aggregated data contains ${transformedData.length} income brackets`);
      console.log("Sample of transformed data:", transformedData.slice(0, 3));
      
      return transformedData;
    } catch (error) {
      console.error("Error fetching income data:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["income_distribution", selectedState],
    queryFn: fetchIncomeData,
  });
};
