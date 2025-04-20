
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useIncomeDistribution } from "@/hooks/useChartData";

interface IncomeDistributionChartProps {
  selectedState: string;
  selectedCity: string;
}

export const IncomeDistributionChart = ({ selectedState, selectedCity }: IncomeDistributionChartProps) => {
  const { data: incomeData, isLoading, error } = useIncomeDistribution(selectedState, selectedCity);

  if (error) {
    return <div className="text-red-500">Error loading income data</div>;
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  // Format state/city title with proper capitalization
  const stateLabel = selectedState === 'all'
    ? 'All'
    : selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
  const cityLabel = selectedCity === 'all'
    ? 'All'
    : selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Households vs Income Level, {stateLabel}, {cityLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={incomeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorHouseholds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="incomeBracket"
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                label={{ value: 'Income Bracket Median', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toLocaleString()}K` : value }
                label={{ value: 'Households', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), 'Households']}
                labelFormatter={(label) => `$${Number(label).toLocaleString()}`}
              />
              <Area 
                type="monotone" 
                dataKey="households" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorHouseholds)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
