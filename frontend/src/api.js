import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  withCredentials: true, // send/receive the Flask session cookie
});

export const api = {
  me: () => client.get("/auth/me"),
  signup: (name, email, password) => client.post("/auth/signup", { name, email, password }),
  login: (email, password) => client.post("/auth/login", { email, password }),
  logout: () => client.post("/auth/logout"),

  history: () => client.get("/chat/history"),
  chat: (question) => client.post("/chat", { question }),
  clearChat: () => client.post("/chat/clear"),
  ingest: (files) => {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    return client.post("/ingest", form, { headers: { "Content-Type": "multipart/form-data" } });
  },

  googleLoginUrl: "/api/auth/google",
  facebookLoginUrl: "/api/auth/facebook",
};

export default api;
