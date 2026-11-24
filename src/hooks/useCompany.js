import { useCompanyContext } from "../context/CompanyContext";

export function useCompany() {
  return useCompanyContext();
}

export default useCompany;
