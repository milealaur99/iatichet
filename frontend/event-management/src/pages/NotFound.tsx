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

export const NotFoundPage: React.FC = () => {
  return (
    <StyledContainer>
      <img
        src={logoImage}
        alt="Logo"
        style={{ width: "150px", marginBottom: "20px" }}
      />
      <Typography variant="h4" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" gutterBottom>
        Sorry, the page you're looking for does not exist.
      </Typography>
      <StyledButton href="/" variant="contained">
        Go Back Home
      </StyledButton>
    </StyledContainer>
  );
};
