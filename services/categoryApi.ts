import api from "./api";

export async function getCategories() {
  const response = await api.get("/categories");
  return response.data.data;
}

export async function createCategory(name: string) {
  const response = await api.post("/categories", { name });
  return response.data.data;
}

export async function updateCategory(id: string, name: string) {
  const response = await api.put(`/categories/${id}`, { name });
  return response.data.data;
}

export async function deleteCategory(id: string) {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
}
