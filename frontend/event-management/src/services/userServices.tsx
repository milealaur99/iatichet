import axios from "axios";

export const signUp = async (userData: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await axios.post(
    `${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`,
    userData
  );
  return response.data;
};

export const signIn = async (userData: {
  username: string;
  password: string;
}) => {
  const response = await axios.post(
    `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
    userData
  );
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("userId", response.data.userId);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};