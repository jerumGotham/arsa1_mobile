import api from "./api";

export type Role = "ADMIN" | "AGENT";

export type User = {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
};

export async function login(username: string, password: string) {
  const response = await api.post("/auth/login", { username, password });
  return response.data.data as { token: string; user: User };
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data.data as User;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const response = await api.put("/auth/me/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
}
