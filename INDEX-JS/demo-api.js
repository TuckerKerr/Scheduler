/* Only explicit requests to this local demo API are simulated. No global fetch override. */
(function () {
  'use strict';
  const base = new URL('../', document.currentScript.src);
  const prefix = 'scheduler-demo:' + base.pathname + ':';
  const storage = {
    get(key) {try{return sessionStorage.getItem(prefix+key);}catch{return null;}},
    set(key,value) {try{sessionStorage.setItem(prefix+key,value);}catch{/* In-memory operation remains available. */}},
    remove(key) {try{sessionStorage.removeItem(prefix+key);}catch{}}
  };
  let model;
  const ready = Promise.all(['employees.json','shifts.json','demo-metadata.json','search-assets.json'].map(async name=>{
    const res=await fetch(new URL('portfolio-data/'+name,base), {credentials:'omit'});
    if(!res.ok) throw Error('Demo data could not be loaded.');
    return res.json();
  })).then(([employees,shifts,meta,assets])=>{
    model=new DemoModel(employees,shifts,meta.weeks);
    try{const saved=storage.get('state');if(saved)model.restore(JSON.parse(saved));}catch{storage.remove('state');}
    return {model,assets};
  });
  // Attach a handler immediately; UI requests still receive the original rejection.
  ready.catch(()=>{});
  const response = (body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  const persist = ()=>storage.set('state',JSON.stringify(model.snapshot()));
  async function request(input,options={}) {
    try {
      const {assets}=await ready;
      const url=new URL(input,location.href);
      if(url.origin!==base.origin) throw Error('Unsupported demo request.');
      const endpoint=url.pathname.split('/').pop(), action=url.searchParams.get('action');
      const method=(options.method||'GET').toUpperCase();
      const body=options.body instanceof FormData ? Object.fromEntries(options.body) : options.body ? JSON.parse(options.body) : {};
      const write=()=>{if(method!=='POST')throw Error('This demo operation requires POST.');};
      if(['weekly_schedule_load.php','weekly_schedule.php'].includes(endpoint)){
        const week=model.monday(url.searchParams.get('week_start'));
        return response({success:true,employees:model.employees,shifts:model.shifts.filter(s=>model.monday(s.shift_date)===week)});
      }
      if(endpoint==='admin_updates.php' && action==='firstRun')return response([model.employees.map(({name})=>({name}))]);
      if(endpoint==='semDateSubmit.php' && action==='check')return response({success:1,errormessage:model.weeks.at(-1)});
      if(endpoint==='MaxStudentsPerSlot.php'){
        if(action==='submit'){write();model.setCapacity(body.MaxSlots);persist();}
        else if(action!=='check')throw Error('Unsupported demo request.');
        return response({success:1,errormessage:String(model.maxSlots)});
      }
      if(endpoint==='time_check.php')return response({success:1,errormessage:String(model.shifts.filter(s=>s.shift_date===body.date_id && s.time_id===body.time_id && s.campus===body.campus).length)});
      if(endpoint==='submitshift.php' && url.searchParams.get('fetch')==='employees')return response({success:true,username:body.nameUser,employees:model.employees.filter(e=>e.name===body.nameUser).map(e=>e.emp_id)});
      if(endpoint==='shiftUpdate.php' && action==='getShifts')return response({success:true,shifts:model.shifts.filter(s=>s.emp_name===body.username && s.shift_date>=body.date_id && s.shift_date<=body.date_end && s.campus===body.campus).map(({shift_date,time_id})=>({shift_date,time_id}))});
      if(endpoint==='shiftUpdate.php' && action==='shiftDeletion'){write();model.deleteEmployee(body.nameOfUser);persist();return response({success:true});}
      if((endpoint==='submitshift.php' && !url.searchParams.has('fetch')) || (endpoint==='shiftUpdate.php' && action==='updateShifts')){
        write();const result=model.replace(body);persist();
        storage.set('confirmation',JSON.stringify(body.shifts.map(s=>({day:['Monday','Tuesday','Wednesday','Thursday','Friday'][Number(s.day_of_week)-1],time:s.time_id.slice(1),date:s.shift_date,campus:s.campus}))));
        return response(result);
      }
      if(endpoint==='search-assets.php'){
        const q=(url.searchParams.get('q')||'').trim().toLowerCase().slice(0,100);
        return response(q?assets.filter(a=>[a.asset,a.description,a.tag].some(v=>String(v).toLowerCase().includes(q))):[]);
      }
      throw Error('Unsupported demo request.');
    } catch(error){return response({success:false,error:error.message||'Demo request failed.'},400);}
  }
  window.SchedulerDemo=Object.freeze({
    ready, request, user:'Alex Morgan', isAdmin:true,
    get firstWeek(){return model?.weeks[0]||'2026-09-14';},
    get lastWeek(){return model?.weeks.at(-1)||'2026-10-05';},
    async availability(week,campus){await ready;const counts={};for(const s of model.shifts)if(model.monday(s.shift_date)===week&&s.campus===campus)counts[s.time_id]=(counts[s.time_id]||0)+1;return {counts,maxSlots:model.maxSlots};},
    async saveRepeat(payloads){
      await ready;const result=model.replaceMany(payloads);persist();
      storage.set('confirmation',JSON.stringify(payloads.flatMap(p=>p.shifts.map(s=>({day:['Monday','Tuesday','Wednesday','Thursday','Friday'][Number(s.day_of_week)-1],time:s.time_id.slice(1),date:s.shift_date,campus:s.campus})))));
      return result;
    },
    confirmation(){try{const data=JSON.parse(storage.get('confirmation')||'[]');return Array.isArray(data)?data.slice(0,400):[];}catch{return [];}},
    reset(){storage.remove('state');storage.remove('confirmation');location.href=new URL('INDEX-HTML/schedule_integration.html',base).href;}
  });
})();
