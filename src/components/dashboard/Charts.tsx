import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DivorceRateChartProps {
  selectedState: string;
  selectedCity: string;
}

const DivorceRateChart = ({ selectedState, selectedCity }: DivorceRateChartProps) => {
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
      
      if (locationError) {
        throw locationError;
      }
      
      if (!locations || locations.length === 0) {
        return [];
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: divorceRates, error: divorceError } = await supabase
        .from('divorce_rate')
        .select('*')
        .in('Zip', zipCodes);
        
      if (divorceError) {
        throw divorceError;
      }
      
      const yearlyRates = divorceRates?.reduce((acc: any, curr) => {
        const year = curr.Year;
        if (!acc[year]) {
          acc[year] = {
            rates: [],
            year: year
          };
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

interface IncomeDistributionChartProps {
  selectedState: string;
  selectedCity: string;
}

const IncomeDistributionChart = ({ selectedState, selectedCity }: IncomeDistributionChartProps) => {
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
      
      if (locationError) {
        throw locationError;
      }
      
      if (!locations || locations.length === 0) {
        return [];
      }
      
      const zipCodes = locations.map(loc => loc.zip);
      
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('*')
        .in('Zip', zipCodes);
        
      if (incomeError) {
        throw incomeError;
      }

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

      const formattedData = Object.entries(bracketSums)
        .map(([bracket, households]) => ({
          incomeBracket: parseInt(bracket),
          households: households
        }))
        .sort((a, b) => a.incomeBracket - b.incomeBracket);

      return formattedData;
    } catch (error) {
      console.error("Error fetching income data:", error);
      throw error;
    }
  };

  const { data: incomeData, isLoading, error } = useQuery({
    queryKey: ['income_distribution', selectedState, selectedCity],
    queryFn: fetchIncomeData
  });

  if (error) {
    return <div className="text-red-500">Error loading income distribution data</div>;
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const formatIncome = (value: number) => {
    return value >= 1000 ? `$${value/1000}k` : `$${value}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Households vs Income Level, {selectedState.charAt(0).toUpperCase() + selectedState.slice(1)},
          {selectedCity === 'all' ? ' All' : ` ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="incomeBracket"
                tickFormatter={formatIncome}
                label={{ value: 'Income Bracket', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={formatNumber}
                label={{ value: 'Number of Households', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Households']}
                labelFormatter={(label: number) => `Income: ${formatIncome(label)}`}
              />
              <Area 
                type="monotone" 
                dataKey="households" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
                name="Households"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const Charts = ({ selectedState, selectedCity }: IncomeDistributionChartProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <DivorceRateChart selectedState={selectedState} selectedCity={selectedCity} />
      <IncomeDistributionChart selectedState={selectedState} selectedCity={selectedCity} />
    </div>
  );
};
