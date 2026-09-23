import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { RuleError } from '../shared/engine.js';
const scrypt=promisify(derive);
export const SESSION_AGE=14*24*60*60*1000;
export const digest=token=>createHash('sha256').update(token).digest('hex');
export function normalizeEmail(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw new RuleError('Informe um e-mail válido.');return email;}
export async function hashPassword(password){
  if(typeof password!=='string'||password.length<10||password.length>128)throw new RuleError('Use uma senha entre 10 e 128 caracteres.');
  const salt=randomBytes(16).toString('hex'),key=await scrypt(password,salt,64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password,encoded){
  if(typeof password!=='string'||password.length>128)return false;
  const [,salt,hash]=encoded.split(':'),key=await scrypt(password,salt,64),expected=Buffer.from(hash,'hex');
  return key.length===expected.length&&timingSafeEqual(key,expected);
}
export function newSession(accountId,now=Date.now()){const token=randomBytes(32).toString('base64url');return {token,record:{id:digest(token),accountId,createdAt:now,expiresAt:now+SESSION_AGE}};}
export function sessionId(req){const value=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('bloodmoon_session='))?.slice(18);return value&&value.length<200?digest(value):null;}
export function sessionCookie(token,clear=false){return `bloodmoon_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${clear?0:SESSION_AGE/1000}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
const attempts=new Map();
export function allowAuthAttempt(ip,now=Date.now()){
  for(const [key,value]of attempts)if(value.reset<=now)attempts.delete(key);
  const entry=attempts.get(ip)||{count:0,reset:now+60000};entry.count++;attempts.set(ip,entry);
  if(entry.count>10||attempts.size>10000)throw new RuleError('Muitas tentativas. Aguarde um minuto antes de tentar novamente.');
}
