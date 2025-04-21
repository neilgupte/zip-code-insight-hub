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
  // All column names for income brackets (as numbers)
  const incomeBrackets: number[] = [
    10000, 12500, 17500, 22500, 27500, 32500, 37500, 42500, 47500, 
    55000, 67500, 87500, 112500, 137500, 175000, 200000
  ];

  const fetchIncomeData = async (): Promise<TransformedIncomeData[]> => {
    try {
      // Map state to abbreviation if not 'all'
      let stateFilter: string | undefined = undefined;
      if (selectedState !== "all") {
        stateFilter = stateNameToAbbreviation[selectedState.toLowerCase()];
      }

      // Query income table for all rows if 'all', or filter by state code
      let incomeQuery = supabase.from("income").select("*");
      if (stateFilter) {
        incomeQuery = incomeQuery.eq("State", stateFilter);
      }
      const { data: incomeData, error } = await incomeQuery;

      if (error) {
        console.error("Error fetching income data:", error);
        toast.error("Error loading income data");
        return [];
      }
      if (!incomeData || incomeData.length === 0) {
        return [];
      }

      // Sum up the households for each bracket
      const aggregate: Record<number, number> = {};
      for (const bracket of incomeBrackets) {
        aggregate[bracket] = 0;
      }

      // Gathering and parsing data across all rows
      for (const row of incomeData) {
        for (const bracket of incomeBrackets) {
          const value = row[bracket.toString()];
          let households = 0;

          // Type conversion, as columns may be string or number or null
          if (typeof value === "string") {
            households = parseInt(value.replace(/,/g, ""), 10); // in case numbers are formatted with commas
          } else if (typeof value === "number") {
            households = value;
          }
          if (!isNaN(households) && households > 0) {
            aggregate[bracket] += households;
          }
        }
      }

      // Format result for recharts
      return incomeBrackets.map(bracket => ({
        incomeBracket: bracket,
        households: aggregate[bracket],
      }));
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
