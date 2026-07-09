import type { Family, Child } from "../types";

export const mockFamilies: Family[] = [
  { id: "f1", name: "山田", vehicleCapacity: 5 },
  { id: "f2", name: "佐藤", vehicleCapacity: 4 },
  { id: "f3", name: "鈴木", vehicleCapacity: 0 }, // 車出し不可家庭
];

export const mockChildren: Child[] = [
  { id: "c1", familyId: "f1", name: "太郎", grade: "小6", pickupLocationId: "p1" },
  { id: "c2", familyId: "f1", name: "花", grade: "小3", pickupLocationId: "p1" },
  { id: "c3", familyId: "f2", name: "花子", grade: "小4", pickupLocationId: "p2" },
  { id: "c4", familyId: "f3", name: "一郎", grade: "小5", pickupLocationId: "p2" },
];
