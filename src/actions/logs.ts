"use server";

import { LogsService } from "@/lib/client";

export async function getLogs(
  limit: number = 50,
  offset: number = 0,
  level?: string,
  module?: string
) {
  return LogsService.getLogsLogsGet(limit, offset, level || undefined, module || undefined);
}
