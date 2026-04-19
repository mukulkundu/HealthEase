import client from "./client";
import type { ApiResponse, HospitalAppointment } from "../types";

export interface HospitalOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  hospitalId: string;
  consultationFee: number;
}

export const hospitalPaymentApi = {
  createOrder: async (data: {
    doctorId: string;
    departmentId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<HospitalOrderResponse> => {
    const res = await client.post<ApiResponse<HospitalOrderResponse>>("/hospital-payments/order", data);
    return res.data.data;
  },

  verifyPayment: async (data: {
    doctorId: string;
    departmentId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    currency: string;
  }): Promise<HospitalAppointment> => {
    const res = await client.post<ApiResponse<HospitalAppointment>>("/hospital-payments/verify", data);
    return res.data.data;
  },
};
