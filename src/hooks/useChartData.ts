
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDivorceRates = (selectedState: string, selectedCity: string) => {
  const fetchDivorceRates = async () => {
    try {
      // Skip filtering if "all" is selected
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
      
      if (locationError) throw locationError;
      if (!locations || locations.length === 0) {
        // Return dummy data for demo
        return generateDummyDivorceData();
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: divorceRates, error: divorceError } = await supabase
        .from('divorce_rate')
        .select('*')
        .in('Zip', zipCodes);
        
      if (divorceError) throw divorceError;
      
      // If no data, return dummy data
      if (!divorceRates || divorceRates.length === 0) {
        return generateDummyDivorceData();
      }
      
      const yearlyRates = divorceRates.reduce((acc: any, curr) => {
        const year = curr.Year;
        if (!acc[year]) {
          acc[year] = { rates: [], year };
        }
        const rate = parseFloat(curr["Divorce Rate"]);
        if (!isNaN(rate)) {
          acc[year].rates.push(rate);
        }
        return acc;
      }, {});
      
      // Generate state average (simulate for demo)
      const stateAvg = {
        2019: 6.3,
        2020: 6.4,
        2021: 6.5,
        2022: 6.5,
        2023: 6.5,
        2024: 6.4
      };
      
      const processedData = Object.values(yearlyRates || {}).map((yearData: any) => ({
        year: yearData.year,
        rate: yearData.rates.length > 0 
          ? (yearData.rates.reduce((sum: number, rate: number) => sum + rate, 0) / yearData.rates.length)
          : 0,
        avgState: stateAvg[yearData.year as keyof typeof stateAvg] || 6.5,
        avgNational: 6.5
      }));
      
      return processedData.sort((a: any, b: any) => a.year - b.year);
    } catch (error) {
      console.error("Error fetching divorce rates:", error);
      return generateDummyDivorceData();
    }
  };

  return useQuery({
    queryKey: ['divorce_rates', selectedState, selectedCity],
    queryFn: fetchDivorceRates
  });
};

// Generate dummy data for demo purposes
const generateDummyDivorceData = () => {
  return [
    { year: 2019, rate: 6.3, avgState: 6.3, avgNational: 6.5 },
    { year: 2020, rate: 6.4, avgState: 6.4, avgNational: 6.5 },
    { year: 2021, rate: 6.5, avgState: 6.5, avgNational: 6.5 },
    { year: 2022, rate: 6.5, avgState: 6.5, avgNational: 6.5 },
    { year: 2023, rate: 6.4, avgState: 6.4, avgNational: 6.5 },
    { year: 2024, rate: 6.3, avgState: 6.3, avgNational: 6.5 }
  ];
};

export const useIncomeDistribution = (selectedState: string, selectedCity: string) => {
  const fetchIncomeData = async () => {
    try {
      console.log("Fetching income data for state:", selectedState, "city:", selectedCity);
      
      // Step 1: Get all zip codes for the selected state (and city if specified)
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
        
        // Check if there are any locations in the database at all
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
      
      // Step 2: Extract all zip codes from locations
      const zipCodes = locations.map(loc => loc.zip);
      console.log("Zip codes to query:", zipCodes);
      
      // Step 3: Check if the income table exists and has data
      const { data: incomeTableInfo, error: incomeTableError } = await supabase
        .from('income')
        .select('count()')
        .limit(1);
      
      if (incomeTableError) {
        console.error("Error checking income table:", incomeTableError);
        console.log("Income table may not exist. Checking available tables...");
        
        // List available tables for debugging
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
      
      // Step 4: Query the income table with the filtered zip codes
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
        
        // Check if there's any data in the income table
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
      
      // Step 5: Transform the wide-format income data to long format
      const transformedData: { incomeBracket: number, households: number }[] = [];
      
      // Income brackets to process (all the numeric columns in the income table)
      const incomeBrackets = [
        10000, 12500, 17500, 22500, 27500, 32500, 37500, 42500, 47500, 
        55000, 67500, 87500, 112500, 137500, 175000, 200000
      ];
      
      for (const row of incomeData) {
        // Process each income bracket
        for (const bracket of incomeBrackets) {
          const bracketStr = bracket.toString();
          if (bracketStr in row && row[bracketStr] !== null) {
            // Parse the household count value
            let households: number;
            if (typeof row[bracketStr] === 'string') {
              households = parseInt(row[bracketStr]);
            } else {
              households = row[bracketStr];
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
      
      // Step 6: Aggregate by income bracket (sum households for each bracket)
      const aggregatedData = transformedData.reduce((acc, item) => {
        const existingIndex = acc.findIndex(x => x.incomeBracket === item.incomeBracket);
        if (existingIndex >= 0) {
          acc[existingIndex].households += item.households;
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as { incomeBracket: number, households: number }[]);
      
      // Sort by income bracket (ascending)
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
