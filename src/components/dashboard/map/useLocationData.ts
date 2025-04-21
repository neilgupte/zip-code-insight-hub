
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  zip: number;
  lat: number;
  lng: number;
  city: string;
  state_name: string;
  Competitors?: string;
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
        // First, get the filtered location_insights data
        let insightsQuery = supabase
          .from('location_insights')
          .select(`
            zip,
            city,
            state_name, 
            Competitors,
            composite_score
          `);
        
        // Add condition for state if not "all"
        if (selectedState !== 'all') {
          insightsQuery = insightsQuery.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
        }
        
        // Apply composite score filter
        if (selectedCompositeScores && selectedCompositeScores.length > 0 && !selectedCompositeScores.includes('all')) {
          let minScore = null;
          let maxScore = null;
          
          if (selectedCompositeScores.includes('low')) {
            minScore = 1;
            maxScore = 7;
          } else if (selectedCompositeScores.includes('medium')) {
            minScore = 8;
            maxScore = 14;
          } else if (selectedCompositeScores.includes('high')) {
            minScore = 15;
            maxScore = 20;
          }

          if (minScore !== null && maxScore !== null) {
            insightsQuery = insightsQuery.gte('composite_score', minScore).lte('composite_score', maxScore);
          }
        }
        
        const { data: insightsData, error: insightsError } = await insightsQuery.limit(50);
        
        if (insightsError) {
          toast.error("Error loading insights data: " + insightsError.message);
          throw insightsError;
        }
        
        if (!insightsData || insightsData.length === 0) {
          toast.warning(`No location data found for ${selectedState}`);
          return [];
        }

        // Get the zip codes from the filtered insights data
        const zipCodes = insightsData.map(item => item.zip);
        
        // Now fetch the location data for these zip codes to get lat/lng
        const { data: locationData, error: locationError } = await supabase
          .from('location')
          .select('zip, lat, lng')
          .in('zip', zipCodes);
          
        if (locationError) {
          toast.error("Error loading location data: " + locationError.message);
          throw locationError;
        }
        
        // Create a map of zip to location data for easier lookup
        const locationMap = new Map();
        locationData?.forEach(loc => {
          locationMap.set(loc.zip, { lat: loc.lat, lng: loc.lng });
        });
        
        // Combine the data
        const transformedData = insightsData
          .map(insight => {
            const location = locationMap.get(insight.zip);
            if (!location) return null;
            
            return {
              zip: insight.zip,
              lat: location.lat,
              lng: location.lng,
              city: insight.city,
              state_name: insight.state_name,
              Competitors: insight.Competitors,
              composite_score: insight.composite_score
            };
          })
          .filter(item => item !== null && item.lat && item.lng) as LocationData[]; // Filter out items with missing lat/lng
        
        return transformedData;
      } catch (error) {
        console.error("Error fetching location data:", error);
        toast.error("Failed to load map data. Please try again.");
        return [];
      }
    },
  });
};

export type { LocationData };
