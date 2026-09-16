
  let employees = [];
  let employeeColorMap = {};
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const weekPicker = document.getElementById("weekPicker");
  const shiftTableBody = document.getElementById("shiftTableBody");
  const totalsList = document.getElementById("totalsList");

  const formatDate = date => date.toISOString().split("T")[0];

  //const getMonday = date => {
  //  const d = new Date(date);
   // const day = d.getDay();
   // const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  //  return new Date(d.setDate(diff));
  //};

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);
    return d;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h < 17; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour12 = h % 12 || 12;
        const ampm = h < 12 ? "AM" : "PM";
        slots.push(`${hour12}:${m.toString().padStart(2, "0")} ${ampm}`);
      }
    }
    return slots;
  };

  const nameToColor = name => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 75%)`;
  };

  const getTextContrast = (bgColor) => {
    const match = bgColor.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!match) return "#000";
    let [_, h, s, l] = match.map(Number);
    h /= 360; s /= 100; l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 0.55 ? "#000" : "#fff";
  };

const fetchScheduleData = async (weekStart) => {
  try {
    const res = await SchedulerDemo.request(`weekly_schedule_load.php?week_start=${weekStart}`);

    // Check HTTP status
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    // Read raw text and log it
    const text = await res.text();


    // Now parse JSON
    const data = JSON.parse(text);

    if (!data.success) {
      throw new Error(data.error || "Unknown error in payload");
    }

    employees = data.employees.map(e => e.name);
    employeeColorMap = {};
    employees.forEach(name => {
      employeeColorMap[name] = nameToColor(name);
    });

    return data.shifts;
  }
  catch (err) {

    return [];
  }
};

  const buildDayHeaders = () => {
    const thead = document.querySelector("thead");
    thead.innerHTML = "";

    const dayRow = document.createElement("tr");
    const timeTh = document.createElement("th");
    timeTh.textContent = "Time";
    timeTh.rowSpan = 2;
    dayRow.appendChild(timeTh);

    days.forEach(day => {
      const th = document.createElement("th");
      th.className = "day-header";
      th.colSpan = employees.length;
      th.textContent = day;
      dayRow.appendChild(th);
    });

    thead.appendChild(dayRow);

    const nameRow = document.createElement("tr");
    days.forEach(() => {
      employees.forEach(name => {
        const bg = employeeColorMap[name];
        const text = getTextContrast(bg);
        const th = document.createElement("th");
        th.textContent = name;
        th.style.backgroundColor = bg;
        th.style.color = text;
        th.style.fontWeight = "bold";
        th.style.writingMode = "vertical-lr";
        th.style.transform = "rotate(180deg)";
        th.style.padding = "5px";
        th.style.border = "1px solid #ccc";
        nameRow.appendChild(th);
      });
    });

    thead.appendChild(nameRow);
  };

  const buildTable = async (weekStart) => {
    shiftTableBody.innerHTML = "";
    totalsList.innerHTML = "";

    const slots = generateTimeSlots();
    const shiftList = await fetchScheduleData(weekStart);
    const shiftLookup = {};

    shiftList.forEach(s => {
      const emp = s.emp_name;
      const day = s.day_of_week;
      const time = s.time_id;
      if (!shiftLookup[day]) shiftLookup[day] = {};
      if (!shiftLookup[day][emp]) shiftLookup[day][emp] = new Set();
      shiftLookup[day][emp].add(time);
    });


    slots.forEach((slot, rowIndex) => {
      const row = document.createElement("tr");

      const timeCell = document.createElement("td");

      timeCell.className = "time-label";
      timeCell.textContent = slot;

      const safeSlot = slot.replace(/[\s:]/g,"");
      timeCell.id = `${rowIndex}${safeSlot}`;

      row.appendChild(timeCell);

      days.forEach((day, dayIdx) => {
        // 1) Grab the day initial
        const dayLetter  = day.charAt(1).toUpperCase();               // "M", "T", ...

        // 2) Pull only digits out of the slot
        const timeDigits = slot.replace(/\D/g, "");      // "800", "1215", ...

        employees.forEach(name => {
          const cell = document.createElement("td");

          // 3) Strip spaces from the employee name
          const cleanName = name.replace(/\s+/g, "");    // "AlexMorgan"

          // 4) YOUR NEW ID FORMAT:
          //    DayInitial + TimeDigits + CleanName
          //    e.g. "M800Alex", "T1215Bob"
          cell.id = `${dayLetter}${timeDigits}${cleanName}`;

          // … your existing coloring & class logic …
          if (shiftLookup[day]?.[name]?.has(slot)) {
            cell.style.backgroundColor = employeeColorMap[name];
            //totalWeeklyHours[name] = (totalWeeklyHours[name] || 0) + 0.25;
            cell.dataset.employee = name; // ✅ Add this line
            
          }
          if (dayIdx === 1 || dayIdx === 3) {
            cell.classList.add("alt-day");
          }

          row.appendChild(cell);
        });
      });
      // ——— END OF MODIFIED SECTION ←


      shiftTableBody.appendChild(row);
    });

    // 🌈 Highlight cells based on shiftList
    shiftList.forEach(shift => {
      const dayIndex   = parseInt(shift.day_of_week, 10) - 1;  // convert to 0-based index
      const dayString  = days[dayIndex];

      const dayChar    = dayString.charAt(1).toUpperCase();         // second character
      const timeDigits = shift.time_id.replace(/\D/g, "");        // only digits
      const cleanName  = shift.emp_name.replace(/\s+/g, "");            // "Alex Morgan" → "AlexMorgan"

      const cellId     = `${dayChar}${timeDigits}${cleanName}`;
      const cell       = document.getElementById(cellId);

      if (cell) {
        const bg = employeeColorMap[shift.emp_name];
        cell.style.backgroundColor = bg;
        cell.style.color = getTextContrast(bg);
        cell.style.fontWeight = "bold";
        cell.dataset.employee = shift.emp_name; // ✅ Add this line
      } else {

      }
    });

    //Calculates total of hours for the Totals List
    function calculateWeeklyTotals() {
      const totals = {};
      const allCells = document.querySelectorAll("#shiftTableBody td[data-employee]");

      
    allCells.forEach(cell => {
      const emp = cell.dataset.employee;

        if (emp) {
          totals[emp] = (totals[emp] || 0) + 0.25;
        }
    });

      return totals;
    };

  // 🧮 Totals list
    const totalWeeklyHours = calculateWeeklyTotals();

    totalsList.innerHTML = "";
    employees.forEach(name => {
      const bg = employeeColorMap[name];
      const text = getTextContrast(bg);
      const hrs = totalWeeklyHours[name]?.toFixed(2) || "0.00";
      const li = document.createElement("li");
      const badge = document.createElement('span');
            badge.style.cssText = 'padding: 4px 10px; border-radius: 4px; display:inline-block; min-width:80px;';
            badge.style.backgroundColor = bg;
            badge.style.color = text;
            badge.textContent = name;
            li.append(badge, document.createTextNode(' — ' + hrs + ' hrs'));
      totalsList.appendChild(li);
    });
  };

  weekPicker.addEventListener("change", async () => {
     
    const selectedDate = new Date(weekPicker.value + 'T00:00:00');
      if (selectedDate.getDay() !== 1) {
        alert('Please select a Monday.');
          weekPicker.value = SchedulerDemo.firstWeek;
          return;
      }
    const picked = new Date(weekPicker.value);

    //const monday = getMonday(picked);
    //console.log(monday);
    const weekKey = formatDate(picked);

    await fetchScheduleData(weekKey);
    buildDayHeaders();
    await buildTable(weekKey);
  });

  const init = async () => {
    await SchedulerDemo.ready;
          const weekKey = SchedulerDemo.firstWeek;
          weekPicker.value = weekKey;
    await fetchScheduleData(weekKey);
    buildDayHeaders();
    await buildTable(weekKey);
  };

  init();
