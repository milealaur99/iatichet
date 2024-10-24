import React from "react";
import { Box, CircularProgress, Typography, styled } from "@mui/material";
import logoImage from "../assets/default_transparent_765x625.png";

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "calc(100vh - 64px)"
}));

const IconWrapper = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "20px"
});

const LoadingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.light,
  fontSize: "1.5rem",
  fontWeight: "bold",
  textAlign: "center",
  marginTop: "20px"
}));

export const LoadingMessage = () => {
  return (
    <LoadingContainer>
      <IconWrapper>
        <img src={logoImage} alt="logo" style={{ height: "150px" }} />
      </IconWrapper>
      <CircularProgress size={80} sx={{ color: "primary.light" }} />

      <LoadingText>Getting Your Seats Ready...</LoadingText>
    </LoadingContainer>
  );
};
