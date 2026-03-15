import client from "./client";
import type { ApiResponse, Appointment } from "../types";

export interface CreateOrderPayload {
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentPayload extends CreateOrderPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number;
  currency: string;
}

export const paymentApi = {
  createOrder: async (data: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await client.post<ApiResponse<CreateOrderResponse>>("/payments/create-order", data);
    return res.data.data;
  },

  verify: async (data: VerifyPaymentPayload): Promise<Appointment> => {
    const res = await client.post<ApiResponse<Appointment>>("/payments/verify", data);
    return res.data.data;
  },
};

