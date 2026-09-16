
        // Toggle campus and reload availability + shifts
        async function switchCampus(toggle){
          let campus = toggle.checked ? 'Harborside' : "Downcity";

          toggle.dataset.mode = campus;

          let weekStart = document.getElementById("weekStart").value;
          if (!weekStart) return;
          weekStart = new Date(weekStart + 'T00:00:00');


          document.querySelectorAll("td").forEach(cell => {
            cell.setAttribute('class' ,'selectable');
          });

          await grabShifts(weekStart);
          await checkTimeslot(weekStart);
        }

        // Load existing shifts for user in a given week and mark grid
        async function grabShifts(weekStart){

          //pass the last week of the semester as they will be the same and known.
          const weekEnd = new Date(weekStart);
          const weekBegin = new Date(weekStart);
          weekBegin.setUTCDate(weekStart.getUTCDate());
          weekEnd.setUTCDate(weekStart.getUTCDate() + 4);
          const lastDay = weekEnd.toISOString().slice(0, 10); 
          const weekStartString = weekStart.toISOString().slice(0, 10); 
          let user_name = SchedulerDemo.user;
          const adminNames = [SchedulerDemo.user];
          if(adminNames.includes(user_name)){
            user_name = document.getElementById("studentsNames").value;
          }
          const campus = document.getElementById("shiftCampus").dataset.mode;

          // Clear any prior selected state
          document.querySelectorAll("td.selected").forEach(cell => {
                cell.setAttribute('class' ,'selectable');
              });

          try {
            const response = await SchedulerDemo.request('../INDEX-PHP/shiftUpdate.php?action=getShifts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: user_name,
                date_id: weekStartString,
                date_end: lastDay,
                campus: campus
              })
            });

            const data = await response.json();

            // If there are existing shifts, map them into the grid
            if (!data.success) throw new Error(data.error || 'Unable to load demo shifts.');
            document.getElementById('loggedHours').textContent = '0.00';
            document.getElementById('shiftForm').dataset.mode = 'submit';
            if(data.shifts.length !== 0){


              const dateMap = new Map();
              let index = 0;
          
              while(weekBegin <= weekEnd){
                //loop over and map the values of the week to the index of the day
                const day = weekBegin.toISOString().slice(0, 10); 
                dateMap.set(day, index);
                weekBegin.setUTCDate(weekBegin.getUTCDate() + 1);
                index++;
              }
              
              const loggedHoursSpan = document.getElementById("loggedHours");
              let hours = 0

              // Mark selected cells based on shift time_id and date
              data.shifts.forEach(shift => {
                const dayNumber = dateMap.get(shift.shift_date);


                const cell = document.querySelector(
                  `#${shift.time_id}[data-index="${dayNumber}"]`
                )

                if (cell) cell.setAttribute("class", "selected");
                
                hours += .25;
            });

            loggedHoursSpan.textContent = hours;
            const form = document.getElementById("shiftForm");
            form.dataset.mode = "update";


            }

          } catch (err) {

            alert("Error checking shifts. Check console.");
            return; // STOP everything if one week fails
          }
        }

        // Load end-of-semester date and apply to lastWeek input
        async function checkDate(){
          const LastWeekElement = document.getElementById("lastWeek");

          const response = await SchedulerDemo.request('../INDEX-PHP/semDateSubmit.php?action=check'); // Update the path to your PHP script
            const data = await response.json();
            if(data){
              LastWeekElement.value = data.errormessage;
            }
        }

        // Check capacity for each 15-min slot Monday–Friday and mark cells unselectable if full
        async function checkTimeslot(date) {
          const campus = document.getElementById('shiftCampus').dataset.mode;
          const week = date.toISOString().slice(0, 10);
          const {counts, maxSlots} = await SchedulerDemo.availability(week, campus);
          document.querySelectorAll('#scheduleBody td[data-time]').forEach(cell => {
            const full = (counts[cell.id] || 0) >= maxSlots;
            cell.classList.toggle('unselectable', full && !cell.classList.contains('selected'));
            cell.classList.toggle('selectable', !full && !cell.classList.contains('selected'));
          });
        }

        document.addEventListener("DOMContentLoaded", async () => {
          const user_name = SchedulerDemo.user;
          const staff = SchedulerDemo.isAdmin; // Demo controls only; grants no server privileges.

          const allowedNames = [SchedulerDemo.user];
          
          //Load the students names if the admin are the ones looking at the page
          if(allowedNames.includes(user_name) && staff){
            document.getElementById("modifyStudent").style.display = "";


            const response = await SchedulerDemo.request("../INDEX-PHP/admin_updates.php?action=firstRun");
            const users = await response.json();


            /* WORK IN PROGRESS */
            const select = document.getElementById('studentsNames');

            users[0].forEach(user => {
              const option = document.createElement('option');
              option.value = user.name;
              option.textContent = user.name;
              select.appendChild(option);
              if (user.name === SchedulerDemo.user) option.selected = true;
            });
          }

          document.getElementById('studentsNames').addEventListener('change', async function () {
              weekStart = document.getElementById('weekStart').value;
              weekStart = new Date(weekStart + 'T00:00:00');

              if (Number.isNaN(weekStart.valueOf())) return;
              await grabShifts(weekStart);
              await checkTimeslot(weekStart);
          });

          await checkDate();
          try {
            const res = await SchedulerDemo.request("../INDEX-PHP/submitshift.php?fetch=employees", 
            { method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                nameUser: user_name
              })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const emp_id = data.employees;
            
            document.getElementById("workerID").value = emp_id;


            const username = SchedulerDemo.user;
            if (username) {
              document.getElementById('usernameDisplay').innerText = username;
            }

          } catch (err) {

            alert("Could not load employees. Please try again later.");
          }

          const dayMapping = {
            "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5
          };

          const hiddenIds = ['hiddenmonDate', 'hiddenTueDate', 'hiddenWedDate', 'hiddenThuDate', 'hiddenFriDate'];
          const scheduleBody = document.getElementById("scheduleBody");
          const startHour = 8;
          const endHour = 17;
          const interval = 15;
          const maxHours = 25;
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

          for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
              let timeLabel = `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
              let row = `<tr><td>${timeLabel}</td>`;
              days.forEach((day, index) => {
                let newid = day.substring(1, 2).toUpperCase() + timeLabel.replace(/:|AM|PM/g, "").trim();
                row += `<td id="${newid}" class="selectable" data-day="${day}" data-time="${timeLabel}" data-index="${index}"></td>`;
              });
              row += `</tr>`;
              scheduleBody.innerHTML += row;
            }
          }

          // Click-and-drag selection logic
          let isMouseDown = false;
          let isSelecting = true; // true = selecting, false = deselecting

          const loggedHoursSpan = document.getElementById("loggedHours");

          document.querySelectorAll("td.selectable").forEach(cell => {
            cell.addEventListener("mousedown", function (e) {
              e.preventDefault(); // prevent text selection
              isMouseDown = true;
              isSelecting = !this.classList.contains("selected");
              toggleCell(this, isSelecting);
            });

            cell.addEventListener("mouseover", function () {
              if (isMouseDown) {
                toggleCell(this, isSelecting);
              }
            });
          });

          document.addEventListener("mouseup", function () {
            isMouseDown = false;
          });

          function toggleCell(cell, select) {
            if (select) {
              if(cell.classList.contains("unselectable")){
                alert("You cannot select this time. The configured capacity has been reached.");
                isMouseDown = false;
                return;
              }
              else if (!cell.classList.contains("selected")) {
                const selectedCount = document.querySelectorAll("td.selected").length;
                const hours = selectedCount * 0.25 + 0.25;
                if (hours > maxHours) {
                  alert("You cannot log more than 25 hours.");
                  return;
                }
                cell.classList.add("selected");
              }
            } else {
              cell.classList.remove("selected");
            }

            const updatedCount = document.querySelectorAll("td.selected").length;
            loggedHoursSpan.textContent = (updatedCount * 0.25).toFixed(2);
          }

          document.getElementById('weekStart').addEventListener('change', async function () {
            document.querySelectorAll("td.selected").forEach(cell => {
                cell.setAttribute('class' ,'selectable');
              });

            const selectedDate = new Date(this.value + 'T00:00:00Z');
            if (selectedDate.getUTCDay() !== 1) {
              alert('Please select a Monday.');
              this.value = '';
              return;
            }

            const spanIds = ['monDate', 'tueDate', 'wedDate', 'thuDate', 'friDate'];

            days.forEach((day, i) => {
              const date = new Date(selectedDate);
              date.setUTCDate(date.getUTCDate() + i);
              const iso = date.toISOString().split('T')[0];
              const spanElement = document.getElementById(spanIds[i]);
              if (spanElement) {
                spanElement.textContent = iso;
              }

              let hiddenElement = document.getElementById(hiddenIds[i]);
              if (!hiddenElement) {
                hiddenElement = document.createElement("input");
                hiddenElement.type = "hidden";
                hiddenElement.id = hiddenIds[i];
                hiddenElement.name = `dates[$days[i]}]`;
                document.getElementById("shiftForm").appendChild(hiddenElement);
              }
              hiddenElement.value = iso;
            });

            await grabShifts(selectedDate);
            await checkTimeslot(selectedDate);
          });

          // Save every repeat week atomically in the local demo model.
          document.getElementById('shiftForm').addEventListener('submit', async function (event) {
            event.preventDefault();
            const selected = [...document.querySelectorAll('#scheduleBody td.selected')];
            if (!selected.length) { alert('Please select at least one shift.'); return; }
            const name = document.getElementById('studentsNames').value || SchedulerDemo.user;
            const week = document.getElementById('weekStart').value;
            if (!week || week < SchedulerDemo.firstWeek || week > SchedulerDemo.lastWeek) {
              alert('Choose one of the four demo weeks.'); return;
            }
            const campus = document.getElementById('shiftCampus').dataset.mode;
            const button = document.getElementById('shiftButton');
            const overlay = document.getElementById('spinner-overlay');
            button.disabled = true;
            overlay.classList.add('active');
            try {
              const lookup = await SchedulerDemo.request('../INDEX-PHP/submitshift.php?fetch=employees', {
                method: 'POST', body: JSON.stringify({nameUser: name})
              });
              const employee = await lookup.json();
              if (!employee.success || employee.employees.length !== 1) throw Error('Choose a demo employee.');
              const emp_id = employee.employees[0];
              const payloads = [];
              const monday = new Date(week + 'T00:00:00Z');
              while (monday.toISOString().slice(0,10) <= SchedulerDemo.lastWeek) {
                const week_start = monday.toISOString().slice(0,10);
                const shifts = selected.map(cell => {
                  const date = new Date(monday);
                  const index = Number(cell.dataset.index);
                  date.setUTCDate(date.getUTCDate() + index);
                  return {emp_id, shift_date: date.toISOString().slice(0,10), day_of_week: index + 1, time_id: cell.id, campus};
                });
                payloads.push({emp_id, name, week_start, shifts});
                monday.setUTCDate(monday.getUTCDate() + 7);
              }
              await SchedulerDemo.saveRepeat(payloads);
              alert('Demo shifts saved in this tab.');
              window.location.href = 'confirmation_page.html';
            } catch (error) {
              alert(error.message || 'Unable to save the demo schedule.');
            } finally {
              button.disabled = false;
              overlay.classList.remove('active');
            }
          });
          await SchedulerDemo.ready;
          const picker = document.getElementById('weekStart');
          picker.min = SchedulerDemo.firstWeek;
          picker.max = SchedulerDemo.lastWeek;
          picker.value = SchedulerDemo.firstWeek;
          picker.dispatchEvent(new Event('change'));
        });
      
