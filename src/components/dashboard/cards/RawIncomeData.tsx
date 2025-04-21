
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
      
      // Get state abbreviation for filtering
      const stateFilter = selectedState !== "all" 
        ? stateNameToAbbreviation[selectedState.toLowerCase()] 
        : null;
        
      console.log("Using state abbreviation for filter:", stateFilter);
      
      let query = supabase
        .from("income")
        .select("*");
      
      if (stateFilter) {
        query = query.eq("State", stateFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching raw income data:", error);
        throw error;
      }

      console.log("Raw income data response:", {
        rows: data?.length,
        firstRow: data?.[0],
        stateFilter
      });

      // If no data with the abbreviation, try with a flexible approach
      if (!data || data.length === 0) {
        console.log("No data found with exact abbreviation, trying flexible match");
        
        const { data: flexData, error: flexError } = await supabase
          .from("income")
          .select("*")
          .ilike("State", `%${stateFilter || ''}%`);
          
        if (flexError) {
          console.error("Error with flexible state search:", flexError);
          throw flexError;
        }
        
        console.log("Flexible search results:", {
          rows: flexData?.length,
          firstRow: flexData?.[0]
        });
        
        if (flexData && flexData.length > 0) {
          return flexData as IncomeRow[];
        }
        
        // If still no data and not searching for "all", try to get some sample data
        if (selectedState !== "all") {
          console.log("No data for specific state, getting sample data");
          const { data: sampleData } = await supabase
            .from("income")
            .select("*")
            .limit(20);
            
          return sampleData as IncomeRow[];
        }
      }

      return data as IncomeRow[];
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
              Based on your screenshot, data is available for Puerto Rico (PR) in the income table.
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
