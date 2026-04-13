import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantById, getTenantContracts } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InquilinosDeleteButton } from "../delete-button";
import { DocumentUpload } from "@/components/ui/document-upload";
import { getDocuments } from "@/app/(app)/contratos/[id]/document-actions";
import { Pencil, Phone, Mail, Shield, FileText } from "lucide-react";
import { CONTRACT_STATUSES, CONTRACT_STATUS_COLORS } from "@/lib/types/enums";
import type { ContractStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InquilinoDetailPage({ params }: Props) {
  const { id } = await params;
  let tenant;
  try { tenant = await getTenantById(id); } catch { notFound(); }

  const [contracts, documents] = await Promise.all([
    getTenantContracts(id),
    getDocuments("tenant", id),
  ]);
  const guarantors = (tenant.guarantors || []) as { full_name: string; dni: string; phone: string; address: string }[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={tenant.full_name}
        description="Ficha del inquilino"
        backHref="/inquilinos"
        action={
          <div className="flex gap-2">
            <Link href={`/inquilinos/${id}/editar`}><Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar</Button></Link>
            <InquilinosDeleteButton id={id} name={tenant.full_name} redirectOnDelete="/inquilinos" />
          </div>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
        <Separator className="my-4" />
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">DNI</dt>
            <dd className="mt-1 text-sm text-gray-900">{tenant.dni || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Telefono</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              {tenant.phone ? <><Phone className="h-3.5 w-3.5 text-gray-400" /> {tenant.phone}</> : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              {tenant.email ? <><Mail className="h-3.5 w-3.5 text-gray-400" /> {tenant.email}</> : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Contratos del inquilino */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileText className="h-5 w-5 text-gray-400" />
          Contratos ({contracts.length})
        </h2>
        <Separator className="my-4" />
        {contracts.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">Sin contratos registrados</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => {
              const propData = c.property;
              const prop = (Array.isArray(propData) ? propData[0] : propData) as { id: string; address: string; unit?: string; owner: { full_name: string } | { full_name: string }[] | null } | null;
              const ownerData = prop?.owner;
              const owner = Array.isArray(ownerData) ? ownerData[0] : ownerData;

              return (
                <Link key={c.id} href={`/contratos/${c.id}`} className="block rounded-lg border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {prop?.address}{prop?.unit ? ` - ${prop.unit}` : ""}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(c.start_date)} — {formatDate(c.end_date)}</span>
                        {owner && <span>Dueno: {owner.full_name}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(c.current_rent, c.currency as CurrencyType)}
                      </span>
                      <StatusBadge
                        label={CONTRACT_STATUSES[c.status as ContractStatus]}
                        colorClass={CONTRACT_STATUS_COLORS[c.status as ContractStatus]}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {guarantors.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Shield className="h-5 w-5 text-gray-400" /> Garantes ({guarantors.length})
          </h2>
          <Separator className="my-4" />
          <div className="space-y-3">
            {guarantors.map((g, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <p className="font-medium text-gray-900">{g.full_name}</p>
                <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                  {g.dni && <span>DNI: {g.dni}</span>}
                  {g.phone && <span>Tel: {g.phone}</span>}
                  {g.address && <span>Dir: {g.address}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DocumentUpload entityType="tenant" entityId={id} documents={documents} />

      {tenant.notes && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
          <Separator className="my-4" />
          <p className="whitespace-pre-wrap text-sm text-gray-600">{tenant.notes}</p>
        </div>
      )}
    </div>
  );
}
