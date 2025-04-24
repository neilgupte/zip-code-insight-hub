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
      if (selectedState === 'all') return [];

      const stateFormatted = selectedState.charAt(0).toUpperCase() + selectedState.slice(1);

      // 1) Fetch locations
      const { data: locationData, error: locationError } = await supabase
        .from('location')
        .select('*')
        .eq('state_name', stateFormatted)
        .gt('population', 0);
      if (locationError) throw locationError;
      if (!locationData?.length) return [];

      const zipCodes = locationData.map(loc => loc.zip);

      // 2) Fetch divorce scores (we still grab median_divorce_rate here for display)
      const { data: divorceScores, error: divorceError } = await supabase
        .from('divorce_score')
        .select('Zip, median_divorce_rate, divorce_rate_score')   // pulled “Divorce Rate Score”
        .in('Zip', zipCodes);
      if (divorceError) throw divorceError;

      const divorceScoreMap = new Map<string, { medianDivorceRate: number; divorceRateScore: number }>();
      divorceScores?.forEach(score => {
        divorceScoreMap.set(score.Zip, {
          medianDivorceRate: parseFloat(score.median_divorce_rate || '0'),
          divorceRateScore: parseFloat(score.divorce_rate_score || '0'),
        });
      });

      // 3) Fetch income scores
      const { data: incomeScores, error: incomeError } = await supabase
        .from('income_score')
        .select('Zip, household_income_score')                   // pulled “Household Income Score”
        .in('Zip', zipCodes);
      if (incomeError) throw incomeError;

      const incomeScoreMap = new Map<string, number>();
      incomeScores?.forEach(score => {
        incomeScoreMap.set(score.Zip, parseFloat(score.household_income_score || '0'));
      });

      // 4) Transform & calculate new composite_score
      const transformedData: LocationInsight[] = locationData.map(location => {
        const ds = divorceScoreMap.get(location.zip) ?? { medianDivorceRate: 0, divorceRateScore: 0 };
        const inc = incomeScoreMap.get(location.zip) ?? 0;
        const composite = ds.divorceRateScore + inc;

        const households = Math.floor(location.population / 2.5);
        const tam = households * 100;
        const sam = (composite >= 15 && location.Urbanicity === 'Urban') ? tam : 0;

        return {
          zip: parseInt(location.zip || '0'),
          city: location.city || "Unknown",
          households,
          Competitors: location.Competitors?.toString() || "None",
          state_name: location.state_name || "Unknown",
          median_divorce_rate: ds.medianDivorceRate, // still showing the raw rate
          composite_score: composite,               // now calculated
          tam,
          sam
        };
      });

      // 5) (unchanged) filter, sort, paginate...
      let filtered = transformedData;
      if (selectedCompositeScores?.length && !selectedCompositeScores.includes('all')) {
        filtered = filtered.filter(insight => {
          const s = insight.composite_score;
          return (selectedCompositeScores.includes('low')    && s >= 1 && s <= 7)
              || (selectedCompositeScores.includes('medium') && s >= 8 && s <= 14)
              || (selectedCompositeScores.includes('high')   && s >= 15 && s <= 20);
        });
      }
      filtered.sort((a, b) => b.sam - a.sam);
      return filtered;
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
      selectedCompositeScores?.join(',') ?? ''
    ],
    queryFn: fetchLocationInsights
  });
}
