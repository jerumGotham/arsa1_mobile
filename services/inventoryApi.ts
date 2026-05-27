import api from "./api";

export async function getInventory(search = "") {
  const response = await api.get("/inventory", {
    params: { search },
  });

  return response.data.data;
}
