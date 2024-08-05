import Event from "../models/Event";
import Reservation from "../models/Reservation";
import { IResolvers } from "@graphql-tools/utils";

const resolvers: IResolvers = {
  Query: {
    events: async () => {
      return await Event.find();
    },
    event: async (_: any, { id }: { id: string }) => {
      return await Event.findById(id);
    },
    reservations: async () => {
      return await Reservation.find();
    },
    reservation: async (_: any, { id }: { id: string }) => {
      return await Reservation.findById(id);
    },
  },
};

export default resolvers;
