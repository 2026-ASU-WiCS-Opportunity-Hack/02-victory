"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  profile: { id: string; full_name: string; role: string; email: string } | null;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [pending, setPending] = useState(false);

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CM";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);

    const supabase = createClient();
    if (!supabase) {
      toast.error("Supabase not configured.");
      setPending(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not signed in.");
      setPending(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setPending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-16 border">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-heading text-xl">{profile?.full_name ?? "—"}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{email}</p>
              <Badge variant="secondary" className="capitalize">
                {profile?.role ?? "staff"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Account details</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Session</CardTitle>
          <CardDescription>Sign out of your account on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
