/* Fictional, local-only scheduling model. There are no server privileges here. */
(function (root) {
  'use strict';
  class DemoModel {
    constructor(employees, shifts, weeks) {
      this.employees = employees.map(e => ({emp_id: Number(e.emp_id), name: String(e.name)}));
      this.weeks = [...weeks];
      this.maxSlots = 3;
      this.shifts = shifts.map(s => ({emp_id: Number(s.emp_id), emp_name: String(s.emp_name), shift_date: s.shift_date, day_of_week: Number(s.day_of_week), time_id: s.time_id, campus: s.campus}));
      this.validate(this.shifts);
    }
    monday(date) {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Select a valid date.');
      const d = new Date(date + 'T00:00:00Z');
      if (!Number.isFinite(d.valueOf()) || d.toISOString().slice(0,10) !== date) throw Error('Select a valid date.');
      d.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1);
      return d.toISOString().slice(0,10);
    }
    employee(id) {
      const emp = this.employees.find(e => e.emp_id === Number(id));
      if (!emp) throw Error('Choose a demo employee.');
      return emp;
    }
    slot(s) {
      this.employee(s.emp_id);
      if (!this.weeks.includes(this.monday(s.shift_date))) throw Error('Choose one of the four demo weeks.');
      const day = new Date(s.shift_date+'T00:00:00Z').getUTCDay();
      if (day < 1 || day > 5 || day !== s.day_of_week || typeof s.time_id !== 'string') throw Error('Invalid shift day.');
      const valid = [];
      for (let h=8;h<17;h++) for(let m=0;m<60;m+=15) valid.push('OUEHR'[day-1]+(h%12||12)+String(m).padStart(2,'0'));
      if(!valid.includes(s.time_id)) throw Error('Invalid shift time.');
      if(!['Downcity','Harborside'].includes(s.campus)) throw Error('Invalid campus.');
    }
    validate(shifts) {
      if (!Array.isArray(shifts) || shifts.length > 5760) throw Error('Invalid demo state.');
      const unique = new Set(), count = new Map(), hours = new Map();
      for (const s of shifts) {
        this.slot(s);
        if(s.emp_name !== this.employee(s.emp_id).name) throw Error('Invalid employee name.');
        const key = [s.emp_id,s.shift_date,s.time_id].join('|');
        if(unique.has(key)) throw Error('An employee cannot work overlapping shifts.');
        unique.add(key);
        const cap = [s.shift_date,s.time_id,s.campus].join('|');
        count.set(cap,(count.get(cap)||0)+1);
        if(count.get(cap)>this.maxSlots) throw Error('A selected slot is full. No changes were saved.');
        const week = [s.emp_id,this.monday(s.shift_date)].join('|');
        hours.set(week,(hours.get(week)||0)+1);
        if(hours.get(week)>100) throw Error('An employee cannot exceed 25 hours per week across both campuses.');
      }
    }
    restore(snapshot) {
      if (!snapshot || snapshot.version!==1 || !Number.isInteger(snapshot.maxSlots) || snapshot.maxSlots<1 || snapshot.maxSlots>8) throw Error('Invalid saved demo.');
      const previous=this.maxSlots;
      try {this.maxSlots=snapshot.maxSlots;this.validate(snapshot.shifts);this.shifts=snapshot.shifts.map(s=>({...s}));}
      catch(error){this.maxSlots=previous;throw error;}
    }
    snapshot() {return {version:1,maxSlots:this.maxSlots,shifts:this.shifts};}
    replace(payload) {
      const emp=this.employee(payload.emp_id);
      if(payload.name!==emp.name || !this.weeks.includes(payload.week_start) || !Array.isArray(payload.shifts) || payload.shifts.length<1 || payload.shifts.length>100) throw Error('Invalid demo schedule.');
      const campus=payload.shifts[0].campus;
      const incoming=payload.shifts.map(s=>({emp_id:emp.emp_id,emp_name:emp.name,shift_date:s.shift_date,day_of_week:Number(s.day_of_week),time_id:s.time_id,campus:s.campus}));
      if(incoming.some(s=>s.campus!==campus || this.monday(s.shift_date)!==payload.week_start)) throw Error('A schedule must use one campus and one week.');
      const kept=this.shifts.filter(s=>!(s.emp_id===emp.emp_id && this.monday(s.shift_date)===payload.week_start && s.campus===campus));
      const next=[...kept,...incoming];
      this.validate(next); // Validate everything before committing; failure preserves existing shifts.
      this.shifts=next;
      return {success:true,message:'Demo schedule saved in this tab.'};
    }
    setCapacity(value) {
      const next=Number(value), previous=this.maxSlots;
      if(!Number.isInteger(next)||next<1||next>8) throw Error('Capacity must be a whole number from 1 to 8.');
      this.maxSlots=next;
      try{this.validate(this.shifts);}catch(error){this.maxSlots=previous;throw error;}
    }
    replaceMany(payloads) {
      if(!Array.isArray(payloads)||!payloads.length||payloads.length>this.weeks.length) throw Error('Invalid demo date range.');
      const previous=this.shifts;
      try{for(const payload of payloads)this.replace(payload);}
      catch(error){this.shifts=previous;throw error;}
      return {success:true,message:'Demo schedules saved in this tab.'};
    }
    deleteEmployee(name) {
      const emp=this.employees.find(e=>e.name===name);
      if(!emp) throw Error('Choose a demo employee.');
      this.shifts=this.shifts.filter(s=>s.emp_id!==emp.emp_id);
    }
  }
  if(typeof module==='object' && module.exports) module.exports=DemoModel;
  else root.DemoModel=DemoModel;
})(globalThis);
