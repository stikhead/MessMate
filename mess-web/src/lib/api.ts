import axios from "axios";
import Cookies from "js-cookie";

const API = axios.create({
  baseURL: "process.env.NEXT_PUBLIC_API_URL",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": true
  },
});

API.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) =>{
    const orignalReq = error.config;
  if(error?.response?.status === 401 && !orignalReq._retry){
    orignalReq._retry = true;
    try {
       const res = await API.get("/users/refreshAccessToken");
       const newAccessToken = res?.data.accessToken;

       Cookies.set('accessToken', newAccessToken);
       API.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
       
       orignalReq.headers['Authorization'] =  `Bearer ${newAccessToken}`

       return API(orignalReq);

    } catch (error) {
      
      Cookies.remove("accessToken");
      window.location.href = "/auth/login";
    
      return Promise.reject(error);
    }
  }
  return Promise.reject(error);
   
  }
);

export default API;