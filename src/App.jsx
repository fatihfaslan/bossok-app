import { useState, useMemo, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ═══════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ═══════════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://yjjdpfaubpbicehqiepe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqamRwZmF1YnBiaWNlaHFpZXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDg5MjEsImV4cCI6MjA5NzcyNDkyMX0.IUNl-DCU0C_iyFP74JOXeEKufD53NeJSQRJsu3vosys";

const sb = async (path, method = "GET", body = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  get: (table, query = "") => sb(`${table}?select=*${query ? "&" + query : ""}&order=id.desc`),
  insert: (table, data) => sb(table, "POST", data),
  update: (table, id, data) => sb(`${table}?id=eq.${id}`, "PATCH", data),
  delete: (table, id) => sb(`${table}?id=eq.${id}`, "DELETE"),
};

// ═══════════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════════
const PRODUITS = [
  {id:"C01",nom:"COCA COLA CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:11.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C02",nom:"COCA ZERO CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:11.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C03",nom:"COCA CHERRY CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:12.97,Restaurant:12.97,Administrative:13.97,Market:12.97,Café:13.97,Creche:13.97,Distributor:12.97}},
  {id:"C05",nom:"FANTA ORANGE CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:11.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C06",nom:"FANTA EXOTIC CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:11.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C09",nom:"SPRITE CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:11.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C10",nom:"SEVEN UP CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:11.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C11",nom:"PEPSI CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:10.81,Restaurant:10.81,Administrative:13.81,Market:10.81,Café:11.81,Creche:12.81,Distributor:10.81}},
  {id:"C12",nom:"OASIS TROPICAL CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:13.96,Restaurant:13.96,Administrative:16.96,Market:13.96,Café:14.96,Creche:15.96,Distributor:13.96}},
  {id:"C16",nom:"LIPTON PEACH CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:12.97,Restaurant:12.97,Administrative:13.97,Market:12.97,Café:13.97,Creche:13.97,Distributor:12.97}},
  {id:"C18",nom:"SCHWEPPES AGRUM CANS 24x33cl",categorie:"Canettes",type_emballage:"CAN",prix:{Snack:13.96,Restaurant:13.96,Administrative:16.96,Market:13.96,Café:14.96,Creche:15.96,Distributor:13.96}},
  {id:"C21",nom:"RED BULL CANS 24x25cl",categorie:"Energy",type_emballage:"CAN",prix:{Snack:25.97,Restaurant:25.97,Administrative:28.97,Market:25.97,Café:26.97,Creche:27.97,Distributor:25.97}},
  {id:"C22",nom:"MONSTER GREEN CANS 24x50cl",categorie:"Energy",type_emballage:"CAN",prix:{Snack:28.96,Restaurant:28.96,Administrative:31.96,Market:28.96,Café:29.96,Creche:30.96,Distributor:28.96}},
  {id:"B01",nom:"COCA COLA 24x50cl",categorie:"Bouteilles",type_emballage:"PET",prix:{Snack:21.97,Restaurant:21.97,Administrative:25.97,Market:21.97,Café:23.97,Creche:24.97,Distributor:21.97}},
  {id:"B02",nom:"COCA ZERO 24x50cl",categorie:"Bouteilles",type_emballage:"PET",prix:{Snack:21.97,Restaurant:21.97,Administrative:25.97,Market:21.97,Café:23.97,Creche:24.97,Distributor:21.97}},
  {id:"B03",nom:"FANTA ORANGE 24x50cl",categorie:"Bouteilles",type_emballage:"PET",prix:{Snack:21.97,Restaurant:21.97,Administrative:25.97,Market:21.97,Café:23.97,Creche:24.97,Distributor:21.97}},
  {id:"B04",nom:"SPRITE 24x50cl",categorie:"Bouteilles",type_emballage:"PET",prix:{Snack:21.97,Restaurant:21.97,Administrative:25.97,Market:21.97,Café:23.97,Creche:24.97,Distributor:21.97}},
  {id:"B10",nom:"CRISTALINTE 24x50cl",categorie:"Eaux",type_emballage:"PET",prix:{Snack:5.95,Restaurant:5.95,Administrative:8.95,Market:5.95,Café:6.95,Creche:7.95,Distributor:5.95}},
  {id:"B12",nom:"EVIAN 24x50cl",categorie:"Eaux",type_emballage:"PET",prix:{Snack:14.95,Restaurant:14.95,Administrative:17.95,Market:14.95,Café:15.95,Creche:16.95,Distributor:14.95}},
  {id:"B14",nom:"SAN PELLEGRINO 24x50cl",categorie:"Eaux",type_emballage:"PET",prix:{Snack:14.95,Restaurant:14.95,Administrative:17.85,Market:14.95,Café:15.95,Creche:16.95,Distributor:14.95}},
  {id:"B16",nom:"ROSPORT BLUE 24x50cl",categorie:"Eaux",type_emballage:"PET",prix:{Snack:18.00,Restaurant:18.00,Administrative:19.95,Market:18.00,Café:19.00,Creche:19.00,Distributor:18.00}},
  {id:"V01",nom:"COCA VC 24x20cl",categorie:"Verre",type_emballage:"VC",consigne:"20cl",prix:{Snack:15.96,Restaurant:17.96,Administrative:19.96,Market:16.96,Café:17.96,Creche:18.96,Distributor:15.96}},
  {id:"V03",nom:"FANTA VC 24x20cl",categorie:"Verre",type_emballage:"VC",consigne:"20cl",prix:{Snack:15.96,Restaurant:17.96,Administrative:19.96,Market:16.96,Café:17.96,Creche:18.96,Distributor:15.96}},
  {id:"V08",nom:"ROSPORT BLUE VC 28x25cl",categorie:"Verre",type_emballage:"VC",consigne:"25cl",prix:{Snack:14.59,Restaurant:15.59,Administrative:18.59,Market:15.59,Café:16.59,Creche:17.59,Distributor:14.59}},
  {id:"V10",nom:"ROSPORT BLUE VC 20x50cl",categorie:"Verre",type_emballage:"VC",consigne:"50cl",prix:{Snack:16.89,Restaurant:17.89,Administrative:19.89,Market:17.89,Café:17.89,Creche:18.89,Distributor:16.89}},
  {id:"V13",nom:"ROSPORT CLASSIC VC 6x1L",categorie:"Verre",type_emballage:"VC",consigne:"1L",prix:{Snack:9.29,Restaurant:9.29,Administrative:11.29,Market:9.29,Café:10.29,Creche:11.29,Distributor:9.29}},
];

const CONSIGNE_PRIX = {"20cl":5.00,"25cl":5.00,"50cl":7.95,"1L":4.20};

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

const CHAUFFEUR_REGIONS = {
  A:["Centre-ville","Nord","Nord-ouest","Nord-Est","Nord-est","Est"],
  B:["Sud","Sud-ouest","Sud-Est","Ouest","Belgique","France","Hollande"],
};
const getChauffeur = (r) => CHAUFFEUR_REGIONS.B.includes(r) ? "B" : "A";
const getClientPrix = (produit, client) => {
  const pi = client?.prix_individuels || {};
  if (pi[produit.id] !== undefined) return pi[produit.id];
  return produit.prix[client?.type] || produit.prix["Snack"] || 0;
};

const fmt = (n) => new Intl.NumberFormat("fr-LU",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtFull = (n) => new Intl.NumberFormat("fr-LU",{style:"currency",currency:"EUR"}).format(n||0);
const initials = (n="") => n.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
const TYPE_COLORS = {
  Snack:{bg:"#FFF3E0",text:"#E65100"},Restaurant:{bg:"#E8F5E9",text:"#1B5E20"},
  Café:{bg:"#FCE4EC",text:"#880E4F"},Market:{bg:"#E3F2FD",text:"#0D47A1"},
  Administrative:{bg:"#F3E5F5",text:"#4A148C"},Creche:{bg:"#E0F2F1",text:"#004D40"},
  Distributor:{bg:"#FFF8E1",text:"#FF6F00"},
};
const tc = (t) => TYPE_COLORS[t]||{bg:"#F3F4F6",text:"#374151"};
const totalFact = (lignes=[]) => {
  const prod = lignes.reduce((s,l)=>s+l.qte*l.pu,0);
  const cons = lignes.reduce((s,l)=>s+l.qte*(l.consigne||0),0);
  return {prod, cons, total: prod+cons};
};

// ═══════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Data
  const [clients, setClients] = useState([]);
  const [factures, setFactures] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [stock, setStock] = useState({});

  // UI
  const [selClient, setSelClient] = useState(null);
  const [clientTab, setClientTab] = useState("info");
  const [searchC, setSearchC] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientForm, setClientForm] = useState({});
  const [showFactForm, setShowFactForm] = useState(false);
  const [factClientId, setFactClientId] = useState(null);
  const [factLignes, setFactLignes] = useState([]);
  const [factDate, setFactDate] = useState(new Date().toISOString().split("T")[0]);
  const [factNotes, setFactNotes] = useState("");
  const [searchFactClient, setSearchFactClient] = useState("");
  const [cmdClientId, setCmdClientId] = useState(null);
  const [cmdProduits, setCmdProduits] = useState([]);
  const [cmdNotes, setCmdNotes] = useState("");
  const [searchCmdClient, setSearchCmdClient] = useState("");
  const [showProdAdd, setShowProdAdd] = useState(false);
  const [newProd, setNewProd] = useState("");
  const [newQte, setNewQte] = useState(1);
  const [showRetour, setShowRetour] = useState(null);
  const [retourQtes, setRetourQtes] = useState({});
  const [stockCat, setStockCat] = useState("Tous");

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0];

  // ── LOAD DATA ──────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [cls, facts, cmds, stk] = await Promise.all([
        db.get("clients"),
        db.get("factures"),
        db.get("commandes"),
        db.get("stock"),
      ]);
      setClients(cls);
      setFactures(facts);
      setCommandes(cmds);
      const stockMap = {};
      stk.forEach(s => { stockMap[s.produit_id] = s.quantite; });
      setStock(stockMap);
      setError(null);
    } catch (e) {
      setError("Erreur de connexion à la base de données. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── DERIVED ────────────────────────────────────────────────────
  const clientsActifs = clients.filter(c=>c.statut==="Actif");
  const filteredClients = useMemo(()=>clients.filter(c=>{
    const q=searchC.toLowerCase();
    return (!searchC||c.nom?.toLowerCase().includes(q)||c.adresse?.toLowerCase().includes(q)||c.tva?.toLowerCase().includes(q))
      &&(filterType==="Tous"||c.type===filterType)
      &&(filterStatut==="Tous"||c.statut===filterStatut);
  }),[clients,searchC,filterType,filterStatut]);

  const clientFactures = (cid) => factures.filter(f=>f.client_id===cid);
  const clientImpayees = (cid) => clientFactures(cid).filter(f=>f.statut==="Impayée");

  const planningA = commandes.filter(c=>c.statut==="En attente"&&getChauffeur(c.client_region)==="A");
  const planningB = commandes.filter(c=>c.statut==="En attente"&&getChauffeur(c.client_region)==="B");

  const soldeConsignes = (cid) => {
    const r={};
    factures.filter(f=>f.client_id===cid).forEach(f=>{
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

  // ── ACTIONS ────────────────────────────────────────────────────
  const saveClient = async () => {
    if (!clientForm.nom) return;
    setSaving(true);
    try {
      if (editClient) {
        await db.update("clients", editClient.id, {...clientForm});
      } else {
        await db.insert("clients", {...clientForm, prix_individuels: {}});
      }
      await loadAll();
      setShowClientForm(false);
    } catch(e) { alert("Erreur : "+e.message); }
    finally { setSaving(false); }
  };

  const saveFact = async () => {
    if (!factClientId || factLignes.length===0) return;
    const client = clients.find(c=>c.id===factClientId);
    const num = "F-" + Date.now().toString().slice(-6);
    const ech = new Date(factDate); ech.setDate(ech.getDate()+30);
    setSaving(true);
    try {
      await db.insert("factures", {
        numero: num, client_id: factClientId,
        client_nom: client?.nom||"", client_adresse: client?.adresse||"",
        client_tva: client?.tva||"",
        date: factDate, echeance: ech.toISOString().split("T")[0],
        lignes: factLignes, statut: "Impayée", notes: factNotes, retours: []
      });
      await loadAll();
      setFactLignes([]); setFactNotes(""); setFactClientId(null);
      setSearchFactClient(""); setShowFactForm(false);
    } catch(e) { alert("Erreur : "+e.message); }
    finally { setSaving(false); }
  };

  const marquerPayee = async (id) => {
    setSaving(true);
    try {
      await db.update("factures", id, {statut:"Payée"});
      setFactures(prev=>prev.map(f=>f.id===id?{...f,statut:"Payée"}:f));
    } catch(e) { alert("Erreur : "+e.message); }
    finally { setSaving(false); }
  };

  const saveCmd = async () => {
    if (!cmdClientId || cmdProduits.length===0) return;
    const client = clients.find(c=>c.id===cmdClientId);
    setSaving(true);
    try {
      await db.insert("commandes", {
        client_id: cmdClientId, client_nom: client?.nom||"",
        client_adresse: client?.adresse||"", client_region: client?.region||"",
        client_tel: client?.telephone||"",
        produits: cmdProduits, notes: cmdNotes, statut: "En attente",
        chauffeur: getChauffeur(client?.region||""),
        date_commande: today, date_livraison: tomorrow,
      });
      await loadAll();
      setCmdClientId(null); setCmdProduits([]); setCmdNotes(""); setSearchCmdClient("");
    } catch(e) { alert("Erreur : "+e.message); }
    finally { setSaving(false); }
  };

  const marquerLivre = async (id) => {
    setSaving(true);
    try {
      await db.update("commandes", id, {statut:"Livré"});
      setCommandes(prev=>prev.map(c=>c.id===id?{...c,statut:"Livré"}:c));
    } catch(e) { alert("Erreur : "+e.message); }
    finally { setSaving(false); }
  };

  const updateStock = async (produitId, qte) => {
    const newQte = Math.max(0, qte);
    setStock(prev=>({...prev,[produitId]:newQte}));
    try {
      const existing = await db.get("stock", `produit_id=eq.${produitId}`);
      if (existing.length > 0) {
        await db.update("stock", existing[0].produit_id, {quantite: newQte, updated_at: new Date().toISOString()});
      } else {
        await sb("stock", "POST", {produit_id: produitId, quantite: newQte});
      }
    } catch(e) { console.error(e); }
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
    } catch(e) { alert("Erreur : "+e.message); }
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
      if (selClient?.id===clientId) setSelClient(prev=>({...prev,prix_individuels:newPrix}));
    } catch(e) { console.error(e); }
  };

  const addLigneFact = (prod, client) => {
    const pu = getClientPrix(prod, client);
    const consigne = prod.type_emballage==="VC" ? (CONSIGNE_PRIX[prod.consigne]||0) : 0;
    setFactLignes(prev=>{
      const ex = prev.find(l=>l.produitId===prod.id);
      if (ex) return prev.map(l=>l.produitId===prod.id?{...l,qte:l.qte+1}:l);
      return [...prev,{produitId:prod.id,nom:prod.nom,qte:1,pu,consigne}];
    });
  };

  // ── STYLES ─────────────────────────────────────────────────────
  const S = {
    app:{fontFamily:"'Inter',system-ui,sans-serif",background:"#F1F5F9",minHeight:"100vh",display:"flex"},
    sidebar:{width:200,background:"#0F172A",color:"#fff",display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100},
    main:{marginLeft:200,flex:1,minWidth:0},
    topbar:{background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"0 24px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50},
    page:{padding:"20px 24px",maxWidth:1100,margin:"0 auto"},
    card:{background:"#fff",borderRadius:12,border:"1px solid #E5E7EB",padding:16},
    btn:(bg,col)=>({padding:"8px 16px",background:bg||"#1D4ED8",color:col||"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",opacity:saving?0.7:1}),
    input:{width:"100%",padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"},
    badge:(bg,col)=>({fontSize:11,padding:"2px 8px",borderRadius:999,background:bg,color:col,fontWeight:500,display:"inline-block"}),
    modal:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
    modalBox:{background:"#fff",borderRadius:16,padding:24,maxWidth:640,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"},
    tab:(a)=>({padding:"7px 14px",border:"none",borderBottom:a?"2px solid #1D4ED8":"2px solid transparent",background:"transparent",cursor:"pointer",fontSize:12,fontWeight:a?700:400,color:a?"#1D4ED8":"#6B7280"}),
    kpi:(c)=>({background:"#fff",borderRadius:12,border:"1px solid #E5E7EB",padding:"14px 16px",borderLeft:`4px solid ${c}`}),
    navItem:(a)=>({display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,cursor:"pointer",marginBottom:2,background:a?"#1D4ED8":"transparent",color:a?"#fff":"#94A3B8",fontSize:13,fontWeight:a?600:400}),
  };

  const NAV = [
    {k:"dashboard",icon:"📊",label:"Dashboard"},
    {k:"clients",icon:"👥",label:"Clients"},
    {k:"factures",icon:"🧾",label:"Factures"},
    {k:"commandes",icon:"📋",label:"Commandes"},
    {k:"planning",icon:"🚚",label:"Planning"},
    {k:"stock",icon:"📦",label:"Stock"},
    {k:"consignes",icon:"♻️",label:"Consignes"},
    {k:"produits",icon:"🍺",label:"Produits"},
  ];

  const PAGE_TITLES = {dashboard:"Tableau de bord",clients:"Clients",factures:"Factures",commandes:"Commandes",planning:"Planning livraisons",stock:"Stock",consignes:"Consignes verre",produits:"Catalogue produits"};

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F1F5F9",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:16}}>🍺</div>
        <div style={{fontSize:18,fontWeight:700,color:"#0F172A"}}>BOSSOK</div>
        <div style={{fontSize:13,color:"#94A3B8",marginTop:8}}>Chargement des données...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F1F5F9",fontFamily:"Inter,system-ui,sans-serif"}}>
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
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={{padding:"16px",borderBottom:"1px solid #1E293B"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"#1D4ED8",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🍺</div>
            <div>
              <div style={{fontWeight:800,fontSize:14}}>BOSSOK</div>
              <div style={{fontSize:10,color:"#475569"}}>Luxembourg</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,padding:"8px",overflowY:"auto"}}>
          {NAV.map(n=>(
            <div key={n.k} style={S.navItem(page===n.k)} onClick={()=>setPage(n.k)}>
              <span>{n.icon}</span><span>{n.label}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"12px",borderTop:"1px solid #1E293B",fontSize:11,color:"#475569"}}>
          {saving && <span style={{color:"#60A5FA"}}>💾 Sauvegarde...</span>}
          {!saving && <span>✅ {clientsActifs.length} clients actifs</span>}
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={{fontWeight:700,fontSize:15}}>{PAGE_TITLES[page]}</div>
          <div style={{display:"flex",gap:8}}>
            {page==="clients" && <button style={S.btn()} onClick={()=>{setEditClient(null);setClientForm({type:"Snack",nom:"",adresse:"",telephone:"",email:"",region:"",statut:"Actif",tva:"",conditions:"30 jours"});setShowClientForm(true);}}>+ Nouveau client</button>}
            {page==="factures" && <button style={S.btn()} onClick={()=>{setShowFactForm(true);setFactClientId(null);setFactLignes([]);setSearchFactClient("");}}>+ Nouvelle facture</button>}
            {page==="commandes" && <button style={{...S.btn(),opacity:(!cmdClientId||cmdProduits.length===0||saving)?0.4:1}} onClick={saveCmd} disabled={!cmdClientId||cmdProduits.length===0||saving}>✅ Enregistrer</button>}
            <button style={S.btn("#F1F5F9","#374151")} onClick={loadAll}>🔄</button>
          </div>
        </div>

        <div style={S.page}>

{/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
{page==="dashboard" && (
  <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
      {[
        {l:"CA Total 13 mois",v:fmt(1156901),c:"#1D4ED8",icon:"💶",sub:"Juin 2025 → Juin 2026"},
        {l:"Clients actifs",v:clientsActifs.length,c:"#059669",icon:"👥",sub:`sur ${clients.length} total`},
        {l:"Factures ce mois",v:factures.length,c:"#7C3AED",icon:"🧾",sub:"créées dans l'app"},
        {l:"Impayées",v:factures.filter(f=>f.statut==="Impayée").length,c:"#DC2626",icon:"⚠️",sub:fmt(factures.filter(f=>f.statut==="Impayée").reduce((s,f)=>s+totalFact(f.lignes).total,0))},
      ].map((s,i)=>(
        <div key={i} style={S.kpi(s.c)}>
          <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
          <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#374151",fontWeight:600,marginTop:2}}>{s.l}</div>
          <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{s.sub}</div>
        </div>
      ))}
    </div>

    <div style={{...S.card,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>CA mensuel historique — 13 mois</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={MONTHLY_DATA} margin={{top:0,right:10,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
          <XAxis dataKey="label" tick={{fontSize:10}}/>
          <YAxis tick={{fontSize:10}} tickFormatter={v=>(v/1000)+"k"}/>
          <Tooltip formatter={(v,n)=>[fmt(v),n==="paye"?"Encaissé":"Impayé"]}/>
          <Bar dataKey="paye" stackId="a" fill="#1D4ED8" name="paye"/>
          <Bar dataKey="impaye" stackId="a" fill="#EF4444" radius={[4,4,0,0]} name="impaye"/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Commandes en attente</div>
        {commandes.filter(c=>c.statut==="En attente").length===0?(
          <div style={{color:"#9CA3AF",fontSize:12,textAlign:"center",padding:"20px 0"}}>Aucune commande en attente</div>
        ):(
          commandes.filter(c=>c.statut==="En attente").slice(0,5).map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F1F5F9"}}>
              <span style={{fontWeight:500}}>{c.client_nom}</span>
              <span style={S.badge("#DBEAFE","#1D4ED8")}>Ch. {c.chauffeur}</span>
            </div>
          ))
        )}
      </div>
      <div style={S.card}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Dernières factures</div>
        {factures.slice(0,5).map(f=>{
          const {total}=totalFact(f.lignes);
          return(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F1F5F9"}}>
              <span style={{fontWeight:500}}>{f.client_nom}</span>
              <span style={{fontWeight:700}}>{fmtFull(total)}</span>
              <span style={S.badge(f.statut==="Payée"?"#DCFCE7":"#FEE2E2",f.statut==="Payée"?"#166534":"#DC2626")}>{f.statut}</span>
            </div>
          );
        })}
        {factures.length===0&&<div style={{color:"#9CA3AF",fontSize:12,textAlign:"center",padding:"20px 0"}}>Aucune facture</div>}
      </div>
    </div>
  </div>
)}

{/* ══ CLIENTS ══════════════════════════════════════════════════ */}
{page==="clients" && (
  <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Total",v:clients.length,c:"#1D4ED8"},
        {l:"Actifs",v:clientsActifs.length,c:"#059669"},
        {l:"Passifs",v:clients.filter(c=>c.statut==="Passif").length,c:"#D97706"},
        {l:"Impayées",v:factures.filter(f=>f.statut==="Impayée").length,c:"#DC2626"},
      ].map((s,i)=>(
        <div key={i} style={S.kpi(s.c)}>
          <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{s.l}</div>
        </div>
      ))}
    </div>
    <div style={{...S.card,marginBottom:12,display:"flex",gap:8,flexWrap:"wrap"}}>
      <input value={searchC} onChange={e=>setSearchC(e.target.value)} placeholder="🔍 Rechercher..." style={{...S.input,flex:1,minWidth:160}}/>
      <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        {["Tous","Snack","Restaurant","Café","Market","Administrative","Creche","Distributor"].map(t=><option key={t}>{t}</option>)}
      </select>
      <select value={filterStatut} onChange={e=>setFilterStatut(e.target.value)} style={{padding:"8px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        <option>Tous</option><option>Actif</option><option>Passif</option>
      </select>
    </div>
    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10}}>{filteredClients.length} client(s)</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
      {filteredClients.map(c=>{
        const imp=clientImpayees(c.id);
        return(
          <div key={c.id} onClick={()=>{setSelClient(c);setClientTab("info");}} style={{...S.card,cursor:"pointer",borderLeft:`3px solid ${tc(c.type).text}`}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.08)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{display:"flex",gap:10}}>
              <div style={{width:36,height:36,borderRadius:9,background:tc(c.type).bg,color:tc(c.type).text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0}}>{initials(c.nom)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nom}</div>
                <div style={{fontSize:11,color:"#6B7280",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>📍 {c.adresse}</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>
                  <span style={S.badge(tc(c.type).bg,tc(c.type).text)}>{c.type}</span>
                  <span style={S.badge(c.statut==="Actif"?"#DCFCE7":"#FEF3C7",c.statut==="Actif"?"#166534":"#92400E")}>{c.statut}</span>
                  {imp.length>0&&<span style={S.badge("#FEE2E2","#DC2626")}>⚠ {imp.length}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {filteredClients.length===0&&(
        <div style={{gridColumn:"1/-1",...S.card,textAlign:"center",padding:"48px 0",color:"#9CA3AF"}}>
          <div style={{fontSize:40,marginBottom:12}}>👥</div>
          <div>{clients.length===0?"Aucun client — cliquez sur '+ Nouveau client'":"Aucun résultat"}</div>
        </div>
      )}
    </div>
  </div>
)}

{/* ══ FACTURES ══════════════════════════════════════════════════ */}
{page==="factures" && (
  <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Total",v:factures.length,c:"#1D4ED8"},
        {l:"Payées",v:factures.filter(f=>f.statut==="Payée").length,c:"#059669"},
        {l:"Impayées",v:factures.filter(f=>f.statut==="Impayée").length,c:"#DC2626"},
      ].map((s,i)=>(
        <div key={i} style={S.kpi(s.c)}>
          <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{s.l}</div>
        </div>
      ))}
    </div>
    {factures.filter(f=>f.statut==="Impayée").length>0&&(
      <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{fontWeight:700,color:"#DC2626",fontSize:13,marginBottom:8}}>⚠️ Factures impayées — {fmtFull(factures.filter(f=>f.statut==="Impayée").reduce((s,f)=>s+totalFact(f.lignes).total,0))}</div>
        {factures.filter(f=>f.statut==="Impayée").map(f=>(
          <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,padding:"4px 0",borderBottom:"1px solid #FECACA",gap:8}}>
            <span style={{fontWeight:500,flex:1}}>{f.numero} — {f.client_nom}</span>
            <span style={{color:"#6B7280"}}>{f.date} · éch. {f.echeance}</span>
            <span style={{fontWeight:700,color:"#DC2626"}}>{fmtFull(totalFact(f.lignes).total)}</span>
            <button onClick={()=>marquerPayee(f.id)} style={{...S.btn("#059669"),padding:"2px 8px",fontSize:11}}>✓</button>
          </div>
        ))}
      </div>
    )}
    {factures.length===0?(
      <div style={{...S.card,textAlign:"center",padding:"48px 0",color:"#9CA3AF"}}>
        <div style={{fontSize:40,marginBottom:12}}>🧾</div>
        <div>Aucune facture — cliquez sur "+ Nouvelle facture"</div>
      </div>
    ):(
      <div style={S.card}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:"2px solid #E5E7EB"}}>
              {["N°","Date","Client","Montant HT","Consignes","Statut","Actions"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"8px 10px",color:"#6B7280",fontWeight:600,fontSize:12}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factures.map((f,i)=>{
              const {prod,cons}=totalFact(f.lignes);
              return(
                <tr key={f.id} style={{borderBottom:"1px solid #F1F5F9",background:i%2===0?"#fff":"#FAFAFA"}}>
                  <td style={{padding:"7px 10px",fontWeight:700,color:"#1D4ED8"}}>{f.numero}</td>
                  <td style={{padding:"7px 10px",color:"#6B7280",fontSize:12}}>{f.date}</td>
                  <td style={{padding:"7px 10px",fontWeight:500}}>{f.client_nom}</td>
                  <td style={{padding:"7px 10px",fontWeight:700}}>{fmtFull(prod)}</td>
                  <td style={{padding:"7px 10px",color:cons>0?"#7C3AED":"#9CA3AF"}}>{cons>0?fmtFull(cons):"—"}</td>
                  <td style={{padding:"7px 10px"}}>
                    <span style={S.badge(f.statut==="Payée"?"#DCFCE7":"#FEE2E2",f.statut==="Payée"?"#166534":"#DC2626")}>{f.statut==="Payée"?"✓ Payée":"⚠ Impayée"}</span>
                  </td>
                  <td style={{padding:"7px 10px"}}>
                    <div style={{display:"flex",gap:4}}>
                      {f.statut==="Impayée"&&<button onClick={()=>marquerPayee(f.id)} style={{...S.btn("#059669"),padding:"3px 8px",fontSize:11}}>✓</button>}
                      {(f.lignes||[]).some(l=>l.consigne>0)&&<button onClick={()=>{setShowRetour(f.id);setRetourQtes({});}} style={{...S.btn("#7C3AED"),padding:"3px 8px",fontSize:11}}>♻️</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{/* ══ COMMANDES ══════════════════════════════════════════════════ */}
{page==="commandes" && (
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>➕ Nouvelle commande</div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Client *</label>
        {cmdClientId?(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{clients.find(c=>c.id===cmdClientId)?.nom}</div>
              <span style={S.badge("#DBEAFE","#1D4ED8")}>🚚 Chauffeur {getChauffeur(clients.find(c=>c.id===cmdClientId)?.region||"")}</span>
            </div>
            <button onClick={()=>{setCmdClientId(null);setSearchCmdClient("");}} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:16}}>✕</button>
          </div>
        ):(
          <div style={{position:"relative"}}>
            <input value={searchCmdClient} onChange={e=>setSearchCmdClient(e.target.value)} placeholder="🔍 Rechercher..." style={S.input}/>
            {searchCmdClient&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:50,maxHeight:200,overflowY:"auto"}}>
                {clientsActifs.filter(c=>c.nom?.toLowerCase().includes(searchCmdClient.toLowerCase())).slice(0,6).map(c=>(
                  <div key={c.id} onClick={()=>{setCmdClientId(c.id);setSearchCmdClient("");}} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #F1F5F9"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontWeight:500}}>{c.nom}</div>
                    <div style={{fontSize:11,color:"#9CA3AF"}}>{c.region}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Produits *</label>
        {cmdProduits.map((p,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:"#F9FAFB",borderRadius:6,marginBottom:4,fontSize:12}}>
            <span style={{flex:1}}>{p.nom}</span>
            <span style={{fontWeight:600,color:"#1D4ED8"}}>×{p.qte}</span>
            <button onClick={()=>setCmdProduits(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer"}}>✕</button>
          </div>
        ))}
        {showProdAdd?(
          <div style={{border:"1px solid #E5E7EB",borderRadius:8,padding:10}}>
            <input list="prod-list" value={newProd} onChange={e=>setNewProd(e.target.value)} placeholder="Produit..." style={{...S.input,marginBottom:6}}/>
            <datalist id="prod-list">{PRODUITS.map(p=><option key={p.id} value={p.nom}/>)}</datalist>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input type="number" min="1" value={newQte} onChange={e=>setNewQte(e.target.value)} style={{...S.input,width:70}}/>
              <button onClick={()=>{if(!newProd)return;setCmdProduits(prev=>[...prev,{nom:newProd,qte:parseInt(newQte)||1}]);setNewProd("");setNewQte(1);setShowProdAdd(false);}} style={S.btn()}>+</button>
              <button onClick={()=>setShowProdAdd(false)} style={S.btn("#F3F4F6","#374151")}>✕</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setShowProdAdd(true)} style={{...S.btn("#F0FDF4","#16A34A"),width:"100%",marginTop:4}}>+ Ajouter produit</button>
        )}
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
        <input value={cmdNotes} onChange={e=>setCmdNotes(e.target.value)} placeholder="Instructions spéciales..." style={S.input}/>
      </div>
      <button onClick={saveCmd} disabled={!cmdClientId||cmdProduits.length===0||saving}
        style={{...S.btn(),width:"100%",opacity:(!cmdClientId||cmdProduits.length===0||saving)?0.4:1}}>
        {saving?"Sauvegarde...":"✅ Enregistrer la commande"}
      </button>
    </div>
    <div>
      <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>En attente ({commandes.filter(c=>c.statut==="En attente").length})</div>
      {commandes.filter(c=>c.statut==="En attente").length===0?(
        <div style={{...S.card,textAlign:"center",padding:"40px 0",color:"#9CA3AF",fontSize:13}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>Aucune commande
        </div>
      ):(
        commandes.filter(c=>c.statut==="En attente").map(cmd=>(
          <div key={cmd.id} style={{...S.card,marginBottom:8,borderLeft:`3px solid #F59E0B`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{cmd.client_nom}</div>
                <div style={{fontSize:11,color:"#6B7280"}}>📍 {cmd.client_adresse}</div>
                <span style={S.badge("#DBEAFE","#1D4ED8")}>🚚 Chauffeur {cmd.chauffeur}</span>
                <div style={{fontSize:11,marginTop:4}}>{(cmd.produits||[]).map((p,i)=><span key={i} style={{marginRight:6}}>📦 {p.nom} ×{p.qte}</span>)}</div>
              </div>
              <button onClick={()=>marquerLivre(cmd.id)} style={{...S.btn("#059669"),padding:"5px 10px",fontSize:11}}>✓ Livré</button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}

{/* ══ PLANNING ══════════════════════════════════════════════════ */}
{page==="planning" && (
  <div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:13,color:"#6B7280"}}>Livraisons prévues — {tomorrow}</div>
      <div style={{fontWeight:600,fontSize:14,marginTop:2}}>{commandes.filter(c=>c.statut==="En attente").length} commande(s) en attente</div>
    </div>
    {commandes.filter(c=>c.statut==="En attente").length===0?(
      <div style={{...S.card,textAlign:"center",padding:"60px 0",color:"#9CA3AF"}}>
        <div style={{fontSize:40,marginBottom:12}}>🚚</div>
        <div>Aucune commande en attente</div>
      </div>
    ):(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {["A","B"].map(ch=>{
          const cmds=ch==="A"?planningA:planningB;
          const regions=[...new Set(cmds.map(c=>c.client_region))];
          return(
            <div key={ch} style={{...S.card,borderTop:`4px solid ${ch==="A"?"#1D4ED8":"#7C3AED"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,color:ch==="A"?"#1D4ED8":"#7C3AED"}}>🚚 Chauffeur {ch}</div>
                  <div style={{fontSize:11,color:"#6B7280"}}>{cmds.length} arrêt(s)</div>
                </div>
                <span style={{...S.badge(ch==="A"?"#DBEAFE":"#EDE9FE",ch==="A"?"#1D4ED8":"#6D28D9"),fontSize:13,padding:"4px 10px"}}>{cmds.reduce((s,c)=>s+(c.produits||[]).reduce((ss,p)=>ss+p.qte,0),0)} caisses</span>
              </div>
              {cmds.length===0?<div style={{textAlign:"center",color:"#9CA3AF",fontSize:12,padding:"20px 0"}}>Aucune livraison</div>:(
                regions.map(reg=>(
                  <div key={reg} style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:4}}>📍 {reg}</div>
                    {cmds.filter(c=>c.client_region===reg).map(cmd=>(
                      <div key={cmd.id} style={{padding:"6px 10px",background:"#F8FAFC",borderRadius:6,marginBottom:3,borderLeft:"3px solid #CBD5E1"}}>
                        <div style={{fontWeight:500,fontSize:12}}>{cmd.client_nom}</div>
                        <div style={{fontSize:11,color:"#6B7280"}}>{cmd.client_adresse}</div>
                        <div style={{fontSize:11,marginTop:2}}>{(cmd.produits||[]).map((p,i)=><span key={i} style={{marginRight:6}}>📦 {p.nom} ×{p.qte}</span>)}</div>
                        <button onClick={()=>marquerLivre(cmd.id)} style={{...S.btn("#059669"),padding:"3px 8px",fontSize:10,marginTop:4}}>✓ Livré</button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

{/* ══ STOCK ══════════════════════════════════════════════════════ */}
{page==="stock" && (
  <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
      {[
        {l:"Ruptures",v:PRODUITS.filter(p=>!(stock[p.id]>0)).length,c:"#DC2626"},
        {l:"Stock bas (≤5)",v:PRODUITS.filter(p=>stock[p.id]>0&&stock[p.id]<=5).length,c:"#D97706"},
        {l:"En stock",v:PRODUITS.filter(p=>stock[p.id]>5).length,c:"#059669"},
      ].map((s,i)=>(
        <div key={i} style={S.kpi(s.c)}>
          <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:"#6B7280"}}>{s.l}</div>
        </div>
      ))}
    </div>
    <div style={{...S.card,marginBottom:12}}>
      <select value={stockCat} onChange={e=>setStockCat(e.target.value)} style={{padding:"7px 10px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13}}>
        {["Tous","Canettes","Energy","Jus","Bouteilles","Eaux","Sports","Verre"].map(c=><option key={c}>{c}</option>)}
      </select>
    </div>
    <div style={S.card}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{borderBottom:"2px solid #E5E7EB",background:"#F9FAFB"}}>
            {["Produit","Cat.","Stock","Modifier"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"8px 12px",color:"#6B7280",fontWeight:600,fontSize:12}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRODUITS.filter(p=>stockCat==="Tous"||p.categorie===stockCat).map(p=>{
            const q=stock[p.id]||0;
            const col=q===0?"#DC2626":q<=5?"#D97706":"#059669";
            return(
              <tr key={p.id} style={{borderBottom:"1px solid #F1F5F9",background:q===0?"#FFF5F5":q<=5?"#FFFDF0":"transparent"}}>
                <td style={{padding:"7px 12px",fontWeight:500}}>{p.nom}{p.type_emballage==="VC"&&<span style={{...S.badge("#EDE9FE","#7C3AED"),marginLeft:6,fontSize:10}}>VC</span>}</td>
                <td style={{padding:"7px 12px"}}><span style={S.badge("#F3F4F6","#374151")}>{p.categorie}</span></td>
                <td style={{padding:"7px 12px"}}><span style={{fontWeight:700,color:col,fontSize:16}}>{q}</span><span style={{fontSize:11,color:"#9CA3AF",marginLeft:4}}>cs</span></td>
                <td style={{padding:"7px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <button onClick={()=>updateStock(p.id,(stock[p.id]||0)-1)} style={{width:26,height:26,border:"1px solid #E5E7EB",borderRadius:6,background:"#F9FAFB",cursor:"pointer",fontWeight:700}}>−</button>
                    <input type="number" min="0" value={q} onChange={e=>updateStock(p.id,parseInt(e.target.value)||0)} style={{width:54,textAlign:"center",padding:"3px 4px",border:"1px solid #D1D5DB",borderRadius:6,fontSize:13,outline:"none"}}/>
                    <button onClick={()=>updateStock(p.id,(stock[p.id]||0)+1)} style={{width:26,height:26,border:"1px solid #E5E7EB",borderRadius:6,background:"#F9FAFB",cursor:"pointer",fontWeight:700}}>+</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* ══ CONSIGNES ══════════════════════════════════════════════════ */}
{page==="consignes" && (
  <div>
    <div style={{fontSize:13,color:"#6B7280",marginBottom:14}}>Emballages verre non retournés par client.</div>
    {clientsActifs.map(c=>{
      const sol=soldeConsignes(c.id);
      if(sol.length===0) return null;
      const total=sol.reduce((s,r)=>s+r.solde*r.consigne,0);
      return(
        <div key={c.id} style={{...S.card,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{width:30,height:30,borderRadius:8,background:tc(c.type).bg,color:tc(c.type).text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:10}}>{initials(c.nom)}</div>
              <div><div style={{fontWeight:600,fontSize:13}}>{c.nom}</div><div style={{fontSize:11,color:"#6B7280"}}>{c.region}</div></div>
            </div>
            <div style={{fontWeight:700,color:"#7C3AED"}}>{fmtFull(total)}</div>
          </div>
          {sol.map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 8px",background:"#F5F3FF",borderRadius:6,marginBottom:3}}>
              <span>{r.nom}</span>
              <span style={{fontWeight:600,color:"#7C3AED"}}>{r.solde} cs × {fmtFull(r.consigne)} = {fmtFull(r.solde*r.consigne)}</span>
            </div>
          ))}
        </div>
      );
    })}
    {clientsActifs.every(c=>soldeConsignes(c.id).length===0)&&(
      <div style={{...S.card,textAlign:"center",padding:"60px 0",color:"#9CA3AF"}}>
        <div style={{fontSize:40,marginBottom:12}}>♻️</div>
        <div>Aucune consigne en cours</div>
      </div>
    )}
  </div>
)}

{/* ══ PRODUITS ══════════════════════════════════════════════════ */}
{page==="produits" && (
  <div style={S.card}>
    <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Catalogue — {PRODUITS.length} références</div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
          <tr style={{borderBottom:"2px solid #E5E7EB",background:"#F9FAFB"}}>
            {["Produit","Cat.","Type","Prix Snack","Prix Rest.","Prix Admin","Consigne"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"8px 10px",color:"#6B7280",fontWeight:600}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRODUITS.map((p,i)=>(
            <tr key={p.id} style={{borderBottom:"1px solid #F1F5F9",background:i%2===0?"#fff":"#FAFAFA"}}>
              <td style={{padding:"7px 10px",fontWeight:500}}>{p.nom}</td>
              <td style={{padding:"7px 10px"}}><span style={S.badge("#F3F4F6","#374151")}>{p.categorie}</span></td>
              <td style={{padding:"7px 10px"}}><span style={S.badge(p.type_emballage==="VC"?"#EDE9FE":p.type_emballage==="CAN"?"#FEF3C7":"#E0F2FE",p.type_emballage==="VC"?"#6D28D9":p.type_emballage==="CAN"?"#92400E":"#0369A1")}>{p.type_emballage}</span></td>
              <td style={{padding:"7px 10px"}}>{fmtFull(p.prix.Snack)}</td>
              <td style={{padding:"7px 10px"}}>{fmtFull(p.prix.Restaurant)}</td>
              <td style={{padding:"7px 10px"}}>{fmtFull(p.prix.Administrative)}</td>
              <td style={{padding:"7px 10px",color:p.type_emballage==="VC"?"#7C3AED":"#9CA3AF"}}>{p.type_emballage==="VC"?fmtFull(CONSIGNE_PRIX[p.consigne]):"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

        </div>
      </div>

{/* ══ MODAL CLIENT DETAIL ══════════════════════════════════════ */}
{selClient&&(
  <div style={S.modal} onClick={()=>setSelClient(null)}>
    <div style={{...S.modalBox,maxWidth:680}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:44,height:44,borderRadius:12,background:tc(selClient.type).bg,color:tc(selClient.type).text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14}}>{initials(selClient.nom)}</div>
          <div>
            <div style={{fontWeight:700,fontSize:16}}>{selClient.nom}</div>
            <div style={{fontSize:12,color:"#6B7280"}}>{selClient.type} · {selClient.region}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setShowFactForm(true);setFactClientId(selClient.id);setFactLignes([]);setSelClient(null);}} style={S.btn()}>+ Facture</button>
          <button onClick={()=>{setEditClient(selClient);setClientForm({...selClient});setShowClientForm(true);setSelClient(null);}} style={S.btn("#6B7280")}>✏️</button>
          <button onClick={()=>setSelClient(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
        </div>
      </div>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid #E5E7EB",marginBottom:14}}>
        {[["info","Infos"],["factures","Factures"],["consignes","Consignes"],["prix","Prix perso"]].map(([k,l])=>(
          <button key={k} style={S.tab(clientTab===k)} onClick={()=>setClientTab(k)}>{l}</button>
        ))}
      </div>
      {clientTab==="info"&&(
        <div style={{display:"grid",gap:8}}>
          {[["Adresse",selClient.adresse],["Téléphone",selClient.telephone],["Email",selClient.email||"—"],["N° TVA",selClient.tva||"—"],["Région",selClient.region],["Conditions",selClient.conditions],["Statut",selClient.statut]].map(([l,v])=>(
            <div key={l} style={{display:"flex",gap:12,fontSize:13}}>
              <span style={{color:"#9CA3AF",width:100,flexShrink:0}}>{l}</span>
              <span style={{fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
      )}
      {clientTab==="factures"&&(
        <div>
          {clientImpayees(selClient.id).length>0&&(
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:10,marginBottom:10}}>
              <div style={{fontWeight:600,color:"#DC2626",fontSize:12,marginBottom:6}}>⚠️ Impayées</div>
              {clientImpayees(selClient.id).map(f=>(
                <div key={f.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                  <span>{f.numero} — {f.date}</span>
                  <span style={{fontWeight:700,color:"#DC2626"}}>{fmtFull(totalFact(f.lignes).total)}</span>
                </div>
              ))}
            </div>
          )}
          {clientFactures(selClient.id).length===0?(
            <div style={{textAlign:"center",color:"#9CA3AF",padding:"30px 0",fontSize:13}}>Aucune facture</div>
          ):(
            clientFactures(selClient.id).map(f=>{
              const {total}=totalFact(f.lignes);
              return(
                <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#F9FAFB",borderRadius:8,fontSize:12,marginBottom:4}}>
                  <span style={{fontWeight:600,color:"#1D4ED8",width:72}}>{f.numero}</span>
                  <span style={{color:"#6B7280",flex:1}}>{f.date}</span>
                  <span style={{fontWeight:600}}>{fmtFull(total)}</span>
                  <span style={S.badge(f.statut==="Payée"?"#DCFCE7":"#FEE2E2",f.statut==="Payée"?"#166534":"#DC2626")}>{f.statut}</span>
                  {f.statut==="Impayée"&&<button onClick={()=>marquerPayee(f.id)} style={{...S.btn("#059669"),padding:"2px 8px",fontSize:11}}>✓</button>}
                </div>
              );
            })
          )}
        </div>
      )}
      {clientTab==="consignes"&&(
        <div>
          {soldeConsignes(selClient.id).length===0?<div style={{textAlign:"center",color:"#9CA3AF",padding:"30px 0",fontSize:13}}>Aucune consigne en cours</div>:(
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
            {PRODUITS.map(p=>{
              const standard=p.prix[selClient.type]||p.prix.Snack;
              const perso=(selClient.prix_individuels||{})[p.id];
              return(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"#F9FAFB",borderRadius:6}}>
                  <span style={{fontSize:11,flex:1}}>{p.nom}</span>
                  <span style={{fontSize:11,color:"#9CA3AF",width:60}}>{fmtFull(standard)}</span>
                  <input type="number" step="0.01" placeholder={standard.toFixed(2)} value={perso!==undefined?perso:""}
                    onChange={e=>updatePrixIndividuel(selClient.id,p.id,e.target.value)}
                    style={{width:72,padding:"3px 6px",border:`1px solid ${perso!==undefined?"#7C3AED":"#E5E7EB"}`,borderRadius:6,fontSize:11,outline:"none",background:perso!==undefined?"#F5F3FF":"#fff"}}/>
                  {perso!==undefined&&<button onClick={()=>updatePrixIndividuel(selClient.id,p.id,"")} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer"}}>✕</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>
)}

{/* ══ MODAL NOUVELLE FACTURE ══════════════════════════════════════ */}
{showFactForm&&(
  <div style={S.modal} onClick={()=>setShowFactForm(false)}>
    <div style={{...S.modalBox,maxWidth:680}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>Nouvelle facture</h2>
        <button onClick={()=>setShowFactForm(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
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
                    <div key={c.id} onClick={()=>{setFactClientId(c.id);setSearchFactClient("");}} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #F1F5F9"}}
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
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Date</label>
          <input type="date" value={factDate} onChange={e=>setFactDate(e.target.value)} style={S.input}/>
        </div>
      </div>
      {factClientId&&clientImpayees(factClientId).length>0&&(
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:10,marginBottom:12}}>
          <div style={{fontWeight:600,color:"#DC2626",fontSize:12,marginBottom:6}}>⚠️ Factures impayées de ce client :</div>
          {clientImpayees(factClientId).map(f=>(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
              <span>{f.numero} — {f.date} (éch. {f.echeance})</span>
              <span style={{fontWeight:700,color:"#DC2626"}}>{fmtFull(totalFact(f.lignes).total)}</span>
            </div>
          ))}
          <div style={{fontSize:11,color:"#DC2626",fontWeight:600,marginTop:4}}>
            Total dû : {fmtFull(clientImpayees(factClientId).reduce((s,f)=>s+totalFact(f.lignes).total,0))}
          </div>
        </div>
      )}
      {factClientId&&(
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:4}}>Produits</label>
          <div style={{maxHeight:180,overflowY:"auto",border:"1px solid #E5E7EB",borderRadius:8}}>
            {PRODUITS.map(p=>{
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
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderBottom:"1px solid #F1F5F9",fontSize:12}}>
              <span style={{flex:1}}>{l.nom}</span>
              <input type="number" min="1" value={l.qte} onChange={e=>setFactLignes(prev=>prev.map((x,j)=>j===i?{...x,qte:parseInt(e.target.value)||1}:x))} style={{width:48,padding:"2px 6px",border:"1px solid #E5E7EB",borderRadius:6,fontSize:12}}/>
              <span style={{width:64,textAlign:"right"}}>{fmtFull(l.qte*l.pu)}</span>
              {l.consigne>0&&<span style={{width:64,textAlign:"right",color:"#7C3AED"}}>+{fmtFull(l.qte*l.consigne)}</span>}
              <button onClick={()=>setFactLignes(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer"}}>✕</button>
            </div>
          ))}
          <div style={{padding:"7px 10px",background:"#F9FAFB",display:"flex",justifyContent:"flex-end",gap:14,fontSize:12}}>
            <span>HT : <b>{fmtFull(factLignes.reduce((s,l)=>s+l.qte*l.pu,0))}</b></span>
            {factLignes.some(l=>l.consigne>0)&&<span style={{color:"#7C3AED"}}>Consignes : <b>{fmtFull(factLignes.reduce((s,l)=>s+l.qte*(l.consigne||0),0))}</b></span>}
            <span style={{fontWeight:700}}>Total : <b>{fmtFull(factLignes.reduce((s,l)=>s+l.qte*(l.pu+(l.consigne||0)),0))}</b></span>
          </div>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>Notes</label>
        <input value={factNotes} onChange={e=>setFactNotes(e.target.value)} placeholder="Notes optionnelles..." style={S.input}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setShowFactForm(false)} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveFact} disabled={!factClientId||factLignes.length===0||saving} style={{...S.btn(),flex:2,opacity:(!factClientId||factLignes.length===0||saving)?0.4:1}}>
          {saving?"Sauvegarde...":"Créer la facture"}
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

{/* ══ MODAL CLIENT FORM ══════════════════════════════════════════ */}
{showClientForm&&(
  <div style={S.modal} onClick={()=>setShowClientForm(false)}>
    <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <h2 style={{margin:0,fontSize:16,fontWeight:700}}>{editClient?"Modifier client":"Nouveau client"}</h2>
        <button onClick={()=>setShowClientForm(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9CA3AF"}}>✕</button>
      </div>
      <div style={{display:"grid",gap:10}}>
        {[["Nom *","nom","text"],["Adresse","adresse","text"],["Téléphone","telephone","text"],["Email","email","email"],["N° TVA","tva","text"],["Région","region","text"]].map(([l,k,t])=>(
          <div key={k}>
            <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>{l}</label>
            <input type={t} value={clientForm[k]||""} onChange={e=>setClientForm(p=>({...p,[k]:e.target.value}))} style={S.input}/>
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[["Type","type",["Snack","Restaurant","Café","Market","Administrative","Creche","Distributor"]],["Statut","statut",["Actif","Passif"]],["Conditions","conditions",["Comptant","7 jours","15 jours","30 jours","45 jours","60 jours"]]].map(([l,k,opts])=>(
            <div key={k}>
              <label style={{fontSize:12,color:"#6B7280",display:"block",marginBottom:3}}>{l}</label>
              <select value={clientForm[k]||opts[0]} onChange={e=>setClientForm(p=>({...p,[k]:e.target.value}))} style={S.input}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>setShowClientForm(false)} style={{...S.btn("#F3F4F6","#374151"),flex:1}}>Annuler</button>
        <button onClick={saveClient} disabled={saving} style={{...S.btn(),flex:2,opacity:saving?0.5:1}}>{saving?"Sauvegarde...":editClient?"Enregistrer":"Créer"}</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
