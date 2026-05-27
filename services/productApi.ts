import api from "./api";

export async function getProducts(search = "") {
  const response = await api.get("/products", {
    params: { search },
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
