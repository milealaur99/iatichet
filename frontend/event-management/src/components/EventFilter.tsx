import React, { useState } from "react";
import { TextField, Button, Container, Box } from "@mui/material";
import { styled } from "@mui/system";
import { EventList } from "./EventList";
import { useNavigate, useLocation } from "react-router-dom";

const StyledContainer = styled(Container)({
  padding: "40px 20px",
  margin: "auto"
});

const FormContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px"
});

const StyledTextField = styled(TextField)({
  flexGrow: 1,
  minWidth: "250px",
  backgroundColor: "#fff",
  borderRadius: "4px"
});

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: "#fff",
  "&:hover": {
    backgroundColor: theme.palette.primary.main
  },
  padding: "10px 20px",
  borderRadius: "20px",
  fontWeight: "bold",
  whiteSpace: "nowrap"
}));

export const EventFilter: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("search", search);
    navigate({ search: searchParams.toString() });
  };

  return (
    <StyledContainer>
      <FormContainer component="form" onSubmit={onSearch}>
        <StyledTextField
          label="Search Events"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <StyledButton type="submit" variant="contained">
          Search
        </StyledButton>
      </FormContainer>
      <EventList />
    </StyledContainer>
  );
};
