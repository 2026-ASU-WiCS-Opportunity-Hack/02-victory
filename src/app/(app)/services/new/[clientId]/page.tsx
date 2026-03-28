import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ServiceForm } from "@/components/services/service-form";
import { createClient } from "@/lib/supabase/server";
import { getClientById, demoServiceTypes } from "@/lib/data/demo";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function NewServicePage({ params }: PageProps) {
  const { clientId } = await params;

  const supabase = await createClient();
  let client;
  let serviceTypes: string[];

  if (supabase) {
    const [clientRes, typesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase.from("service_types").select("name").eq("is_active", true).order("name"),
    ]);
    client = clientRes.data;
    serviceTypes = typesRes.data?.map((t) => t.name) ?? demoServiceTypes;
  } else {
    client = getClientById(clientId);
    serviceTypes = demoServiceTypes;
  }

  if (!client) notFound();

  return (
    <>
      <AppHeader
        title="Log service"
        description="Manual entry plus voice capture — Groq Whisper + Llama structure your notes."
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
