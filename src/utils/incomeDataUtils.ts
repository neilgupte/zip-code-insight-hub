
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { stateNameToAbbreviation } from "./stateMapping";

export interface TransformedIncomeData {
  incomeBracket: number;
  households: number;
}

export const createMockIncomeData = (): TransformedIncomeData[] => {
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

export const processIncomeData = (data: any[]): TransformedIncomeData[] => {
  console.log("Processing income data, rows:", data.length);
  
  if (!data || data.length === 0) {
    console.warn("No data to process");
    return [];
  }
  
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
    
    if (bracket === null || households === null) {
      console.warn("Skipping row with null values:", row);
      return acc;
    }
    
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
  
  const result = Object.entries(aggregatedData)
    .map(([bracket, households]) => ({
      incomeBracket: Number(bracket),
      households: Number(households),
    }))
    .sort((a, b) => a.incomeBracket - b.incomeBracket);

  console.log("Final transformed income data:", result);
  return result;
};

export const fetchIncomeDataForState = async (
  supabase: SupabaseClient<Database>,
  selectedState: string
): Promise<TransformedIncomeData[]> => {
  console.log("Fetching income data for state:", selectedState);
  
  let query = supabase.from("income").select("Income_bracket, Households, State");
  
  if (selectedState !== "all") {
    const stateAbbr = stateNameToAbbreviation[selectedState.toLowerCase()];
    console.log("Trying to filter with state abbreviation:", stateAbbr);
    
    if (stateAbbr) {
      query = query.ilike("State", `%${stateAbbr}%`);
    } else {
      console.log("No abbreviation found, trying with state name:", selectedState);
      query = query.ilike("State", `%${selectedState}%`);
    }
  }
  
  console.log("Executing query to fetch income distribution data...");
  const { data: incomeData, error } = await query;
  
  if (error) {
    console.error("Error fetching income data:", error);
    throw error;
  }
  
  if (incomeData && incomeData.length > 0) {
    console.log("Successfully retrieved income data");
    return processIncomeData(incomeData);
  }
  
  console.log("No data found for the selected state, fetching sample data");
  
  const { data: sampleData, error: sampleError } = await supabase
    .from("income")
    .select("Income_bracket, Households, State")
    .limit(100);
    
  if (sampleError) {
    console.error("Error fetching sample data:", sampleError);
    return createMockIncomeData();
  }
  
  if (sampleData && sampleData.length > 0) {
    console.log("Using sample data");
    return processIncomeData(sampleData);
  }
  
  console.log("No income data found, creating mock data");
  return createMockIncomeData();
};
