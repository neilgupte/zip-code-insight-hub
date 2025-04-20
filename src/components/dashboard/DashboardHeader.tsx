
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderProps {
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onIncomeBracketChange: (income: string) => void;
  onCompositeScoreChange: (scores: string[]) => void;
}

export const DashboardHeader = ({
  onStateChange,
  onCityChange,
  onIncomeBracketChange,
  onCompositeScoreChange
}: DashboardHeaderProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">State Name</label>
            <Select 
              defaultValue="florida"
              onValueChange={onStateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="florida">Florida</SelectItem>
                <SelectItem value="california">California</SelectItem>
                <SelectItem value="texas">Texas</SelectItem>
                <SelectItem value="new_york">New York</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">City</label>
            <Select 
              defaultValue="all"
              onValueChange={onCityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="miami">Miami</SelectItem>
                <SelectItem value="tampa">Tampa</SelectItem>
                <SelectItem value="orlando">Orlando</SelectItem>
                <SelectItem value="jacksonville">Jacksonville</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Income Bracket Median</label>
            <Input 
              type="number" 
              placeholder="$200,000" 
              className="w-full"
              onChange={(e) => onIncomeBracketChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Composite Score</label>
            <Select 
              onValueChange={(value) => onCompositeScoreChange([value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Multiple values" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High (15-20)</SelectItem>
                <SelectItem value="medium">Medium (8-14)</SelectItem>
                <SelectItem value="low">Low (1-7)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
