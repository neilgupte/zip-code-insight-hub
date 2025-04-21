import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RawIncomeDataProps {
  selectedState: string;
}

interface IncomeRow {
  Zip: number;
  Income_bracket: number;
  State: string;
  Households: number;
}

// Mapping state name to abbreviation for filtering
const stateNameToAbbreviation: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'puerto rico': 'PR'
};

export const RawIncomeData = ({ selectedState }: RawIncomeDataProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["raw_income_data", selectedState],
    queryFn: async () => {
      console.log("Fetching raw income data for state:", selectedState);
      
      let query = supabase.from("income").select("*");
      
      // Only apply filter if not looking at all states
      if (selectedState !== "all") {
        // First try to match with the state abbreviation
        const stateAbbr = stateNameToAbbreviation[selectedState.toLowerCase()];
        console.log("Trying to filter with state abbreviation:", stateAbbr);
        
        if (stateAbbr) {
          // Filter using case-insensitive partial match since the database might store
          // state values in different formats (e.g., "PR", "Puerto Rico", etc.)
          query = query.ilike("State", `%${stateAbbr}%`);
        } else {
          // If no abbreviation found, try with the state name directly
          console.log("No abbreviation found, trying with state name:", selectedState);
          query = query.ilike("State", `%${selectedState}%`);
        }
      }
      
      // Add a limit to prevent retrieving too much data
      query = query.limit(100);
      
      console.log("Executing query to fetch income data...");
      const { data: incomeData, error } = await query;
      
      if (error) {
        console.error("Error fetching raw income data:", error);
        throw error;
      }
      
      console.log("Raw income data response:", {
        rows: incomeData?.length,
        firstRow: incomeData?.[0],
        selectedState
      });
      
      // If we still have no data, fetch some sample data
      if (!incomeData || incomeData.length === 0) {
        console.log("No data found for the selected state, fetching sample data");
        
        const { data: sampleData, error: sampleError } = await supabase
          .from("income")
          .select("*")
          .limit(20);
          
        if (sampleError) {
          console.error("Error fetching sample data:", sampleError);
          throw sampleError;
        }
        
        console.log("Sample data response:", {
          rows: sampleData?.length,
          firstRow: sampleData?.[0]
        });
        
        return sampleData as IncomeRow[];
      }
      
      return incomeData as IncomeRow[];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Income Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Income Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading raw income data: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Income Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No income data found for {selectedState === 'all' ? 'any state' : selectedState}.
              Please check the console logs for more information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Income Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zip</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Income Bracket</TableHead>
                <TableHead>Households</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={`${row.Zip}-${row.Income_bracket}-${index}`}>
                  <TableCell>{row.Zip}</TableCell>
                  <TableCell>{row.State}</TableCell>
                  <TableCell>${row.Income_bracket?.toLocaleString()}</TableCell>
                  <TableCell>{row.Households?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
