import express from "express";
import Stripe from "stripe";

const app = express();
app.use(express.json({limit:"1mb"}));
const PORT = process.env.PORT || 10000;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.get("/health", (_req,res)=>res.json({ok:true,service:"OEQL Forever API",time:new Date().toISOString()}));
app.get("/api/status", (_req,res)=>res.json({
  protocol:"oeql", namespace:"oeql://.forever",
  status:"operational-orchestration",
  financial_provider:stripe?"stripe-configured":"not-configured",
  treasury:"provider-gated", metals:"custodian-gated", lending:"licensed-provider-gated"
}));
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
