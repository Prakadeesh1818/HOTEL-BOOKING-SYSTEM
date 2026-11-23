
import axios from "axios";


const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    Accept: "application/json",
  },
});


export const getHotels = (params = {}) => {
  return api.get("/hotels", { params });
};


export const getHotelById = (id) => {
  return api.get(`/hotels/${id}`);
};


export const createHotel = (formData) => {
  return api.post("/hotels", formData);
};


export const updateHotel = (id, formData) => {
  return api.put(`/hotels/${id}`, formData);
};


export const deleteHotel = (id) => {
  return api.delete(`/hotels/${id}`);
};

export default api;
