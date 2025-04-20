
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DivorceRateChartProps {
  selectedState: string;
  selectedCity: string;
}

const DivorceRateChart = ({ selectedState, selectedCity }: DivorceRateChartProps) => {
  const fetchDivorceRates = async () => {
    // Format state name for query
    const formattedStateName = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
    
    try {
      // Get location IDs (ZIPs) for the selected state and city
      let locationQuery = supabase
        .from('location')
        .select('zip')
        .eq('state_name', formattedStateName);
        
      if (selectedCity !== 'all') {
        locationQuery = locationQuery.eq('city', selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1));
      }
      
      const { data: locations, error: locationError } = await locationQuery;
      
      if (locationError) {
        throw locationError;
      }
      
      if (!locations || locations.length === 0) {
        return [];
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      // Fetch divorce rates for these locations
      const { data: divorceRates, error: divorceError } = await supabase
        .from('divorce_rate')
        .select('*')
        .in('Zip', zipCodes);
        
      if (divorceError) {
        throw divorceError;
      }
      
      // Process and aggregate the data
      const yearlyRates = divorceRates?.reduce((acc: any, curr) => {
        const year = curr.Year;
        if (!acc[year]) {
          acc[year] = {
            rates: [],
            year: year
          };
        }
        // Convert rate to number and add to array
        const rate = parseFloat(curr["Divorce Rate"]);
        if (!isNaN(rate)) {
          acc[year].rates.push(rate);
        }
        return acc;
      }, {});
      
      // Calculate averages for each year
      const processedData = Object.values(yearlyRates || {}).map((yearData: any) => ({
        year: yearData.year,
        rate: (yearData.rates.reduce((sum: number, rate: number) => sum + rate, 0) / yearData.rates.length) * 100,
        avgNational: 6.5 // Fixed national average
      }));
      
      return processedData.sort((a: any, b: any) => a.year - b.year);
    } catch (error) {
      console.error("Error fetching divorce rates:", error);
      throw error;
    }
  };

  const { data: divorceData, isLoading, error } = useQuery({
    queryKey: ['divorce_rates', selectedState, selectedCity],
    queryFn: fetchDivorceRates
  });

  if (error) {
    return <div className="text-red-500">Error loading divorce rate data</div>;
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Divorce Rate {selectedState.charAt(0).toUpperCase() + selectedState.slice(1)}, 
          {selectedCity === 'all' ? ' All' : ` ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={divorceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                type="number"
                domain={[2019, 2024]}
                tickCount={6}
              />
              <YAxis 
                label={{ value: 'Divorce Rate (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#8884d8" 
                name="Avg. Divorce Rate" 
                dot={true}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="avgNational" 
                stroke="#82ca9d" 
                name="Avg. National Rate" 
                dot={false}
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const Charts = ({ selectedState, selectedCity }: DivorceRateChartProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <DivorceRateChart selectedState={selectedState} selectedCity={selectedCity} />
      
      <Card>
        <CardHeader>
          <CardTitle>Households vs Income Level, {selectedState.charAt(0).toUpperCase() + selectedState.slice(1)}, {selectedCity === 'all' ? 'All' : selectedCity}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {/* Add the household income chart here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
