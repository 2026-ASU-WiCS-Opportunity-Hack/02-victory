import { AppHeader } from "@/components/layout/app-header";
import { ClientList } from "@/components/clients/client-list";
import { createClient } from "@/lib/supabase/server";
import { demoClients } from "@/lib/data/demo";
import type { Client } from "@/types";

export default async function ClientsPage() {
  const supabase = await createClient();
  let clients: Client[];

  if (supabase) {
    const { data } = await supabase.from("clients").select("*").order("last_name");
    clients = (data ?? []) as Client[];
  } else {
    clients = demoClients;
  }

  return (
    <>
      <AppHeader
        title="Clients"
        description="Search and open client records."
      />
      <div className="flex-1 px-6 py-8">
        <ClientList clients={clients} />
      </div>
    </>
  );
}
