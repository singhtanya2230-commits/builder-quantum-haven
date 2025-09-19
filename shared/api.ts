/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type RepeatType = "once" | "daily";

export interface ReminderDTO {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // HH:mm 24h
  repeat: RepeatType;
  nextAt: number | null;
  paused: boolean;
  // Patient
  patientName?: string;
  patientAge?: number | null;
  phone?: string;
  sendSms?: boolean;
  createdAt: number;
  lastFiredAt?: number;
}

export interface SmsRequest {
  to: string;
  message: string;
}

export interface SmsResponse {
  success: boolean;
  id?: string;
  error?: string;
}
