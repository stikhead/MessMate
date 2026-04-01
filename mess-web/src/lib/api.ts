/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { 
  AxiosError, 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosResponse 
} from "axios";
import Cookies from "js-cookie";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];


const processQueue = (error: any, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token) prom.resolve(token);
    }
  });
  failedQueue = [];
};

const API: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true,
});

API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

API.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `${token}`;
            }
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios
          .get(`${process.env.NEXT_PUBLIC_API_URL}/users/refreshAccessToken`, {
            withCredentials: true,
          })
          .then(({ data }) => {
            const newAccessToken = data.accessToken;
            Cookies.set("accessToken", newAccessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `${newAccessToken}`;
            }

            processQueue(null, newAccessToken);
            resolve(API(originalRequest));
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            Cookies.remove("accessToken");
            
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login?session=expired";
            }
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default API;