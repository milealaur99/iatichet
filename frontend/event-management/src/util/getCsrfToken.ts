import axios from "axios";
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";
// rezolva doar jumate

export const getCsrfToken = async () => {
  const response = await axios.get(
    `${process.env.REACT_APP_BACKEND_URL}/api/csrf-token`
  );

  const csrfToken = response.data.csrfToken;

  // Use Axios interceptors to set CSRF token for all requests
  axios.interceptors.request.use((config) => {
    config.headers["X-CSRF-Token"] = csrfToken;
    return config;
  });
};
