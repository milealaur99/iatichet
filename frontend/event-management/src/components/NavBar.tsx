import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from "@mui/material";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MenuIcon from "@mui/icons-material/Menu";
import { RootState, clearUser, fetchUser } from "../util/userSlices";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupIcon from "@mui/icons-material/Group";
import logoImage from "../assets/default_transparent_765x625.png";

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const { username, role, isAdmin, isLoading, isError, errorMessage } =
    useSelector((state: RootState) => state.user);

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(fetchUser() as any);
    }
  }, [dispatch, localStorage.getItem("token")]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(clearUser());
  };

  return (
    <AppBar
      position="static"
      sx={(theme) => ({
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)"
      })}
    >
      <Toolbar>
        {username && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={(theme) => ({ mr: 2, color: theme.palette.secondary.main })}
            onClick={() => setOpen(!open)}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              width: 300,
              backgroundColor: (theme) => theme.palette.info.main,
              color: (theme) => theme.palette.common.white,
              padding: "10px"
            }
          }}
        >
          <Box sx={{ paddingBottom: "15px", textAlign: "center" }}>
            <Typography
              variant="h6"
              sx={(theme) => ({ color: theme.palette.primary.main })}
            >
              Menu
            </Typography>
          </Box>

          <List>
            {username && (
              <>
                {isAdmin && (
                  <ListItem
                    button
                    component={Link}
                    to="/create"
                    sx={(theme) => ({
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.common.white,
                        transform: "scale(1.02)"
                      },
                      transition: "transform 0.2s ease-in-out"
                    })}
                  >
                    <ListItemIcon>
                      <EventIcon
                        sx={(theme) => ({ color: theme.palette.common.white })}
                      />
                    </ListItemIcon>
                    <ListItemText primary="Create Event" />
                  </ListItem>
                )}

                <ListItem
                  button
                  component={Link}
                  to="/reservations"
                  sx={(theme) => ({
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.common.white,
                      transform: "scale(1.02)"
                    },
                    transition: "transform 0.2s ease-in-out"
                  })}
                >
                  <ListItemIcon>
                    <AssignmentIcon
                      sx={(theme) => ({ color: theme.palette.common.white })}
                    />
                  </ListItemIcon>
                  <ListItemText primary="My Reservations" />
                </ListItem>

                <Divider
                  sx={(theme) => ({
                    backgroundColor: theme.palette.primary.light,
                    margin: "10px 0"
                  })}
                />
              </>
            )}

            {isAdmin && (
              <ListItem
                button
                component={Link}
                to="/user-management"
                sx={(theme) => ({
                  "&:hover": {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.common.white,
                    transform: "scale(1.02)"
                  },
                  transition: "transform 0.2s ease-in-out"
                })}
              >
                <ListItemIcon>
                  <GroupIcon
                    sx={(theme) => ({ color: theme.palette.common.white })}
                  />
                </ListItemIcon>
                <ListItemText primary="Manage Users" />
              </ListItem>
            )}
          </List>

          <Box sx={{ paddingTop: "20px", textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={(theme) => ({ color: theme.palette.primary.light })}
            >
              &copy; 2024 IaTichet
            </Typography>
          </Box>
        </Drawer>

        <Typography
          variant="h5"
          component="div"
          sx={(theme) => ({
            flexGrow: 1,
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: 2,
            color: theme.palette.info.contrastText,
            "&:hover": {
              color: theme.palette.primary.light,
              transition: "color 0.3s"
            }
          })}
        >
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            <img src={logoImage} alt="logo" style={{ height: "30px" }} />
          </Link>
        </Typography>

        {username ? (
          <>
            {isLoading ? (
              <CircularProgress color="inherit" size={24} />
            ) : isError ? (
              <Alert severity="error" sx={{ mr: 2 }}>
                {errorMessage}
              </Alert>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                <Avatar
                  alt={username}
                  src="/static/images/avatar/1.jpg"
                  sx={{ mr: 1 }}
                />
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="body1"
                    sx={(theme) => ({ color: theme.palette.info.contrastText })}
                  >
                    {username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({ color: theme.palette.primary.main })}
                  >
                    {`Role: ${role}`}
                  </Typography>
                </Box>
              </Box>
            )}
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={(theme) => ({
                borderRadius: "20px",
                px: 3,
                py: 1,
                color: theme.palette.common.white,
                backgroundColor: theme.palette.secondary.main,
                "&:hover": {
                  backgroundColor: theme.palette.secondary.light
                }
              })}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              component={Link}
              to="/signup"
              sx={(theme) => ({
                borderRadius: "20px",
                px: 3,
                py: 1,
                color: theme.palette.common.white,
                backgroundColor: theme.palette.secondary.main,
                mr: 2,
                "&:hover": {
                  backgroundColor: theme.palette.secondary.light
                }
              })}
            >
              Sign Up
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/signin"
              sx={(theme) => ({
                borderRadius: "20px",
                px: 3,
                py: 1,
                color: theme.palette.common.white,
                backgroundColor: theme.palette.primary.light,
                "&:hover": {
                  backgroundColor: theme.palette.primary.main
                }
              })}
            >
              Sign In
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};
