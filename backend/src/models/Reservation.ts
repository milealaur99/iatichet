import mongoose, { Schema, Document } from "mongoose";
import { Seat, SeatSchema } from "./Hall";

export interface Reservation extends Document {
  user: mongoose.Schema.Types.ObjectId;
  event: mongoose.Schema.Types.ObjectId;
  date: Date;
  price: number;
  seats: Seat[];
}

const ReservationSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  hall: { type: Schema.Types.ObjectId, ref: "Hall", required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  seats: [{ type: SeatSchema, required: true }],
});

export default mongoose.model<Reservation>("Reservation", ReservationSchema);
