import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Container, Typography } from "@mui/material";
import { styled } from "@mui/system";

const StyledContainer = styled(Container)(({ theme }) => ({
  textAlign: "center",
  marginTop: "50px",
  backgroundColor: theme.palette.info.main,
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
  maxWidth: "600px",
  margin: "auto"
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.main
  },
  marginTop: "20px"
}));

export const CancelPage = () => {
  const navigate = useNavigate();
  const searchParams: URLSearchParams = useSearchParams()[0];
  const eventId = searchParams.get("eventId");

  const handleBackToEvent = () => {
    navigate("/event/" + eventId);
  };

  return (
    <StyledContainer>
      <Typography
        variant="h4"
        gutterBottom
        sx={(theme) => ({ color: theme.palette.primary.main })}
      >
        Payment Cancelled
      </Typography>
      <Typography
        variant="body1"
        gutterBottom
        sx={(theme) => ({ color: theme.palette.primary.light })}
      >
        Unfortunately, your payment process was cancelled or an error occurred.
      </Typography>
      <StyledButton variant="contained" onClick={handleBackToEvent}>
        Back to Event
      </StyledButton>
    </StyledContainer>
  );
};
