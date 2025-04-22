export const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3BpcmF0ZWNoIiwiYSI6ImNtOXBzbXI0eTFjdHoya3IwNng1ZTI4ZHoifQ.hgWIXnSx6HdRC67U2xhdxQ';

export const MAP_STYLES = {
  markerColors: {
    low: '#FF4C4C',    // Red for scores 1-7
    medium: '#FFD93D', // Yellow for scores 8-14
    high: '#4CAF50'    // Green for scores 15-20
  }
};

export const STATE_BOUNDS: Record<string, { bounds: [[number, number], [number, number]], padding: number, center: [number, number], zoom: number }> = {
  florida: {
    bounds: [
      [-87.634, 24.396], // Southwest coordinates
      [-79.974, 31.001]  // Northeast coordinates
    ],
    padding: 50,
    center: [-81.5158, 27.6648],
    zoom: 5
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
