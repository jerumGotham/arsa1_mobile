import { API_BASE_URL } from "./api";

export function getExcelReportUrl() {
  return `${API_BASE_URL}/reports/orders/excel`;
}
