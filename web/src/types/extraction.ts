export type ExtractionConfidence = "high" | "medium" | "low";
export type BBox = { x: number; y: number; w: number; h: number };

export type ExtractedItem = {
  itemType: string;
  color: string | null;
  pattern: string | null;
  fabricType: string | null;
  formalityLevel: string | null;
  season: string | null;
  warmthLevel: string | null;
  confidence: ExtractionConfidence;
  sourcePhotoIndex: number;
  bbox?: BBox;      // normalized 0-1 coordinates returned by GPT-4o
  cropUrl?: string; // data URL of the cropped region, set client-side after extraction
};
