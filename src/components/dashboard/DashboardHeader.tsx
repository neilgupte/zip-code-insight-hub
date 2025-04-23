
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  onStateChange: (state: string) => void;
  onIncomeBracketChange: (income: string) => void;
  onCompositeScoreChange: (scores: string[]) => void;
  initialState?: string;
}

// List of all US states including Puerto Rico
const US_STATES = [
  "Alabamaa", "Alaska", "Arizona", "Arkansas", "California", 
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "Puerto Rico"
];

export const DashboardHeader = ({
  onStateChange,
  onIncomeBracketChange,
  onCompositeScoreChange,
  initialState = "all"
}: DashboardHeaderProps) => {
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [compositeScores, setCompositeScores] = useState<string[]>([]);
  const [incomeRange, setIncomeRange] = useState<[number, number]>([100000, 500000]);

  // Initialize with the initial state
  useEffect(() => {
    if (initialState !== "all") {
      setSelectedState(initialState);
      onStateChange(initialState);
    }
  }, [initialState, onStateChange]);

  const handleStateChange = (value: string) => {
    console.log("State changed in header to:", value);
    setSelectedState(value);
    onStateChange(value.toLowerCase());
  };

  const handleCompositeScoreChange = (value: string, checked: boolean) => {
    setCompositeScores(prev => {
      const newScores = checked
        ? [...prev, value]
        : prev.filter(score => score !== value);
      
      onCompositeScoreChange(newScores.length > 0 ? newScores : ["all"]);
      return newScores;
    });
  };

  const handleIncomeRangeChange = (values: number[]) => {
    setIncomeRange([values[0], values[1]]);
    const formattedRange = `$${values[0].toLocaleString()} - $${values[1].toLocaleString()}`;
    onIncomeBracketChange(formattedRange);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">State Name</label>
            <Select 
              value={selectedState}
              onValueChange={handleStateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="all">All</SelectItem>
                {US_STATES.map(state => (
                  <SelectItem key={state} value={state.toLowerCase()}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Income Bracket Range</label>
            <div className="pt-6 pb-2">
              <Slider 
                defaultValue={[100000, 500000]}
                value={[incomeRange[0], incomeRange[1]]}
                min={100000}
                max={1000000}
                step={50000}
                onValueChange={handleIncomeRangeChange}
                className="mb-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${incomeRange[0].toLocaleString()}</span>
                <span>${incomeRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Composite Score</label>
            <div className="space-y-2 pt-1">
              <div className="flex items-center">
                <Checkbox 
                  id="high" 
                  onCheckedChange={(checked) => handleCompositeScoreChange('high', checked === true)}
                />
                <Label htmlFor="high" className="ml-2">High (15-20)</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="medium" 
                  onCheckedChange={(checked) => handleCompositeScoreChange('medium', checked === true)}
                />
                <Label htmlFor="medium" className="ml-2">Medium (8-14)</Label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="low" 
                  onCheckedChange={(checked) => handleCompositeScoreChange('low', checked === true)}
                />
                <Label htmlFor="low" className="ml-2">Low (1-7)</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
