
import { supabase } from "@/integrations/supabase/client";

export const createSampleIncomeData = async () => {
  console.log("Attempting to create sample income data...");
  
  try {
    // First, check if we have any location data to work with
    const { data: locations, error: locationError } = await supabase
      .from('location')
      .select('zip, state_name, city')
      .limit(20);
      
    if (locationError) {
      console.error("Error fetching locations for sample data:", locationError);
      return false;
    }
    
    if (!locations || locations.length === 0) {
      console.error("No locations found to create sample income data");
      return false;
    }
    
    console.log(`Found ${locations.length} locations to use for sample income data`);
    
    // Create sample income data for each location
    const incomeData = locations.map(location => {
      // Generate random household counts for each income bracket
      const data: any = {
        Zip: location.zip
      };
      
      // Income brackets
      const brackets = [
        10000, 12500, 17500, 22500, 27500, 32500, 37500, 42500, 47500, 
        55000, 67500, 87500, 112500, 137500, 175000, 200000
      ];
      
      // Add random household counts for each bracket
      brackets.forEach(bracket => {
        // Lower income brackets have more households, higher brackets have fewer
        const multiplier = Math.max(1, 20 - Math.floor(bracket / 10000));
        data[bracket.toString()] = Math.floor(Math.random() * multiplier * 10);
      });
      
      return data;
    });
    
    // Insert the sample data
    const { error: insertError } = await supabase
      .from('income')
      .upsert(incomeData);
      
    if (insertError) {
      console.error("Error inserting sample income data:", insertError);
      return false;
    }
    
    console.log(`Successfully created sample income data for ${incomeData.length} locations`);
    return true;
  } catch (error) {
    console.error("Error in createSampleIncomeData:", error);
    return false;
  }
};
