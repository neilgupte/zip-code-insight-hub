
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onIncomeBracketChange: (income: string) => void;
  onCompositeScoreChange: (scores: string[]) => void;
}

// List of all US states
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", 
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

export const DashboardHeader = ({
  onStateChange,
  onCityChange,
  onIncomeBracketChange,
  onCompositeScoreChange
}: DashboardHeaderProps) => {
  const [selectedState, setSelectedState] = useState<string>("all");
  const [cities, setCities] = useState<string[]>([]);
  const [compositeScores, setCompositeScores] = useState<string[]>([]);
  const [incomeRange, setIncomeRange] = useState<number[]>([100000, 500000]);

  // Fetch cities based on selected state
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState === "all") {
        setCities(["all"]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('location')
          .select('city')
          .eq('state_name', selectedState)
          .order('city')
          .distinct();

        if (error) throw error;
        
        const cityNames = data.map(item => item.city).filter(Boolean);
        setCities(["all", ...cityNames]);
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities(["all"]);
      }
    };

    fetchCities();
  }, [selectedState]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    onStateChange(value.toLowerCase());
    onCityChange("all"); // Reset city when state changes
  };

  const handleCityChange = (value: string) => {
    onCityChange(value.toLowerCase());
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
    setIncomeRange(values);
    // Format income range as "$100,000 - $500,000" for display
    const formattedRange = `$${values[0].toLocaleString()} - $${values[1].toLocaleString()}`;
    onIncomeBracketChange(formattedRange);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">State Name</label>
            <Select 
              defaultValue="all"
              onValueChange={handleStateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="all">All</SelectItem>
                {US_STATES.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">City</label>
            <Select 
              defaultValue="all"
              onValueChange={handleCityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Income Bracket Median</label>
            <div className="pt-6 pb-2">
              <Slider 
                defaultValue={[100000, 500000]}
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
