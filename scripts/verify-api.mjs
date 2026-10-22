// Run against an isolated H2 demo server: node scripts/verify-api.mjs
import assert from 'node:assert/strict';
const base=process.env.TEST_API_URL || 'http://localhost:8082/api';
let checks=0, failures=0;
function check(label, fn){checks++;try{fn();console.log('PASS '+label);}catch(error){failures++;console.error('FAIL '+label+': '+error.message);}}
async function request(path, method='GET', body, token){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=text}return {status:response.status,data};
}
async function expect(label,path,method,body,token,status){const result=await request(path,method,body,token);check(label,()=>assert.equal(result.status,status,JSON.stringify(result.data)));return result.data;}
const stamp=Date.now();
async function register(role,suffix){return expect('register '+suffix,'/auth/register','POST',{name:'API '+suffix,email:`${suffix}${stamp}@example.test`,password:'Verification123!',role},null,200);}
const customer=await register('CUSTOMER','customer'),org=await register('ORGANIZER','organizer'),other=await register('ORGANIZER','other');
await expect('duplicate email','/auth/register','POST',{name:'Duplicate',email:customer.email,password:'Verification123!',role:'CUSTOMER'},null,409);
await expect('invalid login','/auth/login','POST',{email:customer.email,password:'incorrect-password'},null,401);
await expect('login','/auth/login','POST',{email:customer.email,password:'Verification123!'},null,200);
await expect('profile read','/profile','GET',null,customer.token,200);
await expect('profile update','/profile','PUT',{name:'Updated Name'},customer.token,200);
const profile=await request('/profile','GET',null,customer.token);check('profile persistence',()=>assert.equal(profile.data.name,'Updated Name'));
await expect('blank profile name','/profile','PUT',{name:'   '},customer.token,400);
const anonymous=await request('/profile');check('anonymous denied',()=>assert.ok([401,403].includes(anonymous.status)));
const template={title:'API Verification',description:'Temporary verification event',category:'Workshop',venue:'Test venue',startsAt:'2035-05-15T18:00:00',price:125.50,capacity:3,imageUrl:''};
await expect('customer cannot create events','/events','POST',template,customer.token,403);
await expect('past event rejected','/events','POST',{...template,startsAt:'2020-01-01T10:00:00'},org.token,400);
const event=await expect('create event','/events','POST',template,org.token,200);
await expect('event detail',`/events/${event.id}`,'GET',null,null,200);
await expect('edit event',`/events/${event.id}`,'PUT',{...template,title:'Edited Event'},org.token,200);
await expect('another organizer cannot edit',`/events/${event.id}`,'PUT',template,other.token,403);
await expect('organizer event listing','/events/mine','GET',null,org.token,200);
await expect('organizer cannot book','/bookings','POST',{eventId:event.id,quantity:1},org.token,403);
await expect('invalid quantity','/bookings','POST',{eventId:event.id,quantity:0},customer.token,400);
const booking=await expect('book two tickets','/bookings','POST',{eventId:event.id,quantity:2},customer.token,200);
check('price and unique QR per ticket',()=>{assert.equal(booking.total,251);assert.equal(booking.tickets.length,2);assert.notEqual(booking.tickets[0].qrPayload,booking.tickets[1].qrPayload)});
await expect('overselling denied','/bookings','POST',{eventId:event.id,quantity:2},customer.token,409);
await expect('capacity cannot shrink below sales',`/events/${event.id}`,'PUT',{...template,capacity:1},org.token,400);
await expect('sold event cannot be deleted',`/events/${event.id}`,'DELETE',null,org.token,409);
await expect('customer booking history','/bookings/mine','GET',null,customer.token,200);
await expect('organizer guest list','/bookings/organizer','GET',null,org.token,200);
await expect('wrong organizer scan','/check-ins/scan','POST',{code:booking.tickets[0].qrPayload},other.token,403);
await expect('tampered QR','/check-ins/scan','POST',{code:booking.tickets[0].qrPayload+'x'},org.token,400);
const scan=await expect('first scan','/check-ins/scan','POST',{code:booking.tickets[0].qrPayload},org.token,200);check('entry accepted',()=>assert.equal(scan.valid,true));
const duplicate=await expect('repeat scan','/check-ins/scan','POST',{code:booking.tickets[0].qrPayload},org.token,200);check('duplicate entry blocked',()=>assert.equal(duplicate.valid,false));
await expect('checked-in booking cannot cancel',`/bookings/${booking.id}`,'DELETE',null,customer.token,409);
const cancel=await expect('book remaining place','/bookings','POST',{eventId:event.id,quantity:1},customer.token,200);
await expect('cancel booking',`/bookings/${cancel.id}`,'DELETE',null,customer.token,204);
await expect('repeat cancellation blocked',`/bookings/${cancel.id}`,'DELETE',null,customer.token,409);
await expect('cancelled QR rejected','/check-ins/scan','POST',{code:cancel.tickets[0].qrPayload},org.token,409);
const stock=await request(`/events/${event.id}`);check('cancel restores one place',()=>assert.equal(stock.data.available,1));
const history=await expect('create cancellation history event','/events','POST',{...template,capacity:10},org.token,200);
const historyBooking=await expect('book history event','/bookings','POST',{eventId:history.id,quantity:1},customer.token,200);
await expect('other account cannot cancel',`/bookings/${historyBooking.id}`,'DELETE',null,other.token,403);
await expect('cancel history event booking',`/bookings/${historyBooking.id}`,'DELETE',null,customer.token,204);
await expect('cancelled history deletion gives useful conflict',`/events/${history.id}`,'DELETE',null,org.token,409);
const invalid=await request('/check-ins/scan','POST',{code:'invalid'},org.token);check('error message reaches frontend',()=>assert.equal(invalid.data.message,'Invalid QR signature'));
const simultaneous=await Promise.all([1,2].map(()=>request('/check-ins/scan','POST',{code:booking.tickets[1].qrPayload},org.token)));
check('simultaneous scans admit exactly once',()=>{assert.equal(simultaneous.filter(r=>r.status===200&&r.data.valid===true).length,1);assert.equal(simultaneous.filter(r=>r.status===200&&r.data.valid===false).length,1)});
for(let round=0;round<4;round++){
 const raceBooking=await request('/bookings','POST',{eventId:history.id,quantity:1},customer.token);
 assert.equal(raceBooking.status,200);
 const [cancellation,entry]=await Promise.all([request(`/bookings/${raceBooking.data.id}`,'DELETE',null,customer.token),request('/check-ins/scan','POST',{code:raceBooking.data.tickets[0].qrPayload},org.token)]);
 check('cancellation vs check-in '+round,()=>assert.ok((cancellation.status===204&&entry.status===409)||(cancellation.status===409&&entry.status===200&&entry.data.valid===true),JSON.stringify({cancellation,entry})));
}
const empty=await expect('create empty event','/events','POST',template,org.token,200);
await expect('delete empty event',`/events/${empty.id}`,'DELETE',null,org.token,200);
await expect('deleted event absent',`/events/${empty.id}`,'GET',null,null,404);
const race=await expect('create concurrency event','/events','POST',{...template,capacity:2},org.token,200);
const concurrent=await Promise.all(Array.from({length:5},()=>request('/bookings','POST',{eventId:race.id,quantity:1},customer.token)));
check('concurrent bookings cannot oversell',()=>{assert.equal(concurrent.filter(r=>r.status===200).length,2);assert.equal(concurrent.filter(r=>r.status===409).length,3)});
const cors=await fetch(base+'/events',{method:'OPTIONS',headers:{Origin:'http://localhost:5174','Access-Control-Request-Method':'GET'}});check('development CORS',()=>assert.equal(cors.headers.get('access-control-allow-origin'),'http://localhost:5174'));
console.log(`${checks-failures}/${checks} checks passed`);process.exitCode=failures?1:0;
