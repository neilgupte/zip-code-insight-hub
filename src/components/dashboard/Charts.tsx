import DivorceRateChart from "./charts/DivorceRateChart"; // ✅ default import
import { IncomeDistributionChart } from "./charts/IncomeDistributionChart"; // named import

interface ChartsProps {
  selectedState: string;
  chartType?: "divorce" | "income";
}

export const Charts = ({ selectedState, chartType }: ChartsProps) => {
  // If no specific chart type is specified, return full view
  if (!chartType) {
    return (
      <div className="space-y-4 mt-4">
        <DivorceRateChart selectedState={selectedState} />
        <IncomeDistributionChart selectedState={selectedState} />
      </div>
    );
  }

  // Return specific chart based on type
  return (
    <div className="h-full">
      {chartType === "divorce" ? (
        <DivorceRateChart selectedState={selectedState} />
      ) : (
        <IncomeDistributionChart selectedState={selectedState} />
      )}
    </div>
  );
};

