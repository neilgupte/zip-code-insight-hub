
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
        return [];
      }
      
      // Query the location table
      const { data: locationData, error: locationError } = await supabase
        .from('location')
        .select('*')
        .eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
      
      if (locationError) {
        console.error("Location query failed:", locationError);
        toast.error("Error loading location data");
        return [];
      }

      if (!locationData || locationData.length === 0) {
        console.log("No location data available for the selected filters");
        return [];
      }
      
      // Fetch divorce score data
      const { data: divorceScores, error: divorceError } = await supabase
        .from('divorce_score')
        .select('*')
        .in('zip', locationData.map(loc => loc.zip));
        
      if (divorceError) {
        console.error("Divorce score query failed:", divorceError);
      }
      
      // Fetch income score data
      const { data: incomeScores, error: incomeError } = await supabase
        .from('income_score')
        .select('*')
        .in('zip', locationData.map(loc => loc.zip));
        
      if (incomeError) {
        console.error("Income score query failed:", incomeError);
      }
      
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
        
        // Calculate composite score as requested: (Divorce Rate Score + Household Income Score) / 2
        const divorceRateScore = divorceData.divorceRateScore || 0;
        const householdIncomeScore = incomeData.incomeScore || 0;
        const compositeScore = (divorceRateScore + householdIncomeScore) / 2;
        
        // Calculate TAM and SAM as per requirements
        const households = location.population ? Math.floor(location.population / 2.5) : 0; // Estimate households
        
        // TAM: Sum of households where divorce rate score and household income score are above threshold
        const divorceThreshold = 0.5; // Example threshold
        const incomeThreshold = 0.5; // Example threshold
        
        const tam = (divorceRateScore >= divorceThreshold && householdIncomeScore >= incomeThreshold) 
          ? households * 1000 // Example calculation
          : 0;
        
        // SAM: Sum of households where composite score >= 0.7 AND State = 'FL' AND Urbanicity = 'Urban'
        const sam = (compositeScore >= 0.7 && 
                     location.state_id === 'FL' && 
                     location.Urbanicity === 'Urban') 
          ? Math.floor(tam * 0.3) 
          : 0;
        
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
      
      // Apply composite score filter if needed
      if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
        return transformedData.filter(insight => {
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
      }
      
      // Apply pagination
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      
      return transformedData.slice(start, end);
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
