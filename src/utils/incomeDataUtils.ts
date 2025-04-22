
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export interface TransformedIncomeData {
  incomeBracket: number;
  households: number;
}

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

export const fetchIncomeData = async (
  supabase: SupabaseClient<Database>
): Promise<TransformedIncomeData[]> => {
  console.log("Fetching all income data");
  
  const { data: incomeData, error } = await supabase
    .from("income")
    .select("Income_bracket, Households");
  
  if (error) {
    console.error("Error fetching income data:", error);
    throw error;
  }
  
  if (!incomeData || incomeData.length === 0) {
    console.log("No income data found");
    return [];
  }
  
  console.log("Successfully retrieved income data");
  return processIncomeData(incomeData);
};
