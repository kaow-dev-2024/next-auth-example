import axios from "axios";

export const BASE_API =
  process.env.NEXT_PUBLIC_BASE_API || "http://localhost:5001/api/v1";

const apiClient = axios.create({
  baseURL: BASE_API,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
