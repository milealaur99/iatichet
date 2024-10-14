import axios from "axios";

export const getCsrfToken = async () => {
  const response = await axios.get("http://localhost:5000/api/csrf-token");
  axios.defaults.headers.post["X-CSRF-Token"] = response.data.csrfToken;
  axios.defaults.headers.put["X-CSRF-Token"] = response.data.csrfToken;
  axios.defaults.headers.patch["X-CSRF-Token"] = response.data.csrfToken;
  axios.defaults.headers.delete["X-CSRF-Token"] = response.data.csrfToken;
};
