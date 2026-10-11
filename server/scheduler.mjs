import { createRemoteJWKSet,jwtVerify } from 'jose';
import { timingSafeEqual } from 'node:crypto';
const githubKeys=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'),{timeoutDuration:5000});
export async function schedulerAuthorized(req,env,keys=githubKeys){
 const authorization=req.headers.get('authorization')||'';
 if(env.CRON_SECRET){const actual=Buffer.from(authorization),expected=Buffer.from('Bearer '+env.CRON_SECRET);if(actual.length===expected.length&&timingSafeEqual(actual,expected))return true;}
 const token=authorization.startsWith('Bearer ')?authorization.slice(7):'';if(token.length>12000||token.split('.').length!==3)return false;
 try{
  const {payload}=await jwtVerify(token,keys,{issuer:'https://token.actions.githubusercontent.com',audience:(env.SITE_URL||'https://www.tradecarshop.com.br')+'/api/cron',algorithms:['RS256'],maxTokenAge:'10m',clockTolerance:5,requiredClaims:['exp','iat','sub','repository_id','repository_owner_id','ref','workflow_ref','event_name']});
  const subjects=['repo:VagJr/vagner:ref:refs/heads/main','repo:VagJr@201420712/vagner@1346612975:ref:refs/heads/main'];
  return subjects.includes(payload.sub)&&String(payload.repository_id)==='1346612975'&&String(payload.repository_owner_id)==='201420712'&&payload.ref==='refs/heads/main'&&payload.workflow_ref==='VagJr/vagner/.github/workflows/process-jobs.yml@refs/heads/main'&&['schedule','workflow_dispatch'].includes(payload.event_name);
 }catch{return false;}
}
