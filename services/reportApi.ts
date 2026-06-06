import { API_BASE_URL } from "./api";

export function getExcelReportUrl(date?: string) {
  const query = date ? `?date=${date}` : "";
  return `${API_BASE_URL}/reports/orders/excel${query}`;
}
