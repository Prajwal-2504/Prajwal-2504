// Global variables
let a = "College Attendance";
let b = "Semester 3";
const theme = document.querySelector(".theme");
theme.textContent = `${a} ${b}`;
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
// Event listeners
window.addEventListener('load', loadStoredTimetable);
window.addEventListener('beforeunload', SaveData);
//setInterval(displaySubjects,1000);
// Function to check if there are any week tables
function check_out(){
    let weeks = document.querySelectorAll(".table-section");
    if(weeks.length === 0)  first();
}
// Function to display first-time message
function first(){
    let First = document.getElementById("first-time");
    let dont_show = document.querySelectorAll("button:not(.add-week-btn),input:not(#file_input_on_first_spawn),#period-container,#attendance-display-section");
    dont_show.forEach(dont => dont.style.display = "none");
    First.innerHTML = `
        <h2>No stored timetable data found. Please select a JSON file where you might have stored your data</h2><br>
        <input type="file" id="file_input_on_first_spawn" class="user_input_file"><br><br>
        <h3>If you are setting up your Timetable for the first time, press the Add New Week button to start adding weeks!</h3>
    `;
    const fileInput = document.getElementById("file_input_on_first_spawn");
    fileInput.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    status_timetable = data;
                    localStorage.setItem(`${b}`,JSON.stringify(status_timetable));
                    alert("Data retrieved successfully");
                    document.getElementById("table-container").innerHTML = '';
                    remove_first();
                    loadStoredTimetable();
                } catch (error) {
                    console.error('Error parsing the JSON file:', error);
                    alert("Failed to parse the JSON file.");
                }
            };
            reader.readAsText(file);
        } else {
            alert("No file selected.");
        }
    });
}
// Function to remove first-time message
function remove_first(){
    let First = document.getElementById("first-time");
    First.innerHTML = '';
    let firstTimeDate = document.getElementById("first-time-date");
    firstTimeDate.innerHTML = '';
    firstTimeDate.style.display = 'none';
    let show = document.querySelectorAll("button:not(.add-week-btn),input:not(#file_input_on_first_spawn),#period-container");
    //document.getElementById("attendance-display-section").innerHTML = '';
    show.forEach(show => show.style.display = "inline-block");
}
// Function to check if a row is empty
function checkifempty(any){
    let periods = any.querySelectorAll(".period");
    let a = 1;
    for(let period of periods){
        if (period.textContent && (period.classList.contains("Present") || period.classList.contains("Absent") || period.classList.contains("no-class"))) 
        {    
            a = 0;
            break;
        }
    }
    return a === 1;
}
// Function to find the next Monday
function findNextMonday() {
    const weekTables = document.querySelectorAll(".table-section");
    if (weekTables.length === 0) return null;
    const lastWeekTable = weekTables[weekTables.length - 1];
    const weekRows = lastWeekTable.querySelectorAll(".week-row");
    if (weekRows.length === 0) return null;
    const lastRow = weekRows[weekRows.length - 1];
    const dateCell = lastRow.querySelector(".date-cell");
    const dayCell = lastRow.querySelector(".day-cell");
    const dateValue = dateCell ? dateCell.textContent.trim() : null;
    const dayValue = dayCell ? dayCell.textContent.trim() : null;
    if (!dateValue || !dayValue) return null;
    const [day, month, year] = dateValue.split("/").map(Number);
    let currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay();
    const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;
    currentDate.setDate(currentDate.getDate() + daysUntilNextMonday - 2);
    const nextMonday = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    return nextMonday;
}
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-11) and pad with leading zero
    const year = date.getFullYear(); // Get year
    return `${day}/${month}/${year}`; // Return formatted date string
}
function scrollToButtonWithOffset(button) {
    const buttonPosition = button.getBoundingClientRect().top + window.scrollY;
    const offset = 123; // Set the offset to be slightly above the viewport bottom, e.g., 50px
    window.scrollTo({
        top: buttonPosition - window.innerHeight + offset,
        behavior: 'instant'
    });
}
/*
let TimeTable = [
    ["DS", "TC", "MATHS-IV", "COA", "DSTL", "PP", "ADP", "Counselling"],
    ["MATHS-IV", "DSTL", "PP", "TC", "COA", "DS", "Mini-Project/AWS", "Mini-Project/AWS"],
    ["DS", "DSTL", "DS Using Python", "DS Using Python", "COA", "MATHS-IV", "Web-Designing", "Web-Designing"],
    ["DS LAB", "DS LAB", "DSTL", "MATHS-IV", "PP", "DS", "COA",""],
    ["MATHS-IV", "COA LAB", "COA LAB", "DS", "COA", "DSTL", "TC", "PP"]
];
let subjects = [...new Set(TimeTable.flat())];
subjects.splice(subjects.indexOf(""), 1);
*/
// Function to get the starting date from the user
function get_starting_date() {
    return new Promise((resolve, reject) => {
        // Create input field for start date using type="date"
        let firstTimeDate = document.getElementById("first-time-date");
        firstTimeDate.style.display = 'block';
        firstTimeDate.innerHTML = `
            <h2>No stored timetable data found. Please select a start date for your timetable:</h2><br>
            <input type="date" id="start-date" min="1970-01-01" max="${new Date().toISOString().split('T')[0]}">
            <button id="submit-date">Submit</button>
        `;
        const submitButton = document.getElementById("submit-date");
        submitButton.addEventListener("click", () => {
            const dateInput = document.getElementById("start-date").value;
            if (!dateInput) {
                alert('Please select a valid date.');
                reject("No date selected");
                return;
            }
            firstTimeDate.innerHTML = '';
            firstTimeDate.style.display = 'none';
            resolve(dateInput);
        });
    });
}
function adjustToPreviousMonday(date) {
    alert('Inputted date is NOT a Monday,adjusting starting date to previous Monday');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysSincePreviousMonday = (dayOfWeek + 6) % 7 || 0; // Calculate days since previous Monday
    date.setDate(date.getDate() - daysSincePreviousMonday); // Adjust the date to the previous Monday
    return date;
}
async function createWeeklyTables(containerId,timetable) {
    let weekDate;
    if(!timetable){ 
    timetable = [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
    ];
    //remove_first();
    /*
    let dateInput = prompt("Enter the start date in DD/MM/YYYY format : ");
    if (!isValidDate(dateInput)) return;
    */
    // Get the starting date from the user
    try {
        const dateInput = await get_starting_date(); // Wait for the user to select a date
        if (!dateInput) return; // Exit if no date is selected
        weekDate = new Date(dateInput);
        if (weekDate.getDay() !== 1) {    weekDate = adjustToPreviousMonday(weekDate);}
        remove_first();
    } catch (error) {
        alert("Error getting starting date:", error);
        return;
    }
    } else {
        weekDate = new Date(findNextMonday());
        weekDate.setDate(weekDate.getDate() + 2);
    }
    const weekSection = document.createElement("tbody");
    weekSection.className = "table-section";
    const isFirstSection = document.getElementById(containerId).children.length === 0;
    weekSection.style.marginTop = isFirstSection ? "0px" : "50px";
    // Create header row
    const headerRow = document.createElement("tr");
    headerRow.className = "week-header-row";
    const headerDate = document.createElement("th");
    headerDate.textContent = "Date";
    headerRow.appendChild(headerDate);
    const headerDay = document.createElement("th");
    headerDay.textContent = "Day";
    headerRow.appendChild(headerDay);
    
    for (let i = 1; i <= 8; i++) {
        const headerPeriod = document.createElement("th");
        headerPeriod.textContent = `${i}`;
        headerRow.appendChild(headerPeriod);
    }
    const allDay = document.createElement("th");
    allDay.textContent = "All";
    headerRow.appendChild(allDay);
    const deletetheDay = document.createElement("th");
    deletetheDay.textContent = "Delete";
    headerRow.appendChild(deletetheDay);
    weekSection.appendChild(headerRow);
    // Create rows for each day of the week
    for (let i = 0; i < timetable.length; i++) {
        const dayRow = document.createElement("tr");
        dayRow.className = "week-row";
        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(weekDate);
        dateCell.className = "date-cell";
        dayRow.appendChild(dateCell);
        const dayCell = document.createElement("td");
        dayCell.textContent = daysOfWeek[i];
        dayCell.className = "day-cell";
        dayRow.appendChild(dayCell);
        for (let j = 0; j < 8; j++) {
            const periodCell = document.createElement("td");
            periodCell.className = "period";
            periodCell.textContent = `${timetable[i][j]}`;
            periodCell.onclick = () => showPeriodMenu(periodCell);
            dayRow.appendChild(periodCell);
        }
        const allCell = document.createElement("td");
        allCell.innerHTML = '<button onclick="showAllDayMenu(this)" class="all-btn">All</button>';
        dayRow.appendChild(allCell);
        const deleteCell = document.createElement("td");
        deleteCell.innerHTML = `<button class="del-btn" onclick="deleteDay(this)">Delete</button>`;
        dayRow.appendChild(deleteCell);
        weekSection.appendChild(dayRow);
        weekDate.setDate(weekDate.getDate() + 1);
    }
    document.getElementById(containerId).appendChild(weekSection);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "week-buttons";
    // Create the two buttons
    const button1 = document.createElement("button");
    button1.textContent = "All Week";
    button1.className = "all-week-btn";
    button1.onclick = function() {    showAllWeekMenu(button1, weekSection);};
    
    const button2 = document.createElement("button");
    button2.textContent = "Delete Week";
    button2.className = "delete-week-btn";
    button2.onclick = function() {    deleteAllWeek(weekSection)};
    // Add buttons to the container
    buttonContainer.appendChild(button1);
    buttonContainer.appendChild(button2);
    // Insert the button container to the week table
    weekSection.insertBefore(buttonContainer,weekSection.firstChild);
}
function addtodeleted(key,value){
    let c_list = {};
    if(!localStorage.getItem(`${b} Deleted`))
        localStorage.setItem(`${b} Deleted`,JSON.stringify(c_list));
    c_list = JSON.parse(localStorage.getItem(`${b} Deleted`));
    c_list[key] = value;
    localStorage.setItem(`${b} Deleted`,JSON.stringify(c_list));
}
function showAllWeekMenu(button, weekTable) {
    // Remove any existing menus
    // Create a new menu
    const menu = document.createElement("div");
    menu.className = "all-menu";
    menu.innerHTML = `
        <h3>Mark All Week</h3>
        <label><input type="radio" name="all-Attendance" value="Present"> Present</label>
        <label><input type="radio" name="all-Attendance" value="Absent"> Absent</label>
        <label><input type="radio" name="all-Attendance" value="no-class">Class cancelled</label>
        <label><input type="radio" name="all-Attendance" value="remove"> Remove current status</label>
        <button class="ok-button">OK</button>
        <button class="cancel-button">Cancel</button>
    `;
    // Use fixed positioning to anchor the dropdown near the button, adjusted to the viewport
    showMenu(button, menu);
    // Append the menu to the document
    document.body.appendChild(menu);
    const okButton = menu.querySelector(".ok-button");
    // On OK button click, apply the selected status to all periods in the weekTable
    okButton.addEventListener("click", () => {
        const selectedStatus = menu.querySelector('input[name="all-Attendance"]:checked')?.value;
        if (!selectedStatus) return;
        // Loop through each day (row) of the weekTable and apply the status
        // Loop through each row in weekTable with class "week-row"
        weekTable.querySelectorAll(".week-row").forEach(row => {
            // Select all cells with class "period" within the current row
            row.querySelectorAll(".period").forEach(periodCell => {
                // Remove existing status classes
                periodCell.classList.remove("Present", "Absent", "no-class");
                if (selectedStatus !== "remove") {
                    if(periodCell.textContent.trim())    periodCell.classList.add(selectedStatus);
                }
            });
        });
        menu.remove();
    });
    const cancelButton = menu.querySelector(".cancel-button");
    cancelButton.addEventListener("click", () => {
        menu.remove(); // Simply close the menu without any action
    });
}
function deleteAllWeek(weekTable) {
    // Get the first and last dates of the week from the table
    const firstDateCell = weekTable.querySelector("td:first-child"); // First cell (first day of the week)
    const lastDayRow = weekTable.querySelectorAll("tr")[weekTable.rows.length - 1];
    const lastDateCell = lastDayRow.querySelector("td:first-child"); // First cell (last day of the week)
    // Format the dates as needed
    const startDate = firstDateCell ? firstDateCell.textContent.trim() : "Unknown";
    const endDate = lastDateCell ? lastDateCell.textContent.trim() : "Unknown";
    /*
    let weekTables = document.querySelectorAll(".table-section");
    if (weekTable === weekTables[weekTables.length - 1])    alert("This is the last weektable on the page!!");
    */
    
    // Ask for confirmation with the starting and ending dates of the week
    let askbeforedelete = confirm(`Are you sure you want to delete the entire week's Attendance from ${startDate} to ${endDate}?`);
    if (!askbeforedelete) return;
    // Remove the entire week table from the DOM
    
    //console.log(weekTable);
    addtodeleted(`${startDate} - ${endDate}`,convertWeekToStatus(weekTable));
    weekTable.remove(); // This removes the entire table
    check_out();
}
// Add event listener to document to detect 'Enter' key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const attendanceMenu = document.querySelector('.Attendance-menu');
        const allMenu = document.querySelector('.all-menu');
        if (attendanceMenu || allMenu) {
            const okButton = (attendanceMenu || allMenu).querySelector('.ok-button');
            okButton.click();
        }
    }
});
function showPeriodMenu(cell) {
    const menu = document.createElement("div");
    menu.className = "Attendance-menu";
    menu.innerHTML = `
        <input type="text" class="period-name-input" placeholder="Change period name" value="${cell.textContent}">
        <br>
        <label><input type="radio" name="Attendance" value="Present"> Present</label>
        <label><input type="radio" name="Attendance" value="Absent"> Absent</label>
        <label><input type="radio" name="Attendance" value="no-class"> Class cancelled</label>
        <label><input type="radio" name="Attendance" value="remove"> Remove current status</label>
        <button class="ok-button">OK</button>
        <button class="cancel-button">Cancel</button>
    `;
    showMenu(cell, menu);
    const okButton = menu.querySelector(".ok-button");
    const periodNameInput = menu.querySelector(".period-name-input");
    periodNameInput.focus();
    okButton.addEventListener("click", () => {
        const selectedStatus = menu.querySelector('input[name="Attendance"]:checked')?.value;
        const newPeriodName = periodNameInput.value.trim();
        // If the period name is not empty
        if (newPeriodName) {
            // Handle selected status
            if (selectedStatus) {
                if (selectedStatus === "remove") {
                    // Remove the previous status and exit
                    cell.classList.remove("Present", "Absent", "no-class");
                    menu.remove();
                    return;
                } else {
                    // Remove any previous status and set the new one
                    cell.classList.remove("Present", "Absent", "no-class");
                    cell.classList.add(selectedStatus);
                }
            } else {
                // If no status selected, retain previous status (if any)
            }
            
        } else {
            // If the name is empty, check for status
            if (selectedStatus) {
                // Alert and exit if any status is selected when name is empty
                alert("Period name cannot be empty while assigning a status!");
                cell.textContent = newPeriodName;
                //remove any previous status
                if (cell.classList.contains("Present") || cell.classList.contains("Absent") || cell.classList.contains("no-class")) cell.classList.remove("Present", "Absent", "no-class");
                menu.remove();
                return;
            } else {
                // No name and no status, remove previous status if any
                if (cell.classList.contains("Present") || cell.classList.contains("Absent") || cell.classList.contains("no-class")) {
                    alert("Period name is empty, removing previous status!");
                    cell.classList.remove("Present", "Absent", "no-class");
                }
            }
        }
        // Set the new period name
        cell.textContent = newPeriodName;
        displaySubjects();
        menu.remove(); // Close the menu
    });
    const cancelButton = menu.querySelector(".cancel-button");
    cancelButton.addEventListener("click", () => {
        menu.remove(); // Simply close the menu without any action
    });
}
function showAllDayMenu(cell) {
    // Remove any existing menus
    // Create a new menu
    const menu = document.createElement("div");
    menu.className = "all-menu";
    menu.innerHTML = `
        <h3>Mark All</h3>
        <label><input type="radio" name="all-Attendance" value="Present"> Present</label>
        <label><input type="radio" name="all-Attendance" value="Absent"> Absent</label>
        <label><input type="radio" name="all-Attendance" value="no-class">Class cancelled</label>
        <label><input type="radio" name="all-Attendance" value="remove"> Remove current status</label>
        <button class="ok-button">OK</button>
        <button class="cancel-button">Cancel</button>
    `;
    // Use fixed positioning to anchor the dropdown near the cell, adjusted to the viewport
    showMenu(cell, menu);
    // Append the menu to the document
    document.body.appendChild(menu);
    const okButton = menu.querySelector(".ok-button");
    // On OK button click, apply the selected status to all period cells with class "period" in the row
    okButton.addEventListener("click", () => {
        const selectedStatus = menu.querySelector('input[name="all-Attendance"]:checked')?.value;
        if (!selectedStatus) return;
        const row = cell.closest("tr");
        row.querySelectorAll("td.period").forEach((periodCell) => {
            // Only apply status if the cell has content, indicating an active period
            if (periodCell.textContent.trim() !== "") {
                periodCell.classList.remove("Present", "Absent", "no-class");
                if (selectedStatus !== "remove") {
                    periodCell.classList.add(selectedStatus);
                }
            }
        });
        menu.remove();
    });
    const cancelButton = menu.querySelector(".cancel-button");
    cancelButton.addEventListener("click", () => {
        menu.remove(); // Simply close the menu without any action
    });
}
function deleteDay(cell) {
    let row = cell.closest('.week-row');
    let date = row.querySelector('.date-cell').textContent;
    let day = row.querySelector('.day-cell').textContent;
    let askbeforedelete = confirm(`Are you sure you want to delete Attendance of date ${date} (${day})?`);
    if(!askbeforedelete)    return;
    let rows = row.closest(".table-section");    
    addtodeleted(`${date}`,convertRowToStatus(row));
    row.remove();
    if(!rows.querySelectorAll(".week-row").length){
        rows.remove();
        check_out();
    }
}
function showMenu(button, menu) {
    // Remove any existing menus
    document.querySelectorAll(".all-menu").forEach(existingMenu => existingMenu.remove());
    document.querySelectorAll(".Attendance-menu").forEach(menu => menu.remove());
    // Position the menu relative to the button
    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    // Set initial positioning based on button location
    menu.style.position = "absolute";
    menu.style.left = `${buttonRect.left + window.scrollX}px`;
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    // Adjust if menu extends beyond the viewport on the right
    if (buttonRect.left + menuRect.width > window.innerWidth) {
        menu.style.left = `${buttonRect.right - menuRect.width + window.scrollX}px`;
    }
    // Adjust if menu extends beyond the viewport at the bottom
    if (buttonRect.bottom + menuRect.height > window.innerHeight) {
        menu.style.top = `${buttonRect.top - menuRect.height + window.scrollY}px`;
    }
    // Adjust if menu extends beyond the viewport on the left
    if (menu.offsetLeft < 0) {
        menu.style.left = "0px";
    }
    // Adjust if menu extends beyond the viewport at the top
    if (menu.offsetTop < 0) {
        menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    }
    // Append the menu to the document
    document.body.appendChild(menu);
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (!document.body.contains(button)) {
                menu.remove(); // Remove the menu if button is no longer in the DOM
                observer.disconnect(); // Stop observing once menu is removed
            }
        });
    });
    // Observe changes in the document to detect button removal
    observer.observe(document.body, { childList: true, subtree: true });
}
// Function to update Attendance based on the timetable
function updateAttendanceStats() {
    let subjectsAttendance = {};
    // Initialize the subjectsAttendance object with the dates array
    let all_subjects = displaySubjects();
    let attendance = document.getElementById("attendance-display-section");
    attendance.innerHTML = "";  // Clear previous attendance data
    attendance.style.visibility = "hidden";
    if(!all_subjects){
        alert("There are absolutely no subjects to display attendance of!");
        return;
    }
    attendance.style.visibility = "visible";
    all_subjects.forEach(subject => {
        subjectsAttendance[subject] = {
            Present: 0,
            Absent: 0,
            CancelledClass: 0,
            totalClasses: 0,
            Attendance: 0,
            dates: []  // Array to store date, period, and status details for each class
        };
    });
    let overallAttendance = {
        totalPresent: 0,
        totalAbsent: 0,
        totalCancelledClass: 0,
        totalClasses: 0,
        overallAttendancePercentage: 0
    };
    // Iterate over each table section (each week)
    document.querySelectorAll(".table-section").forEach(weekTable => {
        // Iterate over each row within the current week table
        weekTable.querySelectorAll(".week-row").forEach(row => {
            const date = row.querySelector(".date-cell").textContent.trim(); // The first cell contains the date
            const periodCells = Array.from(row.getElementsByClassName('period'));
            periodCells.forEach(cell => {
                const subject = cell.textContent.trim(); // The subject name
                if (!subject) return;  // If there is no subject, skip
                
                const period = periodCells.indexOf(cell) + 1;  // Period number (1-based)
                // Capture the status of the period: Present, Absent, or Cancelled
                let status = "";
                if (cell.classList.contains("Present")) {
                    status = "Present";
                    subjectsAttendance[subject].Present++;
                    overallAttendance.totalPresent++;
                    subjectsAttendance[subject].totalClasses++; // Only add to total classes if it's Present
                    overallAttendance.totalClasses++;
                } else if (cell.classList.contains("Absent")) {
                    status = "Absent";
                    subjectsAttendance[subject].Absent++;
                    overallAttendance.totalAbsent++;
                    subjectsAttendance[subject].totalClasses++; // Only add to total classes if it's Absent
                    overallAttendance.totalClasses++;
                } else if (cell.classList.contains("no-class")) {
                    status = "no-class";
                    subjectsAttendance[subject].CancelledClass++;
                    overallAttendance.totalCancelledClass++;
                    subjectsAttendance[subject].totalClasses++; // Only add to total classes if it's Absent
                    overallAttendance.totalClasses++;
                }
                
                if (status) {
                    subjectsAttendance[subject].dates.push({
                        date: date,
                        period: period,
                        status: status
                    });
                }            
            });
        });
    });
    // Calculate the attendance percentage for each subject
    for (let subject in subjectsAttendance) {
        let subjectData = subjectsAttendance[subject];
        if (subjectData.totalClasses > 0) {
            if(subjectData.Present + subjectData.Absent)    subjectData.Attendance = (subjectData.Present / (subjectData.Present + subjectData.Absent)) * 100;
        } else {
            subjectData.Attendance = 0;  // If there were no classes, attendance is 0%
        }
    }
    // Calculate overall Attendance percentage
    if (overallAttendance.totalClasses > 0) {
        if(overallAttendance.totalPresent + overallAttendance.totalAbsent)
        overallAttendance.overallAttendancePercentage = (overallAttendance.totalPresent / (overallAttendance.totalPresent + overallAttendance.totalAbsent)) * 100;
    } else {
        overallAttendance.overallAttendancePercentage = 0;  // If there were no classes, overall attendance is 0%
    }
    // Call display function (you can implement this to render the attendance data in HTML)
    displayAttendance(subjectsAttendance, overallAttendance);
}

// Function to display attendance data, taking subjectsAttendance and overallAttendance as parameters
function displayAttendance(subjectsAttendance, overallAttendance) {
    const attendanceDisplay = document.getElementById("attendance-display-section");
    attendanceDisplay.innerHTML = "";  // Clear previous attendance data
    attendanceDisplay.style.display = "block";
    attendanceDisplay.className = "attendance-display";
    // Create container for overall attendance summary and classes count
    const attendanceContainer = document.createElement("div");
    attendanceContainer.className = "attendance-container";
    // Check if no classes have been held at all
    if (overallAttendance.totalClasses === 0) {
        attendanceDisplay.style.backgroundColor = "gray";
        attendanceDisplay.innerHTML += `<h3>No classes held at all until now. Thus no attendance to be displayed.</h3>`;
        return;
    } else {
        attendanceContainer.innerHTML = `
            <h3>Overall Attendance Summary:</h3>
            <h3>Total Present: ${overallAttendance.totalPresent}</h3>
            <h3>Total Absent: ${overallAttendance.totalAbsent}</h3>
            <h3>Cancelled Classes: ${overallAttendance.totalCancelledClass}</h3>
            <h3>Total Classes (including cancelled classes): ${overallAttendance.totalClasses}</h3>
        `;
        if (overallAttendance.totalClasses === overallAttendance.totalCancelledClass) {
            attendanceContainer.style.backgroundColor = "gray";
            attendanceContainer.innerHTML += `<h3>All held classes are cancelled ones, hence no attendance to show.</h3>`;
            attendanceDisplay.appendChild(attendanceContainer);
            return;
        } else {
            attendanceContainer.innerHTML += `<h3>Overall Attendance (excluding cancelled classes): ${overallAttendance.overallAttendancePercentage.toFixed(5)}%</h3>`;
            // Add class based on overall attendance percentage
            if (overallAttendance.overallAttendancePercentage >= 75) {
                attendanceContainer.classList.add("high-attendance");
            } else if (overallAttendance.overallAttendancePercentage >= 60) {
                attendanceContainer.classList.add("medium-attendance");
            } else {
                attendanceContainer.classList.add("low-attendance");
            }
        }
    }
    // Append the overall attendance container to attendanceDisplay
    attendanceDisplay.appendChild(attendanceContainer);
    // Loop through each subject and display attendance details
    for (let subject in subjectsAttendance) {
        const subjectData = subjectsAttendance[subject];
        const subjectDisplay = document.createElement("div");
        subjectDisplay.className = "subject-attendance";
        if (subjectData.totalClasses === 0) {
            subjectDisplay.style.backgroundColor = "gray";
            subjectDisplay.innerHTML = `
                <h2>${subject}</h2>
                <h3>No classes held for "${subject}" until now.</h3>
            `;
        } else {
            subjectDisplay.innerHTML = `
                <h2>${subject}</h2>
                <h3>Present: ${subjectData.Present}</h3>
                <h3>Absent: ${subjectData.Absent}</h3>
                <h3>Cancelled Classes: ${subjectData.CancelledClass}</h3>
                <h3>Total Classes (including cancelled classes): ${subjectData.totalClasses}</h3>
            `;
            if (subjectData.totalClasses === subjectData.CancelledClass) {
                subjectDisplay.style.backgroundColor = "gray";
                subjectDisplay.innerHTML += `<h3>All held classes are cancelled ones, hence no attendance to show.</h3>`;
            } else {
                subjectDisplay.innerHTML += `<ul>`;
                for (let k = 0; k < subjectData.dates.length; k++) {
                    const dateEntry = subjectData.dates[k];
                    if(dateEntry.status === "no-class") subjectDisplay.innerHTML += `<li>${dateEntry.date} - Period ${dateEntry.period}: Class Cancelled</li>`;
                    else    subjectDisplay.innerHTML += `<li class="history">${dateEntry.date} - Period ${dateEntry.period}: ${dateEntry.status}</li>`;
                }
                subjectDisplay.innerHTML += `</ul>`;
                subjectDisplay.innerHTML += `<h3>Overall Attendance (excluding cancelled classes): ${subjectData.Attendance.toFixed(5)}%</h3>`;
                // Add class based on subject attendance percentage
                if (subjectData.Attendance >= 75) {
                    subjectDisplay.classList.add("high-attendance");
                } else if (subjectData.Attendance >= 60) {
                    subjectDisplay.classList.add("medium-attendance");
                } else {
                    subjectDisplay.classList.add("low-attendance");
                }
            }
        }
        attendanceDisplay.appendChild(subjectDisplay);
    }
}
function convertWeekTablesToStatus() {
    const status_timetable = [];
    // Select all week tables with the class "table-section"
    const weekTables = document.querySelectorAll(".table-section");
    if (weekTables.length === 0) return null;
    // Iterate over each week table
    weekTables.forEach((weekTable) => {
        // Convert the week table to its status representation
        const weekData = convertWeekToStatus(weekTable);
        status_timetable.push(weekData);
    });
    return status_timetable;
}
function convertWeekToStatus(weekTable) {
    const weekData = []; // Store the week's data here
    // Select each row in the week with the class "week-row"
    const rows = weekTable.querySelectorAll(".week-row");
    rows.forEach((row) => {
        // Convert the row to its status representation
        const rowData = convertRowToStatus(row);
        weekData.push(rowData);
    });
    return weekData;
}
function convertRowToStatus(row) {
    const rowData = []; // Store row (day) data
    // Select date cell and day cell
    const dateCell = row.querySelector(".date-cell");
    const dayCell = row.querySelector(".day-cell");
    // Add date and day to the rowData
    rowData.push(dateCell ? dateCell.textContent.trim() : ""); // Date
    rowData.push(dayCell ? dayCell.textContent.trim() : "");   // Day
    // Iterate over each period cell in the row with class "period"
    const periodCells = row.querySelectorAll(".period");
    periodCells.forEach((periodCell) => {
        const periodName = periodCell.textContent.trim(); // Get subject name from text content
        let periodStatus = ""; // Default to "no-class"
        // Determine the attendance status based on the class name
        if (periodCell.classList.contains("Present")) {
            periodStatus = "present";
        } else if (periodCell.classList.contains("Absent")) {
            periodStatus = "absent";
        } else if (periodCell.classList.contains("no-class")) {
            periodStatus = "no-class";
        }
        rowData.push({ [periodName]: periodStatus });   
        // periodName must be enclosed in [] otherwise will lead to errors
    });
    return rowData;
}
function SaveData(){
    let user = convertWeekTablesToStatus();
    //if(Array.isArray(user) && user.length === 0)   return;
    let t = JSON.stringify(user);
    localStorage.setItem(`${b}`,t);
    alert("Data succesfully saved!");
}
function RetrieveData(){
    let w = localStorage.getItem(`${b}`);
    let u = JSON.parse(w)
    return u;
}
// Function to retrieve and display the stored timetable data
function loadStoredTimetable() {
    // Step 1: Retrieve stored timetable data
    let status_timetable = RetrieveData(); // Ensure RetrieveData() returns the correct data structure
    const tableContainer = document.getElementById("table-container");
    // Step 1: Retrieve stored timetable data
    if (!status_timetable || status_timetable.length === 0) {
        first();
        return;
    }
    
    // Optional: Clear existing tables before loading (uncomment if needed)
    // tableContainer.innerHTML = "";
    // Step 2: Iterate through each week in the timetable
    status_timetable.forEach((weekData, weekIndex) => {
        // Create a new week table
        createWeeklyTables("table-container",weekData);
        //console.log(`Latest TimeTable - ${TimeTable}`);
        // Select the last created week table
        const weekTables = tableContainer.querySelectorAll(".table-section");
        const weekTable = weekTables[weekTables.length - 1];
        
        // Select all week rows within this week table
        const rows = weekTable.querySelectorAll(".week-row");
        
        // Step 3: Populate each day in the week
        weekData.forEach((dayData, dayIndex) => {
            const row = rows[dayIndex];
            const dateCell = row.querySelector(".date-cell");
            const dayCell = row.querySelector(".day-cell");
            const periodCells = row.querySelectorAll(".period");
            
            // Update date and day cells
            dateCell.textContent = dayData[0];
            dayCell.textContent = dayData[1];
            
            // Step 4: Populate each period in the day
            dayData.slice(2).forEach((periodObj, periodIndex) => {
                const periodName = Object.keys(periodObj)[0];
                const status = periodObj[periodName];
                
                const periodCell = periodCells[periodIndex];
                
                if (periodName) {
                    // Set the subject name
                    periodCell.textContent = periodName;
                    
                    // Remove any existing status classes
                    periodCell.classList.remove("Present", "Absent", "no-class");
                    
                    // Add the appropriate status class
                    if (status === "present") {
                        periodCell.classList.add("Present");
                    } else if (status === "absent") {
                        periodCell.classList.add("Absent");
                    } else if (status === "no-class") {
                        periodCell.classList.add("no-class");
                    }
                } else {
                    // If no subject name, clear the cell
                    periodCell.textContent = "";
                    periodCell.classList.remove("Present", "Absent", "no-class");
                }
            });
        });
    });
    displaySubjects();
}
function downloadAsJSON() {
    status_timetable = convertWeekTablesToStatus();
    if(Array.isArray(status_timetable) && status_timetable.length === 0)   return;
    SaveData();
    // Convert status_timetable to JSON string
    const jsonString = JSON.stringify(status_timetable,null,4);
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: "application/json" });
    // Create a download link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.json"; // Set the file name
    // Trigger the download
    link.click();
    // Clean up the URL object
    URL.revokeObjectURL(link.href);
}
function updateSubjectsInTimetable() {
    const updated_timetable = [[], [], [], [], []];  // Create an empty list with 5 sub-lists for each day
    
    // Select all week tables with the class "table-section"
    const weekTables = document.querySelectorAll(".table-section");
    if (weekTables.length === 0) {
        return null;
    }
    // Iterate over each week table
    weekTables.forEach((weekTable) => {
        // Select each row in the week with the class "week-row"
        const rows = weekTable.querySelectorAll(".week-row");
        rows.forEach((row) => {
            // Select the day cell (we assume the days are in the second column of each row)
            const dayCell = row.querySelector(".day-cell");
            if (!dayCell) return;  // Skip rows without a valid day cell
            
            const day = dayCell.textContent.trim();  // Get day and standardize to lowercase
            
            // Get all subject cells in the row (excluding date and day)
            const subjectCells = row.querySelectorAll(".period");
            let Subjects=[];
            // Map the subjects in the row to the respective day in updated_timetable
            subjectCells.forEach((subjectCell, index) => {
                const subjectName = subjectCell.textContent.trim();  // Extract subject name
                Subjects.push(subjectName);
            });
            if(day === "Monday")    updated_timetable[0] = Subjects;
            if(day === "Tuesday")    updated_timetable[1] = Subjects;
            if(day === "Wednesday")    updated_timetable[2] = Subjects;
            if(day === "Thursday")    updated_timetable[3] = Subjects;
            if(day === "Friday")    updated_timetable[4] = Subjects;
            });
        });
        for(let i = 0; i < updated_timetable.length; i++){
            if((updated_timetable[i]).length === 0)  updated_timetable[i] = ['','','','','','','',''];
        }
    return updated_timetable;
}
document.getElementById("file_input_always").addEventListener("change", function(event) {
    const tableContainer = document.getElementById("table-container");
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result); // Parse the content of the file as JSON
                status_timetable = data; // Assign the parsed data to the timetable variable
                localStorage.setItem(`${b}`,JSON.stringify(status_timetable));
                alert("Data retrieved successfully");
                tableContainer.innerHTML = ''; // Clear any existing content in the table container
                // You can now proceed to display the retrieved timetable or process it as needed
                document.getElementById("attendance-display-section").style.display = "none";
                loadStoredTimetable();
            } catch (error) {
                console.error('Error parsing the JSON file:', error);
                alert("Failed to parse the JSON file.");
            }
        };
        
        reader.onerror = function(error) {
            console.error('Error reading the file:', error);
            alert("There was a problem reading the file.");
        };
        
        reader.readAsText(file); // Read the file as text
    } else {
        alert("No file selected.");
    }
});
function hide(){
    //let weekTables = document.querySelectorAll(".table-section:not(:last-child)");
    let weekTables = document.querySelectorAll(".table-section");
    weekTables.forEach(weekTable => {
        if (checkifempty(weekTable)){
            weekTable.style.display = "none";
            return;
        }
        let rows = weekTable.querySelectorAll(".week-row");
        rows.forEach(row => {
            if (checkifempty(row)) row.style.display = "none";
        });
    });    
}
function restore(){
    let weekTables = document.querySelectorAll(".table-section");
    weekTables.forEach(weekTable => {
        if (weekTable.style.display === "none"){
            weekTable.style.display = "block";
            return;
        }
        let rows = weekTable.querySelectorAll(".week-row");
        rows.forEach(row => {
            if (row.style.display === "none") row.style.display = "block";
        });
    });    
}
function displaySubjects() {
    // Get unique period names
    let uniquePeriodNames = new Set(); // Use a Set to ensure uniqueness
    document.querySelectorAll('.period').forEach((cell) => {
        let periodName = cell.textContent.trim();
        if (periodName) uniquePeriodNames.add(periodName);
    });
    uniquePeriodNames = Array.from(uniquePeriodNames);
    let container = document.querySelector('#period-container');
    // Clear existing content in the container
    container.innerHTML = '';
    container.style.display = "none";
    if (uniquePeriodNames.length === 0) return;
    container.style.display = "block";
    // Add a title to the container
    let title = document.createElement('h3');
    title.textContent = 'Unique Period Names (Click to Edit)';
    container.appendChild(title);
    uniquePeriodNames.forEach((name) => {
        
        // Create an input field for each period name
        let inputElement = document.createElement('input');
        inputElement.value = name;
        //nameContainer.appendChild(inputElement);
        // Add event listener to handle input change
        inputElement.addEventListener('input', (event) => {
            let newName = event.target.value.trim();
            if (newName === name) return; // No update if value is the same
            // Update all period cells in the page
            document.querySelectorAll('.period').forEach((cell) => {
                // If the cell contains the old name, update it with the new name
                if (cell.textContent.trim() === name) {
                    cell.textContent = newName;
                }
            });
            // Update the original value in the list
            name = newName;
        });
        container.appendChild(inputElement);
    });
    return uniquePeriodNames;
}
