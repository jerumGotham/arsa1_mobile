import api from "./api";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data.data;
}

export async function createUser(data: any) {
  const response = await api.post("/users", data);
  return response.data.data;
}

export async function updateUser(id: string, data: any) {
  const response = await api.put(`/users/${id}`, data);
  return response.data.data;
}
