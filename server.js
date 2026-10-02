import express from "express";
import Stripe from "stripe";

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
app.post("/api/stripe/webhook", express.raw({type:"application/json"}), (req,res)=>{
  if(!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({error:"stripe_webhook_not_configured"});
  try {
    const event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],process.env.STRIPE_WEBHOOK_SECRET);
    globalThis.__oeqlPaymentEvents=globalThis.__oeqlPaymentEvents||[];
    globalThis.__oeqlPaymentEvents.unshift({id:event.id,type:event.type,created:event.created,received_at:new Date().toISOString(),status:["payment_intent.payment_failed","invoice.payment_failed","charge.failed"].includes(event.type)?"failed":"received"});
    globalThis.__oeqlPaymentEvents=globalThis.__oeqlPaymentEvents.slice(0,200);
    res.json({received:true});
  } catch(e) { res.status(400).json({error:"invalid_webhook",message:e.message}); }
});
app.use(express.json({limit:"1mb"}));
const PORT = process.env.PORT || 10000;
const SERVICE_TIERS = [
  {id:"open",name:"Open",amount:0,currency:"usd",interval:"month"},
  {id:"core",name:"Core",amount:900,currency:"usd",interval:"month"},
  {id:"plus",name:"Plus",amount:2500,currency:"usd",interval:"month"},
  {id:"pro",name:"Pro",amount:7500,currency:"usd",interval:"month"},
  {id:"business",name:"Business",amount:25000,currency:"usd",interval:"month"},
  {id:"enterprise",name:"Enterprise",amount:100000,currency:"usd",interval:"month"},
  {id:"institutional",name:"Institutional",amount:500000,currency:"usd",interval:"month"},
  {id:"infinity",name:"Infinity",amount:null,currency:"usd",interval:"custom"}
];


app.get("/health", (_req,res)=>res.json({ok:true,service:"OEQL Forever API",time:new Date().toISOString()}));
app.get("/api/integrations", (_req,res)=>res.json({stellar_phone:{status:"design-integration",web:"supported",mobile_pwa:"supported",native_os_adapters:"provider/device-specific",sim:"physical+eSIM provider-gated"},telephone:{api:"https://oeql-quantum-telecom-api.onrender.com",phone_web:"https://oeql-quantum-telecom-phone.onrender.com",status:"experimental post-6G control layer"},rollin:{marketplace:"https://rollin-marketplace-live.onrender.com",status:"deployed marketplace surface",repository:"https://github.com/way4out/Rollin"},quantum:{post_quantum_crypto:"architecture-ready",quantum_transport:"not claimed"}}));
app.get("/api/device/capabilities", (_req,res)=>res.json({timestamp:new Date().toISOString(),browser:["Web","PWA"],os_families:["iOS/iPadOS","Android","HarmonyOS","KaiOS","Linux","Windows","macOS","ChromeOS"],cellular:["2G","3G","4G/LTE","5G","5G-Advanced"],sim:["nano-SIM","eSIM/eUICC"],future:["post-6G/7G+ experimental"],quantum_security:["PQC hybrid crypto"],note:"Capability detection reports what the current device/browser exposes; it does not create unsupported modem, carrier, spectrum or OS capabilities."}));
app.get("/api/legal-entity", (_req,res)=>res.json({legal_name:"StellarNet LLC",owner:"Tucker Martin",principal_city:"Mesa",principal_state:"AZ",principal_zip:"85210",mailing_address:"Mesa, AZ 85210",address_note:"No street address was supplied to this application; do not fabricate one.",legal_notice:"https://www.stellarnetllc.com/legal-notice/"}));
app.get("/api/status", (_req,res)=>res.json({protocol:"oeql",namespace:"oeql://.forever",status:"operational-orchestration",financial_provider:stripe?"stripe-configured":"not-configured",payments:stripe?"stripe-configured":"not-configured",telecom_fulfillment:process.env.TELECOM_PROVIDER?"configured":"provider-required",treasury:"provider-gated",metals:"custodian-gated",lending:"licensed-provider-gated"}));
app.get("/api/payments/failures", (_req,res)=>res.json({source:stripe?"stripe-webhook":"not-configured",realtime:!!(stripe&&process.env.STRIPE_WEBHOOK_SECRET),events:globalThis.__oeqlPaymentEvents||[],note:"Configure a Stripe webhook endpoint for authoritative real-time failure events."}));
app.get("/api/universal/live", (_req,res)=>res.json({timestamp:new Date().toISOString(),mode:"live-event-stream",retroactive:"audit-history-only",forward:"new-events",quantum_transport:"not-claimed",telecom:"provider-backed",capabilities:["web","mobile-web","PWA","payments","telecom","marketplace","tasks","audit","universal-data"]}));
app.get("/api/views", (_req,res)=>res.json({count:13,views:["Command","Accounts","Payments","Telecom","Marketplace","Tasks","Universe+","UniverseSim+","H.I.R.","Gazette","Security","Audit","Settings"]}));
const MARKETPLACE = [
{id:"quantum-telecom",title:"Quantum Telecom",category:"telecom",price:4,unit:"month",buyable:true,downloadable:false,fulfillment:"authorized carrier/MVNO required",description:"$4/month service enrollment; valid SIM/eSIM delivery requires an authorized telecom provider."},
{id:"universe-plus",title:"Universe+",category:"software",price:0,buyable:false,downloadable:true,fulfillment:"instant digital access",description:"OEQL universal workspace layer."},
{id:"universe-sim-plus",title:"UniverseSim+",category:"telecom-software",price:0,buyable:false,downloadable:true,fulfillment:"software only; carrier service provider required",description:"SIM/eSIM management interface; does not create carrier credentials."},
{id:"hir",title:"H.I.R.",category:"intelligence",price:0,buyable:false,downloadable:true,fulfillment:"instant digital access",description:"Human/AI request and workflow orchestration layer."},
{id:"gazette",title:"Gazette",category:"publishing",price:0,buyable:false,downloadable:true,fulfillment:"instant digital access",description:"Publishing and public-information workspace."},
{id:"ai-builds",title:"AI Build Marketplace",category:"services",price:0,buyable:false,downloadable:false,fulfillment:"provider-gated",description:"Task intake for AI-assisted builds; third-party AI execution requires the selected provider."}
];
const TASK_TYPES = ["web build","mobile build","AI build","automation","content","research","legal-document draft","telecom integration","marketplace listing"];
app.get("/api/marketplace", (_req,res)=>res.json({listings:MARKETPLACE,checkout:"/api/checkout/listing",digital_delivery:"enabled-for-software",physical_shipping:"provider-required"}));
app.get("/api/tasks", (_req,res)=>res.json({task_types:TASK_TYPES,workflow:["create","price","authorize","execute","review","deliver"]}));
app.post("/api/tasks", (req,res)=>{const t=req.body||{};if(!t.title)return res.status(400).json({message:"title required"});res.status(201).json({id:"task_"+Date.now(),status:"queued",title:t.title,type:t.type||"web build",provider:t.provider||"user-selected",note:"Execution requires an authorized provider when applicable."})});
app.get("/api/telecom/catalog", (_req,res)=>res.json({
  currency:"usd",
  plans:{
    esim:{activation_one_time:4,monthly:4,activation_price_id:process.env.STRIPE_ESIM_ACTIVATION_PRICE_ID||null,monthly_price_id:process.env.STRIPE_TELECOM_PRICE_ID||null,checkout:"/api/checkout/telecom/esim"},
    physical_sim:{kit_one_time:4,monthly:4,kit_price_id:process.env.STRIPE_PHYSICAL_SIM_KIT_PRICE_ID||null,monthly_price_id:process.env.STRIPE_TELECOM_PRICE_ID||null,checkout:"/api/checkout/telecom/physical-sim",shipping:"provider-required"}
  },
  provider:{name:process.env.TELNYX_API_KEY?"telnyx":"not-configured",esim:!!process.env.TELNYX_API_KEY,physical_sim:!!process.env.PHYSICAL_SIM_FULFILLMENT_URL},
  note:"Connectivity and SIM fulfillment are only reported LIVE when the authorized provider credentials and fulfillment path are configured."
}));
app.post("/api/checkout/telecom", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Configure STRIPE_SECRET_KEY on the backend."});try{let price=process.env.STRIPE_TELECOM_PRICE_ID;if(!price)return res.status(503).json({message:"Configure STRIPE_TELECOM_PRICE_ID for the $4/month plan."});let s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price,quantity:1}],success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?cancelled=1",metadata:{oeql_product:"telecom_monthly",fulfillment:"provider_required"}});res.json({url:s.url})}catch(e){res.status(502).json({message:e.message})}});
app.post("/api/checkout/telecom/esim", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Payment provider not configured."});if(!process.env.TELNYX_API_KEY)return res.status(503).json({message:"eSIM fulfillment is not enabled until the authorized telecom provider credential is configured.",provider_ready:false});try{const activation=process.env.STRIPE_ESIM_ACTIVATION_PRICE_ID,monthly=process.env.STRIPE_TELECOM_PRICE_ID;if(!activation||!monthly)return res.status(503).json({message:"eSIM pricing is not configured."});const s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:activation,quantity:1},{price:monthly,quantity:1}],customer_creation:"always",success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=esim&paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=esim&cancelled=1",metadata:{oeql_product:"esim",activation_fee:"4",monthly_fee:"4",fulfillment:"telnyx_provider_required"}});res.json({url:s.url,provider_ready:!!process.env.TELNYX_API_KEY})}catch(e){res.status(502).json({message:e.message})}});
app.post("/api/checkout/telecom/physical-sim", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Payment provider not configured."});if(!process.env.PHYSICAL_SIM_FULFILLMENT_URL)return res.status(503).json({message:"Physical SIM checkout is disabled until an authorized fulfillment/shipping provider endpoint is configured.",provider_ready:false});try{const kit=process.env.STRIPE_PHYSICAL_SIM_KIT_PRICE_ID,monthly=process.env.STRIPE_TELECOM_PRICE_ID;if(!kit||!monthly)return res.status(503).json({message:"Physical SIM pricing is not configured."});const s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:kit,quantity:1},{price:monthly,quantity:1}],customer_creation:"always",shipping_address_collection:{allowed_countries:["US"]},success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=physical-sim&paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=physical-sim&cancelled=1",metadata:{oeql_product:"physical_sim",kit_fee:"4",monthly_fee:"4",fulfillment:"authorized_physical_sim_provider_required"}});res.json({url:s.url,provider_ready:!!process.env.PHYSICAL_SIM_FULFILLMENT_URL})}catch(e){res.status(502).json({message:e.message})}});
app.post("/api/checkout/listing", async (req,res)=>{if(!stripe)return res.status(503).json({message:"Payment provider not configured."});try{let s=await stripe.checkout.sessions.create({mode:"payment",line_items:[{price_data:{currency:"usd",product_data:{name:"OEQL Marketplace Item"},unit_amount:Math.max(50,Math.round(Number(req.body?.amount||0)*100))},quantity:1}],success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?cancelled=1"});res.json({url:s.url})}catch(e){res.status(502).json({message:e.message})}});

// Telecom fulfillment adapter: real SIM/eSIM provisioning only when an authorized provider credential is configured.
async function telnyx(path, options={}) {
  const key=process.env.TELNYX_API_KEY;
  if(!key) throw new Error("TELNYX_API_KEY not configured");
  const r=await fetch("https://api.telnyx.com/v2"+path,{...options,headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json",...(options.headers||{})}});
  const j=await r.json();
  if(!r.ok) throw new Error(j?.errors?.[0]?.detail||j?.message||"Telecom provider error");
  return j;
}
app.get("/api/telecom/status", (_req,res)=>res.json({
  provider:process.env.TELNYX_API_KEY?"telnyx":"not-configured",
  physical_sim:process.env.TELNYX_API_KEY?"provider-ready":"provider-credential-required",
  esim:process.env.TELNYX_API_KEY?"provider-ready":"provider-credential-required",
  service_billing:stripe&&process.env.STRIPE_TELECOM_PRICE_ID?"stripe-live":"not-configured"
}));
app.post("/api/telecom/esim/purchase", async (req,res)=>{
  try{
    const body={quantity:Math.max(1,Math.min(10,Number(req.body?.quantity||1))),status:"enabled"};
    if(req.body?.sim_card_group_id) body.sim_card_group_id=req.body.sim_card_group_id;
    if(req.body?.tags) body.tags=req.body.tags;
    const out=await telnyx("/actions/purchase/esims",{method:"POST",body:JSON.stringify(body)});
    res.status(201).json({provider:"telnyx",result:out});
  }catch(e){res.status(503).json({error:"esim_provider_required",message:e.message});}
});
app.post("/api/telecom/physical-sim/order", async (req,res)=>{
  if(!process.env.PHYSICAL_SIM_FULFILLMENT_URL) return res.status(503).json({error:"physical_sim_fulfillment_required",message:"Configure an authorized physical-SIM fulfillment/shipping provider before accepting payment for physical SIM orders.",checkout_available:false});
  try{
    const out=await fetch(process.env.PHYSICAL_SIM_FULFILLMENT_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":process.env.PHYSICAL_SIM_FULFILLMENT_TOKEN?("Bearer "+process.env.PHYSICAL_SIM_FULFILLMENT_TOKEN):""},body:JSON.stringify({product:"oeql-quantum-telecom-sim",quantity:Math.max(1,Math.min(10,Number(req.body?.quantity||1))),shipping_address:req.body?.shipping_address||null})});
    const j=await out.json(); if(!out.ok) throw new Error(j?.message||"Fulfillment provider rejected order");
    res.status(201).json({fulfillment:j});
  }catch(e){res.status(503).json({error:"physical_sim_fulfillment_error",message:e.message});}
});
app.get("/api/contracts/templates", (_req,res)=>res.json({notice:"Templates require human/legal review before use.",templates:[
{id:"service-terms",title:"AI / Software Service Terms",scope:"software, AI-assisted builds, marketplace services"},
{id:"telecom-terms",title:"Telecom Service Terms",scope:"connectivity, SIM/eSIM, acceptable use, privacy, cancellation"},
{id:"marketplace-seller",title:"Marketplace Seller Agreement",scope:"seller listings, fulfillment, refunds, IP, prohibited goods"},
{id:"contractor-ai",title:"AI Contractor / Provider Terms",scope:"task delegation, deliverables, confidentiality, IP, human review"}
]}));
app.get("/api/ai/providers", (_req,res)=>res.json({mode:"provider-agnostic",configured:{
stripe:!!stripe,telnyx:!!process.env.TELNYX_API_KEY,ai:!!process.env.AI_PROVIDER_API_KEY
},policy:"Only authorized providers are invoked; no arbitrary third-party account access is assumed."}));
app.get("/api/rollin", (_req,res)=>res.json({status:"integrated-marketplace-layer",repository:"way4out/Rollin",features:["listings","orders","seller workflows","digital delivery","shipping workflow"]}));

app.get("/api/tiers", (_req,res)=>res.json({company:"StellarNet LLC",product:"OEQL Forever Bank application services",regulated_financial_product:false,tiers:SERVICE_TIERS}));
app.get("/api/legal-status", (_req,res)=>res.json({application_layer:"deployed",deposit_taking:"not_authorized",card_issuance:"issuer-required",money_transmission:"licensed-provider-required",fdic_insurance:"not claimed",bank_charter:"not claimed"}));
app.get("/api/provider/stripe", async (_req,res)=>{
  if(!stripe)return res.json({configured:false});
  try{
    const a=await stripe.accounts.retrieve();
    res.json({configured:true,account_id:a.id,charges_enabled:a.charges_enabled,payouts_enabled:a.payouts_enabled,details_submitted:a.details_submitted});
  }catch(e){res.status(502).json({error:"stripe_check_failed",detail:e.message});}
});
app.get("/api/treasury/accounts", async (_req,res)=>{
  if(!stripe)return res.status(503).json({error:"provider_not_configured"});
  try{res.json(await stripe.rawRequest("GET","/v2/money_management/financial_accounts"))}
  catch(e){res.status(502).json({error:"treasury_unavailable",detail:e.message});}
});
app.get("/api/treasury/transactions", async (_req,res)=>{
  if(!stripe)return res.status(503).json({error:"provider_not_configured"});
  try{res.json(await stripe.rawRequest("GET","/v2/money_management/transactions"))}
  catch(e){res.status(502).json({error:"treasury_unavailable",detail:e.message});}
});
app.get("/api/identity", (_req,res)=>res.json({
  namespace:"oeql://.forever",https_canonical:"https://oeql.onrender.com/",
  note:"oeql is an application namespace; HTTPS is the public transport fallback."
}));
app.get("/api/metal-policy", (_req,res)=>res.json({
  gold:{status:"custodian-required",backing_claim:false},
  silver:{status:"custodian-required",backing_claim:false},
  required_controls:["verified dealer/custodian","allocated ownership records","independent valuation","insurance/custody terms","customer disclosures","reconciliation"]
}));
app.get("/", (_req,res)=>res.sendFile(process.cwd()+"/bank.html"));
app.get("/bank", (_req,res)=>res.sendFile(process.cwd()+"/bank.html"));
app.use(express.static("."));
app.listen(PORT,"0.0.0.0",()=>console.log("OEQL Forever API listening on "+PORT));
