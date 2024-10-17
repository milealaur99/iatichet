import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert
} from "@mui/material";
import { styled } from "@mui/system";
import { signUp } from "../services/userServices";

const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "calc(100vh - 64px)"
}));

const StyledForm = styled("form")(({ theme }) => ({
  width: "100%",
  maxWidth: "400px",
  padding: theme.spacing(4),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)"
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.main
  }
}));

export const SignUpForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const { message } = await signUp({
        username,
        email,
        password,
        confirmPassword
      });
      setMessage(message);
      setError("");
    } catch (err) {
      setError((err as any).response.data.message);
    }
  };

  return (
    <StyledContainer>
      <Typography variant="h4" gutterBottom>
        Sign Up
      </Typography>
      <StyledForm onSubmit={onSubmit}>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          variant="outlined"
          type="email"
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        <StyledButton type="submit" variant="contained" fullWidth>
          Sign Up
        </StyledButton>
      </StyledForm>
      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      {message && (
        <Box mt={2}>
          <Alert severity="success">{message}</Alert>
        </Box>
      )}
    </StyledContainer>
  );
};
