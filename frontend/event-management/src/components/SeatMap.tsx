import React, { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Alert
} from "@mui/material";
import { styled } from "@mui/system";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import EventSeatOutlinedIcon from "@mui/icons-material/EventSeatOutlined";
import axios from "axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { RootState } from "../util/userSlices";
import { Link as RouterLink } from "react-router-dom";

interface Seat {
  row: string;
  number: number;
  reservationOps: {
    isReserved: boolean;
    reservation: string | null;
  };
}

const getInitialSeats = (hallName: string) =>
  Array.from(
    {
      length:
        hallName === "Small Hall" ? 50 : hallName === "Large Hall" ? 200 : 0
    },
    (_, i) => {
      const row = String.fromCharCode(65 + Math.floor(i / 10));
      const number = (i % 10) + 1;
      return {
        row,
        number,
        reservationOps: { isReserved: false, reservation: null }
      };
    }
  );

const getRows = (seats: Seat[]) => [...new Set(seats.map((seat) => seat.row))];

const StyledSeat = styled(IconButton)<{
  isHighlighted: boolean;
  isReserved: boolean;
}>(({ theme, isHighlighted, isReserved }) => ({
  margin: theme.spacing(1),
  width: "40px",
  height: "40px",
  color: theme.palette.secondary.main,
  ...(isReserved ? { color: theme.palette.primary.light } : {}),
  ...(isHighlighted ? { color: theme.palette.primary.main } : {}),
  "&:disabled": {
    color: theme.palette.secondary.contrastText
  },
  "&.selected": {
    color: theme.palette.primary.contrastText
  }
}));

const SeatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: theme.palette.info.main,
  color: theme.palette.common.white,
  padding: "20px",
  borderRadius: "16px",
  maxWidth: "800px",
  margin: "0 auto"
}));

const SeatMapTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.light,
  marginBottom: "20px",
  fontWeight: "bold"
}));

export const SeatMap = ({
  takenSeats,
  hallName,
  eventId,
  eventDate
}: {
  takenSeats: Seat[];
  hallName: string;
  eventId: string;
  eventDate: Date;
}) => {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [highlightedReservation, setHighlightedReservation] =
    useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const initialSeats = useMemo(() => getInitialSeats(hallName), [hallName]);
  const rows = useMemo(() => getRows(initialSeats), [initialSeats]);
  const isPastEvent = dayjs(eventDate).isBefore(dayjs());
  const reduxData = useSelector((state: RootState) => state.user);
  const isAdmin = reduxData.isAdmin;
  const isAuth = reduxData.username !== "" && localStorage.getItem("token");

  const updatedSeats = useMemo(() => {
    return initialSeats.map((seat) => {
      const takenSeat = takenSeats.find(
        (takenSeat) =>
          takenSeat.row === seat.row && takenSeat.number === seat.number
      );
      if (takenSeat && takenSeat.reservationOps.isReserved) {
        return takenSeat;
      }
      return seat;
    });
  }, [initialSeats, takenSeats]);

  const handleReservation = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/reservations/create",
        {
          eventId,
          seats: selectedSeats
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const { reservation } = response.data;
      const checkoutSession = await axios.post(
        "http://localhost:5000/api/payment/create-checkout-session",
        { reservation },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const { url } = checkoutSession.data;
      window.location.href = url;
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!seat.reservationOps.isReserved) {
      if (selectedSeats.includes(seat)) {
        setSelectedSeats(selectedSeats.filter((s) => s !== seat));
      } else if (selectedSeats.length < 5) {
        setSelectedSeats([...selectedSeats, seat]);
      }
    }
  };

  const handleMouseEnter = (reservationId: string) => {
    setHighlightedReservation(reservationId);
  };

  return (
    <SeatContainer>
      <SeatMapTitle variant="h5">Seat Map</SeatMapTitle>
      <Box display="flex" flexDirection="column" alignItems="center">
        {rows.map((row) => (
          <Box key={row} display="flex" justifyContent="center">
            {updatedSeats
              .filter((seat) => seat.row === row)
              .map((seat, index) => (
                <Tooltip
                  key={index}
                  title={
                    seat.reservationOps.isReserved
                      ? isAdmin
                        ? "Click to view reservation"
                        : "Reserved"
                      : `Row ${seat.row} Seat ${seat.number}`
                  }
                >
                  <span>
                    {seat.reservationOps.reservation ? (
                      <Box
                        {...(isAdmin
                          ? {
                              component: RouterLink,
                              to: `/reservations/${seat.reservationOps.reservation}`,
                              sx: {
                                textDecoration: "none"
                              },
                              replace: false
                            }
                          : {})}
                        onMouseEnter={() =>
                          handleMouseEnter(
                            seat.reservationOps.reservation ?? ""
                          )
                        }
                        onMouseLeave={() => handleMouseEnter("")}
                      >
                        <StyledSeat
                          isReserved={true}
                          sx={{
                            width: {
                              xs: 20,
                              sm: 30,
                              md: 40
                            },
                            height: {
                              xs: 20,
                              sm: 30,
                              md: 40
                            }
                          }}
                          isHighlighted={
                            seat.reservationOps.reservation ===
                            highlightedReservation
                          }
                        >
                          <EventSeatIcon />
                        </StyledSeat>
                      </Box>
                    ) : (
                      <StyledSeat
                        isReserved={false}
                        sx={{
                          width: {
                            xs: 20,
                            sm: 30,
                            md: 40
                          },
                          height: {
                            xs: 20,
                            sm: 30,
                            md: 40
                          }
                        }}
                        onClick={() =>
                          isPastEvent ? null : handleSeatClick(seat)
                        }
                        disabled={seat.reservationOps.isReserved}
                        className={
                          selectedSeats.includes(seat) ? "selected" : ""
                        }
                        isHighlighted={
                          seat.reservationOps.reservation ===
                          highlightedReservation
                        }
                      >
                        <EventSeatOutlinedIcon />
                      </StyledSeat>
                    )}
                  </span>
                </Tooltip>
              ))}
          </Box>
        ))}
      </Box>
      <Box mt={2}>
        <Typography variant="h6">Selected Seats:</Typography>
        {isAuth ? (
          <Typography>
            {selectedSeats.length > 0
              ? selectedSeats
                  .map((seat) => `${seat.row}${seat.number}`)
                  .join(", ")
              : "None"}
          </Typography>
        ) : (
          <Alert variant="filled" severity="info">
            Please log in to reserve seats.
          </Alert>
        )}
      </Box>
      {isPastEvent ? (
        <Alert variant="filled" severity="warning" sx={{ mt: 2 }}>
          This event has already taken place.
        </Alert>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={handleReservation}
          disabled={isSubmitting || selectedSeats.length === 0 || !isAuth}
          sx={{
            mt: 3,
            backgroundColor: (theme) => theme.palette.primary.light,
            color: (theme) => theme.palette.common.black,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.primary.main
            }
          }}
        >
          {isSubmitting ? "Submitting..." : "Reserve Seats"}
        </Button>
      )}
    </SeatContainer>
  );
};
