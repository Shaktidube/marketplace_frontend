import axios from "axios";
import { getItemFromLocalStorage } from "../utils/helper";

export const apiClient = async (options) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = getItemFromLocalStorage("userToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

   if (!options.public && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const client = axios.create({
    baseURL,
    headers,
  });

  try {
    const response = await client(options);
    return response;
  } catch (error) {
    console.error("API Client Error:",  error);
    throw error.response;
  }
};

