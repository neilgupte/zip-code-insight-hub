
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  zip: string;
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
        // Instead of using location_insights which doesn't exist, 
        // we'll query the location table directly with proper filters
        let locationQuery = supabase
          .from('location')
          .select(`
            zip,
            lat,
            lng,
            city,
            state_name, 
            Competitors
          `);
        
        // Add condition for state if not "all"
        if (selectedState !== 'all') {
          locationQuery = locationQuery.eq('state_name', selectedState.charAt(0).toUpperCase() + selectedState.slice(1));
        }
        
        // For composite score filtering, we'll need to modify our approach
        // since we don't have composite_score field directly
        // Instead of trying to filter by composite_score, we'll fetch all relevant data
        // and filter it client-side
        
        const { data: locationData, error: locationError } = await locationQuery.limit(50);
        
        if (locationError) {
          toast.error("Error loading location data: " + locationError.message);
          throw locationError;
        }
        
        if (!locationData || locationData.length === 0) {
          toast.warning(`No location data found for ${selectedState}`);
          return [];
        }

        // Transform the data to match the expected format
        // Since we don't have composite_score in our data,
        // we'll assign a default score (this would need to be replaced with actual logic)
        const transformedData = locationData
          .map(location => {
            if (!location.lat || !location.lng) return null;
            
            // Generate a dummy composite score between 1-20 for demo purposes
            // In a real app, this would come from actual data
            const dummyScore = Math.floor(Math.random() * 20) + 1;
            
            return {
              zip: location.zip,
              lat: location.lat,
              lng: location.lng,
              city: location.city || 'Unknown',
              state_name: location.state_name || 'Unknown',
              Competitors: location.Competitors,
              composite_score: dummyScore
            };
          })
          .filter(item => item !== null) as LocationData[];
        
        // If composite score filters are applied, filter the results client-side
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
        console.error("Error fetching location data:", error);
        toast.error("Failed to load map data. Please try again.");
        return [];
      }
    },
  });
};

export type { LocationData };
