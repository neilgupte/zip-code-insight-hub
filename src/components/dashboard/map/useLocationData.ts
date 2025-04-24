import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  state_name: string;
  Competitors?: number;
  composite_score: number;
}

export const useLocationData = (
  selectedState: string,
  selectedCompositeScores: string[]
) => {
  return useQuery({
    queryKey: ['map-locations', selectedState, selectedCompositeScores],
    queryFn: async (): Promise<LocationData[]> => {
      try {
        if (selectedState === 'all') return [];

        const stateFormatted =
          selectedState.charAt(0).toUpperCase() + selectedState.slice(1);

        // 1) Fetch base location info
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
          console.error('Error fetching map location data:', locationError);
          toast.error('Error loading map data');
          return [];
        }
        if (!locationData?.length) return [];

        const zipCodes = locationData.map(loc => loc.zip);

        // 2) Fetch divorce_rate_score for each ZIP
        const { data: divorceScores, error: divorceError } = await supabase
          .from('divorce_score')
          .select('Zip, "Divorce Rate Score"')
          .in('Zip', zipCodes);
        if (divorceError) {
          console.error('Error fetching divorce scores:', divorceError);
          toast.error('Error loading divorce scores');
        }
        const divorceScoreMap = new Map<string, number>();
        divorceScores?.forEach(s =>
          divorceScoreMap.set(s.Zip, parseFloat(s.divorce_rate_score || '0'))
        );

        // 3) Fetch household_income_score for each ZIP
        const { data: incomeScores, error: incomeError } = await supabase
          .from('income_score')
          .select('Zip, "Household Income Score"')
          .in('Zip', zipCodes);
        if (incomeError) {
          console.error('Error fetching income scores:', incomeError);
          toast.error('Error loading income scores');
        }
        const incomeScoreMap = new Map<string, number>();
        incomeScores?.forEach(s =>
          incomeScoreMap.set(s.Zip, parseFloat(s.household_income_score || '0'))
        );

        // 4) Build final array with composite = divorce_rate_score + household_income_score
        const transformed: LocationData[] = locationData
          .filter(loc => loc.lat && loc.lng)
          .map(loc => {
            const drs = divorceScoreMap.get(loc.zip) ?? 0;
            const his = incomeScoreMap.get(loc.zip) ?? 0;
            return {
              zip: loc.zip,
              lat: loc.lat,
              lng: loc.lng,
              city: loc.city || 'Unknown',
              state_name: loc.state_name || 'Unknown',
              Competitors: loc.Competitors,
              composite_score: drs + his
            };
          });

        // 5) Apply composite-score filtering
        if (
          selectedCompositeScores.length > 0 &&
          !selectedCompositeScores.includes('all')
        ) {
          return transformed.filter(loc => {
            const s = loc.composite_score;
            return (
              (selectedCompositeScores.includes('low') && s >= 1 && s <= 7) ||
              (selectedCompositeScores.includes('medium') && s >= 8 && s <= 14) ||
              (selectedCompositeScores.includes('high') && s >= 15 && s <= 20)
            );
          });
        }

        return transformed;
      } catch (error) {
        console.error('Error fetching location data for map:', error);
        toast.error('Failed to load map data. Please try again.');
        return [];
      }
    }
  });
};

export type { LocationData };
