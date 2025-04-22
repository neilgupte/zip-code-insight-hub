
import { DivorceRateChart } from "./charts/DivorceRateChart";
import { IncomeDistributionChart } from "./charts/IncomeDistributionChart";
import { RawIncomeData } from "./cards/RawIncomeData";

export const Charts = () => {
  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DivorceRateChart selectedState="all" />
        <IncomeDistributionChart />
      </div>
      <RawIncomeData />
    </div>
  );
};
