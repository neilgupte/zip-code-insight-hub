import { useEffect, useRef, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, STATE_BOUNDS } from './constants';
import { stateNameToAbbreviation } from '@/utils/stateMapping';

export const useMapInitialization = (
  mapContainer: MutableRefObject<HTMLDivElement | null>,
  map: MutableRefObject<mapboxgl.Map | null>,
  selectedState: string,
  setMapLoaded: (loaded: boolean) => void
) => {
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: STATE_BOUNDS[selectedState]?.center || [-81.5158, 27.6648],
      zoom: STATE_BOUNDS[selectedState]?.zoom || 5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);
      console.log("Map loaded successfully");
      
      if (map.current) {
        map.current.addSource('state-boundaries', {
          type: 'vector',
          url: 'mapbox://mapbox.boundaries-adm1-v3'
        });

        map.current.addLayer({
          'id': 'state-fills',
          'type': 'fill',
          'source': 'state-boundaries',
          'source-layer': 'boundaries_admin_1',
          'paint': {
            'fill-color': '#f0f0f0',
            'fill-opacity': 0.3
          },
          'filter': ['==', ['get', 'iso_3166_2'], stateNameToAbbreviation[selectedState.toLowerCase()]]
        });

        map.current.addLayer({
          'id': 'state-borders',
          'type': 'line',
          'source': 'state-boundaries',
          'source-layer': 'boundaries_admin_1',
          'paint': {
            'line-color': '#627BC1',
            'line-width': 2
          },
          'filter': ['==', ['get', 'iso_3166_2'], stateNameToAbbreviation[selectedState.toLowerCase()]]
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
};
