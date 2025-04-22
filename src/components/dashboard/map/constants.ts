export const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3BpcmF0ZWNoIiwiYSI6ImNtOXBzbXI0eTFjdHoya3IwNng1ZTI4ZHoifQ.hgWIXnSx6HdRC67U2xhdxQ';

export const MAP_STYLES = {
  circleRadius: [
    'interpolate',
    ['linear'],
    ['get', 'composite_score'],
    1, 5,   // Min score
    20, 15  // Max score
  ] as mapboxgl.Expression,
  circleColor: [
    'step',
    ['get', 'composite_score'],
    '#ea384c',  // Low score (Red)
    8, '#FEF7CD',  // Medium score (Soft Yellow)
    15, '#F2FCE2'  // High score (Soft Green)
  ] as mapboxgl.Expression,
  markerColor: '#F2FCE2' // Default to green
};

export const STATE_BOUNDS: Record<string, { bounds: [[number, number], [number, number]], padding: number }> = {
  florida: {
    bounds: [
      [-87.634, 24.396], // Southwest coordinates
      [-79.974, 31.001]  // Northeast coordinates
    ],
    padding: 50
  },
  // Add more states as needed with their specific bounds
};

export const getMapCenter = (selectedState: string) => {
  if (selectedState === 'florida') {
    return {
      center: [-82.5, 28.0] as [number, number],
      zoom: 6
    };
  }
  
  return {
    center: [-98.5, 39.8] as [number, number],
    zoom: 4
  };
};
