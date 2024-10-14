import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { styled } from "@mui/system";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { LoadingMessage } from "../components/LoadingMessage";

interface Seat {
  row: string;
  number: number;
}

interface Reservation {
  _id: string;
  user: {
    username: string;
    email: string;
    role: string;
    _id: string;
  };
  event: string;
  hall: {
    name: string;
  };
  date: string;
  price: number;
  seats: Seat[];
  eventDate: string;
  isPaid: boolean;
  paymentLink?: string;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "30px",
  color: theme.palette.common.white,
  minHeight: "calc(100vh - 64px)"
}));

const StyledReservationContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
  margin: "20px auto",
  maxWidth: "600px"
}));

const SeatDisplay = styled(Box)({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  margin: "10px 0"
});

const SeatItem = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.common.white,
  padding: "5px 10px",
  borderRadius: "5px",
  marginRight: "10px",
  marginBottom: "10px"
}));

const HighlightBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  borderRadius: "8px",
  padding: "10px",
  textAlign: "center",
  marginBottom: "15px"
}));

export const ReservationPage = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/reservations/${reservationId}`
        );
        setReservation(response.data);
      } catch (err) {
        setError("Failed to fetch reservation.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  const handleCancelReservation = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/reservations/cancel/${reservationId}`
      );
      setReservation({ ...reservation!, isPaid: false });
    } catch (err) {
      setError("Failed to cancel reservation.");
    }
  };

  const handlePaymentRedirect = () => {
    if (reservation?.paymentLink) {
      window.location.href = reservation.paymentLink;
    }
  };

  const handleDeleteReservation = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/reservations/${reservationId}`
      );
      navigate("/admin/reservations");
    } catch (err) {
      setError("Failed to delete reservation.");
    }
  };

  if (loading) {
    return <LoadingMessage />;
  }

  if (error) {
    return (
      <StyledContainer>
        <Alert severity="error">{error}</Alert>
      </StyledContainer>
    );
  }

  if (!reservation) {
    return (
      <StyledContainer>
        <Typography variant="h5" color="error">
          Reservation not found
        </Typography>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <Typography
        variant="h4"
        mb={3}
        sx={(theme) => ({ color: theme.palette.primary.main })}
      >
        Reservation Details
      </Typography>

      <StyledReservationContainer>
        <Typography variant="body1">
          <strong>User:</strong>{" "}
          <Typography
            variant="body1"
            component={Link}
            color="primary"
            sx={(theme) => ({
              textDecoration: "underline",
              "&:hover": {
                color: theme.palette.secondary.main
              }
            })}
            to={`/reservations/?userId=${reservation.user._id}`}
          >
            {reservation.user._id}
          </Typography>
        </Typography>
        <HighlightBox>
          <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
            <strong>Username:</strong> {reservation.user.username}
          </Typography>
          <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
            <strong>Email:</strong> {reservation.user.email}
          </Typography>
          <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
            <strong>Role:</strong>{" "}
            {reservation.user.role.charAt(0).toUpperCase() +
              reservation.user.role.slice(1)}
          </Typography>
        </HighlightBox>
        <Typography variant="body1">
          <strong>Event:</strong>{" "}
          <Typography
            variant="body1"
            component={Link}
            color="primary"
            sx={(theme) => ({
              textDecoration: "underline",
              "&:hover": {
                color: theme.palette.secondary.main
              }
            })}
            to={`/event/${reservation.event}`}
          >
            {reservation.event}
          </Typography>
        </Typography>
        <Typography variant="body1">
          <strong>Hall:</strong> {reservation.hall.name}
        </Typography>
        <Typography variant="body1">
          <strong>Date:</strong> {new Date(reservation.date).toLocaleString()}
        </Typography>
        <Typography variant="body1">
          <strong>Event Date:</strong>{" "}
          {new Date(reservation.eventDate).toLocaleString()}
        </Typography>
        <Typography variant="body1">
          <strong>Price:</strong> {(reservation.price / 100).toFixed(2)} RON
        </Typography>

        <Typography variant="body1">
          <strong>Seats:</strong>
        </Typography>
        <SeatDisplay>
          {reservation.seats.map((seat, index) => (
            <SeatItem key={index}>
              {seat.row}
              {seat.number}
            </SeatItem>
          ))}
        </SeatDisplay>

        <Typography variant="body1">
          <strong>Status:</strong> {reservation.isPaid ? "Paid" : "Unpaid"}
        </Typography>

        {!reservation.isPaid && (
          <Box mt={2}>
            <Button
              variant="contained"
              sx={(theme) => ({
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.common.black,
                "&:hover": { backgroundColor: theme.palette.success.light },
                marginRight: 2
              })}
              onClick={handlePaymentRedirect}
            >
              Complete Payment
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelReservation}
            >
              Cancel Reservation
            </Button>
          </Box>
        )}

        {reservation.isPaid && (
          <Box mt={2}>
            <Alert severity="success">This reservation has been paid.</Alert>
            <Button
              variant="contained"
              sx={(theme) => ({
                backgroundColor: theme.palette.error.main,
                color: theme.palette.common.white,
                mt: 2
              })}
              onClick={handleDeleteReservation}
            >
              Delete Reservation
            </Button>
          </Box>
        )}
      </StyledReservationContainer>
    </StyledContainer>
  );
};
