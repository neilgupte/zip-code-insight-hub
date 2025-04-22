
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
      
      if (selectedState === 'all') {
        console.log("All states selected - skipping query");
        return [];
      }
      
      const stateFormatted = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
      console.log("Formatted state name:", stateFormatted);
      
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
      
      const zipCodes = locationData.map(loc => loc.zip);
      
      // Fetch divorce scores with scaled composite scores
      const { data: divorceScores, error: divorceError } = await supabase
        .from('divorce_score')
        .select('zip, median_divorce_rate, scaled_composite_score')
        .in('zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce score query failed:", divorceError);
        toast.error("Error loading divorce score data");
      }
      
      // Fetch income data
      const { data: incomeScores, error: incomeError } = await supabase
        .from('income_score')
        .select('zip, "# of households with more than 200K income"')
        .in('zip', zipCodes);
        
      if (incomeError) {
        console.error("Income score query failed:", incomeError);
        toast.error("Error loading income score data");
      }
      
      // Create lookup maps
      const divorceScoreMap = new Map();
      if (divorceScores) {
        divorceScores.forEach(score => {
          divorceScoreMap.set(score.zip, {
            medianDivorceRate: parseFloat(score.median_divorce_rate || '0'),
            compositeScore: score.scaled_composite_score || 0
          });
        });
      }
      
      const incomeScoreMap = new Map();
      if (incomeScores) {
        incomeScores.forEach(score => {
          incomeScoreMap.set(score.zip, {
            householdsWith200K: parseInt(score["# of households with more than 200K income"] || '0', 10)
          });
        });
      }
      
      // Transform the data
      const transformedData: LocationInsight[] = locationData.map(location => {
        const divorceData = divorceScoreMap.get(location.zip) || { medianDivorceRate: 0, compositeScore: 0 };
        const incomeData = incomeScoreMap.get(location.zip) || { householdsWith200K: 0 };
        
        const households = location.population ? Math.floor(location.population / 2.5) : 0;
        
        // Calculate TAM based on composite score thresholds
        const compositeThreshold = 7; // Medium or higher threshold
        const tam = divorceData.compositeScore >= compositeThreshold ? households : 0;
        
        // Calculate SAM based on specific criteria
        const sam = (divorceData.compositeScore >= 15 && 
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
          composite_score: divorceData.compositeScore,
          tam: tam,
          sam: sam
        };
      });
      
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
      }
      
      // Apply pagination
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredData.slice(start, end);
      
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
