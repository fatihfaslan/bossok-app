import { useState, useMemo, useEffect, useCallback, useRef, Component } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ═══════════════════════════════════════════════════════════════════
// DATE HELPERS (fuseau horaire local, Luxembourg)
// ═══════════════════════════════════════════════════════════════════
// new Date().toISOString() convertit en UTC : entre minuit et 1h du matin
// (heure d'hiver) ou 2h (heure d'été), ça renvoie encore la date de LA VEILLE.
function localDateStr(d = new Date()) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}
function localYearMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════
// ICÔNES SVG (dessinées à la main, aucune dépendance externe)
// ═══════════════════════════════════════════════════════════════════
const ICON_PATHS = {
  calendrier: <><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></>,
  dashboard: <><rect x="4" y="12" width="4" height="8" rx="1"/><rect x="10" y="7" width="4" height="13" rx="1"/><rect x="16" y="3.5" width="4" height="16.5" rx="1"/></>,
  caisse: <><rect x="3" y="6.5" width="18" height="12.5" rx="2.5"/><path d="M3 10.5h18"/><circle cx="16.2" cy="14.8" r="1.4"/></>,
  clients: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6"/><circle cx="17" cy="9" r="2.3"/><path d="M15.2 13.2c2.4.3 4.3 2.3 4.3 5.3"/></>,
  carte: <><path d="M12 21s-6.5-5.9-6.5-11A6.5 6.5 0 1 1 18.5 10c0 5.1-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.2"/></>,
  factures: <><path d="M6 2.5h9l3 3V21H6z"/><path d="M15 2.5v3h3M9 12h6M9 15.5h6M9 8.5h3"/></>,
  commandes: <><rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="3.5" rx="1"/><path d="m8.3 12.2 1.6 1.6 3-3M8.3 17.2l1.6 1.6 3-3"/></>,
  planning: <><path d="M3 7h11v9H3z"/><path d="M14 10.5h4l3 3V16h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></>,
  zones: <><path d="M9 3 3.5 5v15L9 18l6 2 5.5-2V3L15 5 9 3Z"/><path d="M9 3v15M15 5v15"/></>,
  stock: <><path d="M3.5 7.5 12 3l8.5 4.5V17L12 21.5 3.5 17Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9.5"/></>,
  consignes: <><path d="M4 12a8 8 0 0 1 13.5-5.8"/><path d="m16 3 1.7 3.3-3.5.9"/><path d="M20 12a8 8 0 0 1-13.5 5.8"/><path d="m8 21-1.7-3.3 3.5-.9"/></>,
  produits: <><path d="M10 2h4v4.2c0 .6.2 1.1.6 1.6l1.8 2.2c.4.5.6 1 .6 1.6V20a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-8.4c0-.6.2-1.1.6-1.6l1.8-2.2c.4-.5.6-1 .6-1.6V2Z"/><path d="M9 13h6"/></>,
  refresh: <><path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6"/><path d="M4 4v4.6h4.6"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.4"/><path d="M20 20v-4.6h-4.6"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  close: <><path d="M6 6l12 12M18 6 6 18"/></>,
  check: <><path d="m5 13 4 4L19 7"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/></>,
  warning: <><path d="M12 3.5 21.5 20h-19L12 3.5Z"/><path d="M12 10v4M12 17v.1"/></>,
  danger: <><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></>,
  eye: <><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M3 3l18 18"/><path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c7 0 10.5 7 10.5 7a17.7 17.7 0 0 1-3.2 4.2M6.7 6.7C3.7 8.6 1.5 12 1.5 12s3.5 7 10.5 7c1.4 0 2.7-.28 3.85-.75"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/></>,
  arrowRight: <><path d="M4 12h16M13 5l7 7-7 7"/></>,
  money: <><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/></>,
  trendingUp: <><path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6"/><circle cx="17" cy="9" r="2.3"/><path d="M15.2 13.2c2.4.3 4.3 2.3 4.3 5.3"/></>,
  sparkle: <><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/><path d="m6 6 2.2 2.2M15.8 15.8 18 18M18 6l-2.2 2.2M8.2 15.8 6 18"/></>,
  cart: <><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M2.5 3h2.3l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/></>,
  bulb: <><path d="M9 18h6M10 21h4"/><path d="M12 3a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.2 1 2v.4h6v-.4c0-.8.4-1.5 1-2A6.5 6.5 0 0 0 12 3Z"/></>,
  trophy: <><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a3 3 0 0 0 3 3M17 5h3a3 3 0 0 1-3 3"/><path d="M12 14v3M9 21h6M9.5 21c0-2 1-3 2.5-3s2.5 1 2.5 3"/></>,
  barChart2: <><path d="M4 20V10M12 20V4M20 20v-7"/></>,
  chat: <><path d="M4 4.5h16v12H9l-4 3.5v-3.5H4Z"/></>,
  phone: <><path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/></>,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6.5 9 6.5 9-6.5"/></>,
  diverses: <><path d="M6 2.5h9l3 3V21H6z"/><path d="M15 2.5v3h3M12 10.5v6M9 13.5h6"/></>,
};
const Icon = ({name, size=15, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block",...style}}>
    {ICON_PATHS[name]}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════
// DATATABLE — composant de liste réutilisable (chantier 4)
// Desktop : vrai tableau dense, en-têtes cliquables pour trier.
// Mobile  : liste compacte triable (pas de vraies colonnes, l'app est
//           utilisée exclusivement sur téléphone donc c'est le format
//           qui compte le plus au quotidien).
// columns: [{ key, label, align, sortable, sortValue(row), render(row),
//             mobilePrimary, mobileShow, wrap }]
// ═══════════════════════════════════════════════════════════════════
function DataTable({ columns, rows, onRowClick, isMobile, emptyIcon="📋", emptyMessage="Aucune donnée", initialSort, pageSize, footer, selectedIds, onToggleRow, onToggleAll, exportName }) {
  const selectable = !!(selectedIds && onToggleRow);
  const isSel = (row) => selectable && selectedIds.includes(row.id);
  const allSelected = selectable && rows.length > 0 && rows.every(r => selectedIds.includes(r.id));
  const someSelected = selectable && !allSelected && rows.some(r => selectedIds.includes(r.id));
  const [sortKey, setSortKey] = useState(initialSort?.key || null);
  const [sortDir, setSortDir] = useState(initialSort?.dir || "asc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find(c => c.key === sortKey);
    const getVal = col?.sortValue || (r => r[sortKey]);
    return [...rows].sort((a, b) => {
      const va = getVal(a), vb = getVal(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [rows, sortKey, sortDir, columns]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const visible = pageSize ? sorted.slice((safePage-1)*pageSize, safePage*pageSize) : sorted;

  const toggleSort = (key) => {
    setPage(1);
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Export Excel du tableau (toutes les lignes filtrées/triées, pas seulement la page affichée) ──
  const nodeText = (n) => (n == null || n === false || n === true) ? "" :
    (typeof n === "string" || typeof n === "number") ? String(n) :
    Array.isArray(n) ? n.map(nodeText).join("") :
    n.props ? nodeText(n.props.children) : "";
  const exporter = (brut) => {
    const jour = localDateStr();
    let data;
    if (brut) {
      data = sorted.map(r => ({ ...r }));
    } else {
      const cols = columns.filter(c => c.label && c.key !== "actions");
      const noms = [];
      cols.forEach(c => { let n = c.label, k = 2; while (noms.includes(n)) n = c.label + " " + k++; noms.push(n); });
      data = sorted.map(r => {
        const o = {};
        cols.forEach((c, i) => {
          let v = c.render ? nodeText(c.render(r)) : r[c.key];
          if (v !== null && typeof v === "object") v = JSON.stringify(v);
          o[noms[i]] = v;
        });
        return o;
      });
    }
    telechargerBlob(buildXlsx([{ name: String(exportName).slice(0, 31), rows: data }]), `bossok_${exportName}${brut ? "_brut" : ""}_${jour}.xlsx`);
  };
  const exportBar = exportName && rows.length > 0 ? (
    <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginBottom:6}}>
      <button onClick={()=>exporter(false)} title="Les colonnes telles qu'affichées (toutes les lignes du filtre)" style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,color:"#374151",cursor:"pointer"}}>📥 Excel</button>
      <button onClick={()=>exporter(true)} title="Toutes les colonnes de la base de données" style={{background:"#fff",border:"1px solid #CBD5E1",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,color:"#374151",cursor:"pointer"}}>🗂️ Excel complet</button>
    </div>
  ) : null;

  if (rows.length === 0) {
    return (
      <div style={{textAlign:"center",padding:"48px 20px",color:"#9CA3AF",background:"#fff",borderRadius:10,border:"1px solid #E3E7ED"}}>
        <div style={{fontSize:34,marginBottom:10}}>{emptyIcon}</div>
        <div style={{fontSize:13}}>{emptyMessage}</div>
      </div>
    );
  }

  const Pagination = () => totalPages > 1 && (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,padding:"10px",borderTop:"1px solid #F1F5F9",flexWrap:"wrap"}}>
      <button onClick={()=>setPage(1)} disabled={safePage===1} style={{background:"#F1F5F9",border:"none",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer",opacity:safePage===1?0.4:1}}>«</button>
      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1} style={{background:"#F1F5F9",border:"none",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer",opacity:safePage===1?0.4:1}}>‹</button>
      <span style={{fontSize:12,color:"#374151",fontWeight:600}}>Page {safePage} / {totalPages}</span>
      <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} style={{background:"#F1F5F9",border:"none",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer",opacity:safePage===totalPages?0.4:1}}>›</button>
      <button onClick={()=>setPage(totalPages)} disabled={safePage===totalPages} style={{background:"#F1F5F9",border:"none",borderRadius:6,padding:"5px 9px",fontSize:11,cursor:"pointer",opacity:safePage===totalPages?0.4:1}}>»</button>
    </div>
  );

  if (isMobile) {
    const primaryCol = columns.find(c => c.mobilePrimary) || columns[0];
    const secondaryCols = columns.filter(c => c.mobileShow && c !== primaryCol);
    const sortableCols = columns.filter(c => c.sortable !== false);
    return (
      <div>
        {exportBar}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,fontSize:11,color:"#6B7280"}}>
          <span>Trier :</span>
          <select value={sortKey||""} onChange={e=>toggleSort(e.target.value)} style={{padding:"5px 8px",border:"1px solid #E3E7ED",borderRadius:6,fontSize:11,flex:1}}>
            <option value="">—</option>
            {sortableCols.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {sortKey && <button onClick={()=>{setSortDir(d=>d==="asc"?"desc":"asc");setPage(1);}} style={{background:"#F1F5F9",border:"none",borderRadius:6,padding:"5px 9px",cursor:"pointer",color:"#374151",fontSize:12}}>{sortDir==="asc"?"↑":"↓"}</button>}
          <span style={{marginLeft:"auto"}}>{rows.length}</span>
        </div>
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #E3E7ED",overflow:"hidden"}}>
          {selectable && onToggleAll && (
            <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC",fontSize:12,fontWeight:600,color:"#374151",cursor:"pointer"}}>
              <input type="checkbox" checked={allSelected} ref={el=>{ if(el) el.indeterminate = someSelected; }} onChange={()=>onToggleAll(rows)} style={{width:18,height:18}}/>
              Tout sélectionner ({rows.length})
            </label>
          )}
          {visible.map((row,i)=>(
            <div key={row.id??i} onClick={()=>onRowClick&&onRowClick(row)}
              style={{padding:"10px 12px",borderBottom:i<visible.length-1?"1px solid #F1F5F9":"none",cursor:onRowClick?"pointer":"default",background:isSel(row)?"#EFF6FF":"transparent",display:"flex",gap:10,alignItems:"flex-start"}}>
              {selectable && (
                <input type="checkbox" checked={isSel(row)} onClick={e=>e.stopPropagation()} onChange={()=>onToggleRow(row)} style={{width:18,height:18,marginTop:2,flexShrink:0}}/>
              )}
              <div style={{flex:1,minWidth:0}}>
              <div>{primaryCol.render ? primaryCol.render(row) : row[primaryCol.key]}</div>
              {secondaryCols.length>0&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginTop:4}}>
                  {secondaryCols.map(c=>(<span key={c.key}>{c.render ? c.render(row) : row[c.key]}</span>))}
                </div>
              )}
              </div>
            </div>
          ))}
          {footer && <div style={{padding:"9px 12px",borderTop:"1px solid #E3E7ED",background:"#F8FAFC",fontSize:12,fontWeight:700}}>{footer}</div>}
          <Pagination/>
        </div>
      </div>
    );
  }

  return (
    <div>
    {exportBar}
    <div style={{background:"#fff",borderRadius:10,border:"1px solid #E3E7ED",overflow:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
        <thead>
          <tr style={{background:"#F8FAFC",borderBottom:"1px solid #E3E7ED"}}>
            {selectable && (
              <th style={{padding:"9px 12px",width:36}}>
                {onToggleAll && <input type="checkbox" checked={allSelected} ref={el=>{ if(el) el.indeterminate = someSelected; }} onChange={()=>onToggleAll(rows)} title={"Tout sélectionner ("+rows.length+")"} style={{width:16,height:16,cursor:"pointer"}}/>}
              </th>
            )}
            {columns.map(c=>(
              <th key={c.key} onClick={()=>c.sortable!==false && toggleSort(c.key)}
                style={{padding:"9px 12px",textAlign:c.align||"left",fontWeight:700,color:"#5D6B82",fontSize:10.5,textTransform:"uppercase",letterSpacing:"0.04em",cursor:c.sortable!==false?"pointer":"default",whiteSpace:"nowrap",userSelect:"none"}}>
                {c.label}{sortKey===c.key && (sortDir==="asc"?" ↑":" ↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row,i)=>(
            <tr key={row.id??i} onClick={()=>onRowClick&&onRowClick(row)}
              style={{borderBottom:"1px solid #F1F5F9",cursor:onRowClick?"pointer":"default",background:isSel(row)?"#EFF6FF":"transparent"}}>
              {selectable && (
                <td style={{padding:"8px 12px",width:36}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={isSel(row)} onChange={()=>onToggleRow(row)} style={{width:16,height:16,cursor:"pointer"}}/>
                </td>
              )}
              {columns.map(c=>(
                <td key={c.key} style={{padding:"8px 12px",textAlign:c.align||"left",whiteSpace:c.wrap?"normal":"nowrap"}}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
      <Pagination/>
    </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROUTING (URL basée sur le hash, ex: #/clients/482)
// ═══════════════════════════════════════════════════════════════════
const PAGE_KEYS = ["calendrier","dashboard","controle","caisse","clients","carte","factures","diverses","commandes","planning","stock","consignes","produits","zones"];
const parseHash = () => {
  const h = (window.location.hash || "").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  const page = PAGE_KEYS.includes(parts[0]) ? parts[0] : "calendrier";
  const id = parts[1] ? parseInt(parts[1], 10) : null;
  return { page, id: isNaN(id) ? null : id };
};

// ═══════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ═══════════════════════════════════════════════════════════════════
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAFdUlEQVR4nOzXMWsfZRzA8efyDyKCILi4OhRd3ESwNEIHB9+AQzWLuDQZi4vg6uAiIrEg6BJfgbNT081XIK04CQ6CIIikDTlPcE71Pxx+k88HnnvG33D3fO9u9+T4cB6r+XvUNIDLYt0zvTsAIgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyFg7WA+WdX8Al8WNZV0bK1k5WNP9vf2j9wZwKZwcH349Lm+wALYnWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVsbTPmj8+mna/GSgQL2Nr1/S8eLtvDsRLBAjIEC8gQLCBDsIAMwQIyBAvIEKwt3Pvm9rvT+c5bYyWbp596//rbn/45uNC944OPpnl6eaxhGr/s7R/dGaxKsLawHIpXlwf21ljJzqOz28smWE8wjfHmctkba5jHj8tVsFYmWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCFfB4Pv/w3vHhzuBC8xgvTmMdy6znl3vyybji5vPx0jSNF8ZKBKtgng+maXp28ARLRsY6yVqmPLdsH4wrblr5NSpYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCBWQIFpAhWECGYAEZggVkCBaQIVhAhmABGYIFZAgWkCFYQIZgARmCFbCzOX3l0bT5Y3Chzfnut9M8Xh/r+Ols8/i1ccXtnm8+m+fp1liJYAVs5md+u/nO578PLnRyfHA21nN+89aXv44r7uT48HQa6xEsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMHawjymH6Z5/m6sZPe507PBvzB9P+b5dKxgnqafB6sTrC28sX90d9nuDv5X9vaP7gwuNcECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvImE6OD+axngfLyPsDuCTmG8uZvjZWsnxhTWNF1/5ZAP+ZX0IgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CADMECMgQLyBAsIEOwgAzBAjIEC8gQLCBDsIAMwQIyBAvIECwgQ7CAjL8AAAD//140Me0AAAAGSURBVAMAxPhqe6xfG84AAAAASUVORK5CYII=";
// Identité de la société (nom légal / nom commercial). Titulaire du compte bancaire : à passer
// à "Hondro Trading S.à r.l." une fois le changement confirmé par la banque (facture + QR de paiement).
const SOC_LEGAL = "Hondro Trading S.à r.l.";
const SOC_COMMERCIAL = "Hondro Trading & Distribution";
const TITULAIRE_COMPTE = "BOSSOK DISTRIBUTION S.A.R.L";

// Comptes bancaires affichés sur les factures (un QR de paiement SEPA par compte).
const BANQUES = [
  { id: "bgl", nom: "BGL BNP Paribas", bic: "BGLLLULL", iban: "LU14003018955248000", ibanFmt: "LU14 0030 1895 5248 0000", titulaire: TITULAIRE_COMPTE },
  { id: "rev", nom: "Revolut", bic: "REVOLT21", iban: "LT853250057128680584", ibanFmt: "LT85 3250 0571 2868 0584", titulaire: "Hondro Trading Sarl" },
];

const SUPABASE_URL = "https://yjjdpfaubpbicehqiepe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqamRwZmF1YnBiaWNlaHFpZXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDg5MjEsImV4cCI6MjA5NzcyNDkyMX0.IUNl-DCU0C_iyFP74JOXeEKufD53NeJSQRJsu3vosys";


// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════
const sbAuth = async (endpoint, body) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
};

const getSession = () => {
  try {
    const raw = localStorage.getItem("bossok_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
      localStorage.removeItem("bossok_session");
      return null;
    }
    return session;
  } catch { return null; }
};

const sb = async (path, method = "GET", body = null, rangeFrom = null, rangeTo = null) => {
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${getSession()?.access_token || SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  if (rangeFrom !== null && rangeTo !== null) {
    headers["Range-Unit"] = "items";
    headers["Range"] = `${rangeFrom}-${rangeTo}`;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

// Upload d'un fichier (photo/PDF) vers Supabase Storage. Retourne son URL publique.
const uploadFichier = async (file, dossier = "general") => {
  const extension = (file.name.split(".").pop() || "bin").toLowerCase();
  const chemin = `${dossier}/${Date.now()}-${Math.round(Math.random()*1e6)}.${extension}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/receptions/${chemin}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${getSession()?.access_token || SUPABASE_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  // Bucket privé : on garde le CHEMIN, pas une URL — un lien d'accès temporaire
  // sera généré à la demande (voir getUrlSigneeFichier), au moment de consulter le fichier.
  return { chemin, nom: file.name };
};

// Génère un lien d'accès temporaire (1h) vers un fichier du bucket privé "receptions".
// Nécessaire à chaque consultation : pas de lien fixe et permanent, il expire.
const getUrlSigneeFichier = async (chemin) => {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/receptions/${chemin}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${getSession()?.access_token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
};

const db = {
  get: (table, query = "") => {
    const orderCol = table === 'stock' ? 'produit_id' : 'id';
    return sb(`${table}?select=*${query ? '&' + query : ''}&order=${orderCol}.desc`);
  },
  insert: (table, data) => sb(table, "POST", data),
  update: (table, id, data) => sb(`${table}?id=eq.${id}`, "PATCH", data),
  delete: (table, id) => sb(`${table}?id=eq.${id}`, "DELETE"),
};

// ═══════════════════════════════════════════════════════════════════
// EXPORT COMPLET DE LA BASE (Excel .xlsx multi-onglets ou sauvegarde JSON)
// Aucune dépendance : le .xlsx est assemblé à la main (zip non compressé).
// Relit chaque table directement dans Supabase (pas l'état de l'écran), donc
// l'export est toujours complet et à jour, même au-delà de 1000 lignes.
// ═══════════════════════════════════════════════════════════════════
const EXPORT_TABLES = [
  ["clients","id"],["produits","id"],["stock","produit_id"],["commandes","id"],["factures","id"],
  ["factures_diverses","id"],["receptions_stock","id"],["pertes_stock","id"],["consignes_manuelles","id"],
  ["frais_generaux_mensuels","id"],["prix_concurrents","id"],["ca_historique_pre_app","id"],
  ["creances_clients_snapshot","id"],["releves_chauffeurs_mensuels","id"],["evenements","id"],
  ["note_partagee","id"],["notes_personnelles","id"],["distances_routieres","origine"],["staff_users","user_id"],
];

const fetchTableComplete = async (table, orderCol) => {
  const PAGE = 1000;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    let batch;
    try {
      batch = await sb(`${table}?select=*&order=${orderCol}.asc`, "GET", null, from, from + PAGE - 1);
    } catch {
      batch = await sb(`${table}?select=*`, "GET", null, from, from + PAGE - 1); // table sans cette colonne : sans tri
    }
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
};

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

const zipStore = (files) => {
  const enc = new TextEncoder();
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const parts = []; const central = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name); const data = enc.encode(f.content); const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

const xmlEsc = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const colLetter = (i) => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

const sheetXml = (rows) => {
  const cols = [];
  rows.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
  const idIdx = cols.indexOf("id"); if (idIdx > 0) { cols.splice(idIdx, 1); cols.unshift("id"); }
  const cell = (ref, v, style) => {
    const s = style ? ` s="${style}"` : "";
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number" && isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
    if (typeof v === "boolean") return `<c r="${ref}"${s} t="b"><v>${v ? 1 : 0}</v></c>`;
    const txt = (typeof v === "object" ? JSON.stringify(v) : String(v)).slice(0, 32000);
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(txt)}</t></is></c>`;
  };
  let x = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>`;
  x += `<row r="1">` + cols.map((c, i) => cell(colLetter(i) + "1", c, 1)).join("") + `</row>`;
  rows.forEach((r, ri) => {
    x += `<row r="${ri + 2}">` + cols.map((c, i) => cell(colLetter(i) + (ri + 2), r[c], 0)).join("") + `</row>`;
  });
  return x + `</sheetData></worksheet>`;
};

const buildXlsx = (tables /* [{name, rows}] */) => {
  const files = [];
  files.push({ name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${tables.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>` });
  files.push({ name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` });
  files.push({ name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${tables.map((t, i) => `<sheet name="${xmlEsc(t.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>` });
  files.push({ name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${tables.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${tables.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` });
  files.push({ name: "xl/styles.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` });
  tables.forEach((t, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(t.rows) }));
  return zipStore(files);
};

const telechargerBlob = (blob, nom) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nom;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const exporterToutesLesDonnees = async (format, onProgress) => {
  const tables = [];
  for (let i = 0; i < EXPORT_TABLES.length; i++) {
    const [name, orderCol] = EXPORT_TABLES[i];
    onProgress && onProgress(`Lecture ${i + 1}/${EXPORT_TABLES.length} : ${name}…`);
    try { tables.push({ name, rows: await fetchTableComplete(name, orderCol) }); }
    catch (e) { tables.push({ name, rows: [{ erreur: String(e.message || e).slice(0, 300) }] }); }
  }
  const jour = localDateStr();
  const marque = jour + " " + new Date().toTimeString().slice(0, 5);
  if (format === "json") {
    const obj = { exporte_le: marque, tables: Object.fromEntries(tables.map(t => [t.name, t.rows])) };
    telechargerBlob(new Blob([JSON.stringify(obj, null, 1)], { type: "application/json" }), `bossok_sauvegarde_${jour}.json`);
  } else {
    const resume = { name: "_resume", rows: [{ export_le: marque }, ...tables.map(t => ({ table: t.name, nb_lignes: t.rows.length }))] };
    telechargerBlob(buildXlsx([resume, ...tables]), `bossok_donnees_${jour}.xlsx`);
  }
  return tables;
};

function ExportDonneesBoutons({ isMobile }) {
  const [etat, setEtat] = useState("");
  const [enCours, setEnCours] = useState(false);
  const lancer = async (format) => {
    if (enCours) return;
    setEnCours(true);
    try {
      const t = await exporterToutesLesDonnees(format, setEtat);
      const total = t.reduce((s, x) => s + x.rows.length, 0);
      const erreurs = t.filter(x => x.rows[0] && x.rows[0].erreur).map(x => x.name);
      setEtat(`✓ Export terminé : ${t.length} tables, ${total} lignes${erreurs.length ? " — erreur sur : " + erreurs.join(", ") : ""}`);
    } catch (e) { setEtat("✕ Échec de l'export : " + String(e.message || e).slice(0, 120)); }
    finally { setEnCours(false); }
  };
  const btn = (bg, col) => ({ background: bg, color: col, border: "1px solid #CBD5E1", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: enCours ? "wait" : "pointer", opacity: enCours ? 0.6 : 1 });
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: isMobile ? "0 0 12px" : "0 0 14px" }}>
      <button disabled={enCours} onClick={() => lancer("xlsx")} style={btn("#059669", "#fff")}>📦 Exporter toutes les données (Excel)</button>
      <button disabled={enCours} onClick={() => lancer("json")} style={btn("#fff", "#374151")}>💾 Sauvegarde JSON</button>
      {etat && <span style={{ fontSize: 12, color: etat.startsWith("✕") ? "#DC2626" : "#6B7280" }}>{etat}</span>}
    </div>
  );
}

const CONSIGNE_PRIX = {"20cl":5.00,"25cl":5.00,"50cl":7.95,"1L":4.20};
// Prix d'une consigne à partir de la taille choisie (ex "20cl"). Accepte aussi un ancien prix numérique.
const prixConsigne = (taille) => CONSIGNE_PRIX[taille] ?? (parseFloat(taille)||0);
// Libellé affiché sur la facture : « Consigne 20cl (3 × 5,00 €) », « Retour consigne 20cl — Coca VC (2 × 5,00 €) ».
const libelleConsigne = ({label, taille, qte, sens}) => {
  const retour = sens === "retour";
  if (!CONSIGNE_PRIX[taille]) return label || (retour ? "Retour consignes (manuel)" : "Consigne supplémentaire");
  const q = parseFloat(qte) || 0;
  return (retour ? "Retour consigne " : "Consigne ") + taille + (label ? " — " + label : "")
    + " (" + q + " × " + CONSIGNE_PRIX[taille].toFixed(2).replace(".", ",") + " €)";
};

// Le transport est un service, toujours soumis au taux de TVA standard (17%)
// — indépendamment du taux appliqué aux produits (0% ou 3%, selon le client).
const TVA_TRANSPORT_PCT = 17;

// Alias pour produits renommés dans le catalogue (protège les commandes en attente
// qui référencent encore un ancien nom, ex: fautes de frappe corrigées)
const PRODUIT_ALIASES = {
  "CRISTALINTE 24x50cl": "CRISTALINE 24x50cl",
};
const findProduitByNom = (produits, nom) =>
  produits.find(x => x.nom === nom) ||
  produits.find(x => x.nom === PRODUIT_ALIASES[nom]);

const MONTHLY_DATA = [
  {label:"Juin 25",ca:114263,paye:114165,impaye:97},
  {label:"Juil 25",ca:113796,paye:112925,impaye:871},
  {label:"Aoû 25",ca:78889,paye:76484,impaye:2405},
  {label:"Sep 25",ca:90202,paye:90202,impaye:0},
  {label:"Oct 25",ca:99043,paye:95916,impaye:3127},
  {label:"Nov 25",ca:80942,paye:80538,impaye:404},
  {label:"Déc 25",ca:76797,paye:76797,impaye:0},
  {label:"Jan 26",ca:80788,paye:80788,impaye:0},
  {label:"Fév 26",ca:74336,paye:74336,impaye:0},
  {label:"Mar 26",ca:100322,paye:99521,impaye:802},
  {label:"Avr 26",ca:89876,paye:89631,impaye:245},
  {label:"Mai 26",ca:91826,paye:84527,impaye:7299},
  {label:"Juin 26",ca:65821,paye:25702,impaye:40120},
];
// Historique de CA mensuel antérieur à l'usage réel de l'app (comptabilité manuelle).
// Agrégé par mois uniquement — pas de détail facture par facture, donc ne peut pas
// alimenter marge/top produits/top clients, seulement les totaux CA/Encaissé/Impayés
// et le graphique d'évolution.
const MOIS_ABBR = {"Jan":"01","Fév":"02","Mar":"03","Avr":"04","Mai":"05","Juin":"06","Juil":"07","Aoû":"08","Sep":"09","Oct":"10","Nov":"11","Déc":"12"};
const MONTHLY_DATA_KEYED = MONTHLY_DATA.map(m => {
  const [moisAbbr, an2] = m.label.split(" ");
  return {...m, key: "20"+an2+"-"+MOIS_ABBR[moisAbbr]};
});

// GPS coordinates per region (approximate center)
const REGION_COORDS = {
  "Centre-ville":  {lat:49.6117, lng:6.1319},
  "Nord":          {lat:49.8500, lng:6.1000},
  "Nord-ouest":    {lat:49.7800, lng:5.9500},
  "Nord-est":      {lat:49.8000, lng:6.3500},
  "Nord-Est":      {lat:49.8000, lng:6.3500},
  "Est":           {lat:49.6500, lng:6.5000},
  "Sud":           {lat:49.4800, lng:6.0500},
  "Sud-ouest":     {lat:49.5200, lng:5.8800},
  "Sud-Est":       {lat:49.4500, lng:6.3000},
  "Ouest":         {lat:49.6000, lng:5.9000},
  "Belgique":      {lat:49.6800, lng:5.7500},
  "France":        {lat:49.5000, lng:6.1000},
  "Hollande":      {lat:50.0000, lng:6.1000},
};

// Dépôt / entrepôt : 477 route de Thionville, Hesperange (ancien : Aspelt).
// Les coordonnées ci-dessous sont une position approximative de Hesperange : elles sont
// remplacées par la position exacte de l'adresse (géocodage) dès qu'on lance
// « Calculer les distances réelles » dans le Contrôle de gestion.
const DEPOT_ADRESSE = "477 route de Thionville, L-5886 Hesperange, Luxembourg";
const DEPOT = {lat:49.5728, lng:6.1522};

// Géocodage d'adresse via Nominatim (OpenStreetMap) — gratuit, sans clé API.
// Respecte la limite d'usage de Nominatim (max ~1 requête/seconde côté appelant).
const geocodeOnce = async (q, lu) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1${lu ? "&countrycodes=lu" : ""}&q=${encodeURIComponent(q)}`,
      { headers: { "Accept-Language": "fr" } }
    );
    const data = await res.json();
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {}
  return null;
};
const geocodeAddress = async (address) => {
  if (!address || !address.trim()) return null;
  const raw = address.replace(/\s+/g, " ").trim();
  // Adresse déjà hors Luxembourg ? on ne force pas le pays.
  const horsLu = /belgi|franc|german|allemag|deutsch|nederland|hollan|pays-bas/i.test(raw);
  // Normalisation : "L- 4210", "L-4210", "L 4210" -> "4210" ; abréviations courantes
  let s = raw
    .replace(/\bL\s*-\s*(\d{4})\b/gi, "$1")
    .replace(/\bL\s+(\d{4})\b/gi, "$1")
    .replace(/\bBV\b\.?/gi, "Boulevard")
    .replace(/\bAv\b\.?/gi, "Avenue")
    .replace(/\bRte\b\.?/gi, "Route")
    .replace(/\bMaison\s+/gi, "")
    .replace(/,?\s*(luxembourg|lux|lu)\s*$/i, "")
    .trim();
  const m = s.match(/\b(\d{4})\b\s*([^\d,]*)$/);
  const cp = m ? m[1] : "";
  const ville = m ? m[2].trim() : "";
  const rue = m ? s.slice(0, m.index).replace(/[,\s]+$/, "") : s;
  const pays = horsLu ? "" : ", Luxembourg";
  const essais = [];
  essais.push(s + pays);
  if (rue && ville) essais.push(`${rue}, ${ville}${pays}`);
  if (rue && cp) essais.push(`${rue}, ${cp}${pays}`);
  if (ville) essais.push(`${cp} ${ville}${pays}`.trim());
  const vus = new Set();
  for (const q of essais) {
    if (vus.has(q)) continue; vus.add(q);
    const r = await geocodeOnce(q, !horsLu);
    if (r) return r;
    await new Promise(r2 => setTimeout(r2, 1100)); // limite Nominatim entre essais
  }
  return null;
};

const distKm = (a, b) => {
  const R = 6371;
  const dLat = (b.lat-a.lat) * Math.PI/180;
  const dLng = (b.lng-a.lng) * Math.PI/180;
  const x = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*
    Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

// ── Optimisation de tournée (distances routières exactes quand la matrice est calculée) ──
const TRUCK_CAPACITY = 200; // colis par camionnette (2 palettes)
// Held-Karp : ordre optimal exact pour ≤ 11 arrêts. D[i][j], nœud 0 = dépôt. Retourne la permutation de 1..n.
const heldKarp = (n, D) => {
  const N = 1<<n, INF = 1e15;
  const dp = Array.from({length:N}, ()=>new Float64Array(n).fill(INF));
  const par = Array.from({length:N}, ()=>new Int8Array(n).fill(-1));
  for (let i=0;i<n;i++) dp[1<<i][i] = D[0][i+1];
  for (let m=1;m<N;m++) for (let last=0;last<n;last++) {
    if (!(m&(1<<last)) || dp[m][last]>=INF) continue;
    for (let nx=0;nx<n;nx++) {
      if (m&(1<<nx)) continue;
      const nm = m|(1<<nx), v = dp[m][last]+D[last+1][nx+1];
      if (v<dp[nm][nx]) { dp[nm][nx]=v; par[nm][nx]=last; }
    }
  }
  let best=INF, bl=0; const full=N-1;
  for (let l=0;l<n;l++){ const v=dp[full][l]+D[l+1][0]; if(v<best){best=v;bl=l;} }
  const tour=[]; let m=full, l=bl;
  while (l!==-1) { tour.push(l+1); const pl=par[m][l]; m&=~(1<<l); l=pl; }
  return tour.reverse();
};
// Heuristique (plus proche voisin + 2-opt + or-opt) pour > 11 arrêts
const tourHeuristique = (n, D) => {
  const rest = new Set(Array.from({length:n},(_,i)=>i+1)); let cur=0; const tour=[];
  while (rest.size) { let b=-1,bd=Infinity; rest.forEach(k=>{ if(D[cur][k]<bd){bd=D[cur][k];b=k;} }); tour.push(b); rest.delete(b); cur=b; }
  const len = (t)=>{ let L=D[0][t[0]]; for(let i=1;i<t.length;i++) L+=D[t[i-1]][t[i]]; return L+D[t[t.length-1]][0]; };
  let improved=true, guard=0;
  while (improved && guard++<200) {
    improved=false;
    for (let i=0;i<n-1;i++) for (let j=i+1;j<n;j++) { // 2-opt
      const a=i===0?0:tour[i-1], b=tour[i], c=tour[j], d=j===n-1?0:tour[j+1];
      if (D[a][c]+D[b][d] < D[a][b]+D[c][d]-1e-9) { tour.splice(i,j-i+1,...tour.slice(i,j+1).reverse()); improved=true; }
    }
    for (let i=0;i<n;i++) { // or-opt (déplacer 1 arrêt)
      const base=len(tour), x=tour[i]; const t2=tour.filter((_,k)=>k!==i);
      let bestPos=-1, bestL=base-1e-9;
      for (let p=0;p<=t2.length;p++) { if(p===i) continue; const t3=[...t2.slice(0,p),x,...t2.slice(p)]; const L=len(t3); if(L<bestL){bestL=L;bestPos=p;} }
      if (bestPos>=0) { tour.splice(0,tour.length,...t2.slice(0,bestPos),x,...t2.slice(bestPos)); improved=true; }
    }
  }
  return tour;
};
// items:[{key,charge}] ; distFn(keyA,keyB) → km ('depot' = dépôt). Retourne les rotations (listes d'index d'items).
const optimiserTournee = (items, distFn, cap=TRUCK_CAPACITY) => {
  const n = items.length; if (!n) return [];
  const nodes = ['depot', ...items.map(i=>i.key)];
  const D = Array.from({length:n+1}, (_,i)=>Array.from({length:n+1}, (_,j)=> i===j?0:distFn(nodes[i],nodes[j])));
  const tour = n<=11 ? heldKarp(n,D) : tourHeuristique(n,D); // indices 1..n
  // découpe en rotations (capacité) : programmation dynamique sur la tournée géante
  const best = new Array(n+1).fill(Infinity), from = new Array(n+1).fill(0); best[0]=0;
  for (let j=1;j<=n;j++) {
    let load=0, inner=0;
    for (let i=j-1;i>=0;i--) {
      load += items[tour[i]-1].charge||0;
      if (i<j-1) inner += D[tour[i]][tour[i+1]];
      if (load>cap && i<j-1) break;
      const cost = best[i] + D[0][tour[i]] + inner + D[tour[j-1]][0];
      if (cost<best[j]) { best[j]=cost; from[j]=i; }
    }
  }
  const rots=[]; let j=n; while (j>0) { const i=from[j]; rots.unshift(tour.slice(i,j).map(k=>k-1)); j=i; }
  return rots;
};
// Appel unique à l'API publique OSRM "table" (distances routières en bloc). Retourne {km[][], min[][]}.
const osrmTable = async (coords, sources, destinations) => {
  const c = coords.map(p=>`${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${c}?sources=${sources.join(";")}&destinations=${destinations.join(";")}&annotations=duration,distance`;
  const res = await fetch(url); const data = await res.json();
  if (!data || data.code!=="Ok") throw new Error("OSRM "+(data?.code||res.status));
  return { km: data.distances, min: data.durations };
};
// Upsert d'une ou plusieurs lignes (clé primaire = conflict)
const sbUpsert = async (table, rows, conflict) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflict}`, {
    method:"POST",
    headers:{ "apikey":SUPABASE_KEY, "Authorization":`Bearer ${getSession()?.access_token || SUPABASE_KEY}`,
      "Content-Type":"application/json", "Prefer":"resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(await res.text());
};

// Smart dispatch: balance caisses (max 10% diff) + minimize distance
const smartDispatch = (commandes) => {
  if (commandes.length === 0) return {A:[], B:[]};

  // Calculate caisses per commande
  const cmdsWithData = commandes.map(c => ({
    ...c,
    caisses: (c.produits||[]).reduce((s,p)=>s+p.qte, 0),
    coords: REGION_COORDS[c.client_region] || DEPOT,
    distDepot: distKm(DEPOT, REGION_COORDS[c.client_region] || DEPOT),
  }));

  const totalCaisses = cmdsWithData.reduce((s,c)=>s+c.caisses, 0);
  const targetPerDriver = totalCaisses / 2;
  const maxDiff = targetPerDriver * 0.10; // 10% tolerance

  // Sort by geographic clusters using distance from depot
  // Group by region first, then assign greedily
  const sorted = [...cmdsWithData].sort((a,b) => a.distDepot - b.distDepot);

  let groupA = [], groupB = [];
  let caissesA = 0, caissesB = 0;

  // Greedy assignment: assign to the group that needs more caisses
  // while keeping geographic coherence
  for (const cmd of sorted) {
    const diffA = Math.abs(caissesA + cmd.caisses - targetPerDriver);
    const diffB = Math.abs(caissesB + cmd.caisses - targetPerDriver);
    
    if (diffA <= diffB) {
      groupA.push(cmd);
      caissesA += cmd.caisses;
    } else {
      groupB.push(cmd);
      caissesB += cmd.caisses;
    }
  }

  // Calculate estimated distance for each group (simple TSP nearest neighbor)
  const calcRoute = (cmds) => {
    if (cmds.length === 0) return {distance:0, order:[]};
    let current = DEPOT;
    let remaining = [...cmds];
    let route = [];
    let totalDist = 0;

    while (remaining.length > 0) {
      let nearest = remaining.reduce((best, c) => {
        const d = distKm(current, c.coords);
        return d < best.dist ? {cmd:c, dist:d} : best;
      }, {cmd:remaining[0], dist:Infinity});

      totalDist += nearest.dist;
      current = nearest.cmd.coords;
      route.push(nearest.cmd);
      remaining = remaining.filter(c=>c.id !== nearest.cmd.id);
    }
    // Return to depot
    totalDist += distKm(current, DEPOT);
    return {distance: Math.round(totalDist), order: route};
  };

  const routeA = calcRoute(groupA);
  const routeB = calcRoute(groupB);

  return {
    A: routeA.order,
    B: routeB.order,
    statsA: {caisses: caissesA, km: routeA.distance},
    statsB: {caisses: caissesB, km: routeB.distance},
  };
};

// Driver names
const DRIVERS = { A: "Sefa", B: "Mikail" };

// Zone delivery schedule
const ZONE_SCHEDULE = {
  "Centre-ville": {days:["Lundi","Jeudi"],                driver:"Sefa"},
  "Nord":         {days:["Mardi"],                        driver:"Sefa"},
  "Nord-ouest":   {days:["Mardi"],                        driver:"Sefa"},
  "Nord-Est":     {days:["Mardi"],                        driver:"Sefa"},
  "Nord-est":     {days:["Mardi"],                        driver:"Sefa"},
  "Est":          {days:["Mardi"],                        driver:"Sefa"},
  "Sud":          {days:["Lundi","Vendredi"],             driver:"Mikail"},
  "Sud-ouest":    {days:["Mercredi"],                     driver:"Mikail"},
  "Sud-Est":      {days:["Lundi","Vendredi"],             driver:"Mikail"},
  "Ouest":        {days:["Mercredi"],                     driver:"Mikail"},
};

// Distance à vol d'oiseau (proxy relatif) — le dépôt est défini plus haut (DEPOT, Hesperange).
const distanceKm = (lat1, lng1, lat2, lng2) => {
  if (lat1==null || lng1==null || lat2==null || lng2==null) return null;
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLng = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const generateOnePager = (clients) => {
  const actifs = clients.filter(c => c.statut === "Actif");
  
  // Group by zone
  const byZone = {};
  actifs.forEach(c => {
    const zone = c.region || "Non défini";
    if (!byZone[zone]) byZone[zone] = [];
    byZone[zone].push(c);
  });

  // Sort zones by driver then name
  const sortedZones = Object.keys(byZone).sort((a,b) => {
    const da = ZONE_SCHEDULE[a]?.driver || "Z";
    const db = ZONE_SCHEDULE[b]?.driver || "Z";
    if (da !== db) return da.localeCompare(db);
    return a.localeCompare(b);
  });

  const zoneColors = {
    "Sefa": "#0EA5E9",
    "Mikail": "#8B5CF6",
  };

  const zonesHTML = sortedZones.map(zone => {
    const clients = byZone[zone].sort((a,b) => a.nom.localeCompare(b.nom));
    const schedule = ZONE_SCHEDULE[zone];
    const driver = schedule?.driver || "?";
    const days = schedule?.days?.join(", ") || "À définir";
    const col = zoneColors[driver] || "#374151";

    const rows = clients.map((c,i) => `
      <tr style="border-bottom:1px solid #f0f0f0;background:${i%2===0?'#fff':'#fafafa'}">
        <td style="padding:5px 8px;font-size:9pt;font-weight:600">${c.nom}</td>
        <td style="padding:5px 8px;font-size:8.5pt;color:#555">${c.adresse||""}</td>
        <td style="padding:5px 8px;font-size:8.5pt;color:#555">${c.telephone||""}</td>
        <td style="padding:5px 8px;font-size:8.5pt;color:#555">${c.tva||""}</td>
        <td style="padding:5px 8px;font-size:8.5pt;color:#555">${c.conditions||"30 jours"}</td>
      </tr>
    `).join("");

    return `
      <div style="margin-bottom:20px;page-break-inside:avoid">
        <div style="background:${col};color:#fff;padding:8px 12px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-size:12pt;font-weight:700">${zone}</span>
            <span style="font-size:9pt;margin-left:10px;opacity:0.85">🚚 ${driver} — ${days}</span>
          </div>
          <span style="font-size:10pt;font-weight:700">${clients.length} client(s)</span>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:5px 8px;text-align:left;font-size:8pt;color:#555;width:22%">Nom</th>
              <th style="padding:5px 8px;text-align:left;font-size:8pt;color:#555;width:35%">Adresse</th>
              <th style="padding:5px 8px;text-align:left;font-size:8pt;color:#555;width:13%">Téléphone</th>
              <th style="padding:5px 8px;text-align:left;font-size:8pt;color:#555;width:13%">TVA</th>
              <th style="padding:5px 8px;text-align:left;font-size:8pt;color:#555;width:10%">Conditions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Clients par Zone — Hondro Trading & Distribution</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:9pt; color:#111; padding:12mm 14mm; }
    .no-print { position:fixed; top:8px; right:8px; z-index:999; }
    .no-print button { padding:8px 16px; background:#1D4ED8; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; margin-left:6px; }
    @media print { .no-print { display:none; } body { padding:8mm 10mm; } }
  </style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()">🖨️ Imprimer</button>
</div>

<!-- HEADER -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #111">
  <div>
    <h1 style="font-size:16pt;font-weight:800;color:#C0392B">HONDRO TRADING &amp; DISTRIBUTION</h1>
    <p style="font-size:9pt;color:#555">Hondro Trading S.à r.l. · 477, route de Thionville · L-5887 Alzingen · Tél: 661-620-620</p>
  </div>
  <div style="text-align:right">
    <div style="font-size:13pt;font-weight:700">Clients Actifs par Zone</div>
    <div style="font-size:9pt;color:#555">Édité le ${new Date().toLocaleDateString('fr-LU')} · ${actifs.length} clients actifs</div>
  </div>
</div>

<!-- PLANNING RECAP -->
<div style="display:flex;gap:10px;margin-bottom:16px">
  <div style="flex:1;background:#E0F2FE;border:1px solid #0EA5E9;border-radius:6px;padding:8px 12px">
    <div style="font-weight:700;color:#0EA5E9;margin-bottom:4px;font-size:10pt">🚚 Sefa</div>
    <div style="font-size:8pt;color:#0369A1;line-height:1.8">
      <strong>Lundi :</strong> Centre-ville · Nord · France<br/>
      <strong>Mardi :</strong> Nord · Nord-ouest · Est · Sud<br/>
      <strong>Mercredi :</strong> Centre-ville · Nord-Est · Ouest · Sud-ouest<br/>
      <strong>Jeudi :</strong> Nord · Est · Sud<br/>
      <strong>Vendredi :</strong> Centre-ville · Ouest · Sud-ouest
    </div>
  </div>
  <div style="flex:1;background:#EDE9FE;border:1px solid #8B5CF6;border-radius:6px;padding:8px 12px">
    <div style="font-weight:700;color:#8B5CF6;margin-bottom:4px;font-size:10pt">🚚 Mikail</div>
    <div style="font-size:8pt;color:#6D28D9;line-height:1.8">
      <strong>Lundi :</strong> Sud · France<br/>
      <strong>Mardi :</strong> Sud · Sud-Est<br/>
      <strong>Mercredi :</strong> Ouest · Sud-ouest<br/>
      <strong>Jeudi :</strong> Sud · Belgique · Hollande<br/>
      <strong>Vendredi :</strong> Sud-ouest · Belgique
    </div>
  </div>
</div>

<!-- ZONES -->
${zonesHTML}

</body>
</html>`;

  ouvrirEtImprimer(html, "Hondro_Clients_par_Zone.html");
};

// Zone assignments per day (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri)
// Planning issu de l'analyse des commandes historiques (fréquence + volume/camion), Luxembourg uniquement :
// Sefa = Centre-ville (lun+jeu) et Nord/Est (mar) · Mikail = Sud (lun+ven), Sud-ouest/Ouest (mer).
const DAILY_ZONES = {
  0: { A: ["Centre-ville"],                                              B: ["Sud","Sud-Est"] },
  1: { A: ["Nord","Nord-ouest","Nord-Est","Nord-est","Est"],             B: [] },
  2: { A: [],                                                            B: ["Sud-ouest","Ouest"] },
  3: { A: ["Centre-ville"],                                              B: [] },
  4: { A: [],                                                            B: ["Sud","Sud-Est"] },
};
// Historique des commandes mai→août 2026 (fichiers Excel de facturation), clé = nom client normalisé.
// Sert uniquement à calculer la fréquence de commande de chaque client pour le planning.
const normNomClient = (n) => String(n||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/\b(sarl|sa|sas|s a r l|s\.a\.r\.l)\b/g,"").replace(/[^a-z0-9]/g,"");
const HISTORIQUE_CMD_MAI_AOUT = {"dashaus":"2026-05-03,2026-05-18,2026-05-28,2026-06-03,2026-06-17,2026-06-28,2026-07-08,2026-07-22,2026-08-04,2026-08-16,2026-08-19,2026-08-31","luxji":"2026-05-03,2026-05-19,2026-06-02,2026-06-23,2026-07-08,2026-07-20,2026-08-05,2026-08-13","harun":"2026-05-03,2026-05-20,2026-06-07,2026-06-18,2026-06-25,2026-07-09,2026-07-28,2026-08-20","snackistanbulesch":"2026-05-03,2026-05-12,2026-05-21,2026-06-01,2026-06-08,2026-06-17,2026-06-25,2026-07-01,2026-07-08,2026-07-14,2026-07-20,2026-08-06,2026-08-13,2026-08-24","cirta":"2026-05-03,2026-05-20,2026-06-16,2026-07-05,2026-07-16,2026-08-02,2026-08-19","garipzaza2":"2026-05-03,2026-05-25,2026-06-16,2026-07-01,2026-08-17","restauranpistachbinnikaile":"2026-05-03,2026-05-28,2026-06-24,2026-07-21,2026-08-26","chezdaltonville":"2026-05-03,2026-05-06,2026-05-12,2026-05-18,2026-05-25,2026-06-03,2026-06-07,2026-06-11,2026-06-23,2026-06-29,2026-07-02,2026-07-09,2026-07-14,2026-07-22,2026-07-27,2026-08-04,2026-08-10,2026-08-17,2026-08-24,2026-08-27","chezdaltonesch":"2026-05-03,2026-05-12,2026-05-21,2026-05-28,2026-06-04,2026-06-11,2026-06-18,2026-06-25,2026-07-02,2026-07-09,2026-07-14,2026-07-20,2026-08-06,2026-08-17,2026-08-27","snackantalyachodelices":"2026-05-04,2026-05-10,2026-05-25,2026-05-31,2026-06-01,2026-06-08,2026-06-14,2026-06-23,2026-06-28,2026-07-12,2026-07-20,2026-07-27,2026-08-09,2026-08-17,2026-08-24,2026-08-31","souvenir":"2026-05-04,2026-05-27,2026-06-10,2026-06-29,2026-07-19,2026-08-10,2026-08-27","tacosburger":"2026-05-04,2026-05-11,2026-05-18,2026-05-25,2026-06-08,2026-06-15,2026-06-21,2026-06-29,2026-07-05,2026-07-08,2026-07-12,2026-08-04,2026-08-24","izumi":"2026-05-04,2026-05-19,2026-06-09,2026-06-29,2026-07-22,2026-08-19","arslankebab":"2026-05-04,2026-06-23,2026-07-20","harutfrite":"2026-05-04,2026-05-28,2026-06-21,2026-07-23,2026-08-09,2026-08-17","trechiavi":"2026-05-04,2026-08-31","pizzicotto":"2026-05-04,2026-05-27,2026-06-10,2026-06-25,2026-07-12,2026-07-28,2026-08-24","snacksinbaddm":"2026-05-04,2026-05-25,2026-06-14,2026-06-24,2026-07-12,2026-07-24,2026-08-05,2026-08-23","restaurantholiday":"2026-05-04,2026-06-01,2026-06-23,2026-07-14,2026-08-23","restaurantfuman":"2026-05-04,2026-08-31","foyernala":"2026-05-04,2026-06-17,2026-07-20,2026-08-18","restaurantaz":"2026-05-05,2026-06-08,2026-06-23,2026-07-05,2026-07-20,2026-08-03,2026-08-05,2026-08-17","popeysburger":"2026-05-05,2026-06-14,2026-07-20","serenabozzoli":"2026-05-05","carlislemanagementcompany":"2026-05-05","crechemargreitchen":"2026-05-05,2026-07-22","eurokebab":"2026-05-05,2026-05-14,2026-05-17,2026-05-27,2026-06-04,2026-06-08,2026-06-11,2026-06-21,2026-07-01,2026-07-06,2026-07-08,2026-07-15,2026-08-23","ozpinar":"2026-05-06,2026-07-12","hakii":"2026-05-06,2026-05-17,2026-05-21,2026-06-03,2026-06-10,2026-06-17,2026-06-25,2026-07-02,2026-07-08","sushiatelier":"2026-05-06,2026-05-20,2026-06-04,2026-06-23,2026-07-07,2026-07-21,2026-08-05,2026-08-20","mrback":"2026-05-06","dechertllp":"2026-05-06,2026-05-27,2026-06-11,2026-06-18,2026-07-05,2026-07-13,2026-07-27,2026-08-05,2026-08-09,2026-08-26","newcolibribleu":"2026-05-06,2026-05-28,2026-06-16,2026-07-07,2026-08-11","ledysfood":"2026-05-06,2026-05-10,2026-05-11,2026-05-31,2026-06-15,2026-06-29,2026-07-13,2026-08-02,2026-08-24","restaurantfudoulou":"2026-05-06,2026-07-08,2026-08-30","restaurantginza":"2026-05-06,2026-07-22","royalkebabbe":"2026-05-06,2026-06-24","yangming":"2026-05-06,2026-08-11","breaktime":"2026-05-06,2026-05-12,2026-05-21,2026-05-28,2026-06-04,2026-06-11,2026-06-18,2026-06-25,2026-07-01,2026-07-02,2026-07-08,2026-07-14,2026-07-21,2026-08-05,2026-08-10,2026-08-13,2026-08-23","restaurantxunweitaltwies":"2026-05-07,2026-06-03,2026-06-30,2026-07-06","alicepizzeriakebabhaus":"2026-05-07,2026-05-17,2026-05-31,2026-06-11,2026-06-23,2026-07-02,2026-07-09,2026-07-16,2026-08-10,2026-08-20","foodaddict":"2026-05-07,2026-05-25,2026-06-01,2026-06-11,2026-06-23,2026-07-02,2026-08-10,2026-08-19","misushi":"2026-05-07,2026-07-05,2026-08-10","lesfreress":"2026-05-07,2026-05-14,2026-05-21,2026-05-28,2026-06-04,2026-06-11,2026-06-21,2026-07-01,2026-07-07,2026-07-15,2026-07-23,2026-08-03,2026-08-12,2026-08-20,2026-08-30","amakorn":"2026-05-07,2026-06-17,2026-07-06,2026-07-20,2026-08-06","climali":"2026-05-07,2026-06-29","mydrinksmelik":"2026-05-07,2026-06-10","restaurantkicheneck":"2026-05-07","bozokebab":"2026-05-10,2026-05-31,2026-06-24,2026-07-09,2026-08-05,2026-08-25","luxkebabmersch":"2026-05-10,2026-06-03,2026-07-24,2026-08-04","splsardag":"2026-05-10,2026-06-17,2026-06-18,2026-07-27","deryakebablarochette":"2026-05-10,2026-06-01,2026-07-01,2026-07-19,2026-08-06","italuxfoods":"2026-05-10,2026-05-19,2026-06-11,2026-06-24,2026-07-09,2026-07-23,2026-08-16","hanamirestaurantlabonnefortune":"2026-05-10,2026-05-31,2026-06-21,2026-07-15","idiemeringmarketspartners":"2026-05-11,2026-08-12","ankarasnackrestaurantlonguyon":"2026-05-11,2026-06-24","kebabtaksim":"2026-05-11,2026-05-21,2026-06-03,2026-06-15,2026-06-29,2026-07-07,2026-07-14,2026-08-16","restaurantzafir":"2026-05-11,2026-05-27,2026-06-09,2026-06-23,2026-07-01","snackbbtcarloesch":"2026-05-11,2026-05-25,2026-06-15,2026-06-29,2026-07-20,2026-08-06","snackanadolia":"2026-05-11,2026-05-28,2026-06-16,2026-06-29,2026-07-02,2026-07-14,2026-08-19,2026-08-30","lapetitevenice":"2026-05-11,2026-05-18,2026-06-02,2026-06-17,2026-07-02,2026-07-13,2026-08-17","goodtaste":"2026-05-11,2026-08-10","kebabhauswasserbilig":"2026-05-12,2026-06-01,2026-06-28,2026-07-22,2026-08-12","crechemusekshaus":"2026-05-12,2026-06-02,2026-06-29,2026-07-12,2026-07-23,2026-08-09,2026-08-25","boissonsmanternach":"2026-05-12,2026-07-06","snakhakan":"2026-05-12,2026-05-25,2026-06-08,2026-06-21,2026-06-28,2026-07-07,2026-07-15,2026-07-24,2026-08-16,2026-08-23","restaurantraiskar":"2026-05-12,2026-06-03,2026-06-24,2026-07-16,2026-08-11,2026-08-25","ekenz":"2026-05-12,2026-07-07,2026-08-03","snackistanbulville":"2026-05-12,2026-05-25,2026-05-31,2026-06-11,2026-06-18,2026-07-05,2026-07-13,2026-07-21,2026-07-27,2026-08-06,2026-08-16,2026-08-27","lwalucianaville":"2026-05-12,2026-06-21,2026-08-05","crecheelmen":"2026-05-12,2026-06-15,2026-07-06,2026-08-05","adsconcept":"2026-05-12,2026-05-27,2026-06-16,2026-06-28,2026-07-06,2026-07-20,2026-08-31","intersnackjusuf":"2026-05-12,2026-05-31,2026-06-04,2026-06-28,2026-08-24","liaoxianghua":"2026-05-12","restaurantsashimi":"2026-05-14,2026-06-01,2026-06-18,2026-07-01,2026-07-16,2026-08-03","kebabhousen":"2026-05-14,2026-06-07,2026-07-09","snackpacharodangeroyalkebab":"2026-05-14,2026-05-31,2026-06-15,2026-07-06,2026-07-19","espaceimmo":"2026-05-14,2026-05-25,2026-06-01,2026-06-04,2026-07-02,2026-07-08,2026-07-27,2026-08-20","restaurantyummy":"2026-05-14,2026-06-03,2026-06-18,2026-07-02,2026-07-23,2026-08-13","libertykebab":"2026-05-14,2026-06-02,2026-06-21,2026-07-06,2026-07-19,2026-08-09,2026-08-25","snackankaraesch":"2026-05-17,2026-07-01,2026-08-11","btn":"2026-05-17,2026-06-29,2026-08-06","restaurantdoredahongyun":"2026-05-17,2026-06-24,2026-08-18","restauranttempura":"2026-05-17,2026-05-31,2026-06-14,2026-06-21,2026-07-02,2026-07-28,2026-08-13,2026-08-24","pizzeriailsorriso":"2026-05-18,2026-06-17,2026-07-06,2026-07-23,2026-08-31","idilkebab":"2026-05-18,2026-06-01,2026-06-15,2026-06-29,2026-07-12,2026-07-24,2026-08-17,2026-08-30","snackrapido":"2026-05-18,2026-06-02,2026-06-15,2026-06-30,2026-07-16,2026-08-17","montstlambert":"2026-05-18,2026-06-08,2026-06-21,2026-07-02,2026-07-13,2026-07-27,2026-08-10,2026-08-24","foetzhotelrestaurantdao":"2026-05-18","restaurantsumi":"2026-05-18,2026-06-18,2026-07-07,2026-08-03,2026-08-27","pitabotan":"2026-05-18,2026-07-01,2026-08-04","luxkebabbettembourg":"2026-05-18,2026-06-08","haslibel":"2026-05-18","nathaliehoen":"2026-05-18,2026-06-24","friteriedroitaukitsch":"2026-05-19","stblawsimpsonsthacherbarlettscs":"2026-05-19,2026-06-24,2026-07-23,2026-08-20","seedboxluxembourg":"2026-05-19,2026-06-15,2026-07-16,2026-08-05","eternel":"2026-05-19,2026-06-16,2026-07-09,2026-08-19","peakkyburgers":"2026-05-19,2026-06-03,2026-06-18,2026-06-30,2026-07-16,2026-08-31","zrsushirestaurant":"2026-05-19,2026-06-18,2026-07-16,2026-08-23","halilhakan":"2026-05-19,2026-07-07","restaurantwangchef":"2026-05-20,2026-08-12","dreamlease":"2026-05-20,2026-05-31,2026-06-04,2026-06-23,2026-07-05,2026-07-20,2026-08-03,2026-08-18","sogerouteschmitschmit":"2026-05-20,2026-06-23","bojanaarel":"2026-05-20,2026-06-30","restaurantvilledasie":"2026-05-20","snackmondial":"2026-05-20,2026-06-14,2026-07-09,2026-07-19","snackmoris":"2026-05-21,2026-06-15,2026-07-07","az":"2026-05-21,2026-06-11,2026-06-25,2026-07-06,2026-07-24,2026-08-11","tarboosh":"2026-05-25,2026-06-14,2026-06-28,2026-07-14,2026-08-19","rayleegroup":"2026-05-27,2026-07-06,2026-08-30","amicorpluxembourg":"2026-05-27,2026-06-16,2026-07-12,2026-08-20","urbanfood":"2026-05-27,2026-06-29,2026-07-23","rojkebabpizza":"2026-05-27,2026-07-02,2026-07-28,2026-08-19","oishisushi":"2026-05-27","restaurantpanda":"2026-05-27,2026-06-23,2026-07-23,2026-08-12","snackroyalaras":"2026-05-27,2026-06-18,2026-07-27","restaurantkiyomi":"2026-05-27","sevin":"2026-05-28,2026-06-29,2026-07-22,2026-08-26","mimcocapital":"2026-05-28","jiayuan":"2026-05-28,2026-06-23,2026-07-21,2026-08-26","helin":"2026-05-31,2026-07-05,2026-07-24,2026-08-12","wcpinvestment":"2026-06-01,2026-08-20","salutsushi":"2026-06-02","ogourmet":"2026-06-02,2026-07-12,2026-08-16","snacklena":"2026-06-02,2026-06-29,2026-07-19,2026-07-24","shenyang":"2026-06-03","escapade":"2026-06-03","restaurantfucheng":"2026-06-03,2026-07-09,2026-08-18","restjinetfeng":"2026-06-04,2026-06-23,2026-07-09,2026-07-22,2026-08-06,2026-08-20","restaurantichi":"2026-06-07,2026-07-22","superspatz":"2026-06-09,2026-08-11","moventum":"2026-06-09,2026-07-07,2026-08-25","liaoxianghuagosushi":"2026-06-09,2026-07-14","dashaussaarbrucken":"2026-06-10,2026-07-19","huating":"2026-06-10,2026-08-06","kanuvicafiteria":"2026-06-10","jeanpetitarchitectessa":"2026-06-11,2026-07-16","admarket":"2026-06-11,2026-07-12","gioscafe":"2026-06-11,2026-08-31","ccins":"2026-06-14","yuki":"2026-06-14,2026-08-23","snackbosphore":"2026-06-15","arteceuropesenningerberg":"2026-06-16","lapetitefritegaumaise":"2026-06-16,2026-07-28","colonnadeinsurancesa":"2026-06-16","monsieurkebab":"2026-06-16,2026-08-13","restaurantoishihai":"2026-06-17,2026-08-18","dongya":"2026-06-18,2026-06-24","apax":"2026-06-18","milansalamon":"2026-06-21","luxstabilisation":"2026-06-21","ctie":"2026-06-21","garipzaza2musson":"2026-06-24,2026-07-24","jj32hotel":"2026-06-25,2026-07-23,2026-08-24","letzeburgerhowald":"2026-06-25,2026-06-30,2026-07-02,2026-07-06,2026-07-13,2026-07-16,2026-07-27,2026-08-17,2026-08-31","uyanisseyfichefsteakhouse":"2026-06-28","letzeburgerschouweiler":"2026-06-29,2026-07-06,2026-07-13,2026-07-20,2026-07-27,2026-08-03,2026-08-10,2026-08-17,2026-08-24,2026-08-31","restaurantmiyako":"2026-06-30","snack2bras":"2026-06-30,2026-08-06","restaurantshico":"2026-07-01","daynight2023":"2026-07-01","logico":"2026-07-02","snackantalyarumelange":"2026-07-02,2026-07-16,2026-08-02,2026-08-23","letzeburgerfoetz":"2026-07-02,2026-07-09,2026-07-14,2026-07-21,2026-08-05,2026-08-12,2026-08-17,2026-08-20,2026-08-26","letzeburgerstrassen":"2026-07-05,2026-07-09,2026-07-12,2026-07-13,2026-07-16,2026-07-20,2026-07-21,2026-07-27,2026-08-04,2026-08-09,2026-08-13,2026-08-23,2026-08-30,2026-08-31","teavana":"2026-07-06,2026-07-22","restauranthappyvilla":"2026-07-06","birkasbl":"2026-07-06,2026-08-04","nstrans":"2026-07-07,2026-08-27","sectorgroupe":"2026-07-09","djamiladiawara":"2026-07-14,2026-08-06","havin":"2026-07-15","tradition1":"2026-07-16","hongxiang":"2026-07-22","vipkebab":"2026-07-23,2026-08-19","kebabhousenderyakebabhossingen":"2026-07-24,2026-08-05","rizroyal":"2026-08-02","suhsihana":"2026-08-18","novalicsuad":"2026-08-23","pizzacircus2":"2026-08-25"};
// Fréquence médiane max (jours) pour qu'un client soit proposé comme "attendu" dans le planning
const PLANNING_FREQ_MAX = 45;

// Speed per zone (km/h)
const ZONE_SPEED = {
  "Centre-ville":25,"Sud-ouest":30,"Sud":50,"Nord":60,
  "Nord-ouest":55,"Nord-est":65,"Nord-Est":65,"Est":60,
  "Ouest":45,"Belgique":70,"France":70,"Sud-Est":55,"Hollande":80,
};

const STOP_TIME = 20; // minutes per client
// Get suggested delivery day for a region
const getSuggestedDay = (region) => {
  const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
  for (let d = 0; d < 5; d++) {
    if (DAILY_ZONES[d]?.A?.includes(region) || DAILY_ZONES[d]?.B?.includes(region)) {
      // Find today's day and suggest next occurrence
      const today = new Date().getDay(); // 0=Sun, 1=Mon...
      const todayIdx = today === 0 ? 6 : today - 1; // convert to 0=Mon
      const daysUntil = (d - todayIdx + 7) % 7 || 7;
      const delivDate = new Date();
      delivDate.setDate(delivDate.getDate() + daysUntil);
      return { day: days[d], date: localDateStr(delivDate), dayIdx: d };
    }
  }
  return { day: 'Lundi', date: '', dayIdx: 0 };
};

// Get driver for region on a given day
const getDriverForDay = (region, dayIdx) => {
  const zones = DAILY_ZONES[dayIdx] || DAILY_ZONES[0];
  if (zones.A?.includes(region)) return "A";
  if (zones.B?.includes(region)) return "B";
  // Fallback: geographic
  const southZones = ["Sud","Sud-ouest","Sud-Est","Ouest","Belgique","France","Hollande"];
  return southZones.includes(region) ? "B" : "A";
};

// Auto-detect region from Luxembourg postal code
// Détecte la ZONE DE LIVRAISON luxembourgeoise à partir d'un code postal à 4 chiffres
// (utile pour préremplir la tournée/le chauffeur). Le PAYS est désormais un champ
// séparé et explicite, choisi par l'utilisateur — cette fonction ne le devine plus.
const detectRegionFromAddress = (adresse) => {
  if (!adresse) return "";
  const cleaned = adresse.replace("L-", "").replace("l-", "");
  const parts = cleaned.split(/[\s,\-]+/).filter(Boolean);
  let cp = 0;
  for (const part of parts) {
    if (/^\d{4}$/.test(part)) { cp = parseInt(part); break; }
  }
  if (!cp) return "";

  // Luxembourg postal code mapping
  if (cp >= 1000 && cp <= 1999) return "Centre-ville";      // Luxembourg-Ville
  if (cp >= 2000 && cp <= 2999) return "Centre-ville";      // Luxembourg-Ville (Kirchberg, Limpertsberg...)
  if (cp >= 3000 && cp <= 3499) return "Sud";               // Hesperange, Bettembourg
  if (cp >= 3500 && cp <= 3999) return "Sud";               // Dudelange, Kayl, Rumelange
  if (cp >= 4000 && cp <= 4099) return "Sud";               // Esch-sur-Alzette
  if (cp >= 4100 && cp <= 4499) return "Sud-ouest";         // Esch région, Sanem
  if (cp >= 4500 && cp <= 4999) return "Sud-ouest";         // Differdange, Pétange
  if (cp >= 5000 && cp <= 5499) return "Est";               // Sandweiler, Contern
  if (cp >= 5500 && cp <= 5999) return "Est";               // Remich, Grevenmacher
  if (cp >= 6000 && cp <= 6499) return "Est";               // Echternach région
  if (cp >= 6500 && cp <= 6999) return "Nord-Est";          // Beaufort, Berdorf
  if (cp >= 7000 && cp <= 7499) return "Ouest";             // Mersch, Lintgen
  if (cp >= 7500 && cp <= 7999) return "Nord-ouest";        // Steinfort, Capellen
  if (cp >= 8000 && cp <= 8499) return "Ouest";             // Mamer, Strassen
  if (cp >= 8500 && cp <= 8999) return "Ouest";             // Redange, Préizerdaul
  if (cp >= 9000 && cp <= 9299) return "Nord";              // Diekirch, Ettelbruck
  if (cp >= 9300 && cp <= 9599) return "Nord";              // Vianden, Clervaux région
  if (cp >= 9600 && cp <= 9999) return "Nord";              // Wiltz, Winseler

  return "";
};

// Seuil de stock bas déclenchant les alertes (badge sidebar, bannière dashboard, page Stock)
const STOCK_BAS_SEUIL = 50;

const CHAUFFEUR_REGIONS = {
  A:["Centre-ville","Nord","Nord-ouest","Nord-Est","Nord-est","Est"],
  B:["Sud","Sud-ouest","Sud-Est","Ouest","Belgique","France","Hollande","Allemagne"],
};
// pays est optionnel (rétrocompatible) : s'il est fourni et différent du Luxembourg,
// on route directement vers B sans dépendre de la zone/région (qui n'est plus
// systématiquement remplie pour les clients étrangers depuis l'ajout du champ pays).
const getChauffeur = (r, pays) => {
  if (pays && pays !== "Luxembourg") return "B";
  return CHAUFFEUR_REGIONS.B.includes(r) ? "B" : "A";
};
const getClientPrix = (produit, client) => {
  const pi = client?.prix_individuels || {};
  if (pi[produit.id] !== undefined) return pi[produit.id];
  const prix = produit?.prix || {};
  return prix[client?.type] || prix["Snack"] || 0;
};

// Régions hors Luxembourg traitées en exonération de TVA intracommunautaire
// (autoliquidation B2B, art. 138 directive TVA UE) — cohérent avec generatePDF.
const EXPORT_REGIONS = ["Belgique", "France", "Hollande", "Allemagne"];
const TVA_PREFIX = { "Belgique": "BE", "France": "FR", "Hollande": "NL", "Allemagne": "DE" };
// Un client est exonéré de TVA (0%) soit parce que son PAYS n'est pas le Luxembourg,
// soit parce que la case manuelle "Appliquer TVA 0%" a été cochée sur sa fiche
// (utile en complément, pour tout cas particulier non couvert par le champ pays).
const clientEstExonere = (client) => !!client?.tva_exoneree || (client?.pays && client.pays !== "Luxembourg");
// Vérifie qu'un client hors Luxembourg a un numéro de TVA intracommunautaire
// plausible (préfixe pays correct + longueur minimale). L'exonération à 0%
// appliquée automatiquement à ces clients n'est légale que si ce numéro est
// valide et figure sur la facture — sans lui, la TVA luxembourgeoise est due.
const tvaIntracomValide = (client) => {
  const pays = client?.pays || "Luxembourg";
  if (client?.tva_exoneree) return true; // exonération confirmée manuellement, pas besoin du n° de TVA
  if (pays === "Luxembourg") return true; // n/a pour clients LU
  if (client?.nature_client === "Particulier") return true; // n/a pour les particuliers (règles B2C)
  const tva = (client?.tva || "").replace(/[\s.\-]/g, "").toUpperCase();
  const prefix = TVA_PREFIX[pays];
  if (!prefix) return true; // pays "Autre" personnalisé, pas de préfixe connu à vérifier
  return tva.startsWith(prefix) && tva.length >= prefix.length + 6;
};

const fmt = (n) => new Intl.NumberFormat("fr-LU",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtFull = (n) => new Intl.NumberFormat("fr-LU",{style:"currency",currency:"EUR"}).format(n||0);
const initials = (n="") => n.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
const TYPE_COLORS = {
  Snack:{bg:"#FFF3E0",text:"#E65100"},Restaurant:{bg:"#E8F5E9",text:"#1B5E20"},
  Café:{bg:"#FCE4EC",text:"#880E4F"},Market:{bg:"#E3F2FD",text:"#0D47A1"},
  Administrative:{bg:"#F3E5F5",text:"#4A148C"},Creche:{bg:"#E0F2F1",text:"#004D40"},
  Distributor:{bg:"#FFF8E1",text:"#FF6F00"},Privé:{bg:"#EDE9FE",text:"#5B21B6"},
};
const tc = (t) => TYPE_COLORS[t]||{bg:"#F3F4F6",text:"#374151"};
// Paiements partiels : f.paiements = [{montant, date, mode}]. « Reste dû » = total TTC − somme encaissée.
const totalPaye = (f) => (f?.paiements||[]).reduce((s,p)=>s+(parseFloat(p.montant)||0),0);
const resteFact = (f) => Math.max(0, Math.round(((totalFact(f.lignes, f.tva_pct).total) - totalPaye(f))*100)/100);
const totalFact = (lignes=[], tvaPct=0) => {
  // Les lignes de consigne manuelle (ajout ou retour de vidange, produitId
  // "CONSIGNE_MANUELLE") ne sont jamais soumises à la TVA — au même titre que
  // les consignes normales, elles sortent entièrement de l'assiette TVA.
  // Le transport (produitId "TRANSPORT_MANUEL") est un service à part : toujours
  // soumis à la TVA standard (TVA_TRANSPORT_PCT), quel que soit le taux du client.
  // Les notes de crédit appliquées (produitId "NOTE_CREDIT") se déduisent du total, hors TVA.
  const prod = lignes.reduce((s,l)=> (l.produitId==="CONSIGNE_MANUELLE"||l.produitId==="TRANSPORT_MANUEL"||l.produitId==="NOTE_CREDIT") ? s : s+l.qte*l.pu, 0);
  const credit = lignes.reduce((s,l)=> s + (l.produitId==="NOTE_CREDIT" ? l.qte*l.pu : 0), 0);
  const cons = lignes.reduce((s,l)=> s + (l.produitId==="CONSIGNE_MANUELLE" ? l.qte*l.pu : l.qte*(l.consigne||0)), 0);
  const transport = lignes.reduce((s,l)=> s + (l.produitId==="TRANSPORT_MANUEL" ? l.qte*l.pu : 0), 0);
  const tva = prod * (tvaPct||0) / 100 + transport * TVA_TRANSPORT_PCT / 100;
  const tot = prod+cons+transport+credit+tva;
  return {prod, cons, transport, credit, tva, total: Math.abs(tot)<0.005 ? 0 : tot}; // évite l'affichage « -0,00 € » (arrondi flottant)
};

// ═══════════════════════════════════════════════════════════════════
// RELANCES IMPAYÉS — messages simples, un seul lien qui ouvre l'app déjà
// installée sur le téléphone (WhatsApp / SMS / Email), rien à configurer.
// ═══════════════════════════════════════════════════════════════════
const messageRelance = (facture, client, total) => {
  const nom = client?.nom || "Client";
  return `Bonjour ${nom}, petit rappel : la facture ${facture.numero} du ${facture.date} d'un montant de ${fmtFull(total)} est arrivée à échéance le ${facture.echeance||"?"}. Merci de régulariser dès que possible. Bonne journée !`;
};
const cleanPhoneForLink = (tel) => (tel||"").replace(/[^\d+]/g,"").replace(/^00/,"+");
const relancerWhatsApp = (facture, client, total) => {
  const tel = cleanPhoneForLink(client?.telephone).replace(/^\+/,"");
  if (!tel) { window.alert("Ce client n'a pas de numéro de téléphone renseigné."); return; }
  const msg = encodeURIComponent(messageRelance(facture, client, total));
  window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
};
const relancerSMS = (facture, client, total) => {
  const tel = cleanPhoneForLink(client?.telephone);
  if (!tel) { window.alert("Ce client n'a pas de numéro de téléphone renseigné."); return; }
  const msg = encodeURIComponent(messageRelance(facture, client, total));
  window.open(`sms:${tel}?body=${msg}`, "_blank");
};
const relancerEmail = (facture, client, total) => {
  if (!client?.email) { window.alert("Ce client n'a pas d'email renseigné."); return; }
  const sujet = encodeURIComponent(`Rappel — Facture ${facture.numero} en attente de paiement`);
  const msg = encodeURIComponent(messageRelance(facture, client, total));
  window.open(`mailto:${client.email}?subject=${sujet}&body=${msg}`, "_blank");
};

// Coût moyen pondéré d'un produit à partir de son historique de réceptions de stock.
// Retourne null si aucune réception n'a encore été enregistrée pour ce produit.
const getCoutMoyenPondere = (produitId, receptionsStock) => {
  const receps = receptionsStock.filter(r => r.produit_id === produitId);
  if (receps.length === 0) return null;
  const totalQte = receps.reduce((s,r) => s + Number(r.quantite), 0);
  if (totalQte <= 0) return null;
  const totalCout = receps.reduce((s,r) => s + Number(r.quantite) * Number(r.prix_achat_unitaire), 0);
  return totalCout / totalQte;
};

// Marge réelle : priorité au coût moyen pondéré (réceptions de stock),
// puis au prix d'achat manuel du produit, puis une estimation à 28% de marge
// (ratio historique) en dernier recours si aucune donnée n'est disponible.
const COUT_RATIO_FALLBACK = 0.72;
const calcMargeLigne = (ligne, produits, receptionsStock) => {
  if (ligne.isCredit || ligne.produitId === "CREDIT_CONSIGNES") return { marge: 0, reel: true };
  // Transport : service facturé sans coût d'achat suivi dans le système — marge pleine,
  // pas d'estimation par ratio (sinon on sous-évalue systématiquement la marge sur le transport).
  if (ligne.produitId === "TRANSPORT_MANUEL") return { marge: ligne.qte * ligne.pu, reel: true };
  const coutMoyen = getCoutMoyenPondere(ligne.produitId, receptionsStock);
  if (coutMoyen != null && coutMoyen > 0) {
    return { marge: (ligne.pu - coutMoyen) * ligne.qte, reel: true };
  }
  const produit = produits.find(p => p.id === ligne.produitId);
  const prixAchat = produit?.prix_achat;
  if (prixAchat != null && prixAchat > 0) {
    return { marge: (ligne.pu - prixAchat) * ligne.qte, reel: true };
  }
  return { marge: ligne.qte * ligne.pu * (1 - COUT_RATIO_FALLBACK), reel: false };
};
const calcMargeFacture = (facture, produits, receptionsStock) => {
  let marge = 0, ligneReelles = 0, ligneTotal = 0;
  (facture.lignes||[]).forEach(l => {
    const r = calcMargeLigne(l, produits, receptionsStock);
    marge += r.marge;
    ligneTotal++;
    if (r.reel) ligneReelles++;
  });
  return { marge, ligneReelles, ligneTotal };
};

// ═══════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// PDF GENERATOR
// ═══════════════════════════════════════════════════════════════════
// Ouvre un document HTML dans un nouvel onglet et déclenche directement la boîte
// d'impression du navigateur (qui propose "Enregistrer en PDF" comme destination) —
// au lieu de télécharger un fichier .html qu'il faudrait rouvrir manuellement.
// (Un rendu "vrai PDF" auto-téléchargé via html2canvas a été essayé puis abandonné :
// mise en page dégradée — polices/espacements mal reproduits en captures d'écran.
// La boîte d'impression, elle, produit un PDF fidèle au HTML/CSS d'origine.)
const ouvrirEtImprimer = (html, nomFichierSecours) => {
  const fenetre = window.open("", "_blank");
  if (!fenetre) {
    // Pop-up bloquée par le navigateur : on retombe sur le téléchargement du fichier.
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichierSecours;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  fenetre.document.write(html);
  fenetre.document.close();
  fenetre.onload = () => { try { fenetre.print(); } catch(e) {} };
};

// opts.retour : renvoie le HTML au lieu d'ouvrir la fenêtre (impression groupée)
// opts.qrId   : identifiant unique du QR code (plusieurs factures dans une même page)
const generatePDF = (facture, client, impayees = [], soldeClient = 0, soldeDetail = [], opts = {}) => {
  const qrId = opts.qrId || "qrcode";
  const lignes = facture.lignes || [];
  // Les lignes de consigne manuelle (ajout/retour de vidange) sortent de l'assiette
  // TVA au même titre que les consignes normales — voir totalFact() plus haut.
  // Le transport (TRANSPORT_MANUEL) est traité à part : TVA standard fixe (TVA_TRANSPORT_PCT).
  const isNC = facture.type_document === "note_credit";
  const sousTotal = lignes.reduce((s, l) => (l.produitId==="CONSIGNE_MANUELLE"||l.produitId==="TRANSPORT_MANUEL"||l.produitId==="NOTE_CREDIT") ? s : s + l.qte * l.pu, 0);
  const totalCreditAppl = lignes.reduce((s, l) => s + (l.produitId==="NOTE_CREDIT" ? l.qte * l.pu : 0), 0);
  const totalConsignes = lignes.reduce((s, l) => s + (l.produitId==="CONSIGNE_MANUELLE" ? l.qte * l.pu : l.qte * (l.consigne || 0)), 0);
  const totalTransport = lignes.reduce((s, l) => s + (l.produitId==="TRANSPORT_MANUEL" ? l.qte * l.pu : 0), 0);

  // Le taux de TVA est figé au moment de la création de la facture (tva_pct).
  // Pour les factures créées avant ce correctif (champ absent), on retombe sur
  // l'ancien calcul dynamique basé sur la région actuelle du client, pour ne
  // pas changer rétroactivement un document déjà émis.
  const tvaPct = facture.tva_pct != null ? facture.tva_pct : (clientEstExonere(client) ? 0 : 3);
  const tvaVal = sousTotal * tvaPct / 100;
  const tvaTransportVal = totalTransport * TVA_TRANSPORT_PCT / 100;
  const total = sousTotal + tvaVal + totalConsignes + totalTransport + tvaTransportVal + totalCreditAppl; // vidanges + transport inclus, moins notes de crédit

  const fmtEur = (n) => Number(n || 0).toFixed(2).replace(".", ",") + " €";
  const paiementsFact = isNC ? [] : (facture.paiements || []);
  const resteDuFact = Math.max(0, total - paiementsFact.reduce((s,p)=>s+(parseFloat(p.montant)||0),0));

  const rows = lignes.map(l0 => { const l = {...l0, isCredit: l0.isCredit || l0.produitId==="NOTE_CREDIT"}; return `
    <tr>
      <td style="text-align:center;font-weight:600;color:${l.isCredit?'#059669':'#111'}">${l.isCredit ? "♻" : l.qte}</td>
      <td style="color:${l.isCredit?'#059669':'inherit'};font-style:${l.isCredit?'italic':'normal'}">${l.nom}</td>
      <td style="text-align:center;color:#555">${l.consigne > 0 ? fmtEur(l.qte * l.consigne) : ""}</td>
      <td style="text-align:right">${l.isCredit ? "" : fmtEur(l.pu)}</td>
      <td style="text-align:right;font-weight:600;color:${l.isCredit?'#059669':'inherit'}">${fmtEur(l.qte * l.pu)}</td>
    </tr>
  `; }).join("");

  const emptyRows = Array(Math.max(0, 5 - lignes.length)).fill("").map(() => `
    <tr><td>&nbsp;</td><td></td><td></td><td></td><td style="text-align:right;color:#ccc">—</td></tr>
  `).join("");

  // Impayées section
  // Calculate solde consignes after this invoice
  const newConsignes = lignes.filter(l => l.consigne > 0);
  const totalNouvellesConsignes = newConsignes.reduce((s,l) => s + l.qte * l.consigne, 0);
  const creditDeduit = lignes.filter(l => l.isCredit).reduce((s,l) => s + Math.abs(l.qte * l.pu), 0);

  const soldeConsignesHTML = (totalNouvellesConsignes > 0 || soldeClient > 0) ? `
    <div class="consignes-box">
      <p>Consignes à rendre</p>
      ${soldeDetail.length > 0 ? soldeDetail.map(d => `
        <div style="display:flex;justify-content:space-between;color:#555">
          <span>${d.nom}</span><span>${d.solde} cs</span>
        </div>
      `).join("") : newConsignes.map(l => `
        <div style="display:flex;justify-content:space-between;color:#555">
          <span>${l.nom}</span><span>${l.qte} cs</span>
        </div>
      `).join("")}
      <div style="border-top:1px solid #EAEAEA;margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-weight:600;color:#111">
        <span>Valeur totale</span><span>${fmtEur(soldeClient + totalNouvellesConsignes - creditDeduit)}</span>
      </div>
    </div>
  ` : "";

  const impayeesHTML = impayees.length > 0 ? `
    <div class="impayees">
      <p class="impayees-title">Factures impayées</p>
      ${impayees.map(f => {
        const ft = (f.paiements && f.paiements.length) ? resteFact(f) : (f.lignes||[]).reduce((s,l) => s + l.qte*(l.pu+(l.consigne||0)), 0);
        return `<div style="display:flex;justify-content:space-between;color:#555">
          <span>${f.numero}</span>
          <span>${fmtEur(ft)}</span>
        </div>`;
      }).join("")}
      <div style="border-top:1px solid #EAEAEA;margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-weight:600;color:#111">
        <span>Total dû</span>
        <span>${fmtEur(impayees.reduce((s,f) => s + (f.lignes||[]).reduce((ss,l) => ss + l.qte*(l.pu+(l.consigne||0)), 0), 0))}</span>
      </div>
    </div>
  ` : "";

  const payeeStampHTML = facture.statut === "Payée" ? `
    <div class="paid-stamp">
      <b>Payée</b>${facture.date_paiement ? " le " + facture.date_paiement : ""}${facture.mode_paiement ? " · " + facture.mode_paiement : ""}
    </div>
  ` : "";

  const noteClientHTML = facture.note_client ? `
    <div class="note-client">${facture.note_client}</div>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${isNC ? "Note de crédit" : "Facture"} ${facture.numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:9pt; color:#111; padding:12mm 14mm; min-height:100vh; display:flex; flex-direction:column; }
    .no-print { position:fixed; top:8px; right:8px; z-index:999; }
    .no-print button { padding:8px 16px; background:#1D4ED8; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; }
    h1 { font-size:12.5pt; font-weight:700; color:#1D4ED8; margin-bottom:2px; letter-spacing:-0.2px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .company p { font-size:8pt; line-height:1.5; color:#333; }
    .logo img { width:70px; opacity:0.9; }
    hr { border:none; border-top:1px solid #EAEAEA; margin:12px 0; }
    .meta { display:flex; justify-content:space-between; margin:16px 0; font-size:8.5pt; }
    .meta-left p { line-height:1.9; color:#555; }
    .meta-left p strong { color:#111; }
    .client-name { font-size:11pt; font-weight:600; color:#111; }
    .paid-stamp { display:inline-block; margin-top:8px; padding:3px 8px; background:#F0F5FF; border-radius:4px; font-size:7.5pt; color:#1D4ED8; font-weight:600; }
    .note-client { margin:14px 0; padding:8px 0 8px 10px; border-left:2px solid #C7D6FB; font-size:8pt; color:#555; font-style:italic; }
    table { width:100%; border-collapse:collapse; margin:16px 0; font-size:8.5pt; }
    thead tr { border-bottom:1.5px solid #111; }
    th { padding:0 6px 7px; text-align:left; font-size:7pt; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.4px; }
    td { padding:7px 6px; border-bottom:1px solid #F0F0F0; color:#222; }
    .bottom { display:flex; justify-content:space-between; align-items:flex-start; margin-top:16px; }
    .sig { font-size:7.5pt; color:#AAA; line-height:2.2; }
    .totals-table { width:250px; font-size:8.5pt; }
    .totals-table td { padding:4px 0; border:none; color:#666; }
    .totals-table .sub-row td { font-weight:700; color:#111; border-top:1px solid #ddd; }
    .totals-table .total-row td { border-top:1.5px solid #1D4ED8; font-weight:700; font-size:11.5pt; padding-top:8px; color:#1D4ED8; }
    .footer { margin-top:auto; padding-top:14px; border-top:1px solid #EAEAEA; font-size:7pt; color:#999; }
    .footer .bank { color:#555; }
    .impayees { padding:10px 12px; background:#FAFAFA; border-radius:6px; font-size:7.5pt; }
    .impayees-title { font-weight:700; color:#111; margin-bottom:6px; font-size:7pt; text-transform:uppercase; letter-spacing:0.4px; }
    .consignes-box { padding:10px 12px; background:#FAFAFA; border-radius:6px; font-size:7.5pt; }
    .consignes-box p { font-weight:700; color:#111; margin-bottom:6px; font-size:7pt; text-transform:uppercase; letter-spacing:0.4px; }
    @media print {
      .no-print { display:none; }
      body { padding:8mm 10mm; }
    }
  </style>
</head>
<body>

<div class="no-print">
  <button onclick="window.print()">🖨️ Imprimer</button>
</div>

<div>
<!-- HEADER -->
<div class="header">
  <div class="company">
    <h1>HONDRO TRADING &amp; DISTRIBUTION</h1>
    <p>
      Hondro Trading S.à r.l. · RCS B224095<br/>477, route de Thionville · L-5887 Alzingen<br/>
      Tél : 661-620-620 · TVA : LU35355446
    </p>
  </div>
  <div class="logo">
    <img src="${LOGO}" alt="Hondro"/>
  </div>
</div>

<hr/>

<!-- DATE + CLIENT -->
<div class="meta">
  <div class="meta-left">
    <p><strong>Date :</strong> ${facture.date || ""}</p>
    <p><strong>${isNC ? "N° Note de crédit" : "N° Facture"} :</strong> <strong>${facture.numero}</strong></p>
    ${isNC ? (facture.facture_origine ? `<p><strong>Facture concernée :</strong> ${facture.facture_origine}</p>` : "") : `<p><strong>Échéance :</strong> ${facture.echeance || ""}</p>`}
    ${payeeStampHTML}
  </div>
  <div style="text-align:right">
    <p style="font-size:7.5pt;color:#555;margin-bottom:2px">${isNC ? "Crédit en faveur de :" : "Facturé à :"}</p>
    <p class="client-name">${facture.client_nom || ""}</p>
    <p style="font-size:8pt;color:#333;line-height:1.6">
      ${client?.adresse || facture.client_adresse || ""}<br/>
      ${client?.telephone ? "Tél : "+client.telephone : ""}<br/>
      ${client?.tva || facture.client_tva ? "TVA : "+(client?.tva || facture.client_tva) : ""}
    </p>
  </div>
</div>

<hr/>

${noteClientHTML}

<!-- TABLE -->
<table>
  <thead>
    <tr>
      <th style="width:45px;text-align:center">Qté</th>
      <th>Description</th>
      <th style="width:90px;text-align:center">Vidanges</th>
      <th style="width:80px;text-align:right">Prix unit.</th>
      <th style="width:80px;text-align:right">Montant</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    ${emptyRows}
  </tbody>
</table>

<!-- BOTTOM -->
<div class="bottom">
  <div style="width:52%">
    ${isNC ? `<div style="font-size:8pt;color:#333;line-height:1.6"><strong>Motif :</strong> ${facture.notes || ""}<br/>Ce crédit est déductible de vos prochaines factures chez Hondro Trading &amp; Distribution.</div>` : `<div class="sig">
      Reçu marchandise en bon état : ──────────────────────<br/>
      Pour acquit Hondro Trading S.à r.l. : ─────────────
    </div>`}
  </div>
  <div>
    ${isNC ? `<table class="totals-table">
      <tr class="total-row"><td>MONTANT DU CRÉDIT</td><td style="text-align:right">${fmtEur(Math.abs(total))}</td></tr>
      <tr><td>Crédit disponible</td><td style="text-align:right">${fmtEur(facture.credit_restant != null ? facture.credit_restant : Math.abs(total))}</td></tr>
      ${(facture.credit_utilisations || []).map(u => `<tr><td>Utilisé sur ${u.facture} (${u.date})</td><td style="text-align:right">−${fmtEur(u.montant)}</td></tr>`).join("")}
    </table>` : ""}
    ${isNC ? "" : `<table class="totals-table">
      <tr><td>Sous-total HT</td><td style="text-align:right">${fmtEur(sousTotal)}</td></tr>
      <tr><td>TVA ${tvaPct}%</td><td style="text-align:right">${fmtEur(tvaVal)}</td></tr>
      <tr class="sub-row"><td>Total boissons (TTC)</td><td style="text-align:right">${fmtEur(sousTotal + tvaVal)}</td></tr>
      ${totalTransport > 0 ? `
      <tr><td>Transport HT</td><td style="text-align:right">${fmtEur(totalTransport)}</td></tr>
      <tr><td>TVA transport ${TVA_TRANSPORT_PCT}%</td><td style="text-align:right">${fmtEur(tvaTransportVal)}</td></tr>
      ` : ""}
      <tr class="sub-row"><td>Total vidanges</td><td style="text-align:right">${fmtEur(totalConsignes)}</td></tr>
      ${totalCreditAppl !== 0 ? `<tr><td>Note(s) de crédit</td><td style="text-align:right;color:#059669">${fmtEur(totalCreditAppl)}</td></tr>` : ""}
      <tr class="total-row"><td>TOTAL À PAYER</td><td style="text-align:right;white-space:nowrap">${fmtEur(total)}</td></tr>
      ${paiementsFact.map(p => `<tr><td>Acompte reçu le ${p.date}</td><td style="text-align:right;white-space:nowrap;color:#059669">−${fmtEur(p.montant)}</td></tr>`).join("")}
      ${paiementsFact.length && facture.statut !== "Payée" ? `<tr class="total-row"><td>RESTE À PAYER</td><td style="text-align:right;white-space:nowrap">${fmtEur(resteDuFact)}</td></tr>` : ""}
    </table>`}
  </div>
</div>
</div>

<!-- FOOTER -->
<div class="footer">
  <p>Pour toute question : <strong>Hondro Trading S.à r.l.</strong> · 661-620-620</p>
  ${(soldeConsignesHTML || impayeesHTML) ? `
  <div style="display:flex;gap:14px;align-items:flex-start;margin:14px 0">
    <div style="flex:1;min-width:0">${soldeConsignesHTML}</div>
    <div style="flex:1;min-width:0">${impayeesHTML}</div>
  </div>
  ` : ""}
  ${isNC ? "" : `<p class="bank">Conditions : 7 jours date de facture</p>
  <div style="display:flex;justify-content:flex-end;gap:28px;margin-top:8px">
    ${BANQUES.map(b => `<div style="font-size:7.5pt;line-height:1.45;color:#333">
      <strong>${b.nom}</strong><br/>IBAN : ${b.ibanFmt}<br/>BIC : ${b.bic}<br/>Titulaire : ${b.titulaire}
    </div>`).join("")}
  </div>`}
  ${isNC ? "" : `  <p style="margin-top:14px;padding-top:10px;border-top:1px solid #EAEAEA;font-size:6.5pt;color:#999;font-style:italic;text-align:justify;">La présente facture vaut contrat. Par sa signature, le client reconnaît la dette et accepte les présentes conditions ainsi que les General Terms &amp; Conditions de Hondro Trading S.à r.l. Toute contestation doit être formulée par écrit dans un délai de 8 jours à compter de la date de la facture. Le droit luxembourgeois est applicable et les tribunaux de Luxembourg sont exclusivement compétents.</p>`}
</div>

</body>
</html>`;

  if (opts.retour) return html;
  ouvrirEtImprimer(html, "Facture_" + facture.numero + ".html");
};

// Assemble plusieurs factures (HTML complets issus de generatePDF avec opts.retour)
// en un seul document : une facture par page, une seule fenêtre d'impression.
const assemblerFacturesPDF = (htmls) => {
  const style = (htmls[0].match(/<style>([\s\S]*?)<\/style>/) || [,""])[1];
  const corps = htmls.map(h => {
    let b = (h.match(/<body>([\s\S]*)<\/body>/) || [,""])[1];
    b = b.replace(/<div class="no-print">[\s\S]*?<\/div>\s*/, "");
    return `<section class="fpage">${b}</section>`;
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>Factures (${htmls.length})</title>
<style>${style}
body { display:block; min-height:0; padding:0; }
.fpage { display:flex; flex-direction:column; min-height:100vh; padding:12mm 14mm; page-break-after:always; break-after:page; }
.fpage:last-child { page-break-after:auto; break-after:auto; }
@media print { body { padding:0; } .fpage { padding:8mm 10mm; } }
</style></head><body>
<div class="no-print"><button onclick="window.print()">🖨️ Imprimer (${htmls.length} factures)</button></div>
${corps}
</body></html>`;
};

// Facture "diverse" : facture libre à un tiers non-client (ex : repreneur de
// palettes). Même identité visuelle que les factures normales, mais sans
// dépendance à clients/commandes/consignes — destinataire et lignes libres.
const generatePDFDiverse = (fd) => {
  const lignes = fd.lignes || [];
  const sousTotal = lignes.reduce((s,l)=>s+l.qte*l.pu, 0);
  const tvaPct = fd.tva_pct != null ? fd.tva_pct : 0;
  const tvaVal = sousTotal * tvaPct / 100;
  const total = sousTotal + tvaVal;

  const fmtEur = (n) => Number(n || 0).toFixed(2).replace(".", ",") + " €";

  const rows = lignes.map(l => `
    <tr>
      <td style="text-align:center;font-weight:600">${l.qte}</td>
      <td>${l.description}</td>
      <td style="text-align:right">${fmtEur(l.pu)}</td>
      <td style="text-align:right;font-weight:600">${fmtEur(l.qte * l.pu)}</td>
    </tr>
  `).join("");

  const emptyRows = Array(Math.max(0, 5 - lignes.length)).fill("").map(() => `
    <tr><td>&nbsp;</td><td></td><td></td><td style="text-align:right;color:#ccc">—</td></tr>
  `).join("");

  const payeeStampHTML = fd.statut === "Payée" ? `
    <div class="paid-stamp"><b>Payée</b>${fd.date_paiement ? " le " + fd.date_paiement : ""}${fd.mode_paiement ? " · " + fd.mode_paiement : ""}</div>
  ` : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${fd.numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:9pt; color:#111; padding:12mm 14mm; min-height:100vh; display:flex; flex-direction:column; }
    .no-print { position:fixed; top:8px; right:8px; z-index:999; }
    .no-print button { padding:8px 16px; background:#1D4ED8; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; }
    h1 { font-size:12.5pt; font-weight:700; color:#1D4ED8; margin-bottom:2px; letter-spacing:-0.2px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
    .company p { font-size:8pt; line-height:1.5; color:#333; }
    hr { border:none; border-top:1px solid #EAEAEA; margin:12px 0; }
    .meta { display:flex; justify-content:space-between; margin:16px 0; font-size:8.5pt; }
    .meta-left p { line-height:1.9; color:#555; }
    .meta-left p strong { color:#111; }
    .client-name { font-size:11pt; font-weight:600; color:#111; }
    .paid-stamp { display:inline-block; margin-top:8px; padding:3px 8px; background:#F0F5FF; border-radius:4px; font-size:7.5pt; color:#1D4ED8; font-weight:600; }
    table { width:100%; border-collapse:collapse; margin:16px 0; font-size:8.5pt; }
    thead tr { border-bottom:1.5px solid #111; }
    th { padding:0 6px 7px; text-align:left; font-size:7pt; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.4px; }
    td { padding:7px 6px; border-bottom:1px solid #F0F0F0; color:#222; }
    .bottom { display:flex; justify-content:flex-end; margin-top:16px; }
    .totals-table { width:220px; font-size:8.5pt; }
    .totals-table td { padding:4px 0; border:none; color:#666; }
    .totals-table .total-row td { border-top:1.5px solid #1D4ED8; font-weight:700; font-size:11.5pt; padding-top:8px; color:#1D4ED8; }
    .footer { margin-top:auto; padding-top:14px; border-top:1px solid #EAEAEA; font-size:7pt; color:#999; }
    .note { margin:14px 0; padding:8px 0 8px 10px; border-left:2px solid #C7D6FB; font-size:8pt; color:#555; font-style:italic; }
    @media print { .no-print { display:none; } body { padding:8mm 10mm; } }
  </style>
</head>
<body>

<div class="no-print"><button onclick="window.print()">🖨️ Imprimer</button></div>

<div>
<div class="header">
  <div class="company">
    <h1>HONDRO TRADING &amp; DISTRIBUTION</h1>
    <p>Hondro Trading S.à r.l. · RCS B224095<br/>477, route de Thionville · L-5887 Alzingen<br/>Tél : 661-620-620 · TVA : LU35355446</p>
  </div>
</div>

<hr/>

<div class="meta">
  <div class="meta-left">
    <p><strong>Date :</strong> ${fd.date || ""}</p>
    <p><strong>N° Facture :</strong> <strong>${fd.numero}</strong></p>
    <p><strong>Échéance :</strong> ${fd.echeance || ""}</p>
    ${payeeStampHTML}
  </div>
  <div style="text-align:right">
    <p style="font-size:7.5pt;color:#555;margin-bottom:2px">Facturé à :</p>
    <p class="client-name">${fd.destinataire_nom || ""}</p>
    <p style="font-size:8pt;color:#333;line-height:1.6">
      ${(fd.destinataire_adresse||"").replace(/\n/g,"<br/>")}
      ${fd.destinataire_tva ? "<br/>TVA : "+fd.destinataire_tva : ""}
    </p>
  </div>
</div>

<hr/>

${fd.notes ? `<div class="note">${fd.notes}</div>` : ""}

<table>
  <thead>
    <tr>
      <th style="width:45px;text-align:center">Qté</th>
      <th>Description</th>
      <th style="width:80px;text-align:right">Prix unit.</th>
      <th style="width:80px;text-align:right">Montant</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    ${emptyRows}
  </tbody>
</table>

<div class="bottom">
  <table class="totals-table">
    <tr><td>Sous-total HT</td><td style="text-align:right"><strong>${fmtEur(sousTotal)}</strong></td></tr>
    <tr><td>TVA ${tvaPct}%</td><td style="text-align:right">${fmtEur(tvaVal)}</td></tr>
    <tr class="total-row"><td>TOTAL TTC</td><td style="text-align:right">${fmtEur(total)}</td></tr>
  </table>
</div>
</div>

<div class="footer">
  <p>Pour toute question : <strong>Hondro Trading S.à r.l.</strong> · 661-620-620</p>
  <p>BIC: BGLLLULL · LU14 0030 1895 5248 0000</p>
  <p>Titulaire : ${TITULAIRE_COMPTE}</p>
</div>

</body>
</html>`;

  ouvrirEtImprimer(html, "Facture_" + fd.numero + ".html");
};

// Bon de livraison : document de preuve de livraison, distinct de la facture.
// Pas de prix — juste les quantités livrées et une zone de signature.
const generateBonLivraison = (commande, client) => {
  const lignes = commande.produits || [];
  const totalCaisses = lignes.reduce((s, p) => s + p.qte, 0);
  const numeroBL = "BL-" + new Date((commande.date_livraison || commande.date_commande || new Date().toISOString())).getFullYear() + "-" + String(commande.id).padStart(5, "0");
  const dateLivraison = commande.date_livraison || commande.date_commande || new Date().toISOString().split("T")[0];

  const rows = lignes.map(p => `
    <tr>
      <td style="text-align:center;font-weight:700;font-size:11pt">${p.qte}</td>
      <td style="font-size:10pt">${p.nom}</td>
    </tr>
  `).join("");

  const emptyRows = Array(Math.max(0, 6 - lignes.length)).fill("").map(() => `
    <tr><td>&nbsp;</td><td></td></tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Bon de livraison ${numeroBL}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:9pt; color:#222; padding:14mm 16mm; min-height:100vh; display:flex; flex-direction:column; }
    .no-print { position:fixed; top:8px; right:8px; z-index:999; }
    .no-print button { padding:8px 16px; background:#1D4ED8; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; }
    @media print { .no-print { display:none; } }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
    .company h1 { font-size:12.5pt; font-weight:700; color:#1D4ED8; margin-bottom:3px; letter-spacing:-0.2px; }
    .company p { font-size:8pt; color:#666; line-height:1.5; }
    .logo img { width:48px; height:48px; object-fit:contain; opacity:0.9; }
    hr { border:none; border-top:1px solid #EAEAEA; margin:12px 0; }
    .title-row { display:flex; justify-content:space-between; align-items:baseline; margin:16px 0; }
    .title-row h2 { font-size:11pt; font-weight:700; color:#111; text-transform:uppercase; letter-spacing:0.4px; }
    .title-row .ref { text-align:right; font-size:8.5pt; color:#666; }
    .title-row .ref b { color:#111; }
    .meta { display:flex; justify-content:space-between; margin-bottom:16px; }
    .meta-left p { font-size:8.5pt; margin-bottom:4px; color:#555; }
    .meta-left p strong { color:#111; }
    .client-name { font-size:10.5pt; font-weight:600; color:#111; margin-bottom:2px; }
    table { width:100%; border-collapse:collapse; margin-top:12px; font-size:8.5pt; }
    thead tr { border-bottom:1.5px solid #111; }
    th { text-align:left; padding:0 8px 7px; font-size:7pt; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:0.4px; }
    td { padding:7px 8px; border-bottom:1px solid #F0F0F0; color:#222; }
    .total-row td { border-top:1.5px solid #1D4ED8; font-weight:700; font-size:10pt; padding-top:8px; color:#1D4ED8; }
    .sig-zone { display:flex; justify-content:space-between; margin-top:40px; gap:24px; }
    .sig-box { flex:1; }
    .sig-box .label { font-size:8.5pt; font-weight:600; color:#111; margin-bottom:40px; }
    .sig-box .line { border-top:1px solid #111; padding-top:4px; font-size:7.5pt; color:#999; }
    .footer { margin-top:auto; padding-top:14px; border-top:1px solid #EAEAEA; text-align:center; font-size:7pt; color:#999; }
    .notes-box { margin-top:14px; padding:8px 0 8px 10px; border-left:2px solid #C7D6FB; font-size:8pt; color:#555; font-style:italic; }
  </style>
</head>
<body>
  <div class="no-print"><button onclick="window.print()">🖨️ Imprimer / PDF</button></div>

  <div>
  <div class="header">
    <div class="company">
      <h1>HONDRO TRADING &amp; DISTRIBUTION</h1>
      <p>
        Hondro Trading S.à r.l. · RCS B224095<br/>477, route de Thionville · L-5887 Alzingen<br/>
        Tél : 661-620-620 · TVA : LU35355446
      </p>
    </div>
    <div class="logo"><img src="${LOGO}" alt="Hondro"/></div>
  </div>

  <hr/>

  <div class="title-row">
    <h2>Bon de livraison</h2>
    <div class="ref">
      <div><b>${numeroBL}</b></div>
      <div>${dateLivraison}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-left">
      <p><strong>Chauffeur</strong> · ${commande.chauffeur === "A" ? "Sefa" : commande.chauffeur === "B" ? "Mikail" : "—"}</p>
      <p><strong>Zone</strong> · ${commande.client_region || "—"}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:7.5pt;color:#999;margin-bottom:2px">Livré à</p>
      <p class="client-name">${commande.client_nom || ""}</p>
      <p style="font-size:8pt;color:#666;line-height:1.6">
        ${commande.client_adresse || client?.adresse || ""}<br/>
        ${client?.telephone ? "Tél : " + client.telephone : ""}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:70px;text-align:center">Quantité</th>
        <th>Produit</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${emptyRows}
      <tr class="total-row">
        <td style="text-align:center">${totalCaisses}</td>
        <td>Total caisses livrées</td>
      </tr>
      ${commande.transport > 0 ? `
      <tr>
        <td style="text-align:center">🚚</td>
        <td>Transport — ${Number(commande.transport).toFixed(2).replace(".", ",")} €</td>
      </tr>
      ` : ""}
    </tbody>
  </table>

  ${commande.notes ? `<div class="notes-box">${commande.notes}</div>` : ""}

  <div class="sig-zone">
    <div class="sig-box">
      <div class="label">Signature chauffeur</div>
      <div class="line">Hondro Trading S.à r.l.</div>
    </div>
    <div class="sig-box">
      <div class="label">Signature client — reçu en bon état</div>
      <div class="line">${commande.client_nom || ""}</div>
    </div>
  </div>
  </div>

  <div class="footer">
    <p>Ce bon de livraison confirme la remise des marchandises listées ci-dessus. Toute réclamation doit être signalée sous 48h.</p>
    <p>Hondro Trading S.à r.l. · 661-620-620</p>
  </div>
</body>
</html>`;

  ouvrirEtImprimer(html, numeroBL + ".html");
};


// Carte des clients — Leaflet chargé dynamiquement via CDN (gratuit, sans clé API)
function ClientsMap({ clients }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(typeof window !== "undefined" && !!window.L);

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => { if (window.L) { setLeafletReady(true); clearInterval(check); } }, 200);
    }
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || !window.L) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    const map = window.L.map(mapRef.current).setView([49.75, 6.15], 10);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    const bounds = [];
    clients.forEach(c => {
      const color = c.categorie_fidelite === "Gold" ? "#D97706" : c.categorie_fidelite === "Silver" ? "#64748B" : "#1D4ED8";
      const marker = window.L.circleMarker([c.lat, c.lng], {
        radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9,
      }).addTo(map);
      marker.bindPopup(`<strong>${c.nom || ""}</strong><br/>${c.adresse || ""}<br/><span style="color:#6B7280">${c.type || ""}${c.categorie_fidelite ? " · " + c.categorie_fidelite : ""}</span>`);
      bounds.push([c.lat, c.lng]);
    });
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] });

    mapInstanceRef.current = map;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [leafletReady, clients]);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: 620, borderRadius: 8, background: "#F1F5F9" }} />
      {!leafletReady && <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF", fontSize: 13 }}>Chargement de la carte...</div>}
    </div>
  );
}

function ClientSelected({cl, lastCmd, cmdProduits, onClear, onRepeat, S, badge, getChauffeur}) {
  return(
    <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"8px 10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontWeight:600,fontSize:13}}>{cl?.nom}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{cl?.region} · {cl?.type}</div>
          <span style={S.badge("#DBEAFE","#1D4ED8")}>🚚 Chauffeur {getChauffeur(cl?.region||"", cl?.pays)}</span>
        </div>
        <button onClick={onClear} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:16}}>✕</button>
      </div>
      {lastCmd&&cmdProduits.length===0&&(
        <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #BFDBFE"}}>
          <div style={{fontSize:11,color:"#6B7280",marginBottom:4}}>Dernière commande :</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
            {(lastCmd.produits||[]).map((p,i)=>(
              <span key={i} style={{fontSize:10,background:"#DBEAFE",color:"#1D4ED8",padding:"2px 6px",borderRadius:4}}>
                {p.nom} ×{p.qte}
              </span>
            ))}
          </div>
          <button onClick={()=>onRepeat(lastCmd.produits||[])}
            style={{...S.btn("#1D4ED8"),padding:"3px 10px",fontSize:11,width:"100%"}}>
            📋 Reprendre la dernière commande
          </button>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════
// Champ mot de passe — défini au niveau module (pas à l'intérieur de LoginPage) :
// un composant redéfini à chaque rendu est traité par React comme un type différent,
// ce qui démonte/remonte l'<input> à chaque frappe et fait perdre le focus (il fallait
// re-cliquer dans le champ après chaque lettre). En le sortant ici, le composant garde
// la même identité entre les rendus et le focus n'est plus perdu.
const LOGIN_INPUT_STYLE = { width: "100%", padding: "11px 13px", background: "#fff", border: "1px solid #E3E7ED", borderRadius: 8, color: "#0F172A", fontSize: 14, outline: "none", boxSizing: "border-box" };
const LOGIN_LABEL_STYLE = { fontSize: 11, fontWeight: 700, color: "#5D6B82", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" };
function PwField({label, value, onChange, onEnter, show, setShow, placeholder}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={LOGIN_LABEL_STYLE}>{label}</label>
      <div style={{position:"relative"}}>
        <input type={show?"text":"password"} value={value} onChange={onChange}
          onKeyDown={e => e.key === "Enter" && onEnter && onEnter()}
          placeholder={placeholder||"••••••••"} style={{...LOGIN_INPUT_STYLE,paddingRight:38}}/>
        <button type="button" onClick={()=>setShow(s=>!s)}
          style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94A3B8",display:"flex"}}>
          <Icon name={show?"eyeOff":"eye"} size={17}/>
        </button>
      </div>
    </div>
  );
}

function LoginPage({ onLogin, recoveryToken, onRecoveryDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(recoveryToken ? "newpassword" : "login"); // login | reset | newpassword
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [isNarrow, setIsNarrow] = useState(()=>typeof window!=="undefined"&&window.innerWidth<=880);
  useEffect(()=>{
    const onResize=()=>setIsNarrow(window.innerWidth<=880);
    window.addEventListener("resize",onResize);
    return ()=>window.removeEventListener("resize",onResize);
  },[]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await sbAuth("token?grant_type=password", { email, password });
      if (data.access_token) {
        const session = {
          access_token: data.access_token,
          expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
          user: data.user,
        };
        localStorage.setItem("bossok_session", JSON.stringify(session));
        onLogin(session);
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError("Entrez votre email"); return; }
    setLoading(true);
    setError("");
    try {
      const redirectTo = encodeURIComponent(window.location.origin);
      await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${redirectTo}`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetSent(true);
    } catch(e) {
      setError("Erreur lors de l'envoi");
    }
    setLoading(false);
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    if (newPassword !== newPasswordConfirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${recoveryToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoverySuccess(true);
      } else {
        setError(data.msg || data.error_description || "Lien expiré ou invalide. Redemande un email de réinitialisation.");
      }
    } catch(e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  const inputStyle = { width: "100%", padding: "11px 13px", background: "#fff", border: "1px solid #E3E7ED", borderRadius: 8, color: "#0F172A", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#5D6B82", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" };
  const primaryBtn = (busy) => ({ width: "100%", padding: "12px 0", background: busy ? "#93B4EE" : "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 });
  const errorBox = (msg) => (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", color: "#991B1B", fontSize: 13, marginBottom: 16, display:"flex", alignItems:"center", gap:8 }}>
      <Icon name="danger" size={15}/> {msg}
    </div>
  );
  const successBox = (msg) => (
    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "14px", color: "#166534", fontSize: 13, margin: "16px 0", display:"flex", alignItems:"center", gap:8 }}>
      <Icon name="check" size={16}/> {msg}
    </div>
  );
  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", minHeight: "100vh", display: "flex", background:"#fff" }}>
      {!isNarrow && (
        <div style={{ flex:"0 0 44%", background:"linear-gradient(160deg,#0F1B2E 0%,#16283F 55%,#1D4ED8 140%)", color:"#fff", padding:"48px 44px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
          <div style={{position:"absolute",inset:0,opacity:0.06,backgroundImage:"radial-gradient(circle at 20% 20%, #fff 0, transparent 45%), radial-gradient(circle at 80% 70%, #fff 0, transparent 40%)"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:56}}>
              <img src={LOGO} alt="Hondro" style={{width:34,height:34,objectFit:"contain",borderRadius:7}}/>
              <span style={{fontWeight:800,fontSize:15,letterSpacing:"-0.2px"}}>Hondro</span>
            </div>
            <div style={{display:"inline-block",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:99,padding:"5px 14px",fontSize:10.5,fontWeight:700,letterSpacing:"0.08em",marginBottom:22}}>
              DISTRIBUTION DE BOISSONS
            </div>
            <div style={{fontSize:34,fontWeight:800,lineHeight:1.2,marginBottom:18,letterSpacing:"-0.5px"}}>
              Toute votre<br/>distribution,<br/>un seul outil.
            </div>
            <div style={{fontSize:14,color:"#C7D2E3",lineHeight:1.6,maxWidth:340}}>
              Clients, commandes, stock, factures et consignes réunis dans une seule plateforme.
            </div>
            <div style={{display:"grid",gap:12,marginTop:34}}>
              {["Facturation & consignes","Stock en temps réel","Clients, zones & tournées"].map(t=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="check" size={12}/>
                  </div>
                  <span style={{fontSize:13,color:"#E2E8F0"}}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{position:"relative",fontSize:11.5,color:"#7C8CA8"}}>© {new Date().getFullYear()} Hondro Trading S.à r.l.</div>
        </div>
      )}

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:isNarrow?"32px 20px":"40px" }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <img src={LOGO} alt="Hondro" style={{width:36,height:36,objectFit:"contain",borderRadius:8}}/>
            <span style={{fontWeight:800,fontSize:17,color:"#0F172A",letterSpacing:"-0.2px"}}>Hondro</span>
          </div>
          <div style={{fontSize:10.5,fontWeight:700,color:"#1D4ED8",letterSpacing:"0.06em",marginBottom:26}}>ESPACE DE GESTION</div>

          {mode === "newpassword" ? (
            <>
              {!recoverySuccess ? (
                <>
                  <div style={{fontSize:20,fontWeight:800,color:"#0F172A",marginBottom:6}}>Nouveau mot de passe</div>
                  <div style={{ marginBottom: 22, fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                    Choisis ton nouveau mot de passe.
                  </div>
                  <PwField label="Nouveau mot de passe" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                    show={showPw} setShow={setShowPw}/>
                  <PwField label="Confirmer le mot de passe" value={newPasswordConfirm} onChange={e=>setNewPasswordConfirm(e.target.value)}
                    onEnter={handleSetNewPassword} show={showPw2} setShow={setShowPw2}/>
                  {error && errorBox(error)}
                  <button onClick={handleSetNewPassword} disabled={loading} style={primaryBtn(loading)}>
                    {loading ? "Enregistrement..." : "Définir le mot de passe"}
                  </button>
                </>
              ) : (
                <>
                  {successBox("Mot de passe mis à jour ! Tu peux maintenant te connecter.")}
                  <button onClick={onRecoveryDone} style={primaryBtn(false)}>Aller à la connexion</button>
                </>
              )}
            </>
          ) : mode === "login" ? (
            <>
              <div style={{fontSize:20,fontWeight:800,color:"#0F172A",marginBottom:6}}>Bienvenue</div>
              <div style={{fontSize:13,color:"#64748B",marginBottom:22}}>Connecte-toi à ton espace Hondro.</div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="votre@email.com" style={inputStyle}/>
              </div>
              <PwField label="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)}
                onEnter={handleLogin} show={showPw} setShow={setShowPw}/>
              <div style={{ textAlign: "right", marginBottom: 18, marginTop:-4 }}>
                <button onClick={() => { setMode("reset"); setError(""); setResetSent(false); }}
                  style={{ background: "none", border: "none", color: "#1D4ED8", fontSize: 12.5, fontWeight:600, cursor: "pointer" }}>
                  Mot de passe oublié ?
                </button>
              </div>
              {error && errorBox(error)}
              <button onClick={handleLogin} disabled={loading} style={primaryBtn(loading)}>
                {loading ? "Connexion..." : <>Se connecter <Icon name="arrowRight" size={15}/></>}
              </button>
            </>
          ) : (
            <>
              <div style={{fontSize:20,fontWeight:800,color:"#0F172A",marginBottom:6}}>Mot de passe oublié</div>
              <div style={{ marginBottom: 22, fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                Entre ton email et on t'enverra un lien pour réinitialiser ton mot de passe.
              </div>
              {!resetSent ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleReset()}
                      placeholder="votre@email.com" style={inputStyle}/>
                  </div>
                  {error && errorBox(error)}
                  <button onClick={handleReset} disabled={loading} style={{...primaryBtn(loading),marginBottom:12}}>
                    {loading ? "Envoi..." : "Envoyer le lien"}
                  </button>
                </>
              ) : successBox("Email envoyé ! Vérifie ta boîte mail et clique sur le lien pour choisir un nouveau mot de passe.")}
              <button onClick={() => { setMode("login"); setError(""); setResetSent(false); }}
                style={{ width: "100%", padding: "11px 0", background: "#F8FAFC", color: "#374151", border: "1px solid #E3E7ED", borderRadius: 8, fontSize: 13, fontWeight:600, cursor: "pointer" }}>
                ← Retour à la connexion
              </button>
            </>
          )}

          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop: 28, fontSize: 11.5, color: "#94A3B8" }}>
            <Icon name="lock" size={12}/> Accès sécurisé — Hondro Trading & Distribution
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// FILET DE SÉCURITÉ : capture les erreurs de rendu (écran blanc) au lieu
// de laisser React planter silencieusement, et les signale à Sentry.
// ═══════════════════════════════════════════════════════════════════
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    console.error("Erreur de rendu :", error, info);
    if (window.Sentry && typeof window.Sentry.captureException === "function") {
      window.Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F4F6F8",fontFamily:"system-ui,sans-serif",padding:24}}>
          <div style={{textAlign:"center",maxWidth:380,background:"#fff",padding:"32px 28px",borderRadius:14,border:"1px solid #E3E7ED",boxShadow:"0 4px 16px rgba(15,23,42,0.06)"}}>
            <div style={{width:44,height:44,borderRadius:12,background:"#FEE2E2",color:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <Icon name="warning" size={22}/>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:"#0F172A",marginBottom:8}}>Une erreur inattendue est survenue</div>
            <div style={{fontSize:13,color:"#64748B",marginBottom:22,lineHeight:1.5}}>L'erreur a été signalée automatiquement. Recharge la page pour continuer — tes données ne sont pas perdues.</div>
            <button onClick={()=>window.location.reload()} style={{padding:"10px 22px",background:"#1D4ED8",color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer"}}>Recharger la page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP WRAPPER
// ═══════════════════════════════════════════════════════════════════
export default function AppWrapper() {
  const [session, setSession] = useState(getSession());
  const [recoveryToken] = useState(() => {
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery") && hash.includes("access_token=")) {
      const match = hash.match(/access_token=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
    return null;
  });

  if (recoveryToken) {
    return <LoginPage onLogin={setSession} recoveryToken={recoveryToken} onRecoveryDone={() => {
      window.location.hash = "";
      window.location.reload();
    }} />;
  }
  if (!session) return <LoginPage onLogin={setSession} />;

  return (
    <div>
      <ErrorBoundary>
        <BossokApp session={session} onLogout={() => { localStorage.removeItem("bossok_session"); setSession(null); }} />
      </ErrorBoundary>
    </div>
  );
}


function App({ session, onLogout }) {
  // renamed internally
}

function BossokApp({ session, onLogout }) {
  // Rôle de l'utilisateur connecté : "staff" (équipe, accès complet) ou "comptable"
  // (lecture seule des factures uniquement). null = en cours de détermination.
  const [role, setRole] = useState(null);
  const lectureSeule = role === "comptable";
  const [pageState, setPage] = useState(()=>parseHash().page);
  const page = role === "comptable" ? "factures" : pageState;
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const [st, co] = await Promise.all([sb("rpc/is_staff", "POST", {}), sb("rpc/is_comptable", "POST", {})]);
        if (annule) return;
        setRole(st === true ? "staff" : co === true ? "comptable" : "staff");
      } catch (e) {
        if (annule) return;
        setError("Impossible de vérifier vos droits d'accès. Rechargez la page.");
        setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, []);
  const [pendingClientId, setPendingClientId] = useState(()=>{
    const {page: p, id} = parseHash();
    return p==="clients" ? id : null;
  });
  const isSyncingFromHash = useRef(false);
  const [isMobile, setIsMobile] = useState(()=>typeof window!=="undefined"&&window.innerWidth<=768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(()=>{
    const onResize = ()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener("resize", onResize);
    return ()=>window.removeEventListener("resize", onResize);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // ── Notifications maison (remplace alert()) ──────────────────────
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((message, type="info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, {id, message, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const notifyError = (msg) => pushToast(msg, "error");
  const notifySuccess = (msg) => pushToast(msg, "success");

  // ── Monitoring d'erreurs (Sentry, chargé via <script> dans index.html) ──
  // window.Sentry n'existe que si le script de chargement est bien présent
  // dans index.html — sinon logError se comporte comme avant (toast + console).
  const logError = (e, context) => {
    console.error(context || "Erreur", e);
    if (window.Sentry && typeof window.Sentry.captureException === "function") {
      window.Sentry.captureException(e, context ? { tags: { context } } : undefined);
    }
    notifyError("Erreur : " + (e?.message || String(e)));
  };
  useEffect(() => {
    if (window.Sentry && typeof window.Sentry.setUser === "function" && session?.user?.email) {
      window.Sentry.setUser({ email: session.user.email });
    }
  }, [session]);
  useEffect(() => {
    const onRejection = (event) => {
      if (window.Sentry && typeof window.Sentry.captureException === "function") window.Sentry.captureException(event.reason);
      console.error("Promise non gérée :", event.reason);
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  // ── Confirmation maison (remplace window.confirm()) ──────────────
  const [confirmDialog, setConfirmDialog] = useState(null); // {message, onConfirm, danger, confirmLabel}
  const askConfirm = (message, onConfirm, opts={}) => setConfirmDialog({message, onConfirm, ...opts});

  // Data
  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [facturesDiverses, setFacturesDiverses] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [stock, setStock] = useState({});
  const [produits, setProduits] = useState([]);
  const [receptionsStock, setReceptionsStock] = useState([]);
  const [fraisGeneraux, setFraisGeneraux] = useState([]);
  const [relevesChauffeurs, setRelevesChauffeurs] = useState([]);
  const [creancesSnapshot, setCreancesSnapshot] = useState([]);
  const [prixConcurrents, setPrixConcurrents] = useState([]);
  const [pertesStock, setPertesStock] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [stickyNote, setStickyNote] = useState("");
  const [stickyNoteSaved, setStickyNoteSaved] = useState(true);
  const [notesPersonnelles, setNotesPersonnelles] = useState([]);
  const [myNote, setMyNote] = useState("");
  const [myNoteSaved, setMyNoteSaved] = useState(true);
  const [calViewMode, setCalViewMode] = useState("semaine");
  const [calWeekRef, setCalWeekRef] = useState(()=>new Date().toISOString().split("T")[0]);

  // UI
  const [clientTab, setClientTab] = useState("info");
  const [selectedCmdsToInvoice, setSelectedCmdsToInvoice] = useState([]);

  // ── Onglets de travail génériques (comme des onglets de navigateur) ──
  // Chaque onglet : {id, type, label, page, ...données spécifiques au type}
  const [workTabs, setWorkTabs] = useState([]);
  const [activeWorkTabId, setActiveWorkTabId] = useState(null);
  const activeWorkTab = workTabs.find(t=>t.id===activeWorkTabId) || null;
  const openWorkTab = (tab) => {
    setWorkTabs(prev => prev.some(t=>t.id===tab.id) ? prev.map(t=>t.id===tab.id?{...t,...tab}:t) : [...prev, tab]);
    setActiveWorkTabId(tab.id);
    if (tab.page) setPage(tab.page);
  };
  const closeWorkTab = (id, e) => {
    if (e) e.stopPropagation();
    setWorkTabs(prev => {
      const idx = prev.findIndex(t=>t.id===id);
      const next = prev.filter(t=>t.id!==id);
      if (activeWorkTabId===id) {
        const fallback = next[idx] ?? next[idx-1];
        setActiveWorkTabId(fallback ? fallback.id : null);
      }
      return next;
    });
  };
  const workTabStrip = () => (
    workTabs.length > 0 && (
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
        <span onClick={()=>setActiveWorkTabId(null)}
          style={{cursor:"pointer",fontWeight:!activeWorkTabId?700:500,fontSize:12,flexShrink:0,padding:"6px 10px",borderRadius:8,
            color:!activeWorkTabId?"#0F172A":"#64748B",background:!activeWorkTabId?"#fff":"transparent",
            border:!activeWorkTabId?"1px solid #E3E7ED":"1px solid transparent",boxShadow:!activeWorkTabId?"0 1px 2px rgba(16,24,40,0.04)":"none"}}>
          Liste
        </span>
        {workTabs.map(t=>{
          const active = activeWorkTabId===t.id;
          return (
            <div key={t.id} onClick={()=>{setActiveWorkTabId(t.id); if(t.page) setPage(t.page);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"6px 6px 6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:active?700:500,
                background:active?"#fff":"transparent",border:active?"1px solid #E3E7ED":"1px solid transparent",
                color:active?"#0F172A":"#64748B",flexShrink:0,boxShadow:active?"0 1px 2px rgba(16,24,40,0.04)":"none"}}>
              <span style={{whiteSpace:"nowrap",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis"}}>{t.label}</span>
              <button onClick={e=>closeWorkTab(t.id,e)} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",padding:2,display:"flex",borderRadius:5}}><Icon name="close" size={11}/></button>
            </div>
          );
        })}
      </div>
    )
  );
  // Fiche client dérivée de l'onglet actif (compatibilité avec le code existant)
  const selClient = activeWorkTab?.type==="client" ? clients.find(c=>c.id===activeWorkTab.clientId) : null;
  const setSelClient = (c) => {
    if (!c) { setActiveWorkTabId(null); return; }
    openWorkTab({id:"client-"+c.id, type:"client", label:c.nom, clientId:c.id, page:"clients"});
  };
  const openClientTab = (c, tab="info") => { setClientTab(tab); setSelClient(c); };

  // ── Routing : URL (hash) <-> état ─────────────────────────────────
  useEffect(() => {
    const applyHash = () => {
      isSyncingFromHash.current = true;
      const {page: p, id} = parseHash();
      setPage(p);
      setPendingClientId(p==="clients" ? id : null);
      if (p!=="clients" || !id) setSelClient(null);
      setTimeout(()=>{ isSyncingFromHash.current = false; }, 0);
    };
    window.addEventListener("popstate", applyHash);
    window.addEventListener("hashchange", applyHash);
    return () => {
      window.removeEventListener("popstate", applyHash);
      window.removeEventListener("hashchange", applyHash);
    };
  }, []);
  useEffect(() => {
    if (pendingClientId!=null && clients.length>0) {
      const c = clients.find(cl=>cl.id===pendingClientId);
      if (c) openClientTab(c, "info");
      setPendingClientId(null);
    }
  }, [clients, pendingClientId]);
  useEffect(() => {
    if (isSyncingFromHash.current) return;
    const newHash = selClient ? `#/clients/${selClient.id}` : `#/${page}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, "", newHash);
    }
  }, [page, selClient]);

  const [showVisiteForm, setShowVisiteForm] = useState(false);
  const [visiteDate, setVisiteDate] = useState("");
  const [visiteNote, setVisiteNote] = useState("");
  const [selectedDay, setSelectedDay] = useState(() => {
    const dow = new Date().getDay();
    return dow === 0 ? 0 : Math.min(dow - 1, 4);
  });
  const [planningWeekOffset, setPlanningWeekOffset] = useState(0); // 0=current, -1=last week, etc.
  const [planningView, setPlanningView] = useState("semaine"); // "semaine" | "jour"
  const [cmdView, setCmdView] = useState("attente");
  const [searchC, setSearchC] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterZone, setFilterZone] = useState("Tous");
  const [filterFidelite, setFilterFidelite] = useState("Tous");
  const [consignesManuelles, setConsignesManuelles] = useState([]);
  const showConsigneForm = activeWorkTab?.type==="consigne";
  const [consigneForm, setConsigneForm] = useState({});
  const [consigneClientId, setConsigneClientId] = useState(null);
  const [consigneLignes, setConsigneLignes] = useState([]); // [{produitNom, qte, consigneUnitaire}]
  const openConsigneTab = () => {
    setConsigneClientId(null);
    setConsigneForm({date:localDateStr()});
    setConsigneLignes([{produitNom:"", qte:"", consigneUnitaire:""}]);
    openWorkTab({id:"consigne", type:"consigne", label:"Retour consigne", page:"consignes"});
  };
  const [manualConsigneLabel, setManualConsigneLabel] = useState("");
  const [manualConsigneQte, setManualConsigneQte] = useState("1");
  const [manualConsigneUnitaire, setManualConsigneUnitaire] = useState("");
  const [manualConsigneSens, setManualConsigneSens] = useState("plus");
  const [manualConsigneLignesCmd, setManualConsigneLignesCmd] = useState([]); // [{label,qte,unitaire,sens}]
  const [geocodingProgress, setGeocodingProgress] = useState(null); // {done, total} | null
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientForm, setClientForm] = useState({});
  const showProduitForm = activeWorkTab?.type==="produit";
  const [editProduit, setEditProduit] = useState(null);
  const [produitForm, setProduitForm] = useState({});
  const [produitFilterStatut, setProduitFilterStatut] = useState("Actif");
  const [showReorderProduits, setShowReorderProduits] = useState(false);
  const showReceptionForm = activeWorkTab?.type==="reception";
  const [receptionLignes, setReceptionLignes] = useState([]); // [{produitId, nom, qte, prix}]
  const [receptionSearch, setReceptionSearch] = useState("");
  const [receptionForm, setReceptionForm] = useState({});
  const [receptionFichier, setReceptionFichier] = useState(null); // File en attente d'upload
  const [receptionUploading, setReceptionUploading] = useState(false);
  const showPerteForm = activeWorkTab?.type==="perte";
  const [stockDraft, setStockDraft] = useState({});
  const [perteLignes, setPerteLignes] = useState([]); // [{produitId, nom, qte}]
  const [perteSearch, setPerteSearch] = useState("");
  const [perteForm, setPerteForm] = useState({});
  const openReceptionTab = () => {
    setReceptionLignes([]);
    setReceptionSearch("");
    setReceptionForm({date:localDateStr()});
    setReceptionFichier(null);
    openWorkTab({id:"reception", type:"reception", label:"Réception stock", page:"stock"});
  };
  const openPerteTab = () => {
    setPerteLignes([]);
    setPerteSearch("");
    setPerteForm({motif:"Casse", date:localDateStr()});
    openWorkTab({id:"perte", type:"perte", label:"Déclarer une perte", page:"stock"});
  };
  const [showEventForm, setShowEventForm] = useState(false);
  const [showPaiementForm, setShowPaiementForm] = useState(false);
  const [openFactureMenu, setOpenFactureMenu] = useState(null);
  const [factSelected, setFactSelected] = useState([]);   // ids des factures cochées (actions groupées)
  const [paiementLot, setPaiementLot] = useState(null);   // ids à marquer payées en une fois (null = paiement unitaire)
  const [openCmdMenu, setOpenCmdMenu] = useState(null);
  const [paiementFacture, setPaiementFacture] = useState(null);
  // Notes de crédit (trop-perçu) : {mode:"create", clientId, factureNumero, montant, motif} | {mode:"apply", facture, ncId, montant}
  const [ncModal, setNcModal] = useState(null);
  const [ppModal, setPpModal] = useState(null); // paiement partiel : {facture, montant, date, mode}
  const [paiementForm, setPaiementForm] = useState({});
  const [showPaiementDiverseForm, setShowPaiementDiverseForm] = useState(false);
  const [paiementDiverse, setPaiementDiverse] = useState(null);
  const [paiementDiverseForm, setPaiementDiverseForm] = useState({});
  const [caissePeriode, setCaissePeriode] = useState("semaine");
  const [caisseRef, setCaisseRef] = useState(()=>new Date().toISOString().split("T")[0]);

  // Contrôle de gestion — charges de structure & prix concurrents (formulaires)
  const [showFraisForm, setShowFraisForm] = useState(false);
  const [editFrais, setEditFrais] = useState(null);
  const [fraisForm, setFraisForm] = useState({});
  const [showPrixConcForm, setShowPrixConcForm] = useState(false);
  const [prixConcForm, setPrixConcForm] = useState({});
  const [caHistoriquePreApp, setCaHistoriquePreApp] = useState([]);
  const [calcDistancesLoading, setCalcDistancesLoading] = useState(false);
  const [calcDistancesMsg, setCalcDistancesMsg] = useState("");
  const [matriceDist, setMatriceDist] = useState({}); // {origine:{dest:[km,min]}} distances routières exactes
  const [matriceMsg, setMatriceMsg] = useState("");
  const [matriceLoading, setMatriceLoading] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [eventForm, setEventForm] = useState({});
  const [calMonth, setCalMonth] = useState(()=>{const d=new Date();return {year:d.getFullYear(),month:d.getMonth()};});
  const showFactForm = activeWorkTab?.type==="facture";
  const [factFilterStatut, setFactFilterStatut] = useState("Tous");
  const [factFilterSearch, setFactFilterSearch] = useState("");
  const [factFilterMois, setFactFilterMois] = useState("Tous");
  const [factFilterClient, setFactFilterClient] = useState("");
  const [factFilterDateFrom, setFactFilterDateFrom] = useState("");
  const [factFilterDateTo, setFactFilterDateTo] = useState("");
  const FACT_PER_PAGE = 50;
  const [editingFacture, setEditingFacture] = useState(null);
  const [factClientId, setFactClientId] = useState(null);
  const [factLignes, setFactLignes] = useState([]);
  const [factDate, setFactDate] = useState(new Date().toISOString().split("T")[0]);
  const [factNotes, setFactNotes] = useState("");
  const [factNoteClient, setFactNoteClient] = useState("");
  const [factTransportMontant, setFactTransportMontant] = useState("");
  const [factNumero, setFactNumero] = useState("");
  const [factEcheance, setFactEcheance] = useState("");
  // ── Factures diverses (factures libres à des tiers non-clients, ex : reprise
  // de palettes par un repreneur externe — indépendant de clients/commandes) ──
  const showDiverseForm = activeWorkTab?.type==="diverse";
  const [fdFilterStatut, setFdFilterStatut] = useState("Tous");
  const [fdFilterSearch, setFdFilterSearch] = useState("");
  const [editingDiverse, setEditingDiverse] = useState(null);
  const [fdNumero, setFdNumero] = useState("");
  const [fdDate, setFdDate] = useState(new Date().toISOString().split("T")[0]);
  const [fdEcheance, setFdEcheance] = useState("");
  const [fdDestNom, setFdDestNom] = useState("");
  const [fdDestAdresse, setFdDestAdresse] = useState("");
  const [fdDestTva, setFdDestTva] = useState("");
  const [fdLignes, setFdLignes] = useState([]);
  const [fdLigneDesc, setFdLigneDesc] = useState("");
  const [fdLigneQte, setFdLigneQte] = useState("1");
  const [fdLignePu, setFdLignePu] = useState("");
  const [fdTvaPct, setFdTvaPct] = useState(17);
  const [fdNotes, setFdNotes] = useState("");
  const [fdFichiers, setFdFichiers] = useState([]); // fichiers déjà uploadés : [{chemin, nom}]
  const [fdFichierEnAttente, setFdFichierEnAttente] = useState(null); // File en cours d'upload
  const [searchFactClient, setSearchFactClient] = useState("");
  const [cmdClientId, setCmdClientId] = useState(null);
  const [cmdProduits, setCmdProduits] = useState([]);
  const [cmdNotes, setCmdNotes] = useState("");
  const [cmdTransport, setCmdTransport] = useState("");
  const [searchCmdClient, setSearchCmdClient] = useState("");
  const [showProdAdd, setShowProdAdd] = useState(false);
  const [newProd, setNewProd] = useState("");
  const [newQte, setNewQte] = useState(1);
  const [showRetour, setShowRetour] = useState(null);
  const [retourQtes, setRetourQtes] = useState({});
  const [stockCat, setStockCat] = useState("Tous");

  // Dashboard filters
  const [dashPeriod, setDashPeriod] = useState("mois");
  const [dashProduitTri, setDashProduitTri] = useState("quantite");
  const [dashDateFrom, setDashDateFrom] = useState(() => {
    const now = new Date();
    return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-01";
  });
  const [dashDateTo, setDashDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [dashClient, setDashClient] = useState("");
  const [dashZone, setDashZone] = useState("");
  const [dashChauffeur, setDashChauffeur] = useState("");
  const [dashProduits, setDashProduits] = useState([]); // filtre multi-produits
  const [dashProdOpen, setDashProdOpen] = useState(false);
  const [dashProdSearch, setDashProdSearch] = useState("");
  const [dashStatut, setDashStatut] = useState("");

  // Contrôle de gestion — filtres période (page dédiée, indépendante du Dashboard)
  const [cgPeriod, setCgPeriod] = useState("mois");
  const [cgDateFrom, setCgDateFrom] = useState(() => {
    const now = new Date();
    return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-01";
  });
  const [cgDateTo, setCgDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [seuilPackOffert, setSeuilPackOffert] = useState(150);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0];

  // ── LOAD DATA ──────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all factures with pagination (offset/limit to bypass 1000 row limit)
      const fetchAllFactures = async () => {
        const pageSize = 1000;
        let all = [];
        let offset = 0;
        while (true) {
          const batch = await sb("factures?select=*&order=id.asc&limit="+pageSize+"&offset="+offset);
          if (!batch || batch.length === 0) break;
          all = all.concat(batch);
          if (batch.length < pageSize) break;
          offset += pageSize;
        }
        return all.reverse();
      };

      // Comptable : uniquement les factures + la vue limitée des clients (aucune autre table n'est lue)
      if (role === "comptable") {
        const [clsC, factsC] = await Promise.all([
          sb("clients_compta?select=*&order=id.desc"),
          fetchAllFactures(),
        ]);
        setClients(clsC);
        setFactures(factsC);
        setError(null);
        return;
      }

      const [cls, facts, cmds, stk, prods, receps, pertes, evts, note, mesNotes, consMan, factDiv, frais, prixConc, caHistPre, relevesChf, creancesSnap] = await Promise.all([
        db.get("clients"),
        fetchAllFactures(),
        db.get("commandes"),
        db.get("stock"),
        db.get("produits"),
        db.get("receptions_stock"),
        db.get("pertes_stock"),
        db.get("evenements"),
        db.get("note_partagee"),
        db.get("notes_personnelles"),
        db.get("consignes_manuelles"),
        db.get("factures_diverses"),
        db.get("frais_generaux_mensuels"),
        db.get("prix_concurrents"),
        db.get("ca_historique_pre_app"),
        db.get("releves_chauffeurs_mensuels"),
        db.get("creances_clients_snapshot"),
      ]);
      setClients(cls);
      setFactures(facts);
      setFacturesDiverses(factDiv);
      setCommandes(cmds);
      const stockMap = {};
      stk.forEach(s => { stockMap[s.produit_id] = s.quantite; });
      setStock(stockMap);
      // Ordre d'affichage : d'abord l'ordre manuel (colonne "ordre", modifiable
      // dans l'app via les flèches ▲▼), sinon on retombe sur categorie+nom pour
      // les produits qui n'en auraient pas encore.
      setProduits([...prods].sort((a,b) =>
        (a.ordre!=null && b.ordre!=null) ? a.ordre-b.ordre : (a.categorie+a.nom).localeCompare(b.categorie+b.nom)
      ));
      setReceptionsStock(receps);
      setPertesStock(pertes);
      setEvenements(evts);
      setStickyNote(note?.[0]?.contenu || "");
      setNotesPersonnelles(mesNotes);
      setMyNote(mesNotes.find(n=>n.user_email===session?.user?.email)?.contenu || "");
      setConsignesManuelles(consMan);
      setFraisGeneraux(frais);
      setRelevesChauffeurs(relevesChf);
      setCreancesSnapshot(creancesSnap);
      setPrixConcurrents(prixConc);
      setCaHistoriquePreApp(caHistPre);
      setError(null);
    } catch (e) {
      setError("Erreur de connexion à la base de données. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { if (role) loadAll(); }, [role, loadAll]);

  // ── ALERTE NOUVELLE COMMANDE WEB / NOUVELLE DEMANDE DE COMPTE ────────
  // Vérifie toutes les 30 s (et au retour sur l'onglet) s'il y a du nouveau, puis
  // joue un son et affiche une fenêtre qui reste jusqu'à ce qu'on la ferme.
  const [alerteWeb, setAlerteWeb] = useState(null);
  const vusWebRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // Les navigateurs n'autorisent le son qu'après un premier clic/toucher : on le débloque ici.
    const debloquer = () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
        if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      } catch (e) {}
    };
    window.addEventListener("pointerdown", debloquer);
    window.addEventListener("keydown", debloquer);
    return () => {
      window.removeEventListener("pointerdown", debloquer);
      window.removeEventListener("keydown", debloquer);
    };
  }, []);

  const jouerSonAlerte = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      [880, 1175, 1480, 1175, 1480].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(g);
        g.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.2;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.start(t);
        o.stop(t + 0.3);
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (role !== "staff") return;
    let arrete = false;
    const verifier = async () => {
      try {
        const [cmds, cptes] = await Promise.all([
          sb("commandes?source=eq.web&select=id,client_nom&order=id.desc&limit=30"),
          sb("clients?statut_compte=eq.en_attente&select=id,nom&order=id.desc&limit=30"),
        ]);
        if (arrete) return;
        const vus = vusWebRef.current;
        const idsC = new Set(cmds.map(c => c.id));
        const idsK = new Set(cptes.map(c => c.id));
        if (vus === null) { vusWebRef.current = { c: idsC, k: idsK }; return; }
        const nouvC = cmds.filter(c => !vus.c.has(c.id));
        const nouvK = cptes.filter(c => !vus.k.has(c.id));
        vusWebRef.current = { c: new Set([...vus.c, ...idsC]), k: new Set([...vus.k, ...idsK]) };
        if (nouvC.length || nouvK.length) {
          jouerSonAlerte();
          setAlerteWeb(prev => ({
            commandes: [...(prev?.commandes || []), ...nouvC],
            comptes: [...(prev?.comptes || []), ...nouvK],
          }));
        }
      } catch (e) { /* réseau coupé : on réessaiera au prochain passage */ }
    };
    verifier();
    const timer = setInterval(verifier, 30000);
    const auRetour = () => { if (document.visibilityState === "visible") verifier(); };
    document.addEventListener("visibilitychange", auRetour);
    return () => { arrete = true; clearInterval(timer); document.removeEventListener("visibilitychange", auRetour); };
  }, [role, jouerSonAlerte]);

  // ── DERIVED ────────────────────────────────────────────────────
  const clientsActifs = clients.filter(c=>c.statut==="Actif");
  const filteredClients = useMemo(()=>clients.filter(c=>{
    const q=searchC.toLowerCase().trim();
    const nom = c.nom?.toLowerCase()||"";
    const matchSearch = !searchC || nom.startsWith(q);
    return matchSearch
      &&(filterType==="Tous"||c.type===filterType)
      &&(filterStatut==="Tous"||c.statut===filterStatut)
      &&(filterZone==="Tous"||c.region===filterZone)
      &&(filterFidelite==="Tous"||c.categorie_fidelite===filterFidelite);
  }).sort((a,b)=>(a.nom||"").localeCompare(b.nom||"")),[clients,searchC,filterType,filterStatut,filterZone,filterFidelite]);

  const clientFactures = (cid) => factures.filter(f=>f.client_id===cid);

  // Retrouve la facture ACTIVE liée à une commande, que ce soit une facture
  // individuelle ("Commande #12") ou une facture groupée qui l'inclut parmi
  // d'autres ("Facture groupée — Commande #12, Commande #15"). Une facture
  // "Annulée" (ex: via un avoir) ne compte pas — la commande redevient alors
  // disponible pour être (re)facturée. Centralisé ici pour éviter que chaque
  // endroit de l'app réimplémente sa propre comparaison fragile.
  const findFactureForCommande = (cmdId) => {
    const refRegex = new RegExp(`Commande #${cmdId}(\\D|$)`);
    return factures.find(f => f.notes && f.statut !== "Annulée" && refRegex.test(f.notes));
  };
  const clientImpayees = (cid) => clientFactures(cid).filter(f=>f.statut==="Impayée");

  // ── Facturation groupée (clients en mode_facturation==="groupee") ──
  const commandesNonFacturees = (cid) => commandes.filter(c =>
    c.client_id===cid && !findFactureForCommande(c.id)
  );
  const facturerCommandesGroupees = async (cmdIds) => {
    const cmdsAFacturer = commandes.filter(c => cmdIds.includes(c.id));
    if (cmdsAFacturer.length===0) return;
    const client = clients.find(c => c.id === cmdsAFacturer[0].client_id);
    if (!client) return;
    const uneSeule = cmdsAFacturer.length === 1;
    setSaving(true);
    try {
      const lignes = [];
      for (const cmd of cmdsAFacturer) {
        for (const p of (cmd.produits||[])) {
          const produit = findProduitByNom(produits, p.nom);
          const pu = produit ? getClientPrix(produit, client) : 0;
          const consigne = produit?.type_emballage==="VC" ? (CONSIGNE_PRIX[produit.consigne]||0) : 0;
          const nom = uneSeule ? p.nom : `${p.nom} (${cmd.date_commande||cmd.date_livraison||"?"})`;
          const qteOfferte = Math.min(p.qteOfferte||0, p.qte);
          const qtePayante = p.qte - qteOfferte;
          if (qtePayante > 0) lignes.push({ produitId: produit?.id||"", nom, qte: qtePayante, pu, consigne });
          if (qteOfferte > 0) lignes.push({ produitId: produit?.id||"", nom: nom + " (offert)", qte: qteOfferte, pu: 0, consigne, offert: true });
        }
        if (cmd.transport > 0) {
          const nomTransport = uneSeule ? "Transport" : `Transport (${cmd.date_commande||cmd.date_livraison||"?"})`;
          lignes.push({ produitId:"TRANSPORT_MANUEL", nom: nomTransport, qte:1, pu: cmd.transport, consigne:0 });
        }
      }
      const today = localDateStr();
      const ech = new Date(); ech.setDate(ech.getDate()+7);
      const num = genererNumeroFacture(today);
      await db.insert("factures", {
        numero: num, client_id: client.id,
        client_nom: client.nom||"", client_adresse: client.adresse||"",
        client_tva: client.tva||"",
        date: today, echeance: ech.toISOString().split("T")[0],
        lignes, statut: "Impayée", tva_pct: clientEstExonere(client) ? 0 : 3,
        notes: uneSeule ? `Commande #${cmdsAFacturer[0].id}` : "Facture groupée — " + cmdsAFacturer.map(c=>`Commande #${c.id}`).join(", "),
        note_client: client.commentaire_facture || "",
        retours: []
      });
      await loadAll();
      notifySuccess(uneSeule ? `Facture ${num} créée.` : `Facture ${num} créée avec ${cmdsAFacturer.length} livraisons groupées.`);
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const planningA = commandes.filter(c=>c.statut==="En attente"&&getChauffeur(c.client_region)==="A");
  const planningB = commandes.filter(c=>c.statut==="En attente"&&getChauffeur(c.client_region)==="B");

  // Credit consignes = caisses retournées non encore déduites d'une facture
  const creditConsignesDetail = (cid) => {
    let details = []; // {numero, montant}
    let alreadyDeducted = 0;

    // Only count non-historical factures
    factures.filter(f => f.client_id === cid && f.notes !== "Import historique").forEach(f => {
      (f.retours || []).forEach(r => {
        details.push({ numero: f.numero, montant: r.qte * r.consigne });
      });
      (f.lignes || []).filter(l => l.nom && l.nom.startsWith("Retour consignes") && l.pu < 0).forEach(l => {
        alreadyDeducted += Math.abs(l.qte * l.pu);
      });
    });

    const totalCredit = details.reduce((s, d) => s + d.montant, 0);
    const remaining = Math.max(0, totalCredit - alreadyDeducted);
    const refs = [...new Set(details.map(d => d.numero))].join(", ");
    return { total: remaining, refs };
  };

  const creditConsignes = (cid) => creditConsignesDetail(cid).total;

  const soldeConsignes = (cid) => {
    const r={};
    // Only count non-historical factures (notes !== "Import historique")
    factures.filter(f=>f.client_id===cid&&f.notes!=="Import historique").forEach(f=>{
      (f.lignes||[]).filter(l=>l.consigne>0).forEach(l=>{
        const k=l.nom+"|"+l.consigne;
        if(!r[k]) r[k]={nom:l.nom,consigne:l.consigne,envoyé:0,retourné:0};
        r[k].envoyé+=l.qte;
      });
      (f.retours||[]).forEach(ret=>{
        const k=ret.nom+"|"+ret.consigne;
        if(!r[k]) r[k]={nom:ret.nom,consigne:ret.consigne,envoyé:0,retourné:0};
        r[k].retourné+=ret.qte;
      });
    });
    return Object.values(r).map(x=>({...x,solde:x.envoyé-x.retourné})).filter(x=>x.solde>0);
  };

  // ── CONSIGNES : retours déclarés manuellement, indépendants d'une facture ──
  const saveConsigneManuelle = async () => {
    const lignesValides = consigneLignes.filter(l => l.qte>0 && l.consigneUnitaire);
    if (!consigneClientId || lignesValides.length===0) {
      if (!consigneClientId) notifyError("Choisis un client avant d'enregistrer.");
      else notifyError("Renseigne au moins une consigne avec une quantité et une taille.");
      return;
    }
    setSaving(true);
    try {
      for (const l of lignesValides) {
        await db.insert("consignes_manuelles", {
          client_id: consigneClientId,
          produit_nom: l.produitNom || null,
          quantite: parseFloat(l.qte),
          consigne_unitaire: parseFloat(l.consigneUnitaire),
          date: consigneForm.date || localDateStr(),
          notes: consigneForm.notes || null,
          utilise: false,
        });
      }
      await loadAll();
      closeWorkTab("consigne");
      setConsigneForm({});
      setConsigneClientId(null);
      setConsigneLignes([]);
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const creditManuelDisponibleDetail = (cid) => {
    const entries = consignesManuelles.filter(c => c.client_id === cid && !c.utilise);
    const total = entries.reduce((s, c) => s + c.quantite * c.consigne_unitaire, 0);
    return { total, entries };
  };
  const creditManuelDisponible = (cid) => creditManuelDisponibleDetail(cid).total;

  const marquerConsignesUtilisees = async (cid) => {
    const { entries } = creditManuelDisponibleDetail(cid);
    for (const e of entries) {
      await db.update("consignes_manuelles", e.id, { utilise: true });
    }
  };

  const supprimerConsigneManuelle = async (id) => {
    askConfirm("Supprimer ce retour déclaré ?", async () => {
      setSaving(true);
      try {
        await db.delete("consignes_manuelles", id);
        await loadAll();
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {danger:true, confirmLabel:"Supprimer"});
  };

  // ── ACTIONS ────────────────────────────────────────────────────
  const saveClient = async () => {
    if (!clientForm.nom) return;
    setSaving(true);
    try {
      const paysReel = clientForm.pays==="__autre__" ? (clientForm.paysAutre||"").trim() || "Luxembourg" : (clientForm.pays||"Luxembourg");
      let coords = null;
      const adresseChanged = !editClient || (clientForm.adresse||"") !== (editClient.adresse||"");
      if (adresseChanged && clientForm.adresse) {
        coords = await geocodeAddress(clientForm.adresse);
      }
      if (editClient) {
        const { id, created_at, paysAutre, ...payload } = clientForm;
        payload.pays = paysReel;
        if (coords) { payload.lat = coords.lat; payload.lng = coords.lng; }
        await db.update("clients", editClient.id, payload);
      } else {
        const { paysAutre, ...rest } = clientForm;
        const payload = {...rest, pays: paysReel, prix_individuels: {}};
        if (coords) { payload.lat = coords.lat; payload.lng = coords.lng; }
        await db.insert("clients", payload);
      }
      await loadAll();
      setShowClientForm(false);
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  // Demandes de compte portail (clients.statut_compte === "en_attente")
  // — inscriptions faites depuis hondro-distribution.com, à vérifier avant activation.
  const activerDemandeCompte = (client) => {
    askConfirm(`Activer le compte de "${client.nom}" ? Le client pourra se connecter et passer commande sur le portail.`, async () => {
      try {
        await db.update("clients", client.id, { statut_compte: "actif" });
        await loadAll();
        notifySuccess(`✅ Compte activé pour ${client.nom}.`);
      } catch(e) { logError(e); }
    });
  };

  const refuserDemandeCompte = (client) => {
    askConfirm(`Refuser la demande de compte de "${client.nom}" ? Le client ne pourra pas se connecter au portail.`, async () => {
      try {
        await db.update("clients", client.id, { statut_compte: "refuse" });
        await loadAll();
        notifySuccess(`Demande de ${client.nom} refusée.`);
      } catch(e) { logError(e); }
    }, {danger:true});
  };

  const geocoderClientsExistants = async () => {
    const aGeocoder = clients.filter(c => c.adresse && (!c.lat || !c.lng));
    if (aGeocoder.length === 0) { notifySuccess("Tous les clients avec une adresse sont déjà géolocalisés."); return; }
    askConfirm(`Géolocaliser ${aGeocoder.length} client(s) ? Ça peut prendre quelques minutes (1 par seconde).`, async () => {
      setGeocodingProgress({ done: 0, total: aGeocoder.length });
      let echecs = 0;
      for (let i = 0; i < aGeocoder.length; i++) {
        const c = aGeocoder[i];
        const coords = await geocodeAddress(c.adresse);
        if (coords) {
          try { await db.update("clients", c.id, { lat: coords.lat, lng: coords.lng }); }
          catch(e) { echecs++; }
        } else {
          echecs++;
        }
        setGeocodingProgress({ done: i + 1, total: aGeocoder.length });
        await new Promise(r => setTimeout(r, 1100)); // respecte la limite Nominatim (1 req/s)
      }
      await loadAll();
      setGeocodingProgress(null);
      notifySuccess(`Géolocalisation terminée : ${aGeocoder.length - echecs} réussi(s)${echecs > 0 ? ", " + echecs + " échec(s) (adresse introuvable)" : ""}.`);
    }, {confirmLabel:"Géolocaliser"});
  };

  const genererIdProduit = (categorie) => {
    const prefix = categorie === "Verre" ? "V" : (categorie === "Bouteilles" || categorie === "Eaux") ? "B" : "C";
    const nums = produits
      .filter(p => p.id?.startsWith(prefix))
      .map(p => parseInt(p.id.slice(prefix.length)))
      .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return prefix + String(next).padStart(2, "0");
  };

  const saveProduit = async () => {
    const categorieReelle = produitForm.categorie==="__new__" ? (produitForm.categorieNouvelle||"").trim() : produitForm.categorie;
    if (!produitForm.nom || !categorieReelle || !produitForm.type_emballage) {
      notifyError("Renseigne le nom, la catégorie et le type d'emballage avant d'enregistrer.");
      return;
    }
    setSaving(true);
    try {
      const prix = {
        Snack: parseFloat(produitForm.prix_Snack) || 0,
        Restaurant: parseFloat(produitForm.prix_Restaurant) || 0,
        Administrative: parseFloat(produitForm.prix_Administrative) || 0,
        Market: parseFloat(produitForm.prix_Market) || 0,
        Café: parseFloat(produitForm.prix_Café) || 0,
        Creche: parseFloat(produitForm.prix_Creche) || 0,
        Distributor: parseFloat(produitForm.prix_Distributor) || 0,
        Privé: parseFloat(produitForm.prix_Privé) || 0,
      };
      const payload = {
        nom: produitForm.nom,
        categorie: categorieReelle,
        type_emballage: produitForm.type_emballage,
        consigne: produitForm.type_emballage === "VC" ? (produitForm.consigne || null) : null,
        prix,
        prix_achat: produitForm.prix_achat !== undefined && produitForm.prix_achat !== "" ? parseFloat(produitForm.prix_achat) : null,
      };
      if (editProduit) {
        await db.update("produits", editProduit.id, payload);
      } else {
        const newId = genererIdProduit(categorieReelle);
        // Nouveau produit : apparaît en dernier dans sa catégorie (ordre d'affichage) ;
        // se déplace ensuite avec les flèches ▲▼ dans Catalogue produits.
        const ordresCategorie = produits.filter(p=>p.categorie===categorieReelle).map(p=>p.ordre).filter(o=>o!=null);
        const ordreDefaut = ordresCategorie.length>0 ? Math.max(...ordresCategorie)+1 : (produits.length+1)*1000000;
        await db.insert("produits", {...payload, id: newId, statut: "Actif", ordre: ordreDefaut});
      }
      await loadAll();
      closeWorkTab("produit");
      setEditProduit(null);
      setProduitForm({});
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };
  const openNewProduitTab = () => {
    setEditProduit(null);
    setProduitForm({categorie:"",type_emballage:"CAN",nom:"",prix_Snack:"",prix_Restaurant:"",prix_Administrative:"",prix_Market:"",prix_Café:"",prix_Creche:"",prix_Distributor:"",prix_Privé:"",consigne:"",prix_achat:""});
    openWorkTab({id:"produit", type:"produit", label:"Nouveau produit", page:"produits"});
  };
  const openEditProduitTab = (p) => {
    setEditProduit(p);
    setProduitForm({
      nom:p.nom, categorie:p.categorie, type_emballage:p.type_emballage,
      consigne:p.consigne||"",
      prix_Snack:p.prix?.Snack??"", prix_Restaurant:p.prix?.Restaurant??"",
      prix_Administrative:p.prix?.Administrative??"", prix_Market:p.prix?.Market??"",
      prix_Café:p.prix?.Café??"", prix_Creche:p.prix?.Creche??"",
      prix_Distributor:p.prix?.Distributor??"",
      prix_Privé:p.prix?.Privé??"",
      prix_achat:p.prix_achat??"",
    });
    openWorkTab({id:"produit", type:"produit", label:p.nom, page:"produits"});
  };

  const toggleProduitStatut = async (produit) => {
    const nouveauStatut = produit.statut === "Actif" ? "Passif" : "Actif";
    setSaving(true);
    try {
      await db.update("produits", produit.id, {statut: nouveauStatut});
      await loadAll();
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  // Déplace un produit dans l'ordre d'affichage (colonne "ordre"), en l'échangeant
  // avec son voisin immédiat DANS LA MÊME CATÉGORIE (canettes, bouteilles...).
  // `produits` est déjà trié par "ordre" (voir loadAll), donc les voisins ici
  // sont bien les voisins visuels — pas de déplacement possible entre catégories,
  // qui restent dans l'ordre fixe canettes → bouteilles → eaux → verre → energy.
  const deplacerProduit = async (id, direction) => {
    const p = produits.find(x=>x.id===id);
    if (!p) return;
    const memeCategorie = produits.filter(x=>x.categorie===p.categorie);
    const idx = memeCategorie.findIndex(x=>x.id===id);
    const swapIdx = direction==="up" ? idx-1 : idx+1;
    if (swapIdx<0 || swapIdx>=memeCategorie.length) return;
    const autre = memeCategorie[swapIdx];
    const ordreP = p.ordre, ordreAutre = autre.ordre;
    setSaving(true);
    try {
      await db.update("produits", p.id, {ordre: ordreAutre});
      await db.update("produits", autre.id, {ordre: ordreP});
      await loadAll();
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const saveReception = async () => {
    const lignesValides = receptionLignes.filter(l => l.qte>0 && l.prix>0);
    if (lignesValides.length===0) {
      if (receptionLignes.length===0) notifyError("Ajoute au moins un produit avant d'enregistrer la réception.");
      else notifyError("Renseigne une quantité et un prix pour chaque produit ajouté (les deux sont obligatoires).");
      return;
    }
    setSaving(true);
    try {
      let pieceJointe = null;
      if (receptionFichier) {
        setReceptionUploading(true);
        try {
          pieceJointe = await uploadFichier(receptionFichier, "receptions");
        } catch(e) {
          logError(e, "upload-piece-jointe-reception");
          setSaving(false); setReceptionUploading(false);
          return; // on n'enregistre pas la réception si l'upload a échoué, pour éviter une réception sans sa preuve
        }
        setReceptionUploading(false);
      }
      for (const l of lignesValides) {
        await db.insert("receptions_stock", {
          produit_id: l.produitId,
          quantite: l.qte,
          prix_achat_unitaire: l.prix,
          fournisseur: receptionForm.fournisseur || null,
          date: receptionForm.date || localDateStr(),
          notes: receptionForm.notes || null,
          piece_jointe_url: pieceJointe?.chemin || null,
          piece_jointe_nom: pieceJointe?.nom || null,
        });
        const newQte = (stock[l.produitId] || 0) + l.qte;
        await updateStock(l.produitId, newQte);
      }
      await loadAll();
      closeWorkTab("reception");
      setReceptionLignes([]);
      setReceptionForm({});
      setReceptionFichier(null);
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const savePerte = async () => {
    const lignesValides = perteLignes.filter(l => l.qte>0);
    if (lignesValides.length===0) {
      if (perteLignes.length===0) notifyError("Ajoute au moins un produit avant de confirmer la perte.");
      else notifyError("Renseigne une quantité pour chaque produit ajouté.");
      return;
    }
    setSaving(true);
    try {
      for (const l of lignesValides) {
        await db.insert("pertes_stock", {
          produit_id: l.produitId,
          quantite: l.qte,
          motif: perteForm.motif || "Casse",
          date: perteForm.date || localDateStr(),
          notes: perteForm.notes || null,
        });
        const newQte = Math.max(0, (stock[l.produitId] || 0) - l.qte);
        await updateStock(l.produitId, newQte);
      }
      await loadAll();
      closeWorkTab("perte");
      setPerteLignes([]);
      setPerteForm({});
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const saveEvenement = async () => {
    if (!eventForm.titre || !eventForm.date_debut) return;
    setSaving(true);
    try {
      const payload = {
        titre: eventForm.titre,
        description: eventForm.description || null,
        date_debut: eventForm.date_debut,
        date_fin: eventForm.date_fin || null,
        toute_journee: eventForm.toute_journee !== false,
        heure_debut: eventForm.toute_journee === false ? (eventForm.heure_debut || null) : null,
        heure_fin: eventForm.toute_journee === false ? (eventForm.heure_fin || null) : null,
        couleur: eventForm.couleur || "#1D4ED8",
      };
      if (editEvent) {
        await db.update("evenements", editEvent.id, payload);
      } else {
        await db.insert("evenements", {...payload, cree_par: session?.user?.email || null});
      }
      await loadAll();
      setShowEventForm(false);
      setEditEvent(null);
      setEventForm({});
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const deleteEvenement = async (id) => {
    askConfirm("Supprimer cet événement ?", async () => {
      setSaving(true);
      try {
        await db.delete("evenements", id);
        await loadAll();
        setShowEventForm(false);
        setEditEvent(null);
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {danger:true, confirmLabel:"Supprimer"});
  };

  const saveStickyNote = async (contenu) => {
    try {
      await db.update("note_partagee", 1, {
        contenu,
        updated_par: session?.user?.email || null,
        updated_at: new Date().toISOString(),
      });
      setStickyNoteSaved(true);
    } catch(e) { console.error(e); }
  };

  const saveMyNote = async (contenu) => {
    const email = session?.user?.email;
    if (!email) return;
    try {
      const existing = notesPersonnelles.find(n=>n.user_email===email);
      if (existing) {
        await db.update("notes_personnelles", existing.id, {contenu, updated_at: new Date().toISOString()});
      } else {
        const created = await db.insert("notes_personnelles", {user_email: email, contenu});
        setNotesPersonnelles(prev=>[...prev, ...(Array.isArray(created)?created:[created])]);
      }
      setMyNoteSaved(true);
    } catch(e) { console.error(e); }
  };

  const [lastFacture, setLastFacture] = useState(null);

  const genererNumeroFacture = (date) => {
    const d = new Date(date);
    const annee = d.getFullYear().toString().slice(-1); // dernier chiffre année
    const mois = (d.getMonth() + 1).toString(); // mois sans zéro
    const prefix = annee + mois;

    // Find highest number with same prefix this month
    const sameMonth = factures
      .map(f => f.numero)
      .filter(n => n && n.toString().startsWith(prefix))
      .map(n => parseInt(n.toString().slice(prefix.length)))
      .filter(n => !isNaN(n));

    const lastNum = sameMonth.length > 0 ? Math.max(...sameMonth) : 0;
    const nextNum = String(lastNum + 1).padStart(3, "0");
    return prefix + nextNum;
  };

  const openEditFacture = (f) => {
    setEditingFacture(f);
    setFactClientId(f.client_id);
    setFactLignes(f.lignes || []);
    setFactDate(f.date || new Date().toISOString().split("T")[0]);
    setFactNotes(f.notes || "");
    setFactNoteClient(f.note_client || "");
    setFactTransportMontant("");
    setFactNumero(f.numero || "");
    setFactEcheance(f.echeance || "");
    setSearchFactClient("");
    openWorkTab({id:"facture", type:"facture", label:"Facture "+(f.numero||""), page:"factures"});
  };
  const openNewFactureTab = () => {
    const today = localDateStr();
    setEditingFacture(null);
    setFactClientId(null);
    setFactLignes([]);
    setSearchFactClient("");
    setFactDate(today);
    setFactNumero(genererNumeroFacture(today));
    const echInit = new Date(today); echInit.setDate(echInit.getDate()+7);
    setFactEcheance(echInit.toISOString().split("T")[0]);
    setFactNotes(""); setFactNoteClient(""); setFactTransportMontant("");
    openWorkTab({id:"facture", type:"facture", label:"Nouvelle facture", page:"factures"});
  };

  const saveFact = async () => {
    if (!factClientId) { notifyError("Choisis un client avant d'enregistrer la facture."); return; }
    // Si un montant de transport a été saisi mais pas encore validé avec son
    // bouton "+ Ajouter", on l'ajoute automatiquement ici — pour ne pas obliger
    // à cliquer deux fois, et pour permettre une facture avec transport seul.
    const transportEnAttente = parseFloat(factTransportMontant)||0;
    let lignesFinales = factLignes;
    if (transportEnAttente > 0 && !factLignes.some(l=>l.produitId==="TRANSPORT_MANUEL")) {
      lignesFinales = [...factLignes, {produitId:"TRANSPORT_MANUEL", nom:"Transport", qte:1, pu:transportEnAttente, consigne:0}];
    }
    if (lignesFinales.length===0) { notifyError("Ajoute au moins une ligne à la facture avant d'enregistrer (produit, transport ou consigne)."); return; }
    const client = clients.find(c=>c.id===factClientId);
    const num = factNumero || "F-" + Date.now().toString().slice(-6);
    const echDate = factEcheance || (() => { const e = new Date(factDate); e.setDate(e.getDate()+7); return e.toISOString().split("T")[0]; })();
    const ech = new Date(factDate); ech.setDate(ech.getDate()+7);
    const contientCredit = lignesFinales.some(l => l.produitId === "CREDIT_CONSIGNES");
    // Notes de crédit ajoutées à cette nouvelle facture : on vérifie le solde et le plafond avant d'enregistrer
    const lignesNC = editingFacture ? [] : lignesFinales.filter(l => l.produitId === "NOTE_CREDIT");
    if (lignesNC.length) {
      const dejaParNC = {};
      for (const l of lignesNC) {
        const nc = factures.find(f => f.type_document==="note_credit" && f.numero===l.noteCredit);
        const mt = Math.abs(l.qte*l.pu);
        dejaParNC[l.noteCredit] = (dejaParNC[l.noteCredit]||0) + mt;
        if (!nc) { notifyError("Note de crédit "+l.noteCredit+" introuvable."); return; }
        if (mt <= 0) { notifyError("Le montant de la note de crédit "+l.noteCredit+" doit être supérieur à 0."); return; }
        if (dejaParNC[l.noteCredit] > (parseFloat(nc.credit_restant)||0) + 0.004) { notifyError("Le montant dépasse le crédit disponible de "+l.noteCredit+" ("+fmtFull(parseFloat(nc.credit_restant)||0)+")."); return; }
      }
      const totalNC = lignesNC.reduce((s,l)=>s+Math.abs(l.qte*l.pu),0);
      const duAvantNC = totalFact(lignesFinales.filter(l=>l.produitId!=="NOTE_CREDIT"), clientEstExonere(client)?0:3).total;
      if (totalNC > duAvantNC + 0.004) { notifyError("Les notes de crédit ("+fmtFull(totalNC)+") dépassent le total de la facture ("+fmtFull(duAvantNC)+")."); return; }
    }
    setSaving(true);
    try {
      if (editingFacture) {
        // UPDATE existing
        await db.update("factures", editingFacture.id, {
          numero: num, client_id: factClientId,
          client_nom: client?.nom||"", client_adresse: client?.adresse||"",
          client_tva: client?.tva||"",
          date: factDate, echeance: echDate,
          lignes: lignesFinales, notes: factNotes, note_client: factNoteClient,
        });
        if (contientCredit) await marquerConsignesUtilisees(factClientId);
        await loadAll();
        setEditingFacture(null);
      } else {
        // CREATE new
        await db.insert("factures", {
          numero: num, client_id: factClientId,
          client_nom: client?.nom||"", client_adresse: client?.adresse||"",
          client_tva: client?.tva||"",
          date: factDate, echeance: echDate,
          lignes: lignesFinales, statut: "Impayée", notes: factNotes, note_client: factNoteClient, retours: [],
          tva_pct: clientEstExonere(client) ? 0 : 3,
          ...(lignesNC.length && totalFact(lignesFinales, clientEstExonere(client)?0:3).total <= 0.004
              ? { statut: "Payée", mode_paiement: "Note de crédit", date_paiement: new Date().toISOString().split("T")[0] } : {}),
        });
        if (contientCredit) await marquerConsignesUtilisees(factClientId);
        if (lignesNC.length) {
          const todayNC = new Date().toISOString().split("T")[0];
          for (const l of lignesNC) {
            try {
              const nc = factures.find(f => f.type_document==="note_credit" && f.numero===l.noteCredit);
              const mt = Math.abs(l.qte*l.pu);
              const restant = parseFloat(nc.credit_restant)||0;
              await db.update("factures", nc.id, {
                credit_restant: Math.max(0, Math.round((restant - mt)*100)/100),
                credit_utilisations: [...(nc.credit_utilisations||[]), { facture: num, montant: mt, date: todayNC }],
              });
              nc.credit_restant = Math.max(0, Math.round((restant - mt)*100)/100);
            } catch(e2) { logError(e2); notifyError("Facture "+num+" créée, mais le solde de "+l.noteCredit+" n'a pas pu être mis à jour. Corrigez-le à la main."); }
          }
        }
        await loadAll();
        const newFact = {numero:num, client_id:factClientId,
          client_nom:client?.nom||"", client_adresse:client?.adresse||"",
          client_tva:client?.tva||"", date:factDate, echeance:echDate, lignes:lignesFinales, statut:"Impayée", note_client:factNoteClient,
          tva_pct: clientEstExonere(client) ? 0 : 3};
        if (lignesNC.length && totalFact(lignesFinales, newFact.tva_pct).total <= 0.004) { newFact.statut="Payée"; newFact.mode_paiement="Note de crédit"; newFact.date_paiement=new Date().toISOString().split("T")[0]; }
        setLastFacture({facture:newFact, client});
      }
      setFactLignes([]); setFactNotes(""); setFactNoteClient(""); setFactTransportMontant(""); setFactClientId(null);
      setFactNumero(""); setSearchFactClient(""); closeWorkTab("facture");
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const savePaiementPartiel = async () => {
    const m = ppModal; if (!m) return;
    const f = factures.find(x=>x.id===m.facture.id) || m.facture;
    const montant = Math.round((parseFloat(String(m.montant).replace(",","."))||0)*100)/100;
    const reste = resteFact(f);
    if (montant <= 0) { notifyError("Indiquez un montant supérieur à 0."); return; }
    if (montant > reste + 0.004) { notifyError("Ce montant dépasse le reste dû (" + fmtFull(reste) + ")."); return; }
    if (!m.mode) { notifyError("Choisissez le moyen de paiement."); return; }
    const date = m.date || new Date().toISOString().split("T")[0];
    const paiements = [...(f.paiements||[]), { montant, date, mode: m.mode }];
    const soldee = reste - montant <= 0.004;
    const modes = [...new Set(paiements.map(x=>x.mode))];
    setSaving(true);
    try {
      await db.update("factures", f.id, soldee
        ? { paiements, statut: "Payée", mode_paiement: modes.length===1 ? modes[0] : "Mixte", date_paiement: date }
        : { paiements });
      await loadAll();
      setPpModal(null);
      notifySuccess(soldee ? "Facture " + f.numero + " soldée (paiement de " + fmtFull(montant) + ")." : "Paiement de " + fmtFull(montant) + " enregistré sur " + f.numero + " — reste dû : " + fmtFull(reste - montant) + ".");
    } catch(e) { logError(e); notifyError("Impossible d'enregistrer le paiement."); }
    finally { setSaving(false); }
  };

  const saveModePaiement = async () => {
    if (!paiementFacture || !paiementForm.mode) return;
    setSaving(true);
    try {
      const champs = {
        statut: "Payée",
        mode_paiement: paiementForm.mode,
        date_paiement: paiementForm.date || new Date().toISOString().split("T")[0],
      };
      if (paiementLot && paiementLot.length) {
        // Action groupée : même mode et même date pour toutes les factures cochées
        for (const id of paiementLot) await db.update("factures", id, champs);
        setFactSelected([]);
      } else {
        // Si des paiements partiels existent déjà, le solde restant est enregistré comme dernier paiement
        const dejaPaye = totalPaye(paiementFacture), reste = resteFact(paiementFacture);
        if (dejaPaye > 0 && reste > 0.004) {
          champs.paiements = [...(paiementFacture.paiements||[]), { montant: reste, date: champs.date_paiement, mode: paiementForm.mode }];
          const modes = [...new Set(champs.paiements.map(x=>x.mode))];
          if (modes.length > 1) champs.mode_paiement = "Mixte";
        }
        await db.update("factures", paiementFacture.id, champs);
      }
      await loadAll();
      setShowPaiementForm(false);
      setPaiementFacture(null);
      setPaiementLot(null);
      setPaiementForm({});
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const marquerImpayee = async (id) => {
    setSaving(true);
    try {
      await db.update("factures", id, {statut:"Impayée"});
      setFactures(prev=>prev.map(f=>f.id===id?{...f,statut:"Impayée"}:f));
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  // ═══════════════════════════════════════════════════════════════════
  // FACTURES DIVERSES — factures libres à des tiers non-clients (ex : reprise
  // de palettes par un repreneur externe). Indépendant de clients/commandes :
  // destinataire et lignes en texte libre, numérotation séparée (préfixe "D"),
  // taux de TVA éditable par facture (pas de régime fixe comme les boissons).
  // ═══════════════════════════════════════════════════════════════════
  const totalFactDiverse = (lignes=[], tvaPct=0) => {
    const sousTotal = lignes.reduce((s,l)=>s+l.qte*l.pu, 0);
    const tva = sousTotal * (tvaPct||0) / 100;
    return { sousTotal, tva, total: sousTotal + tva };
  };

  const genererNumeroFactureDiverse = (date) => {
    const d = new Date(date);
    const annee = d.getFullYear().toString().slice(-1);
    const mois = (d.getMonth() + 1).toString();
    const prefix = "D" + annee + mois;
    const sameMonth = facturesDiverses
      .map(f => f.numero)
      .filter(n => n && n.toString().startsWith(prefix))
      .map(n => parseInt(n.toString().slice(prefix.length)))
      .filter(n => !isNaN(n));
    const lastNum = sameMonth.length > 0 ? Math.max(...sameMonth) : 0;
    const nextNum = String(lastNum + 1).padStart(3, "0");
    return prefix + nextNum;
  };

  const openNewDiverseTab = () => {
    const today = localDateStr();
    setEditingDiverse(null);
    setFdDestNom(""); setFdDestAdresse(""); setFdDestTva("");
    setFdLignes([]);
    setFdLigneDesc(""); setFdLigneQte("1"); setFdLignePu("");
    setFdDate(today);
    setFdNumero(genererNumeroFactureDiverse(today));
    const echInit = new Date(today); echInit.setDate(echInit.getDate()+30);
    setFdEcheance(echInit.toISOString().split("T")[0]);
    setFdTvaPct(17);
    setFdNotes("");
    setFdFichiers([]);
    setFdFichierEnAttente(null);
    openWorkTab({id:"diverse", type:"diverse", label:"Nouvelle facture diverse", page:"diverses"});
  };

  const openEditDiverse = (f) => {
    setEditingDiverse(f);
    setFdDestNom(f.destinataire_nom||"");
    setFdDestAdresse(f.destinataire_adresse||"");
    setFdDestTva(f.destinataire_tva||"");
    setFdLignes(f.lignes||[]);
    setFdLigneDesc(""); setFdLigneQte("1"); setFdLignePu("");
    setFdDate(f.date||localDateStr());
    setFdEcheance(f.echeance||"");
    setFdNumero(f.numero||"");
    setFdTvaPct(f.tva_pct!=null?f.tva_pct:17);
    setFdNotes(f.notes||"");
    setFdFichiers(f.pieces_jointes||[]);
    setFdFichierEnAttente(null);
    openWorkTab({id:"diverse", type:"diverse", label:"Facture "+(f.numero||""), page:"diverses"});
  };

  const ajouterLigneDiverse = () => {
    const qte = parseFloat(fdLigneQte)||0;
    const pu = parseFloat(fdLignePu)||0;
    if (!fdLigneDesc.trim() || !qte) return;
    setFdLignes(prev=>[...prev, {description:fdLigneDesc.trim(), qte, pu}]);
    setFdLigneDesc(""); setFdLigneQte("1"); setFdLignePu("");
  };
  const supprimerLigneDiverse = (i) => setFdLignes(prev=>prev.filter((_,idx)=>idx!==i));

  const ajouterFichierDiverse = async (file) => {
    if (!file) return;
    setFdFichierEnAttente(file);
    try {
      const up = await uploadFichier(file, "factures-diverses");
      setFdFichiers(prev=>[...prev, {chemin:up.chemin, nom:up.nom}]);
    } catch(e) { logError(e); }
    finally { setFdFichierEnAttente(null); }
  };
  const supprimerFichierDiverse = (i) => setFdFichiers(prev=>prev.filter((_,idx)=>idx!==i));
  const consulterFichierDiverse = async (chemin) => {
    try {
      const url = await getUrlSigneeFichier(chemin);
      window.open(url, "_blank");
    } catch(e) { logError(e); }
  };

  const saveDiverse = async () => {
    if (!fdDestNom.trim()) { notifyError("Indique le destinataire avant d'enregistrer."); return; }
    if (fdLignes.length===0) { notifyError("Ajoute au moins une ligne à la facture avant d'enregistrer."); return; }
    const num = fdNumero || "D-" + Date.now().toString().slice(-6);
    setSaving(true);
    try {
      const payload = {
        numero: num,
        destinataire_nom: fdDestNom.trim(),
        destinataire_adresse: fdDestAdresse.trim(),
        destinataire_tva: fdDestTva.trim(),
        date: fdDate, echeance: fdEcheance,
        lignes: fdLignes, tva_pct: parseFloat(fdTvaPct)||0,
        notes: fdNotes, pieces_jointes: fdFichiers,
      };
      if (editingDiverse) {
        await db.update("factures_diverses", editingDiverse.id, payload);
      } else {
        await db.insert("factures_diverses", {...payload, statut:"Impayée"});
      }
      await loadAll();
      setEditingDiverse(null); setFdNumero(""); closeWorkTab("diverse");
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const saveModePaiementDiverse = async () => {
    if (!paiementDiverse || !paiementDiverseForm.mode) return;
    setSaving(true);
    try {
      await db.update("factures_diverses", paiementDiverse.id, {
        statut: "Payée",
        mode_paiement: paiementDiverseForm.mode,
        date_paiement: paiementDiverseForm.date || localDateStr(),
      });
      await loadAll();
      setShowPaiementDiverseForm(false);
      setPaiementDiverse(null);
      setPaiementDiverseForm({});
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  // Contrôle de gestion — charges de structure mensuelles
  const saveFrais = async () => {
    if (!fraisForm.mois) return;
    setSaving(true);
    try {
      const payload = {
        mois: fraisForm.mois,
        masse_salariale: fraisForm.masse_salariale!==""&&fraisForm.masse_salariale!=null ? Number(fraisForm.masse_salariale) : null,
        loyer: fraisForm.loyer!==""&&fraisForm.loyer!=null ? Number(fraisForm.loyer) : null,
        carburant: fraisForm.carburant!==""&&fraisForm.carburant!=null ? Number(fraisForm.carburant) : null,
        assurance_vehicules: fraisForm.assurance_vehicules!==""&&fraisForm.assurance_vehicules!=null ? Number(fraisForm.assurance_vehicules) : null,
        entretien_vehicules: fraisForm.entretien_vehicules!==""&&fraisForm.entretien_vehicules!=null ? Number(fraisForm.entretien_vehicules) : null,
        leasing_vehicule: fraisForm.leasing_vehicule!==""&&fraisForm.leasing_vehicule!=null ? Number(fraisForm.leasing_vehicule) : null,
        frais_comptabilite: fraisForm.frais_comptabilite!==""&&fraisForm.frais_comptabilite!=null ? Number(fraisForm.frais_comptabilite) : null,
        frais_bancaires: fraisForm.frais_bancaires!==""&&fraisForm.frais_bancaires!=null ? Number(fraisForm.frais_bancaires) : null,
        telephone_mobile: fraisForm.telephone_mobile!==""&&fraisForm.telephone_mobile!=null ? Number(fraisForm.telephone_mobile) : null,
        abonnement_box: fraisForm.abonnement_box!==""&&fraisForm.abonnement_box!=null ? Number(fraisForm.abonnement_box) : null,
        autres: fraisForm.autres!==""&&fraisForm.autres!=null ? Number(fraisForm.autres) : null,
        cout_horaire_chauffeur: fraisForm.cout_horaire_chauffeur!==""&&fraisForm.cout_horaire_chauffeur!=null ? Number(fraisForm.cout_horaire_chauffeur) : null,
        prix_diesel_litre: fraisForm.prix_diesel_litre!==""&&fraisForm.prix_diesel_litre!=null ? Number(fraisForm.prix_diesel_litre) : null,
        consommation_l_100km: fraisForm.consommation_l_100km!==""&&fraisForm.consommation_l_100km!=null ? Number(fraisForm.consommation_l_100km) : null,
        notes: fraisForm.notes || null,
      };
      if (editFrais) await db.update("frais_generaux_mensuels", editFrais.id, payload);
      else await db.insert("frais_generaux_mensuels", payload);
      await loadAll();
      setShowFraisForm(false); setEditFrais(null); setFraisForm({});
      pushToast("Charges du mois enregistrées", "success");
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };
  const openFraisForm = (row) => {
    setEditFrais(row||null);
    setFraisForm(row ? {...row} : {mois: new Date().toISOString().slice(0,7)+"-01",
      cout_horaire_chauffeur: 27.64, prix_diesel_litre: 2.057, consommation_l_100km: 11});
    setShowFraisForm(true);
  };

  // Contrôle de gestion — relevés mensuels chauffeurs (TrackFleet : km, heures de conduite)
  const [showRelevChfForm, setShowRelevChfForm] = useState(false);
  const [editRelevChf, setEditRelevChf] = useState(null);
  const [relevChfForm, setRelevChfForm] = useState({});
  const saveRelevChf = async () => {
    if (!relevChfForm.mois || !relevChfForm.chauffeur) return;
    setSaving(true);
    try {
      const payload = {
        mois: relevChfForm.mois,
        chauffeur: relevChfForm.chauffeur,
        km: relevChfForm.km!==""&&relevChfForm.km!=null ? Number(relevChfForm.km) : null,
        heures_conduite: relevChfForm.heures_conduite!==""&&relevChfForm.heures_conduite!=null ? Number(relevChfForm.heures_conduite) : null,
        trajets: relevChfForm.trajets!==""&&relevChfForm.trajets!=null ? Number(relevChfForm.trajets) : null,
        notes: relevChfForm.notes || null,
      };
      if (editRelevChf) await db.update("releves_chauffeurs_mensuels", editRelevChf.id, payload);
      else await db.insert("releves_chauffeurs_mensuels", payload);
      await loadAll();
      setShowRelevChfForm(false); setEditRelevChf(null); setRelevChfForm({});
      pushToast("Relevé chauffeur enregistré", "success");
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };
  const openRelevChfForm = (row) => {
    setEditRelevChf(row||null);
    setRelevChfForm(row ? {...row} : {mois: new Date().toISOString().slice(0,7)+"-01", chauffeur:"Sefa"});
    setShowRelevChfForm(true);
  };

  // Contrôle de gestion — prix relevés chez la concurrence
  const savePrixConc = async () => {
    if (!prixConcForm.produit_id || !prixConcForm.prix) return;
    setSaving(true);
    try {
      await db.insert("prix_concurrents", {
        produit_id: prixConcForm.produit_id,
        concurrent: prixConcForm.concurrent || "Freshy",
        prix: Number(prixConcForm.prix),
        date_releve: prixConcForm.date_releve || localDateStr(),
        notes: prixConcForm.notes || null,
      });
      await loadAll();
      setShowPrixConcForm(false); setPrixConcForm({});
      pushToast("Prix concurrent enregistré", "success");
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  // Contrôle de gestion — distance réelle (trajet routier) dépôt → client, via l'API
  // publique OSRM (gratuite, pas de clé). Appelée manuellement (pas à chaque chargement)
  // et met en cache le résultat dans clients.distance_route_km pour ne pas re-calculer
  // à chaque fois. Se rabat sur la distance à vol d'oiseau si l'appel échoue.
  const calculerDistancesReelles = async (forcerTout=false) => {
    const aTraiter = clients.filter(c=>c.lat!=null && c.lng!=null && (forcerTout || c.distance_route_km==null));
    if (aTraiter.length===0) { setCalcDistancesMsg("Toutes les distances sont déjà calculées."); return; }
    setCalcDistancesLoading(true);
    // Position exacte du dépôt (Hesperange) avant de calculer les trajets
    setCalcDistancesMsg("Localisation du dépôt (Hesperange)...");
    let posDepot = await geocodeAddress(DEPOT_ADRESSE);
    if (!posDepot) posDepot = await geocodeAddress("Route de Thionville, Hesperange, Luxembourg");
    if (!posDepot) {
      setCalcDistancesMsg("Adresse du dépôt introuvable (service de localisation indisponible). Réessayez dans un moment.");
      setCalcDistancesLoading(false);
      return;
    }
    DEPOT.lat = posDepot.lat; DEPOT.lng = posDepot.lng;
    setCalcDistancesMsg("Calcul en cours : 0 / "+aTraiter.length);
    let ok=0, fail=0;
    for (let i=0;i<aTraiter.length;i++) {
      const c = aTraiter[i];
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${DEPOT.lng},${DEPOT.lat};${Number(c.lng)},${Number(c.lat)}?overview=false`;
        const res = await fetch(url);
        const data = await res.json();
        const distM = data?.routes?.[0]?.distance;
        if (distM!=null) {
          await db.update("clients", c.id, {distance_route_km: Math.round(distM/100)/10, distance_route_updated_at: new Date().toISOString()});
          ok++;
        } else fail++;
      } catch(e) { fail++; }
      setCalcDistancesMsg("Calcul en cours : "+(i+1)+" / "+aTraiter.length);
      await new Promise(r=>setTimeout(r,300)); // ménage l'API publique gratuite
    }
    await loadAll();
    setCalcDistancesMsg(ok+" distance(s) calculée(s)"+(fail>0?", "+fail+" échec(s) (gardent l'estimation à vol d'oiseau)":""));
    setCalcDistancesLoading(false);
  };

  // Matrice des distances routières (km + minutes) dépôt ↔ clients géolocalisés du Luxembourg.
  const MATRICE_LS = "bossok_matrice_routes_v1";
  const chargerMatrice = async () => {
    try {
      const rows = await sb("distances_routieres?select=origine,destinations");
      const m = {}; rows.forEach(r=>{ m[r.origine]=r.destinations||{}; });
      if (Object.keys(m).length) { setMatriceDist(m); return; }
    } catch(e) { /* table absente ou non accessible : repli navigateur */ }
    try { const ls = JSON.parse(localStorage.getItem(MATRICE_LS)||"null"); if (ls) setMatriceDist(ls); } catch(e) {}
  };
  const calculerMatriceRoutes = async () => {
    setMatriceLoading(true);
    try {
      setMatriceMsg("Localisation du dépôt (Hesperange)...");
      let pos = await geocodeAddress(DEPOT_ADRESSE);
      if (!pos) pos = await geocodeAddress("Route de Thionville, Hesperange, Luxembourg");
      if (!pos) { setMatriceMsg("Adresse du dépôt introuvable. Réessayez dans un moment."); setMatriceLoading(false); return; }
      DEPOT.lat = pos.lat; DEPOT.lng = pos.lng;
      const etrangers = ["Belgique","France","Hollande","Allemagne"];
      const noeuds = [{key:"depot", lat:DEPOT.lat, lng:DEPOT.lng},
        ...clients.filter(c=>c.lat!=null && c.lng!=null && c.statut==="Actif" && (!c.pays||c.pays==="Luxembourg") && !etrangers.includes(c.region))
                  .map(c=>({key:String(c.id), lat:Number(c.lat), lng:Number(c.lng)}))];
      const TAILLE = 45, blocs = [];
      for (let i=0;i<noeuds.length;i+=TAILLE) blocs.push(noeuds.slice(i,i+TAILLE));
      const res = {}; noeuds.forEach(n=>{ res[n.key]={}; });
      let fait = 0; const total = blocs.length*blocs.length;
      for (let bi=0;bi<blocs.length;bi++) for (let bj=0;bj<blocs.length;bj++) {
        setMatriceMsg(`Calcul des trajets routiers : ${fait}/${total} (${noeuds.length-1} clients)`);
        const A = blocs[bi], B = blocs[bj];
        const coords = bi===bj ? A : [...A, ...B];
        const src = A.map((_,k)=>k), dst = bi===bj ? A.map((_,k)=>k) : B.map((_,k)=>A.length+k);
        const t = await osrmTable(coords, src, dst);
        A.forEach((a,ia)=>B.forEach((b,ib)=>{
          const km = t.km?.[ia]?.[ib], mn = t.min?.[ia]?.[ib];
          if (km!=null && a.key!==b.key) res[a.key][b.key] = [Math.round(km/100)/10, Math.round(mn/60*10)/10];
        }));
        fait++; await new Promise(r=>setTimeout(r,1100)); // ménage l'API publique gratuite
      }
      setMatriceDist(res);
      try { localStorage.setItem(MATRICE_LS, JSON.stringify(res)); } catch(e) {}
      let enBase = true;
      try {
        await sbUpsert("distances_routieres", Object.entries(res).map(([origine,destinations])=>({origine, destinations, updated_at:new Date().toISOString()})), "origine");
      } catch(e) { enBase = false; }
      setMatriceMsg(`✓ ${noeuds.length-1} clients — distances routières exactes calculées`+(enBase?"":" (enregistrées sur cet appareil seulement : table partagée non disponible)"));
    } catch(e) {
      setMatriceMsg("Échec du calcul : "+(e?.message||e)+". Réessayez.");
    }
    setMatriceLoading(false);
  };
  useEffect(()=>{ if (page==="planning") chargerMatrice(); }, [page]);

  const marquerDiverseImpayee = async (id) => {
    setSaving(true);
    try {
      await db.update("factures_diverses", id, {statut:"Impayée"});
      setFacturesDiverses(prev=>prev.map(f=>f.id===id?{...f,statut:"Impayée"}:f));
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const supprimerDiverse = (id, numero) => {
    askConfirm(`Supprimer la facture ${numero} ? Cette action est irréversible.`, async () => {
      setSaving(true);
      try {
        await db.delete("factures_diverses", id);
        await loadAll();
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {danger:true, confirmLabel:"Supprimer"});
  };

  const supprimerFacture = async (id, numero) => {
    const facture = factures.find(f => f.id === id);
    // Retrouve les commandes liées, qu'elles soient référencées individuellement
    // ("Commande #12") ou groupées ("Facture groupée — Commande #12, Commande #15").
    const idsLies = facture?.notes
      ? [...facture.notes.matchAll(/Commande #(\d+)/g)].map(m => parseInt(m[1]))
      : [];
    const cmdsLiees = commandes.filter(c => idsLies.includes(c.id));
    const estGroupee = facture?.notes?.startsWith("Facture groupée");

    const confirmMsg = cmdsLiees.length===0
      ? `Supprimer la facture ${numero} ? Cette action est irréversible.`
      : estGroupee
        ? `Supprimer la facture ${numero} ? Le stock des ${cmdsLiees.length} commande(s) qu'elle regroupe sera restauré, et elles redeviendront disponibles pour une nouvelle facturation. Cette action est irréversible.`
        : `Supprimer la facture ${numero} ? La commande liée sera aussi supprimée et son stock restauré. Cette action est irréversible.`;

    askConfirm(confirmMsg, async () => {
      setSaving(true);
      try {
        // Restaure le stock de chaque commande liée
        for (const cmd of cmdsLiees) {
          for (const p of (cmd.produits||[])) {
            const prod = findProduitByNom(produits, p.nom);
            if (!prod) continue;
            const currentQte = stock[prod.id] || 0;
            await updateStock(prod.id, currentQte + p.qte);
          }
        }
        // Facture individuelle liée à UNE commande : on supprime aussi la commande
        // (elle n'a pas d'existence utile sans sa facture, en mode normal).
        // Facture groupée : on garde les commandes, elles redeviennent "à facturer".
        if (!estGroupee) {
          for (const cmd of cmdsLiees) {
            await db.delete("commandes", cmd.id);
          }
        }
        await db.delete("factures", id);
        await loadAll();
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {danger:true, confirmLabel:"Supprimer"});
  };

  // ── NOTES DE CRÉDIT (trop-perçu) ──────────────────────────────────────────
  // Une note de crédit est une ligne de la table "factures" (statut "Avoir", donc exclue des
  // statistiques) marquée type_document="note_credit", avec un solde (credit_restant) utilisable
  // plus tard sur une facture impayée via « Appliquer une note de crédit ».
  const creditsDisponibles = (clientId) => factures.filter(f => f.type_document==="note_credit" && f.client_id===clientId && (parseFloat(f.credit_restant)||0) > 0.004);
  const creerNoteCredit = async () => {
    const m = ncModal; if (!m || m.mode!=="create") return;
    const montant = Math.round((parseFloat(String(m.montant).replace(",","."))||0)*100)/100;
    const client = clients.find(c=>c.id===m.clientId);
    if (!client) { notifyError("Choisissez un client."); return; }
    if (montant <= 0) { notifyError("Indiquez un montant supérieur à 0."); return; }
    if (!String(m.motif||"").trim()) { notifyError("Le motif est obligatoire."); return; }
    setSaving(true);
    try {
      const numero = "NC-" + Date.now().toString().slice(-6);
      const today = new Date().toISOString().split("T")[0];
      await db.insert("factures", {
        numero, client_id: client.id, client_nom: client.nom, client_adresse: client.adresse || "", client_tva: client.tva || "",
        date: today, echeance: today,
        lignes: [{ produitId:"NOTE_CREDIT_EMISE", nom: "Note de crédit — " + String(m.motif).trim(), qte:1, pu:-montant, consigne:0, isCredit:true }],
        tva_pct: 0, statut: "Avoir", notes: String(m.motif).trim(), retours: [],
        type_document: "note_credit", credit_restant: montant, credit_utilisations: [], facture_origine: m.factureNumero || null,
      });
      await loadAll();
      setNcModal(null);
      notifySuccess("Note de crédit " + numero + " créée : " + fmtFull(montant) + " disponibles pour " + client.nom + ".");
    } catch(e) { logError(e); notifyError("Impossible de créer la note de crédit."); }
    finally { setSaving(false); }
  };
  const appliquerNoteCredit = async () => {
    const m = ncModal; if (!m || m.mode!=="apply") return;
    const facture = m.facture;
    const nc = factures.find(f => f.id === m.ncId);
    if (!nc) { notifyError("Choisissez une note de crédit."); return; }
    const montant = Math.round((parseFloat(String(m.montant).replace(",","."))||0)*100)/100;
    const restant = parseFloat(nc.credit_restant)||0;
    const du = totalFact(facture.lignes, facture.tva_pct).total;
    if (montant <= 0) { notifyError("Indiquez un montant supérieur à 0."); return; }
    if (montant > restant + 0.004) { notifyError("Ce montant dépasse le crédit disponible (" + fmtFull(restant) + ")."); return; }
    if (montant > du + 0.004) { notifyError("Ce montant dépasse le total de la facture (" + fmtFull(du) + ")."); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const lignes = [...(facture.lignes||[]), { produitId:"NOTE_CREDIT", nom:"Note de crédit " + nc.numero, qte:1, pu:-montant, consigne:0, noteCredit: nc.numero }];
      const soldeFacture = totalFact(lignes, facture.tva_pct).total;
      await db.update("factures", facture.id, soldeFacture <= 0.004
        ? { lignes, statut: "Payée", mode_paiement: "Note de crédit", date_paiement: today }
        : { lignes });
      try {
        await db.update("factures", nc.id, {
          credit_restant: Math.max(0, Math.round((restant - montant)*100)/100),
          credit_utilisations: [...(nc.credit_utilisations||[]), { facture: facture.numero, montant, date: today }],
        });
      } catch(e2) {
        logError(e2);
        notifyError("Attention : la ligne a été ajoutée à la facture " + facture.numero + " mais le solde de " + nc.numero + " n'a pas pu être mis à jour. Corrigez-le à la main.");
      }
      await loadAll();
      setNcModal(null);
      notifySuccess("Note de crédit " + nc.numero + " appliquée : −" + fmtFull(montant) + " sur la facture " + facture.numero + ".");
    } catch(e) { logError(e); notifyError("Impossible d'appliquer la note de crédit."); }
    finally { setSaving(false); }
  };

  const creerAvoir = async (facture) => {
    askConfirm(`Créer un avoir pour annuler la facture ${facture.numero} ?`, async () => {
      setSaving(true);
      try {
        const avoirNum = "AV-" + Date.now().toString().slice(-6);
        const avoirLignes = (facture.lignes||[]).map(l => ({...l, pu: -l.pu}));
        await db.insert("factures", {
          numero: avoirNum,
          client_id: facture.client_id,
          client_nom: facture.client_nom,
          client_adresse: facture.client_adresse,
          client_tva: facture.client_tva,
          date: new Date().toISOString().split("T")[0],
          echeance: new Date().toISOString().split("T")[0],
          lignes: avoirLignes,
          tva_pct: facture.tva_pct || 0,
          statut: "Avoir",
          notes: "Avoir pour annulation facture " + facture.numero,
          retours: []
        });
        await db.update("factures", facture.id, {statut:"Annulée"});
        await loadAll();
        notifySuccess("Avoir " + avoirNum + " créé. La facture est annulée et les livraisons concernées redeviennent disponibles pour une nouvelle facturation.");
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {confirmLabel:"Créer l'avoir"});
  };

  const [editingCmd, setEditingCmd] = useState(null);
  const showCmdForm = activeWorkTab?.type==="commande";

  const supprimerCommande = async (id) => {
    askConfirm("Supprimer cette commande ? Le stock sera restauré.", async () => {
      setSaving(true);
      try {
        const cmd = commandes.find(c=>c.id===id);
        if (cmd) {
          for (const p of (cmd.produits||[])) {
            const prod = findProduitByNom(produits, p.nom);
            if (!prod) continue;
            const currentQte = stock[prod.id] || 0;
            await updateStock(prod.id, currentQte + p.qte);
          }
          // Repère la facture liée, qu'elle soit individuelle ("Commande #12")
          // ou groupée ("Facture groupée — Commande #12, Commande #15").
          const facture = findFactureForCommande(id);
          if (facture) {
            const estGroupee = facture.notes.startsWith("Facture groupée");
            if (estGroupee) {
              // Une facture groupée couvre plusieurs commandes : on ne l'annule
              // jamais automatiquement, ça pénaliserait les autres commandes
              // qu'elle contient aussi. On prévient simplement l'utilisateur.
              notifyError(`Attention : cette commande faisait partie de la facture groupée ${facture.numero}, qui n'a pas été modifiée. Vérifie-la manuellement si besoin.`);
            } else {
              await db.update("factures", facture.id, {statut: "Annulée"});
            }
          }
        }
        await db.delete("commandes", id);
        await loadAll();
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {danger:true, confirmLabel:"Supprimer"});
  };

  const dupliquerCommande = (cmd) => {
    setEditingCmd(null); // new commande, not edit
    setCmdClientId(cmd.client_id);
    setCmdProduits(cmd.produits||[]);
    setCmdNotes(cmd.notes||"");
    setCmdTransport("");
    setSearchCmdClient("");
    openWorkTab({id:"commande", type:"commande", label:"Nouvelle commande", page:"commandes"});
  };

  const openEditCmd = (cmd) => {
    setEditingCmd(cmd);
    setCmdClientId(cmd.client_id);
    setCmdProduits(cmd.produits||[]);
    setCmdNotes(cmd.notes||"");
    setCmdTransport(cmd.transport ? String(cmd.transport) : "");
    setSearchCmdClient("");
    openWorkTab({id:"commande", type:"commande", label:"Commande — "+(cmd.client_nom||""), page:"commandes"});
  };
  const openNewCmd = () => {
    setEditingCmd(null);
    setCmdClientId(null);
    setCmdProduits([]);
    setCmdNotes("");
    setCmdTransport("");
    setSearchCmdClient("");
    setManualConsigneLignesCmd([]);
    openWorkTab({id:"commande", type:"commande", label:"Nouvelle commande", page:"commandes"});
  };

  const saveCmd = async () => {
    if (!cmdClientId) { notifyError("Choisis un client avant d'enregistrer la commande."); return; }
    // Une commande "transport seul" (sans produit) est autorisée si un montant de transport est saisi.
    if (cmdProduits.length===0 && !(parseFloat(cmdTransport)>0)) { notifyError("Ajoute au moins un produit, ou un montant de transport, avant d'enregistrer."); return; }
    const client = clients.find(c=>c.id===cmdClientId);
    const etaitEdition = !!editingCmd;
    setSaving(true);
    try {
      if (editingCmd) {
        // Ajuster le stock par la différence entre l'ancienne et la nouvelle liste
        // de produits, pour ne jamais déduire/restaurer deux fois.
        const oldMap = {}; (editingCmd.produits||[]).forEach(p=>{oldMap[p.nom]=(oldMap[p.nom]||0)+p.qte;});
        const newMap = {}; cmdProduits.forEach(p=>{newMap[p.nom]=(newMap[p.nom]||0)+p.qte;});
        const tousNoms = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);
        for (const nom of tousNoms) {
          const delta = (newMap[nom]||0) - (oldMap[nom]||0);
          if (delta === 0) continue;
          const prod = findProduitByNom(produits, nom);
          if (!prod) continue;
          const currentQte = stock[prod.id] || 0;
          await updateStock(prod.id, Math.max(0, currentQte - delta));
        }

        const transportMontant = parseFloat(cmdTransport)||0;
        await db.update("commandes", editingCmd.id, {
          client_id: cmdClientId, client_nom: client?.nom||"",
          client_adresse: client?.adresse||"", client_region: client?.region||"",
          client_tel: client?.telephone||"",
          produits: cmdProduits, notes: cmdNotes, transport: transportMontant||null,
          // Commande déjà livrée : on garde le chauffeur qui a réellement livré.
          chauffeur: editingCmd.statut==="Livré" ? (editingCmd.chauffeur||getChauffeur(client?.region||"")) : getChauffeur(client?.region||""),
        });

        // Répercuter les nouvelles lignes sur la facture déjà créée pour cette commande
        const facture = findFactureForCommande(editingCmd.id);
        if (facture) {
          const lignes = cmdProduits.flatMap(p => {
            const produit = findProduitByNom(produits, p.nom);
            const pu = produit ? getClientPrix(produit, client) : 0;
            const consigne = produit?.type_emballage==="VC" ? (CONSIGNE_PRIX[produit.consigne]||0) : 0;
            const qteOfferte = Math.min(p.qteOfferte||0, p.qte);
            const qtePayante = p.qte - qteOfferte;
            const res = [];
            if (qtePayante > 0) res.push({ produitId: produit?.id||"", nom: p.nom, qte: qtePayante, pu, consigne });
            if (qteOfferte > 0) res.push({ produitId: produit?.id||"", nom: p.nom + " (offert)", qte: qteOfferte, pu: 0, consigne, offert: true });
            return res;
          });
          manualConsigneLignesCmd.filter(l=>l.qte>0&&l.unitaire).forEach(l=>{
            const montant = parseFloat(l.qte)*prixConsigne(l.unitaire)*(l.sens==="retour"?-1:1);
            lignes.push({ produitId:"CONSIGNE_MANUELLE", nom: libelleConsigne({label:l.label, taille:l.unitaire, qte:l.qte, sens:l.sens}), qte:1, pu:montant, consigne:0, isCredit: montant<0 });
          });
          if (transportMontant > 0) lignes.push({ produitId:"TRANSPORT_MANUEL", nom:"Transport", qte:1, pu:transportMontant, consigne:0 });
          const noteClientMaj = [client?.commentaire_facture, cmdNotes].filter(Boolean).join(" — ");
          await db.update("factures", facture.id, { lignes, note_client: noteClientMaj });
        }
        setEditingCmd(null);
      } else {
        const suggested = getSuggestedDay(client?.region||"");
        const transportMontant = parseFloat(cmdTransport)||0;
        const created = await db.insert("commandes", {
          client_id: cmdClientId, client_nom: client?.nom||"",
          client_adresse: client?.adresse||"", client_region: client?.region||"",
          client_tel: client?.telephone||"",
          produits: cmdProduits, notes: cmdNotes, transport: transportMontant||null, statut: "En attente",
          chauffeur: suggested.dayIdx <= 1 ? "A" : getChauffeur(client?.region||""),
          date_commande: today, date_livraison: suggested.date||tomorrow,
          jour_livraison: suggested.day,
        });
        const newCmd = Array.isArray(created) ? created[0] : created;

        // Déduire le stock immédiatement (les commandes finissent quasi toujours livrées)
        for (const p of cmdProduits) {
          const prod = findProduitByNom(produits, p.nom);
          if (!prod) continue;
          const currentQte = stock[prod.id] || 0;
          await updateStock(prod.id, Math.max(0, currentQte - p.qte));
        }

        // Créer la facture immédiatement, liée à cette commande —
        // SAUF pour les clients en facturation groupée : la commande reste
        // "en attente de facturation", regroupée plus tard avec d'autres.
        if (client?.mode_facturation !== "groupee") {
          const ech = new Date(); ech.setDate(ech.getDate()+7);
          const num = genererNumeroFacture(today);
          const lignes = cmdProduits.flatMap(p => {
            const produit = findProduitByNom(produits, p.nom);
            const pu = produit ? getClientPrix(produit, client) : 0;
            const consigne = produit?.type_emballage==="VC" ? (CONSIGNE_PRIX[produit.consigne]||0) : 0;
            const qteOfferte = Math.min(p.qteOfferte||0, p.qte);
            const qtePayante = p.qte - qteOfferte;
            const res = [];
            if (qtePayante > 0) res.push({ produitId: produit?.id||"", nom: p.nom, qte: qtePayante, pu, consigne });
            if (qteOfferte > 0) res.push({ produitId: produit?.id||"", nom: p.nom + " (offert)", qte: qteOfferte, pu: 0, consigne, offert: true });
            return res;
          });
          manualConsigneLignesCmd.filter(l=>l.qte>0&&l.unitaire).forEach(l=>{
            const montant = parseFloat(l.qte)*prixConsigne(l.unitaire)*(l.sens==="retour"?-1:1);
            lignes.push({ produitId:"CONSIGNE_MANUELLE", nom: libelleConsigne({label:l.label, taille:l.unitaire, qte:l.qte, sens:l.sens}), qte:1, pu:montant, consigne:0, isCredit: montant<0 });
          });
          if (transportMontant > 0) lignes.push({ produitId:"TRANSPORT_MANUEL", nom:"Transport", qte:1, pu:transportMontant, consigne:0 });
          await db.insert("factures", {
            numero: num, client_id: cmdClientId,
            client_nom: client?.nom||"", client_adresse: client?.adresse||"",
            client_tva: client?.tva||"",
            date: today, echeance: ech.toISOString().split("T")[0],
            lignes, statut: "Impayée", notes: `Commande #${newCmd.id}`, retours: [],
            note_client: [client?.commentaire_facture, cmdNotes].filter(Boolean).join(" — "),
            tva_pct: clientEstExonere(client) ? 0 : 3,
          });
        }
      }
      await loadAll();
      setCmdClientId(null); setCmdProduits([]); setCmdNotes(""); setCmdTransport(""); setSearchCmdClient("");
      setManualConsigneLignesCmd([]);
      closeWorkTab("commande");
      notifySuccess(etaitEdition ? "✅ Commande mise à jour — modifications enregistrées." : "✅ Commande enregistrée.");
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const marquerLivre = async (id) => {
    setSaving(true);
    try {
      const cmd = commandes.find(c=>c.id===id);
      if (!cmd) return;

      await db.update("commandes", id, {statut:"Livré"});
      await loadAll();

      // Le stock et la facture sont déjà créés depuis la commande — on propose
      // simplement d'imprimer la facture existante.
      const facture = findFactureForCommande(id);
      if (facture) {
        const client = clients.find(c=>c.id===cmd.client_id);
        setLastFacture({ facture, client });
      }
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const imprimerFactureCommande = (cmd) => {
    const facture = findFactureForCommande(cmd.id);
    if (!facture) {
      notifyError("Aucune facture liée à cette commande n'a été trouvée.");
      return;
    }
    const client = clients.find(c => c.id === cmd.client_id);
    const imp = factures.filter(x => x.client_id === cmd.client_id && x.statut === "Impayée" && x.id !== facture.id);
    const solde = soldeConsignes(cmd.client_id).reduce((s, r) => s + r.solde * r.consigne, 0);
    generatePDF(facture, client, imp, solde, soldeConsignes(cmd.client_id));
  };


  const imprimerBonLivraison = (cmd) => {
    const client = clients.find(c => c.id === cmd.client_id);
    generateBonLivraison(cmd, client);
  };

  const updateStock = async (produitId, qte) => {
    const newQte = Math.max(0, qte);
    setStock(prev=>({...prev,[produitId]:newQte}));
    try {
      const existing = await db.get("stock", `produit_id=eq.${produitId}`);
      if (existing.length > 0) {
        await sb(`stock?produit_id=eq.${produitId}`, "PATCH", {quantite: newQte, updated_at: new Date().toISOString()});
      } else {
        await sb("stock", "POST", {produit_id: produitId, quantite: newQte});
      }
    } catch(e) { logError(e, "updateStock"); }
  };

  const saveRetour = async () => {
    const f = factures.find(x=>x.id===showRetour);
    if (!f) return;
    setSaving(true);
    try {
      const retours = Object.entries(retourQtes).filter(([,v])=>parseFloat(v)>0).map(([k,qte])=>{
        const [nom,cons] = k.split("|||");
        return {nom, consigne:parseFloat(cons), qte:parseFloat(qte)};
      });
      await db.update("factures", showRetour, {retours:[...(f.retours||[]),...retours]});
      await loadAll();
      setShowRetour(null); setRetourQtes({});
    } catch(e) { logError(e); }
    finally { setSaving(false); }
  };

  const updatePrixIndividuel = async (clientId, produitId, val) => {
    const client = clients.find(c=>c.id===clientId);
    if (!client) return;
    const newPrix = {...(client.prix_individuels||{})};
    const v = parseFloat(val);
    if (isNaN(v) || val==="") delete newPrix[produitId];
    else newPrix[produitId] = v;
    try {
      await db.update("clients", clientId, {prix_individuels: newPrix});
      setClients(prev=>prev.map(c=>c.id===clientId?{...c,prix_individuels:newPrix}:c));
    } catch(e) { console.error(e); }
  };

  const addCreditConsignes = (clientId) => {
    const { total, entries } = creditManuelDisponibleDetail(clientId);
    if (total <= 0) return;
    const detail = entries.map(e => `${e.quantite}x ${e.produit_nom||"consigne"}`).join(", ");
    const nom = detail ? `Retour consignes (${detail})` : "Retour consignes";
    setFactLignes(prev => {
      const filtered = prev.filter(l => !l.isCredit);
      return [...filtered, {
        produitId: "CREDIT_CONSIGNES",
        nom,
        qte: 1,
        pu: -total,
        consigne: 0,
        isCredit: true
      }];
    });
  };

  const addLigneFact = (prod, client) => {
    const pu = getClientPrix(prod, client);
    const consigne = prod.type_emballage==="VC" ? (CONSIGNE_PRIX[prod.consigne]||0) : 0;
    setFactLignes(prev=>{
      const ex = prev.find(l=>l.produitId===prod.id && !l.offert);
      if (ex) return prev.map(l=>(l.produitId===prod.id && !l.offert)?{...l,qte:l.qte+1}:l);
      return [...prev,{produitId:prod.id,nom:prod.nom,qte:1,pu,consigne}];
    });
  };

  // Bascule 1 unité d'une ligne de facture vers une ligne "offert" (gratuite,
  // consigne inchangée) du même produit — permet d'offrir une partie d'une
  // quantité (ex: 1 offert sur 5 commandés) sans tout passer à 0€.
  const offrirUniteFact = (i) => {
    setFactLignes(prev => {
      const line = prev[i];
      if (!line || line.qte<=0 || line.offert) return prev;
      let next = prev.map((x,j)=>j===i?{...x,qte:x.qte-1}:x).filter(x=>x.qte>0);
      const offertIdx = next.findIndex(x=>x.produitId===line.produitId && x.offert);
      if (offertIdx>=0) next = next.map((x,j)=>j===offertIdx?{...x,qte:x.qte+1}:x);
      else next = [...next, {produitId:line.produitId, nom: line.nom + " (offert)", qte:1, pu:0, consigne:line.consigne, offert:true}];
      return next;
    });
  };

  // ── STYLES ─────────────────────────────────────────────────────
  const S = {
    app:{fontFamily:"'Inter',system-ui,sans-serif",background:"#F8FAFC",minHeight:"100vh",display:"flex"},
    sidebar:{width:224,background:"#fff",color:"#0F172A",borderRight:"1px solid #E5E7EB",display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:200,
      transform: isMobile ? (sidebarOpen?"translateX(0)":"translateX(-100%)") : "none",
      transition:"transform 0.2s ease", boxShadow: isMobile&&sidebarOpen ? "8px 0 24px rgba(15,23,42,0.15)" : "none"},
    main:{marginLeft: isMobile?0:224, flex:1, minWidth:0},
    topbar:{background:"linear-gradient(90deg,#1E3A8A,#172554)",padding: isMobile?"0 14px":"0 28px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 8px rgba(15,23,42,0.2)"},
    page:{padding: isMobile?"16px 14px":"24px 28px", maxWidth:1100, margin:"0 auto"},
    card:{background:"#fff",borderRadius:12,border:"1px solid #E5E7EB",padding: isMobile?14:18,boxShadow:"0 1px 2px rgba(15,23,42,0.04)"},
    btn:(bg,col)=>({padding:"9px 18px",background:bg||"#1D4ED8",color:col||"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",opacity:saving?0.7:1,letterSpacing:"0.1px"}),
    input:{width:"100%",padding:"9px 12px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
    badge:(bg,col)=>({fontSize:11,padding:"3px 9px",borderRadius:999,background:bg,color:col,fontWeight:600,display:"inline-block"}),
    modal:{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:300,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding: isMobile?0:16},
    modalBox:{background:"#fff",borderRadius: isMobile?"16px 16px 0 0":16,padding: isMobile?18:26,maxWidth:640,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(15,23,42,0.18)"},
    tab:(a)=>({padding:"8px 16px",border:"none",borderBottom:a?"2px solid #1D4ED8":"2px solid transparent",background:"transparent",cursor:"pointer",fontSize:13,fontWeight:a?700:500,color:a?"#1D4ED8":"#6B7280"}),
    kpi:(c)=>({background:"#fff",borderRadius:12,border:"1px solid #E5E7EB",padding:"16px 18px",borderLeft:"4px solid "+c,boxShadow:"0 1px 2px rgba(15,23,42,0.04)"}),
    navItem:(a)=>({display:"flex",alignItems:"center",gap:11,padding:"10px 14px",borderRadius:8,cursor:"pointer",marginBottom:2,background:a?"#EFF6FF":"transparent",color:a?"#1D4ED8":"#475569",fontSize:14,fontWeight:a?600:500,borderLeft:a?"3px solid #1D4ED8":"3px solid transparent"}),
  };

  const NAV = [
    {k:"calendrier",icon:"calendrier",label:"Calendrier"},
    {k:"dashboard",icon:"dashboard",label:"Dashboard"},
    {k:"controle",icon:"barChart2",label:"Contrôle de gestion"},
    {k:"caisse",icon:"caisse",label:"Caisse"},
    {k:"clients",icon:"clients",label:"Clients"},
    {k:"carte",icon:"carte",label:"Carte"},
    {k:"factures",icon:"factures",label:"Factures"},
    {k:"diverses",icon:"diverses",label:"Factures diverses"},
    {k:"commandes",icon:"commandes",label:"Commandes"},
    {k:"planning",icon:"planning",label:"Planning"},
    {k:"stock",icon:"stock",label:"Stock"},
    {k:"consignes",icon:"consignes",label:"Consignes"},
    {k:"produits",icon:"produits",label:"Produits"},
    {k:"zones",icon:"zones",label:"Zones"},
  ];

  const PAGE_TITLES = {calendrier:"Calendrier",dashboard:"Tableau de bord",controle:"Contrôle de gestion",caisse:"Caisse",clients:"Clients",carte:"Carte des clients",factures:"Factures",diverses:"Factures diverses",commandes:"Commandes",planning:"Planning livraisons",stock:"Stock",consignes:"Consignes verre",produits:"Catalogue produits",zones:"Zones & Clients"};

  if ((loading || role===null) && !error) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8FAFC",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:16}}>🍺</div>
        <div style={{fontSize:18,fontWeight:700,color:"#0F172A"}}>Hondro</div>
        <div style={{fontSize:13,color:"#94A3B8",marginTop:8}}>Chargement des données...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8FAFC",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:400}}>
        <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
        <div style={{fontSize:16,fontWeight:700,color:"#DC2626",marginBottom:8}}>Erreur de connexion</div>
        <div style={{fontSize:13,color:"#6B7280",marginBottom:16}}>{error}</div>
        <button onClick={loadAll} style={S.btn()}>Réessayer</button>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`
        input:focus, select:focus, textarea:focus { border-color:#1D4ED8 !important; box-shadow:0 0 0 3px rgba(29,78,216,0.12); }
        button { transition: opacity 0.12s ease, transform 0.08s ease, filter 0.12s ease; }
        button:hover:not(:disabled) { filter: brightness(0.95); }
        button:active { transform: scale(0.97); }
        tbody tr { transition: background 0.1s ease; }
        tbody tr:hover { background:#F8FAFC !important; }
        .nav-hover:hover { background:#F8FAFC !important; }
        .menu-item:hover { background:#F9FAFB !important; }
        ::selection { background: #BFDBFE; }
        html, body { overflow-x: hidden; max-width: 100%; }
        @keyframes toastIn { from { opacity:0; transform:translateY(10px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes confirmIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
      `}</style>

      {/* NOTIFICATIONS (toasts) */}
      <div style={{position:"fixed",bottom:16,right:16,zIndex:500,display:"flex",flexDirection:"column",gap:8,maxWidth:340,width:isMobile?"calc(100% - 32px)":340}}>
        {toasts.map(t=>{
          const cfg = t.type==="success" ? {bg:"#0F172A",bar:"#22C55E",icon:"check"}
            : t.type==="error" ? {bg:"#0F172A",bar:"#EF4444",icon:"danger"}
            : {bg:"#0F172A",bar:"#3B82F6",icon:"info"};
          return(
            <div key={t.id} style={{background:cfg.bg,color:"#fff",borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"flex-start",gap:10,boxShadow:"0 10px 30px rgba(0,0,0,0.28)",borderLeft:"3px solid "+cfg.bar,animation:"toastIn .18s ease"}}>
              <span style={{color:cfg.bar,marginTop:1}}><Icon name={cfg.icon} size={16}/></span>
              <div style={{flex:1,fontSize:12.5,lineHeight:1.45}}>{t.message}</div>
              <button onClick={()=>dismissToast(t.id)} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",padding:0,marginTop:1}}><Icon name="close" size={13}/></button>
            </div>
          );
        })}
      </div>

      {/* ALERTE NOUVELLE COMMANDE WEB / DEMANDE DE COMPTE */}
      {alerteWeb && (alerteWeb.commandes.length>0 || alerteWeb.comptes.length>0) && (
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:700,width:"calc(100% - 32px)",maxWidth:420,background:"#0F172A",color:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 16px 48px rgba(0,0,0,0.45)",borderTop:"4px solid #F59E0B",animation:"toastIn 0.25s ease"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>🔔 {alerteWeb.commandes.length>0 && alerteWeb.comptes.length>0 ? "Du nouveau sur le portail" : alerteWeb.commandes.length>0 ? (alerteWeb.commandes.length>1 ? "Nouvelles commandes web" : "Nouvelle commande web") : (alerteWeb.comptes.length>1 ? "Nouvelles demandes de compte" : "Nouvelle demande de compte")}</div>
          <div style={{fontSize:13,lineHeight:1.5,color:"#CBD5E1",marginBottom:12,maxHeight:130,overflowY:"auto"}}>
            {alerteWeb.commandes.map(c=><div key={"c"+c.id}>🛒 Commande n°{c.id} · {c.client_nom||"client"}</div>)}
            {alerteWeb.comptes.map(c=><div key={"k"+c.id}>👤 Demande de compte · {c.nom||"client"}</div>)}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setAlerteWeb(null)} style={{background:"transparent",border:"1px solid #475569",color:"#CBD5E1",borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer"}}>Fermer</button>
            <button onClick={()=>{
              const versCommandes = alerteWeb.commandes.length>0;
              setAlerteWeb(null);
              loadAll();
              if (versCommandes) { setCmdView("web"); setPage("commandes"); } else { setPage("clients"); }
            }} style={{background:"#F59E0B",border:"none",color:"#0F172A",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Voir</button>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION */}
      {confirmDialog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setConfirmDialog(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,padding:24,maxWidth:380,width:"100%",boxShadow:"0 24px 64px rgba(15,23,42,0.25)",animation:"confirmIn .16s ease"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:18}}>
              <div style={{width:34,height:34,borderRadius:9,background:confirmDialog.danger?"#FEE2E2":"#EFF6FF",color:confirmDialog.danger?"#DC2626":"#1D4ED8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon name={confirmDialog.danger?"warning":"info"} size={17}/>
              </div>
              <div style={{fontSize:13.5,color:"#1F2937",lineHeight:1.5,paddingTop:6}}>{confirmDialog.message}</div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmDialog(null)} style={{padding:"8px 16px",background:"#F1F5F9",color:"#374151",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
              <button onClick={()=>{const fn=confirmDialog.onConfirm;setConfirmDialog(null);fn&&fn();}}
                style={{padding:"8px 16px",background:confirmDialog.danger?"#DC2626":"#1D4ED8",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {confirmDialog.confirmLabel||"Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobile&&sidebarOpen&&(
        <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.4)",zIndex:150}}/>
      )}
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{padding:"18px 16px",borderBottom:"1px solid #F1F5F9"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src={LOGO} alt="Hondro" style={{width:38,height:38,objectFit:"contain",borderRadius:8}}/>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#0F172A",letterSpacing:"-0.2px"}}>Hondro</div>
              <div style={{fontSize:11,color:"#94A3B8"}}>Luxembourg</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,padding:"12px 10px",overflowY:"auto"}}>
          {(lectureSeule ? NAV.filter(n=>n.k==="factures") : NAV).map(n=>{
            const stockAlerteCount = n.k==="stock" ? produits.filter(p=>p.statut!=="Passif"&&(stock[p.id]||0)<=STOCK_BAS_SEUIL).length : 0;
            const demandesCompteCount = n.k==="clients" ? clients.filter(c=>c.statut_compte==="en_attente").length : 0;
            const commandesEnAttenteCount = n.k==="commandes" ? commandes.filter(c=>c.statut==="En attente").length : 0;
            const badgeCount = stockAlerteCount || demandesCompteCount || commandesEnAttenteCount;
            return(
              <div key={n.k} className={page===n.k?"":"nav-hover"} style={S.navItem(page===n.k)} onClick={()=>{setSelClient(null);setPage(n.k);if(isMobile)setSidebarOpen(false);}}>
                <span style={{display:"flex",color:page===n.k?"#1D4ED8":"#64748B"}}><Icon name={n.icon} size={16}/></span><span style={{flex:1}}>{n.label}</span>
                {badgeCount>0&&(
                  <span style={{background:"#DC2626",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700}}>
                    {badgeCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{padding:"14px 16px",borderTop:"1px solid #F1F5F9",fontSize:11,color:"#94A3B8"}}>
          {saving && <span style={{color:"#1D4ED8",fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}><Icon name="refresh" size={11}/> Sauvegarde...</span>}
          {!saving && !lectureSeule && <span>✅ {clientsActifs.length} clients actifs</span>}
          {!saving && lectureSeule && <span>🔒 Accès comptable — lecture seule</span>}
        </div>
        <div style={{padding:"10px 16px 16px",borderTop:"1px solid #F1F5F9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session?.user?.email}</span>
          <button onClick={onLogout} style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",fontSize:11,fontWeight:600,flexShrink:0,marginLeft:6}}>Déconnexion</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
            {isMobile&&(
              <button onClick={()=>setSidebarOpen(true)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:36,height:36,borderRadius:8,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="menu" size={17}/></button>
            )}
            <div style={{fontWeight:700,fontSize:isMobile?15:18,color:"#fff",letterSpacing:"-0.2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{PAGE_TITLES[page]}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {page==="clients" && <button style={S.btn("#fff","#1D4ED8")} onClick={()=>{setEditClient(null);setClientForm({type:"Snack",nom:"",adresse:"",telephone:"",email:"",region:"",statut:"Actif",tva:"",conditions:"30 jours",categorie_fidelite:""});setShowClientForm(true);}}>{isMobile?"+":"+ Nouveau client"}</button>}
            {page==="factures" && !lectureSeule && <button style={S.btn("#fff","#1D4ED8")} onClick={openNewFactureTab}>{isMobile?"+":"+ Nouvelle facture"}</button>}
            {page==="factures" && !lectureSeule && <button style={S.btn("#fff","#6D28D9")} onClick={()=>setNcModal({mode:"create",clientId:null,factureNumero:"",montant:"",motif:""})}>{isMobile?"+ NC":"+ Note de crédit"}</button>}
            {page==="diverses" && !showDiverseForm && <button style={S.btn("#fff","#1D4ED8")} onClick={openNewDiverseTab}>{isMobile?"+":"+ Nouvelle facture"}</button>}
            {page==="commandes" && (showCmdForm ? (
              <button style={{...S.btn("#fff","#1D4ED8"),opacity:saving?0.6:1}} onClick={saveCmd} disabled={saving}>{isMobile?"✅":"✅ Enregistrer"}</button>
            ) : (
              <button style={S.btn("#fff","#1D4ED8")} onClick={openNewCmd}>{isMobile?"+":"+ Nouvelle commande"}</button>
            ))}
            {page==="produits" && <button style={S.btn("#fff","#1D4ED8")} onClick={openNewProduitTab}>{isMobile?"+":"+ Nouveau produit"}</button>}
            {page==="calendrier" && <button style={S.btn("#fff","#1D4ED8")} onClick={()=>{setEditEvent(null);setEventForm({titre:"",description:"",date_debut:new Date().toISOString().split("T")[0],date_fin:"",toute_journee:false,heure_debut:"09:00",heure_fin:"10:00",couleur:"#1D4ED8"});setShowEventForm(true);}}>{isMobile?"+":"+ Nouvel événement"}</button>}
            <button style={{...S.btn("rgba(255,255,255,0.15)","#fff"),display:"flex",alignItems:"center",justifyContent:"center",padding:"9px 11px"}} onClick={loadAll}><Icon name="refresh" size={15}/></button>
          </div>
        </div>

        <div style={S.page}>

{/* ══ CAISSE ═════════════════════════════════════════════════════ */}
{page==="caisse" && (()=>{
  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const refD = new Date(caisseRef+"T00:00:00");
  let periodStart, periodEnd, periodLabel;

  if (caissePeriode === "semaine") {
    const dow = (refD.getDay()+6)%7;
    const weekStart = new Date(refD); weekStart.setDate(refD.getDate()-dow);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
    periodStart = localDateStr(weekStart);
    periodEnd = localDateStr(weekEnd);
    periodLabel = `${weekStart.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit'})} → ${weekEnd.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit',year:'numeric'})}`;
  } else {
    const monthStart = new Date(refD.getFullYear(), refD.getMonth(), 1);
    const monthEnd = new Date(refD.getFullYear(), refD.getMonth()+1, 0);
    periodStart = localDateStr(monthStart);
    periodEnd = localDateStr(monthEnd);
    periodLabel = `${monthNames[refD.getMonth()]} ${refD.getFullYear()}`;
  }

  const changePeriod = (delta) => {
    const d = new Date(caisseRef+"T00:00:00");
    if (caissePeriode === "semaine") d.setDate(d.getDate() + delta*7);
    else d.setMonth(d.getMonth() + delta);
    setCaisseRef(localDateStr(d));
  };

  const facturesPeriode = factures.filter(f => {
    if (f.statut !== "Payée") return false;
    const d = f.date_paiement || f.date;
    return d >= periodStart && d <= periodEnd;
  }).sort((a,b)=>(b.date_paiement||b.date).localeCompare(a.date_paiement||a.date));

  const sansMode = facturesPeriode.filter(f => !f.mode_paiement);
  const totalParMode = {"Espèces":0, "Carte":0, "Virement":0};
  facturesPeriode.forEach(f => {
    if (f.mode_paiement && totalParMode[f.mode_paiement] !== undefined) {
      totalParMode[f.mode_paiement] += totalFact(f.lignes, f.tva_pct).total;
    }
  });
  const totalGeneral = facturesPeriode.reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).total,0);

  return(
  <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,...S.card,padding:"10px 16px"}}>
      <button onClick={()=>changePeriod(-1)} style={{...S.btn("#F1F5F9","#374151"),padding:"6px 14px",fontSize:13}}>‹</button>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontWeight:700,fontSize:15}}>{periodLabel}</div>
        <button onClick={()=>setCaisseRef(new Date().toISOString().split("T")[0])}
          style={{...S.btn("#EFF6FF","#1D4ED8"),padding:"4px 10px",fontSize:11}}>Aujourd'hui</button>
      </div>
      <button onClick={()=>changePeriod(1)} style={{...S.btn("#F1F5F9","#374151"),padding:"6px 14px",fontSize:13}}>›</button>
    </div>

    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {[["semaine","Semaine"],["mois","Mois"]].map(([k,l])=>(
        <button key={k} onClick={()=>setCaissePeriode(k)}
          style={{...S.btn(caissePeriode===k?"#1D4ED8":"#F1F5F9",caissePeriode===k?"#fff":"#374151"),padding:"6px 16px",fontSize:12}}>{l}</button>
      ))}
    </div>

    {sansMode.length>0&&(
      <div style={{...S.card,marginBottom:14,background:"#FFFBEB",border:"1px solid #FDE68A",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>💡</span>
        <div style={{fontSize:12,color:"#92400E"}}>
          <strong>{sansMode.length} facture{sansMode.length>1?"s":""}</strong> payée{sansMode.length>1?"s":""} sur cette période sans moyen de paiement renseigné.
          Clique sur 💰 depuis la liste ci-dessous pour le compléter.
        </div>
      </div>
    )}

    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Espèces",v:totalParMode["Espèces"],c:"#059669",icon:"💵"},
        {l:"Carte",v:totalParMode["Carte"],c:"#1D4ED8",icon:"💳"},
        {l:"Virement",v:totalParMode["Virement"],c:"#7C3AED",icon:"🏦"},
        {l:"Total encaissé",v:totalGeneral,c:"#0F172A",icon:"💰"},
      ].map((s,i)=>(
        <div key={i} style={S.kpi(s.c)}>
          <div style={{fontSize:18,marginBottom:2}}>{s.icon}</div>
          <div style={{fontSize:17,fontWeight:800,color:s.c}}>{fmtFull(s.v)}</div>
          <div style={{fontSize:11,color:"#374151",fontWeight:600}}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Encaissements — {facturesPeriode.length} facture{facturesPeriode.length>1?"s":""}</div>
      {facturesPeriode.length===0?(
        <div style={{textAlign:"center",color:"#9CA3AF",padding:"30px 0",fontSize:12}}>Aucun encaissement sur cette période</div>
      ):(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:"2px solid #E5E7EB",background:"#F9FAFB"}}>
                {["Date encaissement","N° Facture","Client","Montant","Mode",""].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"7px 10px",color:"#6B7280",fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturesPeriode.map(f=>{
                const modeStyle = f.mode_paiement==="Espèces"?{bg:"#DCFCE7",text:"#166534"}:f.mode_paiement==="Carte"?{bg:"#DBEAFE",text:"#1D4ED8"}:f.mode_paiement==="Virement"?{bg:"#EDE9FE",text:"#6D28D9"}:{bg:"#FEF3C7",text:"#92400E"};
                return(
                  <tr key={f.id} style={{borderBottom:"1px solid #F1F5F9"}}>
                    <td style={{padding:"6px 10px"}}>{f.date_paiement||f.date}</td>
                    <td style={{padding:"6px 10px",fontWeight:600}}>{f.numero}</td>
                    <td style={{padding:"6px 10px"}}>{f.client_nom}</td>
                    <td style={{padding:"6px 10px",fontWeight:700}}>{fmtFull(totalFact(f.lignes, f.tva_pct).total)}</td>
                    <td style={{padding:"6px 10px"}}><span style={S.badge(modeStyle.bg,modeStyle.text)}>{f.mode_paiement||"Non renseigné"}</span></td>
                    <td style={{padding:"6px 10px"}}>
                      <button title="Modifier le mode" onClick={()=>{setPaiementFacture(f);setPaiementForm({mode:f.mode_paiement||"",date:f.date_paiement||f.date});setShowPaiementForm(true);}}
                        style={{...S.btn("#F3F4F6","#374151"),padding:"3px 8px",fontSize:10}}>💰</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
})()}

{/* ══ CARTE ══════════════════════════════════════════════════════ */}
{page==="carte" && (()=>{
  const clientsAvecCoords = clients.filter(c => c.lat && c.lng);
  const sansCoords = clients.filter(c => c.statut !== "Passif" && (!c.lat || !c.lng));

  return(
  <div>
    {sansCoords.length > 0 && (
      <div style={{...S.card,marginBottom:14,background:"#FFFBEB",border:"1px solid #FDE68A",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>💡</span>
        <div style={{fontSize:12,color:"#92400E"}}>
          <strong>{sansCoords.length} client{sansCoords.length>1?"s":""} actif{sansCoords.length>1?"s":""}</strong> pas encore géolocalisé{sansCoords.length>1?"s":""}.
          Va dans l'onglet <strong>Clients</strong> → bouton "📍 Géolocaliser les clients" en haut à droite.
        </div>
      </div>
    )}
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:14}}>🗺️ {clientsAvecCoords.length} client{clientsAvecCoords.length>1?"s":""} sur la carte</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{display:"flex",gap:10,fontSize:11,color:"#6B7280"}}>
            <span><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:"#D97706",marginRight:3}}/>Gold</span>
            <span><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:"#64748B",marginRight:3}}/>Silver</span>
            <span><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:"#1D4ED8",marginRight:3}}/>Autres</span>
          </div>
          <button onClick={()=>window.print()} style={{...S.btn(),padding:"6px 14px",fontSize:12}}>🖨️ Imprimer</button>
        </div>
      </div>
      <ClientsMap clients={clientsAvecCoords}/>
    </div>
  </div>
  );
})()}

{/* ══ CALENDRIER ═════════════════════════════════════════════════ */}
{page==="calendrier" && (()=>{
  const {year, month} = calMonth;
  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month+1, 0);
  const daysInMonth = lastOfMonth.getDate();
  const firstDow = (firstOfMonth.getDay()+6)%7;
  const todayStr = new Date().toISOString().split("T")[0];

  const getEventsForDate = (dateStr) => {
    return evenements.filter(e=>{
      const start = e.date_debut;
      const end = e.date_fin || e.date_debut;
      return dateStr >= start && dateStr <= end;
    }).sort((a,b)=>(a.heure_debut||"").localeCompare(b.heure_debut||""));
  };

  const cells = [];
  for (let i=0;i<firstDow;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const changeMonth = (delta) => {
    let newMonth = month + delta, newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalMonth({year:newYear, month:newMonth});
  };

  const openDayEvent = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setEditEvent(null);
    setEventForm({titre:"",description:"",date_debut:dateStr,date_fin:"",toute_journee:false,heure_debut:"09:00",heure_fin:"10:00",couleur:"#1D4ED8"});
    setShowEventForm(true);
  };

  const openEditEvent = (evt, e) => {
    if (e) e.stopPropagation();
    setEditEvent(evt);
    setEventForm({
      titre:evt.titre, description:evt.description||"",
      date_debut:evt.date_debut, date_fin:evt.date_fin||"",
      toute_journee:evt.toute_journee!==false,
      heure_debut:evt.heure_debut||"", heure_fin:evt.heure_fin||"",
      couleur:evt.couleur||"#1D4ED8",
    });
    setShowEventForm(true);
  };

  const upcoming = evenements
    .filter(e=>(e.date_fin||e.date_debut) >= todayStr)
    .sort((a,b)=>a.date_debut.localeCompare(b.date_debut))
    .slice(0,4);

  // Vue semaine
  const jourNoms = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
  const refD = new Date(calWeekRef+"T00:00:00");
  const dow = (refD.getDay()+6)%7;
  const weekStart = new Date(refD); weekStart.setDate(refD.getDate()-dow);
  const weekDays = [...Array(7)].map((_,i)=>{const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d;});
  const weekEnd = weekDays[6];

  const changeWeek = (deltaWeeks) => {
    const d = new Date(calWeekRef+"T00:00:00");
    d.setDate(d.getDate() + deltaWeeks*7);
    setCalWeekRef(localDateStr(d));
  };

  const openDayEventDate = (dateStr) => {
    setEditEvent(null);
    setEventForm({titre:"",description:"",date_debut:dateStr,date_fin:"",toute_journee:false,heure_debut:"09:00",heure_fin:"10:00",couleur:"#1D4ED8"});
    setShowEventForm(true);
  };

  return(
  <div>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2.4fr 1fr",gap:16}}>
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,...S.card,padding:"10px 16px"}}>
          <button onClick={()=>calViewMode==="mois"?changeMonth(-1):changeWeek(-1)} style={{...S.btn("#F1F5F9","#374151"),padding:"6px 14px",fontSize:13}}>‹</button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontWeight:700,fontSize:15}}>
              {calViewMode==="mois" ? `${monthNames[month]} ${year}` :
                `${weekStart.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit'})} → ${weekEnd.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit',year:'numeric'})}`}
            </div>
            <button onClick={()=>{const d=new Date();setCalMonth({year:d.getFullYear(),month:d.getMonth()});setCalWeekRef(localDateStr(d));}}
              style={{...S.btn("#EFF6FF","#1D4ED8"),padding:"4px 10px",fontSize:11}}>Aujourd'hui</button>
          </div>
          <button onClick={()=>calViewMode==="mois"?changeMonth(1):changeWeek(1)} style={{...S.btn("#F1F5F9","#374151"),padding:"6px 14px",fontSize:13}}>›</button>
        </div>

        <div style={{display:"flex",gap:4,marginBottom:12}}>
          {[["mois","Mois"],["semaine","Semaine"]].map(([k,l])=>(
            <button key={k} onClick={()=>setCalViewMode(k)}
              style={{...S.btn(calViewMode===k?"#1D4ED8":"#F1F5F9",calViewMode===k?"#fff":"#374151"),padding:"6px 16px",fontSize:12}}>{l}</button>
          ))}
        </div>

        {calViewMode==="mois" ? (
        <div style={S.card}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:6}}>
            {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#9CA3AF",padding:"4px 0"}}>{d}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {cells.map((day,idx)=>{
              if (day===null) return <div key={idx} style={{minHeight:120}}/>;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayEvents = getEventsForDate(dateStr);
              const isToday = dateStr===todayStr;
              const isWeekend = idx%7>=5;
              return(
                <div key={idx} onClick={()=>openDayEvent(day)}
                  style={{minHeight:120,border:"1px solid #F1F5F9",borderRadius:8,padding:"5px 5px",cursor:"pointer",background:isWeekend?"#FAFBFC":"#fff",display:"flex",flexDirection:"column",gap:2}}>
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:isToday?800:600,background:isToday?"#1D4ED8":"transparent",color:isToday?"#fff":"#374151"}}>{day}</div>
                  </div>
                  {dayEvents.slice(0,3).map(evt=>(
                    <div key={evt.id} onClick={(e)=>openEditEvent(evt,e)}
                      style={{fontSize:9.5,padding:"2px 6px",borderRadius:4,background:evt.couleur,color:"#fff",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {!evt.toute_journee&&evt.heure_debut&&<span>{evt.heure_debut.slice(0,5)} </span>}{evt.titre}
                    </div>
                  ))}
                  {dayEvents.length>3&&<div style={{fontSize:9,color:"#9CA3AF"}}>+{dayEvents.length-3} de plus</div>}
                </div>
              );
            })}
          </div>
        </div>
        ) : (()=>{
          const HOUR_START = 7, HOUR_END = 20, HOUR_HEIGHT = 46;
          const hours = []; for (let h=HOUR_START; h<=HOUR_END; h++) hours.push(h);
          const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
          const timeToY = (t) => { if(!t) return 0; const [h,m]=t.split(":").map(Number); return Math.max(0,((h-HOUR_START)+m/60)*HOUR_HEIGHT); };
          const now = new Date();
          const nowY = timeToY(`${now.getHours()}:${now.getMinutes()}`);

          return(
          <div style={{...S.card,padding:0,overflow:"hidden"}}>
            {/* En-tête jours */}
            <div style={{display:"grid",gridTemplateColumns:"48px repeat(7,1fr)",borderBottom:"1px solid #E5E7EB"}}>
              <div/>
              {weekDays.map((d,idx)=>{
                const dateStr = localDateStr(d);
                const isToday = dateStr===todayStr;
                return(
                  <div key={idx} style={{textAlign:"center",padding:"8px 4px",borderLeft:"1px solid #F1F5F9"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase"}}>{jourNoms[idx].slice(0,3)}</div>
                    <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"2px auto 0",fontSize:13,fontWeight:isToday?800:600,background:isToday?"#1D4ED8":"transparent",color:isToday?"#fff":"#374151"}}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {/* Événements toute la journée */}
            <div style={{display:"grid",gridTemplateColumns:"48px repeat(7,1fr)",borderBottom:"2px solid #E5E7EB",minHeight:26}}>
              <div style={{fontSize:8,color:"#D1D5DB",textAlign:"right",paddingRight:5,paddingTop:5}}>Jour</div>
              {weekDays.map((d,idx)=>{
                const dateStr = localDateStr(d);
                const allDayEvts = getEventsForDate(dateStr).filter(e=>e.toute_journee);
                return(
                  <div key={idx} onClick={()=>openDayEventDate(dateStr)} style={{borderLeft:"1px solid #F1F5F9",padding:2,cursor:"pointer"}}>
                    {allDayEvts.map(evt=>(
                      <div key={evt.id} onClick={(e)=>openEditEvent(evt,e)}
                        style={{fontSize:9.5,padding:"2px 5px",borderRadius:4,background:evt.couleur,color:"#fff",fontWeight:600,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{evt.titre}</div>
                    ))}
                  </div>
                );
              })}
            </div>
            {/* Grille horaire */}
            <div style={{display:"grid",gridTemplateColumns:"48px repeat(7,1fr)",maxHeight:"calc(100vh - 340px)",overflowY:"auto"}}>
              <div>
                {hours.map(h=>(
                  <div key={h} style={{height:HOUR_HEIGHT,textAlign:"right",paddingRight:5,fontSize:10,color:"#9CA3AF",position:"relative",top:-6}}>{h}:00</div>
                ))}
              </div>
              {weekDays.map((d,idx)=>{
                const dateStr = localDateStr(d);
                const timedEvts = getEventsForDate(dateStr).filter(e=>!e.toute_journee&&e.heure_debut);
                const isToday = dateStr===todayStr;
                return(
                  <div key={idx} style={{borderLeft:"1px solid #F1F5F9",position:"relative",background:isToday?"#FAFBFF":"transparent"}}>
                    {hours.map(h=>(
                      <div key={h} onClick={()=>{
                        setEditEvent(null);
                        setEventForm({titre:"",description:"",date_debut:dateStr,date_fin:"",toute_journee:false,heure_debut:`${String(h).padStart(2,'0')}:00`,heure_fin:`${String(h+1).padStart(2,'0')}:00`,couleur:"#1D4ED8"});
                        setShowEventForm(true);
                      }} style={{height:HOUR_HEIGHT,borderBottom:"1px solid #F1F5F9",cursor:"pointer"}}/>
                    ))}
                    {isToday&&nowY>=0&&nowY<=gridHeight&&(
                      <div style={{position:"absolute",left:0,right:0,top:nowY,borderTop:"2px solid #EF4444",zIndex:5}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:"#EF4444",position:"absolute",left:-3,top:-4}}/>
                      </div>
                    )}
                    {timedEvts.map(evt=>{
                      const top = timeToY(evt.heure_debut);
                      const bottom = evt.heure_fin ? timeToY(evt.heure_fin) : top+HOUR_HEIGHT/2;
                      const height = Math.max(20, bottom-top);
                      return(
                        <div key={evt.id} onClick={(e)=>openEditEvent(evt,e)}
                          style={{position:"absolute",top,height,left:2,right:2,borderRadius:6,background:evt.couleur,color:"#fff",padding:"3px 6px",overflow:"hidden",fontSize:10,fontWeight:600,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.15)",zIndex:2}}>
                          <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{evt.titre}</div>
                          {height>32&&<div style={{fontSize:9,opacity:0.85}}>{evt.heure_debut.slice(0,5)}{evt.heure_fin?`–${evt.heure_fin.slice(0,5)}`:""}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}
      </div>

      <div style={{...S.card,padding:14}}>
        <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.3px"}}>📅 Prochains événements</div>
        {upcoming.length===0?(
          <div style={{textAlign:"center",color:"#9CA3AF",fontSize:11,padding:"14px 0"}}>Aucun événement à venir</div>
        ):(
          <div style={{display:"grid",gap:5}}>
            {upcoming.map(evt=>(
              <div key={evt.id} onClick={()=>openEditEvent(evt,null)}
                style={{padding:"5px 8px",borderRadius:6,borderLeft:"3px solid "+evt.couleur,background:"#F9FAFB",cursor:"pointer"}}>
                <div style={{fontWeight:600,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{evt.titre}</div>
                <div style={{fontSize:10,color:"#6B7280"}}>
                  {new Date(evt.date_debut+"T00:00:00").toLocaleDateString('fr-LU',{weekday:'short',day:'numeric',month:'short'})}
                  {!evt.toute_journee&&evt.heure_debut?` · ${evt.heure_debut.slice(0,5)}${evt.heure_fin?`-${evt.heure_fin.slice(0,5)}`:""}`:evt.toute_journee?" · Toute la journée":""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
        <div style={{...S.card,background:"#FEFCE8",border:"1px solid #FDE68A",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:13,color:"#92400E"}}>📌 Pense-bête</div>
            <span style={{fontSize:10,color:"#B45309"}}>{stickyNoteSaved?"":"● non enregistré"}</span>
          </div>
          <textarea
            value={stickyNote}
            onChange={e=>{setStickyNote(e.target.value);setStickyNoteSaved(false);}}
            onBlur={()=>saveStickyNote(stickyNote)}
            placeholder="Note partagée entre tous les utilisateurs..."
            rows={9}
            style={{width:"100%",border:"none",background:"transparent",resize:"vertical",fontSize:13,fontFamily:"inherit",outline:"none",color:"#78350F",boxSizing:"border-box"}}
          />
        </div>

        <div style={{...S.card,background:"#EFF6FF",border:"1px solid #BFDBFE",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:13,color:"#1D4ED8"}}>🔒 Ma note</div>
            <span style={{fontSize:10,color:"#1D4ED8"}}>{myNoteSaved?"":"● non enregistré"}</span>
          </div>
          <textarea
            value={myNote}
            onChange={e=>{setMyNote(e.target.value);setMyNoteSaved(false);}}
            onBlur={()=>saveMyNote(myNote)}
            placeholder="Note personnelle, visible par toi uniquement..."
            rows={9}
            style={{width:"100%",border:"none",background:"transparent",resize:"vertical",fontSize:13,fontFamily:"inherit",outline:"none",color:"#1E3A8A",boxSizing:"border-box"}}
          />
        </div>
      </div>
    </div>
  </div>
  );
})()}

{/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
{page==="dashboard" && (()=>{

  // Compute date range from period
  const getPeriodDates = (p) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    if (p==="semaine") {
      const dow = now.getDay()===0?7:now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate()-dow+1);
      return [mon.toISOString().split("T")[0], now.toISOString().split("T")[0]];
    } else if (p==="mois") {
      return [y+"-"+String(m+1).padStart(2,"0")+"-01", now.toISOString().split("T")[0]];
    } else if (p==="mois_dernier") {
      const dm = new Date(now); dm.setDate(0); // last day of prev month
      const dm1 = new Date(dm.getFullYear(), dm.getMonth(), 1);
      return [dm1.toISOString().split("T")[0], dm.toISOString().split("T")[0]];
    } else if (p==="trimestre") {
      const d3 = new Date(now); d3.setMonth(d3.getMonth()-3); d3.setDate(1);
      return [d3.toISOString().split("T")[0], now.toISOString().split("T")[0]];
    } else if (p==="annee") {
      // Show current calendar year
      return [y+"-01-01", (y)+"-12-31"];
    } else if (p==="13mois") {
      const dFrom = new Date(now); dFrom.setMonth(dFrom.getMonth()-13);
      const dTo = new Date(now); dTo.setMonth(dTo.getMonth()+1);
      return [dFrom.toISOString().split("T")[0], dTo.toISOString().split("T")[0]];
    }
    return [dashDateFrom, dashDateTo];
  };

  // Active date range
  const [activeFrom, activeTo] = dashPeriod==="custom" ? [dashDateFrom, dashDateTo] : getPeriodDates(dashPeriod);

  const applyPeriod = (p) => {
    setDashPeriod(p);
    if (p!=="custom") {
      const [f,t] = getPeriodDates(p);
      setDashDateFrom(f);
      setDashDateTo(t);
    }
  };

  // Filter factures
  const dashFacts = factures.filter(f=>{
    if (!f.date) return false;
    if (activeFrom && f.date < activeFrom) return false;
    if (activeTo && f.date > activeTo) return false;
    if (dashClient && f.client_id !== dashClient) return false;
    if (dashZone) { const cl=clients.find(c=>c.id===f.client_id); if(cl?.region!==dashZone) return false; }
    if (dashStatut && f.statut !== dashStatut) return false;
    return true;
  });

  // Filter commandes
  const dashCmds = commandes.filter(c=>{
    const d = c.date_livraison||c.date_commande||"";
    if (activeFrom && d < activeFrom) return false;
    if (activeTo && d > activeTo) return false;
    if (dashClient && c.client_id !== dashClient) return false;
    if (dashZone && c.client_region !== dashZone) return false;
    if (dashChauffeur && c.chauffeur !== dashChauffeur) return false;
    return true;
  });

  const factActives = dashFacts.filter(f=>f.statut!=="Avoir"&&f.statut!=="Annulée");

  // Historique pré-app : n'ajouter que pour les mois sans aucune vraie facture,
  // pour ne jamais compter deux fois le même mois.
  const moisAvecVraiesFactures = new Set(factures.map(f=>f.date?.slice(0,7)).filter(Boolean));
  const historiquePeriode = MONTHLY_DATA_KEYED.filter(m =>
    (!activeFrom || m.key >= activeFrom.slice(0,7)) &&
    (!activeTo || m.key <= activeTo.slice(0,7)) &&
    !moisAvecVraiesFactures.has(m.key) &&
    !dashClient && !dashZone && !dashChauffeur && dashProduits.length===0 // l'historique n'a pas ce niveau de détail
  );
  const caHistorique = historiquePeriode.reduce((s,m)=>s+m.ca,0);
  const payeeHistorique = historiquePeriode.reduce((s,m)=>s+m.paye,0);
  const impayeHistorique = historiquePeriode.reduce((s,m)=>s+m.impaye,0);

  const ca = factActives.reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).total,0) + caHistorique;
  const caPayee = dashFacts.filter(f=>f.statut==="Payée").reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).total,0) + payeeHistorique;
  const impaye = dashFacts.filter(f=>f.statut==="Impayée").reduce((s,f)=>s+resteFact(f),0) + impayeHistorique;
  let marge = 0, margeLignesReelles = 0, margeLignesTotal = 0;
  factActives.forEach(f => {
    const r = calcMargeFacture(f, produits, receptionsStock);
    marge += r.marge; margeLignesReelles += r.ligneReelles; margeLignesTotal += r.ligneTotal;
  });
  const margePct = ca>0?Math.round(marge/ca*100):0;
  const margeCouverture = margeLignesTotal>0?Math.round(margeLignesReelles/margeLignesTotal*100):0;
  const panierMoyen = factActives.length>0?ca/factActives.length:0;
  const nbClients = new Set(factActives.map(f=>f.client_id)).size;
  const nouveauxClients = clients.filter(c=>{
    if (!c.created_at) return false;
    const d = c.created_at.slice(0,10);
    return (!activeFrom || d>=activeFrom) && (!activeTo || d<=activeTo);
  }).length;
  const sefaCmds = dashCmds.filter(c=>c.chauffeur==="A"&&c.statut==="Livré").length;
  const mikailCmds = dashCmds.filter(c=>c.chauffeur==="B"&&c.statut==="Livré").length;

  // Packs offerts (gratuits) — lignes de facture marquées `offert` sur la période filtrée
  const offertsMap = {};
  let totalOfferts = 0;
  factActives.forEach(f=>{
    (f.lignes||[]).forEach(l=>{
      if (!l.offert) return;
      const nom = (l.nom||"").replace(/\s*\(offert\)$/,"");
      offertsMap[nom] = (offertsMap[nom]||0) + l.qte;
      totalOfferts += l.qte;
    });
  });
  const offertsListe = Object.entries(offertsMap).map(([nom,qte])=>({nom,qte})).sort((a,b)=>b.qte-a.qte);

  // Rentabilité jour par jour — COGS basé sur le prix d'achat fixe du produit (pas le coût moyen pondéré)
  const rentabiliteParJourMap = {};
  factActives.forEach(f=>{
    const jour = f.date;
    if (!jour) return;
    if (!rentabiliteParJourMap[jour]) rentabiliteParJourMap[jour] = {jour, nbFactures:0, ca:0, cogs:0};
    const {total} = totalFact(f.lignes, f.tva_pct);
    rentabiliteParJourMap[jour].ca += total;
    rentabiliteParJourMap[jour].nbFactures += 1;
    (f.lignes||[]).forEach(l=>{
      if (l.isCredit || l.produitId==="CREDIT_CONSIGNES" || l.produitId==="CONSIGNE_MANUELLE") return;
      const produitLigne = produits.find(p=>p.id===l.produitId);
      rentabiliteParJourMap[jour].cogs += l.qte * (produitLigne?.prix_achat || 0);
    });
  });
  const rentabiliteJours = Object.values(rentabiliteParJourMap).map(r=>({
    ...r,
    marge: r.ca - r.cogs,
    margePct: r.ca>0 ? (r.ca-r.cogs)/r.ca*100 : 0,
  })).sort((a,b)=>a.jour.localeCompare(b.jour));
  const rentabiliteTotal = rentabiliteJours.reduce((acc,r)=>({
    nbFactures: acc.nbFactures+r.nbFactures, ca: acc.ca+r.ca, cogs: acc.cogs+r.cogs,
  }), {nbFactures:0, ca:0, cogs:0});
  rentabiliteTotal.marge = rentabiliteTotal.ca - rentabiliteTotal.cogs;
  rentabiliteTotal.margePct = rentabiliteTotal.ca>0 ? rentabiliteTotal.marge/rentabiliteTotal.ca*100 : 0;

  // Product stats
  const prodStats = {};
  factActives.forEach(f=>{
    (f.lignes||[]).filter(l=>!l.isCredit&&(dashProduits.length===0||dashProduits.includes(l.nom))).forEach(l=>{
      if(!prodStats[l.nom]) prodStats[l.nom]={nom:l.nom,qte:0,ca:0,marge:0};
      prodStats[l.nom].qte+=l.qte; prodStats[l.nom].ca+=l.qte*l.pu;
      prodStats[l.nom].marge+=calcMargeLigne(l,produits,receptionsStock).marge;
    });
  });
  const topProduits = Object.values(prodStats).sort((a,b)=>b.qte-a.qte).slice(0,8);
  const topProduitsMarge = Object.values(prodStats).sort((a,b)=>b.marge-a.marge).slice(0,8);

  // Zone stats
  const zoneStats = {};
  factActives.forEach(f=>{
    const cl=clients.find(c=>c.id===f.client_id);
    const z=cl?.region||"Inconnu";
    if(!zoneStats[z]) zoneStats[z]={zone:z,ca:0,marge:0,nb:0};
    const t=totalFact(f.lignes, f.tva_pct).total;
    zoneStats[z].ca+=t; zoneStats[z].marge+=calcMargeFacture(f,produits,receptionsStock).marge; zoneStats[z].nb++;
  });
  const topZones = Object.values(zoneStats).sort((a,b)=>b.ca-a.ca).slice(0,6);

  // Client stats
  const clientStats = {};
  factActives.forEach(f=>{
    const cl=clients.find(c=>c.id===f.client_id);
    const cid=f.client_id;
    if(!clientStats[cid]) clientStats[cid]={id:cid,nom:f.client_nom,type:cl?.type||"",region:cl?.region||"",ca:0,marge:0,nb:0};
    const t=totalFact(f.lignes, f.tva_pct).total;
    clientStats[cid].ca+=t; clientStats[cid].marge+=calcMargeFacture(f,produits,receptionsStock).marge; clientStats[cid].nb++;
  });
  const topClients = Object.values(clientStats).sort((a,b)=>b.ca-a.ca).slice(0,8);

  // Type client marge
  const typeStats = {};
  factActives.forEach(f=>{
    const cl=clients.find(c=>c.id===f.client_id);
    const t=cl?.type||"Autre";
    if(!typeStats[t]) typeStats[t]={type:t,ca:0,marge:0,nb:0};
    const total=totalFact(f.lignes, f.tva_pct).total;
    typeStats[t].ca+=total; typeStats[t].marge+=calcMargeFacture(f,produits,receptionsStock).marge; typeStats[t].nb++;
  });
  const topTypes = Object.values(typeStats).sort((a,b)=>b.ca-a.ca);

  // Monthly chart
  const monthlyMap = {};
  factActives.forEach(f=>{
    const m=f.date?.slice(0,7)||"";
    if(!monthlyMap[m]) monthlyMap[m]={label:m,paye:0,impaye:0,historique:false};
    if(f.statut==="Payée") monthlyMap[m].paye+=totalFact(f.lignes, f.tva_pct).total;
    else monthlyMap[m].impaye+=totalFact(f.lignes, f.tva_pct).total;
  });
  historiquePeriode.forEach(m=>{
    monthlyMap[m.key] = {label:m.key, paye:m.paye, impaye:m.impaye, historique:true};
  });
  const chartData = Object.values(monthlyMap).sort((a,b)=>a.label.localeCompare(b.label));

  // Impayés by month (all time)
  const impayeMap = {};
  dashFacts.filter(f=>f.statut==="Impayée").forEach(f=>{
    const m=f.date.slice(0,7);
    if(!impayeMap[m]) impayeMap[m]={label:m,v:0};
    impayeMap[m].v+=totalFact(f.lignes, f.tva_pct).total;
  });
  const impayeChart = Object.values(impayeMap).sort((a,b)=>a.label.localeCompare(b.label)).slice(-8);

  // Export CSV
  const exportDash = () => {
    const rows = [["N°","Date","Client","Type","Zone","Statut","Montant HT","Consignes","Total TTC","Marge"]];
    factActives.forEach(f=>{
      const cl=clients.find(c=>c.id===f.client_id);
      const {prod,cons,total}=totalFact(f.lignes, f.tva_pct);
      const margeF=calcMargeFacture(f,produits,receptionsStock).marge;
      rows.push([f.numero,f.date,f.client_nom,cl?.type||"",cl?.region||"",f.statut,
        prod.toFixed(2),cons.toFixed(2),total.toFixed(2),margeF.toFixed(2)]);
    });
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="factures_bossok_"+new Date().toISOString().split("T")[0]+".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const exportStock = () => {
    const rows = [["Produit","Catégorie","Type emballage","Stock (caisses)","Coût moyen pondéré","Prix Snack","Statut"]];
    produits.forEach(p=>{
      const q = stock[p.id]||0;
      const cm = getCoutMoyenPondere(p.id, receptionsStock);
      rows.push([p.nom, p.categorie, p.type_emballage, q, cm!=null?cm.toFixed(2):"", (p.prix?.Snack||0).toFixed(2), p.statut||"Actif"]);
    });
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="stock_bossok_"+new Date().toISOString().split("T")[0]+".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const exportCommandes = () => {
    const rows = [["Date","Client","Zone","Chauffeur","Statut","Produits","Notes"]];
    dashCmds.forEach(c=>{
      const produitsStr = (c.produits||[]).map(p=>`${p.nom} x${p.qte}`).join(", ");
      rows.push([c.date_livraison||c.date_commande||"", c.client_nom, c.client_region||"", c.chauffeur==="A"?"Sefa":"Mikail", c.statut, produitsStr, c.notes||""]);
    });
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="commandes_bossok_"+new Date().toISOString().split("T")[0]+".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const fmt2 = v => v>=1000?(v/1000).toFixed(1)+"k€":Math.round(v)+"€";

  return(
  <div>
    <ExportDonneesBoutons isMobile={isMobile}/>
    {(()=>{
      const todayStr = localDateStr();
      const facturesEnRetard = factures.filter(f => f.statut==="Impayée" && f.echeance && f.echeance < todayStr);
      if (facturesEnRetard.length===0) return null;
      const totalRetard = facturesEnRetard.reduce((s,f)=>s+resteFact(f),0);
      return (
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:facturesEnRetard.length>0?10:0}}>
            <div style={{fontSize:13,color:"#991B1B",display:"flex",alignItems:"center",gap:7}}>
              <Icon name="warning" size={14}/> <strong>{facturesEnRetard.length} facture(s) en retard</strong> — {fmtFull(totalRetard)} à relancer
            </div>
          </div>
          <div style={{display:"grid",gap:6}}>
            {facturesEnRetard.slice(0,6).map(f=>{
              const cl = clients.find(c=>c.id===f.client_id);
              const total = resteFact(f);
              return (
                <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderRadius:8,padding:"7px 10px",fontSize:12,flexWrap:"wrap",gap:6}}>
                  <span><strong>{f.client_nom}</strong> — {f.numero} · {fmtFull(total)} · échéance {f.echeance}</span>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>relancerWhatsApp(f,cl,total)} title="Relancer par WhatsApp" style={{...S.btn("#F0FDF4","#22C55E"),padding:"5px 9px",display:"flex"}}><Icon name="chat" size={13}/></button>
                    <button onClick={()=>relancerSMS(f,cl,total)} title="Relancer par SMS" style={{...S.btn("#F1F5F9","#374151"),padding:"5px 9px",display:"flex"}}><Icon name="phone" size={13}/></button>
                    <button onClick={()=>relancerEmail(f,cl,total)} title="Relancer par Email" style={{...S.btn("#F1F5F9","#374151"),padding:"5px 9px",display:"flex"}}><Icon name="mail" size={13}/></button>
                  </div>
                </div>
              );
            })}
            {facturesEnRetard.length>6 && (
              <div style={{fontSize:11,color:"#991B1B",textAlign:"center",marginTop:2}}>+ {facturesEnRetard.length-6} autre(s) — voir la page Factures</div>
            )}
          </div>
        </div>
      );
    })()}
    {(()=>{
      const now = new Date();
      const dernierJourMois = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
      const finDeMoisProche = now.getDate() >= dernierJourMois - 2; // 3 derniers jours du mois
      if (!finDeMoisProche) return null;
      const clientsConcernes = clients.filter(c => c.mode_facturation==="groupee" && commandesNonFacturees(c.id).length>0);
      if (clientsConcernes.length===0) return null;
      return (
        <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:13,color:"#5B21B6",display:"flex",alignItems:"center",gap:7}}>
            <Icon name="consignes" size={14}/> <strong>Fin de mois proche</strong> — {clientsConcernes.length} client(s) en facturation groupée ont des livraisons en attente : {clientsConcernes.map(c=>c.nom).join(", ")}
          </div>
          <button onClick={()=>openClientTab(clientsConcernes[0],"factures")} style={{...S.btn("#7C3AED"),padding:"6px 12px",fontSize:12}}>Traiter maintenant</button>
        </div>
      );
    })()}
    {/* ── Filtres ── */}
    <div style={{...S.card,marginBottom:14,padding:"12px 16px"}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
        {[["semaine","Semaine"],["mois","Mois"],["trimestre","Trimestre"],["annee","Année"],["13mois","13 mois"]].map(([k,l])=>(
          <button key={k} onClick={()=>applyPeriod(k)}
            style={{...S.btn(dashPeriod===k?"#1D4ED8":"#F1F5F9",dashPeriod===k?"#fff":"#374151"),padding:"5px 12px",fontSize:12,fontWeight:dashPeriod===k?700:400}}>
            {l}
          </button>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
          <input type="date" value={dashDateFrom} onChange={e=>{setDashDateFrom(e.target.value);setDashPeriod("custom");}}
            style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}/>
          <span style={{color:"#9CA3AF",fontSize:12}}>→</span>
          <input type="date" value={dashDateTo} onChange={e=>{setDashDateTo(e.target.value);setDashPeriod("custom");}}
            style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
        <select value={dashClient} onChange={e=>setDashClient(e.target.value)}
          style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,maxWidth:180}}>
          <option value="">Tous les clients ({clients.length})</option>
          {[...clients].filter(c=>c.statut==="Actif").sort((a,b)=>a.nom.localeCompare(b.nom)).map(c=>(
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select value={dashZone} onChange={e=>setDashZone(e.target.value)}
          style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}>
          <option value="">Toutes les zones</option>
          {["Centre-ville","Nord","Nord-ouest","Nord-Est","Est","Sud","Sud-ouest","Sud-Est","Ouest","Belgique","France"].map(z=>(
            <option key={z} value={z}>{z}</option>
            ))}
        </select>
        <select value={dashChauffeur} onChange={e=>setDashChauffeur(e.target.value)}
          style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}>
          <option value="">Sefa + Mikail</option>
          <option value="A">Sefa</option>
          <option value="B">Mikail</option>
        </select>
        <div style={{position:"relative"}}>
          <button onClick={()=>setDashProdOpen(o=>!o)}
            style={{padding:"5px 8px",border:"1px solid "+(dashProduits.length?"#1D4ED8":"#E5E7EB"),borderRadius:8,fontSize:12,maxWidth:220,background:dashProduits.length?"#EFF6FF":"#fff",color:dashProduits.length?"#1D4ED8":"#111827",cursor:"pointer",fontWeight:dashProduits.length?600:400}}>
            {dashProduits.length===0 ? "Tous les produits" : dashProduits.length===1 ? dashProduits[0] : dashProduits.length+" produits"} ▾
          </button>
          {dashProdOpen&&(
            <>
              <div onClick={()=>setDashProdOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
              <div style={{position:"absolute",top:"100%",left:0,marginTop:4,zIndex:41,background:"#fff",border:"1px solid #E5E7EB",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.15)",width:280,maxHeight:340,display:"flex",flexDirection:"column"}}>
                <div style={{padding:8,borderBottom:"1px solid #F1F5F9"}}>
                  <input value={dashProdSearch} onChange={e=>setDashProdSearch(e.target.value)} placeholder="🔍 Rechercher un produit..." style={{width:"100%",boxSizing:"border-box",padding:"6px 8px",border:"1px solid #E5E7EB",borderRadius:6,fontSize:12}}/>
                </div>
                <div style={{overflowY:"auto",padding:4}}>
                  {[...produits].filter(p=>!dashProdSearch||p.nom.toLowerCase().includes(dashProdSearch.toLowerCase())).map(p=>{
                    const coche = dashProduits.includes(p.nom);
                    return(
                      <label key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",fontSize:12,cursor:"pointer",borderRadius:6,background:coche?"#EFF6FF":"transparent"}}>
                        <input type="checkbox" checked={coche} onChange={()=>setDashProduits(prev=>coche?prev.filter(n=>n!==p.nom):[...prev,p.nom])}/>
                        <span>{p.nom}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:6,padding:8,borderTop:"1px solid #F1F5F9"}}>
                  <button onClick={()=>setDashProduits([])} style={{...S.btn("#F3F4F6","#374151"),flex:1,padding:"5px 8px",fontSize:12}}>Tout effacer</button>
                  <button onClick={()=>setDashProdOpen(false)} style={{...S.btn(),flex:1,padding:"5px 8px",fontSize:12}}>OK</button>
                </div>
              </div>
            </>
          )}
        </div>
        <select value={dashStatut} onChange={e=>setDashStatut(e.target.value)}
          style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}>
          <option value="">Tous statuts</option>
          <option value="Payée">Payées</option>
          <option value="Impayée">Impayées</option>
          <option value="Avoir">Avoirs</option>
        </select>
        {(dashClient||dashZone||dashChauffeur||dashProduits.length>0||dashStatut)&&(
          <button onClick={()=>{setDashClient("");setDashZone("");setDashChauffeur("");setDashProduits([]);setDashStatut("");}}
            style={{...S.btn("#FEE2E2","#DC2626"),padding:"5px 10px",fontSize:12}}>✕ Reset filtres</button>
        )}
        <span style={{fontSize:11,color:"#6B7280",marginLeft:"auto",fontWeight:600}}>
          {factActives.length} factures · {activeFrom} → {activeTo}
        </span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",borderTop:"1px solid #F1F5F9",paddingTop:10}}>
        <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600,marginRight:4}}>Exporter :</span>
        <button onClick={exportDash} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="factures" size={12}/> Factures</button>
        <button onClick={exportCommandes} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="commandes" size={12}/> Commandes</button>
        <button onClick={exportStock} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="stock" size={12}/> Stock</button>
      </div>
    </div>

    {/* ── KPIs Row 1 : indicateurs financiers (priorité visuelle) ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:12}}>
      {[
        {l:"CA Total",v:fmtFull(ca),c:"#0F172A",icon:"money",sub:factActives.length+" factures"},
        {l:margeCouverture===100?"Marge réelle":"Marge (estimée)",v:fmtFull(marge),c:"#0F172A",icon:"trendingUp",sub:margePct+"% du CA"},
        {l:"Encaissé",v:fmtFull(caPayee),c:"#0F172A",icon:"check",sub:dashFacts.filter(f=>f.statut==="Payée").length+" payées"},
        {l:"Impayés",v:fmtFull(impaye),c:"#DC2626",icon:"warning",sub:dashFacts.filter(f=>f.statut==="Impayée").length+" factures",alert:true},
      ].map((s,i)=>(
        <div key={i} style={{...S.card,padding:"18px 20px",borderLeft:s.alert?"3px solid #DC2626":"1px solid #E3E7ED"}}>
          <div style={{width:36,height:36,borderRadius:9,background:s.alert?"#FEF2F2":"#F1F5F9",color:s.alert?"#DC2626":"#5D6B82",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}><Icon name={s.icon} size={17}/></div>
          <div style={{fontSize:26,fontWeight:800,color:s.c,letterSpacing:"-0.5px",lineHeight:1.1}}>{s.v}</div>
          <div style={{fontSize:12,color:"#6B7280",fontWeight:600,marginTop:4}}>{s.l}</div>
          <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,marginTop:2}}>{s.sub}</div>
        </div>
      ))}
    </div>

    {/* ── KPIs Row 2 : indicateurs opérationnels (secondaires) ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[
        {l:"Clients actifs",v:nbClients,icon:"users",sub:"sur la période"},
        {l:"Nouveaux clients",v:nouveauxClients,icon:"sparkle",sub:"sur la période"},
        {l:"Panier moyen",v:fmtFull(panierMoyen),icon:"cart",sub:"par facture"},
        {l:"Livraisons",v:(sefaCmds+mikailCmds),icon:"planning",sub:`Sefa ${sefaCmds} · Mikail ${mikailCmds}`},
      ].map((s,i)=>(
        <div key={i} style={{...S.card,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:"#F1F5F9",color:"#5D6B82",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={s.icon} size={14}/></div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:16,fontWeight:800,color:"#374151",lineHeight:1.1}}>{s.v}</div>
            <div style={{fontSize:10,color:"#9CA3AF",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.l}</div>
          </div>
        </div>
      ))}
    </div>

    {margeCouverture<100&&(
      <div style={{...S.card,marginBottom:14,background:"#FFFBEB",border:"1px solid #FDE68A",display:"flex",alignItems:"center",gap:10}}>
        <Icon name="bulb" size={16} style={{color:"#92400E",flexShrink:0}}/>
        <div style={{fontSize:12,color:"#92400E"}}>
          <strong>{margeCouverture}%</strong> de la marge est calculée avec les vrais prix d'achat. Le reste utilise une estimation à 28%.
          Renseigne le <strong>prix d'achat</strong> de tes produits dans l'onglet <strong>Produits</strong> pour affiner ce chiffre.
        </div>
      </div>
    )}

    {totalOfferts>0&&(
      <div style={{...S.card,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:offertsListe.length?10:0}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#FFFBEB",color:"#B45309",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:17}}>🎁</div>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"#0F172A",letterSpacing:"-0.3px",lineHeight:1.1}}>{totalOfferts} <span style={{fontSize:13,fontWeight:600,color:"#6B7280"}}>caisses offertes</span></div>
            <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,marginTop:2}}>sur la période{dashClient?" · client sélectionné":""}</div>
          </div>
        </div>
        {offertsListe.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {offertsListe.map((o,i)=>(
              <span key={i} style={{fontSize:12,background:"#FFFBEB",color:"#92400E",border:"1px solid #FDE68A",padding:"4px 10px",borderRadius:6,fontWeight:600}}>
                {o.nom} · ×{o.qte}
              </span>
            ))}
          </div>
        )}
      </div>
    )}

    {(()=>{
      const nbRuptures = produits.filter(p=>p.statut!=="Passif"&&!(stock[p.id]>0)).length;
      const nbStockBas = produits.filter(p=>p.statut!=="Passif"&&stock[p.id]>0&&stock[p.id]<=STOCK_BAS_SEUIL).length;
      if (nbRuptures===0 && nbStockBas===0) return null;
      return(
        <div style={{...S.card,marginBottom:14,background:"#FEF2F2",border:"1px solid #FECACA",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
          onClick={()=>setPage("stock")}>
          <Icon name="stock" size={16} style={{color:"#991B1B",flexShrink:0}}/>
          <div style={{fontSize:12,color:"#991B1B",flex:1}}>
            {nbRuptures>0&&<span><strong>{nbRuptures} produit{nbRuptures>1?"s":""}</strong> en rupture de stock. </span>}
            {nbStockBas>0&&<span><strong>{nbStockBas} produit{nbStockBas>1?"s":""}</strong> en stock bas (≤{STOCK_BAS_SEUIL} caisses). </span>}
            Clique pour voir le détail dans l'onglet Stock →
          </div>
        </div>
      );
    })()}

    {/* ── Charts row 1 ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:12,marginBottom:12}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:2,display:"flex",alignItems:"center",gap:7}}><Icon name="dashboard" size={14} style={{color:"#5D6B82"}}/> CA mensuel (payé vs impayé)</div>
        {historiquePeriode.length>0&&(
          <div style={{fontSize:10,color:"#9CA3AF",marginBottom:8}}>Inclut {historiquePeriode.length} mois de données historiques (avant l'app)</div>
        )}
        {chartData.length>0?(
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{top:8,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="label" tick={{fontSize:10}} tickFormatter={(v)=>{
                const [y,m]=String(v).split("-");
                const noms=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
                return m ? noms[parseInt(m)-1]+" "+y.slice(2) : v;
              }}/>
              <YAxis tick={{fontSize:10}} tickFormatter={fmt2} width={50}/>
              <Tooltip formatter={(v,n)=>[fmtFull(v),n==="paye"?"Encaissé":"Impayé"]}/>
              <Bar dataKey="paye" stackId="a" fill="#1D4ED8" name="paye" radius={[0,0,0,0]}/>
              <Bar dataKey="impaye" stackId="a" fill="#EF4444" name="impaye" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ):<div style={{textAlign:"center",color:"#9CA3AF",padding:"70px 0",fontSize:12}}>Aucune donnée sur la période</div>}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Icon name="warning" size={13} style={{color:"#DC2626"}}/> Impayés cumulés</div>
        {impayeChart.length>0?(
          <ResponsiveContainer width="100%" height={228}>
            <BarChart data={impayeChart} margin={{top:0,right:5,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
              <XAxis dataKey="label" tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:9}} tickFormatter={fmt2} width={45}/>
              <Tooltip formatter={(v)=>[fmtFull(v),"Impayé"]}/>
              <Bar dataKey="v" fill="#EF4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ):<div style={{textAlign:"center",color:"#9CA3AF",padding:"70px 0",fontSize:12}}>Aucun impayé</div>}
      </div>
    </div>

    {/* ── Charts row 2: Top produits + CA par zone ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="produits" size={14} style={{color:"#5D6B82"}}/> Top produits</div>
          <div style={{display:"flex",gap:4}}>
            {[["quantite","Ventes"],["marge","Marge"]].map(([k,l])=>(
              <button key={k} onClick={()=>setDashProduitTri(k)}
                style={{...S.btn(dashProduitTri===k?"#1D4ED8":"#F1F5F9",dashProduitTri===k?"#fff":"#374151"),padding:"3px 10px",fontSize:10}}>{l}</button>
            ))}
          </div>
        </div>
        {(() => {
          const liste = dashProduitTri==="marge" ? topProduitsMarge : topProduits;
          const valKey = dashProduitTri==="marge" ? "marge" : "qte";
          if (liste.length===0) return <div style={{textAlign:"center",color:"#9CA3AF",padding:"20px 0",fontSize:12}}>Aucune donnée</div>;
          const maxV = liste[0][valKey] || 1;
          return liste.map((p,i)=>(
            <div key={p.nom} style={{marginBottom:5}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:1}}>
                <span style={{display:"flex",alignItems:"center",gap:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200,fontWeight:i<3?600:400,color:"#374151"}}>
                  {i<3 && <span style={{width:14,height:14,borderRadius:99,background:"#1D4ED8",color:"#fff",fontSize:9,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>}
                  {p.nom}
                </span>
                <span style={{color:"#6B7280",whiteSpace:"nowrap",marginLeft:4}}>
                  {dashProduitTri==="marge" ? fmtFull(p.marge) : `${p.qte} cs · ${fmtFull(p.ca)}`}
                </span>
              </div>
              <div style={{height:5,background:"#F1F5F9",borderRadius:3}}>
                <div style={{height:5,background:i===0?(dashProduitTri==="marge"?"#059669":"#1D4ED8"):i<3?(dashProduitTri==="marge"?"#6EE7B7":"#60A5FA"):(dashProduitTri==="marge"?"#D1FAE5":"#BAE6FD"),borderRadius:3,width:Math.max(2,(p[valKey]/maxV*100))+"%"}}/>
              </div>
            </div>
          ));
        })()}
      </div>

      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8,display:"flex",alignItems:"center",gap:7}}><Icon name="carte" size={14} style={{color:"#5D6B82"}}/> CA par zone</div>
        {topZones.length===0?<div style={{textAlign:"center",color:"#9CA3AF",padding:"20px 0",fontSize:12}}>Aucune donnée</div>:
        topZones.map((z,i)=>{
          const maxCA=topZones[0].ca;
          const driver=ZONE_SCHEDULE[z.zone]?.driver||"?";
          const col=driver==="Sefa"?"#0EA5E9":driver==="Mikail"?"#8B5CF6":"#6B7280";
          return(
            <div key={z.zone} style={{marginBottom:5}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:1}}>
                <span style={{fontWeight:600}}>{z.zone} <span style={{fontSize:9,color:col}}>({driver})</span></span>
                <span style={{color:"#6B7280"}}>{z.nb} fact. · {fmtFull(z.ca)} · marge {fmtFull(z.marge)}</span>
              </div>
              <div style={{height:5,background:"#F1F5F9",borderRadius:3}}>
                <div style={{height:5,background:col,borderRadius:3,width:(z.ca/maxCA*100)+"%"}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* ── Rentabilité (COGS / Marge, basé sur le prix d'achat) ── */}
    <div style={{...S.card,marginBottom:12}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={14} style={{color:"#5D6B82"}}/> Rentabilité de la période</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:14}}>
        {[
          {l:"Factures",v:rentabiliteTotal.nbFactures,c:"#334155"},
          {l:"Chiffre d'affaires",v:fmtFull(rentabiliteTotal.ca),c:"#334155"},
          {l:"COGS (coût produits)",v:fmtFull(rentabiliteTotal.cogs),c:"#334155"},
          {l:"Marge brute",v:fmtFull(rentabiliteTotal.marge),c:"#059669"},
          {l:"Marge %",v:Math.round(rentabiliteTotal.margePct)+"%",c:"#059669"},
        ].map((k,i)=>(
          <div key={i} style={S.kpi(k.c)}>
            <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:"#6B7280"}}>{k.l}</div>
          </div>
        ))}
      </div>
      <DataTable
        isMobile={isMobile}
        rows={rentabiliteJours}
        exportName="rentabilite_par_jour"
        pageSize={15}
        emptyIcon="€"
        emptyMessage="Aucune facture sur cette période"
        initialSort={{key:"jour",dir:"desc"}}
        footer={isMobile ? (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span>Total</span>
            <span>{fmtFull(rentabiliteTotal.ca)} · marge {fmtFull(rentabiliteTotal.marge)}</span>
          </div>
        ) : (
          <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
            <td style={{padding:"8px 12px"}}>Total</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{rentabiliteTotal.nbFactures}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(rentabiliteTotal.ca)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(rentabiliteTotal.cogs)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{fmtFull(rentabiliteTotal.marge)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{Math.round(rentabiliteTotal.margePct)}%</td>
          </tr>
        )}
        columns={[
          {key:"jour", label:"Date", mobilePrimary:true, sortValue:r=>r.jour},
          {key:"nbFactures", label:"Factures", align:"right", mobileShow:true, sortValue:r=>r.nbFactures},
          {key:"ca", label:"Chiffre d'affaires", align:"right", mobileShow:true, sortValue:r=>r.ca, render:r=>fmtFull(r.ca)},
          {key:"cogs", label:"COGS", align:"right", sortValue:r=>r.cogs, render:r=>fmtFull(r.cogs)},
          {key:"marge", label:"Marge", align:"right", mobileShow:true, sortValue:r=>r.marge, render:r=><span style={{color:"#059669",fontWeight:600}}>{fmtFull(r.marge)}</span>},
          {key:"margePct", label:"Marge %", align:"right", sortValue:r=>r.margePct, render:r=><span style={{color:"#059669",fontWeight:600}}>{Math.round(r.margePct)}%</span>},
        ]}
      />
      <div style={{fontSize:11,color:"#9CA3AF",marginTop:8}}>
        COGS calculé à partir du prix d'achat renseigné sur chaque produit (fiche Produits) × quantité vendue.
      </div>
    </div>

    {/* ── Row 3: Top clients + Marge par type ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="clients" size={14} style={{color:"#5D6B82"}}/> Top clients par CA</div>
        </div>
        {topClients.length===0?<div style={{textAlign:"center",color:"#9CA3AF",padding:"20px 0",fontSize:12}}>Aucune donnée</div>:
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E5E7EB"}}>
              {["Client","Type","Zone","CA","Marge","Nb"].map(h=>(
                <th key={h} style={{padding:"7px 8px",textAlign:h==="CA"||h==="Marge"||h==="Nb"?"right":"left",color:"#6B7280",fontWeight:600,fontSize:10}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topClients.map((c,i)=>(
              <tr key={c.id} style={{borderBottom:"1px solid #F9FAFB",background:i%2===0?"#fff":"#FAFAFA"}}>
                <td style={{padding:"7px 8px",fontWeight:600,color:"#374151"}}>
                  <span style={{display:"flex",alignItems:"center",gap:6}}>
                    {i<3 && <span style={{width:14,height:14,borderRadius:99,background:"#1D4ED8",color:"#fff",fontSize:9,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>}
                    {c.nom}
                  </span>
                </td>
                <td style={{padding:"7px 8px",color:"#6B7280"}}>{c.type}</td>
                <td style={{padding:"7px 8px",color:"#6B7280"}}>{c.region}</td>
                <td style={{padding:"7px 8px",textAlign:"right",fontWeight:600}}>{fmtFull(c.ca)}</td>
                <td style={{padding:"7px 8px",textAlign:"right",color:"#059669"}}>{fmtFull(c.marge)}</td>
                <td style={{padding:"7px 8px",textAlign:"right",color:"#6B7280"}}>{c.nb}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8,display:"flex",alignItems:"center",gap:7}}><Icon name="barChart2" size={14} style={{color:"#5D6B82"}}/> Marge par type de client</div>
        {topTypes.length===0?<div style={{textAlign:"center",color:"#9CA3AF",padding:"20px 0",fontSize:12}}>Aucune donnée</div>:
        <div>
          {topTypes.map((t,i)=>{
            const maxCA=topTypes[0].ca;
            const {bg,text}=tc(t.type);
            const margPct=t.ca>0?Math.round(t.marge/t.ca*100):0;
            return(
              <div key={t.type} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={S.badge(bg,text)}>{t.type}</span>
                    <span style={{fontSize:10,color:"#6B7280"}}>{t.nb} fact.</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>{fmtFull(t.ca)}</span>
                    <span style={{fontSize:10,color:"#059669",marginLeft:6}}>+{fmtFull(t.marge)} ({margPct}%)</span>
                  </div>
                </div>
                <div style={{height:6,background:"#F1F5F9",borderRadius:3}}>
                  <div style={{height:6,background:text,borderRadius:3,width:(t.ca/maxCA*100)+"%",opacity:0.7}}/>
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>

    {/* ── Bottom row ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8,display:"flex",alignItems:"center",gap:7}}><Icon name="factures" size={14} style={{color:"#5D6B82"}}/> Dernières factures</div>
        {dashFacts.length===0?<div style={{color:"#9CA3AF",fontSize:12,textAlign:"center",padding:"20px 0"}}>Aucune facture sur la période</div>:
        [...dashFacts].reverse().slice(0,6).map(f=>{
          const {total}=totalFact(f.lignes, f.tva_pct);
          return(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #F1F5F9",fontSize:12}}>
              <span style={{color:"#9CA3AF",width:55,flexShrink:0}}>{f.date}</span>
              <span style={{fontWeight:500,flex:1,marginLeft:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.client_nom}</span>
              <span style={{fontWeight:700,marginRight:6,whiteSpace:"nowrap"}}>{fmtFull(total)}</span>
              <span style={S.badge(f.statut==="Payée"?"#DCFCE7":f.statut==="Avoir"?"#EDE9FE":"#FEE2E2",f.statut==="Payée"?"#166534":f.statut==="Avoir"?"#6D28D9":"#DC2626")}>{f.statut}</span>
            </div>
          );
        })}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:8,display:"flex",alignItems:"center",gap:7}}><Icon name="commandes" size={14} style={{color:"#5D6B82"}}/> Commandes en attente</div>
        {commandes.filter(c=>c.statut==="En attente").length===0?
          <div style={{color:"#9CA3AF",fontSize:12,textAlign:"center",padding:"20px 0"}}>Aucune commande</div>:
          commandes.filter(c=>c.statut==="En attente").slice(0,6).map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #F1F5F9",fontSize:12}}>
              <span style={{fontWeight:500,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.client_nom}</span>
              <span style={{fontSize:10,color:"#6B7280",marginRight:6}}>{c.client_region}</span>
              <span style={S.badge(c.chauffeur==="A"?"#E0F2FE":"#EDE9FE",c.chauffeur==="A"?"#0EA5E9":"#8B5CF6")}>{c.chauffeur==="A"?"Sefa":"Mikail"}</span>
            </div>
          ))
        }
      </div>
    </div>
  </div>
  );
}
)()}

{/* ══ CONTRÔLE DE GESTION ══════════════════════════════════════ */}
{page==="controle" && (()=>{

  const getPeriodDatesCG = (p) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    if (p==="mois") {
      return [y+"-"+String(m+1).padStart(2,"0")+"-01", now.toISOString().split("T")[0]];
    } else if (p==="mois_dernier") {
      const dm = new Date(now); dm.setDate(0); // dernier jour du mois précédent
      const dm1 = new Date(dm.getFullYear(), dm.getMonth(), 1);
      return [dm1.toISOString().split("T")[0], dm.toISOString().split("T")[0]];
    } else if (p==="trimestre") {
      const d3 = new Date(now); d3.setMonth(d3.getMonth()-3); d3.setDate(1);
      return [d3.toISOString().split("T")[0], now.toISOString().split("T")[0]];
    } else if (p==="annee") {
      return [y+"-01-01", y+"-12-31"];
    } else if (p==="12mois") {
      const dFrom = new Date(now); dFrom.setMonth(dFrom.getMonth()-12);
      return [dFrom.toISOString().split("T")[0], now.toISOString().split("T")[0]];
    }
    return [cgDateFrom, cgDateTo];
  };

  const [cgFrom, cgTo] = cgPeriod==="custom" ? [cgDateFrom, cgDateTo] : getPeriodDatesCG(cgPeriod);

  const applyPeriodCG = (p) => {
    setCgPeriod(p);
    if (p!=="custom") {
      const [f,t] = getPeriodDatesCG(p);
      setCgDateFrom(f);
      setCgDateTo(t);
    }
  };

  // Factures actives sur la période (hors avoirs/annulées — même logique que le Dashboard)
  const cgFacts = factures.filter(f=>{
    if (!f.date) return false;
    if (cgFrom && f.date < cgFrom) return false;
    if (cgTo && f.date > cgTo) return false;
    return f.statut!=="Avoir" && f.statut!=="Annulée";
  });

  // ── Agrégations par dimension : type de client, client, produit, zone ──
  // Marge calculée ligne par ligne via calcMargeLigne (coût moyen pondéré des
  // réceptions de stock en priorité, sinon prix d'achat produit, sinon estimation).
  const parType = {}, parClient = {}, parProduit = {}, parZone = {};
  let caGlobal=0, margeGlobal=0, ligneReellesGlobal=0, ligneTotalGlobal=0;

  cgFacts.forEach(f=>{
    const cl = clients.find(c=>c.id===f.client_id);
    const {total} = totalFact(f.lignes, f.tva_pct);
    const mFact = calcMargeFacture(f, produits, receptionsStock);
    caGlobal += total; margeGlobal += mFact.marge;
    ligneReellesGlobal += mFact.ligneReelles; ligneTotalGlobal += mFact.ligneTotal;

    const typeKey = cl?.type || "Autre";
    if (!parType[typeKey]) parType[typeKey] = {type:typeKey, ca:0, marge:0, nb:0, clientsSet:new Set()};
    parType[typeKey].ca += total; parType[typeKey].marge += mFact.marge; parType[typeKey].nb++;
    if (f.client_id) parType[typeKey].clientsSet.add(f.client_id);

    const cid = f.client_id;
    if (!parClient[cid]) parClient[cid] = {id:cid, nom:f.client_nom, type:cl?.type||"", zone:cl?.region||"", ca:0, marge:0, nb:0, dateMin:f.date, dateMax:f.date};
    parClient[cid].ca += total; parClient[cid].marge += mFact.marge; parClient[cid].nb++;
    if (f.date < parClient[cid].dateMin) parClient[cid].dateMin = f.date;
    if (f.date > parClient[cid].dateMax) parClient[cid].dateMax = f.date;

    const zoneKey = cl?.region || "Inconnu";
    if (!parZone[zoneKey]) parZone[zoneKey] = {zone:zoneKey, ca:0, marge:0, nb:0};
    parZone[zoneKey].ca += total; parZone[zoneKey].marge += mFact.marge; parZone[zoneKey].nb++;

    (f.lignes||[]).filter(l=>!l.isCredit && l.produitId!=="CREDIT_CONSIGNES").forEach(l=>{
      const nomProd = (l.nom||"").replace(/\s*\(offert\)$/,"");
      const produitRef = produits.find(p=>p.id===l.produitId);
      if (!parProduit[nomProd]) parProduit[nomProd] = {nom:nomProd, produitId:l.produitId, categorie:produitRef?.categorie||"—", qte:0, ca:0, marge:0, reel:0, total:0};
      const r = calcMargeLigne(l, produits, receptionsStock);
      parProduit[nomProd].qte += l.qte; parProduit[nomProd].ca += l.qte*l.pu; parProduit[nomProd].marge += r.marge;
      parProduit[nomProd].total++; if (r.reel) parProduit[nomProd].reel++;
    });
  });

  const listeType = Object.values(parType).map(t=>({...t, nbClients:t.clientsSet.size, cogs:t.ca-t.marge, margePct: t.ca>0?t.marge/t.ca*100:0}));
  const listeClient = Object.values(parClient).map(c=>{
    const spanJours = (new Date(c.dateMax)-new Date(c.dateMin))/86400000;
    const freqJours = c.nb>1 ? spanJours/(c.nb-1) : null; // jours moyens entre 2 commandes
    return {...c, cogs:c.ca-c.marge, margePct: c.ca>0?c.marge/c.ca*100:0, freqJours};
  });

  // Prix concurrent le plus récent par produit (plusieurs relevés possibles dans le temps)
  const prixConcMap = {};
  prixConcurrents.forEach(pc=>{
    const cur = prixConcMap[pc.produit_id];
    if (!cur || (pc.date_releve||"") > (cur.date_releve||"")) prixConcMap[pc.produit_id] = pc;
  });
  const listeProduit = Object.values(parProduit).map(p=>{
    const prixVente = p.qte>0 ? p.ca/p.qte : 0;
    const conc = prixConcMap[p.produitId];
    const ecartPct = (conc && prixVente>0) ? (prixVente-conc.prix)/conc.prix*100 : null;
    return {...p, cogs:p.ca-p.marge, margePct: p.ca>0?p.marge/p.ca*100:0, fiabilite: p.total>0?p.reel/p.total*100:100,
      prixVente, prixConcurrent: conc?.prix ?? null, concurrentNom: conc?.concurrent || null, ecartPct};
  });

  // Distance moyenne au dépôt par zone — distance réelle de trajet (routing OSRM) quand
  // elle a été calculée pour le client (clients.distance_route_km), sinon vol d'oiseau en
  // repli (proxy). nbReel/nbTotal permet d'afficher la fiabilité de la moyenne par zone.
  const distanceParZone = {};
  const nbClientsAvecDistanceReelle = clients.filter(c=>c.distance_route_km!=null).length;
  const nbClientsAvecCoords = clients.filter(c=>c.lat!=null && c.lng!=null).length;
  clients.forEach(c=>{
    const z = c.region || "Inconnu";
    const reelle = c.distance_route_km!=null ? Number(c.distance_route_km) : null;
    const d = reelle!=null ? reelle : distanceKm(DEPOT.lat, DEPOT.lng, Number(c.lat), Number(c.lng));
    if (d==null) return;
    if (!distanceParZone[z]) distanceParZone[z] = {sum:0, n:0, nReel:0};
    distanceParZone[z].sum += d; distanceParZone[z].n++;
    if (reelle!=null) distanceParZone[z].nReel++;
  });
  const listeZone = Object.values(parZone).map(z=>{
    const dz = distanceParZone[z.zone];
    return {...z, driver: ZONE_SCHEDULE[z.zone]?.driver || "?", cogs:z.ca-z.marge, margePct: z.ca>0?z.marge/z.ca*100:0,
      distanceMoyenne: dz ? dz.sum/dz.n : null,
      distanceSource: dz && dz.n>0 ? (dz.nReel===dz.n ? "route" : dz.nReel>0 ? "mixte" : "vol") : null};
  });

  // ── Coût de livraison réel (TrackFleet) : km + heures de conduite par chauffeur,
  // relevés manuellement chaque mois, convertis en coût réel (carburant + temps
  // chauffeur chargé) via les paramètres de "Charges du mois", puis alloués par zone
  // au prorata d'une distance estimée (distance moyenne × 2 aller-retour × nb factures)
  // au sein des zones d'un même chauffeur. Cette allocation sert à obtenir une marge
  // NETTE par zone/client — elle ne vient PAS en déduction supplémentaire du "Résultat
  // net" global ci-dessous, qui soustrait déjà masse_salariale et carburant au niveau
  // de toute l'entreprise (double-compter serait faux).
  const moisListCG = [];
  { const d0 = new Date((cgFrom||"2000-01-01").slice(0,7)+"-01"), d1 = new Date((cgTo||cgFrom||"2000-01-01").slice(0,7)+"-01");
    for (let d=new Date(d0); d<=d1; d.setMonth(d.getMonth()+1)) moisListCG.push(d.toISOString().slice(0,7)); }
  const coutLivraisonParChauffeur = {}; // {Sefa:{cout,km,heures,moisRenseignes}, Mikail:{...}}
  moisListCG.forEach(m=>{
    const fg = fraisGeneraux.find(f=>(f.mois||"").slice(0,7)===m);
    const prixDiesel = fg?.prix_diesel_litre!=null ? Number(fg.prix_diesel_litre) : 2.057;
    const consoL100 = fg?.consommation_l_100km!=null ? Number(fg.consommation_l_100km) : 11;
    const coutHoraire = fg?.cout_horaire_chauffeur!=null ? Number(fg.cout_horaire_chauffeur) : 27.64;
    relevesChauffeurs.filter(r=>(r.mois||"").slice(0,7)===m).forEach(r=>{
      const ch = r.chauffeur;
      if (!coutLivraisonParChauffeur[ch]) coutLivraisonParChauffeur[ch] = {cout:0, km:0, heures:0, moisRenseignes:0};
      const km = Number(r.km)||0, heures = Number(r.heures_conduite)||0;
      coutLivraisonParChauffeur[ch].cout += km*(consoL100/100)*prixDiesel + heures*coutHoraire;
      coutLivraisonParChauffeur[ch].km += km;
      coutLivraisonParChauffeur[ch].heures += heures;
      coutLivraisonParChauffeur[ch].moisRenseignes++;
    });
  });
  const estKmParChauffeur = {};
  listeZone.forEach(z=>{
    if (z.driver==="?" || z.distanceMoyenne==null) return;
    estKmParChauffeur[z.driver] = (estKmParChauffeur[z.driver]||0) + z.distanceMoyenne*2*z.nb;
  });
  const coutLivraisonParZone = {};
  listeZone.forEach(z=>{
    const cd = coutLivraisonParChauffeur[z.driver];
    if (!cd || z.driver==="?" || z.distanceMoyenne==null) { coutLivraisonParZone[z.zone]=null; return; }
    const totalEstKm = estKmParChauffeur[z.driver]||0;
    coutLivraisonParZone[z.zone] = totalEstKm>0 ? (z.distanceMoyenne*2*z.nb/totalEstKm)*cd.cout : 0;
  });
  const listeZoneNette = listeZone.map(z=>{
    const coutLivraison = coutLivraisonParZone[z.zone];
    const margeNette = coutLivraison!=null ? z.marge-coutLivraison : null;
    return {...z, coutLivraison, margeNette, margeNettePct: (margeNette!=null && z.ca>0) ? margeNette/z.ca*100 : null};
  });
  const coutLivraisonTotal = Object.values(coutLivraisonParChauffeur).reduce((s,c)=>s+c.cout,0);
  const nbChauffeursRenseignes = Object.keys(coutLivraisonParChauffeur).length;
  // Marge nette globale = null tant qu'au moins une zone n'a pas de coût de livraison
  // calculé (chauffeur sans relevé TrackFleet sur la période) — pour ne jamais afficher
  // un total net qui sous-estime les charges en silence.
  const margeNetteGlobaleCalc = listeZoneNette.length>0 && listeZoneNette.every(z=>z.margeNette!=null)
    ? margeGlobal - coutLivraisonTotal : null;
  // Marge nette par client : coût de livraison de la zone du client réparti au prorata
  // de son CA au sein de cette zone (un client qui pèse 20% du CA d'une zone porte
  // ~20% du coût réel de livraison relevé pour cette zone).
  // Panier moyen & évolution : comparaison avec la période précédente de même durée
  // (ex. "mois" compare au mois d'avant), pour repérer un client qui réduit doucement
  // ses commandes avant de devenir inactif.
  const dureeJoursCG = (cgFrom && cgTo) ? Math.round((new Date(cgTo)-new Date(cgFrom))/86400000)+1 : null;
  let cgFromPrec=null, cgToPrec=null;
  if (dureeJoursCG) {
    const toPrec = new Date(cgFrom); toPrec.setDate(toPrec.getDate()-1);
    const fromPrec = new Date(toPrec); fromPrec.setDate(fromPrec.getDate()-dureeJoursCG+1);
    cgToPrec = toPrec.toISOString().split("T")[0];
    cgFromPrec = fromPrec.toISOString().split("T")[0];
  }
  const factsPrecCG = (cgFromPrec && cgToPrec) ? factures.filter(f=>f.date && f.date>=cgFromPrec && f.date<=cgToPrec && f.statut!=="Avoir" && f.statut!=="Annulée") : [];
  const panierPrecParClient = {};
  factsPrecCG.forEach(f=>{
    if (!f.client_id) return;
    const {total} = totalFact(f.lignes, f.tva_pct);
    if (!panierPrecParClient[f.client_id]) panierPrecParClient[f.client_id] = {ca:0, nb:0};
    panierPrecParClient[f.client_id].ca += total;
    panierPrecParClient[f.client_id].nb++;
  });
  const listeClientNette = listeClient.map(c=>{
    const z = listeZoneNette.find(zz=>zz.zone===(c.zone||"Inconnu"));
    const panierMoyen = c.nb>0 ? c.ca/c.nb : 0;
    const prec = panierPrecParClient[c.id];
    const panierMoyenPrec = (prec && prec.nb>0) ? prec.ca/prec.nb : null;
    const panierEvolutionPct = (panierMoyenPrec!=null && panierMoyenPrec>0) ? (panierMoyen-panierMoyenPrec)/panierMoyenPrec*100 : null;
    if (!z || z.coutLivraison==null || z.ca<=0) return {...c, coutLivraison:null, margeNette:null, margeNettePct:null, panierMoyen, panierMoyenPrec, panierEvolutionPct};
    const coutLivraison = (c.ca/z.ca)*z.coutLivraison;
    const margeNette = c.marge-coutLivraison;
    return {...c, coutLivraison, margeNette, margeNettePct: c.ca>0 ? margeNette/c.ca*100 : null, panierMoyen, panierMoyenPrec, panierEvolutionPct};
  });

  const caProduitsTotal = listeProduit.reduce((s,p)=>s+p.ca,0);
  const margeProduitsTotal = listeProduit.reduce((s,p)=>s+p.marge,0);
  const margePctGlobal = caGlobal>0 ? margeGlobal/caGlobal*100 : 0;
  const fiabiliteGlobal = ligneTotalGlobal>0 ? ligneReellesGlobal/ligneTotalGlobal*100 : 100;
  const cogsGlobal = caGlobal - margeGlobal;

  // Nouveaux clients par mois (basé sur clients.created_at), sur la période sélectionnée —
  // indicateur d'acquisition, séparé de la marge (un nouveau client n'a pas encore forcément facturé).
  const nouveauxClientsParMois = {};
  clients.forEach(c=>{
    if (!c.created_at) return;
    const m = c.created_at.slice(0,7);
    if (cgFrom && m < cgFrom.slice(0,7)) return;
    if (cgTo && m > cgTo.slice(0,7)) return;
    if (!nouveauxClientsParMois[m]) nouveauxClientsParMois[m] = {nb:0, noms:[]};
    nouveauxClientsParMois[m].nb++;
    nouveauxClientsParMois[m].noms.push(c.nom);
  });
  const listeNouveauxClients = Object.entries(nouveauxClientsParMois).sort((a,b)=>a[0].localeCompare(b[0]));
  const totalNouveauxClients = listeNouveauxClients.reduce((s,[,v])=>s+v.nb,0);

  // ── Clients inactifs (30+ jours sans commande) ──────────────────────────
  // Indicateur "live", indépendant du filtre de période ci-dessus : on regarde
  // la vraie dernière facture de chaque client actif, sur TOUTE la base.
  const AUJOURD_HUI_CG = localDateStr();
  const derniereFactureParClient = {};
  factures.forEach(f=>{
    if (!f.client_id || !f.date) return;
    if (f.statut==="Avoir" || f.statut==="Annulée") return;
    if (!derniereFactureParClient[f.client_id] || f.date > derniereFactureParClient[f.client_id]) derniereFactureParClient[f.client_id] = f.date;
  });
  const clientsInactifs30j = clients.filter(c=>c.statut==="Actif").map(c=>{
    const derniereDate = derniereFactureParClient[c.id] || null;
    const joursDepuis = derniereDate ? Math.round((new Date(AUJOURD_HUI_CG)-new Date(derniereDate))/86400000) : null;
    return {id:c.id, nom:c.nom, zone:c.region, derniereDate, joursDepuis};
  }).filter(c=>c.joursDepuis==null || c.joursDepuis>30)
    .sort((a,b)=>(b.joursDepuis??999999)-(a.joursDepuis??999999));

  // ── Vieillissement des créances ─────────────────────────────────────────
  // Référence externe (import ponctuel), pas recalculée en live — on affiche
  // le dernier relevé (date_snapshot la plus récente).
  const dateSnapshotRecente = creancesSnapshot.reduce((max,r)=>(!max||(r.date_snapshot||"")>max)?r.date_snapshot:max, null);
  const creancesRecentes = creancesSnapshot.filter(r=>r.date_snapshot===dateSnapshotRecente);
  const TRANCHES_CREANCES = ["0-30","30-60","60-90","90+"];
  const vieillissementCreances = TRANCHES_CREANCES.map(tr=>{
    const lignes = creancesRecentes.filter(r=>r.tranche_anciennete===tr);
    return {tranche:tr, nb:lignes.length, montant:lignes.reduce((s,r)=>s+(Number(r.montant)||0),0)};
  });
  const totalCreances = vieillissementCreances.reduce((s,t)=>s+t.montant,0);

  // ── Factures impayées à traiter (action quotidienne) ────────────────────
  const facturesImpayeesCG = factures.filter(f=>f.statut==="Impayée").sort((a,b)=>(a.date||"").localeCompare(b.date||""));

  // ── Marge par facture ────────────────────────────────────────────────────
  const margeParFacture = cgFacts.map(f=>{
    const cl = clients.find(c=>c.id===f.client_id);
    const {total} = totalFact(f.lignes, f.tva_pct);
    const mFact = calcMargeFacture(f, produits, receptionsStock);
    return {id:f.id, numero:f.numero, date:f.date, client:f.client_nom||cl?.nom||"", ca:total, marge:mFact.marge, margePct: total>0?mFact.marge/total*100:0};
  }).sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  // ── Éligibilité "pack offert" ────────────────────────────────────────────
  // Dès que la marge brute cumulée d'un client sur la période sélectionnée
  // atteint le seuil (réglable, 150€ par défaut), on considère qu'on peut lui
  // offrir une caisse. Logique simple : marge cumulée sur la période affichée,
  // pas de suivi de "déjà offert / reset" pour l'instant — à affiner avec Fatih
  // si besoin d'un suivi plus fin dans le temps.
  const clientsEligiblesPack = listeClientNette.filter(c=>c.marge>=seuilPackOffert).sort((a,b)=>b.marge-a.marge);

  // ── Taux de rétention mensuel ────────────────────────────────────────────
  // % de clients actifs un mois donné qui recommandent le mois calendaire suivant.
  // Calculé sur tout l'historique (indépendant du filtre période) pour avoir une
  // vraie série dans le temps ; affiché sur les 12 derniers mois disponibles.
  const moisActifsClients = {};
  factures.forEach(f=>{
    if (!f.client_id || !f.date) return;
    if (f.statut==="Avoir" || f.statut==="Annulée") return;
    const m = f.date.slice(0,7);
    if (!moisActifsClients[m]) moisActifsClients[m] = new Set();
    moisActifsClients[m].add(f.client_id);
  });
  const moisTriesRetention = Object.keys(moisActifsClients).sort();
  const retentionMensuelle = [];
  for (let i=0;i<moisTriesRetention.length-1;i++) {
    const m0 = moisTriesRetention[i], m1 = moisTriesRetention[i+1];
    const d0 = new Date(m0+"-01"); d0.setMonth(d0.getMonth()+1);
    if (d0.toISOString().slice(0,7)!==m1) continue; // ignore les mois non consécutifs (trou de données)
    const clientsM0 = moisActifsClients[m0], clientsM1 = moisActifsClients[m1];
    const nbRecommande = [...clientsM0].filter(id=>clientsM1.has(id)).length;
    retentionMensuelle.push({mois:m0, moisSuivant:m1, nbActifs:clientsM0.size, nbRecommande, taux: clientsM0.size>0?nbRecommande/clientsM0.size*100:0});
  }
  const retentionAffichee = retentionMensuelle.slice(-12);

  // ── Concentration du CA (règle 80/20) ────────────────────────────────────
  const clientsParCaDesc = [...listeClientNette].sort((a,b)=>b.ca-a.ca);
  let cumulCaConcentration = 0;
  const clientsAvec80PctCa = [];
  for (const c of clientsParCaDesc) {
    if (caGlobal>0 && cumulCaConcentration/caGlobal >= 0.8) break;
    cumulCaConcentration += c.ca;
    clientsAvec80PctCa.push(c);
  }
  const nbClientsTop20Pct = Math.max(1, Math.round(clientsParCaDesc.length*0.2));
  const caTop20Pct = clientsParCaDesc.slice(0, nbClientsTop20Pct).reduce((s,c)=>s+c.ca,0);
  const pctCaTop20Pct = caGlobal>0 ? caTop20Pct/caGlobal*100 : 0;

  // ── DSO — délai moyen de paiement ────────────────────────────────────────
  // Sur les factures payées de la période, nombre moyen de jours entre la date
  // de facture et la date de paiement effective. Par client, pour repérer ceux
  // qui glissent progressivement vers des paiements plus tardifs.
  const facturesPayeesCG = cgFacts.filter(f=>f.statut==="Payée" && f.date_paiement);
  const delaisPaiement = facturesPayeesCG.map(f=>Math.round((new Date(f.date_paiement)-new Date(f.date))/86400000)).filter(d=>d>=0);
  const dsoGlobal = delaisPaiement.length>0 ? delaisPaiement.reduce((s,d)=>s+d,0)/delaisPaiement.length : null;
  const dsoParClient = {};
  facturesPayeesCG.forEach(f=>{
    const d = Math.round((new Date(f.date_paiement)-new Date(f.date))/86400000);
    if (d<0 || !f.client_id) return;
    if (!dsoParClient[f.client_id]) dsoParClient[f.client_id] = {nom:f.client_nom, somme:0, nb:0};
    dsoParClient[f.client_id].somme += d; dsoParClient[f.client_id].nb++;
  });
  const listeDsoParClient = Object.values(dsoParClient).map(d=>({nom:d.nom, nb:d.nb, dsoMoyen:d.somme/d.nb})).filter(d=>d.nb>=2).sort((a,b)=>b.dsoMoyen-a.dsoMoyen);

  // ── Coût de livraison par chauffeur, mois par mois ───────────────────────
  // Même logique que coutLivraisonParChauffeur ci-dessus, mais détaillée mois
  // par mois (plutôt qu'agrégée sur toute la période) pour suivre la tendance
  // (hausse carburant, dégradation d'une zone...).
  const coutLivraisonParChauffeurParMois = moisListCG.map(m=>{
    const fg = fraisGeneraux.find(f=>(f.mois||"").slice(0,7)===m);
    const prixDiesel = fg?.prix_diesel_litre!=null ? Number(fg.prix_diesel_litre) : 2.057;
    const consoL100 = fg?.consommation_l_100km!=null ? Number(fg.consommation_l_100km) : 11;
    const coutHoraire = fg?.cout_horaire_chauffeur!=null ? Number(fg.cout_horaire_chauffeur) : 27.64;
    const parChauffeur = {};
    relevesChauffeurs.filter(r=>(r.mois||"").slice(0,7)===m).forEach(r=>{
      const ch = r.chauffeur;
      if (!parChauffeur[ch]) parChauffeur[ch] = {cout:0, km:0, heures:0};
      const km = Number(r.km)||0, heures = Number(r.heures_conduite)||0;
      parChauffeur[ch].cout += km*(consoL100/100)*prixDiesel + heures*coutHoraire;
      parChauffeur[ch].km += km;
      parChauffeur[ch].heures += heures;
    });
    return {mois:m, parChauffeur};
  });

  // ── Priorités d'action — regroupe en listes concrètes les signaux déjà calculés ──
  // Relance prioritaire : client inactif 30j+ ET avec une créance en souffrance (60j+)
  // — on traite la commande et le paiement en même temps plutôt que séparément.
  const clientsIdAvecCreanceEnSouffrance = new Set(
    facturesImpayeesCG.filter(f=>f.date && Math.round((new Date(AUJOURD_HUI_CG)-new Date(f.date))/86400000)>60 && f.client_id).map(f=>f.client_id)
  );
  const clientsRelancePrioritaire = clientsInactifs30j.filter(c=>clientsIdAvecCreanceEnSouffrance.has(c.id));
  // Zones à marge nette négative (coût de livraison réel > marge brute de la zone).
  const zonesMargeNetteNegative = listeZoneNette.filter(z=>z.margeNette!=null && z.margeNette<0).sort((a,b)=>a.margeNette-b.margeNette);
  // Produits sans vrai prix d'achat renseigné (marge affichée = estimation par défaut).
  const produitsFaibleFiabilite = listeProduit.filter(p=>p.fiabilite<80).sort((a,b)=>a.fiabilite-b.fiabilite);
  // Produits vendus nettement moins cher que la concurrence (Freshy) — marge potentiellement
  // sacrifiée sans raison, à vérifier au cas par cas.
  const produitsEcartPrixNegatif = listeProduit.filter(p=>p.ecartPct!=null && p.ecartPct<-10).sort((a,b)=>a.ecartPct-b.ecartPct);

  // ── Évolution mensuelle CA/marge (12 derniers mois) ──────────────────────
  // Vue tendance dans le temps, indépendante du filtre de période choisi en haut
  // de page (qui agrège tout en un seul total) — basée sur tout l'historique.
  const evolutionMensuelle12Mois = (() => {
    const parMois = {};
    factures.filter(f=>f.date && f.statut!=="Avoir" && f.statut!=="Annulée").forEach(f=>{
      const m = f.date.slice(0,7);
      if (!parMois[m]) parMois[m] = {mois:m, ca:0, marge:0};
      const {total} = totalFact(f.lignes, f.tva_pct);
      const mF = calcMargeFacture(f, produits, receptionsStock);
      parMois[m].ca += total; parMois[m].marge += mF.marge;
    });
    return Object.values(parMois).map(m=>({...m, margePct: m.ca>0?m.marge/m.ca*100:0})).sort((a,b)=>a.mois.localeCompare(b.mois)).slice(-12);
  })();
  const maxCaEvolution = Math.max(1, ...evolutionMensuelle12Mois.map(m=>m.ca));

  // ── Rentabilité Professionnel vs Particulier ─────────────────────────────
  const parNatureClient = {};
  cgFacts.forEach(f=>{
    const cl = clients.find(c=>c.id===f.client_id);
    const nature = cl?.nature_client || "Professionnel";
    const {total} = totalFact(f.lignes, f.tva_pct);
    const mF = calcMargeFacture(f, produits, receptionsStock);
    if (!parNatureClient[nature]) parNatureClient[nature] = {nature, ca:0, marge:0, nb:0, clientsSet:new Set()};
    parNatureClient[nature].ca += total; parNatureClient[nature].marge += mF.marge; parNatureClient[nature].nb++;
    if (f.client_id) parNatureClient[nature].clientsSet.add(f.client_id);
  });
  const listeNatureClient = Object.values(parNatureClient).map(n=>({...n, nbClients:n.clientsSet.size, margePct: n.ca>0?n.marge/n.ca*100:0, panierMoyen: n.nb>0?n.ca/n.nb:0}));

  // ── Produits en déclin ────────────────────────────────────────────────────
  // Quantité vendue sur la période vs la période précédente de même durée
  // (réutilise cgFromPrec/cgToPrec déjà calculés pour le panier moyen client).
  const qtePrecParProduit = {};
  if (cgFromPrec && cgToPrec) {
    factures.filter(f=>f.date && f.date>=cgFromPrec && f.date<=cgToPrec && f.statut!=="Avoir" && f.statut!=="Annulée").forEach(f=>{
      (f.lignes||[]).filter(l=>!l.isCredit && l.produitId!=="CREDIT_CONSIGNES").forEach(l=>{
        const nomProd = (l.nom||"").replace(/\s*\(offert\)$/,"");
        qtePrecParProduit[nomProd] = (qtePrecParProduit[nomProd]||0) + l.qte;
      });
    });
  }
  const produitsEnDeclin = listeProduit.map(p=>{
    const qtePrec = qtePrecParProduit[p.nom] || 0;
    const evolutionQtePct = qtePrec>0 ? (p.qte-qtePrec)/qtePrec*100 : null;
    return {...p, qtePrec, evolutionQtePct};
  }).filter(p=>p.evolutionQtePct!=null && p.evolutionQtePct<-20 && p.qtePrec>=5) // seuil pour éviter le bruit sur petits volumes
    .sort((a,b)=>a.evolutionQtePct-b.evolutionQtePct);

  // ── Rentabilité des nouveaux clients (≤90j) vs clients établis ───────────
  const clientsRecents90j = new Set(clients.filter(c=>c.created_at && (new Date(AUJOURD_HUI_CG)-new Date(c.created_at))/86400000<=90).map(c=>c.id));
  const statsNouveauxVsAnciens = ["Nouveaux (≤90j)","Clients établis"].map(label=>{
    const subset = listeClientNette.filter(c=> label.startsWith("Nouveaux") ? clientsRecents90j.has(c.id) : !clientsRecents90j.has(c.id));
    const ca = subset.reduce((s,c)=>s+c.ca,0);
    const marge = subset.reduce((s,c)=>s+c.marge,0);
    const nb = subset.reduce((s,c)=>s+c.nb,0);
    return {label, nbClients:subset.length, ca, marge, margePct: ca>0?marge/ca*100:0, panierMoyen: nb>0?ca/nb:0};
  });

  // ── Score de risque client combiné ───────────────────────────────────────
  // Cumule 3 signaux déjà calculés par ailleurs : inactif 30j+, panier en baisse
  // de 15%+ vs période précédente, créance en souffrance (60j+). On ne garde que
  // les clients avec au moins 2 signaux sur 3, pour prioriser sans croiser les tableaux à la main.
  const clientsScoreRisque = listeClientNette.map(c=>{
    let signaux = 0;
    const joursDepuis = derniereFactureParClient[c.id] ? Math.round((new Date(AUJOURD_HUI_CG)-new Date(derniereFactureParClient[c.id]))/86400000) : null;
    if (joursDepuis==null || joursDepuis>30) signaux++;
    if (c.panierEvolutionPct!=null && c.panierEvolutionPct<-15) signaux++;
    if (clientsIdAvecCreanceEnSouffrance.has(c.id)) signaux++;
    return {...c, joursDepuisScore:joursDepuis, signauxRisque:signaux};
  }).filter(c=>c.signauxRisque>=2).sort((a,b)=>b.signauxRisque-a.signauxRisque);

  // ── Prévision de trésorerie simple ───────────────────────────────────────
  // Échéance standard supposée à 30 jours (pas de champ d'échéance dédié en base) —
  // sépare les impayés "normaux" (pas encore échus) des vrais retards, et compare
  // au montant des charges fixes déjà connues pour le mois prochain.
  const DELAI_PAIEMENT_STANDARD_CG = 30;
  const facturesNonEcheuesCG = facturesImpayeesCG.filter(f=>{
    if (!f.date) return false;
    const echeance = new Date(f.date); echeance.setDate(echeance.getDate()+DELAI_PAIEMENT_STANDARD_CG);
    return echeance >= new Date(AUJOURD_HUI_CG);
  });
  const facturesEnRetardCG = facturesImpayeesCG.filter(f=>!facturesNonEcheuesCG.includes(f));
  const montantNonEcheuesCG = facturesNonEcheuesCG.reduce((s,f)=>s+resteFact(f),0);
  const montantEnRetardCG = facturesEnRetardCG.reduce((s,f)=>s+resteFact(f),0);
  const moisProchainCG = (() => { const d=new Date(AUJOURD_HUI_CG); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,7); })();
  const fraisMoisProchainCG = fraisGeneraux.find(f=>(f.mois||"").slice(0,7)===moisProchainCG);
  const CHAMPS_CHARGES_FIXES = ["masse_salariale","loyer","carburant","assurance_vehicules","entretien_vehicules","leasing_vehicule","frais_comptabilite","frais_bancaires","telephone_mobile","abonnement_box","autres"];
  const chargesFixesMoisProchainCG = fraisMoisProchainCG ? CHAMPS_CHARGES_FIXES.reduce((s,ch)=>s+(Number(fraisMoisProchainCG[ch])||0),0) : null;

  // CA historique pré-app — référence uniquement (montant global, sans marge ni détail
  // client/produit disponibles), pour les mois antérieurs à la mise en service du système (10/09/2026).
  const caHistPreAppPeriode = caHistoriquePreApp.filter(h=>{
    const m = (h.mois||"").slice(0,7);
    return m && (!cgFrom || m>=cgFrom.slice(0,7)) && (!cgTo || m<=cgTo.slice(0,7));
  }).sort((a,b)=>(a.mois||"").localeCompare(b.mois||""));

  // Export CSV — s'ouvre directement dans Excel (point-virgule + BOM UTF-8 pour les accents),
  // même principe que les exports déjà en place sur le Dashboard (Factures/Commandes/Stock).
  const downloadCSV = (filename, rows) => {
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\n");
    const blob = new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const dateSuffix = () => cgFrom+"_a_"+cgTo;
  const exportCGType = () => downloadCSV("controle_gestion_par_type_"+dateSuffix()+".csv",
    [["Type","Clients","Factures","CA","COGS","Marge","Marge %"],
     ...listeType.map(t=>[t.type,t.nbClients,t.nb,t.ca.toFixed(2),t.cogs.toFixed(2),t.marge.toFixed(2),Math.round(t.margePct)+"%"])]);
  const exportCGClient = () => downloadCSV("controle_gestion_par_client_"+dateSuffix()+".csv",
    [["Client","Type","Zone","Factures","Fréquence (j)","CA","COGS","Marge","Marge %","Coût livraison réel","Marge nette","Marge nette %"],
     ...listeClientNette.map(c=>[c.nom,c.type,c.zone,c.nb,c.freqJours!=null?Math.round(c.freqJours):"",c.ca.toFixed(2),c.cogs.toFixed(2),c.marge.toFixed(2),Math.round(c.margePct)+"%",c.coutLivraison!=null?c.coutLivraison.toFixed(2):"",c.margeNette!=null?c.margeNette.toFixed(2):"",c.margeNettePct!=null?Math.round(c.margeNettePct)+"%":""])]);
  const exportCGProduit = () => downloadCSV("controle_gestion_par_produit_"+dateSuffix()+".csv",
    [["Produit","Catégorie","Qté vendue","CA","COGS","Marge","Fiabilité %"],
     ...listeProduit.map(p=>[p.nom,p.categorie,p.qte,p.ca.toFixed(2),p.cogs.toFixed(2),p.marge.toFixed(2),Math.round(p.fiabilite)+"%"])]);
  const exportCGZone = () => downloadCSV("controle_gestion_par_zone_"+dateSuffix()+".csv",
    [["Zone","Chauffeur","Factures","CA","COGS","Marge","Marge %","Coût livraison réel","Marge nette","Marge nette %"],
     ...listeZoneNette.map(z=>[z.zone,z.driver,z.nb,z.ca.toFixed(2),z.cogs.toFixed(2),z.marge.toFixed(2),Math.round(z.margePct)+"%",z.coutLivraison!=null?z.coutLivraison.toFixed(2):"",z.margeNette!=null?z.margeNette.toFixed(2):"",z.margeNettePct!=null?Math.round(z.margeNettePct)+"%":""])]);

  return (
  <div>
    <ExportDonneesBoutons isMobile={isMobile}/>
    {/* ── Filtre période ── */}
    <div style={{...S.card,marginBottom:14,padding:"12px 16px"}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        {[["mois","Mois"],["mois_dernier","Mois dernier"],["trimestre","Trimestre"],["annee","Année"],["12mois","12 mois"]].map(([k,l])=>(
          <button key={k} onClick={()=>applyPeriodCG(k)}
            style={{...S.btn(cgPeriod===k?"#1D4ED8":"#F1F5F9",cgPeriod===k?"#fff":"#374151"),padding:"5px 12px",fontSize:12,fontWeight:cgPeriod===k?700:400}}>
            {l}
          </button>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
          <input type="date" value={cgDateFrom} onChange={e=>{setCgDateFrom(e.target.value);setCgPeriod("custom");}}
            style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}/>
          <span style={{color:"#9CA3AF",fontSize:12}}>→</span>
          <input type="date" value={cgDateTo} onChange={e=>{setCgDateTo(e.target.value);setCgPeriod("custom");}}
            style={{padding:"5px 8px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",borderTop:"1px solid #F1F5F9",paddingTop:10,marginTop:10}}>
        <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600,marginRight:4}}>Exporter (Excel) :</span>
        <button onClick={exportCGType} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="barChart2" size={12}/> Par type</button>
        <button onClick={exportCGClient} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="clients" size={12}/> Par client</button>
        <button onClick={exportCGProduit} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="produits" size={12}/> Par produit</button>
        <button onClick={exportCGZone} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 12px",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><Icon name="carte" size={12}/> Par zone</button>
      </div>
    </div>

    {/* ── KPIs globaux ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:10,marginBottom:8}}>
      {[
        {l:"Chiffre d'affaires",v:fmtFull(caGlobal),c:"#334155"},
        {l:"COGS (coût produits)",v:fmtFull(cogsGlobal),c:"#334155"},
        {l:"Marge brute",v:fmtFull(margeGlobal),c:"#059669"},
        {l:"Marge %",v:Math.round(margePctGlobal)+"%",c:"#059669"},
        {l:"Fiabilité du calcul",v:Math.round(fiabiliteGlobal)+"%",c:fiabiliteGlobal>=80?"#059669":"#D97706"},
      ].map((k,i)=>(
        <div key={i} style={S.kpi(k.c)}>
          <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{k.l}</div>
        </div>
      ))}
    </div>
    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:16}}>
      Marge = coût moyen pondéré des réceptions de stock en priorité, sinon prix d'achat produit, sinon estimation à {Math.round((1-COUT_RATIO_FALLBACK)*100)}% de marge par défaut si aucune donnée de coût n'existe pour ce produit. La "fiabilité" indique la part du chiffre d'affaires reposant sur un vrai coût plutôt que sur l'estimation par défaut — un chiffre bas signale des produits sans prix d'achat renseigné.
    </div>

    {/* ── Factures impayées à traiter (action quotidienne) ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="warning" size={14} style={{color:"#DC2626"}}/> Factures impayées à traiter ({facturesImpayeesCG.length})</div>
      </div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Toutes les factures au statut "Impayée", tous clients confondus, triées de la plus ancienne à la plus récente — indépendant du filtre de période ci-dessus.</div>
      {facturesImpayeesCG.length===0 ? (
        <div style={{textAlign:"center",color:"#059669",padding:"12px 0",fontSize:12,fontWeight:600}}>Aucune facture impayée. 👍</div>
      ) : (
        <div style={{maxHeight:320,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{textAlign:"left",color:"#9CA3AF",fontSize:11}}>
              <th style={{padding:"4px"}}>N°</th><th style={{padding:"4px"}}>Date</th><th style={{padding:"4px"}}>Client</th>
              <th style={{padding:"4px",textAlign:"right"}}>Montant</th><th style={{padding:"4px",textAlign:"right"}}>Jours</th><th style={{padding:"4px"}}></th>
            </tr></thead>
            <tbody>
              {facturesImpayeesCG.map(f=>{
                const total = resteFact(f);
                const jours = f.date ? Math.round((new Date(AUJOURD_HUI_CG)-new Date(f.date))/86400000) : null;
                return (
                  <tr key={f.id} style={{borderBottom:"1px solid #F9FAFB"}}>
                    <td style={{padding:"5px 4px",fontWeight:600}}>{f.numero}</td>
                    <td style={{padding:"5px 4px"}}>{f.date}</td>
                    <td style={{padding:"5px 4px"}}>{f.client_nom}</td>
                    <td style={{padding:"5px 4px",textAlign:"right",fontWeight:600}}>{fmtFull(total)}</td>
                    <td style={{padding:"5px 4px",textAlign:"right",color:jours>60?"#DC2626":jours>30?"#D97706":"#9CA3AF"}}>{jours!=null?jours+"j":"—"}</td>
                    <td style={{padding:"5px 4px",textAlign:"right"}}>
                      <button onClick={()=>{setPaiementFacture(f);setPaiementForm({mode:"",date:today});setShowPaiementForm(true);}}
                        style={{...S.btn("#ECFDF5","#059669"),padding:"4px 10px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>✓ Marquer payée</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* ── Vieillissement des créances & clients inactifs ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={14} style={{color:"#5D6B82"}}/> Vieillissement des créances</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>
          {dateSnapshotRecente ? "Dernier relevé : "+dateSnapshotRecente+" — référence externe, non recalculée en direct." : "Aucun relevé de créances importé."}
        </div>
        {vieillissementCreances.every(t=>t.nb===0) ? (
          <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Pas de données.</div>
        ) : (
        <>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {vieillissementCreances.map(t=>(
                <tr key={t.tranche} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600,color:t.tranche==="90+"?"#DC2626":t.tranche==="60-90"?"#D97706":"#374151"}}>{t.tranche} jours</td>
                  <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{t.nb} facture{t.nb>1?"s":""}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",fontWeight:600}}>{fmtFull(t.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{textAlign:"right",fontWeight:800,fontSize:13,marginTop:6,paddingTop:6,borderTop:"1px solid #F1F5F9"}}>Total : {fmtFull(totalCreances)}</div>
        </>
        )}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="clients" size={14} style={{color:"#5D6B82"}}/> Clients inactifs (+30 jours sans commande)</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>{clientsInactifs30j.length} client(s) actif(s) sans facture depuis plus de 30 jours (ou jamais facturés) — toute la base, indépendant du filtre de période.</div>
        {clientsInactifs30j.length===0 ? (
          <div style={{textAlign:"center",color:"#059669",padding:"12px 0",fontSize:12,fontWeight:600}}>Tous les clients actifs ont commandé récemment. 👍</div>
        ) : (
          <div style={{maxHeight:260,overflowY:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <tbody>
                {clientsInactifs30j.map(c=>(
                  <tr key={c.id} style={{borderBottom:"1px solid #F9FAFB"}}>
                    <td style={{padding:"5px 4px",fontWeight:600}}>{c.nom}</td>
                    <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{c.zone}</td>
                    <td style={{padding:"5px 4px",textAlign:"right",color:c.joursDepuis==null?"#9CA3AF":c.joursDepuis>90?"#DC2626":"#D97706"}}>
                      {c.joursDepuis==null ? "Jamais facturé" : c.joursDepuis+"j"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* ── Acquisition clients & CA historique pré-app ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="clients" size={14} style={{color:"#5D6B82"}}/> Nouveaux clients par mois</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Basé sur la date de création de la fiche client — {totalNouveauxClients} nouveau(x) client(s) sur la période.</div>
        {listeNouveauxClients.length===0 ? (
          <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Aucun nouveau client sur cette période.</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {listeNouveauxClients.map(([m,v])=>(
                <tr key={m} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600,verticalAlign:"top",whiteSpace:"nowrap"}}>{m}</td>
                  <td style={{padding:"5px 4px"}}>
                    <div style={{textAlign:"right",marginBottom:2}}>{v.nb} nouveau{v.nb>1?"x":""}</div>
                    <div style={{color:"#6B7280",fontSize:11}}>{v.noms.join(", ")}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={14} style={{color:"#5D6B82"}}/> CA historique (pré-app)</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Montant global uniquement (pas de détail client/produit, pas de marge calculable) — mois antérieurs à la mise en service du système le 10/09/2026. Référence, non inclus dans les totaux ci-dessus.</div>
        {caHistPreAppPeriode.length===0 ? (
          <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Aucune donnée pré-app sur cette période.</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {caHistPreAppPeriode.map(h=>(
                <tr key={h.mois} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600}}>{h.mois}</td>
                  <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(h.ca_total)}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{h.nb_commandes?h.nb_commandes+" cmd":""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

    {/* ── Charges de structure & résultat net ── */}
    {(()=>{
      const moisFrom = (cgFrom||"").slice(0,7), moisTo = (cgTo||"").slice(0,7);
      const fraisPeriode = fraisGeneraux.filter(fg=>{
        const m = (fg.mois||"").slice(0,7);
        return m && (!moisFrom || m>=moisFrom) && (!moisTo || m<=moisTo);
      }).sort((a,b)=>(a.mois||"").localeCompare(b.mois||""));
      const sumChamp = (champ) => fraisPeriode.reduce((s,f)=>s+(Number(f[champ])||0),0);
      const masseSalariale = sumChamp("masse_salariale");
      const loyerTotal = sumChamp("loyer");
      const carburantTotal = sumChamp("carburant");
      const assuranceTotal = sumChamp("assurance_vehicules");
      const entretienTotal = sumChamp("entretien_vehicules");
      const leasingTotal = sumChamp("leasing_vehicule");
      const comptaTotal = sumChamp("frais_comptabilite");
      const bancairesTotal = sumChamp("frais_bancaires");
      const telephoneTotal = sumChamp("telephone_mobile");
      const boxTotal = sumChamp("abonnement_box");
      const autresTotal = sumChamp("autres");
      const totalCharges = masseSalariale+loyerTotal+carburantTotal+assuranceTotal+entretienTotal+leasingTotal+comptaTotal+bancairesTotal+telephoneTotal+boxTotal+autresTotal;
      const resultatNet = margeGlobal - totalCharges;
      const resultatNetPct = caGlobal>0 ? resultatNet/caGlobal*100 : 0;
      const moisSansMasse = fraisPeriode.filter(f=>f.masse_salariale==null).length;
      return (
      <div style={{...S.card,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={14} style={{color:"#5D6B82"}}/> Charges de structure & résultat net</div>
          <button onClick={()=>openFraisForm(null)} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 10px",fontSize:11,whiteSpace:"nowrap"}}>+ Charges d'un mois</button>
        </div>
        {fraisPeriode.length===0 ? (
          <div style={{textAlign:"center",color:"#9CA3AF",padding:"16px 0",fontSize:12}}>Aucune charge renseignée sur cette période — clique sur "+ Charges d'un mois" pour en ajouter.</div>
        ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:12}}>
            {[
              {l:"Masse salariale",v:fmtFull(masseSalariale),c:"#334155"},
              {l:"Loyer + véhicules + autres",v:fmtFull(loyerTotal+assuranceTotal+entretienTotal+leasingTotal+comptaTotal+bancairesTotal+telephoneTotal+boxTotal+autresTotal),c:"#334155"},
              {l:"Carburant",v:fmtFull(carburantTotal),c:"#334155"},
              {l:"Total charges",v:fmtFull(totalCharges),c:"#334155"},
            ].map((k,i)=>(
              <div key={i} style={S.kpi(k.c)}>
                <div style={{fontSize:16,fontWeight:800,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:"#6B7280"}}>{k.l}</div>
              </div>
            ))}
          </div>
          <div style={{...S.kpi(resultatNet>=0?"#059669":"#DC2626"),marginBottom:10}}>
            <div style={{fontSize:20,fontWeight:800,color:resultatNet>=0?"#059669":"#DC2626"}}>{fmtFull(resultatNet)} <span style={{fontSize:13,fontWeight:600}}>({Math.round(resultatNetPct)}%)</span></div>
            <div style={{fontSize:11,color:"#6B7280"}}>Résultat net estimé de la période (marge brute − charges de structure)</div>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11.5,marginBottom:8}}>
            <thead><tr style={{borderBottom:"1px solid #E5E7EB"}}>
              {["Mois","Masse salariale","Loyer","Carburant","Assurance","Entretien","Charges fixes",""].map(h=>(
                <th key={h} style={{padding:"5px 8px",textAlign:h==="Mois"?"left":"right",color:"#6B7280",fontWeight:600,fontSize:10}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {fraisPeriode.map(f=>(
                <tr key={f.id} style={{borderBottom:"1px solid #F9FAFB",cursor:"pointer"}} onClick={()=>openFraisForm(f)}>
                  <td style={{padding:"5px 8px",fontWeight:600}}>{f.mois}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{f.masse_salariale!=null?fmtFull(f.masse_salariale):<span style={{color:"#D97706"}}>?</span>}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{f.loyer!=null?fmtFull(f.loyer):"—"}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{f.carburant!=null?fmtFull(f.carburant):"—"}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{f.assurance_vehicules!=null?fmtFull(f.assurance_vehicules):"—"}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{f.entretien_vehicules!=null?fmtFull(f.entretien_vehicules):"—"}</td>
                  <td style={{padding:"5px 8px",textAlign:"right"}}>{(()=>{
                    const vals=[f.leasing_vehicule,f.frais_comptabilite,f.frais_bancaires,f.telephone_mobile,f.abonnement_box,f.autres];
                    const some=vals.some(v=>v!=null);
                    return some ? fmtFull(vals.reduce((s,v)=>s+(Number(v)||0),0)) : "—";
                  })()}</td>
                  <td style={{padding:"5px 8px",textAlign:"right",color:"#9CA3AF"}}>✎</td>
                </tr>
              ))}
            </tbody>
          </table>
          {moisSansMasse>0 && <div style={{fontSize:11,color:"#D97706"}}>⚠ {moisSansMasse} mois de la période sans masse salariale renseignée — le résultat net est sous-estimé en charges (donc surestimé) pour ces mois.</div>}
        </>
        )}
      </div>
      );
    })()}

    {/* ── Marge par type de client ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Icon name="barChart2" size={14} style={{color:"#5D6B82"}}/> Marge par type de client</div>
      <DataTable
        isMobile={isMobile}
        rows={listeType}
        exportName="marge_par_type_client"
        pageSize={15}
        emptyMessage="Aucune donnée sur cette période"
        initialSort={{key:"marge",dir:"desc"}}
        footer={isMobile ? (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span>Total</span>
            <span>{fmtFull(caGlobal)} · marge {fmtFull(margeGlobal)}</span>
          </div>
        ) : (
          <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
            <td style={{padding:"8px 12px"}}>Total</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{listeType.reduce((s,t)=>s+t.nbClients,0)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{listeType.reduce((s,t)=>s+t.nb,0)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(caGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(cogsGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{fmtFull(margeGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{Math.round(margePctGlobal)}%</td>
          </tr>
        )}
        columns={[
          {key:"type", label:"Type", mobilePrimary:true, sortValue:r=>r.type, render:r=>{const {bg,text}=tc(r.type); return <span style={S.badge(bg,text)}>{r.type}</span>;}},
          {key:"nbClients", label:"Clients", align:"right", mobileShow:true, sortValue:r=>r.nbClients},
          {key:"nb", label:"Factures", align:"right", sortValue:r=>r.nb},
          {key:"ca", label:"CA", align:"right", mobileShow:true, sortValue:r=>r.ca, render:r=>fmtFull(r.ca)},
          {key:"cogs", label:"COGS", align:"right", sortValue:r=>r.cogs, render:r=>fmtFull(r.cogs)},
          {key:"marge", label:"Marge", align:"right", mobileShow:true, sortValue:r=>r.marge, render:r=><span style={{color:"#059669",fontWeight:600}}>{fmtFull(r.marge)}</span>},
          {key:"margePct", label:"Marge %", align:"right", mobileShow:true, sortValue:r=>r.margePct, render:r=><span style={{color:"#059669",fontWeight:600}}>{Math.round(r.margePct)}%</span>},
        ]}
      />
    </div>

    {/* ── Marge par client ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Icon name="clients" size={14} style={{color:"#5D6B82"}}/> Marge par client</div>
      <DataTable
        isMobile={isMobile}
        rows={listeClientNette}
        exportName="marge_par_client"
        pageSize={20}
        emptyMessage="Aucune donnée sur cette période"
        initialSort={{key:"marge",dir:"desc"}}
        footer={isMobile ? (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span>Total ({listeClientNette.length} clients)</span>
            <span>{fmtFull(caGlobal)} · marge {fmtFull(margeGlobal)}</span>
          </div>
        ) : (
          <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
            <td style={{padding:"8px 12px"}}>Total ({listeClientNette.length} clients)</td>
            <td style={{padding:"8px 12px"}}></td>
            <td style={{padding:"8px 12px"}}></td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{listeClientNette.reduce((s,c)=>s+c.nb,0)}</td>
            <td style={{padding:"8px 12px"}}></td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(caGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(cogsGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{fmtFull(margeGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{Math.round(margePctGlobal)}%</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{coutLivraisonTotal>0?fmtFull(coutLivraisonTotal):"—"}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:margeNetteGlobaleCalc!=null&&margeNetteGlobaleCalc>=0?"#059669":"#DC2626"}}>{margeNetteGlobaleCalc!=null?fmtFull(margeNetteGlobaleCalc):"—"}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:margeNetteGlobaleCalc!=null&&margeNetteGlobaleCalc>=0?"#059669":"#DC2626"}}>{(margeNetteGlobaleCalc!=null&&caGlobal>0)?Math.round(margeNetteGlobaleCalc/caGlobal*100)+"%":"—"}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{listeClientNette.reduce((s,c)=>s+c.nb,0)>0?fmtFull(caGlobal/listeClientNette.reduce((s,c)=>s+c.nb,0)):"—"}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{clientsEligiblesPack.length}</td>
          </tr>
        )}
        columns={[
          {key:"nom", label:"Client", mobilePrimary:true, sortValue:r=>r.nom},
          {key:"type", label:"Type", sortValue:r=>r.type},
          {key:"zone", label:"Zone", mobileShow:true, sortValue:r=>r.zone},
          {key:"nb", label:"Factures", align:"right", sortValue:r=>r.nb},
          {key:"freqJours", label:"Fréquence", align:"right", sortValue:r=>r.freqJours??999999, render:r=>r.freqJours!=null?"~"+Math.round(r.freqJours)+"j":<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"ca", label:"CA", align:"right", mobileShow:true, sortValue:r=>r.ca, render:r=>fmtFull(r.ca)},
          {key:"cogs", label:"COGS", align:"right", sortValue:r=>r.cogs, render:r=>fmtFull(r.cogs)},
          {key:"marge", label:"Marge", align:"right", sortValue:r=>r.marge, render:r=><span style={{color:"#059669",fontWeight:600}}>{fmtFull(r.marge)}</span>},
          {key:"margePct", label:"Marge %", align:"right", sortValue:r=>r.margePct, render:r=><span style={{color:"#059669",fontWeight:600}}>{Math.round(r.margePct)}%</span>},
          {key:"coutLivraison", label:"Coût livraison réel", align:"right", sortValue:r=>r.coutLivraison??-1, render:r=>r.coutLivraison!=null?fmtFull(r.coutLivraison):<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"margeNette", label:"Marge nette", align:"right", mobileShow:true, sortValue:r=>r.margeNette??-Infinity, render:r=>r.margeNette!=null?<span style={{color:r.margeNette>=0?"#059669":"#DC2626",fontWeight:600}}>{fmtFull(r.margeNette)}</span>:<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"margeNettePct", label:"Marge nette %", align:"right", sortValue:r=>r.margeNettePct??-Infinity, render:r=>r.margeNettePct!=null?<span style={{color:r.margeNettePct>=0?"#059669":"#DC2626",fontWeight:600}}>{Math.round(r.margeNettePct)}%</span>:<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"panierMoyen", label:"Panier moyen", align:"right", sortValue:r=>r.panierMoyen, render:r=>(
            <span>{fmtFull(r.panierMoyen)}{r.panierEvolutionPct!=null && (
              <span style={{marginLeft:5,fontSize:11,fontWeight:700,color:r.panierEvolutionPct>=0?"#059669":"#DC2626"}}>{r.panierEvolutionPct>=0?"▲":"▼"}{Math.abs(Math.round(r.panierEvolutionPct))}%</span>
            )}</span>
          )},
          {key:"pack", label:"🎁 Pack offert", align:"right", sortValue:r=>r.marge>=seuilPackOffert?1:0, render:r=>r.marge>=seuilPackOffert?<span style={{color:"#059669",fontWeight:700}}>🎁 Éligible</span>:<span style={{color:"#CBD5E1"}}>—</span>},
        ]}
      />
      <div style={{fontSize:11,color:"#9CA3AF",marginTop:8}}>Fréquence = nombre moyen de jours entre deux commandes sur la période (nécessite au moins 2 factures) — un chiffre bas signale un client régulier, un chiffre élevé ou "—" un client occasionnel ou ponctuel. Marge nette = marge − coût de livraison réel alloué (voir bloc "Coût de livraison réel" ci-dessous) ; "—" quand le chauffeur de la zone n'a pas de relevé TrackFleet sur la période. "Pack offert" = marge brute cumulée sur la période ≥ seuil réglable ci-dessous. "Panier moyen" = CA / nb factures sur la période, avec l'évolution ▲▼ vs la période précédente de même durée (— si pas de données sur la période précédente).</div>
    </div>

    {/* ── Clients éligibles à un pack offert ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:4}}>
        <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="trophy" size={14} style={{color:"#D97706"}}/> Clients éligibles à un pack offert</div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
          <span style={{color:"#6B7280"}}>Seuil de marge brute (sur la période) :</span>
          <input type="number" value={seuilPackOffert} onChange={e=>setSeuilPackOffert(Number(e.target.value)||0)}
            style={{width:80,padding:"4px 8px",border:"1px solid #E5E7EB",borderRadius:6,fontSize:12}}/>
          <span style={{color:"#6B7280"}}>€</span>
        </div>
      </div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Dès que la marge brute cumulée d'un client sur la période sélectionnée atteint ce seuil, on peut lui offrir une caisse (ex. un pack de Coca). Basé sur la période du filtre en haut de page — pas de suivi "déjà offert" pour l'instant.</div>
      {clientsEligiblesPack.length===0 ? (
        <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Aucun client n'atteint le seuil sur cette période.</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <tbody>
            {clientsEligiblesPack.map(c=>(
              <tr key={c.id} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>🎁 {c.nom}</td>
                <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{c.zone}</td>
                <td style={{padding:"5px 4px",textAlign:"right",fontWeight:700,color:"#059669"}}>{fmtFull(c.marge)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* ── Taux de rétention mensuel & Concentration du CA ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="trendingUp" size={14} style={{color:"#5D6B82"}}/> Taux de rétention mensuel</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>% des clients actifs un mois qui recommandent le mois suivant — calculé sur tout l'historique, indépendant du filtre de période.</div>
        {retentionAffichee.length===0 ? (
          <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Pas assez d'historique (2 mois consécutifs minimum).</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{textAlign:"left",color:"#9CA3AF",fontSize:11}}>
              <th style={{padding:"4px"}}>Mois → suivant</th><th style={{padding:"4px",textAlign:"right"}}>Actifs</th><th style={{padding:"4px",textAlign:"right"}}>Recommandé</th><th style={{padding:"4px",textAlign:"right"}}>Taux</th>
            </tr></thead>
            <tbody>
              {retentionAffichee.map(r=>(
                <tr key={r.mois} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600}}>{r.mois} → {r.moisSuivant}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{r.nbActifs}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{r.nbRecommande}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",fontWeight:700,color:r.taux>=60?"#059669":r.taux>=40?"#D97706":"#DC2626"}}>{Math.round(r.taux)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="barChart2" size={14} style={{color:"#5D6B82"}}/> Concentration du CA (règle 80/20)</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Sur la période sélectionnée — plus le nombre de clients ci-dessous est petit, plus la dépendance à une poignée de clients est élevée.</div>
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <div style={{...S.kpi("#334155"),flex:1}}>
            <div style={{fontSize:18,fontWeight:800,color:"#334155"}}>{clientsAvec80PctCa.length} / {clientsParCaDesc.length}</div>
            <div style={{fontSize:11,color:"#6B7280"}}>clients font 80% du CA</div>
          </div>
          <div style={{...S.kpi("#334155"),flex:1}}>
            <div style={{fontSize:18,fontWeight:800,color:"#334155"}}>{Math.round(pctCaTop20Pct)}%</div>
            <div style={{fontSize:11,color:"#6B7280"}}>du CA fait par les {nbClientsTop20Pct} plus gros clients (top 20%)</div>
          </div>
        </div>
        {clientsAvec80PctCa.length>0 && (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {clientsAvec80PctCa.slice(0,10).map(c=>(
                <tr key={c.id} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600}}>{c.nom}</td>
                  <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(c.ca)}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{caGlobal>0?Math.round(c.ca/caGlobal*100):0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

    {/* ── DSO — délai moyen de paiement ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={14} style={{color:"#5D6B82"}}/> DSO — délai moyen de paiement</div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Jours moyens entre la date de facture et la date de paiement effective, sur les factures payées de la période.</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10,marginBottom:10}}>
        <div style={S.kpi("#334155")}>
          <div style={{fontSize:18,fontWeight:800,color:"#334155"}}>{dsoGlobal!=null?Math.round(dsoGlobal)+"j":"—"}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>DSO global</div>
        </div>
        <div style={S.kpi("#334155")}>
          <div style={{fontSize:18,fontWeight:800,color:"#334155"}}>{facturesPayeesCG.length}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>factures payées sur la période</div>
        </div>
      </div>
      {listeDsoParClient.length===0 ? (
        <div style={{textAlign:"center",color:"#9CA3AF",padding:"8px 0",fontSize:12}}>Pas assez de factures payées (2 minimum par client) pour un détail par client.</div>
      ) : (
        <>
          <div style={{fontSize:11,color:"#9CA3AF",fontWeight:600,marginBottom:4}}>Clients qui paient le plus tard (≥2 factures payées) :</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {listeDsoParClient.slice(0,10).map(d=>(
                <tr key={d.nom} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600}}>{d.nom}</td>
                  <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{d.nb} factures</td>
                  <td style={{padding:"5px 4px",textAlign:"right",fontWeight:700,color:d.dsoMoyen>45?"#DC2626":d.dsoMoyen>20?"#D97706":"#059669"}}>{Math.round(d.dsoMoyen)}j</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>

    {/* ── Coût de livraison par chauffeur, mois par mois ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="carte" size={14} style={{color:"#5D6B82"}}/> Coût de livraison par chauffeur — tendance mensuelle</div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Basé sur les relevés TrackFleet (km + heures de conduite) saisis mois par mois — "—" quand aucun relevé n'existe pour ce mois.</div>
      {coutLivraisonParChauffeurParMois.length===0 ? (
        <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Aucun mois dans la période sélectionnée.</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{textAlign:"left",color:"#9CA3AF",fontSize:11}}>
            <th style={{padding:"4px"}}>Mois</th>
            {["Sefa","Mikail"].map(ch=><th key={ch} style={{padding:"4px",textAlign:"right"}}>{ch}</th>)}
          </tr></thead>
          <tbody>
            {coutLivraisonParChauffeurParMois.map(m=>(
              <tr key={m.mois} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{m.mois}</td>
                {["Sefa","Mikail"].map(ch=>{
                  const cd = m.parChauffeur[ch];
                  return <td key={ch} style={{padding:"5px 4px",textAlign:"right"}}>{cd ? fmtFull(cd.cout)+" ("+Math.round(cd.km)+"km)" : <span style={{color:"#CBD5E1"}}>—</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* ── Priorités d'action ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="bulb" size={14} style={{color:"#D97706"}}/> Priorités d'action</div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:12}}>Croisement des indicateurs ci-dessus en listes concrètes à traiter.</div>

      <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>📞 Relance prioritaire ({clientsRelancePrioritaire.length}) — inactif 30j+ ET créance 60j+</div>
      {clientsRelancePrioritaire.length===0 ? (
        <div style={{color:"#9CA3AF",fontSize:12,marginBottom:14}}>Aucun client dans ce cas actuellement.</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:14}}>
          <tbody>
            {clientsRelancePrioritaire.map(c=>(
              <tr key={c.id} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{c.nom}</td>
                <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{c.zone}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#DC2626"}}>{c.joursDepuis==null?"Jamais facturé":c.joursDepuis+"j sans commande"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>📉 Zones à marge nette négative ({zonesMargeNetteNegative.length})</div>
      {zonesMargeNetteNegative.length===0 ? (
        <div style={{color:"#9CA3AF",fontSize:12,marginBottom:14}}>Aucune zone en marge nette négative sur la période.</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:14}}>
          <tbody>
            {zonesMargeNetteNegative.map(z=>(
              <tr key={z.zone} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{z.zone}</td>
                <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{z.driver}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#DC2626",fontWeight:700}}>{fmtFull(z.margeNette)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>❓ Produits sans prix d'achat fiable ({produitsFaibleFiabilite.length})</div>
      {produitsFaibleFiabilite.length===0 ? (
        <div style={{color:"#9CA3AF",fontSize:12,marginBottom:14}}>Tous les produits ont une marge fiable (≥80%).</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:14}}>
          <tbody>
            {produitsFaibleFiabilite.slice(0,10).map(p=>(
              <tr key={p.nom} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{p.nom}</td>
                <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{p.categorie}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#D97706",fontWeight:700}}>{Math.round(p.fiabilite)}% fiable</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>💸 Produits vendus bien moins cher que Freshy ({produitsEcartPrixNegatif.length})</div>
      {produitsEcartPrixNegatif.length===0 ? (
        <div style={{color:"#9CA3AF",fontSize:12}}>Aucun écart de prix négatif important détecté.</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <tbody>
            {produitsEcartPrixNegatif.map(p=>(
              <tr key={p.nom} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{p.nom}</td>
                <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{fmtFull(p.prixVente)} vs {fmtFull(p.prixConcurrent)}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#DC2626",fontWeight:700}}>{Math.round(p.ecartPct)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* ── Évolution mensuelle CA / marge (12 mois) ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="trendingUp" size={14} style={{color:"#5D6B82"}}/> Évolution mensuelle CA / marge (12 derniers mois)</div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Tendance dans le temps, indépendante du filtre de période choisi en haut de page.</div>
      {evolutionMensuelle12Mois.length===0 ? (
        <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Pas de données.</div>
      ) : (
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <tbody>
            {evolutionMensuelle12Mois.map(m=>(
              <tr key={m.mois} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600,whiteSpace:"nowrap"}}>{m.mois}</td>
                <td style={{padding:"5px 4px",width:"40%"}}>
                  <div style={{background:"#EEF2FF",borderRadius:4,height:14,width:(m.ca/maxCaEvolution*100)+"%",minWidth:2}}/>
                </td>
                <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(m.ca)}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#059669",fontWeight:600}}>{fmtFull(m.marge)}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#059669"}}>{Math.round(m.margePct)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

    {/* ── Rentabilité Pro vs Particulier & Nouveaux vs établis ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="clients" size={14} style={{color:"#5D6B82"}}/> Professionnel vs Particulier</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Sur la période sélectionnée.</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{textAlign:"left",color:"#9CA3AF",fontSize:11}}>
            <th style={{padding:"4px"}}></th><th style={{padding:"4px",textAlign:"right"}}>Clients</th><th style={{padding:"4px",textAlign:"right"}}>CA</th><th style={{padding:"4px",textAlign:"right"}}>Marge %</th><th style={{padding:"4px",textAlign:"right"}}>Panier moyen</th>
          </tr></thead>
          <tbody>
            {listeNatureClient.map(n=>(
              <tr key={n.nature} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{n.nature}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{n.nbClients}</td>
                <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(n.ca)}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#059669",fontWeight:600}}>{Math.round(n.margePct)}%</td>
                <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(n.panierMoyen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="sparkle" size={14} style={{color:"#5D6B82"}}/> Nouveaux clients vs clients établis</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>"Nouveaux" = fiche créée il y a ≤90 jours — marge sur la période sélectionnée.</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{textAlign:"left",color:"#9CA3AF",fontSize:11}}>
            <th style={{padding:"4px"}}></th><th style={{padding:"4px",textAlign:"right"}}>Clients</th><th style={{padding:"4px",textAlign:"right"}}>CA</th><th style={{padding:"4px",textAlign:"right"}}>Marge %</th><th style={{padding:"4px",textAlign:"right"}}>Panier moyen</th>
          </tr></thead>
          <tbody>
            {statsNouveauxVsAnciens.map(n=>(
              <tr key={n.label} style={{borderBottom:"1px solid #F9FAFB"}}>
                <td style={{padding:"5px 4px",fontWeight:600}}>{n.label}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#9CA3AF"}}>{n.nbClients}</td>
                <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(n.ca)}</td>
                <td style={{padding:"5px 4px",textAlign:"right",color:"#059669",fontWeight:600}}>{Math.round(n.margePct)}%</td>
                <td style={{padding:"5px 4px",textAlign:"right"}}>{fmtFull(n.panierMoyen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* ── Produits en déclin & Score de risque clients ── */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:16}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="produits" size={14} style={{color:"#5D6B82"}}/> Produits en déclin ({produitsEnDeclin.length})</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Quantité vendue en baisse de 20%+ vs la période précédente de même durée (≥5 unités vendues avant, pour éviter le bruit).</div>
        {produitsEnDeclin.length===0 ? (
          <div style={{textAlign:"center",color:"#9CA3AF",padding:"12px 0",fontSize:12}}>Aucun produit en déclin marqué sur cette période.</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {produitsEnDeclin.map(p=>(
                <tr key={p.nom} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600}}>{p.nom}</td>
                  <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{p.qtePrec} → {p.qte}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",color:"#DC2626",fontWeight:700}}>{Math.round(p.evolutionQtePct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="danger" size={14} style={{color:"#DC2626"}}/> Score de risque clients ({clientsScoreRisque.length})</div>
        <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Clients cumulant au moins 2 signaux sur 3 : inactif 30j+, panier en baisse de 15%+, créance en souffrance (60j+).</div>
        {clientsScoreRisque.length===0 ? (
          <div style={{textAlign:"center",color:"#059669",padding:"12px 0",fontSize:12,fontWeight:600}}>Aucun client à risque élevé actuellement. 👍</div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <tbody>
              {clientsScoreRisque.map(c=>(
                <tr key={c.id} style={{borderBottom:"1px solid #F9FAFB"}}>
                  <td style={{padding:"5px 4px",fontWeight:600}}>{c.nom}</td>
                  <td style={{padding:"5px 4px",color:"#9CA3AF"}}>{c.zone}</td>
                  <td style={{padding:"5px 4px",textAlign:"right",fontWeight:700,color:c.signauxRisque>=3?"#DC2626":"#D97706"}}>{"🚩".repeat(c.signauxRisque)} {c.signauxRisque}/3</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>

    {/* ── Prévision de trésorerie simple ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:7}}><Icon name="money" size={14} style={{color:"#5D6B82"}}/> Prévision de trésorerie simple</div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>Échéance standard supposée à 30 jours (pas de date d'échéance dédiée en base) — à prendre comme un ordre de grandeur, pas un calcul comptable précis.</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
        <div style={S.kpi("#334155")}>
          <div style={{fontSize:18,fontWeight:800,color:"#334155"}}>{fmtFull(montantNonEcheuesCG)}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>Impayés pas encore échus ({facturesNonEcheuesCG.length} factures)</div>
        </div>
        <div style={S.kpi("#DC2626")}>
          <div style={{fontSize:18,fontWeight:800,color:"#DC2626"}}>{fmtFull(montantEnRetardCG)}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>Impayés en retard ({facturesEnRetardCG.length} factures)</div>
        </div>
        <div style={S.kpi("#334155")}>
          <div style={{fontSize:18,fontWeight:800,color:"#334155"}}>{chargesFixesMoisProchainCG!=null?fmtFull(chargesFixesMoisProchainCG):"—"}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>Charges fixes connues pour {moisProchainCG}{chargesFixesMoisProchainCG==null?" (non renseignées)":""}</div>
        </div>
      </div>
    </div>

    {/* ── Marge par facture ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Icon name="factures" size={14} style={{color:"#5D6B82"}}/> Marge par facture</div>
      <DataTable
        isMobile={isMobile}
        rows={margeParFacture}
        exportName="marge_par_facture"
        pageSize={20}
        emptyMessage="Aucune facture sur cette période"
        initialSort={{key:"date",dir:"desc"}}
        columns={[
          {key:"numero", label:"N°", mobilePrimary:true, sortValue:r=>r.numero},
          {key:"date", label:"Date", mobileShow:true, sortValue:r=>r.date},
          {key:"client", label:"Client", mobileShow:true, sortValue:r=>r.client},
          {key:"ca", label:"CA", align:"right", mobileShow:true, sortValue:r=>r.ca, render:r=>fmtFull(r.ca)},
          {key:"marge", label:"Marge", align:"right", mobileShow:true, sortValue:r=>r.marge, render:r=><span style={{color:r.marge<0?"#DC2626":"#059669",fontWeight:600}}>{fmtFull(r.marge)}</span>},
          {key:"margePct", label:"Marge %", align:"right", sortValue:r=>r.margePct, render:r=><span style={{color:r.marge<0?"#DC2626":"#059669",fontWeight:600}}>{Math.round(r.margePct)}%</span>},
        ]}
      />
      <div style={{fontSize:11,color:"#9CA3AF",marginTop:8}}>En rouge : les factures dont la marge est négative.</div>
    </div>

    {/* ── Marge par produit ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Icon name="produits" size={14} style={{color:"#5D6B82"}}/> Marge par produit</div>
      <DataTable
        isMobile={isMobile}
        rows={listeProduit}
        exportName="marge_par_produit"
        pageSize={20}
        emptyMessage="Aucune donnée sur cette période"
        initialSort={{key:"marge",dir:"desc"}}
        footer={isMobile ? (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span>Total ({listeProduit.length} produits)</span>
            <span>{fmtFull(caProduitsTotal)} · marge {fmtFull(margeProduitsTotal)}</span>
          </div>
        ) : (
          <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
            <td style={{padding:"8px 12px"}}>Total ({listeProduit.length} produits)</td>
            <td style={{padding:"8px 12px"}}></td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{listeProduit.reduce((s,p)=>s+p.qte,0)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(caProduitsTotal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(caProduitsTotal-margeProduitsTotal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{fmtFull(margeProduitsTotal)}</td>
            <td style={{padding:"8px 12px"}}></td>
          </tr>
        )}
        columns={[
          {key:"nom", label:"Produit", mobilePrimary:true, sortValue:r=>r.nom},
          {key:"categorie", label:"Catégorie", sortValue:r=>r.categorie},
          {key:"qte", label:"Qté vendue", align:"right", mobileShow:true, sortValue:r=>r.qte},
          {key:"ca", label:"CA", align:"right", mobileShow:true, sortValue:r=>r.ca, render:r=>fmtFull(r.ca)},
          {key:"cogs", label:"COGS", align:"right", sortValue:r=>r.cogs, render:r=>fmtFull(r.cogs)},
          {key:"marge", label:"Marge", align:"right", mobileShow:true, sortValue:r=>r.marge, render:r=><span style={{color:"#059669",fontWeight:600}}>{fmtFull(r.marge)}</span>},
          {key:"prixConcurrent", label:"Prix Freshy", align:"right", sortValue:r=>r.prixConcurrent??-1, render:r=>r.prixConcurrent!=null?fmtFull(r.prixConcurrent):<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"ecartPct", label:"Écart", align:"right", sortValue:r=>r.ecartPct??-999, render:r=>r.ecartPct==null?<span style={{color:"#CBD5E1"}}>—</span>:
            <span style={{color:r.ecartPct>0?"#DC2626":"#059669",fontWeight:600}}>{r.ecartPct>0?"+":""}{Math.round(r.ecartPct)}%</span>},
          {key:"fiabilite", label:"Fiabilité", align:"right", sortValue:r=>r.fiabilite, render:r=><span style={{color:r.fiabilite>=80?"#059669":"#D97706",fontSize:11}}>{Math.round(r.fiabilite)}%</span>},
        ]}
      />
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
        <div style={{fontSize:11,color:"#9CA3AF"}}>Prix Freshy relevé manuellement — {prixConcurrents.length} prix enregistrés. Écart = (prix moyen vendu − prix Freshy) / prix Freshy.</div>
        <button onClick={()=>{setPrixConcForm({produit_id:"",concurrent:"Freshy",prix:"",date_releve:localDateStr()});setShowPrixConcForm(true);}}
          style={{...S.btn("#F1F5F9","#374151"),padding:"5px 10px",fontSize:11,whiteSpace:"nowrap"}}>+ Prix concurrent</button>
      </div>
    </div>

    {/* ── Marge par zone ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:4}}>
        <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="carte" size={14} style={{color:"#5D6B82"}}/> Marge par zone</div>
        <button onClick={()=>calculerDistancesReelles(false)} disabled={calcDistancesLoading} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 10px",fontSize:11,whiteSpace:"nowrap",opacity:calcDistancesLoading?0.5:1}}>
          {calcDistancesLoading?"Calcul...":"📍 Calculer distances réelles"}
        </button>
      </div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>
        Distance = trajet routier réel (dépôt → client) quand il a été calculé ({nbClientsAvecDistanceReelle}/{nbClientsAvecCoords} clients géolocalisés), sinon distance à vol d'oiseau par défaut (proxy, pas un vrai trajet). Clique sur "Calculer distances réelles" pour compléter les clients manquants (calcul via un service de routage public, peut prendre quelques minutes selon le nombre de clients).
      </div>
      {calcDistancesMsg && <div style={{fontSize:11,color:"#1D4ED8",marginBottom:8}}>{calcDistancesMsg}</div>}
      <DataTable
        isMobile={isMobile}
        rows={listeZoneNette}
        exportName="marge_par_zone"
        pageSize={15}
        emptyMessage="Aucune donnée sur cette période"
        initialSort={{key:"marge",dir:"desc"}}
        footer={isMobile ? (
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span>Total</span>
            <span>{fmtFull(caGlobal)} · marge {fmtFull(margeGlobal)}</span>
          </div>
        ) : (
          <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
            <td style={{padding:"8px 12px"}}>Total</td>
            <td style={{padding:"8px 12px"}}></td>
            <td style={{padding:"8px 12px"}}></td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{listeZoneNette.reduce((s,z)=>s+z.nb,0)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(caGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(cogsGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{fmtFull(margeGlobal)}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:"#059669"}}>{Math.round(margePctGlobal)}%</td>
            <td style={{padding:"8px 12px",textAlign:"right"}}>{coutLivraisonTotal>0?fmtFull(coutLivraisonTotal):"—"}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:margeNetteGlobaleCalc!=null&&margeNetteGlobaleCalc>=0?"#059669":"#DC2626"}}>{margeNetteGlobaleCalc!=null?fmtFull(margeNetteGlobaleCalc):"—"}</td>
            <td style={{padding:"8px 12px",textAlign:"right",color:margeNetteGlobaleCalc!=null&&margeNetteGlobaleCalc>=0?"#059669":"#DC2626"}}>{(margeNetteGlobaleCalc!=null&&caGlobal>0)?Math.round(margeNetteGlobaleCalc/caGlobal*100)+"%":"—"}</td>
          </tr>
        )}
        columns={[
          {key:"zone", label:"Zone", mobilePrimary:true, sortValue:r=>r.zone},
          {key:"driver", label:"Chauffeur", mobileShow:true, sortValue:r=>r.driver},
          {key:"distanceMoyenne", label:"Distance moy.", align:"right", sortValue:r=>r.distanceMoyenne??-1, render:r=>r.distanceMoyenne!=null?
            <span>{Math.round(r.distanceMoyenne)} km {r.distanceSource==="route"?<span title="Trajet réel" style={{color:"#059669"}}>●</span>:r.distanceSource==="mixte"?<span title="Partiellement réel" style={{color:"#D97706"}}>●</span>:<span title="Vol d'oiseau (estimé)" style={{color:"#CBD5E1"}}>●</span>}</span>
            :<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"nb", label:"Factures", align:"right", sortValue:r=>r.nb},
          {key:"ca", label:"CA", align:"right", mobileShow:true, sortValue:r=>r.ca, render:r=>fmtFull(r.ca)},
          {key:"cogs", label:"COGS", align:"right", sortValue:r=>r.cogs, render:r=>fmtFull(r.cogs)},
          {key:"marge", label:"Marge", align:"right", sortValue:r=>r.marge, render:r=><span style={{color:"#059669",fontWeight:600}}>{fmtFull(r.marge)}</span>},
          {key:"margePct", label:"Marge %", align:"right", sortValue:r=>r.margePct, render:r=><span style={{color:"#059669",fontWeight:600}}>{Math.round(r.margePct)}%</span>},
          {key:"coutLivraison", label:"Coût livraison réel", align:"right", mobileShow:true, sortValue:r=>r.coutLivraison??-1, render:r=>r.coutLivraison!=null?fmtFull(r.coutLivraison):<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"margeNette", label:"Marge nette", align:"right", mobileShow:true, sortValue:r=>r.margeNette??-Infinity, render:r=>r.margeNette!=null?<span style={{color:r.margeNette>=0?"#059669":"#DC2626",fontWeight:600}}>{fmtFull(r.margeNette)}</span>:<span style={{color:"#CBD5E1"}}>—</span>},
          {key:"margeNettePct", label:"Marge nette %", align:"right", sortValue:r=>r.margeNettePct??-Infinity, render:r=>r.margeNettePct!=null?<span style={{color:r.margeNettePct>=0?"#059669":"#DC2626",fontWeight:600}}>{Math.round(r.margeNettePct)}%</span>:<span style={{color:"#CBD5E1"}}>—</span>},
        ]}
      />
      <div style={{fontSize:11,color:"#9CA3AF",marginTop:8}}>Coût livraison réel = carburant + temps chauffeur chargé, calculé à partir des relevés TrackFleet (km, heures de conduite) du/des chauffeur(s) de la zone, réparti entre zones au prorata d'une distance estimée. "—" = pas de relevé TrackFleet sur la période pour ce chauffeur.</div>
    </div>

    {/* ── Coût de livraison réel (TrackFleet) ── */}
    <div style={{...S.card,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7}}><Icon name="carte" size={14} style={{color:"#5D6B82"}}/> Coût de livraison réel — relevés chauffeurs (TrackFleet)</div>
        <button onClick={()=>openRelevChfForm(null)} style={{...S.btn("#F1F5F9","#374151"),padding:"5px 10px",fontSize:11,whiteSpace:"nowrap"}}>+ Relevé chauffeur</button>
      </div>
      <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>
        Un relevé par chauffeur et par mois (km parcourus + heures de conduite, depuis le rapport "Résumé" TrackFleet), converti en coût réel via les paramètres définis dans "+ Charges d'un mois" (coût horaire chauffeur, prix diesel, consommation). Sert à calculer la marge nette par zone/client ci-dessus.
      </div>
      {["Sefa","Mikail"].map(ch=>{
        const cd = coutLivraisonParChauffeur[ch];
        return (
          <div key={ch} style={{...S.kpi(cd?"#334155":"#D97706"),display:"inline-block",marginRight:10,marginBottom:10,minWidth:150}}>
            <div style={{fontSize:16,fontWeight:800,color:cd?"#334155":"#D97706"}}>{cd?fmtFull(cd.cout):"? aucun relevé"}</div>
            <div style={{fontSize:11,color:"#6B7280"}}>{ch} {cd?`· ${Math.round(cd.km)} km · ${cd.heures.toFixed(1)}h`:""}</div>
          </div>
        );
      })}
      {nbChauffeursRenseignes===0 && moisListCG.length>0 && (
        <div style={{fontSize:11,color:"#D97706",marginBottom:8}}>⚠ Aucun relevé chauffeur sur la période — ajoute les relevés du rapport TrackFleet pour activer la marge nette par zone/client.</div>
      )}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11.5}}>
        <thead><tr style={{borderBottom:"1px solid #E5E7EB"}}>
          {["Mois","Chauffeur","Km","Heures conduite","Trajets",""].map(h=>(
            <th key={h} style={{padding:"5px 8px",textAlign:h==="Mois"||h==="Chauffeur"?"left":"right",color:"#6B7280",fontWeight:600,fontSize:10}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {relevesChauffeurs.filter(r=>moisListCG.includes((r.mois||"").slice(0,7))).sort((a,b)=>(b.mois||"").localeCompare(a.mois||"")||(a.chauffeur||"").localeCompare(b.chauffeur||"")).map(r=>(
            <tr key={r.id} style={{borderBottom:"1px solid #F9FAFB",cursor:"pointer"}} onClick={()=>openRelevChfForm(r)}>
              <td style={{padding:"5px 8px",fontWeight:600}}>{(r.mois||"").slice(0,7)}</td>
              <td style={{padding:"5px 8px"}}>{r.chauffeur}</td>
              <td style={{padding:"5px 8px",textAlign:"right"}}>{r.km!=null?Math.round(r.km)+" km":"—"}</td>
              <td style={{padding:"5px 8px",textAlign:"right"}}>{r.heures_conduite!=null?r.heures_conduite+"h":"—"}</td>
              <td style={{padding:"5px 8px",textAlign:"right"}}>{r.trajets??"—"}</td>
              <td style={{padding:"5px 8px",textAlign:"right",color:"#9CA3AF"}}>✎</td>
            </tr>
          ))}
        </tbody>
      </table>
      {relevesChauffeurs.filter(r=>moisListCG.includes((r.mois||"").slice(0,7))).length===0 && (
        <div style={{textAlign:"center",color:"#9CA3AF",padding:"16px 0",fontSize:12}}>Aucun relevé chauffeur sur cette période — clique sur "+ Relevé chauffeur" pour en ajouter.</div>
      )}
    </div>
  </div>
  );
})()}

{/* ══ CLIENTS ══════════════════════════════════════════════════ */}
{page==="clients" && !selClient && (
  <div>
    {workTabStrip()}
    {clients.filter(c=>c.statut_compte==="en_attente").length>0 && (
      <div style={{...S.card,marginBottom:14,border:"1px solid #FDE68A",background:"#FFFBEB"}}>
        <div style={{fontWeight:700,fontSize:14,color:"#92400E",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
          🌐 Demandes de compte portail — {clients.filter(c=>c.statut_compte==="en_attente").length} en attente
        </div>
        <div style={{display:"grid",gap:8}}>
          {clients.filter(c=>c.statut_compte==="en_attente").map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap",background:"#fff",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 12px"}}>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13}}>{c.nom}</div>
                <div style={{fontSize:11,color:"#6B7280"}}>
                  {c.type||"—"} · {c.adresse||"adresse non renseignée"}
                  {c.tva ? ` · TVA ${c.tva}` : ""}{c.rcs ? ` · RCS ${c.rcs}` : ""}
                </div>
                <div style={{fontSize:11,color:"#6B7280"}}>{c.contact||""} {c.email?`· ${c.email}`:""} {c.telephone?`· ${c.telephone}`:""}</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>activerDemandeCompte(c)} style={{...S.btn("#059669"),padding:"6px 12px",fontSize:12}}>✓ Activer</button>
                <button onClick={()=>refuserDemandeCompte(c)} style={{...S.btn("#FEE2E2","#DC2626"),padding:"6px 12px",fontSize:12}}>✕ Refuser</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(6,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Total",v:clients.length,c:"#334155"},
        {l:"Actifs",v:clientsActifs.length,c:"#334155"},
        {l:"Passifs",v:clients.filter(c=>c.statut==="Passif").length,c:"#334155"},
        {l:"Impayées",v:factures.filter(f=>f.statut==="Impayée").length,c:"#DC2626"},
        {l:"TVA manquante",v:clients.filter(c=>EXPORT_REGIONS.includes(c.region)&&!tvaIntracomValide(c)).length,c:"#DC2626"},
        {l:"Gold / Silver",v:clients.filter(c=>c.categorie_fidelite==="Gold").length+" / "+clients.filter(c=>c.categorie_fidelite==="Silver").length,c:"#334155"},
      ].map((s,i)=>(
        <div key={i} style={{...S.kpi(s.c),borderLeft:s.c==="#DC2626"?"3px solid #DC2626":"1px solid #E3E7ED"}}>
          <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{s.l}</div>
        </div>
      ))}
    </div>
    <div style={{...S.card,marginBottom:12,display:"flex",gap:8,flexWrap:"wrap"}}>
      <input value={searchC} onChange={e=>setSearchC(e.target.value)} placeholder="🔍 Rechercher un client..." style={{...S.input,flex:1,minWidth:160}}/>
      <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        <option value="Tous">Type : Tous</option>
        {["Snack","Restaurant","Café","Market","Administrative","Creche","Distributor","Privé"].map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filterStatut} onChange={e=>setFilterStatut(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        <option value="Tous">Statut : Tous</option>
        <option value="Actif">✅ Actif</option>
        <option value="Passif">⛔ Passif</option>
      </select>
      <select value={filterZone} onChange={e=>setFilterZone(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        <option value="Tous">Zone : Toutes</option>
        {["Centre-ville","Nord","Nord-ouest","Nord-Est","Est","Sud","Sud-ouest","Sud-Est","Ouest","Belgique","France"].map(z=><option key={z} value={z}>{z}</option>)}
      </select>
      <select value={filterFidelite} onChange={e=>setFilterFidelite(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        <option value="Tous">Fidélité : Toutes</option>
        <option value="Gold">🥇 Gold</option>
        <option value="Silver">🥈 Silver</option>
      </select>
      {(filterType!=="Tous"||filterStatut!=="Tous"||filterZone!=="Tous"||filterFidelite!=="Tous"||searchC)&&(
        <button onClick={()=>{setFilterType("Tous");setFilterStatut("Tous");setFilterZone("Tous");setFilterFidelite("Tous");setSearchC("");}}
          style={{...S.btn("#FEE2E2","#DC2626"),padding:"6px 10px",fontSize:12}}>✕ Reset</button>
      )}
      <button onClick={geocoderClientsExistants} disabled={!!geocodingProgress}
        style={{...S.btn("#7C3AED"),padding:"6px 10px",fontSize:12,marginLeft:"auto",opacity:geocodingProgress?0.6:1}}>
        {geocodingProgress ? `📍 ${geocodingProgress.done}/${geocodingProgress.total}...` : "📍 Géolocaliser les clients"}
      </button>
    </div>
    {/* Alphabet quick-filter */}
    <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:10,alignItems:"center"}}>
      {["Tous","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"].map(l=>(
        <button key={l} onClick={()=>setSearchC(l==="Tous"?"":l)}
          style={{...S.btn(searchC.toUpperCase()===l||(!searchC&&l==="Tous")?"#1D4ED8":"#F1F5F9",
            searchC.toUpperCase()===l||(!searchC&&l==="Tous")?"#fff":"#374151"),
            padding:"3px 7px",fontSize:11,minWidth:24,fontWeight:600}}>
          {l}
        </button>
      ))}
      <span style={{fontSize:11,color:"#6B7280",marginLeft:6}}>{filteredClients.length} client(s)</span>
    </div>
    <DataTable
      isMobile={isMobile}
      rows={filteredClients}
      exportName="clients"
      onRowClick={c=>openClientTab(c,"info")}
      emptyIcon="👥"
      emptyMessage={clients.length===0?"Aucun client — clique sur '+ Nouveau client'":"Aucun résultat pour ces filtres"}
      initialSort={{key:"nom",dir:"asc"}}
      columns={[
        {key:"nom", label:"Client", mobilePrimary:true, sortValue:c=>c.nom||"", render:c=>(
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#F1F5F9",color:"#5D6B82",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10.5,flexShrink:0}}>{initials(c.nom)}</div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nom}</div>
              <div style={{fontSize:11,color:"#94A3B8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{c.adresse}</div>
            </div>
          </div>
        )},
        {key:"type", label:"Type", mobileShow:true, sortValue:c=>c.type||"", render:c=><span style={{color:"#475569"}}>{c.type}</span>},
        {key:"region", label:"Zone", mobileShow:true, sortValue:c=>c.region||"", render:c=>c.region||<span style={{color:"#CBD5E1"}}>—</span>},
        {key:"statut", label:"Statut", mobileShow:true, sortValue:c=>c.statut||"", render:c=>(
          <span style={{display:"inline-flex",alignItems:"center",gap:5,color:"#475569"}}>
            <span style={{width:6,height:6,borderRadius:99,background:c.statut==="Actif"?"#22C55E":"#CBD5E1",flexShrink:0}}/>
            {c.statut}
          </span>
        )},
        {key:"fidelite", label:"Fidélité", sortValue:c=>c.categorie_fidelite||"", render:c=>
          c.categorie_fidelite==="Gold" ? <span style={{color:"#92400E"}}>🥇 Gold</span>
          : c.categorie_fidelite==="Silver" ? <span style={{color:"#64748B"}}>🥈 Silver</span>
          : <span style={{color:"#CBD5E1"}}>—</span>
        },
        {key:"impayees", label:"Impayées", align:"right", sortValue:c=>clientImpayees(c.id).length, render:c=>{
          const n = clientImpayees(c.id).length;
          return n>0 ? <span style={{color:"#DC2626",fontWeight:600}}>⚠ {n}</span> : <span style={{color:"#CBD5E1"}}>—</span>;
        }},
        {key:"tva", label:"TVA", mobileShow:true, sortable:false, render:c=>
          EXPORT_REGIONS.includes(c.region)&&!tvaIntracomValide(c)
            ? <span title="Pas de n° TVA intracommunautaire valide — l'exonération 0% n'est pas justifiée" style={{color:"#DC2626",fontWeight:600}}>🧾 Manquante</span>
            : <span style={{color:"#CBD5E1"}}>—</span>
        },
      ]}
    />
  </div>
)}

{/* ══ FACTURES ══════════════════════════════════════════════════ */}
{page==="factures" && !showFactForm && (()=>{
  const today = new Date().toISOString().split("T")[0];
  const moisDispos = ["Tous",...Array.from(new Set(factures.map(f=>f.date?f.date.slice(0,7):"").filter(Boolean))).sort().reverse()];
  const clientsDispos = ["Tous",...[...clients].sort((a,b)=>a.nom.localeCompare(b.nom)).map(c=>c.nom)];

  // Filter
  let ff = factures.filter(f=>{
    const matchStatut = factFilterStatut==="Tous" || f.statut===factFilterStatut;
    const matchSearch = !factFilterSearch || f.client_nom?.toLowerCase().includes(factFilterSearch.toLowerCase()) || String(f.numero||"").toLowerCase().includes(factFilterSearch.toLowerCase());
    const matchMois = factFilterMois==="Tous" || (f.date && f.date.startsWith(factFilterMois));
    const matchClient = !factFilterClient || factFilterClient==="Tous" || 
      f.client_nom===factFilterClient || 
      f.client_nom?.toLowerCase().includes(factFilterClient.toLowerCase());
    const matchFrom = !factFilterDateFrom || (f.date && f.date >= factFilterDateFrom);
    const matchTo = !factFilterDateTo || (f.date && f.date <= factFilterDateTo);
    return matchStatut && matchSearch && matchMois && matchClient && matchFrom && matchTo;
  });

  const totalImpaye = factures.filter(f=>f.statut==="Impayée").reduce((s,f)=>s+resteFact(f),0);
  const totalFiltre = ff.reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).total,0);

  // ── Sélection multiple (actions groupées) ──
  const selFact = ff.filter(f=>factSelected.includes(f.id));
  const selImpayees = selFact.filter(f=>f.statut==="Impayée");
  const selPayees = selFact.filter(f=>f.statut==="Payée");
  const toggleFactRow = (f) => setFactSelected(prev=>prev.includes(f.id)?prev.filter(x=>x!==f.id):[...prev,f.id]);
  const toggleFactAll = (rows) => setFactSelected(prev=>{
    const ids = rows.map(r=>r.id);
    return ids.every(id=>prev.includes(id)) ? prev.filter(id=>!ids.includes(id)) : Array.from(new Set([...prev,...ids]));
  });
  const payerLot = () => {
    if (!selImpayees.length) return;
    setPaiementLot(selImpayees.map(f=>f.id));
    setPaiementFacture({numero:"", client_nom:""});
    setPaiementForm({mode:"", date:new Date().toISOString().split("T")[0]});
    setShowPaiementForm(true);
  };
  const impayeeLot = () => {
    if (!selPayees.length) return;
    askConfirm(`Remettre ${selPayees.length} facture(s) en « Impayée » ?`, async () => {
      setSaving(true);
      try {
        for (const f of selPayees) await db.update("factures", f.id, {statut:"Impayée"});
        setFactSelected([]);
        await loadAll();
      } catch(e) { logError(e); }
      finally { setSaving(false); }
    }, {confirmLabel:"Remettre impayées"});
  };

  // Impression groupée : toutes les factures cochées dans UNE seule fenêtre, une facture par page
  const imprimerLot = () => {
    if (!selFact.length) return;
    const triees = [...selFact].sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")) || String(a.numero||"").localeCompare(String(b.numero||"")));
    const htmls = triees.map((f,k)=>{
      const c = clients.find(x=>x.id===f.client_id);
      // Comptable : copie "propre" de la facture, sans encadrés consignes/impayés (données non accessibles)
      const imp = lectureSeule ? [] : factures.filter(x=>x.client_id===f.client_id&&x.statut==="Impayée"&&x.id!==f.id&&x.numero!==f.numero);
      const detail = lectureSeule ? [] : soldeConsignes(f.client_id);
      const solde = detail.reduce((s,r)=>s+r.solde*r.consigne,0);
      return generatePDF(f, c, imp, solde, detail, {retour:true, qrId:"qrcode"+k});
    });
    ouvrirEtImprimer(assemblerFacturesPDF(htmls), "Factures_selection.html");
  };

  const exportExcel = () => {
    const rows = [["N°","Date","Client","Montant HT","Consignes","Total TTC","Statut","Notes"]];
    (selFact.length ? selFact : ff).forEach(f=>{
      const {prod,cons,total}=totalFact(f.lignes, f.tva_pct);
      rows.push([f.numero,f.date,f.client_nom,prod.toFixed(2),cons.toFixed(2),total.toFixed(2),f.statut,f.notes||""]);
    });
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="factures_bossok.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const dupliquerFacture = (f) => {
    setEditingFacture(null);
    setFactClientId(f.client_id);
    setFactLignes(f.lignes||[]);
    setFactDate(new Date().toISOString().split("T")[0]);
    setFactNotes(f.notes||"");
    setFactNoteClient(clients.find(c=>c.id===f.client_id)?.commentaire_facture || "");
    setFactNumero(genererNumeroFacture(new Date().toISOString().split("T")[0]));
    setSearchFactClient("");
    openWorkTab({id:"facture", type:"facture", label:"Nouvelle facture", page:"factures"});
  };

  return(
  <div>
    {workTabStrip()}
    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Total",v:factures.filter(f=>f.statut!=="Avoir"&&f.statut!=="Annulée").length,c:"#1D4ED8",s:"Tous"},
        {l:"Payées",v:factures.filter(f=>f.statut==="Payée").length,c:"#059669",s:"Payée"},
        {l:"Impayées",v:factures.filter(f=>f.statut==="Impayée").length,c:"#DC2626",s:"Impayée",sub:fmtFull(totalImpaye)},
        {l:"Avoirs",v:factures.filter(f=>f.statut==="Avoir").length,c:"#F59E0B",s:"Avoir"},
      ].map((k,i)=>(
        <div key={i} style={{...S.kpi(k.c),cursor:"pointer",outline:factFilterStatut===k.s?"2px solid "+k.c:"none"}} onClick={()=>{setFactFilterStatut(k.s);setFactFilterDateFrom("");setFactFilterDateTo("");setFactFilterMois("Tous");setFactFilterSearch("");setFactFilterClient("");}}>
          <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:11,color:"#374151",fontWeight:600}}>{k.l}</div>
          {k.sub&&<div style={{fontSize:11,color:k.c,fontWeight:700}}>{k.sub}</div>}
        </div>
      ))}
    </div>

    {/* Filtres */}
    <div style={{...S.card,marginBottom:12}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
        <input value={factFilterSearch} onChange={e=>{setFactFilterSearch(e.target.value);}}
          placeholder="🔍 Rechercher client ou N°..."
          style={{...S.input,flex:1,minWidth:180}}/>
        <select value={factFilterStatut} onChange={e=>{setFactFilterStatut(e.target.value);}}
          style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,background:"#F9FAFB"}}>
          <option value="Tous">Tous les statuts</option>
          <option value="Impayée">⚠ Impayées</option>
          <option value="Payée">✓ Payées</option>
          <option value="Avoir">↩ Avoirs</option>
          <option value="Annulée">✕ Annulées</option>
        </select>
        <select value={factFilterClient} onChange={e=>{setFactFilterClient(e.target.value);}}
          style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,maxWidth:180,background:"#F9FAFB"}}>
          {clientsDispos.map(c=><option key={c} value={c}>{c==="Tous"?"Tous les clients":c}</option>)}
        </select>
        <select value={factFilterMois} onChange={e=>{setFactFilterMois(e.target.value);}}
          style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,background:"#F9FAFB"}}>
          {moisDispos.map(m=><option key={m} value={m}>{m==="Tous"?"Tous les mois":m}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:12,color:"#6B7280",whiteSpace:"nowrap"}}>Du :</label>
          <input type="date" value={factFilterDateFrom} onChange={e=>{setFactFilterDateFrom(e.target.value);}}
            style={{padding:"6px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,background:"#F9FAFB"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:12,color:"#6B7280",whiteSpace:"nowrap"}}>Au :</label>
          <input type="date" value={factFilterDateTo} onChange={e=>{setFactFilterDateTo(e.target.value);}}
            style={{padding:"6px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,background:"#F9FAFB"}}/>
        </div>
        {(factFilterStatut!=="Tous"||factFilterSearch||factFilterMois!=="Tous"||factFilterClient||factFilterDateFrom||factFilterDateTo)&&(
          <button onClick={()=>{setFactFilterStatut("Tous");setFactFilterSearch("");setFactFilterMois("Tous");setFactFilterClient("");setFactFilterDateFrom("");setFactFilterDateTo("");}}
            style={{...S.btn("#F3F4F6","#374151"),padding:"6px 12px",fontSize:12}}>✕ Réinitialiser</button>
        )}
        <button onClick={exportExcel} style={{...S.btn("#059669"),padding:"6px 12px",fontSize:12}}>📥 Export CSV{selFact.length>0?` (${selFact.length} sélection)`:""}</button>
        <span style={{fontSize:12,color:"#6B7280",marginLeft:"auto",fontWeight:600}}>
          {ff.length} résultat(s) · {fmtFull(totalFiltre)}
        </span>
      </div>
    </div>

    {/* Barre d'actions groupées */}
    {selFact.length>0&&(
      <div style={{position:"sticky",top:0,zIndex:40,background:"#1E3A8A",color:"#fff",borderRadius:10,padding:"10px 12px",marginBottom:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",boxShadow:"0 4px 14px rgba(15,23,42,0.25)"}}>
        <span style={{fontSize:13,fontWeight:700}}>{selFact.length} sélectionnée(s) · {fmtFull(selFact.reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).total,0))}</span>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginLeft:"auto"}}>
          {!lectureSeule&&selImpayees.length>0&&<button onClick={payerLot} style={{...S.btn("#059669"),padding:"6px 12px",fontSize:12}}>✓ Marquer payées ({selImpayees.length})</button>}
          {!lectureSeule&&selPayees.length>0&&<button onClick={impayeeLot} style={{...S.btn("#D97706"),padding:"6px 12px",fontSize:12}}>↺ Remettre impayées ({selPayees.length})</button>}
          <button onClick={imprimerLot} style={{...S.btn("#fff","#1E3A8A"),padding:"6px 12px",fontSize:12}}>🖨️ Imprimer PDF ({selFact.length})</button>
          <button onClick={exportExcel} style={{...S.btn("#0EA5E9"),padding:"6px 12px",fontSize:12}}>📥 Export CSV</button>
          <button onClick={()=>setFactSelected([])} style={{...S.btn("#fff","#1E3A8A"),padding:"6px 12px",fontSize:12}}>✕ Désélectionner</button>
        </div>
      </div>
    )}

    {/* Tableau */}
    <DataTable
      isMobile={isMobile}
      rows={ff}
      exportName="factures"
      pageSize={FACT_PER_PAGE}
      selectedIds={factSelected}
      onToggleRow={toggleFactRow}
      onToggleAll={toggleFactAll}
      onRowClick={lectureSeule ? undefined : (f=> f.type_document==="note_credit" ? generatePDF(f, clients.find(x=>x.id===f.client_id), [], 0, []) : openEditFacture(f))}
      emptyIcon="🧾"
      emptyMessage="Aucune facture trouvée"
      initialSort={{key:"date",dir:"desc"}}
      footer={isMobile ? (
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span>Total ({ff.length})</span>
          <span>{fmtFull(totalFiltre)}</span>
        </div>
      ) : (
        <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
          <td colSpan={4} style={{padding:"8px 12px"}}>Total ({ff.length} factures)</td>
          <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(ff.reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).prod,0))}</td>
          <td style={{padding:"8px 12px",textAlign:"right",color:"#7C3AED"}}>{fmtFull(ff.reduce((s,f)=>s+totalFact(f.lignes, f.tva_pct).cons,0))}</td>
          <td style={{padding:"8px 12px",textAlign:"right"}}>{fmtFull(totalFiltre)}</td>
          <td colSpan={2}></td>
        </tr>
      )}
      columns={[
        {key:"numero", label:"N°", mobilePrimary:true, sortValue:f=>String(f.numero||""), render:f=>(
          <span style={{fontWeight:700,color:"#1D4ED8"}}>
            {f.numero}
            {f.notes&&f.notes!=="Import historique"&&<span title={f.notes} style={{marginLeft:4,cursor:"help"}}>💬</span>}
          </span>
        )},
        {key:"date", label:"Date", mobileShow:true, sortValue:f=>f.date||""},
        {key:"client", label:"Client", mobileShow:true, sortValue:f=>f.client_nom||"", render:f=>f.client_nom},
        {key:"montant", label:"Montant HT", align:"right", sortValue:f=>totalFact(f.lignes, f.tva_pct).total, render:f=>fmtFull(totalFact(f.lignes, f.tva_pct).prod)},
        {key:"consignes", label:"Consignes", align:"right", sortable:false, render:f=>{
          const {cons} = totalFact(f.lignes, f.tva_pct);
          return cons>0 ? <span style={{color:"#7C3AED"}}>{fmtFull(cons)}</span> : <span style={{color:"#CBD5E1"}}>—</span>;
        }},
        {key:"total", label:"Total TTC", align:"right", mobileShow:true, sortValue:f=>totalFact(f.lignes, f.tva_pct).total, render:f=>{
          const {total} = totalFact(f.lignes, f.tva_pct);
          const isImp = f.statut==="Impayée";
          const echeanceDepassee = isImp && f.echeance && f.echeance < today;
          return (
            <span style={{fontWeight:700,color:echeanceDepassee?"#DC2626":isImp?"#EF4444":"#0F172A"}}>
              {fmtFull(total)}{echeanceDepassee&&<span title="Échéance dépassée" style={{marginLeft:4,fontSize:10}}>🔴</span>}
              {isImp&&totalPaye(f)>0&&<div style={{fontSize:10,fontWeight:600,color:"#B45309"}}>reste {fmtFull(resteFact(f))}</div>}
            </span>
          );
        }},
        {key:"statut", label:"Statut", mobileShow:true, sortValue:f=>f.statut||"", render:f=>{
          const partiel = f.statut==="Impayée" && totalPaye(f) > 0;
          const sc = f.statut==="Payée"?"#DCFCE7":f.statut==="Avoir"?"#EDE9FE":f.statut==="Annulée"?"#F3F4F6":partiel?"#FEF3C7":"#FEE2E2";
          const st = f.statut==="Payée"?"#166534":f.statut==="Avoir"?"#6D28D9":f.statut==="Annulée"?"#6B7280":partiel?"#B45309":"#DC2626";
          const sl = f.type_document==="note_credit"
            ? ((parseFloat(f.credit_restant)||0) > 0.004 ? "🧾 Crédit dispo " + fmtFull(parseFloat(f.credit_restant)||0) : "🧾 Crédit utilisé")
            : f.statut==="Payée"?"✓ Payée":f.statut==="Avoir"?"↩ Avoir":f.statut==="Annulée"?"✕ Annulée":partiel?"◐ Partiel · reste "+fmtFull(resteFact(f)):"⚠ Impayée";
          return <span style={S.badge(sc,st)}>{sl}</span>;
        }},
        {key:"actions", label:"", sortable:false, render:f=> lectureSeule ? (
          <div onClick={e=>e.stopPropagation()}>
            <button onClick={()=>{const c=clients.find(x=>x.id===f.client_id);generatePDF(f,c,[],0,[]);}}
              style={{...S.btn("#F3F4F6","#374151"),padding:"4px 10px",fontSize:12,fontWeight:600}}>🖨️ PDF</button>
          </div>
        ) : (
          <div style={{position:"relative",display:"inline-block"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setOpenFactureMenu(openFactureMenu===f.id?null:f.id)}
              style={{...S.btn("#F3F4F6","#374151"),padding:"4px 10px",fontSize:14,fontWeight:700}}>⋯</button>
            {openFactureMenu===f.id&&(
              <>
                <div onClick={()=>setOpenFactureMenu(null)} style={{position:"fixed",inset:0,zIndex:250}}/>
                <div style={{position:"absolute",right:0,top:"100%",marginTop:4,background:"#fff",border:"1px solid #E5E7EB",borderRadius:10,boxShadow:"0 12px 32px rgba(15,23,42,0.18)",zIndex:260,minWidth:200,overflow:"hidden"}}>
                  {f.statut==="Impayée"&&(
                    <button onClick={()=>{setOpenFactureMenu(null);setPaiementFacture(f);setPaiementForm({mode:"",date:new Date().toISOString().split("T")[0]});setShowPaiementForm(true);}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#059669"}}>✓ Marquer Payée</button>
                  )}
                  {f.statut==="Impayée"&&(()=>{
                    const cl = clients.find(c=>c.id===f.client_id);
                    const total = resteFact(f);
                    return (
                      <>
                        <button onClick={()=>{setOpenFactureMenu(null);relancerWhatsApp(f,cl,total);}}
                          className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#22C55E"}}>💬 Relancer par WhatsApp</button>
                        <button onClick={()=>{setOpenFactureMenu(null);relancerSMS(f,cl,total);}}
                          className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#374151"}}>📱 Relancer par SMS</button>
                        <button onClick={()=>{setOpenFactureMenu(null);relancerEmail(f,cl,total);}}
                          className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#374151"}}>✉️ Relancer par Email</button>
                      </>
                    );
                  })()}
                  {f.statut==="Payée"&&(
                    <button onClick={()=>{setOpenFactureMenu(null);marquerImpayee(f.id);}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#D97706"}}>↺ Remettre Impayée</button>
                  )}
                  {f.statut==="Payée"&&(
                    <button onClick={()=>{setOpenFactureMenu(null);setPaiementFacture(f);setPaiementForm({mode:f.mode_paiement||"",date:f.date_paiement||f.date});setShowPaiementForm(true);}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#374151"}}>💰 {f.mode_paiement?"Mode : "+f.mode_paiement:"Assigner un mode"}</button>
                  )}
                  <button onClick={()=>{setOpenFactureMenu(null);openEditFacture(f);}}
                    className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#1D4ED8"}}>✏️ Modifier</button>
                  <button onClick={()=>{setOpenFactureMenu(null);dupliquerFacture(f);}}
                    className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#0EA5E9"}}>📋 Dupliquer</button>
                  <button onClick={()=>{setOpenFactureMenu(null);const c=clients.find(x=>x.id===f.client_id);const imp=factures.filter(x=>x.client_id===f.client_id&&x.statut==="Impayée"&&x.id!==f.id&&x.numero!==f.numero);const solde=soldeConsignes(f.client_id).reduce((s,r)=>s+r.solde*r.consigne,0);generatePDF(f,c,imp,solde,soldeConsignes(f.client_id));}}
                    className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#374151"}}>🖨️ Imprimer PDF</button>
                  {f.statut==="Impayée"&&(
                    <button onClick={()=>{setOpenFactureMenu(null);setPpModal({facture:f,montant:"",date:new Date().toISOString().split("T")[0],mode:""});}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#B45309"}}>💶 Paiement partiel</button>
                  )}
                  {f.statut==="Impayée"&&creditsDisponibles(f.client_id).length>0&&(
                    <button onClick={()=>{setOpenFactureMenu(null);const dispo=creditsDisponibles(f.client_id);const du=totalFact(f.lignes,f.tva_pct).total;setNcModal({mode:"apply",facture:f,ncId:dispo[0].id,montant:String(Math.min(parseFloat(dispo[0].credit_restant)||0,du).toFixed(2))});}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#6D28D9"}}>🧾 Appliquer une note de crédit</button>
                  )}
                  {(f.statut==="Impayée"||f.statut==="Payée")&&(
                    <button onClick={()=>{setOpenFactureMenu(null);setNcModal({mode:"create",clientId:f.client_id,factureNumero:f.numero,factureTotal:totalFact(f.lignes,f.tva_pct).total,recu:"",montant:"",motif:"Trop-perçu sur la facture "+f.numero});}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#6D28D9"}}>🧾 Créer une note de crédit</button>
                  )}
                  {(f.statut==="Impayée"||f.statut==="Payée")&&(
                    <button onClick={()=>{setOpenFactureMenu(null);creerAvoir(f);}}
                      className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#8B5CF6"}}>↩️ Créer un avoir</button>
                  )}
                  <div style={{borderTop:"1px solid #F1F5F9"}}/>
                  <button onClick={()=>{setOpenFactureMenu(null);supprimerFacture(f.id,f.numero);}}
                    className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#EF4444"}}>🗑️ Supprimer</button>
                </div>
              </>
            )}
          </div>
        )},
      ]}
    />
  </div>
  );
}
)()}
{/* ══ COMMANDES ══════════════════════════════════════════════════ */}
{page==="commandes" && showCmdForm && (
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14}}>{editingCmd?"✏️ Modifier la commande":"➕ Nouvelle commande"}</div>
        {editingCmd&&<button onClick={()=>{setEditingCmd(null);setCmdClientId(null);setCmdProduits([]);setCmdNotes("");}} style={{...S.btn("#F3F4F6","#374151"),padding:"4px 10px",fontSize:11}}>✕ Annuler la modification</button>}
      </div>

      {/* CLIENT - liste déroulante */}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Client *</label>
        {cmdClientId ? (
          <ClientSelected
            cl={clients.find(c=>c.id===cmdClientId)}
            lastCmd={[...commandes].sort((a,b)=>b.id-a.id).find(c=>c.client_id===cmdClientId)}
            cmdProduits={cmdProduits}
            onClear={()=>{setCmdClientId(null);setSearchCmdClient("");setCmdProduits([]);}}
            onRepeat={(prods)=>setCmdProduits(prods)}
            S={S} getChauffeur={getChauffeur}
          />
        ):(
          <div style={{position:"relative"}}>
            <input value={searchCmdClient} 
              onChange={e=>setSearchCmdClient(e.target.value)}
              onFocus={e=>{ if(!searchCmdClient) setSearchCmdClient(" "); }}
              onBlur={e=>{ setTimeout(()=>setSearchCmdClient(""), 200); }}
              placeholder="🔍 Cliquer ou taper pour rechercher..."
              style={S.input}/>
            {searchCmdClient&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:50,maxHeight:250,overflowY:"auto"}}>
                {clientsActifs
                  .filter(c=>searchCmdClient.trim()===""||c.nom?.toLowerCase().includes(searchCmdClient.trim().toLowerCase()))
                  .sort((a,b)=>a.nom.localeCompare(b.nom))
                  .map(c=>(
                  <div key={c.id} onMouseDown={()=>{setCmdClientId(c.id);setSearchCmdClient("");if(!editingCmd&&!cmdNotes)setCmdNotes(c.commentaire_bl||"");}}
                    style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#F0F9FF"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div>
                      <div style={{fontWeight:500}}>{c.nom}</div>
                      <div style={{fontSize:10,color:"#9CA3AF"}}>{c.region} · {c.type}</div>
                    </div>
                    <span style={S.badge("#DBEAFE","#1D4ED8")}>Ch. {getChauffeur(c.region, c.pays)}</span>
                  </div>
                ))}
                {clientsActifs.filter(c=>c.nom?.toLowerCase().includes(searchCmdClient.trim().toLowerCase())).length===0&&(
                  <div style={{padding:"12px",fontSize:12,color:"#9CA3AF",textAlign:"center"}}>Aucun client trouvé</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRODUITS - grille rapide */}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:6}}>Produits * <span style={{color:"#9CA3AF"}}>(entrez les quantités — 🎁 = nombre offert gratuit sur la quantité)</span></label>
        
        {/* Grouped by category */}
        {/* Catégories dans l'ordre défini par la colonne "ordre" des produits
            (canettes, bouteilles, eaux... — réglable depuis Catalogue produits),
            pas alphabétique. */}
        {[...new Set(produits.filter(p=>p.statut!=="Passif").map(p=>p.categorie))].map(cat=>{
          const prods = produits.filter(p=>p.categorie===cat&&p.statut!=="Passif");
          return(
            <div key={cat} style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4,padding:"2px 0",borderBottom:"1px solid #F1F5F9"}}>{cat}</div>
              <div style={{display:"grid",gap:3}}>
                {prods.map(p=>{
                  const existing = cmdProduits.find(x=>x.nom===p.nom);
                  const qte = existing?.qte || 0;
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 6px",borderRadius:6,background:qte>0?"#EFF6FF":"transparent"}}>
                      <span style={{flex:1,fontSize:11,color:qte>0?"#1D4ED8":"#374151",fontWeight:qte>0?600:400}}>{p.nom}</span>
                      {p.type_emballage==="VC"&&<span style={{fontSize:9,color:"#7C3AED",background:"#F5F3FF",padding:"1px 4px",borderRadius:3}}>VC</span>}
                      <div style={{display:"flex",alignItems:"center",gap:3}}>
                        <button onClick={()=>{
                          if(qte<=0) return;
                          if(qte===1) setCmdProduits(prev=>prev.filter(x=>x.nom!==p.nom));
                          else setCmdProduits(prev=>prev.map(x=>x.nom===p.nom?{...x,qte:x.qte-1}:x));
                        }} style={{width:22,height:22,border:"1px solid #E5E7EB",borderRadius:4,background:qte>0?"#DBEAFE":"#F9FAFB",cursor:"pointer",fontSize:12,fontWeight:700,color:qte>0?"#1D4ED8":"#9CA3AF",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                        <input type="number" min="0" value={qte||""} placeholder="0"
                          onChange={e=>{
                            const v=parseInt(e.target.value)||0;
                            if(v===0) setCmdProduits(prev=>prev.filter(x=>x.nom!==p.nom));
                            else if(existing) setCmdProduits(prev=>prev.map(x=>x.nom===p.nom?{...x,qte:v}:x));
                            else setCmdProduits(prev=>[...prev,{nom:p.nom,qte:v}]);
                          }}
                          style={{width:36,textAlign:"center",padding:"2px 0",border:"1px solid #E5E7EB",borderRadius:4,fontSize:11,outline:"none",background:qte>0?"#EFF6FF":"#fff",color:qte>0?"#1D4ED8":"#374151",fontWeight:qte>0?700:400}}/>
                        <button onClick={()=>{
                          if(existing) setCmdProduits(prev=>prev.map(x=>x.nom===p.nom?{...x,qte:x.qte+1}:x));
                          else setCmdProduits(prev=>[...prev,{nom:p.nom,qte:1}]);
                        }} style={{width:22,height:22,border:"1px solid #E5E7EB",borderRadius:4,background:"#F0FDF4",cursor:"pointer",fontSize:12,fontWeight:700,color:"#16A34A",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      </div>
                      {qte>0&&(
                        <div style={{display:"flex",alignItems:"center",gap:3}} title="Nombre offert (gratuit) sur cette quantité">
                          <span style={{fontSize:11}}>🎁</span>
                          <input type="number" min="0" max={qte} value={existing?.qteOfferte||""} placeholder="0"
                            onChange={e=>{
                              let v=parseInt(e.target.value)||0;
                              if(v<0) v=0; if(v>qte) v=qte;
                              setCmdProduits(prev=>prev.map(x=>x.nom===p.nom?{...x,qteOfferte:v||undefined}:x));
                            }}
                            style={{width:30,textAlign:"center",padding:"2px 0",border:"1px solid #FDE68A",borderRadius:4,fontSize:11,outline:"none",background:existing?.qteOfferte?"#FFFBEB":"#fff",color:"#B45309",fontWeight:existing?.qteOfferte?700:400}}/>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Summary */}
        {cmdProduits.length>0&&(
          <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:8,padding:"8px 10px",marginTop:8}}>
            <div style={{fontSize:11,fontWeight:600,color:"#166534",marginBottom:4}}>
              📦 {cmdProduits.reduce((s,p)=>s+p.qte,0)} caisses sélectionnées :
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {cmdProduits.map((p,i)=>(
                <span key={i} style={{fontSize:10,background:"#DCFCE7",color:"#166534",padding:"2px 6px",borderRadius:4,fontWeight:500}}>
                  {p.nom} ×{p.qte}{p.qteOfferte>0?` (dont ${p.qteOfferte} 🎁 offert${p.qteOfferte>1?"s":""})`:""}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{marginBottom:12}}>
        <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:6}}>♻️ Consigne manuelle <span style={{color:"#D1D5DB"}}>(optionnel)</span></label>
        {manualConsigneLignesCmd.length>0 && (
          <div style={{display:"grid",gap:8,marginBottom:8}}>
            {manualConsigneLignesCmd.map((l,i)=>{
              const montant = (parseFloat(l.qte)||0)*prixConsigne(l.unitaire)*(l.sens==="retour"?-1:1);
              return (
                <div key={i} style={{background:"#F8FAFC",border:"1px solid #E3E7ED",borderRadius:8,padding:10}}>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto",gap:6,marginBottom:6}}>
                    <input value={l.label} onChange={e=>setManualConsigneLignesCmd(prev=>prev.map((x,xi)=>xi===i?{...x,label:e.target.value}:x))}
                      placeholder="Libellé (ex: Coca VC)" style={{...S.input,padding:"7px 9px",fontSize:13}}/>
                    <button onClick={()=>setManualConsigneLignesCmd(prev=>prev.filter((_,xi)=>xi!==i))}
                      style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",padding:"4px 8px",display:"flex",alignItems:"center",justifySelf:isMobile?"end":"auto"}}>
                      <Icon name="close" size={14}/>
                    </button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"0.8fr 1.3fr 1fr",gap:6}}>
                    <input type="number" min="1" value={l.qte} placeholder="Quantité"
                      onChange={e=>setManualConsigneLignesCmd(prev=>prev.map((x,xi)=>xi===i?{...x,qte:e.target.value}:x))}
                      style={{...S.input,padding:"7px 9px",fontSize:13}}/>
                    <select value={l.unitaire} onChange={e=>setManualConsigneLignesCmd(prev=>prev.map((x,xi)=>xi===i?{...x,unitaire:e.target.value}:x))}
                      style={{...S.input,padding:"7px 9px",fontSize:13}}>
                      <option value="">— Consigne unitaire —</option>
                      {Object.entries(CONSIGNE_PRIX).map(([taille,prix])=>(
                        <option key={taille} value={taille}>{taille} — {prix.toFixed(2)} €</option>
                      ))}
                    </select>
                    <select value={l.sens} onChange={e=>setManualConsigneLignesCmd(prev=>prev.map((x,xi)=>xi===i?{...x,sens:e.target.value}:x))}
                      style={{...S.input,padding:"7px 9px",fontSize:13}}>
                      <option value="plus">+ Consigne</option>
                      <option value="retour">− Retour</option>
                    </select>
                  </div>
                  {montant!==0 && (
                    <div style={{fontSize:12,fontWeight:600,color:montant<0?"#DC2626":"#7C3AED",marginTop:5}}>
                      {montant<0?"Retour":"Ajout"} : {fmtFull(Math.abs(montant))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <button onClick={()=>setManualConsigneLignesCmd(prev=>[...prev,{label:"",qte:"1",unitaire:"",sens:"plus"}])}
          style={{...S.btn("#F5F3FF","#7C3AED"),width:"100%",padding:"8px",fontSize:12,fontWeight:600}}>
          + Ajouter une autre consigne
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
          <textarea value={cmdNotes} onChange={e=>setCmdNotes(e.target.value)} placeholder="Instructions spéciales..." rows={3}
            style={{...S.input,resize:"vertical",fontFamily:"inherit"}}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>🚚 Transport <span style={{color:"#9CA3AF"}}>(optionnel — TVA {TVA_TRANSPORT_PCT}%)</span></label>
          <input type="number" min="0" step="0.01" value={cmdTransport} onChange={e=>setCmdTransport(e.target.value)} placeholder="Laisser vide si aucun" style={S.input}/>
        </div>
      </div>

      <button onClick={saveCmd} disabled={saving}
        style={{...S.btn(),width:"100%",opacity:saving?0.6:1,fontSize:13}}>
        {saving?"Sauvegarde...":editingCmd?"💾 Enregistrer modifications":`✅ Enregistrer la commande${cmdProduits.length>0?` (${cmdProduits.reduce((s,p)=>s+p.qte,0)} caisses)`:""}`}
      </button>
    </div>
  </div>
)}

{/* ══ LISTE DES COMMANDES ══════════════════════════════════════ */}
{page==="commandes" && !showCmdForm && (
  <div>
    {workTabStrip()}
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
      {[["attente","⏳ En attente",commandes.filter(c=>c.statut==="En attente").length],
        ["livrees","✅ Livrées",commandes.filter(c=>c.statut==="Livré").length],
        ["web","🌐 Commandes en ligne",commandes.filter(c=>c.source==="web").length],
        ["toutes","📋 Toutes",commandes.length]
      ].map(([k,l,n])=>(
        <button key={k} onClick={()=>setCmdView(k)}
          style={{...S.btn(cmdView===k?"#1D4ED8":"#F1F5F9",cmdView===k?"#fff":"#374151"),padding:"6px 14px",fontSize:12,fontWeight:cmdView===k?700:400}}>
          {l} ({n})
        </button>
      ))}
    </div>
    {(()=>{
      const cmdList = cmdView==="attente"
        ? commandes.filter(c=>c.statut==="En attente")
        : cmdView==="livrees"
        ? [...commandes].filter(c=>c.statut==="Livré")
        : cmdView==="web"
        ? commandes.filter(c=>c.source==="web")
        : [...commandes];
      return (
        <DataTable
          isMobile={isMobile}
          rows={cmdList}
          exportName="commandes"
          pageSize={50}
          onRowClick={c=>openEditCmd(c)}
          emptyIcon="📋"
          emptyMessage="Aucune commande"
          initialSort={{key:"date",dir:"desc"}}
          columns={[
            {key:"client", label:"Client", mobilePrimary:true, sortValue:c=>c.client_nom||"", render:c=>(
              <div>
                <div style={{fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                  {c.client_nom}
                  {c.source==="web"&&(
                    <span title="Commande passée depuis le portail client" style={{background:"#EFF6FF",color:"#1D4ED8",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99,flexShrink:0}}>🌐 Web</span>
                  )}
                </div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{c.client_adresse}</div>
              </div>
            )},
            {key:"chauffeur", label:"Chauffeur", mobileShow:true, sortValue:c=>c.chauffeur||"", render:c=>c.chauffeur==="A"?"Sefa":"Mikail"},
            {key:"jour", label:"Jour livraison", sortValue:c=>c.jour_livraison||"", render:c=>c.jour_livraison||<span style={{color:"#CBD5E1"}}>—</span>},
            {key:"date", label:"Date", mobileShow:true, sortValue:c=>c.date_commande||""},
            {key:"produits", label:"Produits", sortable:false, wrap:true, render:c=>(
              <div style={{display:"flex",flexWrap:"wrap",gap:4,maxWidth:280}}>
                {(c.produits||[]).map((p,i)=>(
                  <span key={i} style={{background:"#F1F5F9",padding:"1px 6px",borderRadius:4,fontSize:10}}>{p.nom} ×{p.qte}</span>
                ))}
              </div>
            )},
            {key:"statut", label:"Statut", mobileShow:true, sortValue:c=>c.statut||"", render:c=>(
              <span style={{display:"inline-flex",alignItems:"center",gap:5,color:"#475569"}}>
                <span style={{width:6,height:6,borderRadius:99,background:c.statut==="Livré"?"#22C55E":"#F59E0B",flexShrink:0}}/>
                {c.statut}
              </span>
            )},
            {key:"actions", label:"", sortable:false, render:c=>(
              <div style={{position:"relative",display:"inline-block"}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setOpenCmdMenu(openCmdMenu===c.id?null:c.id)}
                  style={{...S.btn("#F3F4F6","#374151"),padding:"4px 10px",fontSize:14,fontWeight:700}}>⋯</button>
                {openCmdMenu===c.id&&(
                  <>
                    <div onClick={()=>setOpenCmdMenu(null)} style={{position:"fixed",inset:0,zIndex:250}}/>
                    <div style={{position:"absolute",right:0,top:"100%",marginTop:4,background:"#fff",border:"1px solid #E5E7EB",borderRadius:10,boxShadow:"0 12px 32px rgba(15,23,42,0.18)",zIndex:260,minWidth:200,overflow:"hidden"}}>
                      {c.statut!=="Livré"&&(
                        <button onClick={()=>{setOpenCmdMenu(null);marquerLivre(c.id);}}
                          className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#059669"}}>✓ Marquer livré</button>
                      )}
                      <button onClick={()=>{setOpenCmdMenu(null);imprimerFactureCommande(c);}}
                        className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#374151"}}>🖨️ Imprimer facture</button>
                      <button onClick={()=>{setOpenCmdMenu(null);imprimerBonLivraison(c);}}
                        className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#7C3AED"}}>📦 Bon de livraison</button>
                      <button onClick={()=>{setOpenCmdMenu(null);openEditCmd(c);}}
                        className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#1D4ED8"}}>✏️ Modifier</button>
                      <button onClick={()=>{setOpenCmdMenu(null);dupliquerCommande(c);}}
                        className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#0EA5E9"}}>📋 Dupliquer</button>
                      {c.statut!=="Livré"&&(
                        <>
                          <div style={{borderTop:"1px solid #F1F5F9"}}/>
                          <button onClick={()=>{setOpenCmdMenu(null);supprimerCommande(c.id);}}
                            className="menu-item" style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 14px",background:"none",border:"none",textAlign:"left",fontSize:13,cursor:"pointer",color:"#EF4444"}}>🗑️ Supprimer</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )},
          ]}
        />
      );
    })()}
  </div>
)}

{/* ══ PLANNING ══════════════════════════════════════════════════ */}
{page==="planning" && (()=>{
  const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
  const today = new Date();
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayDow + planningWeekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4);
  const isCurrentWeek = planningWeekOffset === 0;
  const isPastWeek = planningWeekOffset < 0;
  const weekLabel = planningWeekOffset === 0 ? "Semaine courante" :
    planningWeekOffset === -1 ? "Semaine dernière" :
    planningWeekOffset === 1 ? "Semaine prochaine" :
    `Semaine du ${weekStart.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit'})}`;

  const getWeekDate = (dayIdx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dayIdx);
    return d.toLocaleDateString('fr-LU', {day:'2-digit', month:'2-digit'});
  };
  const getDayDate = (dayIdx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + dayIdx);
    return localDateStr(d);
  };

  const selectedDate = getDayDate(selectedDay);

  const zonesFor = (i) => {
    const z = DAILY_ZONES[i] || {A:[],B:[]};
    return { A: z.A||[], B: z.B||[] };
  };
  const driverOfCmd = (c,i) => {
    const z = zonesFor(i);
    if (z.A.includes(c.client_region)) return 'A';
    if (z.B.includes(c.client_region)) return 'B';
    if (c.chauffeur==='A'||c.chauffeur==='B') return c.chauffeur;
    return c.client_region ? getChauffeur(c.client_region) : null;
  };
  // Jour (0-4) où une commande non datée est planifiée : 1er jour de sa zone à partir d'aujourd'hui
  const pendingDayIdx = (c) => {
    if (planningWeekOffset !== 0) return -1;
    if (!c.client_region) return todayDow<=4?todayDow:0;
    for (let i=Math.min(todayDow,4); i<5; i++){ const z=zonesFor(i); if([...z.A,...z.B].includes(c.client_region)) return i; }
    for (let i=0;i<5;i++){ const z=zonesFor(i); if([...z.A,...z.B].includes(c.client_region)) return i; }
    return -1;
  };
  const cmdsForDayIdx = (i) => {
    const dDate = getDayDate(i);
    if (isPastWeek) return commandes.filter(c=>c.statut==='Livré' && (c.date_livraison===dDate || (!c.date_livraison && c.jour_livraison===days[i])));
    return commandes.filter(c=>{
      if (c.date_livraison) return c.date_livraison===dDate;
      if (c.statut==='Livré') return false;
      return pendingDayIdx(c)===i;
    });
  };

  // ── Clients "attendus" d'après leur fréquence de commande historique ──
  const DAY_MS = 86400000;
  const toT = (str)=>new Date(String(str).slice(0,10)+"T12:00:00").getTime();
  const predByDay = {0:[],1:[],2:[],3:[],4:[]};
  if (!isPastWeek) {
    const hist = {};
    commandes.forEach(c=>{
      if(!c.client_id) return;
      const d = c.date_livraison || c.date_commande; if(!d) return;
      (hist[c.client_id] = hist[c.client_id] || []).push(String(d).slice(0,10));
    });
    const enCours = new Set(commandes.filter(c=>c.statut!=='Livré').map(c=>c.client_id));
    const dejaSemaine = new Set();
    for (let i=0;i<5;i++) cmdsForDayIdx(i).forEach(c=>dejaSemaine.add(c.client_id));
    clients.forEach(cl=>{
      if (cl.statut!=="Actif" || !cl.region) return;
      if (cl.pays && cl.pays!=="Luxembourg") return; // Luxembourg uniquement
      if (enCours.has(cl.id) || dejaSemaine.has(cl.id)) return;
      const ds = [...new Set([...(hist[cl.id]||[]), ...String(HISTORIQUE_CMD_MAI_AOUT[normNomClient(cl.nom)]||"").split(",").filter(Boolean)])].sort();
      if (ds.length<3) return;
      const ints=[]; for(let k=1;k<ds.length;k++) ints.push((toT(ds[k])-toT(ds[k-1]))/DAY_MS);
      const rec = ints.slice(-6).sort((a,b)=>a-b);
      const med = rec.length%2 ? rec[(rec.length-1)/2] : (rec[rec.length/2-1]+rec[rec.length/2])/2;
      if (med>PLANNING_FREQ_MAX) return;
      const last = ds[ds.length-1];
      if ((Date.now()-toT(last))/DAY_MS > Math.max(60, med*4)) return; // client probablement perdu
      const nextT = toT(last) + Math.max(1,Math.round(med))*DAY_MS;
      for (let i=0;i<5;i++){
        if (planningWeekOffset===0 && i<todayDow) continue;
        const z = zonesFor(i);
        const drv = z.A.includes(cl.region)?'A':z.B.includes(cl.region)?'B':null;
        if (!drv) continue;
        const dT = toT(getDayDate(i));
        if (dT >= nextT - DAY_MS) {
          predByDay[i].push({client:cl, drv, med:Math.round(med), last, retard:Math.round((dT-nextT)/DAY_MS)});
          break;
        }
      }
    });
  }

  const getCmdMontant = (cmd) => {
    const fact = findFactureForCommande(cmd.id);
    return fact ? totalFact(fact.lignes, fact.tva_pct).total : null;
  };

  const dayCommandes = cmdsForDayIdx(selectedDay);

  const buildSchedule = (driver) => {
    if (isPastWeek) {
      const driverCmds = dayCommandes.filter(c => c.chauffeur === driver || getChauffeur(c.client_region) === driver);
      return { schedule: driverCmds, retDist: 0, totalKm: 0 };
    }
    const zones = zonesFor(selectedDay);
    const driverZones = zones[driver] || [];
    const driverCmds = dayCommandes.filter(c => driverOfCmd(c,selectedDay) === driver);

    // Tournée optimisée : ordre des arrêts qui minimise les km (Held-Karp exact ≤11 arrêts,
    // sinon heuristique 2-opt), distances routières exactes si la matrice est calculée,
    // découpe en rotations si la charge dépasse la capacité du camion.
    const clientById = {}; clients.forEach(c=>{ clientById[c.id]=c; });
    const keyOfCmd = (cmd) => { const cl = clientById[cmd.client_id]; return (cl && cl.lat!=null && cl.lng!=null) ? String(cl.id) : "z:"+(cmd.client_region||"?"); };
    const coordsOfKey = (key, cmd) => {
      if (key==="depot") return DEPOT;
      if (key.startsWith("z:")) return REGION_COORDS[key.slice(2)] || DEPOT;
      const cl = clientById[key]; return cl ? {lat:Number(cl.lat), lng:Number(cl.lng)} : DEPOT;
    };
    const legInfo = (ka, kb) => {
      if (ka===kb) return {km:0, min:0, exact:true};
      const m = matriceDist?.[ka]?.[kb];
      if (m) return {km:m[0], min:m[1], exact:true};
      const km = distKm(coordsOfKey(ka), coordsOfKey(kb)) * 1.3;
      return {km, min:km/45*60, exact:false};
    };
    const items = driverCmds.map(c=>({cmd:c, key:keyOfCmd(c), charge:(c.produits||[]).reduce((t,p)=>t+(p.qte||0),0)}));
    const rots = optimiserTournee(items, (a,b)=>legInfo(a,b).km);
    let schedule = [], totalKm = 0, totalMin = 0, retDist = 0, exactAll = true; const rotInfo = [];
    rots.forEach((idxs,ri)=>{
      let prev = "depot", rKm = 0, rCharge = 0;
      idxs.forEach(k=>{
        const it = items[k], leg = legInfo(prev, it.key);
        rKm += leg.km; totalMin += leg.min; if (!leg.exact) exactAll = false; rCharge += it.charge;
        schedule.push({...it.cmd, dist:Math.round(leg.km*10)/10, isCv: it.cmd.client_region==='Centre-ville', rot:ri, exact:leg.exact});
        prev = it.key;
      });
      const back = legInfo(prev, "depot"); rKm += back.km; totalMin += back.min; if (!back.exact) exactAll = false;
      retDist = Math.round(back.km*10)/10; totalKm += rKm;
      rotInfo.push({n:idxs.length, km:Math.round(rKm*10)/10, charge:rCharge});
    });
    totalKm = Math.round(totalKm*10)/10;
    totalMin += schedule.length*STOP_TIME;
    const dureeTxt = schedule.length ? `${Math.floor(totalMin/60)}h${String(Math.round(totalMin%60)).padStart(2,"0")}` : "";

    return { schedule, retDist, totalKm, rotInfo, exactAll, dureeTxt };
  };

  const scheduleA = buildSchedule('A');
  const scheduleB = buildSchedule('B');
  const totalCaisses = dayCommandes.reduce((s,c)=>s+(c.produits||[]).reduce((ss,p)=>ss+p.qte,0),0);
  const totalCA = isPastWeek ? dayCommandes.reduce((s,c)=>s+(getCmdMontant(c)||0),0) : 0;

  // ── Vue semaine : noms des clients par jour et par chauffeur ──
  const weekTotalCmds = days.reduce((t,_,i)=>t+cmdsForDayIdx(i).length,0);
  const weekTotalPred = days.reduce((t,_,i)=>t+predByDay[i].length,0);
  const fmtShort = (str)=>{ const d=new Date(String(str).slice(0,10)+"T12:00:00"); return d.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit'}); };
  const weekView = (
    <div>
      <div style={{fontSize:11,color:"#6B7280",marginBottom:10,lineHeight:1.5}}>
        {isPastWeek
          ? `${weekTotalCmds} livraison(s) effectuée(s) cette semaine.`
          : <>{weekTotalCmds} commande(s) enregistrée(s) · <b>{weekTotalPred} client(s) attendu(s)</b> d'après leur fréquence de commande habituelle.
</>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,minmax(0,1fr))",gap:10,alignItems:"start"}}>
        {days.map((day,i)=>{
          const list = cmdsForDayIdx(i);
          const preds = predByDay[i];
          const z = zonesFor(i);
          const zonesLabel = [...z.A,...z.B].filter(r=>r!=="Nord-est").join(" · ");
          const groups = [
            {k:'A',name:'Sefa',col:'#0EA5E9',bg:'#E0F2FE'},
            {k:'B',name:'Mikail',col:'#8B5CF6',bg:'#EDE9FE'},
            {k:null,name:'Sans zone',col:'#9CA3AF',bg:'#F3F4F6'},
          ].map(g=>({...g,
            cmds:list.filter(c=>driverOfCmd(c,i)===g.k).sort((a,b)=>(a.client_region||"").localeCompare(b.client_region||"")||(a.client_nom||"").localeCompare(b.client_nom||"")),
            preds:preds.filter(p=>p.drv===g.k).sort((a,b)=>(a.client.region||"").localeCompare(b.client.region||"")||(a.client.nom||"").localeCompare(b.client.nom||"")),
          })).filter(g=>g.cmds.length+g.preds.length>0);
          const isToday = i===todayDow && isCurrentWeek;
          return (
            <div key={i} style={{...S.card,padding:10,borderTop:"4px solid "+(isToday?"#1D4ED8":"#E5E7EB"),background:isToday?"#F8FBFF":"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                <div style={{fontWeight:800,fontSize:14,color:isToday?"#1D4ED8":"#111827"}}>{day}</div>
                <div style={{fontSize:11,color:"#9CA3AF"}}>{getWeekDate(i)}</div>
              </div>
              <div style={{fontSize:10,color:"#6B7280",marginBottom:2,minHeight:14}}>{zonesLabel||"Pas de tournée"}</div>
              <div style={{fontSize:10,color:"#9CA3AF",marginBottom:8}}>
                {list.length} {isPastWeek?"livraison":"commande"}{list.length>1?"s":""}{preds.length>0?` · ${preds.length} attendu${preds.length>1?"s":""}`:""}
              </div>
              {groups.length===0 && <div style={{fontSize:11,color:"#9CA3AF",textAlign:"center",padding:"14px 0"}}>Rien de prévu</div>}
              {groups.map(g=>(
                <div key={String(g.k)} style={{marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:700,color:g.col,background:g.bg,padding:"2px 6px",borderRadius:4,marginBottom:4}}>
                    🚚 {g.name} · {g.cmds.length+g.preds.length}
                  </div>
                  {g.cmds.map(c=>{
                    const caisses=(c.produits||[]).reduce((t,p)=>t+(p.qte||0),0);
                    return (
                      <div key={c.id} onClick={()=>{setSelectedDay(i);setPlanningView("jour");}}
                        style={{padding:"4px 6px",borderBottom:"1px solid #F3F4F6",cursor:"pointer"}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#111827",display:"flex",justifyContent:"space-between",gap:6}}>
                          <span>{c.statut==='Livré'?"✅ ":""}{c.client_nom}</span>
                          <span style={{fontSize:10,color:"#6B7280",fontWeight:500,whiteSpace:"nowrap"}}>📦 {caisses}</span>
                        </div>
                        <div style={{fontSize:10,color:"#9CA3AF"}}>{c.client_region||"—"}</div>
                      </div>
                    );
                  })}
                  {g.preds.map(p=>(
                    <div key={"p"+p.client.id} style={{padding:"4px 6px",margin:"3px 0",border:"1px dashed #CBD5E1",borderRadius:6,background:"#FAFAFA"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#475569"}}>🔄 {p.client.nom}</div>
                      <div style={{fontSize:10,color:"#94A3B8"}}>
                        {p.client.region} · ~tous les {p.med} j · dernière {fmtShort(p.last)}
                        {p.retard>=3&&<span style={{color:"#D97706",fontWeight:600}}> · en retard</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {!isPastWeek && <div style={{fontSize:10,color:"#9CA3AF",marginTop:8}}>🔄 = client attendu (pas encore de commande) : calculé sur sa fréquence médiane de commande et sa dernière commande. Seuls les clients actifs avec ≥3 commandes et une fréquence ≤{PLANNING_FREQ_MAX} jours sont proposés.</div>}
    </div>
  );

  return(
  <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,...S.card,padding:"10px 16px"}}>
      <button onClick={()=>setPlanningWeekOffset(w=>w-1)}
        style={{...S.btn("#F1F5F9","#374151"),padding:"6px 14px",fontSize:13}}>‹ Semaine préc.</button>
      <div style={{textAlign:"center"}}>
        <div style={{fontWeight:700,fontSize:14,color:isPastWeek?"#6B7280":"#1D4ED8"}}>
          {isPastWeek?"📜 ":""}{weekLabel}
        </div>
        <div style={{fontSize:11,color:"#9CA3AF"}}>
          {weekStart.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit'})} → {weekEnd.toLocaleDateString('fr-LU',{day:'2-digit',month:'2-digit',year:'numeric'})}
          {isPastWeek&&<span style={{color:"#D97706",fontWeight:600,marginLeft:6}}>Mode historique</span>}
        </div>
      </div>
      <button onClick={()=>setPlanningWeekOffset(w=>Math.min(2,w+1))}
        disabled={planningWeekOffset>=2}
        style={{...S.btn(planningWeekOffset>=2?"#F9FAFB":"#F1F5F9",planningWeekOffset>=2?"#D1D5DB":"#374151"),padding:"6px 14px",fontSize:13,opacity:planningWeekOffset>=2?0.5:1}}>
        Semaine suiv. ›
      </button>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:12}}>
      {[["semaine","📅 Vue semaine"],["jour","🚚 Détail du jour"]].map(([k,l])=>(
        <button key={k} onClick={()=>setPlanningView(k)}
          style={{...S.btn(planningView===k?"#1D4ED8":"#F1F5F9",planningView===k?"#fff":"#374151"),padding:"6px 14px",fontSize:12}}>{l}</button>
      ))}
    </div>

    <div style={{...S.card,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <button onClick={calculerMatriceRoutes} disabled={matriceLoading}
        style={{...S.btn("#0F766E"),padding:"6px 12px",fontSize:12,opacity:matriceLoading?0.6:1}}>
        {matriceLoading?"📐 Calcul en cours...":"📐 Calculer les distances routières exactes"}
      </button>
      <div style={{fontSize:11,color:"#6B7280",flex:1,minWidth:180}}>
        {matriceMsg || (Object.keys(matriceDist).length>0 ? `Distances routières disponibles pour ${Object.keys(matriceDist).length-1} clients.` : "Les tournées sont optimisées (ordre des arrêts + camion plein). Calcule les distances routières pour des km exacts.")}
      </div>
    </div>

    {planningView==="semaine" ? weekView : (<>
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
      {days.map((day,i)=>{
        const dDate = getDayDate(i);
        const cmdsDay = cmdsForDayIdx(i);
        const isToday = i === todayDow && isCurrentWeek;
        const isSelected = i === selectedDay;
        return(
          <div key={i} onClick={()=>setSelectedDay(i)}
            style={{flex:1,minWidth:90,padding:"10px 8px",borderRadius:10,cursor:"pointer",textAlign:"center",
              background:isSelected?(isPastWeek?"#6B7280":"#1D4ED8"):isToday?"#EFF6FF":"#fff",
              border:(isSelected?"2px solid "+(isPastWeek?"#6B7280":"#1D4ED8"):isToday?"2px solid #BFDBFE":"2px solid #E5E7EB"),
              color:isSelected?"#fff":"#374151"}}>
            <div style={{fontWeight:700,fontSize:13}}>{day}</div>
            <div style={{fontSize:10,color:isSelected?"#E5E7EB":isToday?"#1D4ED8":"#9CA3AF"}}>{getWeekDate(i)}</div>
            <div style={{fontSize:11,marginTop:4,fontWeight:600,color:isSelected?"#fff":cmdsDay.length>0?(isPastWeek?"#059669":"#1D4ED8"):"#9CA3AF"}}>
              {cmdsDay.length} {isPastWeek?"livrée"+(cmdsDay.length>1?"s":""):"cmd"+(cmdsDay.length>1?"s":"")}
            </div>
          </div>
        );
      })}
    </div>

    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:isPastWeek?"Livrées":"Commandes",v:dayCommandes.length,c:"#1D4ED8",icon:isPastWeek?"✅":"📋"},
        {l:"Total caisses",v:totalCaisses,c:"#7C3AED",icon:"📦"},
        {l:"Sefa",v:scheduleA.schedule.length+(isPastWeek?" livrées":" arrêts"),c:"#0EA5E9",icon:"🚚",sub:isPastWeek?null:scheduleA.totalKm+"km"},
        {l:"Mikail",v:scheduleB.schedule.length+(isPastWeek?" livrées":" arrêts"),c:"#8B5CF6",icon:"🚚",sub:isPastWeek?null:scheduleB.totalKm+"km"},
      ].map((s,i)=>(
        <div key={i} style={S.kpi(s.c)}>
          <div style={{fontSize:16}}>{s.icon}</div>
          <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#374151",fontWeight:600}}>{s.l}</div>
          {s.sub&&<div style={{fontSize:10,color:s.c}}>Fin: {s.sub}</div>}
        </div>
      ))}
    </div>

    {isPastWeek&&dayCommandes.length>0&&(
      <div style={{...S.kpi("#059669"),marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:11,color:"#374151",fontWeight:600}}>💶 Chiffre d'affaires livré ce jour</div>
        <div style={{fontSize:22,fontWeight:800,color:"#059669"}}>{fmtFull(totalCA)}</div>
      </div>
    )}

    {dayCommandes.length===0?(
      <div style={{...S.card,textAlign:"center",padding:"48px 0",color:"#9CA3AF"}}>
        <div style={{fontSize:40,marginBottom:12}}>{isPastWeek?"📜":"📅"}</div>
        <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>
          {isPastWeek?`Aucune livraison effectuée le ${days[selectedDay]}`:`Aucune commande pour ${days[selectedDay]}`}
        </div>
      </div>
    ):(
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
        {[{driver:"A",name:"Sefa",schedule:scheduleA,col:"#0EA5E9",bg:"#E0F2FE"},
          {driver:"B",name:"Mikail",schedule:scheduleB,col:"#8B5CF6",bg:"#EDE9FE"}].map(({driver,name,schedule,col,bg})=>(
          <div key={driver} style={{...S.card,borderTop:"4px solid "+col}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:col}}>🚚 {name}</div>
                <div style={{fontSize:11,color:"#6B7280"}}>
                  {isPastWeek
                    ? `${schedule.schedule.length} livraison(s) effectuée(s)`
                    : `Départ Hesperange 8h00 · ${schedule.schedule.length} arrêt(s) · ${schedule.retDist}km retour`}
                </div>
              </div>
              {!isPastWeek&&(
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:"#6B7280"}}>Distance totale</div>
                  <div style={{fontWeight:700,color:col,fontSize:14}}>{schedule.exactAll?"":"~"}{schedule.totalKm} km{schedule.dureeTxt?` · ${schedule.dureeTxt}`:""}</div>
                  <div style={{fontSize:9,color:schedule.exactAll?"#059669":"#D97706"}}>{schedule.exactAll?"distances routières exactes":"estimé — calculer les distances routières"}</div>
                </div>
              )}
            </div>

            {schedule.schedule.length===0?(
              <div style={{textAlign:"center",color:"#9CA3AF",fontSize:12,padding:"20px 0"}}>
                {isPastWeek?"Aucune livraison ce jour":"Aucune livraison ce jour"}
              </div>
            ): isPastWeek ? (
              <div>
                {schedule.schedule.map((stop)=>{
                  const montant = getCmdMontant(stop);
                  return(
                    <div key={stop.id} style={{padding:"8px 10px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,marginBottom:6}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:12}}>✅ {stop.client_nom}</div>
                          <div style={{fontSize:10,color:"#6B7280"}}>📍 {stop.client_adresse}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:4}}>
                            {(stop.produits||[]).map((p,i)=>(
                              <span key={i} style={{fontSize:9,background:bg,color:col,padding:"1px 5px",borderRadius:3}}>
                                {p.nom} ×{p.qte}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{textAlign:"right",marginLeft:8}}>
                          {stop.date_livraison&&<div style={{fontSize:9,color:"#9CA3AF"}}>{stop.date_livraison}</div>}
                          {montant!=null&&<div style={{fontWeight:700,color:"#059669",fontSize:12}}>{fmtFull(montant)}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{borderTop:"1px solid #E5E7EB",marginTop:8,paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:11,color:"#6B7280",fontWeight:600}}>
                  <span>📦 {schedule.schedule.reduce((s,c)=>s+(c.produits||[]).reduce((ss,p)=>ss+p.qte,0),0)} caisses</span>
                  <span>💶 {fmtFull(schedule.schedule.reduce((s,c)=>s+(getCmdMontant(c)||0),0))}</span>
                </div>
              </div>
            ):(
              <div>
                <div style={{position:"relative",paddingLeft:32}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,position:"relative"}}>
                    <div style={{position:"absolute",left:-32,width:20,height:20,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700}}>🏠</div>
                    <div style={{flex:1,padding:"6px 10px",background:"#F8FAFC",borderRadius:6}}>
                      <div style={{fontWeight:600,fontSize:11,color:col}}>🏠 Départ — Hesperange</div>
                    </div>
                  </div>

                  {schedule.schedule.map((stop,idx)=>(
                    <div key={stop.id} style={{marginBottom:10,position:"relative"}}>
                      {stop.rot>0 && schedule.schedule[idx-1]?.rot!==stop.rot && (
                        <div style={{margin:"0 0 8px",padding:"5px 8px",background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:6,fontSize:10,fontWeight:600,color:"#92400E"}}>
                          🔁 Camion plein (200 colis) — retour au dépôt, puis rotation {stop.rot+1}
                        </div>
                      )}
                      <div style={{position:"absolute",left:-22,top:0,bottom:-10,width:2,background:"#E5E7EB"}}/>
                      <div style={{position:"absolute",left:-32,width:20,height:20,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700}}>{idx+1}</div>
                      <div style={{padding:"8px 10px",background:stop.isCv?"#FFF7ED":"#F8FAFC",borderRadius:8,border:(stop.isCv?"1px solid #FED7AA":"1px solid #E5E7EB")}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <span style={{fontWeight:700,color:col,fontSize:11}}>Arrêt #{idx+1}</span>
                            {stop.isCv&&<span style={{fontSize:9,background:"#FED7AA",color:"#92400E",padding:"1px 4px",borderRadius:3}}>⏰ Centre-ville en 1er</span>}
                          </div>
                          <span style={{fontSize:9,color:"#9CA3AF"}}>{stop.dist} km depuis {idx===0||schedule.schedule[idx-1]?.rot!==stop.rot?"le dépôt":"l'arrêt précédent"} {stop.exact?"(route)":"(estimé)"}</span>
                        </div>
                        <div style={{fontWeight:600,fontSize:12,marginBottom:2}}>{stop.client_nom}</div>
                        <div style={{fontSize:10,color:"#6B7280",marginBottom:4}}>📍 {stop.client_adresse}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
                          {(stop.produits||[]).map((p,i)=>(
                            <span key={i} style={{fontSize:9,background:bg,color:col,padding:"1px 5px",borderRadius:3}}>
                              📦 {p.nom} ×{p.qte}
                            </span>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          <button onClick={()=>marquerLivre(stop.id)} disabled={saving}
                            style={{...S.btn("#059669"),padding:"3px 8px",fontSize:10}}>✓ Livré</button>
                          <button onClick={()=>imprimerBonLivraison(stop)}
                            style={{...S.btn("#7C3AED"),padding:"3px 8px",fontSize:10}}>📦</button>
                          <button onClick={()=>{openEditCmd(stop);setPage("commandes");}}
                            style={{...S.btn("#1D4ED8"),padding:"3px 8px",fontSize:10}}>✏️</button>
                          <button onClick={()=>supprimerCommande(stop.id)}
                            style={{...S.btn("#EF4444"),padding:"3px 8px",fontSize:10}}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
                    <div style={{position:"absolute",left:-32,width:20,height:20,borderRadius:"50%",background:"#059669",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9}}>🏠</div>
                    <div style={{flex:1,padding:"6px 10px",background:"#F0FDF4",borderRadius:6,border:"1px solid #86EFAC"}}>
                      <div style={{fontWeight:600,fontSize:11,color:"#059669"}}>🏠 Retour Hesperange (~{schedule.retDist}km)</div>
                    </div>
                  </div>
                </div>

                <div style={{borderTop:"1px solid #E5E7EB",marginTop:12,paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:11,color:"#6B7280"}}>
                  <span>📦 {schedule.schedule.reduce((s,c)=>s+(c.produits||[]).reduce((ss,p)=>ss+p.qte,0),0)} caisses</span>
                  <span>🗺️ Total : {schedule.exactAll?"":"~"}{schedule.totalKm} km{schedule.rotInfo.length>1?` · ${schedule.rotInfo.length} rotations`:""}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
    </>)}
  </div>
  );
})()}

{/* ══ ZONES ════════════════════════════════════════════════════ */}
{page==="zones" && (
  <div>
    {/* Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{fontSize:13,color:"#6B7280"}}>Clients actifs organisés par zone de livraison</div>
      <button onClick={()=>generateOnePager(clients)}
        style={{...S.btn("#C0392B"),padding:"8px 16px",fontSize:13}}>
        🖨️ Exporter One Pager PDF
      </button>
    </div>

    {/* Planning recap cards */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:16}}>
      {[
        {name:"Sefa",col:"#0EA5E9",bg:"#E0F2FE",schedule:[
          {day:"Lundi",zones:"Centre-ville · Nord · France"},
          {day:"Mardi",zones:"Nord · Nord-ouest · Est"},
          {day:"Mercredi",zones:"Centre-ville · Nord-Est"},
          {day:"Jeudi",zones:"Nord · Est"},
          {day:"Vendredi",zones:"Centre-ville · Ouest"},
        ]},
        {name:"Mikail",col:"#8B5CF6",bg:"#EDE9FE",schedule:[
          {day:"Lundi",zones:"Sud · France"},
          {day:"Mardi",zones:"Sud · Sud-Est"},
          {day:"Mercredi",zones:"Ouest · Sud-ouest"},
          {day:"Jeudi",zones:"Sud · Belgique"},
          {day:"Vendredi",zones:"Sud-ouest · Belgique"},
        ]},
      ].map(driver=>(
        <div key={driver.name} style={{...S.card,borderTop:"4px solid "+driver.col}}>
          <div style={{fontWeight:700,color:driver.col,fontSize:14,marginBottom:10}}>🚚 {driver.name}</div>
          {driver.schedule.map(s=>(
            <div key={s.day} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:"1px solid #F1F5F9",fontSize:12}}>
              <span style={{fontWeight:600,width:70,color:"#374151"}}>{s.day}</span>
              <span style={{color:"#6B7280"}}>{s.zones}</span>
            </div>
          ))}
        </div>
      ))}
    </div>

    {/* Clients by zone */}
    {Object.entries(
      clients.filter(c=>c.statut==="Actif").reduce((acc,c)=>{
        const z = c.region||"Non défini";
        if(!acc[z]) acc[z]=[];
        acc[z].push(c);
        return acc;
      },{})
    ).sort(([a],[b])=>{
      const da = ZONE_SCHEDULE[a]?.driver||"Z";
      const db = ZONE_SCHEDULE[b]?.driver||"Z";
      return da!==db ? da.localeCompare(db) : a.localeCompare(b);
    }).map(([zone, zClients])=>{
      const schedule = ZONE_SCHEDULE[zone];
      const driver = schedule?.driver;
      const col = driver==="Sefa"?"#0EA5E9":driver==="Mikail"?"#8B5CF6":"#6B7280";
      const bg = driver==="Sefa"?"#E0F2FE":driver==="Mikail"?"#EDE9FE":"#F3F4F6";
      return(
        <div key={zone} style={{...S.card,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"8px 10px",background:col,borderRadius:8,color:"#fff"}}>
            <div>
              <span style={{fontWeight:700,fontSize:13}}>📍 {zone}</span>
              <span style={{fontSize:11,opacity:0.85,marginLeft:8}}>
                🚚 {driver||"?"} · {schedule?.days?.join(", ")||"À définir"}
              </span>
            </div>
            <span style={{fontWeight:700,fontSize:12}}>{zClients.length} client(s)</span>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{background:"#F9FAFB"}}>
                  {["Nom","Adresse","Téléphone","TVA","Type","Conditions"].map(h=>(
                    <th key={h} style={{padding:"5px 8px",textAlign:"left",color:"#6B7280",fontWeight:600,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zClients.sort((a,b)=>a.nom.localeCompare(b.nom)).map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:"1px solid #F1F5F9",background:i%2===0?"#fff":"#FAFAFA",cursor:"pointer"}}
                    onClick={()=>openClientTab(c,"info")}>
                    <td style={{padding:"5px 8px",fontWeight:600,color:"#1D4ED8"}}>{c.nom}</td>
                    <td style={{padding:"5px 8px",color:"#6B7280",fontSize:10}}>{c.adresse}</td>
                    <td style={{padding:"5px 8px",whiteSpace:"nowrap"}}>{c.telephone}</td>
                    <td style={{padding:"5px 8px",color:"#6B7280",fontSize:10}}>{c.tva}</td>
                    <td style={{padding:"5px 8px"}}><span style={S.badge(tc(c.type).bg,tc(c.type).text)}>{c.type}</span></td>
                    <td style={{padding:"5px 8px",color:"#6B7280"}}>{c.conditions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    })}
  </div>
)}

{/* ══ STOCK ══════════════════════════════════════════════════════ */}
{page==="stock" && !showReceptionForm && !showPerteForm && (
  <div>
    {workTabStrip()}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Ruptures",v:produits.filter(p=>!(stock[p.id]>0)).length,c:"#DC2626"},
        {l:"Stock bas (≤"+STOCK_BAS_SEUIL+")",v:produits.filter(p=>stock[p.id]>0&&stock[p.id]<=STOCK_BAS_SEUIL).length,c:"#334155"},
        {l:"En stock",v:produits.filter(p=>stock[p.id]>5).length,c:"#334155"},
        {l:"Pertes ce mois",v:(()=>{
          const moisActuel=localYearMonth();
          const pertesMois=pertesStock.filter(p=>(p.date||"").startsWith(moisActuel));
          const coutPertes=pertesMois.reduce((s,p)=>{
            const cm=getCoutMoyenPondere(p.produit_id,receptionsStock);
            const prod=produits.find(x=>x.id===p.produit_id);
            const cout=cm??prod?.prix_achat??0;
            return s+p.quantite*cout;
          },0);
          return fmtFull(coutPertes);
        })(),c:"#334155"},
      ].map((s,i)=>(
        <div key={i} style={{...S.kpi(s.c),borderLeft:s.c==="#DC2626"?"3px solid #DC2626":"1px solid #E3E7ED"}}>
          <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{s.l}</div>
        </div>
      ))}
    </div>
    <div style={{...S.card,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <select value={stockCat} onChange={e=>setStockCat(e.target.value)} style={{padding:"7px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        {["Tous",...new Set(produits.map(p=>p.categorie))].sort((a,b)=>a==="Tous"?-1:b==="Tous"?1:a.localeCompare(b)).map(c=><option key={c}>{c}</option>)}
      </select>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{openReceptionTab();}}
          style={{...S.btn("#F5F3FF","#7C3AED"),padding:"7px 14px",fontSize:12,fontWeight:600}}>📥 Réception</button>
        <button onClick={()=>{openPerteTab();}}
          style={{...S.btn("#FFFBEB","#D97706"),padding:"7px 14px",fontSize:12,fontWeight:600}}>🗑️ Déclarer une perte</button>
      </div>
    </div>
    <DataTable
      isMobile={isMobile}
      rows={produits.filter(p=>stockCat==="Tous"||p.categorie===stockCat)}
      exportName="stock"
      pageSize={50}
      emptyIcon="📦"
      emptyMessage="Aucun produit dans cette catégorie"
      initialSort={{key:"stock",dir:"asc"}}
      columns={[
        {key:"nom", label:"Produit", mobilePrimary:true, sortValue:p=>p.nom||"", render:p=>(
          <span style={{fontWeight:600}}>{p.nom}{p.type_emballage==="VC"&&<span style={{marginLeft:6,fontSize:10,color:"#7C3AED"}}>VC</span>}</span>
        )},
        {key:"categorie", label:"Cat.", mobileShow:true, sortValue:p=>p.categorie||"", render:p=><span style={{color:"#475569"}}>{p.categorie}</span>},
        {key:"stock", label:"Stock", align:"right", mobileShow:true, sortValue:p=>stock[p.id]||0, render:p=>{
          const q=stock[p.id]||0;
          const col=q===0?"#DC2626":q<=STOCK_BAS_SEUIL?"#D97706":"#0F172A";
          return <span><span style={{fontWeight:700,color:col,fontSize:15}}>{q}</span><span style={{fontSize:11,color:"#9CA3AF",marginLeft:4}}>cs</span></span>;
        }},
        {key:"cout", label:"Coût moyen", align:"right", sortable:false, render:p=>{
          const coutMoyen=getCoutMoyenPondere(p.id,receptionsStock);
          const nbReceptions=receptionsStock.filter(r=>r.produit_id===p.id).length;
          return coutMoyen!=null ? (
            <div>
              <span style={{fontWeight:600,color:"#7C3AED"}}>{fmtFull(coutMoyen)}</span>
              <div style={{fontSize:10,color:"#9CA3AF"}}>{nbReceptions} réception{nbReceptions>1?"s":""}</div>
            </div>
          ) : <span style={{color:"#CBD5E1"}}>—</span>;
        }},
        {key:"modifier", label:"Modifier", sortable:false, render:p=>{
          const q=stock[p.id]||0;
          return (
            <div style={{display:"flex",alignItems:"center",gap:4}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>updateStock(p.id,(stock[p.id]||0)-1)} style={{width:26,height:26,border:"1px solid #E3E7ED",borderRadius:6,background:"#F8FAFC",cursor:"pointer",fontWeight:700}}>−</button>
              <input type="number" min="0"
                value={stockDraft[p.id]!==undefined ? stockDraft[p.id] : q}
                onChange={e=>setStockDraft(prev=>({...prev,[p.id]:e.target.value}))}
                onBlur={()=>{
                  if (stockDraft[p.id]===undefined) return;
                  updateStock(p.id, parseInt(stockDraft[p.id])||0);
                  setStockDraft(prev=>{const n={...prev}; delete n[p.id]; return n;});
                }}
                onKeyDown={e=>{if(e.key==="Enter") e.target.blur();}}
                style={{width:54,textAlign:"center",padding:"3px 4px",border:"1px solid #D1D5DB",borderRadius:6,fontSize:13,outline:"none"}}/>
              <button onClick={()=>updateStock(p.id,(stock[p.id]||0)+1)} style={{width:26,height:26,border:"1px solid #E3E7ED",borderRadius:6,background:"#F8FAFC",cursor:"pointer",fontWeight:700}}>+</button>
            </div>
          );
        }},
      ]}
    />
    {receptionsStock.length>0 && (
      <div style={{marginTop:20}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"#334155"}}>Réceptions récentes</div>
        <div style={{background:"#fff",borderRadius:10,border:"1px solid #E3E7ED",overflow:"hidden"}}>
          {[...receptionsStock].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,10).map((r,i,arr)=>{
            const prod = produits.find(p=>p.id===r.produit_id);
            return (
              <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:i<arr.length-1?"1px solid #F1F5F9":"none",fontSize:12,flexWrap:"wrap",gap:6}}>
                <span>
                  <strong>{prod?.nom||"Produit supprimé"}</strong> · {r.quantite} cs × {fmtFull(r.prix_achat_unitaire)}
                  <span style={{color:"#94A3B8"}}> — {r.date}{r.fournisseur?" · "+r.fournisseur:""}</span>
                </span>
                {r.piece_jointe_url ? (
                  <button onClick={async ()=>{
                    const fenetre = window.open("", "_blank");
                    try {
                      const url = await getUrlSigneeFichier(r.piece_jointe_url);
                      if (fenetre) fenetre.location.href = url;
                    } catch(e) {
                      if (fenetre) fenetre.close();
                      logError(e, "consultation-piece-jointe");
                    }
                  }} style={{...S.btn("#F5F3FF","#7C3AED"),padding:"3px 9px",fontSize:11,display:"inline-flex",alignItems:"center",gap:4,border:"none",cursor:"pointer"}}>
                    📎 {r.piece_jointe_nom||"Voir la pièce jointe"}
                  </button>
                ) : <span style={{color:"#CBD5E1",fontSize:11}}>Pas de pièce jointe</span>}
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}

{/* ══ CONSIGNES ══════════════════════════════════════════════════ */}
{page==="consignes" && !showConsigneForm && (
  <div>
    {workTabStrip()}
    {(() => {
      const clientsAvecSolde = clientsActifs.map(c => ({
        ...c,
        sol: soldeConsignes(c.id),
        credit: creditManuelDisponible(c.id),
        total: soldeConsignes(c.id).reduce((s,r)=>s+r.solde*r.consigne,0)
      })).filter(c => c.total > 0 || c.credit > 0).sort((a,b) => b.total - a.total);

      const totalGlobal = clientsAvecSolde.reduce((s,c)=>s+c.total,0);
      const totalCredit = clientsAvecSolde.reduce((s,c)=>s+c.credit,0);

      return (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <button onClick={openConsigneTab} style={S.btn()}>+ Enregistrer un retour</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10,marginBottom:16}}>
            <div style={S.kpi("#334155")}>
              <div style={{fontSize:22,fontWeight:800,color:"#334155"}}>{fmtFull(totalGlobal)}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>Valeur consignes en circulation</div>
            </div>
            <div style={S.kpi("#334155")}>
              <div style={{fontSize:22,fontWeight:800,color:"#334155"}}>{fmtFull(totalCredit)}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>Crédits à déduire (retours déclarés)</div>
            </div>
            <div style={S.kpi("#334155")}>
              <div style={{fontSize:22,fontWeight:800,color:"#334155"}}>{clientsAvecSolde.length}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>Clients avec consignes</div>
            </div>
          </div>

          <DataTable
            isMobile={isMobile}
            rows={clientsAvecSolde}
            exportName="consignes_clients"
            pageSize={50}
            onRowClick={c=>openClientTab(c,"consignes")}
            emptyIcon="♻️"
            emptyMessage="Aucune consigne en cours"
            initialSort={{key:"total",dir:"desc"}}
            footer={isMobile ? (
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span>Total</span>
                <span>{fmtFull(totalGlobal)} · − {fmtFull(totalCredit)}</span>
              </div>
            ) : (
              <tr style={{borderTop:"2px solid #E3E7ED",background:"#F8FAFC",fontWeight:700,fontSize:12}}>
                <td colSpan={3} style={{padding:"8px 12px"}}>TOTAL</td>
                <td style={{padding:"8px 12px"}}>{fmtFull(totalGlobal)}</td>
                <td style={{padding:"8px 12px"}}>− {fmtFull(totalCredit)}</td>
                <td></td>
              </tr>
            )}
            columns={[
              {key:"nom", label:"Client", mobilePrimary:true, sortValue:c=>c.nom||"", render:c=>(
                <div style={{display:"flex",gap:9,alignItems:"center"}}>
                  <div style={{width:28,height:28,borderRadius:8,background:"#F1F5F9",color:"#5D6B82",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10.5,flexShrink:0}}>{initials(c.nom)}</div>
                  <span style={{fontWeight:600}}>{c.nom}</span>
                </div>
              )},
              {key:"region", label:"Région", mobileShow:true, sortValue:c=>c.region||""},
              {key:"caisses", label:"Caisses", align:"right", mobileShow:true, sortValue:c=>c.sol.reduce((s,r)=>s+r.solde,0), render:c=>c.sol.reduce((s,r)=>s+r.solde,0)},
              {key:"total", label:"Valeur", align:"right", mobileShow:true, sortValue:c=>c.total, render:c=><span style={{fontWeight:700}}>{fmtFull(c.total)}</span>},
              {key:"credit", label:"Crédit à déduire", align:"right", sortValue:c=>c.credit, render:c=>
                c.credit>0 ? <span style={{color:"#059669",fontWeight:600}}>− {fmtFull(c.credit)}</span> : <span style={{color:"#CBD5E1"}}>—</span>
              },
            ]}
          />

          {consignesManuelles.filter(c=>!c.utilise).length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"#334155"}}>Retours déclarés, pas encore utilisés</div>
              <DataTable
                isMobile={isMobile}
                rows={consignesManuelles.filter(c=>!c.utilise)}
                exportName="consignes_retours_en_attente"
                pageSize={50}
                emptyIcon="📋"
                emptyMessage="Aucun retour en attente"
                initialSort={{key:"date",dir:"desc"}}
                columns={[
                  {key:"date", label:"Date", mobilePrimary:true, sortValue:c=>c.date||""},
                  {key:"client", label:"Client", mobileShow:true, sortValue:c=>clients.find(x=>x.id===c.client_id)?.nom||"", render:c=>clients.find(x=>x.id===c.client_id)?.nom||"—"},
                  {key:"produit", label:"Produit", sortValue:c=>c.produit_nom||"", render:c=>c.produit_nom||<span style={{color:"#CBD5E1"}}>—</span>},
                  {key:"qte", label:"Qté", align:"right", sortValue:c=>c.quantite||0},
                  {key:"montant", label:"Montant", align:"right", mobileShow:true, sortValue:c=>c.quantite*c.consigne_unitaire, render:c=><span style={{fontWeight:600,color:"#059669"}}>{fmtFull(c.quantite*c.consigne_unitaire)}</span>},
                  {key:"actions", label:"", sortable:false, render:c=>(
                    <button onClick={e=>{e.stopPropagation();supprimerConsigneManuelle(c.id);}} style={{...S.btn("#FEE2E2","#DC2626"),padding:"3px 8px",fontSize:10}}>🗑️</button>
                  )},
                ]}
              />
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}

{/* ══ PRODUITS ══════════════════════════════════════════════════ */}
{page==="produits" && !showProduitForm && (()=>{
  const produitsFiltres = produits.filter(p=>
    produitFilterStatut==="Tous" || (p.statut||"Actif")===produitFilterStatut
  );
  const nbActifs = produits.filter(p=>(p.statut||"Actif")==="Actif").length;
  const nbPassifs = produits.filter(p=>p.statut==="Passif").length;

  return(
  <div>
    {workTabStrip()}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Total",v:produits.length,c:"#334155",s:"Tous"},
        {l:"Actifs",v:nbActifs,c:"#334155",s:"Actif"},
        {l:"Désactivés",v:nbPassifs,c:"#334155",s:"Passif"},
      ].map((k,i)=>(
        <div key={i} style={{...S.kpi(k.c),cursor:"pointer",outline:produitFilterStatut===k.s?"2px solid "+k.c:"none"}}
          onClick={()=>setProduitFilterStatut(k.s)}>
          <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{k.l}</div>
        </div>
      ))}
    </div>

    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
      <button onClick={()=>setShowReorderProduits(v=>!v)} style={S.btn(showReorderProduits?"#1D4ED8":"#F1F5F9",showReorderProduits?"#fff":"#374151")}>
        {showReorderProduits ? "✓ Terminer la réorganisation" : "🔀 Réorganiser l'ordre d'affichage"}
      </button>
    </div>

    {showReorderProduits ? (
      <div style={S.card}>
        <div style={{fontSize:12,color:"#6B7280",marginBottom:14}}>
          Cet ordre est utilisé partout où la liste des produits s'affiche (commandes, factures, catalogue). Les flèches ne déplacent un produit qu'à l'intérieur de sa catégorie — l'ordre des catégories elles-mêmes (canettes → bouteilles → eaux...) reste fixe.
        </div>
        {[...new Set(produits.map(p=>p.categorie))].map(cat=>{
          const prods = produits.filter(p=>p.categorie===cat);
          return (
            <div key={cat} style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6,borderBottom:"1px solid #F1F5F9",paddingBottom:4}}>{cat}</div>
              {prods.map((p,i)=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 4px",borderBottom:i<prods.length-1?"1px solid #F8FAFC":"none"}}>
                  <span style={{flex:1,fontSize:13,color:p.statut==="Passif"?"#9CA3AF":"#111"}}>{p.nom}{p.statut==="Passif"&&" (désactivé)"}</span>
                  <button onClick={()=>deplacerProduit(p.id,"up")} disabled={i===0||saving} style={{...S.btn("#F1F5F9","#374151"),padding:"3px 9px",fontSize:12,opacity:i===0?0.3:1}}>▲</button>
                  <button onClick={()=>deplacerProduit(p.id,"down")} disabled={i===prods.length-1||saving} style={{...S.btn("#F1F5F9","#374151"),padding:"3px 9px",fontSize:12,opacity:i===prods.length-1?0.3:1}}>▼</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    ) : (
    <DataTable
      isMobile={isMobile}
      rows={produitsFiltres}
      exportName="catalogue_produits"
      pageSize={50}
      onRowClick={openEditProduitTab}
      emptyIcon="🍺"
      emptyMessage="Aucun produit dans cette vue"
      columns={[
        {key:"nom", label:"Produit", mobilePrimary:true, sortValue:p=>p.nom||"", render:p=><span style={{fontWeight:600}}>{p.nom}</span>},
        {key:"categorie", label:"Cat.", mobileShow:true, sortValue:p=>p.categorie||"", render:p=><span style={{color:"#475569"}}>{p.categorie}</span>},
        {key:"type", label:"Type", mobileShow:true, sortValue:p=>p.type_emballage||"", render:p=><span style={{color:"#475569"}}>{p.type_emballage}</span>},
        {key:"prix_achat", label:"Prix achat", align:"right", sortValue:p=>p.prix_achat||0, render:p=>
          p.prix_achat!=null&&p.prix_achat>0 ? fmtFull(p.prix_achat) : <span style={{color:"#DC2626",fontSize:11}}>non renseigné</span>
        },
        {key:"prix_snack", label:"Prix Snack", align:"right", mobileShow:true, sortValue:p=>p.prix?.Snack||0, render:p=>fmtFull(p.prix?.Snack)},
        {key:"marge", label:"Marge Snack", align:"right", sortable:false, render:p=>{
          const margeSnack = (p.prix_achat!=null&&p.prix_achat>0) ? p.prix?.Snack - p.prix_achat : null;
          const margeSnackPct = (margeSnack!=null && p.prix?.Snack>0) ? Math.round(margeSnack/p.prix.Snack*100) : null;
          return margeSnack!=null ? <span style={{color:"#059669",fontWeight:600}}>{fmtFull(margeSnack)} ({margeSnackPct}%)</span> : <span style={{color:"#CBD5E1"}}>—</span>;
        }},
        {key:"consigne", label:"Consigne", align:"right", sortable:false, render:p=>
          p.type_emballage==="VC" ? <span style={{color:"#7C3AED"}}>{fmtFull(CONSIGNE_PRIX[p.consigne])}</span> : <span style={{color:"#CBD5E1"}}>—</span>
        },
        {key:"statut", label:"Statut", mobileShow:true, sortValue:p=>p.statut||"Actif", render:p=>(
          <span style={{display:"inline-flex",alignItems:"center",gap:5,color:"#475569"}}>
            <span style={{width:6,height:6,borderRadius:99,background:p.statut==="Passif"?"#CBD5E1":"#22C55E",flexShrink:0}}/>
            {p.statut==="Passif"?"Désactivé":"Actif"}
          </span>
        )},
        {key:"actions", label:"", sortable:false, render:p=>(
          <button title={p.statut==="Passif"?"Réactiver":"Désactiver"} onClick={e=>{e.stopPropagation();toggleProduitStatut(p);}}
            style={{...S.btn(p.statut==="Passif"?"#F0FDF4":"#FFFBEB",p.statut==="Passif"?"#059669":"#D97706"),padding:"3px 10px",fontSize:11}}>
            {p.statut==="Passif"?"✅ Réactiver":"⛔ Désactiver"}
          </button>
        )},
      ]}
    />
    )}
  </div>
  );
})()}


  {/* ══ PAGE FICHE CLIENT ══════════════════════════════════════ */}
  {page==="clients" && selClient&&(
  <div key={"client-"+selClient.id} className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,padding:0,overflow:"hidden"}}>
      <div style={{padding:isMobile?"18px 18px 0":"22px 26px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:13,alignItems:"center",minWidth:0}}>
            <div style={{width:46,height:46,borderRadius:12,background:"#F1F5F9",color:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,flexShrink:0}}>{initials(selClient.nom)}</div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,fontSize:17,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{selClient.nom}</div>
              <div style={{fontSize:12,color:"#64748B",display:"flex",gap:7,alignItems:"center",marginTop:3,flexWrap:"wrap"}}>
                <span>{selClient.type}</span>
                <span style={{color:"#CBD5E1"}}>·</span>
                <span>{selClient.region}</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:4,marginLeft:2}}>
                  <span style={{width:6,height:6,borderRadius:99,background:selClient.statut==="Actif"?"#22C55E":"#CBD5E1"}}/>
                  {selClient.statut}
                </span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>{openNewFactureTab();setFactClientId(selClient.id);setFactNoteClient(selClient.commentaire_facture||"");}} style={S.btn()}>+ Facture</button>
            <button onClick={()=>{setEditClient(selClient);setClientForm({...selClient});setShowClientForm(true);}} style={S.btn("#F1F5F9","#334155")}>✏️</button>
          </div>
        </div>
        {selClient.code_activation&&(
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:selClient.auth_user_id?"#F0FDF4":"#EFF6FF",border:"1px solid "+(selClient.auth_user_id?"#BBF7D0":"#BFDBFE"),borderRadius:10,padding:"9px 12px",marginBottom:14}}>
            <span style={{fontSize:12,fontWeight:600,color:selClient.auth_user_id?"#166534":"#1D4ED8"}}>
              {selClient.auth_user_id?"✅ Portail activé":"🔑 Code d'activation portail"}
            </span>
            {!selClient.auth_user_id&&(
              <>
                <span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,letterSpacing:1,color:"#0F172A",background:"#fff",border:"1px solid #E3E7ED",borderRadius:6,padding:"2px 8px"}}>
                  {selClient.code_activation}
                </span>
                <button
                  onClick={async()=>{
                    try{
                      await navigator.clipboard.writeText(selClient.code_activation);
                      notifySuccess("Code copié dans le presse-papiers.");
                    }catch(e){logError(e);}
                  }}
                  style={S.btn("#F1F5F9","#334155")}
                >📋 Copier</button>
                <span style={{fontSize:11,color:"#64748B"}}>À communiquer au client pour qu'il active son compte sur hondro-distribution.com</span>
              </>
            )}
          </div>
        )}
        <div style={{display:"flex",gap:2}}>
          {[["info","Infos"],["factures","Factures"],["visites","Visites"],["consignes","Consignes"],["prix","Prix perso"]].map(([k,l])=>(
            <button key={k} style={S.tab(clientTab===k)} onClick={()=>setClientTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{borderTop:"1px solid #E3E7ED",padding:isMobile?18:26}}>
      {clientTab==="info"&&(
        <div style={{display:"grid",gap:8}}>
          {EXPORT_REGIONS.includes(selClient.region)&&!tvaIntracomValide(selClient)&&(
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:10,fontSize:12,color:"#991B1B"}}>
              🧾 <strong>Pas de n° de TVA intracommunautaire valide.</strong> Les factures pour ce client sont émises à 0% (exonération intracommunautaire), ce qui n'est légal que si un n° de TVA {TVA_PREFIX[selClient.region]}... est renseigné. Complète le champ "N° TVA" ci-dessous.
            </div>
          )}
          {[["Nature",selClient.nature_client||"Professionnel"],["Adresse",selClient.adresse],["Téléphone",selClient.telephone],["Email",selClient.email||"—"],
            ...(selClient.nature_client!=="Particulier" ? [["Contact",selClient.contact||"—"],["N° TVA",selClient.tva||"—"],["N° RCS",selClient.rcs||"—"]] : []),
            ["Type",selClient.type||"—"],["Pays",selClient.pays||"Luxembourg"],["Zone de livraison",selClient.region||"—"],["Conditions",selClient.conditions],["Statut",selClient.statut],
            ["Fidélité",selClient.categorie_fidelite||"Aucune"],
            ["Mode de facturation",selClient.mode_facturation==="groupee"?"Groupée":"À chaque commande"],
            ["TVA 0% manuelle",selClient.tva_exoneree?"Oui":"Non"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",gap:12,fontSize:13}}>
              <span style={{color:"#9CA3AF",width:100,flexShrink:0}}>{l}</span>
              <span style={{fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
      )}
      {clientTab==="factures"&&(
        <div>
          {selClient.mode_facturation==="groupee" && (()=>{
            const enAttente = commandesNonFacturees(selClient.id);
            if (enAttente.length===0) return (
              <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#5B21B6"}}>
                ♻️ Facturation groupée activée pour ce client — aucune livraison en attente de facturation pour l'instant.
              </div>
            );
            const totalSelection = enAttente.filter(c=>selectedCmdsToInvoice.includes(c.id))
              .reduce((s,c)=>s+(c.produits||[]).reduce((s2,p)=>{
                const produit = findProduitByNom(produits, p.nom);
                const pu = produit ? getClientPrix(produit, selClient) : 0;
                return s2 + pu*p.qte;
              },0),0);
            return (
              <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:12,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontWeight:700,fontSize:12,color:"#5B21B6"}}>♻️ Livraisons en attente de facturation ({enAttente.length})</div>
                  <button onClick={()=>setSelectedCmdsToInvoice(
                    selectedCmdsToInvoice.length===enAttente.length ? [] : enAttente.map(c=>c.id)
                  )} style={{background:"none",border:"none",color:"#7C3AED",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                    {selectedCmdsToInvoice.length===enAttente.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>
                <div style={{display:"grid",gap:5,marginBottom:10}}>
                  {enAttente.map(c=>(
                    <label key={c.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,background:"#fff",borderRadius:6,padding:"7px 9px",cursor:"pointer"}}>
                      <input type="checkbox" checked={selectedCmdsToInvoice.includes(c.id)}
                        onChange={e=>setSelectedCmdsToInvoice(prev => e.target.checked ? [...prev,c.id] : prev.filter(id=>id!==c.id))}/>
                      <span style={{flex:1}}>{c.date_commande||c.date_livraison} — {(c.produits||[]).map(p=>p.nom+" ×"+p.qte).join(", ")}</span>
                    </label>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#5B21B6"}}>{selectedCmdsToInvoice.length} sélectionnée(s) · {fmtFull(totalSelection)}</span>
                  <button onClick={async ()=>{ await facturerCommandesGroupees(selectedCmdsToInvoice); setSelectedCmdsToInvoice([]); }}
                    disabled={selectedCmdsToInvoice.length===0||saving}
                    style={{...S.btn("#7C3AED"),padding:"7px 14px",fontSize:12,opacity:selectedCmdsToInvoice.length===0?0.5:1}}>
                    Facturer la sélection
                  </button>
                </div>
              </div>
            );
          })()}
          {clientImpayees(selClient.id).length>0&&(
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:10,marginBottom:10}}>
              <div style={{fontWeight:600,color:"#DC2626",fontSize:12,marginBottom:6}}>⚠️ Impayées</div>
              {clientImpayees(selClient.id).map(f=>(
                <div key={f.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                  <span>{f.numero} — {f.date}</span>
                  <span style={{fontWeight:700,color:"#DC2626"}}>{fmtFull(resteFact(f))}</span>
                </div>
              ))}
            </div>
          )}
          {clientFactures(selClient.id).length===0?(
            <div style={{textAlign:"center",color:"#9CA3AF",padding:"30px 0",fontSize:13}}>Aucune facture</div>
          ):(
            clientFactures(selClient.id).map(f=>{
              const {total}=totalFact(f.lignes, f.tva_pct);
              return(
                <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#F9FAFB",borderRadius:8,fontSize:12,marginBottom:4}}>
                  <span style={{fontWeight:600,color:"#1D4ED8",width:72}}>{f.numero}</span>
                  <span style={{color:"#6B7280",flex:1}}>{f.date}</span>
                  <span style={{fontWeight:600}}>{fmtFull(total)}</span>
                  <span style={S.badge(f.statut==="Payée"?"#DCFCE7":"#FEE2E2",f.statut==="Payée"?"#166534":"#DC2626")}>{f.statut}</span>
                  {f.statut==="Impayée"&&<button title="Marquer comme Payée" onClick={()=>{setPaiementFacture(f);setPaiementForm({mode:"",date:new Date().toISOString().split("T")[0]});setShowPaiementForm(true);}} style={{...S.btn("#059669"),padding:"2px 8px",fontSize:11}}>✓ Payée</button>}
                  {f.statut==="Payée"&&<button title="Remettre en Impayée" onClick={()=>marquerImpayee(f.id)} style={{...S.btn("#F59E0B"),padding:"2px 8px",fontSize:11}}>↺</button>}
                  <button title="Imprimer" onClick={()=>{const imp=factures.filter(x=>x.client_id===f.client_id&&x.statut==="Impayée"&&x.id!==f.id&&x.numero!==f.numero);const solde=soldeConsignes(f.client_id).reduce((s,r)=>s+r.solde*r.consigne,0);generatePDF(f,selClient,imp,solde,soldeConsignes(f.client_id));}} style={{...S.btn("#374151"),padding:"2px 8px",fontSize:11}}>🖨️</button>
                  <button title="Supprimer" onClick={()=>supprimerFacture(f.id,f.numero)} style={{...S.btn("#EF4444"),padding:"2px 8px",fontSize:11}}>🗑️</button>
                </div>
              );
            })
          )}
        </div>
      )}
      {clientTab==="visites"&&(()=>{
        const visites = (selClient.visites||[]).sort((a,b)=>b.date.localeCompare(a.date));
        const saveVisite = async () => {
          if (!visiteDate) return;
          const newVisites = [...(selClient.visites||[]), {date:visiteDate, note:visiteNote, id:Date.now()}];
          await db.update("clients", selClient.id, {visites:newVisites});
          setClients(prev=>prev.map(c=>c.id===selClient.id?{...c,visites:newVisites}:c));
          setVisiteDate(""); setVisiteNote(""); setShowVisiteForm(false);
        };
        const deleteVisite = async (vid) => {
          const newVisites = (selClient.visites||[]).filter(v=>v.id!==vid);
          await db.update("clients", selClient.id, {visites:newVisites});
          setClients(prev=>prev.map(c=>c.id===selClient.id?{...c,visites:newVisites}:c));
        };
        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:600,fontSize:13}}>Historique des visites commerciales</div>
              <button onClick={()=>{setShowVisiteForm(true);setVisiteDate(new Date().toISOString().split("T")[0]);setVisiteNote("");}}
                style={{...S.btn("#1D4ED8"),padding:"5px 12px",fontSize:12}}>+ Ajouter une visite</button>
            </div>
            {showVisiteForm&&(
              <div style={{background:"#F0F9FF",border:"1px solid #BFDBFE",borderRadius:8,padding:12,marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:3}}>Date de la visite</label>
                    <input type="date" value={visiteDate} onChange={e=>setVisiteDate(e.target.value)} style={S.input}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:3}}>Commercial</label>
                    <input value="f.aslan@bossok.lu" readOnly style={{...S.input,background:"#F9FAFB",color:"#6B7280"}}/>
                  </div>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:3}}>Remarques / Compte-rendu</label>
                  <textarea value={visiteNote} onChange={e=>setVisiteNote(e.target.value)}
                    placeholder="Résumé de la visite, commande prévue, points à suivre..."
                    style={{...S.input,height:80,resize:"vertical",fontFamily:"inherit"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveVisite} style={{...S.btn("#059669"),padding:"6px 16px",fontSize:12}}>💾 Enregistrer</button>
                  <button onClick={()=>setShowVisiteForm(false)} style={{...S.btn("#F3F4F6","#374151"),padding:"6px 12px",fontSize:12}}>Annuler</button>
                </div>
              </div>
            )}
            {visites.length===0?(
              <div style={{textAlign:"center",color:"#9CA3AF",padding:"32px 0",fontSize:13}}>
                <div style={{fontSize:32,marginBottom:8}}>📋</div>
                Aucune visite enregistrée
              </div>
            ):(
              <div>
                {visites.map((v,i)=>(
                  <div key={v.id||i} style={{padding:"10px 12px",background:i%2===0?"#fff":"#FAFAFA",borderRadius:8,marginBottom:6,border:"1px solid #F1F5F9"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontWeight:700,color:"#1D4ED8",fontSize:13}}>📅 {v.date}</span>
                          <span style={{fontSize:10,color:"#9CA3AF"}}>f.aslan@bossok.lu</span>
                        </div>
                        {v.note&&<div style={{fontSize:12,color:"#374151",lineHeight:1.5}}>{v.note}</div>}
                      </div>
                      <button onClick={()=>deleteVisite(v.id||i)} style={{...S.btn("#FEE2E2","#DC2626"),padding:"3px 8px",fontSize:10,marginLeft:8}}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {clientTab==="consignes"&&(
        <div>
          {creditConsignes(selClient.id)>0&&(
            <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:8,padding:12,marginBottom:12}}>
              <div style={{fontWeight:700,color:"#059669",fontSize:13}}>
                ♻️ Crédit consignes à déduire : {fmtFull(creditConsignes(selClient.id))}
              </div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:4}}>Ce crédit sera automatiquement appliqué sur la prochaine facture.</div>
            </div>
          )}
          <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#92400E"}}>
            ℹ️ Les consignes sont calculées uniquement sur les factures créées dans l'app. Les factures historiques importées ne sont pas comptabilisées — le solde repart de zéro.
          </div>
          {soldeConsignes(selClient.id).length===0?<div style={{textAlign:"center",color:"#9CA3AF",padding:"20px 0",fontSize:13}}>Aucune consigne en cours — le solde augmentera au fur et à mesure des livraisons.</div>:(
            soldeConsignes(selClient.id).map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"#F5F3FF",borderRadius:8,marginBottom:6,fontSize:13}}>
                <span style={{fontWeight:500}}>{r.nom}</span>
                <span style={{fontWeight:700,color:"#7C3AED"}}>{r.solde} cs · {fmtFull(r.solde*r.consigne)}</span>
              </div>
            ))
          )}
        </div>
      )}
      {clientTab==="prix"&&(
        <div>
          <div style={{fontSize:12,color:"#6B7280",marginBottom:8}}>Tarif standard : {selClient.type}. Entrez un prix pour personnaliser.</div>
          <div style={{maxHeight:360,overflowY:"auto",display:"grid",gap:3}}>
            {produits.filter(p=>p.statut!=="Passif").map(p=>{
              const prix = p.prix || {};
              const standard = prix[selClient.type] || prix.Snack || 0;
              const perso=(selClient.prix_individuels||{})[p.id];
              return(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"#F9FAFB",borderRadius:6}}>
                  <span style={{fontSize:11,flex:1}}>{p.nom}</span>
                  <span style={{fontSize:11,color:"#9CA3AF",width:60}}>{fmtFull(standard)}</span>
                  <input type="number" step="0.01" placeholder={standard.toFixed(2)} value={perso!==undefined?perso:""}
                    onChange={e=>updatePrixIndividuel(selClient.id,p.id,e.target.value)}
                    style={{width:72,padding:"3px 6px",border:(perso!==undefined?"1px solid #7C3AED":"1px solid #E5E7EB"),borderRadius:6,fontSize:11,outline:"none",background:perso!==undefined?"#F5F3FF":"#fff"}}/>
                  {perso!==undefined&&<button onClick={()=>updatePrixIndividuel(selClient.id,p.id,"")} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer"}}>✕</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  </div>
)}

{/* ══ PAGE FACTURE (nouvelle / édition) ══════════════════════════ */}
{page==="factures" && showFactForm&&(
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>{editingFacture ? "Modifier la facture" : "Nouvelle facture"}</h2>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Client *</label>
          {factClientId?(
            <div style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,fontSize:13}}>
              <span style={{fontWeight:500}}>{clients.find(c=>c.id===factClientId)?.nom}</span>
              <button onClick={()=>{setFactClientId(null);setSearchFactClient("");}} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer"}}>✕</button>
            </div>
          ):(
            <div style={{position:"relative"}}>
              <input value={searchFactClient} onChange={e=>setSearchFactClient(e.target.value)} placeholder="🔍 Rechercher..." style={S.input}/>
              {searchFactClient&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:50,maxHeight:200,overflowY:"auto"}}>
                  {clientsActifs.filter(c=>c.nom?.toLowerCase().includes(searchFactClient.toLowerCase())).slice(0,6).map(c=>(
                    <div key={c.id} onClick={()=>{setFactClientId(c.id);setSearchFactClient("");if(!editingFacture)setFactNoteClient(c.commentaire_facture||"");setTimeout(()=>addCreditConsignes(c.id),100);}} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #F1F5F9"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      {c.nom}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>N° Facture</label>
          <input value={factNumero} onChange={e=>setFactNumero(e.target.value)} placeholder="Auto-généré selon la date" style={{...S.input, fontWeight:600, color:"#1D4ED8"}}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date</label>
          <input type="date" value={factDate} onChange={e=>{
            const newDate = e.target.value;
            setFactDate(newDate);
            if(!editingFacture && !factNumero) setFactNumero(genererNumeroFacture(newDate));
            const ech = new Date(newDate); ech.setDate(ech.getDate()+7);
            setFactEcheance(ech.toISOString().split("T")[0]);
          }} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Échéance (J+7 auto)</label>
          <input type="date" value={factEcheance} onChange={e=>setFactEcheance(e.target.value)} style={S.input}/>
        </div>
      </div>
      {factClientId&&!editingFacture&&(()=>{
        const dispoNC = creditsDisponibles(factClientId).filter(nc=>!factLignes.some(l=>l.produitId==="NOTE_CREDIT"&&l.noteCredit===nc.numero));
        if (dispoNC.length===0) return null;
        const cl = clients.find(c=>c.id===factClientId);
        const tvaPct = clientEstExonere(cl)?0:3;
        const base = factLignes.filter(l=>l.produitId!=="NOTE_CREDIT");
        const du = base.length ? totalFact(base, tvaPct).total : 0;
        const deja = factLignes.filter(l=>l.produitId==="NOTE_CREDIT").reduce((s,l)=>s+Math.abs(l.qte*l.pu),0);
        const reste = Math.max(0, du - deja);
        return(
          <div style={{background:"#F5F3FF",border:"1px solid #C4B5FD",borderRadius:8,padding:10,marginBottom:12}}>
            <div style={{fontWeight:600,color:"#6D28D9",fontSize:12,marginBottom:6}}>🧾 Notes de crédit disponibles pour ce client</div>
            {dispoNC.map(nc=>{
              const restant = parseFloat(nc.credit_restant)||0;
              const m = Math.round(Math.min(restant, reste)*100)/100;
              return(
                <div key={nc.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,fontSize:12,marginBottom:4}}>
                  <span>{nc.numero} — <b>{fmtFull(restant)}</b> dispo</span>
                  <button disabled={m<=0} onClick={()=>setFactLignes(prev=>[...prev,{produitId:"NOTE_CREDIT",nom:"Note de crédit "+nc.numero,qte:1,pu:-m,consigne:0,noteCredit:nc.numero}])}
                    style={{...S.btn("#6D28D9"),padding:"4px 10px",fontSize:11,opacity:m<=0?0.5:1}}>{m>0?"Déduire "+fmtFull(m):"Ajoute d'abord des produits"}</button>
                </div>
              );
            })}
            <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>Le montant déduit est plafonné au total de la facture. Le solde restant reste disponible.</div>
          </div>
        );
      })()}
      {factClientId&&creditConsignes(factClientId)>0&&(
        <div style={{background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:8,padding:10,marginBottom:12}}>
          <div style={{fontWeight:600,color:"#059669",fontSize:12,marginBottom:4}}>
            ♻️ Crédit consignes disponible : <strong>{new Intl.NumberFormat("fr-LU",{style:"currency",currency:"EUR"}).format(creditConsignes(factClientId))}</strong>
          </div>
          <div style={{fontSize:11,color:"#6B7280"}}>Ce montant sera automatiquement déduit de cette facture.</div>
        </div>
      )}

      {factClientId&&clientImpayees(factClientId).length>0&&(
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:10,marginBottom:12}}>
          <div style={{fontWeight:600,color:"#DC2626",fontSize:12,marginBottom:6}}>⚠️ Factures impayées de ce client :</div>
          {clientImpayees(factClientId).map(f=>(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
              <span>{f.numero} — {f.date} (éch. {f.echeance})</span>
              <span style={{fontWeight:700,color:"#DC2626"}}>{fmtFull(resteFact(f))}</span>
            </div>
          ))}
          <div style={{fontSize:11,color:"#DC2626",fontWeight:600,marginTop:4}}>
            Total dû : {fmtFull(clientImpayees(factClientId).reduce((s,f)=>s+resteFact(f),0))}
          </div>
        </div>
      )}
      {(()=>{
        const factClient = clients.find(c=>c.id===factClientId);
        if (!factClient || !EXPORT_REGIONS.includes(factClient.region) || tvaIntracomValide(factClient)) return null;
        return(
          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#92400E"}}>
            🧾 <strong>Client {factClient.region} sans n° de TVA intracommunautaire valide.</strong> Cette facture sera émise à 0% de TVA, mais l'exonération n'est légale qu'avec un n° {TVA_PREFIX[factClient.region]}... valide. Complète-le dans la fiche client avant d'envoyer.
          </div>
        );
      })()}
      {factClientId&&(
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:4}}>Produits</label>
          <div style={{maxHeight:180,overflowY:"auto",border:"1px solid #E5E7EB",borderRadius:8}}>
            {produits.filter(p=>p.statut!=="Passif").map(p=>{
              const client=clients.find(c=>c.id===factClientId);
              const pu=getClientPrix(p,client);
              const cons=p.type_emballage==="VC"?(CONSIGNE_PRIX[p.consigne]||0):0;
              return(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderBottom:"1px solid #F1F5F9"}}>
                  <span style={{fontSize:11,flex:1}}>{p.nom}</span>
                  <span style={{fontSize:11,color:"#6B7280",width:58}}>{fmtFull(pu)}</span>
                  {cons>0&&<span style={{fontSize:10,color:"#7C3AED",width:62}}>+{fmtFull(cons)}🫙</span>}
                  <button onClick={()=>addLigneFact(p,clients.find(c=>c.id===factClientId))} style={{...S.btn(),padding:"2px 10px",fontSize:11}}>+</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {factLignes.length>0&&(
        <div style={{marginBottom:12,border:"1px solid #E5E7EB",borderRadius:8,overflow:"hidden"}}>
          {factLignes.map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderBottom:"1px solid #F1F5F9",fontSize:12,background:l.offert?"#FFFBEB":"transparent"}}>
              <span style={{flex:1,color:l.offert?"#B45309":"inherit",fontStyle:l.offert?"italic":"normal"}}>{l.nom}</span>
              {l.produitId==="NOTE_CREDIT" ? (
                <input type="number" min="0" step="0.01" value={Math.abs(l.pu)} onChange={e=>{const v=Math.abs(parseFloat(e.target.value)||0);setFactLignes(prev=>prev.map((x,j)=>j===i?{...x,qte:1,pu:-v}:x));}} style={{width:78,padding:"2px 6px",border:"1px solid #C4B5FD",borderRadius:6,fontSize:12}}/>
              ) : (
              <input type="number" min="1" value={l.qte} onChange={e=>setFactLignes(prev=>prev.map((x,j)=>j===i?{...x,qte:parseInt(e.target.value)||1}:x))} style={{width:48,padding:"2px 6px",border:"1px solid #E5E7EB",borderRadius:6,fontSize:12}}/>
              )}
              <span style={{width:64,textAlign:"right"}}>{fmtFull(l.qte*l.pu)}</span>
              {l.consigne>0&&<span style={{width:64,textAlign:"right",color:"#7C3AED"}}>+{fmtFull(l.qte*l.consigne)}</span>}
              {!l.offert&&l.produitId!=="CONSIGNE_MANUELLE"&&l.produitId!=="CREDIT_CONSIGNES"&&l.produitId!=="NOTE_CREDIT"&&!l.isCredit&&(
                <button onClick={()=>offrirUniteFact(i)} title="Offrir 1 unité de cette ligne (gratuit)" style={{background:"none",border:"none",color:"#D97706",cursor:"pointer",fontSize:13}}>🎁</button>
              )}
              <button onClick={()=>setFactLignes(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer"}}>✕</button>
            </div>
          ))}
          <div style={{padding:"7px 10px",background:"#F9FAFB",display:"flex",justifyContent:"flex-end",gap:14,fontSize:12}}>
            <span>HT : <b>{fmtFull(factLignes.filter(l=>l.produitId!=="NOTE_CREDIT").reduce((s,l)=>s+l.qte*l.pu,0))}</b></span>
            {factLignes.some(l=>l.consigne>0)&&<span style={{color:"#7C3AED"}}>Consignes : <b>{fmtFull(factLignes.reduce((s,l)=>s+l.qte*(l.consigne||0),0))}</b></span>}
            {factLignes.some(l=>l.produitId==="NOTE_CREDIT")&&<span style={{color:"#6D28D9"}}>Notes de crédit : <b>{fmtFull(factLignes.filter(l=>l.produitId==="NOTE_CREDIT").reduce((s,l)=>s+l.qte*l.pu,0))}</b></span>}
            {factLignes.some(l=>l.produitId==="NOTE_CREDIT")
              ? <span style={{fontWeight:700}}>Reste à payer (TTC) : <b>{fmtFull(totalFact(factLignes, clientEstExonere(clients.find(c=>c.id===factClientId))?0:3).total)}</b></span>
              : <span style={{fontWeight:700}}>Total : <b>{fmtFull(factLignes.reduce((s,l)=>s+l.qte*(l.pu+(l.consigne||0)),0))}</b></span>}
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1.4fr 0.7fr 1.2fr 0.9fr auto",gap:6,marginBottom:12,alignItems:"end"}}>
        <div>
          <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:2}}>♻️ Consigne manuelle <span style={{color:"#D1D5DB"}}>(optionnel)</span></label>
          <input value={manualConsigneLabel} onChange={e=>setManualConsigneLabel(e.target.value)}
            placeholder="Libellé (ex: Coca VC)" style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:2}}>Quantité</label>
          <input type="number" min="1" value={manualConsigneQte} onChange={e=>setManualConsigneQte(e.target.value)} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:2}}>Consigne unitaire</label>
          <select value={manualConsigneUnitaire} onChange={e=>setManualConsigneUnitaire(e.target.value)} style={S.input}>
            <option value="">— Choisir —</option>
            {Object.entries(CONSIGNE_PRIX).map(([taille,prix])=>(
              <option key={taille} value={taille}>{taille} — {prix.toFixed(2)} €</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:2}}>Sens</label>
          <select value={manualConsigneSens} onChange={e=>setManualConsigneSens(e.target.value)} style={S.input}>
            <option value="plus">+ Consigne</option>
            <option value="retour">− Retour</option>
          </select>
        </div>
        <button onClick={()=>{
          const qte = parseFloat(manualConsigneQte)||0;
          const prix = prixConsigne(manualConsigneUnitaire);
          if (!qte || !prix) return;
          const montant = qte*prix*(manualConsigneSens==="retour"?-1:1);
          setFactLignes(prev=>[...prev, {
            produitId:"CONSIGNE_MANUELLE",
            nom: libelleConsigne({label:manualConsigneLabel, taille:manualConsigneUnitaire, qte:manualConsigneQte, sens:manualConsigneSens}),
            qte:1, pu:montant, consigne:0, isCredit: montant<0,
          }]);
          setManualConsigneLabel(""); setManualConsigneQte("1"); setManualConsigneUnitaire(""); setManualConsigneSens("plus");
        }} disabled={!manualConsigneQte||!manualConsigneUnitaire} style={{...S.btn("#F5F3FF","#7C3AED"),padding:"9px 14px",opacity:(manualConsigneQte&&manualConsigneUnitaire)?1:0.5}}>+ Ajouter</button>
      </div>
      {factLignes.some(l=>l.produitId==="TRANSPORT_MANUEL") ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,marginBottom:12,fontSize:12}}>
          <span>🚚 Transport : <b>{fmtFull(factLignes.find(l=>l.produitId==="TRANSPORT_MANUEL")?.pu||0)}</b> <span style={{color:"#6B7280"}}>(TVA {TVA_TRANSPORT_PCT}% incluse au total)</span></span>
          <button onClick={()=>setFactLignes(prev=>prev.filter(l=>l.produitId!=="TRANSPORT_MANUEL"))} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer"}}>✕</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:6,marginBottom:12,alignItems:"end"}}>
          <div style={{flex:1}}>
            <label style={{fontSize:11,color:"#6B7280",display:"block",marginBottom:2}}>🚚 Transport <span style={{color:"#D1D5DB"}}>(optionnel — TVA {TVA_TRANSPORT_PCT}%)</span></label>
            <input type="number" min="0" step="0.01" value={factTransportMontant} onChange={e=>setFactTransportMontant(e.target.value)} placeholder="Montant en €" style={S.input}/>
          </div>
          <button onClick={()=>{
            const montant = parseFloat(factTransportMontant)||0;
            if (!montant) return;
            setFactLignes(prev=>[...prev, {produitId:"TRANSPORT_MANUEL", nom:"Transport", qte:1, pu:montant, consigne:0}]);
            setFactTransportMontant("");
          }} disabled={!factTransportMontant} style={{...S.btn("#EFF6FF","#1D4ED8"),padding:"9px 14px",opacity:factTransportMontant?1:0.5}}>+ Ajouter</button>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes internes</label>
        <input value={factNotes} onChange={e=>setFactNotes(e.target.value)} placeholder="Notes optionnelles, non visibles par le client..." style={S.input}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Message pour le client <span style={{color:"#9CA3AF"}}>(imprimé sur la facture)</span></label>
        <input value={factNoteClient} onChange={e=>setFactNoteClient(e.target.value)} placeholder="Ex: Merci pour votre commande, à bientôt !" style={S.input}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{closeWorkTab("facture");setEditingFacture(null);setFactNumero("");setFactEcheance("");}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveFact} disabled={saving} style={{...S.btn(),flex:2,opacity:saving?0.6:1}}>
          {saving?"Sauvegarde...":editingFacture?"Enregistrer les modifications":"Créer la facture"}
        </button>
      </div>
    </div>
  </div>
)}

{/* ══ FACTURES DIVERSES (liste) ═════════════════════════════════ */}
{page==="diverses" && !showDiverseForm && (()=>{
  const fd = facturesDiverses.filter(f=>{
    const matchStatut = fdFilterStatut==="Tous" || f.statut===fdFilterStatut;
    const matchSearch = !fdFilterSearch || f.destinataire_nom?.toLowerCase().includes(fdFilterSearch.toLowerCase()) || String(f.numero||"").toLowerCase().includes(fdFilterSearch.toLowerCase());
    return matchStatut && matchSearch;
  });
  const totalImpaye = facturesDiverses.filter(f=>f.statut==="Impayée").reduce((s,f)=>s+totalFactDiverse(f.lignes,f.tva_pct).total,0);

  return (
  <div>
    {workTabStrip()}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Total",v:facturesDiverses.length,c:"#1D4ED8",s:"Tous"},
        {l:"Impayées",v:facturesDiverses.filter(f=>f.statut==="Impayée").length,c:"#DC2626",s:"Impayée",sub:fmtFull(totalImpaye)},
        {l:"Payées",v:facturesDiverses.filter(f=>f.statut==="Payée").length,c:"#059669",s:"Payée"},
      ].map((k,i)=>(
        <div key={i} style={{...S.kpi(k.c),cursor:"pointer",outline:fdFilterStatut===k.s?"2px solid "+k.c:"none"}} onClick={()=>setFdFilterStatut(k.s)}>
          <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          <div style={{fontSize:11,color:"#374151",fontWeight:600}}>{k.l}</div>
          {k.sub&&<div style={{fontSize:11,color:k.c,fontWeight:700}}>{k.sub}</div>}
        </div>
      ))}
    </div>

    <div style={{...S.card,marginBottom:12,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      <input value={fdFilterSearch} onChange={e=>setFdFilterSearch(e.target.value)} placeholder="🔍 Rechercher destinataire ou N°..." style={{...S.input,flex:1,minWidth:180}}/>
      <select value={fdFilterStatut} onChange={e=>setFdFilterStatut(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,background:"#F9FAFB"}}>
        <option value="Tous">Tous les statuts</option>
        <option value="Impayée">⚠ Impayées</option>
        <option value="Payée">✓ Payées</option>
      </select>
    </div>

    <DataTable
      isMobile={isMobile}
      rows={fd}
      exportName="factures_diverses"
      onRowClick={openEditDiverse}
      pageSize={20}
      emptyIcon="🧾"
      emptyMessage="Aucune facture diverse"
      initialSort={{key:"date",dir:"desc"}}
      columns={[
        {key:"numero", label:"N°", mobilePrimary:true, render:f=><strong>{f.numero}</strong>},
        {key:"destinataire_nom", label:"Destinataire", mobileShow:true, sortValue:f=>f.destinataire_nom||""},
        {key:"date", label:"Date", mobileShow:true},
        {key:"montant", label:"Montant", align:"right", mobileShow:true, sortValue:f=>totalFactDiverse(f.lignes,f.tva_pct).total,
          render:f=>fmtFull(totalFactDiverse(f.lignes,f.tva_pct).total)},
        {key:"statut", label:"Statut", mobileShow:true, render:f=>(
          <span style={S.badge(f.statut==="Payée"?"#DCFCE7":"#FEE2E2", f.statut==="Payée"?"#166534":"#DC2626")}>{f.statut}</span>
        )},
        {key:"pj", label:"📎", align:"center", sortable:false, render:f=>(f.pieces_jointes||[]).length||""},
        {key:"actions", label:"", align:"right", sortable:false, render:f=>(
          <>
            <button title="Imprimer" onClick={e=>{e.stopPropagation();generatePDFDiverse(f);}} style={{...S.btn("#374151"),padding:"2px 8px",fontSize:11,marginRight:6}}>🖨️</button>
            {f.statut==="Impayée" ? (
              <button title="Marquer payée" onClick={e=>{e.stopPropagation();setPaiementDiverse(f);setPaiementDiverseForm({date:localDateStr()});setShowPaiementDiverseForm(true);}} style={{...S.btn("#DCFCE7","#166534"),padding:"2px 8px",fontSize:11,marginRight:6}}>💰</button>
            ) : (
              <button title="Marquer impayée" onClick={e=>{e.stopPropagation();marquerDiverseImpayee(f.id);}} style={{...S.btn("#FEE2E2","#DC2626"),padding:"2px 8px",fontSize:11,marginRight:6}}>↩</button>
            )}
            <button title="Supprimer" onClick={e=>{e.stopPropagation();supprimerDiverse(f.id,f.numero);}} style={{...S.btn("#FEE2E2","#DC2626"),padding:"2px 8px",fontSize:11}}>🗑️</button>
          </>
        )},
      ]}
    />
  </div>
  );
})()}

{/* ══ FACTURES DIVERSES (formulaire) ═════════════════════════════ */}
{page==="diverses" && showDiverseForm&&(
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>{editingDiverse ? "Modifier la facture" : "Nouvelle facture diverse"}</h2>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>N° Facture</label>
          <input value={fdNumero} onChange={e=>setFdNumero(e.target.value)} placeholder="Auto-généré selon la date" style={{...S.input, fontWeight:600, color:"#1D4ED8"}}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date</label>
          <input type="date" value={fdDate} onChange={e=>{
            const newDate = e.target.value;
            setFdDate(newDate);
            if(!editingDiverse && !fdNumero) setFdNumero(genererNumeroFactureDiverse(newDate));
          }} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Échéance</label>
          <input type="date" value={fdEcheance} onChange={e=>setFdEcheance(e.target.value)} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>TVA (%)</label>
          <input type="number" min="0" max="100" step="0.1" value={fdTvaPct} onChange={e=>setFdTvaPct(e.target.value)} style={S.input}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Destinataire (nom / société) *</label>
          <input value={fdDestNom} onChange={e=>setFdDestNom(e.target.value)} placeholder="Ex: Logico Sàrl" style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>N° TVA (optionnel)</label>
          <input value={fdDestTva} onChange={e=>setFdDestTva(e.target.value)} placeholder="Ex: LU12345678" style={S.input}/>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Adresse</label>
        <input value={fdDestAdresse} onChange={e=>setFdDestAdresse(e.target.value)} placeholder="Adresse complète" style={S.input}/>
      </div>

      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:4}}>Lignes</label>
        {fdLignes.length>0&&(
          <div style={{border:"1px solid #E5E7EB",borderRadius:8,marginBottom:8,overflow:"hidden"}}>
            {fdLignes.map((l,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderBottom:i<fdLignes.length-1?"1px solid #F1F5F9":"none",fontSize:13}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.description}</div>
                  <div style={{color:"#6B7280",fontSize:11}}>{l.qte} × {fmtFull(l.pu)} = {fmtFull(l.qte*l.pu)}</div>
                </div>
                <button onClick={()=>supprimerLigneDiverse(i)} style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",padding:4}}><Icon name="close" size={14}/></button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr auto",gap:8}}>
          <input value={fdLigneDesc} onChange={e=>setFdLigneDesc(e.target.value)} placeholder="Description (ex: Palette EUR qualité 1)" style={S.input}/>
          <input type="number" min="0" step="0.01" value={fdLigneQte} onChange={e=>setFdLigneQte(e.target.value)} placeholder="Qté" style={S.input}/>
          <input type="number" min="0" step="0.01" value={fdLignePu} onChange={e=>setFdLignePu(e.target.value)} placeholder="Prix unit." style={S.input}/>
          <button onClick={ajouterLigneDiverse} disabled={!fdLigneDesc.trim()||!parseFloat(fdLigneQte)} style={{...S.btn("#EFF6FF","#1D4ED8"),opacity:(!fdLigneDesc.trim()||!parseFloat(fdLigneQte))?0.5:1}}>+ Ajouter</button>
        </div>
        {fdLignes.length>0&&(
          <div style={{textAlign:"right",marginTop:8,fontSize:13,fontWeight:700,color:"#1D4ED8"}}>
            Total TTC : {fmtFull(totalFactDiverse(fdLignes, fdTvaPct).total)}
          </div>
        )}
      </div>

      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes internes</label>
        <input value={fdNotes} onChange={e=>setFdNotes(e.target.value)} placeholder="Notes optionnelles..." style={S.input}/>
      </div>

      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Documents joints</label>
        {fdFichiers.length>0&&(
          <div style={{marginBottom:8}}>
            {fdFichiers.map((doc,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,fontSize:13,marginBottom:6}}>
                <span onClick={()=>consulterFichierDiverse(doc.chemin)} style={{color:"#166534",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",flex:1}}>📎 {doc.nom}</span>
                <button onClick={()=>supprimerFichierDiverse(i)} style={{background:"none",border:"none",color:"#166534",cursor:"pointer",flexShrink:0}}><Icon name="close" size={14}/></button>
              </div>
            ))}
          </div>
        )}
        <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:"1px dashed #CBD5E1",borderRadius:8,cursor:fdFichierEnAttente?"default":"pointer",fontSize:13,color:"#64748B",background:"#F8FAFC"}}>
          <Icon name="produits" size={16} style={{color:"#94A3B8"}}/>
          {fdFichierEnAttente ? "Envoi en cours..." : "Ajouter une photo ou un PDF (le document reçu, etc.)"}
          <input type="file" accept="image/*,application/pdf" multiple style={{display:"none"}} disabled={!!fdFichierEnAttente}
            onChange={e=>{ const files=[...(e.target.files||[])]; files.forEach(f=>ajouterFichierDiverse(f)); e.target.value=""; }}/>
        </label>
      </div>

      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{closeWorkTab("diverse");setEditingDiverse(null);setFdNumero("");}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveDiverse} disabled={saving} style={{...S.btn(),flex:2,opacity:saving?0.6:1}}>
          {saving?"Sauvegarde...":editingDiverse?"Enregistrer les modifications":"Créer la facture"}
        </button>
      </div>
    </div>
  </div>
)}

  {/* ══ MODAL RETOUR CONSIGNES ══════════════════════════════════════ */}
  {showRetour&&(
  <div style={S.modal} onClick={()=>setShowRetour(null)}>
    <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>♻️ Retour de consignes</h2>
        <button onClick={()=>setShowRetour(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      {(()=>{
        const f=factures.find(x=>x.id===showRetour);
        const vcLignes=(f?.lignes||[]).filter(l=>l.consigne>0);
        return(
          <div>
            <div style={{fontSize:12,color:"#6B7280",marginBottom:10}}>Caisses retournées :</div>
            {vcLignes.map((l,i)=>{
              const key=l.nom+"|||"+l.consigne;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,fontSize:13}}>
                  <span style={{flex:1}}>{l.nom}</span>
                  <span style={{fontSize:11,color:"#7C3AED"}}>max {l.qte}</span>
                  <input type="number" min="0" max={l.qte} value={retourQtes[key]||0} onChange={e=>setRetourQtes(p=>({...p,[key]:e.target.value}))} style={{width:60,padding:"4px 8px",border:"1px solid #7C3AED",borderRadius:6,fontSize:13}}/>
                </div>
              );
            })}
            <div style={{background:"#F5F3FF",borderRadius:8,padding:10,marginTop:10,fontWeight:700,color:"#7C3AED",fontSize:13}}>
              Avoir : {fmtFull(Object.entries(retourQtes).reduce((s,[k,q])=>{const cu=parseFloat(k.split("|||")[1])||0;return s+(parseFloat(q)||0)*cu;},0))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>setShowRetour(null)} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
              <button onClick={saveRetour} disabled={saving} style={{...S.btn("#7C3AED"),flex:2,opacity:saving?0.5:1}}>{saving?"Sauvegarde...":"Enregistrer"}</button>
            </div>
          </div>
        );
      })()}
    </div>
  </div>
  )}

  {/* ══ MODAL IMPRIMER APRES CREATION ══════════════════════════════ */}
  {lastFacture && (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:420,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
      <div style={{fontSize:48,marginBottom:12}}>✅</div>
      <div style={{fontWeight:700,fontSize:18,marginBottom:4}}>Facture créée !</div>
      <div style={{fontSize:13,color:"#6B7280",marginBottom:20}}>{lastFacture.facture.numero} — {lastFacture.facture.client_nom}</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <button onClick={()=>{
          const imp=factures.filter(x=>x.client_id===lastFacture.facture.client_id&&x.statut==="Impayée"&&x.numero!==lastFacture.facture.numero);
          const solde=soldeConsignes(lastFacture.facture.client_id).reduce((s,r)=>s+r.solde*r.consigne,0);
          generatePDF(lastFacture.facture,lastFacture.client,imp,solde,soldeConsignes(lastFacture.facture.client_id));
          setLastFacture(null);
        }} style={{padding:"10px 20px",background:"#1D4ED8",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>
          🖨️ Imprimer la facture
        </button>
        <button onClick={()=>setLastFacture(null)} style={{padding:"10px 20px",background:"#F3F4F6",color:"#374151",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>
          Plus tard
        </button>
      </div>
    </div>
  </div>
  )}


  {/* ══ MODAL CLIENT FORM ══════════════════════════════════════════ */}
  {showClientForm&&(
  <div style={S.modal} onClick={()=>setShowClientForm(false)}>
    <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>{editClient?"Modifier client":"Nouveau client"}</h2>
        <button onClick={()=>setShowClientForm(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Nature du client</label>
          <select value={clientForm.nature_client||"Professionnel"} onChange={e=>setClientForm(p=>({...p,nature_client:e.target.value}))} style={S.input}>
            <option value="Professionnel">Professionnel</option>
            <option value="Particulier">Particulier</option>
          </select>
        </div>
        {(clientForm.nature_client==="Particulier"
          ? [["Nom *","nom","text"],["Adresse","adresse","text"],["Téléphone","telephone","text"],["Email","email","email"]]
          : [["Nom / Raison sociale *","nom","text"],["Adresse","adresse","text"],["Téléphone","telephone","text"],["Email","email","email"],["N° TVA","tva","text"],["N° RCS","rcs","text"],["Personne de contact","contact","text"]]
        ).map(([l,k,t])=>(
          <div key={k}>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>{l}</label>
            <input type={t} value={clientForm[k]||""} onChange={e=>{
            const val = e.target.value;
            const updates = {...clientForm, [k]: val};
            // Auto-detect region from address
            if (k === "adresse" && val.length > 5) {
              const detected = detectRegionFromAddress(val);
              if (detected && !clientForm.region) updates.region = detected;
            }
            setClientForm(updates);
          }} style={S.input}/>
          </div>
        ))}
        {/* Pays — détermine la TVA (0% hors Luxembourg). Champ explicite, choisi par l'utilisateur. */}
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Pays</label>
          {clientForm.pays==="__autre__" ? (
            <div style={{display:"flex",gap:6}}>
              <input autoFocus value={clientForm.paysAutre||""} onChange={e=>setClientForm(p=>({...p,paysAutre:e.target.value}))}
                placeholder="Nom du pays" style={S.input}/>
              <button type="button" onClick={()=>setClientForm(p=>({...p,pays:"Luxembourg",paysAutre:""}))}
                style={{...S.btn("#F1F5F9","#374151"),padding:"0 12px",fontSize:12}}>Annuler</button>
            </div>
          ) : (
            <select value={clientForm.pays||"Luxembourg"} onChange={e=>{
              const val = e.target.value;
              if (val==="__autre__") setClientForm(p=>({...p,pays:"__autre__",paysAutre:""}));
              else setClientForm(p=>({...p,pays:val}));
            }} style={S.input}>
              <option value="Luxembourg">Luxembourg</option>
              <option value="France">France</option>
              <option value="Belgique">Belgique</option>
              <option value="Allemagne">Allemagne</option>
              <option value="Hollande">Hollande</option>
              <option value="__autre__">Autre pays...</option>
            </select>
          )}
          {clientForm.pays && clientForm.pays!=="Luxembourg" && (
            <div style={{fontSize:10,color:"#7C3AED",marginTop:3}}>
              ♻️ TVA 0% appliquée automatiquement sur les factures de ce client (hors Luxembourg).
            </div>
          )}
        </div>
        {/* Zone de livraison (Luxembourg uniquement) avec auto-détection */}
        <div style={{marginBottom:0}}>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Zone de livraison</label>
          <select value={clientForm.region||""} onChange={e=>setClientForm(p=>({...p,region:e.target.value}))}
            style={{...S.input,borderColor:clientForm.region?"#059669":"#E5E7EB"}}>
            <option value="">-- Sélectionner --</option>
            {["Centre-ville","Nord","Nord-ouest","Nord-Est","Est","Sud","Sud-ouest","Sud-Est","Ouest"].map(r=>(
              <option key={r} value={r}>{r} {ZONE_SCHEDULE[r] ? " · " + ZONE_SCHEDULE[r].driver + " (" + (ZONE_SCHEDULE[r].days||[]).join(", ") + ")" : ""}</option>
            ))}
          </select>
          {clientForm.adresse && detectRegionFromAddress(clientForm.adresse) && (
            <div style={{fontSize:10,color:"#059669",marginTop:3}}>
              ✅ Zone auto-détectée depuis l'adresse : <strong>{detectRegionFromAddress(clientForm.adresse)}</strong>
              {!clientForm.region && <button onClick={()=>setClientForm(p=>({...p,region:detectRegionFromAddress(p.adresse)}))}
                style={{...S.btn("#059669"),padding:"1px 6px",fontSize:9,marginLeft:6}}>Appliquer</button>}
            </div>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          {[["Type","type",["Snack","Restaurant","Café","Market","Administrative","Creche","Distributor","Privé"]],["Statut","statut",["Actif","Passif"]],["Conditions","conditions",["Comptant","7 jours","15 jours","30 jours","45 jours","60 jours"]],["Fidélité","categorie_fidelite",["Aucune","Gold","Silver"]]].map(([l,k,opts])=>(
            <div key={k}>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>{l}</label>
              <select value={clientForm[k]||opts[0]} onChange={e=>setClientForm(p=>({...p,[k]:e.target.value==="Aucune"?"":e.target.value}))} style={S.input}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Mode de facturation</label>
          <select value={clientForm.mode_facturation||"commande"} onChange={e=>setClientForm(p=>({...p,mode_facturation:e.target.value}))} style={S.input}>
            <option value="commande">À chaque commande (par défaut)</option>
            <option value="groupee">Groupée — je choisis quand facturer plusieurs livraisons ensemble</option>
          </select>
          {clientForm.mode_facturation==="groupee" && (
            <div style={{fontSize:11,color:"#7C3AED",marginTop:4}}>
              ♻️ Les commandes de ce client ne génèreront plus de facture automatique. Tu les factureras groupées depuis sa fiche.
            </div>
          )}
        </div>

        <label style={{display:"flex",alignItems:"flex-start",gap:8,padding:"10px 12px",background:clientForm.tva_exoneree?"#EFF6FF":"#F8FAFC",border:"1px solid "+(clientForm.tva_exoneree?"#BFDBFE":"#E3E7ED"),borderRadius:8,cursor:"pointer"}}>
          <input type="checkbox" checked={!!clientForm.tva_exoneree} onChange={e=>setClientForm(p=>({...p,tva_exoneree:e.target.checked}))} style={{marginTop:2}}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#1D4ED8"}}>Appliquer TVA 0% (exonération manuelle)</div>
            <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>
              À cocher toi-même quand la région du client est absente ou incertaine, mais que tu sais que ce client doit être exonéré. Prend le dessus sur la détection automatique par région.
            </div>
          </div>
        </label>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Commentaire facture (par défaut)</label>
            <textarea value={clientForm.commentaire_facture||""} onChange={e=>setClientForm(p=>({...p,commentaire_facture:e.target.value}))} placeholder="Affiché sous l'échéance sur les factures de ce client (modifiable à chaque facture)" style={{...S.input,minHeight:70,resize:"vertical",fontFamily:"inherit"}}/>
          </div>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Commentaire BL (par défaut)</label>
            <textarea value={clientForm.commentaire_bl||""} onChange={e=>setClientForm(p=>({...p,commentaire_bl:e.target.value}))} placeholder="Affiché sur les bons de livraison de ce client (modifiable à chaque BL)" style={{...S.input,minHeight:70,resize:"vertical",fontFamily:"inherit"}}/>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>setShowClientForm(false)} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveClient} disabled={saving} style={{...S.btn(),flex:2,opacity:saving?0.5:1}}>{saving?"Sauvegarde...":editClient?"Enregistrer":"Créer"}</button>
      </div>
    </div>
  </div>
  )}

{/* ══ PAGE PRODUIT (nouveau / édition) ══════════════════════════ */}
{page==="produits" && showProduitForm&&(
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>{editProduit?"Modifier produit":"Nouveau produit"}</h2>
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Nom du produit *</label>
          <input value={produitForm.nom||""} onChange={e=>setProduitForm(p=>({...p,nom:e.target.value}))}
            placeholder="Ex: COCA COLA CANS 24x33cl" style={S.input}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Catégorie *</label>
            {produitForm.categorie==="__new__" ? (
              <div style={{display:"flex",gap:6}}>
                <input autoFocus value={produitForm.categorieNouvelle||""} onChange={e=>setProduitForm(p=>({...p,categorieNouvelle:e.target.value}))}
                  placeholder="Nom de la nouvelle catégorie" style={S.input}/>
                <button type="button" onClick={()=>setProduitForm(p=>({...p,categorie:"",categorieNouvelle:""}))}
                  style={{...S.btn("#F1F5F9","#374151"),padding:"0 12px",fontSize:12}}>Annuler</button>
              </div>
            ) : (
              <select value={produitForm.categorie||""} onChange={e=>{
                const val = e.target.value;
                if (val==="__new__") setProduitForm(p=>({...p,categorie:"__new__",categorieNouvelle:""}));
                else setProduitForm(p=>({...p,categorie:val}));
              }} style={S.input}>
                <option value="">— Choisir —</option>
                {[...new Set(produits.map(p=>p.categorie))].sort().map(c=><option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ Nouvelle catégorie...</option>
              </select>
            )}
          </div>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Type d'emballage *</label>
            <select value={produitForm.type_emballage||"CAN"} onChange={e=>setProduitForm(p=>({...p,type_emballage:e.target.value,consigne:e.target.value==="VC"?p.consigne:""}))} style={S.input}>
              {["CAN","PET","VC","VP"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {produitForm.type_emballage==="VC"&&(
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Consigne (taille)</label>
            <select value={produitForm.consigne||""} onChange={e=>setProduitForm(p=>({...p,consigne:e.target.value}))} style={S.input}>
              <option value="">-- Sélectionner --</option>
              {Object.keys(CONSIGNE_PRIX).map(c=>(
                <option key={c} value={c}>{c} ({fmtFull(CONSIGNE_PRIX[c])})</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>
            Prix d'achat (€ / unité vendue) <span style={{color:"#9CA3AF",fontWeight:400}}>— utilisé pour la marge réelle</span>
          </label>
          <input type="number" step="0.01" min="0" value={produitForm.prix_achat??""}
            onChange={e=>setProduitForm(p=>({...p,prix_achat:e.target.value}))}
            placeholder="0.00" style={{...S.input,maxWidth:180,borderColor:"#7C3AED"}}/>
        </div>
        <div style={{fontSize:12,color:"#6B7280",fontWeight:600,marginTop:4}}>Prix par type de client (€)</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          {[["Snack","prix_Snack"],["Restaurant","prix_Restaurant"],["Administratif","prix_Administrative"],["Market","prix_Market"],["Café","prix_Café"],["Crèche","prix_Creche"],["Distributor","prix_Distributor"],["Privé","prix_Privé"]].map(([l,k])=>(
            <div key={k}>
              <label style={{fontSize:11,color:"#9CA3AF",display:"block",marginBottom:2}}>{l}</label>
              <input type="number" step="0.01" min="0" value={produitForm[k]??""}
                onChange={e=>setProduitForm(p=>({...p,[k]:e.target.value}))}
                placeholder="0.00" style={S.input}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{closeWorkTab("produit");setEditProduit(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveProduit} disabled={saving||!produitForm.nom||!produitForm.categorie}
          style={{...S.btn(),flex:2,opacity:(saving||!produitForm.nom||!produitForm.categorie)?0.5:1}}>
          {saving?"Sauvegarde...":editProduit?"Enregistrer":"Créer"}
        </button>
      </div>
    </div>
  </div>
  )}

{/* ══ PAGE RÉCEPTION STOCK ══════════════════════════════════════ */}
{showReceptionForm&&(
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:620}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>📥 Réception de stock</h2>
      </div>
      <div style={{fontSize:12,color:"#6B7280",marginBottom:14}}>Ajoute un ou plusieurs produits reçus dans cette livraison.</div>

      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Ajouter un produit</label>
        <div style={{position:"relative"}}>
          <input value={receptionSearch} onChange={e=>setReceptionSearch(e.target.value)}
            placeholder="🔍 Rechercher un produit..." style={S.input}/>
          {receptionSearch&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:50,maxHeight:220,overflowY:"auto"}}>
              {produits.filter(p=>p.statut!=="Passif" && p.nom.toLowerCase().includes(receptionSearch.toLowerCase())).sort((a,b)=>a.nom.localeCompare(b.nom)).slice(0,8).map(p=>{
                const dejaAjoute = receptionLignes.some(l=>l.produitId===p.id);
                return (
                  <div key={p.id} onClick={()=>{
                    if (dejaAjoute) return;
                    setReceptionLignes(prev=>[...prev,{produitId:p.id, nom:p.nom, qte:"", prix:p.prix_achat||""}]);
                    setReceptionSearch("");
                  }} style={{padding:"9px 12px",cursor:dejaAjoute?"default":"pointer",fontSize:13,borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center",opacity:dejaAjoute?0.4:1}}
                    onMouseEnter={e=>{if(!dejaAjoute)e.currentTarget.style.background="#F9FAFB";}}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span>{p.nom}</span>
                    {dejaAjoute && <span style={{fontSize:11,color:"#9CA3AF"}}>déjà ajouté</span>}
                  </div>
                );
              })}
              {produits.filter(p=>p.statut!=="Passif" && p.nom.toLowerCase().includes(receptionSearch.toLowerCase())).length===0 && (
                <div style={{padding:"10px 12px",fontSize:12,color:"#9CA3AF"}}>Aucun produit trouvé</div>
              )}
            </div>
          )}
        </div>
      </div>

      {receptionLignes.length>0 && (
        <div style={{marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.8fr 0.8fr 0.9fr auto",gap:6,padding:"0 2px 6px",fontSize:10.5,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.03em",display:isMobile?"none":"grid"}}>
            <span>Produit</span><span>Quantité</span><span>Prix / caisse</span><span></span>
          </div>
          <div style={{display:"grid",gap:6}}>
            {receptionLignes.map((l,i)=>(
              <div key={l.produitId} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.8fr 0.8fr 0.9fr auto",gap:6,alignItems:"center",background:"#F8FAFC",border:"1px solid #E3E7ED",borderRadius:8,padding:isMobile?10:"7px 8px"}}>
                <span style={{fontWeight:600,fontSize:13}}>{l.nom}</span>
                <input type="number" min="0" step="1" value={l.qte} placeholder="Qté"
                  onChange={e=>setReceptionLignes(prev=>prev.map((x,xi)=>xi===i?{...x,qte:e.target.value}:x))}
                  style={{...S.input,padding:"6px 8px"}}/>
                <input type="number" min="0" step="0.01" value={l.prix} placeholder="Prix"
                  onChange={e=>setReceptionLignes(prev=>prev.map((x,xi)=>xi===i?{...x,prix:e.target.value}:x))}
                  style={{...S.input,padding:"6px 8px"}}/>
                <button onClick={()=>setReceptionLignes(prev=>prev.filter((_,xi)=>xi!==i))}
                  style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",padding:6,display:"flex",justifySelf:isMobile?"end":"center"}}>
                  <Icon name="close" size={15}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"grid",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Fournisseur</label>
            <input value={receptionForm.fournisseur||""} onChange={e=>setReceptionForm(p=>({...p,fournisseur:e.target.value}))}
              placeholder="Optionnel" style={S.input}/>
          </div>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date</label>
            <input type="date" value={receptionForm.date||""} onChange={e=>setReceptionForm(p=>({...p,date:e.target.value}))} style={S.input}/>
          </div>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
          <input value={receptionForm.notes||""} onChange={e=>setReceptionForm(p=>({...p,notes:e.target.value}))}
            placeholder="Optionnel — n° de bon de livraison, etc." style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Facture fournisseur (photo ou PDF)</label>
          {!receptionFichier ? (
            <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:"1px dashed #CBD5E1",borderRadius:8,cursor:"pointer",fontSize:13,color:"#64748B",background:"#F8FAFC"}}>
              <Icon name="produits" size={16} style={{color:"#94A3B8"}}/>
              Ajouter une photo ou un PDF
              <input type="file" accept="image/*,application/pdf" style={{display:"none"}}
                onChange={e=>{ if (e.target.files[0]) setReceptionFichier(e.target.files[0]); }}/>
            </label>
          ) : (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,fontSize:13}}>
              <span style={{color:"#166534",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {receptionFichier.name}</span>
              <button onClick={()=>setReceptionFichier(null)} style={{background:"none",border:"none",color:"#166534",cursor:"pointer",flexShrink:0}}><Icon name="close" size={14}/></button>
            </div>
          )}
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{closeWorkTab("reception");setReceptionLignes([]);setReceptionFichier(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveReception} disabled={saving}
          style={{...S.btn("#7C3AED"),flex:2,opacity:saving?0.6:1}}>
          {saving?(receptionUploading?"Envoi de la pièce jointe...":"Enregistrement..."):`✅ Enregistrer${receptionLignes.filter(l=>l.qte>0&&l.prix>0).length>0?` (${receptionLignes.filter(l=>l.qte>0&&l.prix>0).length} produit${receptionLignes.filter(l=>l.qte>0&&l.prix>0).length>1?"s":""})`:""}`}
        </button>
      </div>
    </div>
  </div>
  )}

{/* ══ PAGE PERTE STOCK ══════════════════════════════════════════ */}
{showPerteForm&&(
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:620}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>🗑️ Déclarer une perte</h2>
      </div>
      <div style={{fontSize:12,color:"#6B7280",marginBottom:14}}>Ajoute un ou plusieurs produits concernés par cet incident.</div>

      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Ajouter un produit</label>
        <div style={{position:"relative"}}>
          <input value={perteSearch} onChange={e=>setPerteSearch(e.target.value)}
            placeholder="🔍 Rechercher un produit..." style={S.input}/>
          {perteSearch&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:50,maxHeight:220,overflowY:"auto"}}>
              {produits.filter(p=>p.statut!=="Passif" && p.nom.toLowerCase().includes(perteSearch.toLowerCase())).sort((a,b)=>a.nom.localeCompare(b.nom)).slice(0,8).map(p=>{
                const dejaAjoute = perteLignes.some(l=>l.produitId===p.id);
                return (
                  <div key={p.id} onClick={()=>{
                    if (dejaAjoute) return;
                    setPerteLignes(prev=>[...prev,{produitId:p.id, nom:p.nom, qte:""}]);
                    setPerteSearch("");
                  }} style={{padding:"9px 12px",cursor:dejaAjoute?"default":"pointer",fontSize:13,borderBottom:"1px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center",opacity:dejaAjoute?0.4:1}}
                    onMouseEnter={e=>{if(!dejaAjoute)e.currentTarget.style.background="#F9FAFB";}}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span>{p.nom} <span style={{color:"#94A3B8",fontSize:11}}>(stock : {stock[p.id]||0} cs)</span></span>
                    {dejaAjoute && <span style={{fontSize:11,color:"#9CA3AF"}}>déjà ajouté</span>}
                  </div>
                );
              })}
              {produits.filter(p=>p.statut!=="Passif" && p.nom.toLowerCase().includes(perteSearch.toLowerCase())).length===0 && (
                <div style={{padding:"10px 12px",fontSize:12,color:"#9CA3AF"}}>Aucun produit trouvé</div>
              )}
            </div>
          )}
        </div>
      </div>

      {perteLignes.length>0 && (
        <div style={{marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2.2fr 1fr auto",gap:6,padding:"0 2px 6px",fontSize:10.5,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.03em",display:isMobile?"none":"grid"}}>
            <span>Produit</span><span>Quantité perdue</span><span></span>
          </div>
          <div style={{display:"grid",gap:6}}>
            {perteLignes.map((l,i)=>{
              const stockDispo = stock[l.produitId]||0;
              return (
                <div key={l.produitId} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2.2fr 1fr auto",gap:6,alignItems:"center",background:"#F8FAFC",border:"1px solid #E3E7ED",borderRadius:8,padding:isMobile?10:"7px 8px"}}>
                  <span style={{fontWeight:600,fontSize:13}}>{l.nom} <span style={{color:"#94A3B8",fontWeight:400,fontSize:11}}>(stock : {stockDispo} cs)</span></span>
                  <input type="number" min="0" max={stockDispo} step="1" value={l.qte} placeholder="Qté"
                    onChange={e=>setPerteLignes(prev=>prev.map((x,xi)=>xi===i?{...x,qte:e.target.value}:x))}
                    style={{...S.input,padding:"6px 8px"}}/>
                  <button onClick={()=>setPerteLignes(prev=>prev.filter((_,xi)=>xi!==i))}
                    style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",padding:6,display:"flex",justifySelf:isMobile?"end":"center"}}>
                    <Icon name="close" size={15}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{display:"grid",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Motif</label>
            <select value={perteForm.motif||"Casse"} onChange={e=>setPerteForm(p=>({...p,motif:e.target.value}))} style={S.input}>
              {["Casse","Périmé","Vol","Erreur inventaire","Autre"].map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date</label>
            <input type="date" value={perteForm.date||""} onChange={e=>setPerteForm(p=>({...p,date:e.target.value}))} style={S.input}/>
          </div>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
          <input value={perteForm.notes||""} onChange={e=>setPerteForm(p=>({...p,notes:e.target.value}))}
            placeholder="Optionnel — détails de l'incident" style={S.input}/>
        </div>
      </div>

      {perteLignes.filter(l=>l.qte>0).length>0 && (()=>{
        const totalCout = perteLignes.filter(l=>l.qte>0).reduce((s,l)=>{
          const prod = produits.find(p=>p.id===l.produitId);
          const coutMoyen = getCoutMoyenPondere(l.produitId, receptionsStock);
          const cout = coutMoyen ?? prod?.prix_achat ?? 0;
          return s + cout*l.qte;
        },0);
        return totalCout>0 ? (
          <div style={{marginTop:12,padding:"8px 12px",background:"#FEF3C7",borderRadius:8,fontSize:12,color:"#92400E"}}>
            💶 Coût total estimé de cette perte : <strong>{fmtFull(totalCout)}</strong>
          </div>
        ) : null;
      })()}

      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{closeWorkTab("perte");setPerteLignes([]);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={savePerte} disabled={saving}
          style={{...S.btn("#F59E0B"),flex:2,opacity:saving?0.6:1}}>
          {saving?"Enregistrement...":`✅ Confirmer${perteLignes.filter(l=>l.qte>0).length>0?` (${perteLignes.filter(l=>l.qte>0).length} produit${perteLignes.filter(l=>l.qte>0).length>1?"s":""})`:""}`}
        </button>
      </div>
    </div>
  </div>
  )}

  {/* ══ MODAL ÉVÉNEMENT ═══════════════════════════════════════════ */}
  {showEventForm&&(
  <div style={S.modal} onClick={()=>{setShowEventForm(false);setEditEvent(null);}}>
    <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>{editEvent?"Modifier l'événement":"Nouvel événement"}</h2>
        <button onClick={()=>{setShowEventForm(false);setEditEvent(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Titre *</label>
          <input value={eventForm.titre||""} onChange={e=>setEventForm(p=>({...p,titre:e.target.value}))}
            placeholder="Ex: Livraison fournisseur, réunion..." style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Description</label>
          <textarea value={eventForm.description||""} onChange={e=>setEventForm(p=>({...p,description:e.target.value}))}
            placeholder="Optionnel" rows={2} style={{...S.input,resize:"vertical",fontFamily:"inherit"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date de début *</label>
            <input type="date" value={eventForm.date_debut||""} onChange={e=>setEventForm(p=>({...p,date_debut:e.target.value}))} style={S.input}/>
          </div>
          <div>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date de fin <span style={{color:"#D1D5DB"}}>(si plusieurs jours)</span></label>
            <input type="date" value={eventForm.date_fin||""} onChange={e=>setEventForm(p=>({...p,date_fin:e.target.value}))} style={S.input}/>
          </div>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
          <input type="checkbox" checked={eventForm.toute_journee!==false} onChange={e=>setEventForm(p=>({...p,toute_journee:e.target.checked}))}/>
          Toute la journée
        </label>
        {eventForm.toute_journee===false&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Heure de début</label>
              <input type="time" value={eventForm.heure_debut||""} onChange={e=>{
                const newDebut = e.target.value;
                setEventForm(p=>{
                  if (!newDebut) return {...p, heure_debut:newDebut};
                  const toMin = (t)=>{const [h,m]=t.split(":").map(Number);return h*60+m;};
                  const toStr = (min)=>{min=((min%1440)+1440)%1440;return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;};
                  const dureeMin = (p.heure_debut && p.heure_fin) ? (toMin(p.heure_fin)-toMin(p.heure_debut)+1440)%1440 || 60 : 60;
                  return {...p, heure_debut:newDebut, heure_fin: toStr(toMin(newDebut)+dureeMin)};
                });
              }} style={S.input}/>
            </div>
            <div>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Heure de fin</label>
              <input type="time" value={eventForm.heure_fin||""} onChange={e=>setEventForm(p=>({...p,heure_fin:e.target.value}))} style={S.input}/>
            </div>
          </div>
        )}
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:5}}>Couleur</label>
          <div style={{display:"flex",gap:8}}>
            {["#1D4ED8","#059669","#D97706","#DC2626","#7C3AED","#0EA5E9","#DB2777","#374151"].map(c=>(
              <div key={c} onClick={()=>setEventForm(p=>({...p,couleur:c}))}
                style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",
                  border:(eventForm.couleur||"#1D4ED8")===c?"3px solid #0F172A":"3px solid transparent",
                  boxShadow:"0 0 0 1px #E5E7EB"}}/>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        {editEvent&&(
          <button onClick={()=>deleteEvenement(editEvent.id)} disabled={saving}
            style={{...S.btn("#FEE2E2","#DC2626"),padding:"9px 14px"}}>🗑️</button>
        )}
        <button onClick={()=>{setShowEventForm(false);setEditEvent(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveEvenement} disabled={saving||!eventForm.titre||!eventForm.date_debut}
          style={{...S.btn(),flex:2,opacity:(saving||!eventForm.titre||!eventForm.date_debut)?0.5:1}}>
          {saving?"Sauvegarde...":editEvent?"Enregistrer":"Créer l'événement"}
        </button>
      </div>
    </div>
  </div>
  )}

  {/* ══ MODAL MODE DE PAIEMENT ══════════════════════════════════════ */}
  {ncModal&&(()=>{
    const m = ncModal;
    const fermer = () => setNcModal(null);
    const lab = {fontSize:12,color:"#6B7280",display:"block",marginBottom:3};
    if (m.mode==="create") {
      const cl = clients.find(c=>c.id===m.clientId);
      const dispo = cl ? creditsDisponibles(cl.id).reduce((s,x)=>s+(parseFloat(x.credit_restant)||0),0) : 0;
      return (
        <div style={S.modal} onClick={fermer}>
          <div style={{...S.modalBox,maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:700}}>🧾 Nouvelle note de crédit</h2>
              <button onClick={fermer} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
            </div>
            <div style={{fontSize:12,color:"#6B7280",marginBottom:12}}>Argent reçu en trop : le client garde ce crédit, que vous appliquerez sur une de ses factures quand vous le décidez. Sans TVA.</div>
            <div style={{display:"grid",gap:10}}>
              <div>
                <label style={lab}>Client *</label>
                <select value={m.clientId||""} onChange={e=>setNcModal(p=>({...p,clientId:e.target.value?Number(e.target.value):null}))} style={S.input} disabled={!!m.factureNumero}>
                  <option value="">— Choisir un client —</option>
                  {[...clients].sort((a,b)=>(a.nom||"").localeCompare(b.nom||"")).map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                {cl&&dispo>0&&<div style={{fontSize:11,color:"#6D28D9",marginTop:4}}>Crédit déjà disponible pour ce client : {fmtFull(dispo)}</div>}
              </div>
              {m.factureNumero&&<div style={{fontSize:12,color:"#374151"}}>Facture concernée : <b>{m.factureNumero}</b>{m.factureTotal!=null&&<> · total {fmtFull(m.factureTotal)}</>}</div>}
              {m.factureNumero&&m.factureTotal!=null&&(
                <div>
                  <label style={lab}>Montant reçu du client (€) — calcule le crédit automatiquement</label>
                  <input type="number" min="0" step="0.01" value={m.recu||""}
                    onChange={e=>{const r=e.target.value;const diff=(parseFloat(r)||0)-m.factureTotal;setNcModal(p=>({...p,recu:r,montant:diff>0.004?diff.toFixed(2):""}));}}
                    style={S.input} placeholder="ex : 500.00"/>
                  {(parseFloat(m.recu)||0)>0&&(parseFloat(m.recu)||0)-m.factureTotal<=0.004&&<div style={{fontSize:11,color:"#DC2626",marginTop:4}}>Le montant reçu n'est pas supérieur au total de la facture : pas de trop-perçu.</div>}
                </div>
              )}
              <div>
                <label style={lab}>Montant du crédit (€) *</label>
                <input type="number" min="0" step="0.01" value={m.montant} onChange={e=>setNcModal(p=>({...p,montant:e.target.value}))} style={S.input} placeholder="ex : 50.00"/>
              </div>
              <div>
                <label style={lab}>Motif *</label>
                <input value={m.motif} onChange={e=>setNcModal(p=>({...p,motif:e.target.value}))} style={S.input} placeholder="ex : Trop-perçu virement du 05/11"/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:18}}>
              <button onClick={fermer} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
              <button onClick={creerNoteCredit} disabled={saving||!m.clientId||!(parseFloat(m.montant)>0)||!String(m.motif||"").trim()} style={{...S.btn(),flex:1,opacity:(saving||!m.clientId||!(parseFloat(m.montant)>0)||!String(m.motif||"").trim())?0.5:1}}>{saving?"Création…":"Créer la note de crédit"}</button>
            </div>
          </div>
        </div>
      );
    }
    // mode "apply"
    const f = m.facture;
    const dispo = creditsDisponibles(f.client_id);
    const du = totalFact(f.lignes, f.tva_pct).total;
    const nc = dispo.find(x=>x.id===m.ncId);
    return (
      <div style={S.modal} onClick={fermer}>
        <div style={{...S.modalBox,maxWidth:440}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <h2 style={{margin:0,fontSize:16,fontWeight:700}}>🧾 Appliquer une note de crédit</h2>
            <button onClick={fermer} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
          </div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:12}}>Facture {f.numero} — {f.client_nom} · à payer : <b>{fmtFull(du)}</b></div>
          <div style={{display:"grid",gap:10}}>
            <div>
              <label style={lab}>Note de crédit à utiliser</label>
              <select value={m.ncId} onChange={e=>{const x=dispo.find(d=>d.id===Number(e.target.value));setNcModal(p=>({...p,ncId:Number(e.target.value),montant:x?String(Math.min(parseFloat(x.credit_restant)||0,du).toFixed(2)):""}));}} style={S.input}>
                {dispo.map(d=><option key={d.id} value={d.id}>{d.numero} — {fmtFull(parseFloat(d.credit_restant)||0)} dispo{d.notes?" · "+d.notes:""}</option>)}
              </select>
            </div>
            <div>
              <label style={lab}>Montant à déduire (€)</label>
              <input type="number" min="0" step="0.01" value={m.montant} onChange={e=>setNcModal(p=>({...p,montant:e.target.value}))} style={S.input}/>
              {nc&&<div style={{fontSize:11,color:"#6B7280",marginTop:4}}>Il restera {fmtFull(Math.max(0,(parseFloat(nc.credit_restant)||0)-(parseFloat(m.montant)||0)))} de crédit · la facture passera à {fmtFull(Math.max(0,du-(parseFloat(m.montant)||0)))}</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <button onClick={fermer} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
            <button onClick={appliquerNoteCredit} disabled={saving||!nc||!(parseFloat(m.montant)>0)} style={{...S.btn(),flex:1,opacity:(saving||!nc||!(parseFloat(m.montant)>0))?0.5:1}}>{saving?"Application…":"Appliquer"}</button>
          </div>
        </div>
      </div>
    );
  })()}

  {ppModal&&(()=>{
    const m = ppModal, f = factures.find(x=>x.id===m.facture.id) || m.facture;
    const total = totalFact(f.lignes, f.tva_pct).total, paye = totalPaye(f), reste = resteFact(f);
    const saisi = parseFloat(String(m.montant).replace(",","."))||0;
    const fermer = () => setPpModal(null);
    return (
      <div style={S.modal} onClick={fermer}>
        <div style={{...S.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <h2 style={{margin:0,fontSize:16,fontWeight:700}}>💶 Paiement partiel</h2>
            <button onClick={fermer} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
          </div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:10}}>Facture {f.numero} — {f.client_nom}</div>
          <div style={{background:"#F9FAFB",borderRadius:8,padding:10,fontSize:12,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Total TTC</span><b>{fmtFull(total)}</b></div>
            {(f.paiements||[]).map((p,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",color:"#059669"}}><span>Reçu le {p.date} ({p.mode})</span><b>−{fmtFull(p.montant)}</b></div>))}
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #E5E7EB",marginTop:4,paddingTop:4}}><span>Reste dû</span><b style={{color:"#DC2626"}}>{fmtFull(reste)}</b></div>
          </div>
          <div style={{display:"grid",gap:10}}>
            <div>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Montant reçu (€) *</label>
              <input type="number" min="0" step="0.01" value={m.montant} onChange={e=>setPpModal(p=>({...p,montant:e.target.value}))} style={S.input} placeholder="ex : 500.00"/>
              {saisi>0&&<div style={{fontSize:11,color:saisi>reste+0.004?"#DC2626":"#6B7280",marginTop:4}}>{saisi>reste+0.004?"Dépasse le reste dû ("+fmtFull(reste)+")":(reste-saisi<=0.004?"La facture sera soldée (Payée).":"Il restera "+fmtFull(reste-saisi)+" à payer.")}</div>}
            </div>
            <div>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:6}}>Payé par *</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[["Espèces","💵"],["Carte","💳"],["Virement","🏦"]].map(([md,icon])=>(
                  <button key={md} onClick={()=>setPpModal(p=>({...p,mode:md}))}
                    style={{padding:"10px 6px",borderRadius:10,border:m.mode===md?"2px solid #1D4ED8":"2px solid #E5E7EB",background:m.mode===md?"#EFF6FF":"#fff",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:20}}>{icon}</div>
                    <div style={{fontSize:12,fontWeight:600,color:m.mode===md?"#1D4ED8":"#374151"}}>{md}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date d'encaissement</label>
              <input type="date" value={m.date||""} onChange={e=>setPpModal(p=>({...p,date:e.target.value}))} style={S.input}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <button onClick={fermer} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
            <button onClick={savePaiementPartiel} disabled={saving||!(saisi>0)||!m.mode} style={{...S.btn(),flex:2,opacity:(saving||!(saisi>0)||!m.mode)?0.5:1}}>{saving?"Enregistrement…":"✅ Enregistrer le paiement"}</button>
          </div>
        </div>
      </div>
    );
  })()}

  {showPaiementForm&&paiementFacture&&(
  <div style={S.modal} onClick={()=>{setShowPaiementForm(false);setPaiementFacture(null);setPaiementLot(null);}}>
    <div style={{...S.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>💰 Moyen de paiement</h2>
        <button onClick={()=>{setShowPaiementForm(false);setPaiementFacture(null);setPaiementLot(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{fontSize:13,color:"#6B7280",marginBottom:14}}>
        {paiementLot && paiementLot.length
          ? <>{paiementLot.length} facture(s) sélectionnée(s) — le même moyen et la même date seront appliqués à toutes</>
          : <>Facture {paiementFacture.numero} — {paiementFacture.client_nom}</>}
      </div>

      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:6}}>Payé par *</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["Espèces","💵"],["Carte","💳"],["Virement","🏦"]].map(([m,icon])=>(
              <button key={m} onClick={()=>setPaiementForm(p=>({...p,mode:m}))}
                style={{
                  padding:"14px 8px",borderRadius:10,border:paiementForm.mode===m?"2px solid #1D4ED8":"2px solid #E5E7EB",
                  background:paiementForm.mode===m?"#EFF6FF":"#fff",cursor:"pointer",textAlign:"center",
                }}>
                <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                <div style={{fontSize:12,fontWeight:600,color:paiementForm.mode===m?"#1D4ED8":"#374151"}}>{m}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date d'encaissement</label>
          <input type="date" value={paiementForm.date||""} onChange={e=>setPaiementForm(p=>({...p,date:e.target.value}))} style={S.input}/>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button onClick={()=>{setShowPaiementForm(false);setPaiementFacture(null);setPaiementLot(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveModePaiement} disabled={saving||!paiementForm.mode}
          style={{...S.btn(),flex:2,opacity:(saving||!paiementForm.mode)?0.5:1}}>
          {saving?"Enregistrement...":"✅ Confirmer"}
        </button>
      </div>
    </div>
  </div>
  )}

  {/* ══ MODAL PAIEMENT FACTURE DIVERSE ═══════════════════════════ */}
  {showPaiementDiverseForm&&paiementDiverse&&(
  <div style={S.modal} onClick={()=>{setShowPaiementDiverseForm(false);setPaiementDiverse(null);}}>
    <div style={{...S.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>💰 Moyen de paiement</h2>
        <button onClick={()=>{setShowPaiementDiverseForm(false);setPaiementDiverse(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{fontSize:13,color:"#6B7280",marginBottom:14}}>
        Facture {paiementDiverse.numero} — {paiementDiverse.destinataire_nom}
      </div>

      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:6}}>Payé par *</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["Espèces","💵"],["Carte","💳"],["Virement","🏦"]].map(([m,icon])=>(
              <button key={m} onClick={()=>setPaiementDiverseForm(p=>({...p,mode:m}))}
                style={{
                  padding:"14px 8px",borderRadius:10,border:paiementDiverseForm.mode===m?"2px solid #1D4ED8":"2px solid #E5E7EB",
                  background:paiementDiverseForm.mode===m?"#EFF6FF":"#fff",cursor:"pointer",textAlign:"center",
                }}>
                <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                <div style={{fontSize:12,fontWeight:600,color:paiementDiverseForm.mode===m?"#1D4ED8":"#374151"}}>{m}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date d'encaissement</label>
          <input type="date" value={paiementDiverseForm.date||""} onChange={e=>setPaiementDiverseForm(p=>({...p,date:e.target.value}))} style={S.input}/>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button onClick={()=>{setShowPaiementDiverseForm(false);setPaiementDiverse(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveModePaiementDiverse} disabled={saving||!paiementDiverseForm.mode}
          style={{...S.btn(),flex:2,opacity:(saving||!paiementDiverseForm.mode)?0.5:1}}>
          {saving?"Enregistrement...":"✅ Confirmer"}
        </button>
      </div>
    </div>
  </div>
  )}

  {/* ══ MODAL CHARGES DE STRUCTURE (CONTRÔLE DE GESTION) ══════════ */}
  {showFraisForm&&(
  <div style={S.modal} onClick={()=>{setShowFraisForm(false);setEditFrais(null);}}>
    <div style={{...S.modalBox,maxWidth:440}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>📊 Charges du mois</h2>
        <button onClick={()=>{setShowFraisForm(false);setEditFrais(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{fontSize:12,color:"#6B7280",marginBottom:14}}>
        Ces chiffres alimentent le résultat net de l'onglet Contrôle de gestion. Laisse un champ vide si tu ne l'as pas encore — il sera marqué "?" plutôt que compté comme zéro.
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Mois *</label>
          <input type="month" value={(fraisForm.mois||"").slice(0,7)} onChange={e=>setFraisForm(p=>({...p,mois:e.target.value+"-01"}))} style={S.input}/>
        </div>
        {[
          ["masse_salariale","Masse salariale (coût total employeur)"],
          ["loyer","Loyer entrepôt"],
          ["carburant","Carburant"],
          ["assurance_vehicules","Assurance véhicules"],
          ["entretien_vehicules","Entretien véhicules"],
          ["leasing_vehicule","Leasing véhicule"],
          ["frais_comptabilite","Frais comptabilité"],
          ["frais_bancaires","Frais bancaires (Revolut+BGL+TPE)"],
          ["telephone_mobile","Téléphone mobile"],
          ["abonnement_box","Abonnement box"],
          ["autres","Autres charges"],
        ].map(([champ,label])=>(
          <div key={champ}>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>{label}</label>
            <input type="number" step="0.01" value={fraisForm[champ]??""} onChange={e=>setFraisForm(p=>({...p,[champ]:e.target.value}))} placeholder="€" style={S.input}/>
          </div>
        ))}
        <div style={{borderTop:"1px solid #F1F5F9",paddingTop:10,marginTop:4}}>
          <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:2}}>Paramètres coût de livraison réel</div>
          <div style={{fontSize:11,color:"#9CA3AF",marginBottom:8}}>Utilisés pour convertir les relevés chauffeurs (km, heures) en coût réel — préremplis, à ajuster si le prix du diesel ou le coût chauffeur changent.</div>
        </div>
        {[
          ["cout_horaire_chauffeur","Coût horaire chauffeur chargé (€/h)"],
          ["prix_diesel_litre","Prix diesel (€/L)"],
          ["consommation_l_100km","Consommation véhicule (L/100km)"],
        ].map(([champ,label])=>(
          <div key={champ}>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>{label}</label>
            <input type="number" step="0.01" value={fraisForm[champ]??""} onChange={e=>setFraisForm(p=>({...p,[champ]:e.target.value}))} style={S.input}/>
          </div>
        ))}
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
          <input value={fraisForm.notes||""} onChange={e=>setFraisForm(p=>({...p,notes:e.target.value}))} placeholder="Ex: estimation, chiffre partiel..." style={S.input}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button onClick={()=>{setShowFraisForm(false);setEditFrais(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveFrais} disabled={saving||!fraisForm.mois} style={{...S.btn(),flex:2,opacity:(saving||!fraisForm.mois)?0.5:1}}>
          {saving?"Enregistrement...":"✅ Enregistrer"}
        </button>
      </div>
    </div>
  </div>
  )}

  {/* ══ MODAL RELEVÉ CHAUFFEUR (CONTRÔLE DE GESTION — coût livraison réel) ══ */}
  {showRelevChfForm&&(
  <div style={S.modal} onClick={()=>{setShowRelevChfForm(false);setEditRelevChf(null);}}>
    <div style={{...S.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>🚚 Relevé chauffeur (TrackFleet)</h2>
        <button onClick={()=>{setShowRelevChfForm(false);setEditRelevChf(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{fontSize:12,color:"#6B7280",marginBottom:14}}>
        À reporter chaque mois depuis le rapport "Résumé" de TrackFleet (export Excel), un relevé par chauffeur.
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Mois *</label>
          <input type="month" value={(relevChfForm.mois||"").slice(0,7)} onChange={e=>setRelevChfForm(p=>({...p,mois:e.target.value+"-01"}))} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Chauffeur *</label>
          <div style={{display:"flex",gap:6}}>
            {["Sefa","Mikail"].map(ch=>(
              <button key={ch} onClick={()=>setRelevChfForm(p=>({...p,chauffeur:ch}))}
                style={{...S.btn(relevChfForm.chauffeur===ch?"#1D4ED8":"#F1F5F9",relevChfForm.chauffeur===ch?"#fff":"#374151"),flex:1,padding:"8px 0",fontSize:13}}>
                {ch}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Distance totale (km)</label>
          <input type="number" step="0.01" value={relevChfForm.km??""} onChange={e=>setRelevChfForm(p=>({...p,km:e.target.value}))} placeholder="Ex: 1002.48" style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Temps de conduite (heures)</label>
          <input type="number" step="0.01" value={relevChfForm.heures_conduite??""} onChange={e=>setRelevChfForm(p=>({...p,heures_conduite:e.target.value}))} placeholder="Ex: 25.63 (= 25h38)" style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Trajets (nombre, optionnel)</label>
          <input type="number" value={relevChfForm.trajets??""} onChange={e=>setRelevChfForm(p=>({...p,trajets:e.target.value}))} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
          <input value={relevChfForm.notes||""} onChange={e=>setRelevChfForm(p=>({...p,notes:e.target.value}))} style={S.input}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button onClick={()=>{setShowRelevChfForm(false);setEditRelevChf(null);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveRelevChf} disabled={saving||!relevChfForm.mois||!relevChfForm.chauffeur} style={{...S.btn(),flex:2,opacity:(saving||!relevChfForm.mois||!relevChfForm.chauffeur)?0.5:1}}>
          {saving?"Enregistrement...":"✅ Enregistrer"}
        </button>
      </div>
    </div>
  </div>
  )}

  {/* ══ MODAL PRIX CONCURRENT (CONTRÔLE DE GESTION) ═══════════════ */}
  {showPrixConcForm&&(
  <div style={S.modal} onClick={()=>setShowPrixConcForm(false)}>
    <div style={{...S.modalBox,maxWidth:420}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>🏷️ Prix concurrent</h2>
        <button onClick={()=>setShowPrixConcForm(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Produit *</label>
          <select value={prixConcForm.produit_id||""} onChange={e=>setPrixConcForm(p=>({...p,produit_id:e.target.value}))} style={S.input}>
            <option value="">— Choisir —</option>
            {produits.map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Concurrent</label>
          <input value={prixConcForm.concurrent||"Freshy"} onChange={e=>setPrixConcForm(p=>({...p,concurrent:e.target.value}))} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Prix relevé (€) *</label>
          <input type="number" step="0.01" value={prixConcForm.prix||""} onChange={e=>setPrixConcForm(p=>({...p,prix:e.target.value}))} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date du relevé</label>
          <input type="date" value={prixConcForm.date_releve||localDateStr()} onChange={e=>setPrixConcForm(p=>({...p,date_releve:e.target.value}))} style={S.input}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:18}}>
        <button onClick={()=>setShowPrixConcForm(false)} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={savePrixConc} disabled={saving||!prixConcForm.produit_id||!prixConcForm.prix} style={{...S.btn(),flex:2,opacity:(saving||!prixConcForm.produit_id||!prixConcForm.prix)?0.5:1}}>
          {saving?"Enregistrement...":"✅ Enregistrer"}
        </button>
      </div>
    </div>
  </div>
  )}

{/* ══ PAGE RETOUR CONSIGNE MANUEL ═══════════════════════════════ */}
{showConsigneForm&&(
  <div className="page-transition">
    {workTabStrip()}
    <div style={{...S.card,maxWidth:440}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>♻️ Déclarer un retour de consignes</h2>
      </div>
      <div style={{display:"grid",gap:10}}>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Client *</label>
          <select value={consigneClientId||""} onChange={e=>setConsigneClientId(e.target.value?parseInt(e.target.value):null)} style={S.input}>
            <option value="">— Choisir —</option>
            {[...clientsActifs].sort((a,b)=>a.nom.localeCompare(b.nom)).map(c=>(
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:6}}>Consignes à déclarer *</label>
          <div style={{display:"grid",gap:8}}>
            {consigneLignes.map((l,i)=>(
              <div key={i} style={{background:"#F8FAFC",border:"1px solid #E3E7ED",borderRadius:8,padding:10}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto",gap:6,marginBottom:6}}>
                  <input value={l.produitNom} onChange={e=>setConsigneLignes(prev=>prev.map((x,xi)=>xi===i?{...x,produitNom:e.target.value}:x))}
                    placeholder="Produit (optionnel) — ex: Coca VC 24x20cl" style={{...S.input,padding:"7px 9px",fontSize:13}}/>
                  {consigneLignes.length>1 && (
                    <button onClick={()=>setConsigneLignes(prev=>prev.filter((_,xi)=>xi!==i))}
                      style={{background:"none",border:"none",color:"#DC2626",cursor:"pointer",padding:"4px 8px",display:"flex",alignItems:"center",justifySelf:isMobile?"end":"auto"}}>
                      <Icon name="close" size={14}/>
                    </button>
                  )}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  <input type="number" min="0" value={l.qte} placeholder="Quantité (caisses)"
                    onChange={e=>setConsigneLignes(prev=>prev.map((x,xi)=>xi===i?{...x,qte:e.target.value}:x))}
                    style={{...S.input,padding:"7px 9px",fontSize:13}}/>
                  <select value={l.consigneUnitaire} onChange={e=>setConsigneLignes(prev=>prev.map((x,xi)=>xi===i?{...x,consigneUnitaire:e.target.value}:x))}
                    style={{...S.input,padding:"7px 9px",fontSize:13}}>
                    <option value="">— Taille —</option>
                    {Object.entries(CONSIGNE_PRIX).map(([taille,prix])=>(
                      <option key={taille} value={prix}>{taille} — {prix.toFixed(2)} €</option>
                    ))}
                  </select>
                </div>
                {l.qte>0 && l.consigneUnitaire && (
                  <div style={{fontSize:11,color:"#059669",fontWeight:600,marginTop:5}}>
                    Crédit : {fmtFull(l.qte*l.consigneUnitaire)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={()=>setConsigneLignes(prev=>[...prev,{produitNom:"",qte:"",consigneUnitaire:""}])}
            style={{...S.btn("#F5F3FF","#7C3AED"),marginTop:8,width:"100%",padding:"8px",fontSize:12,fontWeight:600}}>
            + Ajouter une autre consigne
          </button>
        </div>

        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date</label>
          <input type="date" value={consigneForm.date||""} onChange={e=>setConsigneForm(p=>({...p,date:e.target.value}))} style={S.input}/>
        </div>
        <div>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
          <input value={consigneForm.notes||""} onChange={e=>setConsigneForm(p=>({...p,notes:e.target.value}))} placeholder="Optionnel" style={S.input}/>
        </div>
        {(() => {
          const total = consigneLignes.filter(l=>l.qte>0&&l.consigneUnitaire).reduce((s,l)=>s+l.qte*l.consigneUnitaire,0);
          return total>0 ? (
            <div style={{background:"#ECFDF5",borderRadius:8,padding:10,fontSize:13,fontWeight:700,color:"#059669"}}>
              Crédit total : {fmtFull(total)}
            </div>
          ) : null;
        })()}
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{closeWorkTab("consigne");setConsigneClientId(null);setConsigneLignes([]);}} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveConsigneManuelle} disabled={saving}
          style={{...S.btn(),flex:2,opacity:saving?0.6:1}}>
          {saving?"Enregistrement...":"Enregistrer le retour"}
        </button>
      </div>
    </div>
  </div>
  )}
  </div>
      </div>
    </div>
  );
}
