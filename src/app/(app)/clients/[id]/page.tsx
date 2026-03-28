import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ClientProfile } from "@/components/clients/client-profile";
import { createClient } from "@/lib/supabase/server";
import { getClientById } from "@/lib/data/demo";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  let client;

  if (supabase) {
    const { data } = await supabase.from("clients").select("*").eq("id", id).single();
    client = data;
  } else {
    client = getClientById(id);
  }

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
