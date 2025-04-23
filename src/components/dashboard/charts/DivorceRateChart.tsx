import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useDivorceRates } from "@/hooks/useDivorceRates";
import { AlertCircle } from "lucide-react";

interface DivorceRateChartProps {
  selectedState: string;
}

export const DivorceRateChart = ({ selectedState }: DivorceRateChartProps) => {
  const { data, isLoading, error } = useDivorceRates(selectedState);

  const stateLabel =
    selectedState === "all"
      ? "All"
      : selectedState.charAt(0).toUpperCase() + selectedState.slice(1);

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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divorce Rate</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[350px]">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Error loading divorce rate data
          </p>
        </CardContent>
      </Card>
    );
  }

  // data is guaranteed to have one entry per year 2020–2023
  const chartData = data!;

  const titleColor = selectedState === "all" ? "text-blue-500" : "text-pink-500";

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
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                type="number"
                domain={[2020, 2023]}
                ticks={[2020, 2021, 2022, 2023]}
                tickFormatter={(v) => v.toString()}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
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

        {/* DEBUG TABLE */}
        <div className="mt-6 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left py-1">Year</th>
                <th className="text-right py-1">State Avg (%)</th>
                <th className="text-right py-1">National Avg (%)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d) => (
                <tr key={d.year}>
                  <td className="py-1">{d.year}</td>
                  <td className="py-1 text-right">{d.avgState.toFixed(1)}</td>
                  <td className="py-1 text-right">{d.avgNational.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
