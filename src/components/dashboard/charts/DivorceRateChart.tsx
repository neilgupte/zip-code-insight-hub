import React, { useEffect } from "react";
import { useDivorceRates } from "@/hooks/useDivorceRates";

interface DivorceRateChartProps {
  selectedState: string;
}

const DivorceRateChart: React.FC<DivorceRateChartProps> = ({ selectedState }) => {
  const { data, isLoading, isError, error, refetch } = useDivorceRates(selectedState);

  useEffect(() => {
    refetch();
  }, [selectedState, refetch]);

  if (isLoading) return <div>Loading divorce rates...</div>;

  if (isError) {
    return (
      <div className="text-red-600">
        Error loading data: {(error as Error)?.message}
        <button onClick={() => refetch()} className="ml-4 px-3 py-1 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div>No data available.</div>;
  }

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
