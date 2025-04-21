
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IncomeData {
  [key: string]: string | number | null;
  State?: string | null;
  zip?: string | null;
}

interface TransformedIncomeData {
  incomeBracket: number;
  households: number;
}

// State name to abbreviation mapping
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
      
      // Get the state abbreviation for the selected state
      let stateFilter: string | undefined;
      
      if (selectedState !== 'all') {
        stateFilter = stateNameToAbbreviation[selectedState.toLowerCase()];
        console.log(`Mapped ${selectedState} to abbreviation: ${stateFilter}`);
      }
      
      // Directly query the income table with state filter
      let incomeQuery = supabase
        .from('income')
        .select('*');
        
      if (stateFilter && selectedState !== 'all') {
        incomeQuery = incomeQuery.eq('State', stateFilter);
      }
      
      const { data: incomeData, error: incomeError } = await incomeQuery;
        
      if (incomeError) {
        console.error("Error fetching income data:", incomeError);
        throw incomeError;
      }
      
      if (!incomeData || incomeData.length === 0) {
        console.log(`No income data found for ${selectedState === 'all' ? 'all states' : selectedState}`);
        return [];
      }
      
      console.log(`Found ${incomeData.length} income entries for ${selectedState === 'all' ? 'all states' : selectedState}`);
      
      // Transform the data for the chart
      const incomeBrackets = [
        10000, 12500, 17500, 22500, 27500, 32500, 37500, 42500, 47500, 
        55000, 67500, 87500, 112500, 137500, 175000, 200000
      ];
      
      // Initialize the result array with zeros for all income brackets
      const aggregatedData: Record<number, number> = {};
      incomeBrackets.forEach(bracket => {
        aggregatedData[bracket] = 0;
      });
      
      // Aggregate households by income bracket
      for (const row of incomeData as IncomeData[]) {
        for (const bracket of incomeBrackets) {
          const bracketStr = bracket.toString();
          if (bracketStr in row && row[bracketStr] !== null) {
            let households = 0;
            const value = row[bracketStr];
            
            if (typeof value === 'string') {
              households = parseInt(value, 10);
            } else if (typeof value === 'number') {
              households = value;
            }
            
            if (!isNaN(households) && households > 0) {
              aggregatedData[bracket] += households;
            }
          }
        }
      }
      
      // Convert to array format for the chart
      const transformedData: TransformedIncomeData[] = Object.entries(aggregatedData)
        .map(([bracket, households]) => ({
          incomeBracket: parseInt(bracket, 10),
          households: households
        }))
        .sort((a, b) => a.incomeBracket - b.incomeBracket);
      
      console.log(`Final aggregated data contains ${transformedData.length} income brackets`);
      console.log("Sample of transformed data:", transformedData.slice(0, 3));
      
      return transformedData;
    } catch (error) {
      console.error("Error in income data processing:", error);
      return [];
    }
  };

  return useQuery({
    queryKey: ["income_distribution", selectedState],
    queryFn: fetchIncomeData,
  });
};
