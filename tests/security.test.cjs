const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const DemoModel=require('../INDEX-JS/demo-model.js');
const root=path.join(__dirname,'..');
const json=name=>JSON.parse(fs.readFileSync(path.join(root,'portfolio-data',name),'utf8'));
const employees=json('employees.json'), weeks=json('demo-metadata.json').weeks;
const fresh=()=>new DemoModel(employees,[],weeks);
const payload=(id=9001,campus='Downcity',time='O800',week=weeks[0])=>({emp_id:id,name:employees.find(e=>e.emp_id===id).name,week_start:week,shifts:[{emp_id:id,shift_date:week,day_of_week:1,time_id:time,campus}]});
test('all supplied fictional records validate',()=>assert.equal(new DemoModel(employees,json('shifts.json'),weeks).shifts.length,1860));
test('invalid employee, dates, time IDs and campuses fail',()=>{
 const m=fresh();
 for(const mutate of [p=>p.emp_id=1,p=>p.name='<script>',p=>p.shifts[0].shift_date='2026-02-30',p=>p.shifts[0].time_id='O999',p=>p.shifts[0].campus='Other']){
   const p=payload();mutate(p);assert.throws(()=>m.replace(p));assert.equal(m.shifts.length,0);
 }
});
test('staff payload cannot bypass campus capacity',()=>{
 const m=fresh();for(const id of [9001,9002,9003])m.replace(payload(id));
 assert.throws(()=>m.replace({...payload(9004),staff:true}),/full/);assert.equal(m.shifts.length,3);
});
test('duplicate submissions replace rather than double count',()=>{const m=fresh();m.replace(payload());m.replace(payload());assert.equal(m.shifts.length,1);});
test('employee cannot overlap across campuses',()=>{const m=fresh();m.replace(payload());assert.throws(()=>m.replace(payload(9001,'Harborside')),/overlapping/);assert.equal(m.shifts.length,1);});
test('failed update preserves previous shifts',()=>{
 const m=fresh();m.replace(payload(9001,'Downcity','O900'));
 for(const id of [9002,9003,9004])m.replace(payload(id));
 const before=JSON.stringify(m.shifts);assert.throws(()=>m.replace(payload()),/full/);assert.equal(JSON.stringify(m.shifts),before);
});
test('campus-specific update preserves other campus schedules',()=>{const m=fresh();m.replace(payload());m.replace(payload(9001,'Harborside','O900'));m.replace(payload(9001,'Harborside','O1000'));assert.equal(m.shifts.length,2);assert.ok(m.shifts.some(s=>s.campus==='Downcity'&&s.time_id==='O800'));});
test('25-hour limit applies across campuses',()=>{
 const m=fresh(),p=payload();p.shifts=[];
 for(let day=0;day<5;day++)for(let h=8;h<17;h++)for(let minute=0;minute<60;minute+=15){
  const date=new Date(weeks[0]+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+day);
  p.shifts.push({emp_id:9001,shift_date:date.toISOString().slice(0,10),day_of_week:day+1,time_id:'OUEHR'[day]+(h%12||12)+String(minute).padStart(2,'0'),campus:'Downcity'});
 }
 const extra=p.shifts[100];p.shifts=p.shifts.slice(0,100);m.replace(p);
 const second={...payload(9001,'Harborside'),shifts:[{...extra,campus:'Harborside'}]};
 assert.throws(()=>m.replace(second),/25 hours/);assert.equal(m.shifts.length,100);
});
test('invalid capacity and tampered saved state fail',()=>{const m=fresh();for(const cap of [0,-1,9,2.5,'<img>'])assert.throws(()=>m.setCapacity(cap));assert.throws(()=>m.restore({version:1,maxSlots:999,shifts:[]}));assert.equal(m.maxSlots,3);});
test('repeat-week operation rolls back all weeks on failure',()=>{
 const m=fresh();for(const id of [9002,9003,9004])m.replace(payload(id,'Downcity','O800',weeks[1]));
 const before=JSON.stringify(m.shifts);
 assert.throws(()=>m.replaceMany([payload(),payload(9001,'Downcity','O800',weeks[1])]),/full/);
 assert.equal(JSON.stringify(m.shifts),before);
});
test('delete only removes the selected fictional employee',()=>{const m=fresh();m.replace(payload());m.replace(payload(9002));m.deleteEmployee(employees[0].name);assert.deepEqual(m.shifts.map(s=>s.emp_id),[9002]);});
test('all remaining PHP files fail closed without connections or database operations',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const php=walk(root).filter(f=>f.endsWith('.php'));assert.equal(php.length,9);
 for(const file of php){const code=fs.readFileSync(file,'utf8');assert.match(code,/http_response_code\(410\)/);assert.doesNotMatch(code,/\b(?:include|require|mysqli|PDO|file_put_contents|session_start)\b|\$_(?:POST|GET)/);}
});
