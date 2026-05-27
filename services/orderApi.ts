import api from "./api";

export async function getOrders(date?: string) {
  const response = await api.get("/orders", {
    params: date ? { date } : {},
  });

  return response.data.data;
}

export async function createOrder(data: any) {
  const response = await api.post("/orders", data);
  return response.data.data;
}
