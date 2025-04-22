
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { MAPBOX_TOKEN, MAP_STYLES, STATE_BOUNDS } from './map/constants';
import { useLocationData, type LocationData } from './map/useLocationData';
import { Legend } from './map/Legend';
import { stateNameToAbbreviation } from '@/utils/stateMapping';

interface MapComponentProps {
  selectedState?: string;
  selectedCompositeScores?: string[];
}

export const MapComponent: React.FC<MapComponentProps> = ({
  selectedState = 'florida',
  selectedCompositeScores = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { data: locations, isLoading } = useLocationData(selectedState, selectedCompositeScores);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      bounds: STATE_BOUNDS[selectedState]?.bounds,
      fitBoundsOptions: { padding: STATE_BOUNDS[selectedState]?.padding || 50 },
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);
      console.log("Map loaded successfully");
      
      // Add state boundaries layer
      if (map.current) {
        map.current.addSource('state-boundaries', {
          type: 'vector',
          url: 'mapbox://mapbox.boundaries-adm1-v3'
        });

        // Add state fill layer
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

        // Add state border layer
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

  // Update markers and state boundaries when location data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !locations || locations.length === 0) {
      console.log("Skip adding markers: map not ready or no locations", { 
        mapReady: !!map.current, 
        mapLoaded, 
        locationsCount: locations?.length 
      });
      return;
    }

    console.log(`Adding ${locations.length} markers to map`);

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Wait for map to be fully loaded before adding sources
    const addMapData = () => {
      try {
        if (map.current?.getSource('locations')) {
          map.current.removeLayer('location-points');
          map.current.removeSource('locations');
        }

        map.current?.addSource('locations', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: locations.map(loc => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [loc.lng, loc.lat]
              },
              properties: {
                zip: loc.zip,
                city: loc.city,
                composite_score: loc.composite_score,
                competitors: loc.Competitors || 'None'
              }
            }))
          }
        });

        map.current?.addLayer({
          id: 'location-points',
          type: 'circle',
          source: 'locations',
          paint: {
            'circle-radius': MAP_STYLES.circleRadius,
            'circle-color': MAP_STYLES.circleColor,
            'circle-opacity': 0.7,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        });

        // Add popups using standard markers
        locations.forEach(loc => {
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 15
          });

          new mapboxgl.Marker({
            color: '#8B5CF6',
            scale: 0.7
          })
            .setLngLat([loc.lng, loc.lat])
            .setPopup(
              popup.setHTML(`
                <div class="p-2">
                  <h3 class="font-bold">ZIP: ${loc.zip}</h3>
                  <p>City: ${loc.city}</p>
                  <p>Composite Score: ${loc.composite_score?.toFixed(2) || 'N/A'}</p>
                  <p>Competitors: ${loc.Competitors || 'None'}</p>
                </div>
              `)
            )
            .addTo(map.current!);
        });

        // Fit bounds to show all markers
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(loc => {
          bounds.extend([loc.lng, loc.lat]);
        });
        map.current?.fitBounds(bounds, { 
          padding: STATE_BOUNDS[selectedState]?.padding || 50,
          maxZoom: 10 // Prevent zooming in too far
        });
        
        console.log("Map data added successfully");
      } catch (error) {
        console.error("Error adding data to map:", error);
      }
    };

    if (mapLoaded && map.current?.loaded()) {
      addMapData();
    } else {
      map.current?.once('load', addMapData);
    }
  }, [locations, mapLoaded]);

  // Update map view when selected state changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Update state boundary filter
    const stateCode = stateNameToAbbreviation[selectedState.toLowerCase()];
    if (map.current.getLayer('state-fills')) {
      map.current.setFilter('state-fills', ['==', ['get', 'iso_3166_2'], stateCode]);
      map.current.setFilter('state-borders', ['==', ['get', 'iso_3166_2'], stateCode]);
    }

    // Fit to state bounds if available
    if (STATE_BOUNDS[selectedState]) {
      map.current.fitBounds(
        STATE_BOUNDS[selectedState].bounds,
        { padding: STATE_BOUNDS[selectedState].padding }
      );
    }
  }, [selectedState, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 rounded-md" />
      <Legend />
    </div>
  );
};

