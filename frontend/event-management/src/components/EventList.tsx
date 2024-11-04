import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Pagination,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Grid,
  Drawer,
  IconButton,
  SelectChangeEvent,
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate, useLocation } from "react-router-dom";
import { DateRangePicker } from "./DateRangePicker";
import CloseIcon from "@mui/icons-material/Close";
import { fetchImagesFromBackEnd } from "../util/fetchImagesFromBackEnd";
import { LoadingMessage } from "./LoadingMessage";
import { FilterList } from "@mui/icons-material";
import { isEmpty, isNil, omitBy } from "lodash";

const StyledContainer = styled(Container)(({ theme }) => ({
  color: theme.palette.text.primary,
  minHeight: "100vh",
  padding: "40px 20px",
  display: "flex",
  flexDirection: "column",
}));

const FilterContainer = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.info.main,
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "20px",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 345,
  backgroundColor: theme.palette.info.main,
  color: theme.palette.common.white,
  margin: "16px",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.3s, box-shadow 0.3s",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.2)",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
  },
  color: theme.palette.common.white,
  marginTop: "10px",
  borderRadius: "20px",
  fontWeight: "bold",
}));

const ApplyButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.main,
  },
  borderRadius: "20px",
  height: "40px",
  minWidth: "120px",
}));

const StyledTextField = styled(TextField)({
  flexGrow: 1,
});

const StyledPagination = styled(Pagination)(({ theme }) => ({
  marginTop: "20px",
  justifyContent: "center",
  display: "flex",
  ".MuiPaginationItem-root": {
    color: theme.palette.primary.light,
  },
}));

const TruncatedTypography = styled(Typography)({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const StyledImageContainer = styled(Box)({
  width: "100%",
  height: 200,
  overflow: "hidden",
});

const StyledImage = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

type Event = {
  _id: string;
  name: string;
  description: string;
  date: string;
  hall: string;
  tichetPrice: number;
  poster: string;
};

const ImageContainer = ({ poster }: { poster: string }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchSrc = async () => {
      const fetchedSrc = await fetchImagesFromBackEnd(poster);
      setSrc(fetchedSrc);
    };

    fetchSrc();
  }, [poster]);

  return <StyledImage src={src || ""} alt="Event poster" />;
};

const getUrlFiltersFromParams = (location: {
  search: string;
}): {
  date?: string;
  price?: string;
  hall?: string;
  seatsPercentage?: string;
  search?: string;
  page?: number;
} => {
  const searchParams = new URLSearchParams(location.search);

  return omitBy(
    {
      search: searchParams.get("search") || undefined,
      date: searchParams.get("date") || undefined,
      price: searchParams.get("price") || undefined,
      hall: searchParams.get("hall") || undefined,
      seatsPercentage: searchParams.get("seatsPercentage") || undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
    },
    isNil
  );
};

export const EventList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState<{
    date?: string;
    price?: string;
    hall?: string;
    seatsPercentage?: string;
    search?: string;
    page?: number;
  }>(getUrlFiltersFromParams(location));
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [events, setEvents] = useState<Event[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState<number | undefined>(
    filters?.page ?? 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryFilters = getUrlFiltersFromParams(location);
    setAppliedFilters(queryFilters);
    setCurrentPage(queryFilters.page ?? 1);
  }, [location.search]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/events`,
          {
            params: {
              ...appliedFilters,
            },
          }
        );
        setEvents(response.data.events ?? []);
        setTotalPages(response.data.totalPages ?? 0);
      } catch (error) {
        setEvents([]);
        setError("Error fetching events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (!isEmpty(appliedFilters)) {
      fetchEvents();
    }
  }, [appliedFilters]);

  const handleFilterChange =
    (filterName: keyof typeof filters) =>
    (event: React.ChangeEvent<HTMLInputElement | { value: unknown }> | any) => {
      setFilters((prev) => ({
        ...prev,
        [filterName]: event?.target?.value || event,
      }));
    };

  const handleSelectChange =
    (filterName: keyof typeof filters) =>
    (event: SelectChangeEvent<string>) => {
      setFilters((prev) => ({ ...prev, [filterName]: event.target.value }));
    };

  const applyFilters = () => {
    setAppliedFilters({ ...filters, page: 1 });
    setCurrentPage(1);
    const searchParams = new URLSearchParams({ ...filters, page: 1 } as any);
    navigate({ search: searchParams.toString() });
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
    setAppliedFilters((prev) => ({ ...prev, page }));
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("page", page.toString());
    navigate({ search: searchParams.toString() });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ padding: "10px" }}>
      <IconButton onClick={handleDrawerToggle}>
        <CloseIcon />
      </IconButton>
      <Box>
        <DateRangePicker onChange={handleFilterChange("date")} />
        <TextField
          label="Filter by Max Price"
          type="number"
          value={filters?.price}
          onChange={handleFilterChange("price")}
          fullWidth
          sx={{ marginBottom: "10px" }}
        />
        <FormControl fullWidth sx={{ marginBottom: "10px" }}>
          <InputLabel id="hall-label">Filter by Hall</InputLabel>
          <Select
            labelId="hall-label"
            value={filters?.hall}
            onChange={handleSelectChange("hall")}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem value="Small Hall">Small Hall</MenuItem>
            <MenuItem value="Large Hall">Large Hall</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Filter by Max Seats Percentage"
          type="number"
          value={filters?.seatsPercentage}
          onChange={handleFilterChange("seatsPercentage")}
          fullWidth
        />
        <ApplyButton
          onClick={applyFilters}
          variant="contained"
          fullWidth
          sx={{ marginTop: "15px" }}
        >
          Apply Filters
        </ApplyButton>
      </Box>
    </Box>
  );

  if (loading) {
    return <LoadingMessage />;
  }

  if (error) {
    return (
      <StyledContainer>
        <Alert severity="error">{error}</Alert>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <Box padding={2}>
        <Box>
          {/* Drawer Toggle Button for Mobile */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: "none" }, marginBottom: "15px" }}
          >
            <FilterList />
          </IconButton>

          {/* Drawer for Filters on Mobile */}
          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
            }}
          >
            {drawer}
          </Drawer>

          {/* Sidebar for Filters on Desktop */}
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <FilterContainer container spacing={2}>
              <Box>
                <DateRangePicker onChange={handleFilterChange("date")} />
              </Box>
              <Box>
                <StyledTextField
                  label="Filter by Price"
                  type="number"
                  value={filters?.price}
                  onChange={handleFilterChange("price")}
                  fullWidth
                />
              </Box>
              <Box>
                <FormControl
                  sx={{
                    width: "200px",
                  }}
                >
                  <InputLabel id="hall-label">Filter by Hall</InputLabel>
                  <Select
                    labelId="hall-label"
                    value={filters?.hall}
                    onChange={handleSelectChange("hall")}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value="Small Hall">Small Hall</MenuItem>
                    <MenuItem value="Large Hall">Large Hall</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <StyledTextField
                  label="Filter by Seats Percentage"
                  type="number"
                  value={filters?.seatsPercentage}
                  onChange={handleFilterChange("seatsPercentage")}
                  fullWidth
                />
              </Box>
              <Box>
                <ApplyButton
                  onClick={applyFilters}
                  variant="contained"
                  fullWidth
                >
                  Apply Filters
                </ApplyButton>
              </Box>
            </FilterContainer>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          {events.length === 0 ? (
            <Typography variant="h5" textAlign="center">
              No events found
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {events.map((event: Event) => (
                <StyledCard key={event._id}>
                  <StyledImageContainer>
                    <ImageContainer poster={event.poster} />
                  </StyledImageContainer>
                  <CardContent
                    sx={(theme) => ({ color: theme.palette.common.white })}
                  >
                    <TruncatedTypography variant="h5">
                      {event.name}
                    </TruncatedTypography>
                    <Typography variant="body2" color="white">
                      {event.description}
                    </Typography>
                    <Typography variant="body2" color="white">
                      {new Date(event.date).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="white">
                      Hall: {event.hall}
                    </Typography>
                    <Typography variant="body2" color="white">
                      {event.tichetPrice} <em>RON</em>
                    </Typography>
                    <StyledButton
                      variant="contained"
                      fullWidth
                      onClick={() =>
                        (window.location.href = `/event/${event._id}`)
                      }
                    >
                      View Event
                    </StyledButton>
                  </CardContent>
                </StyledCard>
              ))}
            </Box>
          )}
          <StyledPagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
          />
        </Box>
      </Box>
    </StyledContainer>
  );
};
