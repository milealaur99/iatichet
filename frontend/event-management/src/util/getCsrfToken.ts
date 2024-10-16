import axios from "axios";

export const getCsrfToken = async () => {
  const response = await axios.get(
    `${process.env.REACT_APP_BACKEND_URL}/api/csrf-token`
  );
  axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";
  axios.defaults.headers.post["X-CSRF-Token"] = response.data.csrfToken;
  axios.defaults.headers.put["X-CSRF-Token"] = response.data.csrfToken;
  axios.defaults.headers.patch["X-CSRF-Token"] = response.data.csrfToken;
  axios.defaults.headers.delete["X-CSRF-Token"] = response.data.csrfToken;
};
