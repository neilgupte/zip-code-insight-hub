// File: hooks/useDivorceRates.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stateNameToAbbreviation } from "@/utils/stateMapping";

interface DivorceRateChartData {
  year: number;
  avgState: number;
  avgNational: number;
}

export const useDivorceRates = (selectedState: string) => {
  const fetchDivorceRates = async (): Promise<DivorceRateChartData[]> => {
    const { data, error } = await supabase
      .from("divorce_rate")
      .select("Year, State, Divorce Rate");

    if (error || !data) {
      console.error("Error loading divorce rates:", error?.message);
      return [];
    }

    const cleanedData = data.map((row) => ({
      year: parseInt(row.Year),
      state: row.State,
      rate: typeof row["Divorce Rate"] === "string"
        ? parseFloat(row["Divorce Rate"].replace("%", "")) / 100
        : Number(row["Divorce Rate"]) / 100,
    }));

    const stateCode = selectedState !== "all"
      ? stateNameToAbbreviation[selectedState.toLowerCase()]
      : null;

    const grouped: Record<number, { stateRates: number[]; nationalRates: number[] }> = {};

    for (const row of cleanedData) {
      if (!grouped[row.year]) {
        grouped[row.year] = { stateRates: [], nationalRates: [] };
      }

      grouped[row.year].nationalRates.push(row.rate);
      if (selectedState === "all" || row.state === stateCode) {
        grouped[row.year].stateRates.push(row.rate);
      }
    }

    const result: DivorceRateChartData[] = Object.entries(grouped).map(
      ([yearStr, { stateRates, nationalRates }]) => {
        const year = parseInt(yearStr);
        const avg = (arr: number[]) =>
          arr.length > 0
            ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4))
            : 0;

        return {
          year,
          avgState: avg(stateRates),
          avgNational: avg(nationalRates),
        };
      }
    );

    return result.sort((a, b) => a.year - b.year);
  };

  return useQuery({
    queryKey: ["divorce_rates", selectedState],
    queryFn: fetchDivorceRates,
  });
};


// File: components/DivorceRateChart.tsx
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

  const stateLabel = selectedState === 'all'
    ? 'All'
    : selectedState.charAt(0).toUpperCase() + selectedState.slice(1);

  const filteredData = divorceData?.filter(d => d.year >= 2020 && d.year <= 2023) || [];

  const titleColor = selectedState === 'all' ? 'text-blue-500' : 'text-pink-500';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divorce Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divorce Rate</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <AlertCircle className="h-12 w-12 text-red-500 mr-2" />
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex gap-2">
          Divorce Rate
          <span className={titleColor}>{stateLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year"
                type="number"
                domain={[2020, 2023]}
                ticks={[2020, 2021, 2022, 2023]}
                tickFormatter={(value) => value.toString()}
              />
              <YAxis 
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                domain={[0, 0.15]}
              />
              <Tooltip 
                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, '']}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgState"
                name="State Average"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="avgNational"
                name="National Average"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
