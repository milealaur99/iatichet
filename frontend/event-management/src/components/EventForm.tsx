import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Stack
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { createEvent } from "../services/eventService";
import { styled } from "@mui/system";

const StyledContainer = styled(Container)(({ theme }) => ({
  backgroundColor: theme.palette.info.light,
  borderRadius: "12px",
  padding: "30px",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
  minHeight: "100vh"
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: "#fff",
  "&:hover": {
    backgroundColor: theme.palette.info.dark
  }
}));

const UploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.info.dark,
  color: "#fff",
  "&:hover": {
    backgroundColor: theme.palette.info.main
  },
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}));

export const EventForm: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [hall, setHall] = useState("Small Hall");
  const [tichetPrice, setTichetPrice] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPoster(e.target.files[0]);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !date || !hall || !tichetPrice) {
      setError("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("hall", hall);
    formData.append("tichetPrice", tichetPrice);
    if (poster) {
      formData.append("poster", poster);
    }

    try {
      const response = await createEvent(formData);
      setMessage(response.message);
      setError(null);
    } catch (err) {
      setError("There was a problem with the server");
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <Typography
        variant="h4"
        gutterBottom
        sx={(theme) => ({ color: theme.palette.secondary.main })}
      >
        Create Event
      </Typography>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          sx={{ backgroundColor: "#fff" }}
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={4}
          required
          sx={{ backgroundColor: "#fff" }}
        />
        <TextField
          fullWidth
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true
          }}
          required
          sx={{ backgroundColor: "#fff" }}
        />
        <FormControl
          fullWidth
          margin="normal"
          required
          sx={{ backgroundColor: "#fff" }}
        >
          <InputLabel id="hall-label">Hall</InputLabel>
          <Select
            labelId="hall-label"
            value={hall}
            onChange={(e) => setHall(e.target.value)}
          >
            <MenuItem value="Small Hall">Small Hall</MenuItem>
            <MenuItem value="Large Hall">Large Hall</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Ticket Price"
          value={tichetPrice}
          onChange={(e) => setTichetPrice(e.target.value)}
          margin="normal"
          type="number"
          required
          InputProps={{
            inputProps: { min: 0 }
          }}
          sx={{ backgroundColor: "#fff" }}
        />

        <UploadButton
          as="label"
          variant="contained"
          sx={{ mt: 2, mb: 2, pt: 1, pb: 1 }}
          fullWidth
        >
          {poster ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircleIcon
                sx={(theme) => ({ color: theme.palette.success.main })}
              />
              <Typography>Poster Uploaded</Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <CloudUploadIcon />
              <Typography>Upload Poster</Typography>
            </Stack>
          )}
          <input type="file" hidden onChange={onFileChange} />
        </UploadButton>

        <StyledButton type="submit" variant="contained" fullWidth>
          Create Event
        </StyledButton>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </StyledContainer>
  );
};
