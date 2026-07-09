import type { Event } from "../types";
import { mockEvents } from "./events";

// モジュールスコープでイベント一覧を保持する（インメモリストア）
let events: Event[] = [...mockEvents];

export function getEvents(): Event[] {
  return events;
}

export function getEvent(id: string): Event | undefined {
  return events.find((e) => e.id === id);
}

export function addEvent(event: Event): void {
  events = [...events, event];
}
