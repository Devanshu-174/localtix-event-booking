// Add sample records to the running local app without deleting existing data.
const base='http://localhost:8080/api';
async function api(path,method='GET',body,token){
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!r.ok)throw Error(`${method} ${path}: ${r.status} ${await r.text()}`);
 return r.status===204?null:r.json();
}
async function account(name,email,role){
 const credentials={email,password:'Sample@123'};
 try{return await api('/auth/login','POST',credentials)}catch{return api('/auth/register','POST',{...credentials,name,role})}
}
const organizer=await account('Sample Events Studio','host@sample.com','ORGANIZER');
const customer=await account('Aarav Sample','aarav@sample.com','CUSTOMER');
const guest=await account('Meera Sample','meera@sample.com','CUSTOMER');
const existing=await api('/events');
const configs=[
 ['Sample: Acoustic Evening','Music','Riverside Amphitheatre',799,50,7,'Live acoustic music with local artists.'],
 ['Sample: Pottery Workshop','Workshop','Clay Studio',499,12,10,'A hands-on workshop with materials included.'],
 ['Sample: Comedy Club — Sold Out','Comedy','City Comedy Lounge',299,3,14,'A small comedy show demonstrating sold-out availability.'],
 ['Sample: Community Art Walk','Art','Central Gallery',0,30,21,'A free community event ready for new bookings.'],
 ['Sample: Past Photography Workshop','Workshop','Old Town Studio',350,20,28,'A historical event for testing the Past bookings tab.']
];
const created=[];
for(const [title,category,venue,price,capacity,days,description] of configs){
 if(existing.some(e=>e.title===title&&e.organizerId===organizer.id)){console.log('Already seeded: '+title);continue;}
 const start=new Date();start.setDate(start.getDate()+days);start.setHours(18,0,0,0);
 const local=new Date(start.getTime()-start.getTimezoneOffset()*60000).toISOString().slice(0,19);
 const cover=title.includes('Acoustic')?'acoustic-evening':title.includes('Pottery')?'pottery-workshop':title.includes('Comedy')?'comedy-club':title.includes('Art Walk')?'art-walk':'photography-workshop';
 const event=await api('/events','POST',{title,description,category,venue,price,capacity,startsAt:local,imageUrl:`/events/${cover}.jpg`},organizer.token);
 const book=(user,quantity)=>api('/bookings','POST',{eventId:event.id,quantity},user.token);
 const scan=booking=>api('/check-ins/scan','POST',{code:booking.tickets[0].qrPayload},organizer.token);
 if(category==='Music'){await book(customer,2);const checked=await book(guest,2);await scan(checked);}
 if(title.includes('Pottery')){const cancelled=await book(customer,2);await api('/bookings/'+cancelled.id,'DELETE',null,customer.token);await book(guest,1);}
 if(category==='Comedy'){await book(customer,1);await book(guest,2);}
 if(title.includes('Past')){await book(customer,1);const attended=await book(guest,1);await scan(attended);}
 created.push(event);console.log('Created: '+title);
}
// The public event API deliberately rejects past dates. Use the local H2 console
// solely to date this sample event into the past; never update real events.
const all=await api('/events');
const past=all.find(e=>e.title==='Sample: Past Photography Workshop'&&e.organizerId===organizer.id);
if(past&&new Date(past.startsAt)>new Date()){
 const root='http://localhost:8080/h2-console/';
 const page=await (await fetch(root)).text();
 const session=page.match(/jsessionid=([a-zA-Z0-9]+)/)?.[1];
 if(!session)throw Error('Could not open the local H2 console to date the sample past event.');
 const login=await fetch(root+'login.do?jsessionid='+session,{method:'POST',body:new URLSearchParams({language:'en',setting:'Generic H2 (Embedded)',name:'Generic H2 (Embedded)',driver:'org.h2.Driver',url:'jdbc:h2:file:./data/localtix',user:'sa',password:''})});
 const loginHtml=await login.text();
 if(!loginHtml.includes('frame'))throw Error('H2 console login did not succeed.');
 const sql=`UPDATE EVENTS SET STARTS_AT = DATEADD('DAY', -7, CURRENT_TIMESTAMP) WHERE ID = ${Number(past.id)} AND ORGANIZER_ID = ${Number(organizer.id)} AND TITLE = 'Sample: Past Photography Workshop'`;
 const query=await fetch(root+'query.do?jsessionid='+session,{method:'POST',body:new URLSearchParams({sql})});
 await query.text();
 const updated=await api('/events/'+past.id);
 if(new Date(updated.startsAt)>=new Date())throw Error('The sample past event date was not updated.');
 await fetch(root+'logout.do?jsessionid='+session);
 console.log('Past-event date verified.');
}
const bookings=await api('/bookings/organizer','GET',null,organizer.token);
console.log(JSON.stringify({sampleEvents:all.filter(e=>e.organizerId===organizer.id).length,bookings:bookings.length,cancelled:bookings.filter(b=>b.status==='CANCELLED').length,checkedIn:bookings.flatMap(b=>b.tickets).filter(t=>t.status==='CHECKED_IN').length},null,2));
