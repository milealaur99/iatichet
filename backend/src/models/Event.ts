import mongoose, { Schema, Document } from "mongoose";
import { Seat, SeatSchema } from "./Hall";

export interface Event extends Document {
  name: string;
  description: string;
  date: Date;
  tichetPrice: number;
  hall: mongoose.Schema.Types.ObjectId;
  seats: Seat[];
  poster?: string;
}

const EventSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  tichetPrice: { type: Number, required: true },
  hall: { type: Schema.Types.ObjectId, ref: "Hall", required: true },
  seats: [{ type: SeatSchema, required: true }],
  poster: { type: String, required: false }
});

export default mongoose.model<Event>("Event", EventSchema);
