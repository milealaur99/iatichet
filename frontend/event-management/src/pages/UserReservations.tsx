import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Pagination
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { styled } from "@mui/system";
import dayjs from "dayjs";
import { LoadingMessage } from "../components/LoadingMessage";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../util/userSlices";

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: theme.palette.info.main,
  color: theme.palette.common.white,
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
  maxWidth: "800px",
  margin: "auto",
  minHeight: "calc(100vh - 64px)"
}));

const StyledReservation = styled(Box)<{ isPastEvent: boolean }>(
  ({ theme, isPastEvent }) => ({
    width: "100%",
    padding: "20px",
    backgroundColor: isPastEvent
      ? theme.palette.info.dark
      : theme.palette.primary.main,
    borderRadius: "8px",
    marginBottom: "15px",
    position: "relative",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    color: isPastEvent
      ? theme.palette.info.contrastText
      : theme.palette.common.white,
    textDecoration: isPastEvent ? "line-through" : "none"
  })
);

const ReservationLink = styled(Link)(({ theme }) => ({
  color: theme.palette.info.contrastText,
  textDecoration: "none",
  fontWeight: "bold",
  marginBottom: "20px",
  "&:hover": {
    textDecoration: "underline",
    color: theme.palette.primary.light
  }
}));

const AdminInput = styled(TextField)(({ theme }) => ({
  margin: "20px 0",
  width: "100%",
  backgroundColor: theme.palette.info.main,
  borderRadius: "8px",
  "& .MuiInputBase-root": {
    color: theme.palette.primary.light
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.primary.light
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  "&:hover": {
    backgroundColor: theme.palette.primary.main
  },
  color: theme.palette.common.white,
  marginTop: "20px",
  alignSelf: "flex-end"
}));

export const UserReservations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userIdFromParams = new URLSearchParams(location.search).get("userId");
  const [userId, setUserId] = useState<string>(
    userIdFromParams || localStorage.getItem("userId") || ""
  );
  const [page, setPage] = useState<number>(1);
  const queryClient = useQueryClient();
  const isOwnReservations = userId === localStorage.getItem("userId");
  const reduxData = useSelector((state: RootState) => state.user);
  const isAdmin = reduxData.isAdmin;

  const { data: userInfo, isLoading: isUserInfoLoading } = useQuery(
    ["userInfo", userId],
    async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/user-info/${userId}`
      );
      return response.data;
    },
    {
      enabled: !isOwnReservations
    }
  );

  const { data, isLoading, isError } = useQuery(
    ["userReservations", userId, page],
    async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/reservations/user/${userId}?page=${page}`
      );
      return response.data;
    }
  );
  const { reservations, totalPages } = data ?? {};

  const deleteReservation = useMutation(
    async (reservationId: string) => {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/reservations/${reservationId}`
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("userReservations");
        setPage(1);
      }
    }
  );

  const cancelReservation = useMutation(
    async (reservationId: string) => {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/reservations/cancel/${reservationId}`
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("userReservations");
        setPage(1);
      }
    }
  );

  const downloadReservation = async (reservationId: string) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/download-reservation?reservationId=${reservationId}`,
        {
          responseType: "blob"
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reservation_${reservationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading reservation:", error);
    }
  };

  useEffect(() => {
    if (!userId) {
      setUserId(localStorage.getItem("userId") ?? "");
    }
  }, [userId]);

  if (isLoading || isUserInfoLoading) {
    return (
      <>
        <Box sx={{ pt: 2 }} />
        <StyledContainer>
          <LoadingMessage />
        </StyledContainer>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Box sx={{ pt: 2 }} />
        <StyledContainer>
          <Typography
            variant="h6"
            sx={(theme) => ({ color: theme.palette.primary.light })}
          >
            Error loading reservations. Please try again later.
          </Typography>
        </StyledContainer>
      </>
    );
  }

  return (
    <>
      <Box sx={{ pt: 2 }} />
      <StyledContainer>
        {isAdmin && (
          <AdminInput
            label="Enter User ID to View Reservations"
            variant="outlined"
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setPage(1);
                setUserId((e.target as HTMLInputElement).value);
                const searchParams = new URLSearchParams(location.search);
                searchParams.set(
                  "userId",
                  (e.target as HTMLInputElement).value
                );
                navigate({ search: searchParams.toString() });
              }
            }}
            placeholder="User ID"
          />
        )}

        <Typography
          variant="h5"
          mb={3}
          sx={(theme) => ({ color: theme.palette.primary.light })}
        >
          {isOwnReservations ? "Your Reservations" : "User Reservations"}
        </Typography>
        {userInfo && !isOwnReservations && (
          <Box
            mb={3}
            p={2}
            sx={(theme) => ({
              backgroundColor: theme.palette.info.dark,
              borderRadius: "8px",
              width: "100%",
              textAlign: "center"
            })}
          >
            <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
              <strong>Username:</strong> {userInfo.username}
            </Typography>
            <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
              <strong>Email:</strong> {userInfo.email}
            </Typography>
            <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
              <strong>Role:</strong>{" "}
              {userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}
            </Typography>
          </Box>
        )}
        {reservations && reservations.length > 0 ? (
          <>
            {reservations.map(
              (reservation: {
                _id: string;
                eventName: string;
                eventDate: string;
                date: string;
                seats: { row: string; number: number }[];
                price: number;
                isPaid: boolean;
                paymentLink: string;
                eventId: string;
              }) => {
                const isPastEvent = dayjs(reservation.eventDate).isBefore(
                  dayjs()
                );
                return (
                  <StyledReservation
                    key={reservation._id}
                    isPastEvent={isPastEvent}
                  >
                    <Box mb={1}>
                      <Typography
                        variant="h6"
                        {...(isOwnReservations
                          ? {}
                          : {
                              component: Link,
                              to: `/reservations/${reservation._id}`,
                              sx: {
                                textDecoration: "none",
                                color: "#78B7D0"
                              }
                            })}
                      >
                        {reservation.eventName} - Reservation at{" "}
                        {new Date(reservation.date).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        {isPastEvent
                          ? "Event has passed"
                          : `Event is upcoming on ${new Date(
                              reservation.eventDate
                            ).toLocaleString()}`}
                      </Typography>
                      <Typography variant="body2">
                        Seats:{" "}
                        {reservation.seats
                          .map(
                            (seat: { row: string; number: number }) =>
                              `${seat.row}${seat.number}`
                          )
                          .join(", ")}
                      </Typography>
                      <Typography variant="body2">
                        Price: {(reservation.price / 100).toFixed(2)} RON
                      </Typography>
                      <Typography variant="body2">
                        Status: {reservation.isPaid ? "Paid" : "Unpaid"}{" "}
                        {reservation.isPaid
                          ? ""
                          : `- Expires at ${dayjs(reservation.date)
                              .add(30, "minute")
                              .format("HH:mm A")}`}
                      </Typography>
                    </Box>
                    <Box
                      mt={2}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <ReservationLink to={`/event/${reservation.eventId}`}>
                          View Event
                        </ReservationLink>
                        {!reservation.isPaid && reservation.paymentLink && (
                          <Box mt={2}>
                            <Button
                              variant="contained"
                              sx={(theme) => ({
                                color: "#FFFFFF",
                                backgroundColor: theme.palette.primary.light,
                                "&:hover": {
                                  backgroundColor: theme.palette.primary.main
                                },
                                marginRight: "10px"
                              })}
                              onClick={() => {
                                if (reservation.paymentLink) {
                                  window.location.href =
                                    reservation.paymentLink;
                                }
                              }}
                            >
                              Pay Now
                            </Button>
                            <Button
                              variant="contained"
                              sx={(theme) => ({
                                color: "#FFFFFF",
                                backgroundColor: theme.palette.secondary.main,
                                "&:hover": {
                                  backgroundColor: theme.palette.success.light
                                }
                              })}
                              onClick={() =>
                                cancelReservation.mutate(reservation._id)
                              }
                            >
                              Cancel Reservation
                            </Button>
                          </Box>
                        )}
                        {reservation.isPaid && (
                          <Box mt={2}>
                            <Button
                              variant="contained"
                              sx={(theme) => ({
                                color: "#FFFFFF",
                                backgroundColor: theme.palette.secondary.main,
                                "&:hover": {
                                  backgroundColor: theme.palette.success.light
                                },
                                marginRight: "10px"
                              })}
                              startIcon={<DownloadIcon />}
                              onClick={() =>
                                downloadReservation(reservation._id)
                              }
                            >
                              Download Ticket
                            </Button>
                          </Box>
                        )}
                      </Box>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() =>
                          deleteReservation.mutate(reservation._id)
                        }
                        sx={(theme) => ({
                          color: theme.palette.info.dark,
                          mt: 2
                        })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </StyledReservation>
                );
              }
            )}
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="standard"
              sx={(theme) => ({
                marginTop: "20px",
                "& .MuiPaginationItem-root": {
                  color: theme.palette.primary.light
                },
                "& .Mui-selected": {
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.common.white
                },
                "& .MuiPaginationItem-root.Mui-disabled": {
                  color: theme.palette.action.disabled
                },
                "& .MuiPaginationItem-root:hover": {
                  backgroundColor: theme.palette.action.hover
                }
              })}
            />
          </>
        ) : (
          <Typography
            variant="h6"
            sx={(theme) => ({ color: theme.palette.primary.light })}
          >
            No reservations found.
          </Typography>
        )}
        <StyledButton onClick={() => setUserId("")}>Reset View</StyledButton>
      </StyledContainer>
    </>
  );
};
