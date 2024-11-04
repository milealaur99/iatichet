import React, { useEffect } from "react";
import { Navbar } from "./components/NavBar";
import { Home } from "./pages/Home";
import { CreateEvent } from "./pages/CreateEvent";
import { SignUp } from "./pages/SingUp";
import { SignIn } from "./pages/SignIn";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import EventPage from "./pages/EventPage";
import { QueryClient, QueryClientProvider } from "react-query";
import { SuccessPage } from "./pages/SuccessPayment";
import { UserReservations } from "./pages/UserReservations";
import { ReservationPage } from "./pages/ReservationPage";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import { UserManagement } from "./pages/UserManagement";
import { RootState } from "./util/userSlices";
import { useSelector } from "react-redux";
import { CancelPage } from "./pages/CancelPayment";
import { ErrorBoundary } from "react-error-boundary";
import Fallback from "./components/FallbackComponent";
import { NotFoundPage } from "./pages/NotFound";
import { getCsrfToken } from "./util/getCsrfToken";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#6A9FB0",
      light: "#78B7D0",
      contrastText: "#37474F"
    },
    info: {
      main: "#C0DFE3",
      light: "#F0F4F8",
      dark: "#A3C9D6",
      contrastText: "#37474F"
    },
    success: {
      main: "#4CAF50",
      light: "#18EDC2",
      contrastText: "#5A6F78"
    },
    secondary: {
      main: "#4B9D8B",
      light: "#81C784",
      contrastText: "#686D76"
    },
    error: {
      main: "#FF6B6B",
      contrastText: "#FFA726"
    }
  }
});

const LayoutComponent = () => {
  useEffect(() => {
    getCsrfToken();
  }, []);
  return (
    <div>
      <Navbar />
      <Box
        component="main"
        sx={(theme) => ({
          backgroundColor: "#F5F5F5",
          padding: theme.spacing(2, 0)
        })}
      >
        <ErrorBoundary fallbackRender={Fallback}>
          <Outlet />
        </ErrorBoundary>
      </Box>
    </div>
  );
};
const queryClient = new QueryClient();

const createRouter = ({
  isAdmin,
  isAuth
}: {
  isAdmin: boolean;
  isAuth: boolean;
}) =>
  createBrowserRouter([
    {
      path: "/",
      element: <LayoutComponent />,
      children: [
        {
          index: true,
          element: <Home />
        },
        ...(isAuth
          ? [
              {
                path: "success/:id",
                element: <SuccessPage />
              },
              {
                path: "cancel/:id",
                element: <CancelPage />
              },
              {
                path: "reservations",
                element: <UserReservations />
              }
            ]
          : [
              {
                path: "signup",
                element: <SignUp />
              },
              {
                path: "signin",
                element: <SignIn />
              }
            ]),
        {
          path: "event/:eventId",
          element: <EventPage />
        },
        ...(isAdmin
          ? [
              {
                path: "reservations/:reservationId",
                element: <ReservationPage />
              },
              {
                path: "create",
                element: <CreateEvent />
              },
              {
                path: "user-management",
                element: <UserManagement />
              }
            ]
          : []),
        {
          path: "*",
          element: <NotFoundPage />
        }
      ]
    }
  ]);

function App() {
  const reduxData = useSelector((state: RootState) => state.user);
  const isAdmin = reduxData.isAdmin;
  const isAuth = Boolean(
    localStorage.getItem("token") && reduxData.username.length > 0
  );
  const [router, setRouter] = React.useState(createRouter({ isAdmin, isAuth }));
  useEffect(() => {
    setRouter(createRouter({ isAdmin, isAuth }));
  }, [localStorage.getItem("token"), isAdmin, isAuth]);

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
