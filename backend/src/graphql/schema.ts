import { gql } from "apollo-server-express";

const typeDefs = gql`
  scalar Date

  type Event {
    id: ID!
    name: String
    description: String
    date: Date
    tichetPrice: Float
    hall: Hall
    seats: [Seat]
  }

  type Hall {
    id: ID
    name: String
    description: String
    seats: [Seat]
  }

  type Seat {
    id: ID
    row: String
    number: Int
    reservationOps: ReservationOps
  }

  type ReservationOps {
    isReserved: Boolean
    reservation: Reservation
  }

  type Reservation {
    id: ID
    user: User
    event: Event
    seat: Seat
  }

  type User {
    id: ID
    username: String
    password: String
    role: String
  }

  type Query {
    events: [Event]
    event(id: ID!): Event
    halls: [Hall]
    hall(id: ID!): Hall
    seats: [Seat]
    seat(id: ID!): Seat
    reservations: [Reservation]
    reservation(id: ID!): Reservation
    users: [User]
    user(id: ID!): User
  }
`;

export default typeDefs;
