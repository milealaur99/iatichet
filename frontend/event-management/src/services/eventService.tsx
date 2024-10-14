import axios from "axios";

export const getEvents = async () => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/events`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const createEvent = async (eventData: FormData) => {
  try {
    const token = localStorage.getItem("token");
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    };
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/events/create`,
      eventData,
      options
    );
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const searchEvents = async (search: string) => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/events`,
      {
        params: { search }
      }
    );
    return response.data.events;
  } catch (error) {
    console.error("Error searching events:", error);
    throw error;
  }
};
