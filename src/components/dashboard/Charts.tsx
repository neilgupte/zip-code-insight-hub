
import { DivorceRateChart } from "./charts/DivorceRateChart";
import { IncomeDistributionChart } from "./charts/IncomeDistributionChart";

interface ChartsProps {
  selectedState: string;
}

export const Charts = ({ selectedState }: ChartsProps) => {
  return (
    <div className="space-y-4 mt-4">
      <DivorceRateChart selectedState={selectedState} />
      <IncomeDistributionChart selectedState={selectedState} />
    </div>
  );
};
