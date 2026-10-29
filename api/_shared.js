import { createHash, timingSafeEqual } from 'node:crypto';
export function authorize(req, res) {
 res.setHeader('Cache-Control', 'no-store');
 if(req.method !== 'POST'){ res.setHeader('Allow','POST'); res.status(405).json({error:'Use POST.'}); return false; }
 if(!process.env.GROQ_API_KEY || !process.env.APP_ACCESS_TOKEN){res.status(503).json({error:'Setup needed: add GROQ_API_KEY and APP_ACCESS_TOKEN in Vercel environment variables, then redeploy.'});return false;}
 const provided = (req.headers.authorization || '').replace(/^Bearer /,'');
 const hash = v => createHash('sha256').update(v).digest();
 if(!timingSafeEqual(hash(provided),hash(process.env.APP_ACCESS_TOKEN))){res.status(401).json({error:'Enter the app password you configured as APP_ACCESS_TOKEN in Vercel.'});return false;}
 return true;
}
export function bodyOf(req){return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;}
export async function groq(path, options){
 return fetch(`https://api.groq.com/openai/v1/${path}`,{...options,headers:{...options.headers,Authorization:`Bearer ${process.env.GROQ_API_KEY}`},signal:AbortSignal.timeout(25000)});
}
export function upstreamError(response,res){
 const status = response.status === 429 ? 429 : 502;
 res.status(status).json({error:response.status===429?'AI quota or rate limit reached. Wait a moment or check your Groq account.':response.status===401?'The server AI key was rejected. Check GROQ_API_KEY in Vercel and redeploy.':'The AI provider could not complete this request. Please try again.'});
}
