"use server";
import { revalidatePath } from "next/cache";
import * as calendarService from "@/lib/services/calendar";
import { calendarConnectionSchema } from "@/lib/schemas";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/projects");
  revalidatePath("/settings");
}

export async function connectCalendarAction(input: unknown) {
  const parsed = calendarConnectionSchema.parse(input);
  await calendarService.saveConnection(parsed);
  const summary = await calendarService.syncCalendar();
  revalidateAll();
  return summary;
}

export async function syncCalendarAction() {
  const summary = await calendarService.syncCalendar();
  revalidateAll();
  return summary;
}

export async function disconnectCalendarAction() {
  await calendarService.disconnect();
  revalidateAll();
}
