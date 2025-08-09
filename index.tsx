
import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";
import IGHeader from "@/components/IGHeader";
import FollowUpModal from "@/components/FollowUpModal";
import { Plus, Upload, Download, Pencil, Trash2, CheckCircle, MessageSquare } from "lucide-react";

type Row = {
  id?: string;
  customer: string;
  invoice_no: string;
  amount?: number;
  currency?: string;
  eta_date?: string;
  pod_date?: string;
  contact?: string;
  contact_email?: string;
  contact_phone?: string;
  collect_do?: number;
  extra_seal_qty?: number;
  notes?: string;
  status?: string;
  last_fu?: string;
  next_fu?: string;
  user_id?: string;
  group_id?: string | null;
  created_at?: string;
};

function toCurrency(n?: number, ccy = "MYR") {
  if (n === undefined || n === null || isNaN(Number(n))) return "";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy }).format(Number(n)); }
  catch { return `${ccy} ${Number(n).toFixed(2)}`; }
}

function todayStr(){
  const d = new Date(); return d.toISOString().slice(0,10);
}

function daysBetween(a: string, b: string){
  const da = new Date(a + "T00:00:00"); const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime()-da.getTime())/86400000);
}

export default function Home() {
  
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({customer:"", invoice_no:"", currency:"MYR", status:"Unbilled"});
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("Unbilled");
  const [search, setSearch] = useState(""); 
  const [sort, setSort] = useState<{key: keyof Row, dir: "asc"|"desc"}>({key:"eta_date", dir:"asc"});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<Row | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!session) { window.location.href = "/login"; return; }
      setUserEmail(session.user.email ?? undefined);
      await loadData();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login"; else setUserEmail(data.session.user.email ?? undefined);
      if (data.session) loadData();
    });
    return () => { sub.subscription.unsubscribe(); }
  }, []);

  async function loadData(){
    const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (error) alert(error.message); else setRows(data as Row[]);
  }

  function computeNextFollowUp(r: Row){
    const src = r.last_fu || r.pod_date || r.eta_date || todayStr();
    const d = new Date((src || todayStr()) + "T00:00:00"); d.setDate(d.getDate()+7);
    return d.toISOString().slice(0,10);
  }

  async function save(){
    const clean: Row = { ...draft, group_id: 'kfs001', amount: draft.amount ? Number(draft.amount) : undefined, next_fu: draft.next_fu || computeNextFollowUp(draft) };
    if (editId){
      const { error } = await supabase.from("invoices").update(clean).eq("id", editId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from("invoices").insert(clean);
      if (error) alert(error.message);
    }
    setDraft({customer:"", invoice_no:"", currency:"MYR", status:"Unbilled"}); setEditId(null); await loadData();
  }

  async function markBilled(id: string){
    const { error } = await supabase.from("invoices").update({ status: "Billed" }).eq("id", id);
    if (error) alert(error.message); else loadData();
  }
  async function remove(id: string){
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) alert(error.message); else loadData();
  }

  function exportCSV(){
    const headers = ["customer","invoice_no","amount","currency","eta_date","pod_date","contact","contact_email","contact_phone","collect_do","extra_seal_qty","notes","status","last_fu","next_fu"];
    const lines = [headers.join(",")];
    rows.forEach(r => lines.push(headers.map(h => (r as any)[h] ?? "").toString().replace(/,/g, ";").replace(/\n/g, " ")).join(","));
    const blob = new Blob([lines.join("\n")], {type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `unbilled_${todayStr()}.csv`; a.click();
  }
  function importCSV(file: File){
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = String(e.target?.result || ""); const rows = text.replace(/\r/g,"").split("\n").filter(Boolean);
      const headers = rows.shift()?.split(",").map(s=>s.trim()) || [];
      const toObj = (line:string) => {
        const cols = line.split(","); const o:any = {}; headers.forEach((h,i)=> o[h]= (cols[i]||"").trim()); return o;
      };
      const records = rows.map(toObj);
      if (!records.length) return alert("No rows found.");
      const { error } = await supabase.from("invoices").insert(records as any);
      if (error) alert(error.message); else loadData();
    };
    reader.readAsText(file);
  }

  const shown = useMemo(()=>{
    let out = [...rows];
    if (filter!=="All") out = out.filter(r => r.status===filter || (filter==="Overdue" && r.status==="Unbilled" && r.next_fu && daysBetween(r.next_fu, todayStr())>0));
    if (search){
      const s = search.toLowerCase();
      out = out.filter(r => [r.customer, r.invoice_no, r.contact, r.notes].some(x => (x||"").toLowerCase().includes(s)));
    }
    out.sort((a:any,b:any)=>{
      const av = (a[sort.key] || "").toString(); const bv = (b[sort.key] || "").toString();
      return sort.dir==="asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return out;
  }, [rows, filter, search, sort]);

  return (
    <div>
      <Head><title>Follow Up Billing</title><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
      <IGHeader userEmail={userEmail} onLogout={async()=>{ await supabase.auth.signOut(); window.location.href="/login"; }} />
      <div className="mx-auto max-w-6xl p-3">
        {/* Add/Edit */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{editId?"Edit Record":"Add New Record"}</h2>
            <button className="btn" onClick={()=>{ setDraft({customer:"", invoice_no:"", currency:"MYR", status:"Unbilled"}); setEditId(null); }}>Clear</button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input className="rounded-2xl border p-2" placeholder="Customer" value={draft.customer||""} onChange={e=>setDraft({...draft, customer:e.target.value})}/>
            <input className="rounded-2xl border p-2" placeholder="Invoice No. / Ref" value={draft.invoice_no||""} onChange={e=>setDraft({...draft, invoice_no:e.target.value})}/>
            <input className="rounded-2xl border p-2" type="number" step="0.01" placeholder="Amount" value={draft.amount as any || ""} onChange={e=>setDraft({...draft, amount: Number(e.target.value)})}/>
            <input className="rounded-2xl border p-2" placeholder="Currency" value={draft.currency||"MYR"} onChange={e=>setDraft({...draft, currency:e.target.value.toUpperCase()})}/>

            <input className="rounded-2xl border p-2" type="date" placeholder="ETA" value={draft.eta_date||""} onChange={e=>setDraft({...draft, eta_date:e.target.value})}/>
            <input className="rounded-2xl border p-2" type="date" placeholder="POD" value={draft.pod_date||""} onChange={e=>setDraft({...draft, pod_date:e.target.value})}/>
            <input className="rounded-2xl border p-2" placeholder="Contact Person" value={draft.contact||""} onChange={e=>setDraft({...draft, contact:e.target.value})}/>
            <input className="rounded-2xl border p-2" type="email" placeholder="Email" value={draft.contact_email||""} onChange={e=>setDraft({...draft, contact_email:e.target.value})}/>

            <input className="rounded-2xl border p-2" placeholder="Phone / WhatsApp" value={draft.contact_phone||""} onChange={e=>setDraft({...draft, contact_phone:e.target.value})}/>
            <input className="rounded-2xl border p-2" placeholder="Collect D/O Fee (MYR)" type="number" step="0.01" value={draft.collect_do as any || ""} onChange={e=>setDraft({...draft, collect_do: Number(e.target.value)})}/>
            <input className="rounded-2xl border p-2" placeholder="Extra Seal Qty" type="number" value={draft.extra_seal_qty as any || ""} onChange={e=>setDraft({...draft, extra_seal_qty: Number(e.target.value)})}/>
            <select className="rounded-2xl border p-2" value={draft.status||"Unbilled"} onChange={e=>setDraft({...draft, status:e.target.value})}>
              <option>Unbilled</option><option>Billed</option>
            </select>
            <input className="rounded-2xl border p-2" type="date" placeholder="Last FU" value={draft.last_fu||""} onChange={e=>setDraft({...draft, last_fu:e.target.value})}/>
            <input className="rounded-2xl border p-2" type="date" placeholder="Next FU" value={draft.next_fu||""} onChange={e=>setDraft({...draft, next_fu:e.target.value})}/>
            <textarea className="rounded-2xl border p-2 md:col-span-4" rows={3} placeholder="Notes" value={draft.notes||""} onChange={e=>setDraft({...draft, notes:e.target.value})}/>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="btn btn-primary flex items-center gap-2" onClick={save}><Plus size={16}/> {editId?"Save Changes":"Add Record"}</button>
          </div>
        </div>

        {/* toolbar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select className="rounded-2xl border p-2" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option>Unbilled</option><option>Overdue</option><option>All</option><option>Billed</option>
          </select>
          <input className="rounded-2xl border p-2 w-64" placeholder="Search customer / invoice / notes" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="rounded-2xl border p-2" value={String(sort.key)} onChange={e=>setSort({key: e.target.value as any, dir: sort.dir})}>
            <option value="eta_date">ETA</option><option value="pod_date">POD</option><option value="customer">Customer</option>
            <option value="invoice_no">Invoice No</option><option value="amount">Amount</option><option value="next_fu">Next FU</option><option value="status">Status</option>
          </select>
          <button className="btn" onClick={()=>setSort({key: sort.key, dir: sort.dir==="asc"?"desc":"asc"})}>Sort: {sort.dir}</button>
          <button className="btn" onClick={()=>fileRef.current?.click()}><Upload size={16}/> Import CSV</button>
          <input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={(e)=> e.target.files?.[0] && importCSV(e.target.files[0])}/>
          <button className="btn" onClick={exportCSV}><Download size={16}/> Export CSV</button>
        </div>

        {/* table */}
        <div className="card overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/60 text-left">
                {['Customer','Invoice No','Amount','ETA','POD','Next FU','Status','Contact','Actions'].map(h=>(
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r)=>{
                const overdue = r.status==="Unbilled" && r.next_fu && daysBetween(r.next_fu, todayStr())>0;
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.customer}</div>
                      {r.notes && <div className="text-xs text-gray-500">{r.notes}</div>}
                    </td>
                    <td className="px-3 py-2">{r.invoice_no}</td>
                    <td className="px-3 py-2">{toCurrency(r.amount, r.currency||"MYR")}</td>
                    <td className="px-3 py-2">{r.eta_date || '-'}</td>
                    <td className="px-3 py-2">{r.pod_date || '-'}</td>
                    <td className="px-3 py-2">{r.next_fu || '-'}</td>
                    <td className="px-3 py-2">
                      {overdue ? <span className="text-red-700 bg-red-100 rounded-full px-2 py-0.5 text-xs">Overdue</span>
                        : r.status==="Billed" ? <span className="text-green-700 bg-green-100 rounded-full px-2 py-0.5 text-xs">Billed</span>
                        : <span className="text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 text-xs">Unbilled</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div>{r.contact}</div>
                      <div className="text-xs text-gray-500">{r.contact_email || r.contact_phone}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn" onClick={()=>{ setDraft(r); setEditId(r.id||null); window.scrollTo({top:0, behavior:'smooth'}); }}><Pencil size={16}/></button>
                        <button className="btn" onClick={()=>{ setModalRow(r); setModalOpen(true); }}><MessageSquare size={16}/></button>
                        <button className="btn" onClick={()=> markBilled(r.id!)}><CheckCircle size={16}/></button>
                        <button className="btn" onClick={()=> remove(r.id!)}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length===0 && <tr><td className="px-3 py-8 text-center text-gray-500" colSpan={9}>No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <FollowUpModal open={modalOpen} onClose={()=>setModalOpen(false)} row={modalRow} />
    </div>
  );
}
