import { AppHeader } from "@/components/layout/app-header";
import { ClientList } from "@/components/clients/client-list";
import { getAllClients } from "@/lib/data/queries";

export default async function ClientsPage() {
  const clients = await getAllClients();
  return (
    <>
      <AppHeader
        title="Clients"
        description="Search and manage client records."
      />
      <div className="flex-1 px-6 py-8">
        <ClientList clients={clients} />
      </div>
    </>
  );
}
