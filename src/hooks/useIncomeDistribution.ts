
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IncomeData {
  [key: string]: string | number | null;
  Zip?: number | null;
}

interface TransformedIncomeData {
  incomeBracket: number;
  households: number;
}

export const useIncomeDistribution = (selectedState: string, selectedCity: string) => {
  const fetchIncomeData = async (): Promise<TransformedIncomeData[]> => {
    try {
      console.log("Fetching income data for state:", selectedState, "city:", selectedCity);
      
      let locationQuery = supabase
        .from('location')
        .select('zip');
        
      if (selectedState !== 'all') {
        locationQuery = locationQuery.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      }
      
      if (selectedCity !== 'all') {
        locationQuery = locationQuery.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      const { data: locations, error: locationError } = await locationQuery;
      
      if (locationError) {
        console.error("Error fetching location data:", locationError);
        throw locationError;
      }
      
      console.log(`Found ${locations?.length || 0} locations matching filters`);
      
      if (!locations || locations.length === 0) {
        console.log("No locations found for the selected filters. Checking if any locations exist in the database...");

        const { data: allLocations, error: allLocErr } = await supabase
          .from('location')
          .select('zip, state_name, city')
          .limit(10);
        
        if (allLocErr) {
          console.error("Error checking for any locations:", allLocErr);
        } else {
          console.log("Sample locations in database:", allLocations);
        }
        
        return [];
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      console.log("Zip codes to query:", zipCodes);
      
      const { data: incomeTableInfo, error: incomeTableError } = await supabase
        .from('income')
        .select('count()')
        .limit(1);
      
      if (incomeTableError) {
        console.error("Error checking income table:", incomeTableError);
        console.log("Income table may not exist. Checking available tables...");
        const { data: tables, error: tablesError } = await supabase
          .rpc('list_tables');
        
        if (tablesError) {
          console.error("Could not list tables:", tablesError);
        } else {
          console.log("Available tables:", tables);
        }
        
        return [];
      }
      
      console.log("Income table exists. Querying for selected zip codes...");
      
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .in('Zip', zipCodes);
        
      if (incomeError) {
        console.error("Error fetching income data:", incomeError);
        throw incomeError;
      }
      
      if (!incomeData || incomeData.length === 0) {
        console.log("No income data found for the selected zip codes. Checking for any income data...");
        const { data: sampleIncome, error: sampleIncomeErr } = await supabase
          .from('income')
          .select('Zip')
          .limit(10);
        
        if (sampleIncomeErr) {
          console.error("Error checking sample income data:", sampleIncomeErr);
        } else {
          console.log("Sample income data ZIP codes:", sampleIncome);
        }
        
        return [];
      }
      
      console.log(`Found ${incomeData.length} income entries for the zip codes`);
      console.log("Sample income data:", incomeData[0]);
      
      const transformedData: TransformedIncomeData[] = [];
      
      const incomeBrackets = [
        10000, 12500, 17500, 22500, 27500, 32500, 37500, 42500, 47500, 
        55000, 67500, 87500, 112500, 137500, 175000, 200000
      ];
      
      for (const row of incomeData as IncomeData[]) {
        for (const bracket of incomeBrackets) {
          const bracketStr = bracket.toString();
          if (bracketStr in row && row[bracketStr] !== null) {
            let households = 0;
            const value = row[bracketStr];
            
            if (typeof value === 'string') {
              households = parseInt(value, 10); // Added radix parameter
            } else if (typeof value === 'number') {
              households = value;
            }
            
            if (!isNaN(households) && households > 0) {
              transformedData.push({
                incomeBracket: bracket,
                households: households
              });
            }
          }
        }
      }
      
      console.log(`Transformed ${transformedData.length} data points`);
      
      const aggregatedData = transformedData.reduce((acc, item) => {
        const existingIndex = acc.findIndex(x => x.incomeBracket === item.incomeBracket);
        if (existingIndex >= 0) {
          acc[existingIndex].households += item.households;
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as TransformedIncomeData[]);
      
      const sortedData = aggregatedData.sort((a, b) => a.incomeBracket - b.incomeBracket);
      
      console.log(`Final aggregated data contains ${sortedData.length} income brackets`);
      console.log("Income data:", sortedData);
      
      return sortedData;
    } catch (error) {
      console.error("Error fetching income data:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["income_distribution", selectedState, selectedCity],
    queryFn: fetchIncomeData,
  });
};
