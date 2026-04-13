import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnerById, getOwnerProperties } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DuenosDeleteButton } from "../delete-button";
import { Pencil, Phone, Mail, MapPin, Landmark, Building2 } from "lucide-react";
import { PROPERTY_STATUSES, PROPERTY_STATUS_COLORS, PROPERTY_TYPES, CONTRACT_STATUSES, CONTRACT_STATUS_COLORS } from "@/lib/types/enums";
import { DocumentUpload } from "@/components/ui/document-upload";
import { getDocuments } from "@/app/(app)/contratos/[id]/document-actions";
import type { PropertyStatus, PropertyType, ContractStatus, CurrencyType } from "@/lib/types/enums";
import { formatCurrency } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DuenoDetailPage({ params }: Props) {
  const { id } = await params;
  let owner;
  try {
    owner = await getOwnerById(id);
  } catch {
    notFound();
  }

  const [properties, documents] = await Promise.all([
    getOwnerProperties(id),
    getDocuments("owner", id),
  ]);
  const bankInfo = (owner.bank_info || {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={owner.full_name}
        description="Ficha del propietario"
        backHref="/duenos"
        action={
          <div className="flex gap-2">
            <Link href={`/duenos/${id}/editar`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <DuenosDeleteButton id={id} name={owner.full_name} redirectOnDelete="/duenos" />
          </div>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
        <Separator className="my-4" />
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">DNI / CUIT</dt>
            <dd className="mt-1 text-sm text-gray-900">{owner.dni_cuit || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Telefono</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              {owner.phone ? (
                <><Phone className="h-3.5 w-3.5 text-gray-400" /> {owner.phone}</>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              {owner.email ? (
                <><Mail className="h-3.5 w-3.5 text-gray-400" /> {owner.email}</>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Direccion</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
              {owner.address ? (
                <><MapPin className="h-3.5 w-3.5 text-gray-400" /> {owner.address}</>
              ) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {(bankInfo.banco || bankInfo.cbu || bankInfo.alias) && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Landmark className="h-5 w-5 text-gray-400" />
            Datos bancarios
          </h2>
          <Separator className="my-4" />
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Banco</dt>
              <dd className="mt-1 text-sm text-gray-900">{bankInfo.banco || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CBU</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{bankInfo.cbu || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Alias</dt>
              <dd className="mt-1 text-sm text-gray-900">{bankInfo.alias || "—"}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Propiedades del dueno */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Building2 className="h-5 w-5 text-gray-400" />
          Propiedades ({properties.length})
        </h2>
        <Separator className="my-4" />
        {properties.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">Sin propiedades registradas</p>
        ) : (
          <div className="space-y-3">
            {properties.map((prop) => {
              const contracts = (prop.contracts || []) as {
                id: string;
                tenant: { full_name: string } | { full_name: string }[] | null;
                current_rent: number;
                currency: string;
                status: string;
              }[];
              const activeContract = contracts.find((c) => c.status === "activo" || c.status === "por_vencer");

              return (
                <div key={prop.id} className="rounded-lg border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/propiedades/${prop.id}`} className="font-medium text-gray-900 hover:text-teal-600">
                        {prop.address}{prop.unit ? ` - ${prop.unit}` : ""}
                      </Link>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{PROPERTY_TYPES[prop.type as PropertyType]}</span>
                        {prop.city && <span>{prop.city}</span>}
                      </div>
                    </div>
                    <StatusBadge
                      label={PROPERTY_STATUSES[prop.status as PropertyStatus]}
                      colorClass={PROPERTY_STATUS_COLORS[prop.status as PropertyStatus]}
                    />
                  </div>

                  {activeContract && (() => {
                    const tenantData = activeContract.tenant;
                    const tenant = Array.isArray(tenantData) ? tenantData[0] : tenantData;
                    return (
                      <div className="mt-3 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Inquilino: </span>
                          <Link href={`/contratos/${activeContract.id}`} className="font-medium text-gray-700 hover:text-teal-600">
                            {tenant?.full_name ?? "—"}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(activeContract.current_rent, activeContract.currency as CurrencyType)}
                          </span>
                          <StatusBadge
                            label={CONTRACT_STATUSES[activeContract.status as ContractStatus]}
                            colorClass={CONTRACT_STATUS_COLORS[activeContract.status as ContractStatus]}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {!activeContract && contracts.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      {contracts.length} contrato{contracts.length > 1 ? "s" : ""} anterior{contracts.length > 1 ? "es" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DocumentUpload entityType="owner" entityId={id} documents={documents} />

      {owner.notes && (
        <div className="rounded-xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
          <Separator className="my-4" />
          <p className="whitespace-pre-wrap text-sm text-gray-600">{owner.notes}</p>
        </div>
      )}
    </div>
  );
}
