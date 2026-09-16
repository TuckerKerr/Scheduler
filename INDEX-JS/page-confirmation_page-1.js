
        document.addEventListener("DOMContentLoaded", function() {
            const shiftData = SchedulerDemo.confirmation();
            const summaryContainer = document.getElementById("shiftSummary");

            if (shiftData.length === 0) {
                summaryContainer.innerHTML = "<p>No shifts were selected for submission.</p>";
            } else {
                summaryContainer.innerHTML = "<p>You've successfully submitted the following shifts: </p>";
                shiftData.forEach(shift => {
                    const line = document.createElement('p');
                    const digits = String(shift.time || '');
                    line.textContent = String(shift.day || '') + ' ' + String(shift.date || '') + ': ' + digits.slice(0,-2) + ':' + digits.slice(-2) + ' (15 minutes), ' + String(shift.campus || '');
                    summaryContainer.appendChild(line);
                });
            }
        });
    