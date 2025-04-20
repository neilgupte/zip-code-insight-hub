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
    // Query long-format table: try 'income_long' first, fallback to 'income_bracket_households'
    let query = supabase
      .from("income_long")
      .select(`
        zip,
        income_bracket,
        households,
        location:zip (
          city,
          state_name
        )
      `);

    // Filter by state
    if (selectedState !== 'all') {
      query = query.eq("location.state_name", selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
    }
    // Filter by city
    if (selectedCity !== 'all') {
      query = query.eq("location.city", selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
    }

    // Execute query
    const { data, error } = await query;

    // If table not found or no data: fallback to alternate table or show nothing
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      // Fallback: Try querying income_bracket_households instead
      let altQuery = supabase
        .from("income_bracket_households")
        .select(`
          zip,
          income_bracket,
          households,
          location:zip (
            city,
            state_name
          )
        `);

      if (selectedState !== 'all') {
        altQuery = altQuery.eq("location.state_name", selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      }
      if (selectedCity !== 'all') {
        altQuery = altQuery.eq("location.city", selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }

      const { data: altData, error: altError } = await altQuery;
      if (altError || !altData || altData.length === 0) return [];
      return aggregateIncomeData(altData);
    }

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return aggregateIncomeData(data);
  };

  // Group by income_bracket and sum households
  function aggregateIncomeData(rows: any[]): { incomeBracket: number, households: number }[] {
    // Map like: { [income_bracketValue: string]: number }
    const totals: { [key: string]: number } = {};
    for (const row of rows) {
      // Remove $ or , for sorting, convert value for x-axis median
      let bracketValStr = String(row.income_bracket || '').replace(/\$|,/g, '');
      let bracketVal = parseInt(bracketValStr) || 0;
      if (!(bracketVal in totals)) totals[bracketVal] = 0;
      totals[bracketVal] += parseInt(row.households || 0);
    }
    // Return as sorted array
    return Object.entries(totals)
      .map(([incomeBracket, households]) => ({
        incomeBracket: parseInt(incomeBracket),
        households,
      }))
      .sort((a, b) => a.incomeBracket - b.incomeBracket);
  }

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
