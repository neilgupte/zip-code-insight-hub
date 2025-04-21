
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LocationInsight } from "@/types/location";
import { toast } from "sonner";

export function useLocationInsights(
  selectedState: string,
  page: number,
  itemsPerPage: number,
  selectedIncomeBracket?: string,
  selectedCompositeScores?: string[]
) {
  const fetchLocationInsights = async (): Promise<LocationInsight[]> => {
    try {
      console.log("Fetching location insights for state:", selectedState);
      
      // Return empty array if "all" is selected - requires specific state
      if (selectedState === 'all') {
        console.log("All states selected - skipping query");
        return [];
      }
      
      // Format state name for query
      const stateFormatted = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
      console.log("Formatted state name:", stateFormatted);
      
      // Query the location table for the selected state
      const { data: locationData, error: locationError } = await supabase
        .from('location')
        .select('*')
        .eq('state_name', stateFormatted);
      
      if (locationError) {
        console.error("Location query failed:", locationError);
        toast.error("Error loading location data");
        return [];
      }

      if (!locationData || locationData.length === 0) {
        console.log("No location data available for the selected state:", stateFormatted);
        return [];
      }
      
      console.log(`Found ${locationData.length} locations for ${stateFormatted}`);
      
      // Get zip codes from location data
      const zipCodes = locationData.map(loc => loc.zip);
      
      // Fetch divorce score data for these zip codes
      const { data: divorceScores, error: divorceError } = await supabase
        .from('divorce_score')
        .select('*')
        .in('zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce score query failed:", divorceError);
        toast.error("Error loading divorce score data");
      }
      
      // Fetch income score data for these zip codes
      const { data: incomeScores, error: incomeError } = await supabase
        .from('income_score')
        .select('*')
        .in('zip', zipCodes);
        
      if (incomeError) {
        console.error("Income score query failed:", incomeError);
        toast.error("Error loading income score data");
      }
      
      console.log(`Found ${divorceScores?.length || 0} divorce scores and ${incomeScores?.length || 0} income scores`);
      
      // Create lookup maps for scores
      const divorceScoreMap = new Map();
      if (divorceScores) {
        divorceScores.forEach(score => {
          divorceScoreMap.set(score.zip, {
            divorceRateScore: parseFloat(score["Divorce Rate Score"] || '0'),
            medianDivorceRate: parseFloat(score.median_divorce_rate || '0')
          });
        });
      }
      
      const incomeScoreMap = new Map();
      if (incomeScores) {
        incomeScores.forEach(score => {
          incomeScoreMap.set(score.zip, {
            incomeScore: parseFloat(score["Household Income Score"] || '0'),
            householdsWith200K: parseInt(score["# of households with more than 200K income"] || '0', 10)
          });
        });
      }
      
      // Transform the data to match the LocationInsight interface
      const transformedData: LocationInsight[] = locationData.map(location => {
        const divorceData = divorceScoreMap.get(location.zip) || { divorceRateScore: 0, medianDivorceRate: 0 };
        const incomeData = incomeScoreMap.get(location.zip) || { incomeScore: 0, householdsWith200K: 0 };
        
        // Calculate composite score: (Divorce Rate Score + Household Income Score) / 2
        const divorceRateScore = divorceData.divorceRateScore || 0;
        const householdIncomeScore = incomeData.incomeScore || 0;
        const compositeScore = (divorceRateScore + householdIncomeScore) / 2;
        
        // Calculate households based on population (if available)
        const households = location.population ? Math.floor(location.population / 2.5) : 0;
        
        // Calculate TAM based on scoring thresholds
        const divorceThreshold = 5; // Threshold for divorce rate score
        const incomeThreshold = 5; // Threshold for household income score
        const tam = (divorceRateScore >= divorceThreshold && householdIncomeScore >= incomeThreshold) 
          ? households : 0;
        
        // Calculate SAM based on specific criteria
        const sam = (compositeScore >= 0.7 && 
                    location.state_id === 'FL' && 
                    location.Urbanicity === 'Urban') 
          ? Math.floor(tam * 0.3) : 0;
        
        return {
          zip: parseInt(location.zip || '0'),
          city: location.city || "Unknown",
          households: households,
          Competitors: location.Competitors || "None",
          state_name: location.state_name || "Unknown",
          median_divorce_rate: divorceData.medianDivorceRate,
          composite_score: compositeScore,
          tam: tam,
          sam: sam
        };
      });
      
      console.log(`Transformed ${transformedData.length} location insights`);
      
      // Apply composite score filter if needed
      let filteredData = transformedData;
      if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
        filteredData = transformedData.filter(insight => {
          const score = insight.composite_score || 0;
          
          if (selectedCompositeScores.includes('low') && score >= 1 && score <= 7) {
            return true;
          }
          
          if (selectedCompositeScores.includes('medium') && score >= 8 && score <= 14) {
            return true;
          }
          
          if (selectedCompositeScores.includes('high') && score >= 15 && score <= 20) {
            return true;
          }
          
          return false;
        });
        
        console.log(`Filtered to ${filteredData.length} location insights based on composite score`);
      }
      
      // Apply pagination
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedData = filteredData.slice(start, end);
      
      console.log(`Returning ${paginatedData.length} paginated location insights`);
      
      return paginatedData;
    } catch (error) {
      console.error("Error fetching location insights:", error);
      toast.error("Error loading data. Please try again later.");
      return [];
    }
  };

  return useQuery({
    queryKey: [
      "location_insights",
      selectedState,
      selectedIncomeBracket,
      selectedCompositeScores ? selectedCompositeScores.join(',') : '',
      page
    ],
    queryFn: fetchLocationInsights
  });
}
