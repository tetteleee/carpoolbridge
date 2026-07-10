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

export interface Family {
  id: string;
  name: string;
  vehicleCapacity: number;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  grade: string;
  pickupLocationId: string | null;
}

export interface ChildResponse {
  childId: string;
  participationStatus: "未定" | "参加" | "欠席";
  noOutwardRide: boolean;
  noReturnRide: boolean;
  remarks: string;
}

export interface Response {
  familyId: string;
  status: "未回答" | "回答済み";
  driverOutward: boolean;
  driverReturn: boolean;
  capacityToday: number | null;
  remarks: string;
  children: ChildResponse[];
}
