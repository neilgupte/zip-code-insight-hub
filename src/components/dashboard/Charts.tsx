
import { DivorceRateChart } from "./charts/DivorceRateChart";
import { IncomeDistributionChart } from "./charts/IncomeDistributionChart";

interface ChartsProps {
  selectedState: string;
  selectedCity: string;
}

export const Charts = ({ selectedState, selectedCity }: ChartsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <DivorceRateChart selectedState={selectedState} selectedCity={selectedCity} />
      <IncomeDistributionChart selectedState={selectedState} selectedCity={selectedCity} />
    </div>
  );
};
