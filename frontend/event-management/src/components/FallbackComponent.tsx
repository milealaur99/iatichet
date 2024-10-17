import React from "react";
import { Button, Typography, Container } from "@mui/material";
import { styled } from "@mui/system";
import logoImage from "../assets/default_transparent_765x625.png";

const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  textAlign: "center",
  backgroundColor: theme.palette.info.main,
  color: theme.palette.info.contrastText,
  padding: theme.spacing(4)
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.main
  }
}));

export default function Fallback({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <StyledContainer>
      <img
        src={logoImage}
        alt="Logo"
        style={{ width: "150px", marginBottom: "20px" }}
      />
      <Typography variant="h4" gutterBottom>
        Oops! Something went wrong.
      </Typography>
      <Typography variant="body1" gutterBottom>
        An unexpected error occurred. Please try again.
      </Typography>
      {error && (
        <Typography variant="body2" style={{ color: "red" }}>
          {error.message}
        </Typography>
      )}
      {resetErrorBoundary && (
        <StyledButton onClick={resetErrorBoundary}>Try Again</StyledButton>
      )}
    </StyledContainer>
  );
}
