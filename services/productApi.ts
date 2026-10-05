import api from "./api";

// categoryId: "" for all, "none" for uncategorized, or a category id
export async function getProducts(search = "", categoryId = "") {
  const response = await api.get("/products", {
    params: { search, categoryId: categoryId || undefined },
  });

  return response.data.data;
}

export async function createProduct(data: any) {
  const response = await api.post("/products", data);
  return response.data.data;
}

export async function updateProduct(id: string, data: any) {
  const response = await api.put(`/products/${id}`, data);
  return response.data.data;
}

export async function deleteProduct(id: string) {
  const response = await api.delete(`/products/${id}`);
  return response.data;
}
