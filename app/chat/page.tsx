import { AppShell } from "@/components/app-shell";
import { FullChat } from "@/components/chat/full-chat";

export const dynamic = "force-dynamic";

export default function ChatRoute() {
  return (
    <AppShell>
      <FullChat />
    </AppShell>
  );
}
