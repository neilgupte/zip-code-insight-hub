
import { DivorceRateChart } from "./charts/DivorceRateChart";
import { IncomeDistributionChart } from "./charts/IncomeDistributionChart";

interface ChartsProps {
  selectedState: string;
}

export const Charts = ({ selectedState }: ChartsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <DivorceRateChart selectedState={selectedState} />
      <IncomeDistributionChart selectedState={selectedState} />
    </div>
  );
};
