
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { STATE_BOUNDS } from './constants';
import { stateNameToAbbreviation } from '@/utils/stateMapping';

export const useStateBoundary = (
  map: React.MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  selectedState: string
) => {
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const stateCode = stateNameToAbbreviation[selectedState.toLowerCase()];
    if (map.current.getLayer('state-fills')) {
      map.current.setFilter('state-fills', ['==', ['get', 'iso_3166_2'], stateCode]);
      map.current.setFilter('state-borders', ['==', ['get', 'iso_3166_2'], stateCode]);
    }

    if (STATE_BOUNDS[selectedState]) {
      map.current.fitBounds(
        STATE_BOUNDS[selectedState].bounds,
        { padding: STATE_BOUNDS[selectedState].padding }
      );
    }
  }, [selectedState, mapLoaded]);
};

