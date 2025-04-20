
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

