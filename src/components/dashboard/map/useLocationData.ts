
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  state_name: string;
  Competitors?: number; // Changed from string to number to match the actual data
  composite_score?: number;
}

export const useLocationData = (
  selectedState: string,
  selectedCompositeScores: string[]
) => {
  return useQuery({
    queryKey: ['map-locations', selectedState, selectedCompositeScores],
    queryFn: async () => {
      try {
        console.log("Fetching map data for state:", selectedState);
        
        if (selectedState === 'all') {
          console.log("All states selected - skipping map query");
          return [];
        }
        
        const stateFormatted = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);
        console.log("Formatted state name for map:", stateFormatted);
        
        const { data: locationData, error: locationError } = await supabase
          .from('location')
          .select(`
            zip,
            lat,
            lng,
            city,
            state_name, 
            Competitors
          `)
          .eq('state_name', stateFormatted);
        
        if (locationError) {
          console.error("Error fetching map location data:", locationError);
          toast.error("Error loading map data");
          return [];
        }
        
        if (!locationData || locationData.length === 0) {
          console.log(`No location data found for ${stateFormatted}`);
          return [];
        }

        console.log(`Found ${locationData.length} locations for map`);

        const zipCodes = locationData.map(loc => loc.zip);

        // Now we'll fetch the scaled composite scores directly
        const { data: divorceScores, error: divorceError } = await supabase
          .from('divorce_score')
          .select('Zip, scaled_composite_score')
          .in('Zip', zipCodes);
          
        if (divorceError) {
          console.error("Error fetching divorce scores:", divorceError);
          toast.error("Error loading divorce scores");
        }

        // Create a lookup map for the scaled composite scores
        const compositeScoreMap = new Map();
        if (divorceScores) {
          divorceScores.forEach(score => {
            compositeScoreMap.set(score.Zip, score.scaled_composite_score || 0);
          });
        }
        
        // Transform the data with scaled composite scores
        const transformedData: LocationData[] = locationData
          .filter(location => location.lat && location.lng)
          .map(location => ({
            zip: location.zip,
            lat: location.lat,
            lng: location.lng,
            city: location.city || 'Unknown',
            state_name: location.state_name || 'Unknown',
            Competitors: location.Competitors,
            composite_score: compositeScoreMap.get(location.zip) || 0
          }));
        
        // Filter by composite score ranges if selected
        if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
          return transformedData.filter(location => {
            const score = location.composite_score || 0;
            
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
        
        return transformedData;
      } catch (error) {
        console.error("Error fetching location data for map:", error);
        toast.error("Failed to load map data. Please try again.");
        return [];
      }
    },
  });
};

export type { LocationData };
