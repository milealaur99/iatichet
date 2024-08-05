import mongoose, { Schema, Document } from "mongoose";

export interface Seat {
  row: string;
  number: number;
  reservationOps: {
    isReserved: boolean;
    reservation: String | null;
  };
}

export interface Hall extends Document {
  name: string;
  type: string;
  seats: Seat[];
}

export const SeatSchema = new Schema<Seat>(
  {
    row: { type: String, required: true },
    number: { type: Number, required: true },
    reservationOps: {
      type: {
        isReserved: Boolean,
        reservation: { type: String, ref: "Reservation" },
      },
      default: {
        isReserved: false,
        reservation: null,
        required: false,
      },
    },
  },
  { _id: false }
);

const HallSchema = new Schema<Hall>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  seats: { type: [SeatSchema], required: true },
});

HallSchema.statics.initializeHalls = async function () {
  const smallHall = await this.findOne({ name: "Small Hall" });
  if (!smallHall) {
    const seats: Seat[] = Array.from({ length: 50 }, (_, i) => {
      const row = String.fromCharCode(65 + Math.floor(i / 10));
      const number = (i % 10) + 1;
      return {
        row,
        number,
        reservationOps: { isReserved: false, reservation: null },
      };
    });

    await this.create({ name: "Small Hall", type: "small", seats });
  }

  const largeHall = await this.findOne({ name: "Large Hall" });
  if (!largeHall) {
    const seats: Seat[] = Array.from({ length: 200 }, (_, i) => {
      const row = String.fromCharCode(65 + Math.floor(i / 20));
      const number = (i % 20) + 1;
      return {
        row,
        number,
        reservationOps: { isReserved: false, reservation: null },
      };
    });

    await this.create({ name: "Large Hall", type: "large", seats });
  }
};

interface HallModel extends mongoose.Model<Hall> {
  initializeHalls(): Promise<void>;
}

export default mongoose.model<Hall, HallModel>("Hall", HallSchema);
