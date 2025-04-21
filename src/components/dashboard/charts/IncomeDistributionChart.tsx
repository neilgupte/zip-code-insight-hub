
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useIncomeDistribution } from "@/hooks/useIncomeDistribution";
import { AlertCircle } from "lucide-react";

interface IncomeDistributionChartProps {
  selectedState: string;
}

// Function to format numbers with K/M suffixes
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const IncomeDistributionChart = ({ selectedState }: IncomeDistributionChartProps) => {
  const { data: incomeData, isLoading, error } = useIncomeDistribution(selectedState);

  // Format state title with proper capitalization
  const stateLabel = selectedState === 'all'
    ? 'All States'
    : selectedState.charAt(0).toUpperCase() + selectedState.slice(1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Households vs Income Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("Error in Income Distribution Chart:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Households vs Income Level
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-muted-foreground text-center">
            Error loading income data
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!incomeData || incomeData.length === 0) {
    console.warn("No income data to display for", selectedState);
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Households vs Income Level, {stateLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-muted-foreground text-center">
            No income data found for {stateLabel}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Households vs Income Level, {stateLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={incomeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="incomeBracket"
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ 
                  value: 'Income Level', 
                  position: 'insideBottom', 
                  offset: -10 
                }}
              />
              <YAxis 
                tickFormatter={(value) => formatNumber(value)}
                label={{ 
                  value: 'Number of Households', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: 10
                }}
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Households']}
                labelFormatter={(label) => `$${Number(label).toLocaleString()}`}
              />
              <Line 
                type="monotone" 
                dataKey="households" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
