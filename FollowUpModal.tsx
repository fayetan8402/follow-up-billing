
import React, { useMemo } from "react";

function toCurrency(n?: number, ccy = "MYR") {
  if (n === undefined || n === null || isNaN(Number(n))) return "";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy }).format(Number(n)); }
  catch { return `${ccy} ${Number(n).toFixed(2)}`; }
}

export default function FollowUpModal({ open, onClose, row }: any) {
  const emailBody = useMemo(() => {
    if (!row) return "";
    const lines: string[] = [];
    lines.push(`Subject: Follow-up on Unbilled Invoice(s) ${row.invoice_no}`);
    lines.push("");
    lines.push(`Dear ${row.contact || "Sir/Madam"},`);
    lines.push("");
    lines.push(`We would like to follow up on the unbilled delivery/service for the below reference. Kindly confirm the billing status so we can issue the invoice promptly.`);
    lines.push("");
    lines.push(`Customer: ${row.customer}`);
    lines.push(`Reference / Invoice No.: ${row.invoice_no}`);
    if (row.amount) lines.push(`Estimated Amount: ${toCurrency(row.amount, row.currency)}`);
    if (row.eta_date) lines.push(`ETA/POD Date: ${row.eta_date || "-"}`);
    lines.push("");
    lines.push("If there are any issues (POD, charges, address, or approvals), please let us know.");
    lines.push("Thank you.");
    lines.push("");
    lines.push("Best regards,");
    lines.push("— Your Name, KFS Shipping SDN BHD");
    return lines.join("\n");
  }, [row]);

  const waBody = useMemo(() => {
    if (!row) return "";
    const p: string[] = [];
    p.push(`Hi ${row.contact || "there"}, following up on unbilled invoice(s) ${row.invoice_no}.`);
    if (row.amount) p.push(`Est. ${toCurrency(row.amount, row.currency)}`);
    if (row.eta_date) p.push(`ETA/POD: ${row.eta_date}`);
    p.push("Can confirm billing status? Thanks.");
    return p.join(" \n");
  }, [row]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">Follow‑up Message</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-medium">Email draft</div>
            <textarea className="h-64 w-full rounded-2xl border p-2" defaultValue={emailBody} id="emailText" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">WhatsApp draft</div>
            <textarea className="h-64 w-full rounded-2xl border p-2" defaultValue={waBody} id="waText" />
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              const email = (document.getElementById("emailText") as HTMLTextAreaElement).value;
              const wa = (document.getElementById("waText") as HTMLTextAreaElement).value;
              navigator.clipboard.writeText(email + "\n\n---\n" + wa);
              alert("Copied email + WhatsApp text to clipboard.");
            }}
          >Copy Both</button>
        </div>
      </div>
    </div>
  );
}
