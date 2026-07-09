import type { Event } from "../types";
import { mockEvents } from "./events";

// モジュールスコープでイベント一覧を保持する（インメモリストア）
let events: Event[] = [...mockEvents];

export function getEvents(): Event[] {
  return events;
}

export function addEvent(event: Event): void {
  events = [...events, event];
}
