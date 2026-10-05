import api from "./api";

export type OrderFilters = {
  date?: string; // YYYY-MM-DD
  from?: string; // YYYY-MM-DD (use with `to`)
  to?: string;
  agentId?: string; // admins only
};

// Agents only ever get their own orders back (enforced by the API).
export async function getOrders(filters: string | OrderFilters = {}) {
  const params = typeof filters === "string" ? { date: filters } : filters;

  const response = await api.get("/orders", {
    params: Object.fromEntries(
      Object.entries(params).filter(([, value]) => value),
    ),
  });

  return response.data.data;
}

export async function createOrder(data: any) {
  const response = await api.post("/orders", data);
  return response.data.data;
}
