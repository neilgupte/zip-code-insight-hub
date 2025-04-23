import React, { useEffect } from "react";
import { useDivorceRates } from "@/hooks/useDivorceRates";

interface DivorceRateChartProps {
  selectedState: string;
}

const DivorceRateChart: React.FC<DivorceRateChartProps> = ({ selectedState }) => {
  const { data, isLoading, isError, refetch } = useDivorceRates(selectedState);

  // Always refetch when selectedState changes
  useEffect(() => {
    refetch();
  }, [selectedState, refetch]);

  if (isLoading) return <div>Loading divorce rates...</div>;
  if (isError) return <div>Error loading data.</div>;

  if (!data || data.length === 0) return <div>No data available.</div>;

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        Divorce Rates in {selectedState === "all" ? "All States" : selectedState}
      </h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">Year</th>
            <th className="p-2">State Avg (%)</th>
            <th className="p-2">National Avg (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ year, avgState, avgNational }) => (
            <tr key={year} className="border-b">
              <td className="p-2">{year}</td>
              <td className="p-2">{avgState.toFixed(1)}</td>
              <td className="p-2">{avgNational.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DivorceRateChart;
