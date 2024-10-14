import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { loginUser, RootState } from "../util/userSlices";
import { useDispatch, useSelector } from "react-redux";

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

export const SignInForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    username: storedUsername,
    isError,
    errorMessage,
    isLoading
  } = useSelector((state: RootState) => state.user);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(loginUser({ username, password }) as any);
  };

  useEffect(() => {
    if (storedUsername) {
      navigate("/");
    }
  }, [storedUsername, navigate]);

  return (
    <StyledContainer>
      <Typography variant="h4" gutterBottom>
        Sign In
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
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        <StyledButton
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Sign In"}
        </StyledButton>
      </StyledForm>

      {isError && (
        <Box mt={2}>
          {/* Access the message property if errorMessage is an object */}
          <Alert severity="error">
            {(errorMessage as any)?.message || errorMessage}
          </Alert>
        </Box>
      )}
    </StyledContainer>
  );
};
