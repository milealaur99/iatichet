import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  marginTop: "10px"
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main
}));

export const SuccessPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const searchParams: URLSearchParams = useSearchParams()[0];
  const eventId = searchParams.get("eventId");
  const [downloadError, setDownloadError] = useState(false);

  const downloadPDF = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/payment/download-reservation?reservationId=${id}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "reservation.pdf");
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else {
        setDownloadError(true);
      }
    } catch (error) {
      setDownloadError(true);
    }
  };

  const handleBackToEvent = () => {
    navigate("/event/" + eventId);
  };

  return (
    <StyledContainer>
      <StyledTypography variant="h4" gutterBottom>
        Payment Successful!
      </StyledTypography>
      <StyledTypography variant="body1" gutterBottom>
        Thank you for your purchase. Your transaction has been completed.
      </StyledTypography>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <StyledButton variant="contained" onClick={handleBackToEvent}>
          Back to Event
        </StyledButton>
        <StyledButton variant="contained" onClick={downloadPDF}>
          Download Reservation
        </StyledButton>
      </div>
      {downloadError && (
        <Typography variant="body2" color="error" gutterBottom>
          Error downloading reservation
        </Typography>
      )}
    </StyledContainer>
  );
};
