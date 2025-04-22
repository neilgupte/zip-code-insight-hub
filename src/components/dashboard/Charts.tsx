
import { DivorceRateChart } from "./charts/DivorceRateChart";

interface ChartsProps {
  selectedState: string;
}

export const Charts = ({ selectedState }: ChartsProps) => {
  return (
    <div className="space-y-4 mt-4">
      <DivorceRateChart selectedState={selectedState} />
    </div>
  );
};
