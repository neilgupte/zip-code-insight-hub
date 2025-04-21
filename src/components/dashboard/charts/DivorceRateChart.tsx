import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useDivorceRates } from "@/hooks/useDivorceRates";

interface DivorceRateChartProps {
  selectedState: string;
  selectedCity: string;
}

export const DivorceRateChart = ({ selectedState, selectedCity }: DivorceRateChartProps) => {
  const { data: divorceData, isLoading, error } = useDivorceRates(selectedState, selectedCity);

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
          Divorce Rate {selectedState === 'all' ? 'All' : selectedState.charAt(0).toUpperCase() + selectedState.slice(1)}, 
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
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                labelFormatter={(value) => `${value}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#2563eb" 
                name="Avg. Divorce Rate" 
                dot={true}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="avgState" 
                stroke="#ef4444" 
                name="Avg. State Divorce Rate" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="avgNational" 
                stroke="#f97316" 
                name="Avg. National Divorce Rate" 
                dot={false}
                strokeDasharray="3 3"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
