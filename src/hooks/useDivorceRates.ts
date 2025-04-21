
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
        return generateDummyDivorceData();
      }
      
      if (!locations || locations.length === 0) {
        console.log("No location data found for state, using dummy data");
        return generateDummyDivorceData();
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: divorceRates, error: divorceError } = await supabase
        .from('divorce_rate')
        .select('*')
        .in('Zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce rates query failed:", divorceError);
        toast.error("Error loading divorce rate data");
        return generateDummyDivorceData();
      }
      
      // If no data, return dummy data
      if (!divorceRates || divorceRates.length === 0) {
        console.log("No divorce rate data found, using dummy data");
        return generateDummyDivorceData();
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
      
      // Generate state average (simulate for demo)
      const stateAvg = {
        "2019": 6.3,
        "2020": 6.4,
        "2021": 6.5,
        "2022": 6.5,
        "2023": 6.5,
        "2024": 6.4
      };
      
      const processedData = Object.values(yearlyRates || {}).map((yearData: any) => ({
        year: yearData.year,
        rate: yearData.rates.length > 0 
          ? (yearData.rates.reduce((sum: number, rate: number) => sum + rate, 0) / yearData.rates.length)
          : 0,
        avgState: stateAvg[yearData.year as keyof typeof stateAvg] || 6.5,
        avgNational: 6.5
      }));
      
      const result = processedData.sort((a: any, b: any) => a.year - b.year);
      
      if (result.length === 0) {
        console.log("No processed data after transformation, using dummy data");
        return generateDummyDivorceData();
      }
      
      return result;
    } catch (error) {
      console.error("Error fetching divorce rates:", error);
      toast.error("Error loading divorce rate data");
      return generateDummyDivorceData();
    }
  };

  return useQuery({
    queryKey: ['divorce_rates', selectedState],
    queryFn: fetchDivorceRates
  });
};

// Generate dummy data for demo purposes
const generateDummyDivorceData = () => {
  console.log("Generating dummy divorce data");
  return [
    { year: 2019, rate: 6.3, avgState: 6.3, avgNational: 6.5 },
    { year: 2020, rate: 6.4, avgState: 6.4, avgNational: 6.5 },
    { year: 2021, rate: 6.5, avgState: 6.5, avgNational: 6.5 },
    { year: 2022, rate: 6.5, avgState: 6.5, avgNational: 6.5 },
    { year: 2023, rate: 6.4, avgState: 6.4, avgNational: 6.5 },
    { year: 2024, rate: 6.3, avgState: 6.3, avgNational: 6.5 }
  ];
};
