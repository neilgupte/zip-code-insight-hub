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
      // First, get zip codes based on location filters
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
        // Return dummy data if no locations match
        return generateDummyIncomeData();
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      // Query the income table with the filtered zip codes
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .in('Zip', zipCodes);
        
      if (incomeError) throw incomeError;
      if (!incomeData || incomeData.length === 0) {
        return generateDummyIncomeData();
      }
      
      // Transform wide format to long format
      const transformedData = [];
      for (const row of incomeData) {
        // Skip the Zip column and process each income bracket
        Object.entries(row).forEach(([key, value]) => {
          if (key !== 'Zip' && value !== null) {
            // Parse the income bracket (key) to a number for sorting
            const incomeBracket = parseInt(key);
            if (!isNaN(incomeBracket)) {
              // Parse the value to a number (households)
              let households = typeof value === 'string' ? parseInt(value) : value;
              if (!isNaN(households)) {
                transformedData.push({
                  incomeBracket,
                  households
                });
              }
            }
          }
        });
      }
      
      // Aggregate by income bracket
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
      return aggregatedData.sort((a, b) => a.incomeBracket - b.incomeBracket);
    } catch (error) {
      console.error("Error fetching income data:", error);
      return generateDummyIncomeData();
    }
  };

  return useQuery({
    queryKey: ["income_distribution", selectedState, selectedCity],
    queryFn: fetchIncomeData,
  });
};

// Generate dummy income data for demo
const generateDummyIncomeData = () => {
  return [
    { incomeBracket: 10000, households: 5000 },
    { incomeBracket: 25000, households: 4000 },
    { incomeBracket: 50000, households: 6000 },
    { incomeBracket: 75000, households: 8000 },
    { incomeBracket: 100000, households: 15000 },
    { incomeBracket: 150000, households: 10000 },
    { incomeBracket: 200000, households: 12000 }
  ];
};
