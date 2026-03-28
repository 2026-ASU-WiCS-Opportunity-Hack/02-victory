"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/types";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

interface ClientListProps {
  clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => {
      const blob = `${c.first_name} ${c.last_name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [clients, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            aria-label="Search clients"
          />
        </div>
        <Link
          href="/clients/new"
          className={cn(buttonVariants(), "inline-flex shrink-0 gap-2")}
        >
          <UserPlus className="size-4" />
          New client
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Address</TableHead>
              <TableHead className="w-[100px] text-right">Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground md:hidden">
                      {c.phone ?? "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col text-sm">
                    <span>{c.phone ?? "—"}</span>
                    <span className="text-muted-foreground">{c.email ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[220px] truncate text-muted-foreground lg:table-cell">
                  {c.address ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/clients/${c.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No clients match your search.
          </p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {clients.length} records.
      </p>
    </div>
  );
}
