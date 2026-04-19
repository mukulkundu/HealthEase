import client from "./client";
import type { ApiResponse, Department, DepartmentDoctor } from "../types";

export const departmentApi = {
  listForHospital: async (hospitalId: string): Promise<Department[]> => {
    const res = await client.get<ApiResponse<Department[]>>(`/departments/hospital/${hospitalId}`);
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  getMyDepartments: async (): Promise<DepartmentDoctor[]> => {
    const res = await client.get<ApiResponse<DepartmentDoctor[]>>("/departments/my");
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  create: async (name: string): Promise<Department> => {
    const res = await client.post<ApiResponse<Department>>("/departments", { name });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/departments/${id}`);
  },

  addDoctor: async (departmentId: string, doctorId: string, consultationFee: number): Promise<DepartmentDoctor> => {
    const res = await client.post<ApiResponse<DepartmentDoctor>>(
      `/departments/${departmentId}/doctors`,
      { doctorId, consultationFee }
    );
    return res.data.data;
  },

  removeDoctor: async (departmentId: string, doctorId: string): Promise<void> => {
    await client.delete(`/departments/${departmentId}/doctors/${doctorId}`);
  },
};
