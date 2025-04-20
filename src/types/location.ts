
export interface LocationInsight {
  zip: number;
  city: string;
  households: number;
  Competitors: string | null;
  state_name: string;
  median_divorce_rate: number | null;
  composite_score: number | null;
  tam: number;
  sam: number;
}

export interface DivorceData {
  zip: number | null;
  median_divorce_rate: number | null;
  "Divorce Rate Score": number | null;
}
