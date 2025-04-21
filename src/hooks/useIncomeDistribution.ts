import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransformedIncomeData {
  incomeBracket: number;
  households: number;
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

export const useIncomeDistribution = (selectedState: string) => {
  const fetchIncomeData = async (): Promise<TransformedIncomeData[]> => {
    try {
      console.log("Fetching income data for state:", selectedState);
      
      let query = supabase.from("income").select("Income_bracket, Households, State");
      
      // Only apply filter if not looking at all states
      if (selectedState !== "all") {
        // First try to match with the state abbreviation
        const stateAbbr = stateNameToAbbreviation[selectedState.toLowerCase()];
        console.log("Trying to filter with state abbreviation:", stateAbbr);
        
        if (stateAbbr) {
          // Filter using case-insensitive partial match
          query = query.ilike("State", `%${stateAbbr}%`);
        } else {
          // If no abbreviation found, try with the state name directly
          console.log("No abbreviation found, trying with state name:", selectedState);
          query = query.ilike("State", `%${selectedState}%`);
        }
      }
      
      console.log("Executing query to fetch income distribution data...");
      const { data: incomeData, error } = await query;
      
      if (error) {
        console.error("Error fetching income data:", error);
        toast.error("Error loading income data");
        return [];
      }
      
      console.log("Income distribution data response:", {
        rows: incomeData?.length,
        firstRow: incomeData?.[0],
        selectedState
      });
      
      // If we got data, process it
      if (incomeData && incomeData.length > 0) {
        console.log("Successfully retrieved income data");
        return processIncomeData(incomeData);
      }
      
      // If no data found, fetch some sample data
      console.log("No data found for the selected state, fetching sample data");
      
      const { data: sampleData, error: sampleError } = await supabase
        .from("income")
        .select("Income_bracket, Households, State")
        .limit(100);
        
      if (sampleError) {
        console.error("Error fetching sample data:", sampleError);
        return [];
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log("Using sample data");
        return processIncomeData(sampleData);
      }
      
      // If we've tried everything and still have no data, create mock data
      console.log("No income data found, creating mock data");
      return createMockIncomeData();
    } catch (e) {
      console.error("Income fetch error:", e);
      toast.error("Error loading income data");
      return [];
    }
  };
  
  // Helper function to process income data
  const processIncomeData = (data: any[]): TransformedIncomeData[] => {
    console.log("Processing income data, rows:", data.length);
    
    // Check if data is empty or invalid
    if (!data || data.length === 0) {
      console.warn("No data to process");
      return [];
    }
    
    // Check if data has required properties
    const sampleRow = data[0];
    console.log("Sample data row:", sampleRow);
    
    if (sampleRow.Income_bracket === undefined || sampleRow.Households === undefined) {
      console.error("Data missing required fields - sample:", sampleRow);
      return [];
    }
    
    // Aggregate households by income bracket
    const aggregatedData = data.reduce((acc: Record<number, number>, row) => {
      const bracket = row.Income_bracket || 0;
      const households = row.Households || 0;
      
      // Skip invalid data
      if (bracket === null || households === null) {
        console.warn("Skipping row with null values:", row);
        return acc;
      }
      
      // Parse values to ensure they're numbers
      const bracketNum = typeof bracket === 'number' ? bracket : Number(bracket);
      const householdsNum = typeof households === 'number' ? households : Number(households);
      
      if (isNaN(bracketNum) || isNaN(householdsNum)) {
        console.warn("Skipping row with NaN values after conversion:", row);
        return acc;
      }
      
      acc[bracketNum] = (acc[bracketNum] || 0) + householdsNum;
      return acc;
    }, {});

    console.log("Aggregated data:", aggregatedData);
    
    // Transform into array and sort by income bracket
    const result = Object.entries(aggregatedData)
      .map(([bracket, households]) => ({
        incomeBracket: Number(bracket),
        households: Number(households), // Explicitly cast to number
      }))
      .sort((a, b) => a.incomeBracket - b.incomeBracket);

    console.log("Final transformed income data:", result);
    return result;
  };
  
  // Create mock data if nothing is available from the database
  const createMockIncomeData = (): TransformedIncomeData[] => {
    console.log("Creating mock income data for demonstration");
    return [
      { incomeBracket: 10000, households: 5000 },
      { incomeBracket: 25000, households: 12000 },
      { incomeBracket: 50000, households: 25000 },
      { incomeBracket: 75000, households: 20000 },
      { incomeBracket: 100000, households: 15000 },
      { incomeBracket: 150000, households: 8000 },
      { incomeBracket: 200000, households: 5000 },
      { incomeBracket: 250000, households: 3000 },
    ];
  };

  return useQuery({
    queryKey: ["income_distribution", selectedState],
    queryFn: fetchIncomeData,
  });
};
