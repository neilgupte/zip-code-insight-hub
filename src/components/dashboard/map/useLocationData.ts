
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  selectedCity: string,
  selectedCompositeScores: string[]
) => {
  return useQuery({
    queryKey: ['map-locations', selectedState, selectedCity, selectedCompositeScores],
    queryFn: async () => {
      let query = supabase
        .from('location')
        .select('*, composite_score:divorce_score(composite_score)')
        .eq('state_name', selectedState === 'florida' ? 'Florida' : selectedState);
      
      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      return data.map((loc) => ({
        ...loc,
        composite_score: loc.composite_score?.[0]?.["Divorce Rate Score"] || Math.floor(Math.random() * 20) + 1
      }));
    },
  });
};

export type { LocationData };
