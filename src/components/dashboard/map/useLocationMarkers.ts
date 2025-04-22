
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAP_STYLES, STATE_BOUNDS } from './constants';
import { LocationData } from './useLocationData';

export const useLocationMarkers = (
  map: React.MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  locations: LocationData[] | undefined,
  selectedState: string
) => {
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

    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

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

        locations.forEach(loc => {
          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 15
          });

          new mapboxgl.Marker({
            color: MAP_STYLES.markerColor,
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

        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(loc => {
          bounds.extend([loc.lng, loc.lat]);
        });
        map.current?.fitBounds(bounds, { 
          padding: STATE_BOUNDS[selectedState]?.padding || 50,
          maxZoom: 10
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
  }, [locations, mapLoaded, selectedState]);
};

