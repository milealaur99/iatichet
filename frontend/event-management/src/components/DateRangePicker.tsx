import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  SelectChangeEvent,
  TextField,
  TextFieldProps
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import dayjs, { Dayjs } from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";

export const DateRangePicker: React.FC<{
  onChange: (data: string) => void;
}> = ({ onChange }) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(10, "day"));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const [startDateFromUrl, endDateFromUrl] =
      searchParams.get("date")?.split("|") || [];
    if (startDateFromUrl && endDateFromUrl) return;

    searchParams.set("date", startDate + "|" + endDate);
    navigate({ search: searchParams.toString() });
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const [startDate, endDate] = searchParams.get("date")?.split("|") || [];

    if (startDate && endDate) {
      setStartDate(dayjs(new Date(+startDate)));
      setEndDate(dayjs(new Date(+endDate)));
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setEndDate(startDate);
    }
    if (startDate && endDate) {
      onChange(startDate + "|" + endDate);
    }
  }, [endDate, startDate]);

  const handleStartDateChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setStartDate(newValue);
    }
  };

  const handleEndDateChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setEndDate(newValue);
    }
  };

  const incrementDate = (
    date: Dayjs | null,
    setDate: React.Dispatch<React.SetStateAction<Dayjs | null>>
  ) => {
    setDate(date ? date.add(1, "day") : dayjs());
  };

  const decrementDate = (
    date: Dayjs | null,
    setDate: React.Dispatch<React.SetStateAction<Dayjs | null>>
  ) => {
    setDate(date ? date.subtract(1, "day") : dayjs());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        flexDirection={{
          xs: "column",
          sm: "row"
        }}
        mb={{
          xs: 2,
          sm: 0
        }}
      >
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => decrementDate(startDate, setStartDate)}
            size="small"
            sx={{ padding: 0, marginRight: 0.5 }}
          >
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            renderInput={(params: TextFieldProps) => (
              <TextField {...params} size="small" />
            )}
            {...({} as any)}
          />
          <IconButton
            onClick={() => incrementDate(startDate, setStartDate)}
            size="small"
            sx={{ padding: 0, marginLeft: 0.5 }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => decrementDate(endDate, setEndDate)}
            size="small"
            sx={{ padding: 0, marginRight: 0.5 }}
            disabled={!startDate || endDate?.isSame(startDate, "day")}
          >
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
          <DatePicker
            label="End Date"
            value={endDate}
            minDate={startDate || undefined}
            onChange={handleEndDateChange}
            renderInput={(params: TextFieldProps) => (
              <TextField {...params} size="small" />
            )}
            {...({} as any)}
          />
          <IconButton
            onClick={() => incrementDate(endDate, setEndDate)}
            size="small"
            sx={{ padding: 0, marginLeft: 0.5 }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
