import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ServiceForm } from "@/components/services/service-form";
import { getClientById, getServiceTypes } from "@/lib/data/queries";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function NewServicePage({ params }: PageProps) {
  const { clientId } = await params;
  const client = await getClientById(clientId);
  if (!client) notFound();
  const serviceTypes = await getServiceTypes();

  return (
    <>
      <AppHeader
        title="Log service"
        description="Log a visit manually or use voice capture."
      />
      <div className="flex-1 px-6 py-8">
        <ServiceForm
          clientId={client.id}
          clientLabel={`${client.first_name} ${client.last_name}`}
          serviceTypes={serviceTypes}
        />
      </div>
    </>
  );
}
