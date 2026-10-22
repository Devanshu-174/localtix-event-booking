// Update only the known demo/sample event covers; leave user-created events alone.
const root='http://localhost:8080/h2-console/';
const events=await (await fetch('http://localhost:8080/api/events')).json();
const covers=[
 ['Indie Night Live','indie-night'],['Pottery for Beginners','pottery-beginners'],
 ['Stand-up Saturday','comedy-saturday'],['Sample: Acoustic Evening','acoustic-evening'],
 ['Sample: Pottery Workshop','pottery-workshop'],['Sample: Comedy Club','comedy-club'],
 ['Sample: Community Art Walk','art-walk'],['Sample: Past Photography Workshop','photography-workshop']
];
const page=await (await fetch(root)).text();
const session=page.match(/jsessionid=([a-zA-Z0-9]+)/)?.[1];
if(!session)throw Error('Local H2 console is unavailable');
await fetch(root+'login.do?jsessionid='+session,{method:'POST',body:new URLSearchParams({language:'en',driver:'org.h2.Driver',url:'jdbc:h2:file:./data/localtix',user:'sa',password:''})});
for(const [title,file] of covers){
 const event=events.find(e=>title==='Sample: Comedy Club'?e.title.startsWith(title):e.title===title);
 if(!event)continue;
 const sql=`UPDATE EVENTS SET IMAGE_URL='/events/${file}.jpg' WHERE ID=${Number(event.id)}`;
 await (await fetch(root+'query.do?jsessionid='+session,{method:'POST',body:new URLSearchParams({sql})})).text();
 const saved=await (await fetch('http://localhost:8080/api/events/'+event.id)).json();
 if(saved.imageUrl!==`/events/${file}.jpg`)throw Error('Cover update failed for '+title);
 const image=await fetch('http://localhost:5173'+saved.imageUrl);
 if(!image.ok||!image.headers.get('content-type')?.startsWith('image/'))throw Error('Cover unavailable: '+file);
 console.log('Updated and verified: '+event.title);
}
await fetch(root+'logout.do?jsessionid='+session);
