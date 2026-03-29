import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ClientProfile } from "@/components/clients/client-profile";
import { getRoleContext } from "@/lib/auth/admin";
import { getClientById } from "@/lib/data/queries";

export default async function ClientPortalPage() {
  const { isClient, clientId } = await getRoleContext();
  if (!isClient) {
    redirect("/dashboard");
  }

  if (!clientId) {
    return (
      <>
        <AppHeader title="Client portal" description="Your record" />
        <div className="flex-1 px-6 py-8">
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            This sign-in is not linked to a client record yet. Ask your organization to connect your account.
          </p>
        </div>
      </>
    );
  }

  const client = await getClientById(clientId);
  if (!client) {
    return (
      <>
        <AppHeader title="Client portal" description="Your record" />
        <div className="flex-1 px-6 py-8">
          <p className="text-sm text-muted-foreground">
            We could not load your record. If this continues, contact your organization.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={`${client.first_name} ${client.last_name}`}
        description="Your information and service history."
      />
      <div className="flex-1 px-6 py-8">
        <ClientProfile client={client} variant="portal" />
      </div>
    </>
  );
}
