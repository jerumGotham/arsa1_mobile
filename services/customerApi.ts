import api from "./api";

export async function getCustomers(search = "") {
  const response = await api.get("/customers", {
    params: { search },
  });

  return response.data.data;
}

export async function getCustomerById(id: string) {
  const response = await api.get(`/customers/${id}`);
  return response.data.data;
}

export async function createCustomer(data: any) {
  const response = await api.post("/customers", data);
  return response.data.data;
}

export async function updateCustomer(id: string, data: any) {
  const response = await api.put(`/customers/${id}`, data);
  return response.data.data;
}

export async function deleteCustomer(id: string) {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
}
