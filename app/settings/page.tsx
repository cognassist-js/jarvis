import { AppShell } from "@/components/app-shell";
import { CalendarSettings } from "@/components/settings/calendar-settings";
import { getConnection } from "@/lib/services/calendar";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const connection = await getConnection();
  return (
    <AppShell>
      <CalendarSettings
        connection={
          connection
            ? {
                icsUrl: connection.icsUrl,
                lastSyncedAt: connection.lastSyncedAt,
                lastSyncStatus: connection.lastSyncStatus,
                syncWindowDays: connection.syncWindowDays,
              }
            : null
        }
      />
    </AppShell>
  );
}
