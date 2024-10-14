import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { styled } from "@mui/system";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link } from "react-router-dom";
import { LoadingMessage } from "../components/LoadingMessage";
import { useSelector } from "react-redux";
import { RootState } from "../util/userSlices";

const StyledContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: theme.palette.info.main,
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
  maxWidth: "800px",
  margin: "auto",
  minHeight: "calc(100vh - 64px)"
}));

const UserCard = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: "20px",
  backgroundColor: theme.palette.primary.main,
  borderRadius: "8px",
  marginBottom: "15px",
  position: "relative",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  color: theme.palette.common.white
}));

const ReservationButton = styled(Button)(({ theme }) => ({
  textDecoration: "none",
  color: theme.palette.common.white,
  backgroundColor: theme.palette.secondary.main,
  "&:hover": {
    backgroundColor: theme.palette.success.light
  },
  padding: "6px 12px",
  borderRadius: "8px",
  fontWeight: "bold"
}));

const AdminInput = styled(TextField)(({ theme }) => ({
  margin: "20px 0",
  width: "100%",
  backgroundColor: theme.palette.info.main,
  borderRadius: "8px",
  "& .MuiInputBase-root": {
    color: theme.palette.primary.light
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.primary.light
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.info.dark,
  color: theme.palette.common.white
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  backgroundColor: theme.palette.info.dark,
  color: theme.palette.common.white
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  backgroundColor: theme.palette.info.dark
}));

const StyledCancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.success.light
  }
}));

const StyledConfirmButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  "&:hover": {
    backgroundColor: theme.palette.primary.main
  }
}));

export const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<null | {
    _id: string;
    username: string;
    role: string;
    email: string;
  }>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "role-change">(
    "delete"
  );
  const queryClient = useQueryClient();
  const reduxData = useSelector((state: RootState) => state.user);
  const isAdmin = reduxData.isAdmin;

  const { data, isLoading, isError } = useQuery<
    {
      _id: string;
      username: string;
      email: string;
      role: string;
    }[]
  >(
    ["user", searchTerm],
    async () => {
      const response = await axios.get(
        `http://localhost:5000/api/admin/find-users/${searchTerm}`
      );
      return response.data;
    },
    {
      enabled: searchTerm.length > 0
    }
  );

  const users = data ?? [];

  const manageRole = useMutation(
    async ({ userId, role }: { userId: string; role: string }) => {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}`, {
        role
      });
    },
    {
      onSuccess: () => queryClient.invalidateQueries("user")
    }
  );

  const deleteUser = useMutation(
    async (userId: string) => {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`);
    },
    {
      onSuccess: () => queryClient.invalidateQueries("user")
    }
  );

  const handleSearch = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSearchTerm((e.target as HTMLInputElement).value);
    }
  };

  const handleOpenDialog = (
    user: {
      _id: string;
      username: string;
      role: string;
      email: string;
    },
    action: "delete" | "role-change"
  ) => {
    setSelectedUser(user);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const confirmAction = () => {
    if (selectedUser && actionType === "delete") {
      deleteUser.mutate(selectedUser._id);
    } else if (selectedUser && actionType === "role-change") {
      manageRole.mutate({
        userId: selectedUser._id,
        role: selectedUser.role === "user" ? "admin" : "user"
      });
    }
    handleCloseDialog();
  };

  if (isLoading) {
    return (
      <StyledContainer>
        <LoadingMessage />
      </StyledContainer>
    );
  }

  if (isError) {
    return (
      <StyledContainer>
        <Typography
          variant="h6"
          sx={(theme) => ({ color: theme.palette.primary.light })}
        >
          Error loading users. Please try again later.
        </Typography>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      {isAdmin && (
        <AdminInput
          label="Search Users"
          variant="outlined"
          onKeyDown={handleSearch}
          placeholder="Search by email or username"
        />
      )}
      {users && users.length > 0 ? (
        <>
          {users.map((user) => (
            <UserCard key={user._id}>
              <Typography variant="h6">{user.username}</Typography>
              <Typography variant="body2">Email: {user.email}</Typography>
              <Typography variant="body2">Role: {user.role}</Typography>
              <Box
                mt={2}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Link
                    to={`/reservations/?userId=${user._id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <ReservationButton>View Reservations</ReservationButton>
                  </Link>
                </Box>
                <Box display="flex" alignItems="center">
                  <Button
                    variant="contained"
                    sx={(theme) => ({
                      backgroundColor: theme.palette.secondary.main,
                      "&:hover": {
                        backgroundColor: theme.palette.success.light
                      },
                      color: theme.palette.common.white
                    })}
                    onClick={() => handleOpenDialog(user, "role-change")}
                  >
                    {user.role === "user" ? "Make Admin" : "Revoke Admin"}
                  </Button>
                  <IconButton
                    onClick={() => handleOpenDialog(user, "delete")}
                    sx={(theme) => ({ color: theme.palette.info.dark })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </UserCard>
          ))}
        </>
      ) : (
        <Typography
          variant="h6"
          sx={(theme) => ({ color: theme.palette.primary.light })}
        >
          No users found.
        </Typography>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <StyledDialogTitle>Are you sure?</StyledDialogTitle>
        <StyledDialogContent>
          <Typography>
            {actionType === "delete"
              ? `Are you sure you want to delete user ${selectedUser?.username}?`
              : `Are you sure you want to change the role of ${selectedUser?.username}?`}
          </Typography>
        </StyledDialogContent>
        <StyledDialogActions>
          <StyledCancelButton onClick={handleCloseDialog}>
            Cancel
          </StyledCancelButton>
          <StyledConfirmButton onClick={confirmAction}>
            Confirm
          </StyledConfirmButton>
        </StyledDialogActions>
      </Dialog>
    </StyledContainer>
  );
};
