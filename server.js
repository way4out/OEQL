import express from "express";
import Stripe from "stripe";

const app = express();
app.use(express.json({limit:"1mb"}));
const PORT = process.env.PORT || 10000;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
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
app.get("/api/status", (_req,res)=>res.json({protocol:"oeql",namespace:"oeql://.forever",status:"operational-orchestration",financial_provider:stripe?"stripe-configured":"not-configured",payments:stripe?"stripe-configured":"not-configured",telecom_fulfillment:process.env.TELECOM_PROVIDER?"configured":"provider-required",treasury:"provider-gated",metals:"custodian-gated",lending:"licensed-provider-gated"}));
app.get("/api/marketplace", (_req,res)=>res.json({listings:[{id:"quantum-telecom",title:"Quantum Telecom Service",category:"subscription",price:4,description:"$4/month enrollment; SIM/eSIM fulfillment requires an authorized telecom provider."}]}));
app.post("/api/checkout/telecom", async (_req,res)=>{if(!stripe)return res.status(503).json({message:"Configure STRIPE_SECRET_KEY on the backend."});try{let price=process.env.STRIPE_TELECOM_PRICE_ID;if(!price)return res.status(503).json({message:"Configure STRIPE_TELECOM_PRICE_ID for the $4/month plan."});let s=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price,quantity:1}],success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?cancelled=1"});res.json({url:s.url})}catch(e){res.status(502).json({message:e.message})}});
app.post("/api/checkout/listing", async (req,res)=>{if(!stripe)return res.status(503).json({message:"Payment provider not configured."});try{let s=await stripe.checkout.sessions.create({mode:"payment",line_items:[{price_data:{currency:"usd",product_data:{name:"OEQL Marketplace Item"},unit_amount:Math.max(50,Math.round(Number(req.body?.amount||0)*100))},quantity:1}],success_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?paid=1",cancel_url:(process.env.PUBLIC_URL||"https://oeql.onrender.com")+"/?cancelled=1"});res.json({url:s.url})}catch(e){res.status(502).json({message:e.message})}});
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
