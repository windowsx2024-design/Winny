// Payments placeholder: expose plans and checkout routing
const { ensureStore, saveStore } = require('./data_adapter');

exports.handler = async function(event){ const store = ensureStore(); const path = event.path || ''; if(event.httpMethod==='GET' && event.path && event.path.endsWith('/plans')){ const plans = store.payments || [{ id:'free',name:'Free',price:0 },{ id:'pro',name:'Pro',price:29 }]; return { statusCode:200, body: JSON.stringify({ plans }) }; }
// checkout
if(event.httpMethod==='POST' && event.path && event.path.endsWith('/checkout')){ if(!process.env.STRIPE_SECRET_KEY) return { statusCode:501, body: JSON.stringify({ error:'Not configured', provider:'stripe' }) }; return { statusCode:501, body: JSON.stringify({ error:'Not implemented' }) }; }
return { statusCode:400, body: JSON.stringify({ error:'bad request' }) };
};
