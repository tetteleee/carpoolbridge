export type EventStatus = "回答中" | "配車中" | "確定" | "終了";

export interface Event {
  id: string;
  name: string;
  date: string; // "2026-07-12" 形式
  destinationName: string;
  status: EventStatus;
}

export interface Destination {
  id: string;
  name: string;
}
