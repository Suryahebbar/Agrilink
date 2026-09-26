import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDigitizedPlot extends Document {
  plotId: string; // matches p.id (e.g. 'plot_12345678')
  type: string;   // 'polygon' | 'line'
  points: number[][]; // x, y coordinate pairs in pixel space
  administrative: {
    district: string;
    taluk: string;
    hobli: string;
    village: string;
    survey: string;
    surnoc?: string;
    hissa?: string;
    ulpin?: string;
    olc?: string;
  };
  owner: {
    name?: string;
    father?: string;
    khata?: string;
    ownership_type?: string;
    address?: string;
  };
  land: {
    total_area?: string;
    cultivable_area?: string;
    pot_kharab_a?: string;
    pot_kharab_b?: string;
    revenue?: string;
    jodi?: string;
    cess?: string;
    water_rate?: string;
    soil?: string;
    land_type?: string;
    irrigation_source?: string;
    trees?: string;
  };
  gis: {
    geojson_geom: any;
    centroid: number[];
    bbox: number[];
    area: number;
    perimeter: number;
    side_lengths: number[];
    latitude?: number;
    longitude?: number;
  };
  crops: Array<{
    name: string;
    season?: string;
    area?: string;
    land_use?: string;
    irrigation?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DigitizedPlotSchema = new Schema<IDigitizedPlot>(
  {
    plotId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    points: { type: [[Number]], required: true },
    administrative: {
      district: { type: String, required: true },
      taluk: { type: String, required: true },
      hobli: { type: String, required: true },
      village: { type: String, required: true },
      survey: { type: String, required: true, index: true },
      surnoc: { type: String },
      hissa: { type: String },
      ulpin: { type: String },
      olc: { type: String }
    },
    owner: {
      name: { type: String },
      father: { type: String },
      khata: { type: String },
      ownership_type: { type: String },
      address: { type: String }
    },
    land: {
      total_area: { type: String },
      cultivable_area: { type: String },
      pot_kharab_a: { type: String },
      pot_kharab_b: { type: String },
      revenue: { type: String },
      jodi: { type: String },
      cess: { type: String },
      water_rate: { type: String },
      soil: { type: String },
      land_type: { type: String },
      irrigation_source: { type: String },
      trees: { type: String }
    },
    gis: {
      geojson_geom: { type: Schema.Types.Mixed, required: true },
      centroid: { type: [Number], required: true },
      bbox: { type: [Number], required: true },
      area: { type: Number, required: true },
      perimeter: { type: Number, required: true },
      side_lengths: { type: [Number], required: true },
      latitude: { type: Number },
      longitude: { type: Number }
    },
    crops: [
      {
        name: { type: String, required: true },
        season: { type: String },
        area: { type: String },
        land_use: { type: String },
        irrigation: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export const DigitizedPlot =
  mongoose.models.DigitizedPlot || mongoose.model<IDigitizedPlot>('DigitizedPlot', DigitizedPlotSchema);
