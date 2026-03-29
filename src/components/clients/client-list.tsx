"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ClientWithLastService } from "@/lib/data/queries";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface ClientListProps {
  clients: ClientWithLastService[];
}

export function ClientList({ clients }: ClientListProps) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c) => {
      const blob =
        `${c.first_name} ${c.last_name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
      return blob.includes(s);
    });
  }, [clients, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleSearch(value: string) {
    setQ(value);
    setPage(1); // reset to page 1 on new search
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone…"
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
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
              <TableHead className="hidden lg:table-cell">Last service</TableHead>
              <TableHead className="hidden lg:table-cell">Address</TableHead>
              <TableHead className="w-[100px] text-right">Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((c) => (
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
                <TableCell className="hidden lg:table-cell">
                  {c.last_service_type ? (
                    <Badge variant="secondary">{c.last_service_type}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
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

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {paginated.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {(currentPage - 1) * PAGE_SIZE + paginated.length} of {filtered.length} records.
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
