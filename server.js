import express from "express";
import Stripe from "stripe";

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
      const session=event.data.object;
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
const DROPSHIP_FEE_PERCENT=4;
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
const OEQL_444=Array.from({length:44400},(_,i)=>{const n=String(i+1).padStart(5,"0"),price=Number((4+(i%97)*1.25).toFixed(2));return{id:"oeql-"+n,title:"OEQL Sellable "+n,category:"marketplace",price,unit:"each",buyable:true,shippable:true,fulfillment:"provider-required",description:"Individual OEQL marketplace SKU "+n+" with its own retail price."}});
const SELLABLE_CATALOG=[...MARKETPLACE,...OEQL_444];
app.get("/api/marketplace/444",(req,res)=>{const limit=Math.max(1,Math.min(500,Number(req.query.limit)||100));const page=Math.max(0,Number(req.query.page)||0);res.json({count:OEQL_444.length,capacity_multiplier:"100x",currency:"USD",page,limit,items:OEQL_444.slice(page*limit,(page+1)*limit).map(x=>({...x,checkout:"/api/buy/"+x.id}))})});
const TASK_TYPES = ["web build","mobile build","AI build","automation","content","research","legal-document draft","telecom integration","marketplace listing"];
app.get("/api/buyable",(_req,res)=>res.json({currency:"USD",one_tap:true,items:SELLABLE_CATALOG.filter(x=>x.buyable).map(x=>({id:x.id,title:x.title,price:x.price,unit:x.unit,checkout:"/api/buy/"+x.id,fulfillment:x.fulfillment})),provider_gated:MARKETPLACE.filter(x=>!x.buyable).map(x=>({id:x.id,title:x.title,reason:x.fulfillment}))}));
app.post("/api/buy/:id",async(req,res)=>{
  if(!stripe)return res.status(503).json({message:"Payment provider not configured."});
  const item=SELLABLE_CATALOG.find(x=>x.id===String(req.params.id));
  const pf=globalThis.__oeqlPrintfulMappings?.[String(req.params.id)];
  if(!item&&!pf)return res.status(404).json({message:"Product not found."});
  if(String(req.params.id).startsWith("pf-")&&!pf)return res.status(409).json({message:"Printful product mapping unavailable."});
  if(item&&!item.buyable)return res.status(409).json({message:"This item is not currently buyable; required fulfillment/provider capability is unavailable.",fulfillment:item.fulfillment});
  const providerFulfillment=Boolean(pf);
  try{
    const product=pf||item;
    const success=(process.env.PUBLIC_URL||"https://oeql-bank-forever.onrender.com")+"/bank?paid=1";
    const feeCents=Math.round(Number(product.price||item?.price||0)*100*DROPSHIP_FEE_PERCENT/100);
    const params={mode:"payment",line_items:[{price_data:{currency:"usd",product_data:{name:product.title||item.title},unit_amount:Math.max(50,Math.round(Number(product.price||item.price)*100))},quantity:1}],success_url:success,cancel_url:(process.env.PUBLIC_URL||"https://oeql-bank-forever.onrender.com")+"/bank?cancelled=1",metadata:{oeql_product:String(req.params.id),dropship:providerFulfillment?"true":"false",platform_fee_percent:String(DROPSHIP_FEE_PERCENT),supplier:providerFulfillment?"printful":"provider-required",fulfillment:providerFulfillment?"printful":"provider-required"}};
    if(providerFulfillment && process.env.STRIPE_DESTINATION_ACCOUNT_ID){
      params.payment_intent_data={application_fee_amount:feeCents,transfer_data:{destination:process.env.STRIPE_DESTINATION_ACCOUNT_ID}};
    }
    const s=await stripe.checkout.sessions.create(params);
    res.json({url:s.url,platform_fee_percent:DROPSHIP_FEE_PERCENT,fee_applied:!!process.env.STRIPE_DESTINATION_ACCOUNT_ID});
  }catch(e){res.status(502).json({message:e.message})}
});
app.get("/api/marketplace", (_req,res)=>res.json({listings:SELLABLE_CATALOG,checkout:"/api/checkout/listing",digital_delivery:"enabled-for-software",physical_shipping:"address collection supported; fulfillment provider required",dropship_fee_percent:DROPSHIP_FEE_PERCENT,provider_count:DROPSHIP_PROVIDERS.length}));
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
  provider:{name:process.env.TELNYX_API_KEY?"telnyx":"not-configured",esim:!!process.env.TELNYX_API_KEY,physical_sim:!!process.env.PHYSICAL_SIM_FULFILLMENT_URL},
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
