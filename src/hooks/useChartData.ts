
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDivorceRates = (selectedState: string, selectedCity: string) => {
  const fetchDivorceRates = async () => {
    const formattedStateName = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
    
    try {
      let locationQuery = supabase
        .from('location')
        .select('zip')
        .eq('state_name', formattedStateName);
        
      if (selectedCity !== 'all') {
        locationQuery = locationQuery.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      const { data: locations, error: locationError } = await locationQuery;
      
      if (locationError) throw locationError;
      if (!locations || locations.length === 0) return [];
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: divorceRates, error: divorceError } = await supabase
        .from('divorce_rate')
        .select('*')
        .in('Zip', zipCodes);
        
      if (divorceError) throw divorceError;
      
      const yearlyRates = divorceRates?.reduce((acc: any, curr) => {
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
      
      const processedData = Object.values(yearlyRates || {}).map((yearData: any) => ({
        year: yearData.year,
        rate: (yearData.rates.reduce((sum: number, rate: number) => sum + rate, 0) / yearData.rates.length) * 100,
        avgNational: 6.5
      }));
      
      return processedData.sort((a: any, b: any) => a.year - b.year);
    } catch (error) {
      console.error("Error fetching divorce rates:", error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ['divorce_rates', selectedState, selectedCity],
    queryFn: fetchDivorceRates
  });
};

export const useIncomeDistribution = (selectedState: string, selectedCity: string) => {
  const fetchIncomeData = async () => {
    try {
      let locationQuery = supabase
        .from('location')
        .select('zip')
        .eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
        
      if (selectedCity !== 'all') {
        locationQuery = locationQuery.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      const { data: locations, error: locationError } = await locationQuery;
      
      if (locationError) throw locationError;
      if (!locations || locations.length === 0) return [];
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .in('Zip', zipCodes);
        
      if (incomeError) throw incomeError;

      const bracketSums: { [key: string]: number } = {};
      const brackets = ['10000', '12500', '17500', '22500', '27500', '32500', '37500', 
                       '42500', '47500', '55000', '67500', '87500', '112500', '137500', 
                       '175000', '200000'];

      incomeData?.forEach(record => {
        brackets.forEach(bracket => {
          const value = parseInt(record[bracket as keyof typeof record] as string || '0');
          bracketSums[bracket] = (bracketSums[bracket] || 0) + value;
        });
      });

      return Object.entries(bracketSums)
        .map(([bracket, households]) => ({
          incomeBracket: parseInt(bracket),
          households: households
        }))
        .sort((a, b) => a.incomeBracket - b.incomeBracket);
    } catch (error) {
      console.error("Error fetching income data:", error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ['income_distribution', selectedState, selectedCity],
    queryFn: fetchIncomeData
  });
};

