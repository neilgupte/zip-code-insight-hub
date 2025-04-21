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
      
      // Start with base query
      let query = supabase
        .from("income")
        .select("Income_bracket, Households, State");

      // Apply state filter if not 'all'
      if (selectedState !== "all") {
        const stateFilter = stateNameToAbbreviation[selectedState.toLowerCase()];
        console.log("Using state filter:", stateFilter);
        
        if (stateFilter) {
          query = query.eq("State", stateFilter);
        } else {
          console.warn(`No abbreviation found for state: ${selectedState}`);
          return [];
        }
      }

      // Execute query
      const { data: incomeData, error } = await query;

      if (error) {
        console.error("Error fetching income data:", error);
        toast.error("Error loading income data");
        return [];
      }

      if (!incomeData || incomeData.length === 0) {
        console.warn("No income data found for", selectedState);
        return [];
      }

      // Aggregate households by income bracket
      const aggregatedData = incomeData.reduce((acc: Record<number, number>, row) => {
        const bracket = row.Income_bracket || 0;
        const households = row.Households || 0;
        acc[bracket] = (acc[bracket] || 0) + households;
        return acc;
      }, {});

      // Transform into array for the chart
      const result = Object.entries(aggregatedData).map(([bracket, households]) => ({
        incomeBracket: Number(bracket),
        households: households,
      })).sort((a, b) => a.incomeBracket - b.incomeBracket);

      console.log("Transformed income data:", result);
      return result;
    } catch (e) {
      console.error("Income fetch error:", e);
      toast.error("Error loading income data");
      return [];
    }
  };

  return useQuery({
    queryKey: ["income_distribution", selectedState],
    queryFn: fetchIncomeData,
  });
};
