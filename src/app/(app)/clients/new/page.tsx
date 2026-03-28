import { AppHeader } from "@/components/layout/app-header";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <>
      <AppHeader
        title="Register a client"
        description="Register a new client."
      />
      <div className="flex-1 px-6 py-8">
        <ClientForm />
      </div>
    </>
  );
}
