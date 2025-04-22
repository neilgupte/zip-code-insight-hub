
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useDivorceRates } from "@/hooks/useDivorceRates";
import { AlertCircle } from "lucide-react";

interface DivorceRateChartProps {
  selectedState: string;
}

export const DivorceRateChart = ({ selectedState }: DivorceRateChartProps) => {
  const { data: divorceData, isLoading, error } = useDivorceRates(selectedState);

  // Format state title with proper capitalization
  const stateLabel = selectedState === 'all'
    ? 'All'
    : selectedState.charAt(0).toUpperCase() + selectedState.slice(1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Divorce Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Divorce Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Error loading divorce rate data. Check console for details.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If no data, display a message
  if (!divorceData || divorceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Divorce Rate, {stateLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            No divorce rate data found for {stateLabel}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Divorce Rate, {stateLabel}
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
                domain={['dataMin', 'dataMax']}
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
