import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useIncomeDistribution } from "@/hooks/useIncomeDistribution";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSampleIncomeData } from "@/hooks/createSampleData";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface IncomeDistributionChartProps {
  selectedState: string;
  selectedCity: string;
}

export const IncomeDistributionChart = ({ selectedState, selectedCity }: IncomeDistributionChartProps) => {
  const { data: incomeData, isLoading, error, refetch } = useIncomeDistribution(selectedState, selectedCity);
  const [isCreatingSample, setIsCreatingSample] = useState(false);

  const handleCreateSampleData = async () => {
    setIsCreatingSample(true);
    try {
      const success = await createSampleIncomeData();
      if (success) {
        toast({
          title: "Sample Data Created",
          description: "Sample income data has been created successfully. Refreshing chart...",
          variant: "default",
        });
        refetch();
      } else {
        toast({
          title: "Error Creating Sample Data",
          description: "There was a problem creating sample income data. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating sample data:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating sample data.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSample(false);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Households vs Income Level
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Error loading income data. Check console for details.
          </p>
          <Button 
            onClick={handleCreateSampleData} 
            disabled={isCreatingSample}
          >
            {isCreatingSample ? "Creating Sample Data..." : "Create Sample Income Data"}
          </Button>
        </CardContent>
      </Card>
    );
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

  // If no data, display a message
  if (!incomeData || incomeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Households vs Income Level, {stateLabel}, {cityLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            No income data found for selected region.
          </p>
          <Button 
            onClick={handleCreateSampleData} 
            disabled={isCreatingSample}
          >
            {isCreatingSample ? "Creating Sample Data..." : "Create Sample Income Data"}
          </Button>
        </CardContent>
      </Card>
    );
  }

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
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toLocaleString()}K` : value.toLocaleString() }
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
