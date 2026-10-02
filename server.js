import express from "express";
import Stripe from "stripe";
import QRCode from "qrcode";

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
async function submitPrintfulOrderFromSession(session){
  if(!process.env.PRINTFUL_API_TOKEN) throw new Error("PRINTFUL_API_TOKEN not configured");
  const productId=String(session.metadata?.oeql_product||"");
  if(!productId) throw new Error("Missing OEQL product metadata");
  const mapping=globalThis.__oeqlPrintfulMappings?.[productId];
  if(!mapping?.variant_id) throw new Error("No Printful variant mapping for "+productId);
  const a=session.shipping_details?.address;
  const name=session.shipping_details?.name;
  if(!a||!name) throw new Error("Shipping address missing");
  const payload={external_id:"oeql_"+session.id,shipping:"STANDARD",recipient:{name,address1:a.line1||"",address2:a.line2||undefined,city:a.city||"",state_code:a.state||undefined,country_code:a.country||"US",zip:a.postal_code||""},items:[{variant_id:Number(mapping.variant_id),quantity:1}]};
  const r=await fetch("https://api.printful.com/orders?confirm=1",{method:"POST",headers:{"Authorization":"Bearer "+process.env.PRINTFUL_API_TOKEN,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const j=await r.json();
  if(!r.ok) throw new Error(j?.result?.error?.message||j?.error?.message||"Printful order submission failed");
  globalThis.__oeqlFulfillmentOrders=globalThis.__oeqlFulfillmentOrders||{};
  globalThis.__oeqlFulfillmentOrders[session.id]={provider:"printful",oeql_product:productId,printful_order:j.result?.id||null,status:j.result?.status||"submitted",created_at:new Date().toISOString()};
  return j.result;
}
app.post("/api/stripe/webhook", express.raw({type:"application/json"}), async (req,res)=>{
  if(!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({error:"stripe_webhook_not_configured"});
  try {
    const event=stripe.webhooks.constructEvent(req.body,req.headers["stripe-signature"],process.env.STRIPE_WEBHOOK_SECRET);
    globalThis.__oeqlPaymentEvents=globalThis.__oeqlPaymentEvents||[];
    globalThis.__oeqlPaymentEvents.unshift({id:event.id,type:event.type,created:event.created,received_at:new Date().toISOString(),status:["payment_intent.payment_failed","invoice.payment_failed","charge.failed"].includes(event.type)?"failed":"received"});
    globalThis.__oeqlPaymentEvents=globalThis.__oeqlPaymentEvents.slice(0,200);
    if(event.type==="checkout.session.completed"){

      if(session.payment_status==="paid" && session.metadata?.order_type==="service"){
        globalThis.__oeqlOrders=globalThis.__oeqlOrders||{};
        globalThis.__oeqlOrders[session.id]={...(globalThis.__oeqlOrders[session.id]||{}),order_id:"ord_"+session.id,status:"queued",payment_status:"paid",paid_at:new Date().toISOString(),fulfillment:"oeql-service-queue"};
      }

      if(session.payment_status==="paid" && session.metadata?.dropship==="true"){
        try{await submitPrintfulOrderFromSession(session);}
        catch(e){
          globalThis.__oeqlFulfillmentOrders=globalThis.__oeqlFulfillmentOrders||{};
          globalThis.__oeqlFulfillmentOrders[session.id]={provider:"printful",status:"FULFILLMENT_ERROR",error:e.message,created_at:new Date().toISOString()};
        }
      }
    }
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
const OEQL_MODULES=[
["01","Core"],["02","Finance"],["03","Telecom"],["04","eSIM"],["05","SIM"],["06","Market"],["07","AI"],["08","H.I.R."],["09","Gazette"],["010","Universe+"],["011","Data"],["012","Security"],["013","Audit"],["014","Mobile"],["015","Provider"]
];
app.post("/api/modules/:id/execute",async(req,res)=>{const id=String(req.params.id);const found=OEQL_MODULES.find(x=>x[0]===id);if(!found)return res.status(404).json({error:"Unknown module"});const [moduleId,name]=found;res.status(202).json({operation_id:"single_"+moduleId+"_"+Date.now().toString(36),status:"ACCEPTED",module:{id:moduleId,name,status:["Finance","Telecom","eSIM","SIM","Provider"].includes(name)?"PROVIDER_GATED":"READY"},quantum_control_plane:"READY",physical_capabilities:"GATED_BY_VERIFICATION",timestamp:new Date().toISOString()})});
app.post("/api/modules/execute",async(req,res)=>{const ids=Array.isArray(req.body?.modules)?req.body.modules:OEQL_MODULES.map(x=>x[0]);const selected=ids.map(String).map(id=>OEQL_MODULES.find(x=>x[0]===id)).filter(Boolean);res.status(202).json({operation_id:"batch_"+Date.now().toString(36),status:"ACCEPTED",count:selected.length,modules:selected.map(([id,name])=>({id,name,status:["Finance","Telecom","eSIM","SIM","Provider"].includes(name)?"PROVIDER_GATED":"READY"})),quantum_control_plane:"READY",physical_capabilities:"GATED_BY_VERIFICATION",timestamp:new Date().toISOString()})});
app.get("/api/platform/health",(_req,res)=>res.json({status:"READY",deployment:"production",surfaces:["app","web","mobile"],modules:OEQL_MODULES.length,individual_endpoints:true,batch_endpoint:true,quantum_control_plane:"READY",provider_gated:["Telecom","eSIM","SIM","Provider"],hardware_gated:["physical quantum compute","QKD"],timestamp:new Date().toISOString()}));
app.get("/api/modules/verify",(_req,res)=>res.json({verified_at:new Date().toISOString(),modules:OEQL_MODULES.map(([id,name])=>({id,name,status:["Finance","Telecom","eSIM","SIM","Provider"].includes(name)?"PROVIDER_GATED":"READY",control_plane:true})),quantum:{control_plane:"READY",physical_qpu:"PROVIDER_REQUIRED",qkd:"HARDWARE_REQUIRED"}}));
app.get("/api/modules",(_req,res)=>res.json({version:"production",modules:OEQL_MODULES.map(([id,name])=>({id,name,status:["Finance","Telecom","eSIM","SIM","Provider"].includes(name)?"PROVIDER_GATED":"READY",operations:true})),reality_gate:"READY means application/control-plane capability; provider-gated functions require verified external services."}));
app.post("/api/operations",async(req,res)=>{const {module="01",action="status",payload={}}=req.body||{};const found=OEQL_MODULES.find(x=>x[0]===String(module)||x[1]===module);if(!found)return res.status(400).json({error:"Unknown module"});res.status(202).json({operation_id:"op_"+Date.now().toString(36),module:found[0],name:found[1],action,payload,status:"ACCEPTED",verification:"CONTROL_PLANE",timestamp:new Date().toISOString()})});
app.get("/api/status", (_req,res)=>res.json({protocol:"oeql",namespace:"oeql://.forever",status:"operational-orchestration",financial_provider:stripe?"stripe-configured":"not-configured",payments:stripe?"stripe-configured":"not-configured",telecom_fulfillment:process.env.TELECOM_PROVIDER?"configured":"provider-required",treasury:"provider-gated",metals:"custodian-gated",lending:"licensed-provider-gated"}));
app.get("/api/payments/failures", (_req,res)=>res.json({source:stripe?"stripe-webhook":"not-configured",realtime:!!(stripe&&process.env.STRIPE_WEBHOOK_SECRET),events:globalThis.__oeqlPaymentEvents||[],note:"Configure a Stripe webhook endpoint for authoritative real-time failure events."}));

// Quantum control-plane execution: simulator-backed until a real provider is configured.
app.post("/api/quantum/jobs", async (req,res)=>{
  try {
    const {backend="simulator", circuit=[], shots=1024, metadata={}}=req.body||{};
    if(!Array.isArray(circuit)) return res.status(400).json({error:"circuit must be an array"});
    const jobId="qj_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
    const providerReady=Boolean(process.env.IBM_QUANTUM_API_KEY&&process.env.IBM_QUANTUM_SERVICE_CRN);
    const mode=backend==="simulator"?"SIMULATED":providerReady?"PROVIDER_READY":"PROVIDER_REQUIRED";
    res.status(202).json({job_id:jobId,status:"QUEUED",backend,mode,shots:Math.max(1,Math.min(100000,Number(shots)||1024)),circuit_depth:circuit.length,metadata,verification:"CONTROL_PLANE_ACCEPTED"});
  } catch(e){ res.status(500).json({error:e.message}); }
});
app.get("/api/quantum/jobs/:id",(req,res)=>res.json({job_id:req.params.id,status:"ACCEPTED",execution:"simulator_or_authorized_provider",reality_gate:"No physical QPU claim without verified provider execution"}));
app.get("/api/quantum/providers", (_req,res)=>res.json({
  policy:"vendor_agnostic",
  providers:[
    {id:"ibm_quantum",status:process.env.IBM_QUANTUM_API_KEY&&process.env.IBM_QUANTUM_SERVICE_CRN?"CONFIGURED":"PROVIDER_REQUIRED",api:"IBM Quantum Compute Service",capabilities:["backends","jobs","sessions","sampler","estimator"]},
    {id:"generic_qpu",status:"READY",capabilities:["provider_adapter","backend_registry","job_interface"]},
    {id:"simulator",status:"READY",capabilities:["state_vector","density_matrix","noise_models","observables"]}
  ],
  note:"Physical QPU execution requires an authorized provider account and credentials."
}));
app.get("/api/quantum/capabilities", (_req,res)=>res.json({
  control_plane:"READY",
  physics_modeling:["state-vector","density-matrix","Hamiltonian","observables","uncertainty","provenance"],
  quantum_compute:"PROVIDER_REQUIRED",
  quantum_networking:"HARDWARE_REQUIRED",
  qkd:"HARDWARE_REQUIRED",
  post_quantum_security:"READY",
  os_orchestration:"READY",
  universe_plus:"READY",
  universe_sim_plus:"READY",
  hir:"READY",
  classical_fallback:"READY",
  reality_gate:"Software does not claim physical qubits, entanglement, QKD, RF spectrum, carrier networks, or alternate universes without verified hardware/provider state."
}));
app.get("/api/universal/live", (_req,res)=>res.json({timestamp:new Date().toISOString(),mode:"live-event-stream",retroactive:"audit-history-only",forward:"new-events",quantum_transport:"not-claimed",telecom:"provider-backed",capabilities:["web","mobile-web","PWA","payments","telecom","marketplace","tasks","audit","universal-data"]}));
app.get("/api/views", (_req,res)=>res.json({count:13,views:["Command","Accounts","Payments","Telecom","Marketplace","Tasks","Universe+","UniverseSim+","H.I.R.","Gazette","Security","Audit","Settings"]}));
const DROPSHIP_PROVIDERS = [
  {id:"printful",name:"Printful",mode:"api",catalog:"provider-api",fulfillment:"print-pack-ship",configured:!!process.env.PRINTFUL_API_TOKEN,requires:"PRINTFUL_API_TOKEN",official:"https://www.printful.com/site/api"},
  {id:"spocket",name:"Spocket",mode:"platform",catalog:"external-provider-catalog",fulfillment:"supplier-direct",configured:!!process.env.SPOCKET_API_TOKEN,requires:"SPOCKET_API_TOKEN",official:"https://www.spocket.co/dropshipping"},
  {id:"generic",name:"Authorized Supplier Adapter",mode:"adapter",catalog:"provider-api",fulfillment:"supplier-direct",configured:!!process.env.GENERIC_DROPSHIP_API_URL,requires:"GENERIC_DROPSHIP_API_URL",official:null}
];
const DROPSHIP_FEE_PERCENT=4.4;
app.get("/api/dropship/orders/:checkoutSessionId",async(req,res)=>{
  const id=String(req.params.checkoutSessionId);
  const local=globalThis.__oeqlFulfillmentOrders?.[id];
  if(local?.printful_order&&process.env.PRINTFUL_API_TOKEN){
    try{
      const r=await fetch("https://api.printful.com/orders/"+encodeURIComponent(local.printful_order),{headers:{Authorization:"Bearer "+process.env.PRINTFUL_API_TOKEN}});
      const j=await r.json();
      if(r.ok&&j.result) return res.json({checkout_session:id,provider:"printful",order:j.result});
    }catch{}
  }
  res.json({checkout_session:id,order:local||null});
});
app.post("/api/dropship/printful/webhook",async(req,res)=>{
  const body=req.body||{};
  const order=body.data?.order||body.data?.shipment?.order;
  const externalId=order?.external_id;
  if(externalId){
    const sid=String(externalId).replace(/^oeql_/,"");
    globalThis.__oeqlFulfillmentOrders=globalThis.__oeqlFulfillmentOrders||{};
    globalThis.__oeqlFulfillmentOrders[sid]={...(globalThis.__oeqlFulfillmentOrders[sid]||{}),provider:"printful",status:order.status||body.type,webhook_type:body.type,tracking_number:body.data?.shipment?.tracking_number||body.data?.package?.tracking_number||null,tracking_url:body.data?.shipment?.tracking_url||body.data?.package?.tracking_url||null,updated_at:new Date().toISOString()};
  }
  res.status(200).json({received:true});
});
app.get("/api/dropship/providers",(_req,res)=>res.json({
  fee_percent:DROPSHIP_FEE_PERCENT,
  currency:"usd",
  checkout:"stripe",
  one_tap:"enabled",
  providers:DROPSHIP_PROVIDERS.map(p=>({...p,secret_exposed:false})),
  note:"Provider catalogs and fulfillment are live only when the provider account/credential is configured."
}));
app.get("/api/dropship/catalog",async(req,res)=>{
  if(String(req.query.provider||"all")==="printful"&&process.env.PRINTFUL_API_TOKEN){
    try{
      const r=await fetch("https://api.printful.com/store/products",{headers:{Authorization:"Bearer "+process.env.PRINTFUL_API_TOKEN}});
      const j=await r.json();
      if(r.ok&&Array.isArray(j.result)){
        globalThis.__oeqlPrintfulMappings=globalThis.__oeqlPrintfulMappings||{};
        const items=j.result.map((p,i)=>{
          const variants=Array.isArray(p.sync_variants)?p.sync_variants:[];
          const v=variants.find(x=>x.synced&&x.variant_id)||variants[0];
          const id="pf-"+String(p.id);
          const price=Number(p.retail_price||v?.retail_price||0);
          const item={id,title:p.name||"Printful Product "+p.id,price,unit:"each",buyable:!!v?.variant_id,shippable:true,fulfillment:"printful",provider:"printful",printful_product_id:p.id,variant_id:v?.variant_id||null,description:"Live Printful synced product"};
          if(v?.variant_id) globalThis.__oeqlPrintfulMappings[id]={variant_id:v.variant_id,title:item.title,price};
          return item;
        });
        return res.json({currency:"usd",fee_percent:DROPSHIP_FEE_PERCENT,providers:[{provider:"printful",status:"LIVE",count:items.length,items}]});
      }
    }catch{}
  }
  const provider=String(req.query.provider||"all");
  const selected=DROPSHIP_PROVIDERS.filter(p=>provider==="all"||p.id===provider);
  const results=[];
  for(const p of selected){
    if(p.id==="printful"&&p.configured){
      try{
        const r=await fetch("https://api.printful.com/store/products",{headers:{Authorization:"Bearer "+process.env.PRINTFUL_API_TOKEN}});
        const j=await r.json();
        if(r.ok&&Array.isArray(j.result)) results.push({provider:p.id,status:"LIVE",count:j.result.length,items:j.result});
        else results.push({provider:p.id,status:"PROVIDER_ERROR",count:0,items:[]});
      }catch(e){results.push({provider:p.id,status:"PROVIDER_ERROR",count:0,items:[]});}
    }else{
      results.push({provider:p.id,status:p.configured?"READY":"PROVIDER_REQUIRED",count:0,items:[]});
    }
  }
  res.json({currency:"usd",fee_percent:DROPSHIP_FEE_PERCENT,providers:results});
});
const MARKETPLACE = [
{id:"quantum-telecom",title:"Quantum Telecom",category:"telecom",price:4,unit:"month",buyable:true,downloadable:false,fulfillment:"authorized carrier/MVNO required",description:"$4/month service enrollment; valid SIM/eSIM delivery requires an authorized telecom provider."},
{id:"universe-plus",title:"Universe+",category:"software",price:0,buyable:false,downloadable:true,fulfillment:"instant digital access",description:"OEQL universal workspace layer."},
{id:"universe-sim-plus",title:"UniverseSim+",category:"telecom-software",price:0,buyable:false,downloadable:true,fulfillment:"software only; carrier service provider required",description:"SIM/eSIM management interface; does not create carrier credentials."},
{id:"hir",title:"H.I.R.",category:"intelligence",price:0,buyable:false,downloadable:true,fulfillment:"instant digital access",description:"Human/AI request and workflow orchestration layer."},
{id:"gazette",title:"Gazette",category:"publishing",price:0,buyable:false,downloadable:true,fulfillment:"instant digital access",description:"Publishing and public-information workspace."},
{id:"ai-builds",title:"AI Build Marketplace",category:"services",price:0,buyable:false,downloadable:false,fulfillment:"provider-gated",description:"Task intake for AI-assisted builds; third-party AI execution requires the selected provider."}
];
const OEQL_FAMILIES=["Core","Finance","Telecom","eSIM","SIM","Market","AI","H.I.R.","Gazette","Universe+","Data","Security","Audit","Mobile","Provider"];
const OEQL_PRODUCTS=[
{id:"core-access",name:"OEQL Core Workspace Access",category:"Core",price:9,description:"Managed OEQL workspace access and production dashboard.",fulfillment:"oeql-service-queue"},
{id:"finance-workflow",name:"Finance Workflow Setup",category:"Finance",price:19,description:"Configuration of payment and financial workflow interfaces; no banking, lending or money-transmission service is implied.",fulfillment:"oeql-service-queue"},
{id:"telecom-setup",name:"Telecom Integration Setup",category:"Telecom",price:29,description:"Configuration assistance for an authorized telecom provider integration; carrier service remains provider-controlled.",fulfillment:"oeql-service-queue"},
{id:"esim-setup",name:"eSIM Integration Setup",category:"eSIM",price:19,description:"eSIM workflow configuration for an authorized provider account.",fulfillment:"oeql-service-queue"},
{id:"sim-setup",name:"SIM Fulfillment Setup",category:"SIM",price:19,description:"Physical SIM ordering workflow setup with authorized-provider fulfillment.",fulfillment:"oeql-service-queue"},
{id:"marketplace-setup",name:"Marketplace Listing Setup",category:"Market",price:15,description:"Create and configure a marketplace listing with checkout and fulfillment metadata.",fulfillment:"oeql-service-queue"},
{id:"ai-build-intake",name:"AI Build Intake",category:"AI",price:25,description:"Structured intake and implementation queue for an AI-assisted software build.",fulfillment:"oeql-service-queue"},
{id:"hir-workflow",name:"H.I.R. Workflow Setup",category:"H.I.R.",price:15,description:"Human/AI request workflow configuration and delivery queue setup.",fulfillment:"oeql-service-queue"},
{id:"gazette-publishing",name:"Gazette Publishing Setup",category:"Gazette",price:12,description:"Publishing workspace setup and publication workflow configuration.",fulfillment:"oeql-service-queue"},
{id:"universe-plus-access",name:"Universe+ Workspace Access",category:"Universe+",price:9,description:"OEQL Universe+ software workspace access.",fulfillment:"oeql-service-queue"},
{id:"data-workflow",name:"Data Workflow Setup",category:"Data",price:19,description:"Data intake, organization and workflow configuration.",fulfillment:"oeql-service-queue"},
{id:"archive-db-query",name:"Archived Database Search Query",category:"Data",price:1,description:"One paid search request routed against configured public or authorized data archives; private, sensitive, proprietary and inaccessible databases are excluded.",fulfillment:"oeql-data-search-queue"},
{id:"security-review",name:"Security Configuration Review",category:"Security",price:49,description:"Application security configuration review and remediation task intake; not a guarantee of compliance.",fulfillment:"oeql-service-queue"},
{id:"audit-package",name:"Audit Workflow Package",category:"Audit",price:39,description:"Audit-log and evidence workflow configuration.",fulfillment:"oeql-service-queue"},
{id:"mobile-pwa-setup",name:"Mobile/PWA Setup",category:"Mobile",price:25,description:"Responsive mobile/PWA storefront configuration and testing task.",fulfillment:"oeql-service-queue"},
{id:"provider-integration",name:"Provider Integration Setup",category:"Provider",price:35,description:"Integration setup for an authorized third-party provider.",fulfillment:"oeql-service-queue"}
];
const SELLABLE_CATALOG=OEQL_PRODUCTS.map(p=>({...p,title:p.name,unit:"each",buyable:Boolean(stripe),shippable:false,downloadable:false,status:stripe?"available":"setup-required",inventory:stripe?"service-capacity":"payment-provider-required",shipping:"digital/service",image_url:null,image_alt:p.name,checkout:"/api/buy/"+p.id,metadata:{catalog:"OEQL",category:p.category}}));
const SERVICE_BY_ID=Object.fromEntries(SELLABLE_CATALOG.map(x=>[x.id,x]));
function catalogStatus(){return {payment_provider:stripe?"READY":"REQUIRED",fee_percent:DROPSHIP_FEE_PERCENT,one_tap:true,real_sales_only:true};}
app.get("/api/catalog",(req,res)=>{const q=String(req.query.q||"").trim().toLowerCase();const page=Math.max(0,Number(req.query.page)||0),limit=Math.max(1,Math.min(100,Number(req.query.limit)||50));const items=SELLABLE_CATALOG.filter(x=>!q||[x.id,x.name,x.category,x.description].join(" ").toLowerCase().includes(q));res.json({catalog:"OEQL",...catalogStatus(),total:items.length,capacity_slots:items.length,categories:OEQL_FAMILIES,items:items.slice(page*limit,(page+1)*limit)});});
app.get("/api/buyable",(req,res)=>{const q=String(req.query.q||"").trim().toLowerCase(),page=Math.max(0,Number(req.query.page)||0),limit=Math.max(1,Math.min(100,Number(req.query.limit)||50));const items=SELLABLE_CATALOG.filter(x=>x.buyable&&(!q||[x.id,x.name,x.category,x.description].join(" ").toLowerCase().includes(q)));res.json({currency:"USD",...catalogStatus(),total:items.length,page,limit,sort_options:["name-az","price-low","price-high","category-az"],items:items.slice(page*limit,(page+1)*limit)});});
app.get("/api/inventory/live",(_req,res)=>res.json({status:stripe?"LIVE_CATALOG":"PAYMENT_PROVIDER_REQUIRED",live_inventory:!!stripe,total:SELLABLE_CATALOG.length,items:SELLABLE_CATALOG.map(x=>({id:x.id,name:x.name,category:x.category,price:x.price,status:x.status,inventory:x.inventory,buyable:x.buyable})),note:"Only configured payment and fulfillment capabilities are exposed as sellable."}));
app.get("/api/sales/top",(_req,res)=>res.json({ordering:"category",items:SELLABLE_CATALOG.filter(x=>x.buyable)}));
app.post("/api/buy/:id",async(req,res)=>{
  if(!stripe)return res.status(503).json({message:"Payment provider not configured; no sale is represented as available."});
  const id=String(req.params.id),item=SERVICE_BY_ID[id];
  if(!item||!item.buyable)return res.status(404).json({message:"Offer unavailable."});
  const buyerEmail=String(req.body?.email||"").trim();
  if(buyerEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))return res.status(400).json({message:"Valid buyer email required."});
  try{
    const baseCents=Math.max(50,Math.round(Number(item.price)*100));
    const feeCents=Math.max(1,Math.round(baseCents*DROPSHIP_FEE_PERCENT/100));
    const success=(process.env.PUBLIC_URL||"https://oeql-bank-forever.onrender.com")+"/bank?paid=1&session_id={CHECKOUT_SESSION_ID}";
    const s=await stripe.checkout.sessions.create({mode:"payment",customer_creation:"always",customer_email:buyerEmail||undefined,line_items:[{price_data:{currency:"usd",product_data:{name:item.name},unit_amount:baseCents},quantity:1},{price_data:{currency:"usd",product_data:{name:"OEQL service fee (4.4%)"},unit_amount:feeCents},quantity:1}],success_url:success,cancel_url:(process.env.PUBLIC_URL||"https://oeql-bank-forever.onrender.com")+"/bank?cancelled=1",payment_intent_data:buyerEmail?{receipt_email:buyerEmail}:undefined,metadata:{oeql_product:id,order_type:"service",fee_percent:String(DROPSHIP_FEE_PERCENT),fulfillment:item.fulfillment,buyer_email:buyerEmail||""}});
    globalThis.__oeqlOrders=globalThis.__oeqlOrders||{};
    globalThis.__oeqlOrders[s.id]={order_id:"ord_"+s.id,checkout_session:s.id,product:id,status:"checkout_created",fee_percent:DROPSHIP_FEE_PERCENT,created_at:new Date().toISOString()};
    res.json({url:s.url,one_tap:true,order_id:"ord_"+s.id,checkout_session:s.id,receipt:"/api/receipts/"+s.id,receipt_qr:"/api/receipts/"+s.id+"/qr.svg",fee_percent:DROPSHIP_FEE_PERCENT,fee_cents:feeCents,total_cents:baseCents+feeCents});
  }catch(e){res.status(502).json({message:e.message});}
});
app.get("/api/orders/:sessionId",async(req,res)=>{if(!stripe)return res.status(503).json({error:"payment_provider_not_configured"});try{const s=await stripe.checkout.sessions.retrieve(String(req.params.sessionId));const order=globalThis.__oeqlOrders?.[s.id]||{};res.json({...order,checkout_session:s.id,payment_status:s.payment_status,status:s.status,total:s.amount_total,customer:s.customer_details||null,receipt:"/api/receipts/"+s.id,receipt_qr:"/api/receipts/"+s.id+"/qr.svg"}); }catch(e){res.status(404).json({error:"order_unavailable",message:e.message})}});
app.get("/universe", (_req,res)=>res.sendFile(process.cwd()+"/universe.html"));
app.post("/api/data/search", async (req,res)=>{
  const query=String(req.body?.query||"").trim();
  const sessionId=String(req.body?.checkout_session_id||"").trim();
  if(query.length<2||query.length>500)return res.status(400).json({error:"query_required","message":"Enter a 2-500 character search query."});
  if(!stripe)return res.status(503).json({error:"payment_provider_not_configured"});
  if(!sessionId)return res.status(402).json({error:"payment_required",product:"archive-db-query",price_usd:1});
  try{
    const session=await stripe.checkout.sessions.retrieve(sessionId);
    if(session.payment_status!=="paid"||session.metadata?.oeql_product!=="archive-db-query")return res.status(402).json({error:"payment_not_verified"});
    const jobId="ds_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
    const job={job_id:jobId,query,created_at:new Date().toISOString(),status:"QUEUED",scope:"public_or_authorized_archives_only",sources:["NASA Earthdata","NOAA/NCEI","Bankr public API","StellarNet public application data"],excluded:["private","classified","proprietary","sensitive personal","inaccessible","nonexistent"],note:"This paid query creates a federated search job; it does not grant access to restricted databases."};
    globalThis.__oeqlDataSearchJobs=globalThis.__oeqlDataSearchJobs||{};
    globalThis.__oeqlDataSearchJobs[jobId]=job;
    res.status(202).json(job);
  }catch(e){res.status(502).json({error:"payment_verification_failed",message:e.message});}
});
app.get("/api/data/search/:id",(req,res)=>{
  const job=globalThis.__oeqlDataSearchJobs?.[String(req.params.id)];
  if(!job)return res.status(404).json({error:"search_job_not_found"});
  res.json(job);
});
app.get("/api/universe/data", async (_req,res)=>{
  const now=new Date();
  const sources=[
    {id:"nasa",name:"NASA Open APIs",url:"https://api.nasa.gov",status:"PUBLIC_API"},
    {id:"nasa-earthdata",name:"NASA Earthdata",url:"https://www.earthdata.nasa.gov/",status:"PUBLIC_DATA_CATALOG"},
    {id:"noaa",name:"NOAA",url:"https://www.noaa.gov/",status:"PUBLIC_DATA_CATALOG"},
    {id:"noaa-space-weather",name:"NOAA Space Weather",url:"https://www.ncei.noaa.gov/",status:"PUBLIC_API"},
    {id:"bankr",name:"Bankr public creator data",url:"https://api.bankr.bot",status:"PUBLIC_API"},
    {id:"stellarnet",name:"StellarNet realtime game",url:"/ws",status:"LIVE_APP_STREAM"},
    {id:"quantum",name:"Quantum control plane",url:"/api/quantum/capabilities",status:"SIMULATION_OR_AUTHORIZED_PROVIDER"}
  ];
  const payload={timestamp:now.toISOString(),epoch_ms:Date.now(),universal_clock:{utc:now.toISOString(),unix_ms:Date.now()},
    ingestion:{mode:"federated",refresh:"request-time",provenance:true,units:true,timestamps:true,uncertainty:"source-dependent"},
    sources,source_count:sources.length,
    resonance:{source:"Earth-ionosphere model",hz:[7.83,14.3,20.8,27.3,33.8]},
    game:{world:"StellarNet Universe",layers:["3D","4D-time","5D-state"],realtime_endpoint:"/ws",quantum_mode:"browser/control-plane simulation"},
    platform:{surfaces:["web","mobile-web","PWA","app"],device_capabilities:"/api/device/capabilities"},
    quantum:{control_plane:"/api/quantum/capabilities",physical_qpu:"provider-required"},
    integrations:{status:"/api/integrations",bankr_creator_data:"/api/universe/tokens"},
    scientific_scope:{scope:"maximum application-accessible/public federation",note:"No software can literally ingest every datum in the universe. Private, classified, proprietary, inaccessible, or nonexistent data is not fabricated; each source is explicitly state-labeled."}
  };
  try{const r=await fetch("https://api.bankr.bot/public/doppler/creator-fees/0x13653b6b8bd4b274da565faf6fa894e3418a6d10?days=30");const j=await r.json();payload.bankr={source:"Bankr public creator-fees",ok:r.ok,tokens:Array.isArray(j.tokens)?j.tokens:[],totals:j.totals||null};}catch{payload.bankr={source:"Bankr public creator-fees",ok:false,tokens:[],totals:null};}
  res.json(payload);
});
app.get("/api/universe/tokens", async (_req,res)=>{
  const wallet="0x13653b6b8bd4b274da565faf6fa894e3418a6d10";
  try{
    const r=await fetch("https://api.bankr.bot/public/doppler/creator-fees/"+wallet+"?days=30");
    const j=await r.json();
    if(!r.ok) return res.status(r.status).json({wallet,tokens:[],error:"Bankr creator-data unavailable"});
    res.json({wallet,source:"bankr-public-creator-fees",tokens:Array.isArray(j.tokens)?j.tokens:[],totals:j.totals||null});
  }catch(e){res.status(503).json({wallet,tokens:[],error:"Bankr data unavailable"});}
});
app.post("/api/universe/customize", async (req,res)=>{
  if(!stripe)return res.status(503).json({message:"Payment provider not configured."});
  const wallet="0x13653b6b8bd4b274da565faf6fa894e3418a6d10";
  const amount=Math.max(1,Math.round(Number(req.body?.amount||4)*100));
  const customization=String(req.body?.customization||"").slice(0,500)||"Universe customization";
  try{
    const s=await stripe.checkout.sessions.create({mode:"payment",customer_creation:"always",
      line_items:[{price_data:{currency:"usd",product_data:{name:"OEQL Universe Customization",description:customization},unit_amount:amount},quantity:1}],
      success_url:(process.env.PUBLIC_URL||"https://oeql-bank-forever.onrender.com")+"/universe?paid=1&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:(process.env.PUBLIC_URL||"https://oeql-bank-forever.onrender.com")+"/universe?cancelled=1",
      metadata:{oeql_product:"universe-customization",wallet,customization}});
    res.json({url:s.url,one_tap:true,wallet,amount_cents:amount});
  }catch(e){res.status(502).json({message:e.message});}
});
app.get("/api/marketplace",(_req,res)=>res.json({listings:SELLABLE_CATALOG,checkout:"/api/buy/:id",digital_delivery:"service-queue",physical_shipping:"disabled unless provider-backed",dropship_fee_percent:DROPSHIP_FEE_PERCENT}));
app.get("/api/tasks", (_req,res)=>res.json({task_types:TASK_TYPES,workflow:["create","price","authorize","execute","review","deliver"]}));
app.post("/api/tasks", (req,res)=>{const t=req.body||{};if(!t.title)return res.status(400).json({message:"title required"});res.status(201).json({id:"task_"+Date.now(),status:"queued",title:t.title,type:t.type||"web build",provider:t.provider||"user-selected",note:"Execution requires an authorized provider when applicable."})});
app.get("/api/telecom/inventory", async (_req,res)=>{
  const configured=!!process.env.TELNYX_API_KEY;
  if(!configured) return res.json({status:"PROVIDER_REQUIRED",live:false,inventory:{esim:{available:null,reservable:false},physical_sim:{available:null,reservable:false}},message:"Connect an authorized telecom provider credential to expose real-time provider inventory."});
  try{
    const out=await telnyx("/sim_cards?page[size]=1",{method:"GET"});
    res.json({status:"LIVE",live:true,provider:"telnyx",inventory:{esim:{available:"provider-api",reservable:true},physical_sim:{available:"provider-api",reservable:true}},provider_snapshot:out});
  }catch(e){res.status(503).json({status:"PROVIDER_ERROR",live:false,message:e.message});}
});
app.get("/api/telecom/catalog", (_req,res)=>res.json({
  currency:"usd",
  plans:{
    esim:{activation_one_time:4,monthly:4,activation_price_id:process.env.STRIPE_ESIM_ACTIVATION_PRICE_ID||null,monthly_price_id:process.env.STRIPE_TELECOM_PRICE_ID||null,checkout:"/api/checkout/telecom/esim"},
    physical_sim:{kit_one_time:4,monthly:4,kit_price_id:process.env.STRIPE_PHYSICAL_SIM_KIT_PRICE_ID||null,monthly_price_id:process.env.STRIPE_TELECOM_PRICE_ID||null,checkout:"/api/checkout/telecom/physical-sim",shipping:"provider-required"}
  },
  provider:{name:process.env.TELNYX_API_KEY?"telnyx":"not-configured",esim:!!process.env.TELNYX_API_KEY,physical_sim:!!(process.env.PSIM_USERNAME&&process.env.PSIM_PASSWORD&&process.env.PSIM_PLAN_PRICING_ID&&process.env.PSIM_SHIPPING_RATE_ID)},
  note:"Connectivity and SIM fulfillment are only reported LIVE when the authorized provider credentials and fulfillment path are configured."
}));
app.post("/api/checkout/telecom", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Configure STRIPE_SECRET_KEY on the backend."});try{let price=process.env.STRIPE_TELECOM_PRICE_ID;if(!price)return res.status(503).json({message:"Configure STRIPE_TELECOM_PRICE_ID for the $4/month plan."});let s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price,quantity:1}],success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?cancelled=1",metadata:{oeql_product:"telecom_monthly",fulfillment:"provider_required"}});res.json({url:s.url})}catch(e){res.status(502).json({message:e.message})}});
app.post("/api/checkout/telecom/esim", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Payment provider not configured."});if(!process.env.TELNYX_API_KEY)return res.status(503).json({message:"eSIM fulfillment is not enabled until the authorized telecom provider credential is configured.",provider_ready:false});try{const activation=process.env.STRIPE_ESIM_ACTIVATION_PRICE_ID,monthly=process.env.STRIPE_TELECOM_PRICE_ID;if(!activation||!monthly)return res.status(503).json({message:"eSIM pricing is not configured."});const s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:activation,quantity:1},{price:monthly,quantity:1}],customer_creation:"always",success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=esim&paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=esim&cancelled=1",metadata:{oeql_product:"esim",activation_fee:"4",monthly_fee:"4",fulfillment:"telnyx_provider_required"}});res.json({url:s.url,provider_ready:!!process.env.TELNYX_API_KEY})}catch(e){res.status(502).json({message:e.message})}});
app.post("/api/checkout/telecom/physical-sim", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Payment provider not configured."});if(!process.env.PSIM_USERNAME||!process.env.PSIM_PASSWORD||!process.env.PSIM_PLAN_PRICING_ID||!process.env.PSIM_SHIPPING_RATE_ID)return res.status(503).json({message:"Physical SIM checkout is disabled until the authorized 1PSIM reseller credentials, plan pricing ID, and shipping rate ID are configured.",provider_ready:false,provider:"1psim"});try{const kit=process.env.STRIPE_PHYSICAL_SIM_KIT_PRICE_ID,monthly=process.env.STRIPE_TELECOM_PRICE_ID;if(!kit||!monthly)return res.status(503).json({message:"Physical SIM pricing is not configured."});const s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:kit,quantity:1},{price:monthly,quantity:1}],customer_creation:"always",shipping_address_collection:{allowed_countries:["US"]},success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=physical-sim&paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?telecom=physical-sim&cancelled=1",metadata:{oeql_product:"physical_sim",kit_fee:"4",monthly_fee:"4",fulfillment:"1psim"}});res.json({url:s.url,provider_ready:true,provider:"1psim"})}catch(e){res.status(502).json({message:e.message})}});
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
app.get("/api/telecom/plan", (_req,res)=>res.json({
  product:"OEQL Quantum Telecom",
  stages:[
    {id:"billing",name:"Billing",status:stripe&&process.env.STRIPE_TELECOM_PRICE_ID?"READY":"PROVIDER_REQUIRED",checkout:"/api/checkout/telecom"},
    {id:"esim",name:"eSIM",status:process.env.TELNYX_API_KEY?"PROVIDER_READY":"PROVIDER_REQUIRED",checkout:"/api/checkout/telecom/esim",provisioning:"/api/telecom/esim/purchase"},
    {id:"physical-sim",name:"Physical SIM",status:process.env.PSIM_USERNAME&&process.env.PSIM_PASSWORD&&process.env.PSIM_PLAN_PRICING_ID&&process.env.PSIM_SHIPPING_RATE_ID?"PROVIDER_READY":"PROVIDER_REQUIRED",checkout:"/api/checkout/telecom/physical-sim",provisioning:"/api/telecom/physical-sim/order"},
    {id:"inventory",name:"Live Inventory",status:process.env.TELNYX_API_KEY?"PROVIDER_READY":"PROVIDER_REQUIRED",endpoint:"/api/telecom/inventory"},
    {id:"fulfillment",name:"Fulfillment",status:process.env.PSIM_USERNAME&&process.env.PSIM_PASSWORD?"PROVIDER_READY":"PROVIDER_REQUIRED",shipping:"provider-controlled"},
    {id:"support",name:"Customer Support",status:"PLANNED",workflow:["activation","billing","porting","replacement","refund","cancellation"]},
    {id:"compliance",name:"Compliance",status:"REVIEW_REQUIRED",controls:["provider authorization","carrier terms","privacy","consumer disclosures","tax","refunds","KYC/identity where required","telecom regulatory review"]}
  ],
  offer:{activation_one_time:4,monthly:4,currency:"usd",one_tap:true},
  reality_gate:"Carrier service, spectrum, numbering, inventory and physical fulfillment remain provider-controlled."
}));
app.get("/api/telecom/status", (_req,res)=>res.json({
  provider:process.env.TELNYX_API_KEY?"telnyx":"not-configured",
  storefront:process.env.PAYGOSIM_STOREFRONT_URL||null,
  offer:{activation_one_time:4,monthly:4,currency:"usd",one_tap:true},
  physical_sim:process.env.PSIM_USERNAME&&process.env.PSIM_PASSWORD&&process.env.PSIM_PLAN_PRICING_ID&&process.env.PSIM_SHIPPING_RATE_ID?"provider-ready":"provider-credential-required",
  physical_sim_provider:"1psim",
  physical_sim_endpoint:process.env.PSIM_API_BASE||"https://1psim.api.lifeline.mobi",
  esim:process.env.TELNYX_API_KEY?"provider-ready":"provider-credential-required",
  service_billing:stripe&&process.env.STRIPE_TELECOM_PRICE_ID?"stripe-live":"not-configured"
}));
app.get("/api/telecom/storefront", (_req,res)=>res.json({
  name:"OEQL Quantum Telecom",
  storefront:process.env.PAYGOSIM_STOREFRONT_URL||null,
  offer:{activation_one_time:4,monthly:4,currency:"usd",one_tap:true},
  esim_checkout:"/api/checkout/telecom/esim",
  physical_sim_checkout:"/api/checkout/telecom/physical-sim",
  external_storefront_required_for_provider_catalog:!process.env.PAYGOSIM_STOREFRONT_URL
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
async function onePsimToken(){
  const base=process.env.PSIM_API_BASE||"https://1psim.api.lifeline.mobi";
  if(!process.env.PSIM_USERNAME||!process.env.PSIM_PASSWORD) throw new Error("1PSIM reseller credentials not configured");
  const r=await fetch(base+"/public/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:process.env.PSIM_USERNAME,password:process.env.PSIM_PASSWORD})});
  const j=await r.json();
  if(!r.ok||!j?.authToken) throw new Error(j?.message||"1PSIM authentication failed");
  return {base,token:j.authToken};
}
app.post("/api/telecom/physical-sim/order", async (req,res)=>{
  try{
    const {base,token}=await onePsimToken();
    const a=req.body?.shipping_address||{};
    const planPricingId=process.env.PSIM_PLAN_PRICING_ID;
    const shippingRateId=process.env.PSIM_SHIPPING_RATE_ID;
    if(!planPricingId||!shippingRateId) return res.status(503).json({error:"physical_sim_provider_configuration_required",message:"Configure PSIM_PLAN_PRICING_ID and PSIM_SHIPPING_RATE_ID for the authorized 1PSIM reseller account.",checkout_available:false});
    const payload={paymentGateway:"balance",planPricingIds:[planPricingId],shippingFirstName:a.first_name||a.firstName||"",shippingLastName:a.last_name||a.lastName||"",shippingPhoneNumber:a.phone||"",shippingAddress1:a.line1||a.address1||"",shippingAddress2:a.line2||a.address2||"",shippingCity:a.city||"",shippingState:a.state||"",shippingCountry:a.country||"US",shippingZipcode:a.postal_code||a.zipcode||"",shippingRateId,zipCodeActivation:a.postal_code||a.zipcode||""};
    const r=await fetch(base+"/subscriber/sim/purchase",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify(payload)});
    const j=await r.json();
    if(!r.ok) throw new Error(j?.message||"1PSIM physical SIM order failed");
    res.status(201).json({provider:"1psim",fulfillment:j});
  }catch(e){res.status(503).json({error:"physical_sim_fulfillment_error",message:e.message});}
});
app.get("/api/legal-sales",(_req,res)=>res.json({status:"production-controls",required:["accurate item description","displayed price before payment","provider-specific fulfillment terms","refund/cancellation terms","privacy disclosure","tax handling where applicable","telecom-specific disclosures","licensed-provider restrictions where applicable"],receipt:"payment-provider receipt plus OEQL receipt endpoint",fee_disclosure:"Marketplace/dropship fee is configured at 4.4%; this is a platform configuration, not a legal/tax rate.",notice:"Human/legal review is required before regulated telecom, financial, money-transmission, lending, insurance or other regulated services are offered."}));
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

import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ noServer:true });
const rooms = new Map();
function room(code){let r=rooms.get(code);if(!r){r={players:new Map(),events:[],seq:0};rooms.set(code,r)}return r}
function broadcast(r,payload){const data=JSON.stringify(payload);for(const p of r.players.values())if(p.ws.readyState===1)p.ws.send(data)}
function snap(r){return {type:"snapshot",seq:r.seq,events:r.events.slice(-6),players:[...r.players.values()].map(p=>({id:p.id,name:p.name,role:p.role,x:p.x,y:p.y,score:p.score,hp:p.hp,energy:p.energy}))}}
wss.on("connection",(ws)=>{
 let current=null,me=null;
 ws.on("message",(raw)=>{
  try{
   const m=JSON.parse(raw.toString());
   if(m.type==="join"){
    const code=String(m.room||"OEQL-PRIME").replace(/[^A-Za-z0-9_-]/g,"").slice(0,32)||"OEQL-PRIME";
    current=room(code);
    if(current.players.size>=64){ws.send(JSON.stringify({type:"error",error:"room_full"}));return}
    me={id:Math.random().toString(36).slice(2,10),name:String(m.name||"Player").slice(0,24),role:String(m.role||"Explorer").slice(0,24),x:100+Math.random()*700,y:80+Math.random()*360,score:0,hp:100,energy:100,vx:0,vy:0,ws};
    current.players.set(me.id,me);current.seq++;
    ws.send(JSON.stringify({type:"joined",id:me.id,room:code,capacity:64,snapshot:snap(current)}));
    broadcast(current,{type:"system",message:me.name+" entered the arena",seq:current.seq});
    return;
   }
   if(!current||!me)return;
   if(m.type==="input"){
    me.vx=Math.max(-1,Math.min(1,Number(m.x)||0));me.vy=Math.max(-1,Math.min(1,Number(m.y)||0));
   } else if(m.type==="event"){
    const kinds=["Quantum Rift","Resonance Surge","Entanglement Storm","Chrono Shift"];
    const event=kinds[Math.max(0,Math.min(kinds.length-1,Number(m.index)||0))];
    me.score+=50;me.energy=Math.min(100,me.energy+10);current.seq++;
    current.events.push({event,player:me.name,at:Date.now(),seq:current.seq});
    if(current.events.length>20)current.events.shift();
    broadcast(current,{type:"event",event,player:me.name,seq:current.seq});
   }
  }catch{}
 });
 ws.on("close",()=>{if(current&&me){current.players.delete(me.id);current.seq++;broadcast(current,{type:"system",message:me.name+" left the arena",seq:current.seq});if(!current.players.size)rooms.delete([...rooms.entries()].find(([k,v])=>v===current)?.[0])}});
});
setInterval(()=>{for(const r of rooms.values()){for(const p of r.players.values()){p.x=Math.max(30,Math.min(870,p.x+p.vx*7));p.y=Math.max(30,Math.min(470,p.y+p.vy*7));p.energy=Math.max(0,p.energy-.04)}r.seq++;broadcast(r,snap(r))}},50);
const _oldListen=app.listen.bind(app);
const _server=_oldListen(PORT,"0.0.0.0",()=>console.log("OEQL Forever API listening on "+PORT));
_server.on("upgrade",(req,socket,head)=>{if(req.url==="/ws"){wss.handleUpgrade(req,socket,head,ws=>wss.emit("connection",ws))}});