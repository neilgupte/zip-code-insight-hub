
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
      
      // Fetch location data with population and competitors info
      const { data: locationData, error: locationError } = await supabase
        .from('location')
        .select('*')
        .eq('state_name', stateFormatted)
        .gt('population', 0); // Only include locations with population > 0
      
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
        .select('Zip, median_divorce_rate, scaled_composite_score')
        .in('Zip', zipCodes);
        
      if (divorceError) {
        console.error("Divorce score query failed:", divorceError);
        toast.error("Error loading divorce score data");
      }
      
      // Create lookup maps
      const divorceScoreMap = new Map();
      if (divorceScores) {
        divorceScores.forEach(score => {
          divorceScoreMap.set(score.Zip, {
            medianDivorceRate: parseFloat(score.median_divorce_rate || '0'),
            compositeScore: score.scaled_composite_score || 0
          });
        });
      }
      
      // Transform the data with new TAM and SAM calculations
      const transformedData: LocationInsight[] = locationData
        .filter(location => location.population > 0) // Ensure we only include locations with population
        .map(location => {
          const divorceData = divorceScoreMap.get(location.zip) || { medianDivorceRate: 0, compositeScore: 0 };
          
          // Calculate households from population (assuming average household size of 2.5)
          const households = Math.floor(location.population / 2.5);
          
          // Calculate TAM: $100 per qualifying household
          const tam = households * 100;
          
          // Calculate SAM: TAM if composite score >= 15 and within commute radius (Urban)
          const sam = (divorceData.compositeScore >= 15 && location.Urbanicity === 'Urban') 
            ? tam 
            : 0;
          
          return {
            zip: parseInt(location.zip || '0'),
            city: location.city || "Unknown",
            households: households,
            Competitors: location.Competitors?.toString() || "None",
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
      
      // Sort by SAM value in descending order to show highest potential first
      filteredData.sort((a, b) => b.sam - a.sam);
      
      // Apply pagination
      
      return filteredData;
      
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
      selectedCompositeScores ? selectedCompositeScores.join(',') : ''
    ],
    queryFn: fetchLocationInsights
  });
}
