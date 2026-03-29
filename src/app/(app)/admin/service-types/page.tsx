import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/lib/supabase/server";
import { ServiceTypesManager } from "@/components/admin/service-types-manager";

export default async function AdminServiceTypesPage() {
  const supabase = await createClient();
  let items: { id: string; name: string; is_active: boolean }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("service_types")
      .select("id, name, is_active")
      .order("name");
    items = (data ?? []) as typeof items;
  } else {
    items = [
      { id: "demo-1", name: "Housing navigation", is_active: true },
      { id: "demo-2", name: "Benefits enrollment", is_active: true },
      { id: "demo-3", name: "Employment coaching", is_active: true },
    ];
  }

  return (
    <>
      <AppHeader
        title="Service types"
        description="Manage labels used when logging visits. Inactive types stay on old records but are hidden from new visit forms."
      />
      <div className="flex-1 px-6 py-8">
        <ServiceTypesManager initialItems={items} />
      </div>
    </>
  );
}
