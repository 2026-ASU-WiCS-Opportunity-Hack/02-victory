import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ClientProfile } from "@/components/clients/client-profile";
import { getClientById } from "@/lib/data/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <>
      <AppHeader
        title={`${client.first_name} ${client.last_name}`}
        description="Profile, demographics, and service history."
      />
      <div className="flex-1 px-6 py-8">
        <ClientProfile client={client} />
      </div>
    </>
  );
}
