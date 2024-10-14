import React from "react";
import { Typography, Box, Theme } from "@mui/material";
import { keyframes } from "@mui/system";
import RemoveRedEyeTwoToneIcon from "@mui/icons-material/RemoveRedEyeTwoTone";

export const BlinkingTypography = ({ viewers }: { viewers: number }) => {
  const isUrgent = viewers > 1;

  const urgentAnimation = (theme: Theme) => keyframes`
    0% { color: ${theme.palette.error.main}; }  
    50% { color: ${theme.palette.warning.main}; }  
    100% { color: ${theme.palette.error.main}; }  
  `;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={(theme) => ({
        padding: "8px",
        backgroundColor: theme.palette.info.main,
        borderRadius: "10px",
        maxWidth: "300px",
        textAlign: "center",
        margin: "0 auto"
      })}
    >
      <RemoveRedEyeTwoToneIcon
        sx={(theme) => ({
          fontSize: 30,
          animation: isUrgent
            ? `${urgentAnimation(theme)} 1s infinite`
            : "none",
          color: isUrgent
            ? theme.palette.error.main
            : theme.palette.warning.main
        })}
      />
      <Typography
        variant="body2"
        sx={(theme) => ({
          animation: isUrgent
            ? `${urgentAnimation(theme)} 1s infinite`
            : "none",
          color: isUrgent
            ? theme.palette.error.main
            : theme.palette.primary.main,
          fontWeight: "bold"
        })}
      >
        {isUrgent ? "Hurry! Other users are viewing!" : "Get your ticket now!"}
      </Typography>

      <Typography
        variant="body2"
        sx={(theme) => ({
          marginTop: "5px",
          fontWeight: "bold",
          color: isUrgent
            ? theme.palette.error.main
            : theme.palette.primary.main
        })}
      >
        {`Viewers: ${viewers}`}
      </Typography>
    </Box>
  );
};
