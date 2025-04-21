
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
      
      // Get state abbreviation for filtering
      const stateFilter = selectedState !== "all" 
        ? stateNameToAbbreviation[selectedState.toLowerCase()] 
        : null;
        
      console.log("State filter abbreviation:", stateFilter);
      
      // Log the query we're about to run
      const queryMessage = `Query: SELECT Income_bracket, Households, State FROM income${stateFilter ? ` WHERE State = '${stateFilter}'` : ''}`;
      console.log(queryMessage);
      
      // Execute the query
      let query = supabase
        .from("income")
        .select("Income_bracket, Households, State");
        
      if (stateFilter) {
        query = query.eq("State", stateFilter);
      }
      
      const { data: incomeData, error } = await query;

      if (error) {
        console.error("Error fetching income data:", error);
        toast.error("Error loading income data");
        return [];
      }

      console.log("Raw income data received:", incomeData);
      
      if (!incomeData || incomeData.length === 0) {
        console.warn("No income data found for", selectedState);
        // Try a broader query if specific state returns no data
        if (stateFilter) {
          console.log("Attempting to fetch data without state filter as fallback");
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("income")
            .select("Income_bracket, Households, State");
            
          console.log("Fallback query results:", fallbackData);
          
          if (fallbackError || !fallbackData || fallbackData.length === 0) {
            console.warn("No fallback data available either");
            return [];
          }
          
          // Use fallback data (all states) if original query returned nothing
          console.log("Using fallback data (all states)");
          return processIncomeData(fallbackData);
        }
        return [];
      }

      return processIncomeData(incomeData);
    } catch (e) {
      console.error("Income fetch error:", e);
      toast.error("Error loading income data");
      return [];
    }
  };
  
  // Helper function to process income data
  const processIncomeData = (data: any[]): TransformedIncomeData[] => {
    console.log("Processing income data, rows:", data.length);
    
    // Check if data has required properties
    if (data.length > 0) {
      const sampleRow = data[0];
      console.log("Sample data row:", sampleRow);
      
      if (sampleRow.Income_bracket === undefined || sampleRow.Households === undefined) {
        console.error("Data missing required fields - sample:", sampleRow);
        return [];
      }
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

  return useQuery({
    queryKey: ["income_distribution", selectedState],
    queryFn: fetchIncomeData,
  });
};
