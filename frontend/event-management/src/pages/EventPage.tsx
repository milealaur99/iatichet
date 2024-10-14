import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Alert,
  Fade
} from "@mui/material";
import { useQuery } from "react-query";
import { styled } from "@mui/system";
import { fetchImagesFromBackEnd } from "../util/fetchImagesFromBackEnd";
import { SeatMap } from "../components/SeatMap";
import { LoadingMessage } from "../components/LoadingMessage";
import { io } from "socket.io-client";
import { BlinkingTypography } from "../components/UrgencyCountDown";

interface Seat {
  row: string;
  number: number;
  reservationOps: {
    isReserved: boolean;
    reservation: string | null;
  };
}

interface Event {
  _id: string;
  name: string;
  description: string;
  date: Date;
  tichetPrice: number;
  hall: string;
  seats: Seat[];
  poster?: string;
}

const StyledContainer = styled(Box)<{ poster?: string }>(
  ({ theme, poster }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: theme.palette.common.black,
    padding: "40px",
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
    margin: "0 auto",
    transition: "transform 0.3s, box-shadow 0.3s",
    "&:hover": {
      boxShadow: "0 15px 25px rgba(0, 0, 0, 0.2)"
    },
    backgroundImage: poster ? `url(${poster})` : "none",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.3)",
      zIndex: 1
    }
  })
);

const StyledCard = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: "800px",
  marginBottom: "20px",
  borderRadius: "16px",
  overflow: "hidden",
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  position: "relative",
  "&:hover": {
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)"
  },
  zIndex: 2
}));

const GradientOverlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(to bottom, rgba(34, 123, 148, 0.4), rgba(34, 123, 148, 0.1))",
  zIndex: 1
});

const StyledCardMedia = styled(CardMedia)({
  height: 500,
  transition: "transform 0.5s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)"
  }
});

const InfoTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.info.contrastText,
  marginBottom: theme.spacing(1),
  fontSize: "18px",
  fontWeight: "500"
}));

const EventTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  marginBottom: theme.spacing(2),
  fontSize: "28px",
  fontWeight: "bold"
}));

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const { poster } = event || {};
  const [viewersCount, setViewersCount] = useState(0);
  localStorage.debug = "*";
  const { data, isLoading, isError } = useQuery<Event>(
    ["event", eventId],
    async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/events/${eventId}`
      );
      return response.data;
    },
    {
      refetchOnMount: true,
      staleTime: 0,
      cacheTime: 0
    }
  );

  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL ?? "", {
      transports: ["websocket"]
    });
    socket.emit("joinEvent", eventId);

    socket.on("viewersUpdate", (count) => {
      setViewersCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId]);

  useEffect(() => {
    const fetchSrc = async () => {
      if (!poster) return;
      const fetchedSrc = await fetchImagesFromBackEnd(poster);
      setSrc(fetchedSrc);
    };

    fetchSrc();
  }, [poster]);

  useEffect(() => {
    if (data) {
      setEvent(data);
    }
  }, [data]);

  if (isLoading) {
    return <LoadingMessage />;
  }

  if (isError) {
    return (
      <StyledContainer>
        <Fade in={true} timeout={1000}>
          <Alert
            severity="error"
            sx={(theme) => ({
              backgroundColor: theme.palette.error.main,
              color: theme.palette.common.white,
              width: "100%",
              textAlign: "center"
            })}
          >
            Error fetching event. Please try again later.
          </Alert>
        </Fade>
      </StyledContainer>
    );
  }

  if (!event) {
    return (
      <StyledContainer>
        <Fade in={true} timeout={1000}>
          <Typography
            variant="h5"
            sx={(theme) => ({ color: theme.palette.secondary.contrastText })}
          >
            Event not found...
          </Typography>
        </Fade>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer poster={src ?? ""}>
      <StyledCard>
        <Box sx={{ position: "relative" }}>
          <StyledCardMedia image={src || ""} />
          <GradientOverlay />
        </Box>
        <CardContent>
          <Box
            sx={{
              textAlign: "center"
            }}
          >
            <EventTitle variant="h4">{event.name}</EventTitle>
            <BlinkingTypography viewers={viewersCount} />
            <InfoTypography
              variant="body1"
              sx={{
                mt: 2
              }}
            >
              <strong>Date:</strong> {new Date(event.date).toLocaleString()}
            </InfoTypography>
            <InfoTypography variant="body1">
              <strong>Description:</strong> {event.description}
            </InfoTypography>
            <InfoTypography variant="body1">
              <strong>Ticket Price:</strong> {event.tichetPrice} RON
            </InfoTypography>
            <InfoTypography variant="body1">
              <strong>Hall:</strong> {event.hall}
            </InfoTypography>
          </Box>

          {event.seats && (
            <SeatMap
              eventDate={event.date}
              takenSeats={event.seats}
              hallName={event.hall}
              eventId={event._id}
            />
          )}
        </CardContent>
      </StyledCard>
    </StyledContainer>
  );
};

export default EventPage;
