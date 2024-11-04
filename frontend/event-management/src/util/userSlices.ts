import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import { signIn } from "../services/userServices";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

interface UserState {
  username: string;
  role: string;
  isAdmin: boolean;
  email: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
}

const initialState: UserState = {
  username: "",
  role: "user",
  isAdmin: false,
  email: "",
  isLoading: false,
  isError: false,
  errorMessage: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.isAdmin = action.payload.role === "admin";
      state.email = action.payload.email;
    },
    clearUser: (state) => {
      state.username = "";
      state.role = "";
      state.isAdmin = false;
      state.email = "";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state: UserState) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(
        fetchUser.fulfilled,
        (state: UserState, action: PayloadAction<UserState>) => {
          state.isLoading = false;
          state.username = action.payload.username;
          state.email = action.payload.email;
          state.role = action.payload.role;
          state.isAdmin = action.payload.role === "admin";
        }
      )
      .addCase(
        fetchUser.rejected,
        (
          state: {
            isLoading: boolean;
            isError: boolean;
            errorMessage: null | string;
          },
          action
        ) => {
          state.isLoading = false;
          state.isError = true;
          state.errorMessage = action.payload as string;
        }
      )
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isError = false;
        state.errorMessage = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload as string;
      });
  }
});

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await signIn(credentials);
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data || "Failed to sign in");
    }
  }
);

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/user-info`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const { setUser, clearUser } = userSlice.actions;

export const store = configureStore({
  reducer: {
    user: userSlice.reducer
  }
});
