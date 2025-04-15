const firebaseConfig = {
    apiKey: "AIzaSyAnW7l5Bun9tFJSaZUpkOwWyWmZgs1ejf0",
    authDomain: "prajwal-s-self-attendance.firebaseapp.com",
    projectId: "prajwal-s-self-attendance",
    storageBucket: "prajwal-s-self-attendance.firebasestorage.app",
    messagingSenderId: "963412196516",
    appId: "1:963412196516:web:b2a7d74e6e1487b91c7a31",
    measurementId: "G-NGY734E26J"
};
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();
let main_user = null;
let uid = null;


let a = "College Attendance";
let b = "Semester 4";
const theme = document.getElementById("theme");
const imp = document.getElementById("lets-do-it");
const main_container = document.getElementById("table-container");
const add_week_btn = document.getElementById("add-week-btn");
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
let TimeTable = [
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '']
];

auth.onAuthStateChanged((user) => {
  const fts = document.getElementById("first-time-sign-in");
  if (user) {
    main_user = user.displayName;
    uid = user.uid;
    console.log("✅ Already signed in:", main_user);
    loadStoredTimetable(); 
  } else {
    console.log("👋 Not signed in. Triggering login...");
    main_container.innerHTML = "";
    add_week_btn.style.display = 'none';
    theme.style.display = 'none';
    imp.style.display = 'none';
    fts.style.display = "block";
    fts.innerHTML = `
      <p>❌ You are not signed in to the Self Attendance website. Please press the <strong>"Sign in"</strong> button.</p>
      <button id="loginBtn">Sign in with Google</button>
    `;

    document.getElementById("loginBtn").addEventListener("click", () => {
      auth.signInWithPopup(provider)
        .then((result) => {
          main_user = result.user.displayName;
          uid = result.user.uid;
          console.log("✅ Signed in:", main_user);
          fts.style.display = "none";
          loadStoredTimetable(); // Load data now that user is signed in
        })
        .catch((error) => {
          console.error("❌ Login failed:", error.message);
        });
    });
  }
});

function SaveData(datatobesaved) {
    if (!uid) {
        console.error("❌ No user is signed in!");
        return;
    }
    db.collection("users").doc(uid).set({
        timetableData: JSON.stringify(datatobesaved)
    })
    .then(() => {
        console.log("✅ Data saved successfully for user:", main_user);
        alert(`Data saved successfully for user ${main_user} !`);
    })
    .catch((error) => {
        console.error("❌ Error saving data:", error);
    });
}

async function RetrieveData() {
    if (!uid) {
        console.error("❌ No user is signed in!");
        return null;
    }
    try {
        const docRef = db.collection("users").doc(uid);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            const userretrive = docSnap.data().timetableData;
            console.log("✅ Data retrieved for user:", main_user);
            return JSON.parse(userretrive); 
        } else {
            console.log("❌ No data found for user:", main_user);
            return null;
        }
    } catch (error) {
        console.error("❌ Error retrieving data:", error);
        return null;
    }
}


//window.addEventListener('load', loadStoredTimetable);
//window.addEventListener('beforeunload',() => {SaveData(convertWeekTablesToStatus())});
//window.onbeforeunload = SaveData();

function first(){
    theme.style.display = 'none';
    imp.style.display = "none";

    let First = document.getElementById("first-time");
    First.style.display = 'block';
    First.innerHTML = `
        <h2>No stored timetable data found. Please select a JSON file where you might have stored your data</h2><br>
        <input type="file" id="file_input_on_first_spawn"><br><br>
        <h3>If you are setting up your Timetable for the first time, press the Add New Week button to start adding weeks!</h3>
    `;
    const fileInput = document.getElementById("file_input_on_first_spawn");
    fileInput.addEventListener("change", function(event) {
        const file = event.target.files[0];
        console.log("File 123458 has changed!");
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    status_timetable = data;
                    SaveData(status_timetable);
                    alert("Data retrieved successfully");
                    main_container.innerHTML = '';
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

function remove_first(){
    let First = document.getElementById("first-time");
    First.style.display = 'none';
    let firstTimeDate = document.getElementById("first-time-date");
    firstTimeDate.style.display = 'none';
    theme.style.display = 'block';
    theme.textContent = `${a} ${b}`;
    displaySubjects();
}

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

function get_starting_date() {
    return new Promise((resolve, reject) => {
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
            alert('Selected date is: ' + dateInput);
            firstTimeDate.innerHTML = '';
            firstTimeDate.style.display = 'none';
            
            resolve(dateInput);
        });
    });
}

function adjustToPreviousMonday(date) {
    alert('Inputted date is NOT a Monday,adjusting starting date to previous Monday');
    const dayOfWeek = date.getDay(); 
    const daysSincePreviousMonday = (dayOfWeek + 6) % 7 || 0; 
    date.setDate(date.getDate() - daysSincePreviousMonday); 
    return date;
}

function updateSubjectsInTimetable() {
    const updated_timetable = [[], [], [], [], []];  
    const weekTables = document.querySelectorAll(".table-section");
    if (weekTables.length === 0)    return null;
    weekTables.forEach((weekTable) => {
        const rows = weekTable.querySelectorAll(".week-row");
        rows.forEach((row) => {
            const dayCell = row.querySelector(".day-cell");
            if (!dayCell) return;  
            const day = dayCell.textContent.trim();  
            const subjectCells = row.querySelectorAll(".period");
            let Subjects=[];
            subjectCells.forEach((subjectCell, index) => {
                const subjectName = subjectCell.textContent.trim();  
                Subjects.push(subjectName);
            });
            if(day === "Monday")    updated_timetable[0] = Subjects;
            if(day === "Tuesday")    updated_timetable[1] = Subjects;
            if(day === "Wednesday")    updated_timetable[2] = Subjects;
            if(day === "Thursday")    updated_timetable[3] = Subjects;
            if(day === "Friday")    updated_timetable[4] = Subjects;
            });
        });
        for(let i = 0; i < updated_timetable.length; i++)    if((updated_timetable[i]).length === 0)  updated_timetable[i] = TimeTable[i];
    return updated_timetable;
}

async function createWeeklyTables(timetable) {
    let weekDate;
    if(!timetable){ 
    timetable = [
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '']
    ];

    try {
        const dateInput = await get_starting_date(); 
        if (!dateInput) return; 
        weekDate = new Date(dateInput);
        if (weekDate.getDay() !== 1) {    weekDate = adjustToPreviousMonday(weekDate);}
        remove_first();
        document.getElementById("first-time-date").style.display = "none";
        imp.style.display = "block";
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
    const isFirstSection = main_container.children.length === 0;
    weekSection.style.marginTop = isFirstSection ? "0px" : "50px";

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

    main_container.appendChild(weekSection);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "week-buttons";

    const button1 = document.createElement("button");
    button1.textContent = "All Week";
    button1.className = "all-week-btn";
    button1.onclick = function() {    showAllWeekMenu(button1, weekSection);};

    const button2 = document.createElement("button");
    button2.textContent = "Delete Week";
    button2.className = "delete-week-btn";
    button2.onclick = function() {    deleteAllWeek(weekSection)};

    buttonContainer.appendChild(button1);
    buttonContainer.appendChild(button2);

    weekSection.insertBefore(buttonContainer,weekSection.firstChild);
}

async function loadStoredTimetable() {
    // Step 1: Retrieve stored timetable data
    let status_timetable = await RetrieveData(); // Ensure RetrieveData() returns the correct data structure
    add_week_btn.style.display = 'block';
    main_container.innerHTML = ""; // Clear existing tables before loading
    // Step 1: Retrieve stored timetable data
    if (!status_timetable || status_timetable.length === 0) {
        first();
        return;
    }
    // Optional: Clear existing tables before loading (uncomment if needed)
    // main_container.innerHTML = "";
    // Step 2: Iterate through each week in the timetable
    status_timetable.forEach((weekData, weekIndex) => {
        // Create a new week table
        createWeeklyTables(weekData);
        //console.log(`Latest TimeTable - ${TimeTable}`);
        // Select the last created week table
        const weekTables = main_container.querySelectorAll(".table-section");
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
                    if (status === "Present") {
                        periodCell.classList.add("Present");
                    } else if (status === "Absent") {
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
    theme.textContent = `${a} ${b}`;
    theme.style.display = 'block';
    add_week_btn.style.display = "block";
    imp.style.display = "block";
    displaySubjects();
}

function displaySubjects() {

    let uniquePeriodNames = new Set(); 
    document.querySelectorAll('.period').forEach((cell) => {
        let periodName = cell.textContent.trim();
        if (periodName) uniquePeriodNames.add(periodName);
    });
    uniquePeriodNames = Array.from(uniquePeriodNames);
    let container = document.getElementById('period-container');

    container.innerHTML = '';
    container.style.visibility = "hidden";
    if (uniquePeriodNames.length === 0) return;
    container.style.visibility = "visible";

    let title = document.createElement('h3');
    title.textContent = 'Unique Period Names (Click to Edit)';
    container.appendChild(title);
    uniquePeriodNames.forEach((name) => {
        let nameContainer = document.createElement('div');

        let inputElement = document.createElement('input');
        inputElement.value = name;
        nameContainer.appendChild(inputElement);

        inputElement.addEventListener('input', (event) => {
            let newName = event.target.value.trim();
            if (newName === name) return; 

            document.querySelectorAll('.period').forEach((cell) => {

                if (cell.textContent.trim() === name) {
                    cell.textContent = newName;
                }
            });

            name = newName;
        });
        container.appendChild(nameContainer);
    });
    return uniquePeriodNames;
}

function updateAttendanceStats() {
    let subjectsAttendance = {};

    let all_subjects = displaySubjects();
    let attendance = document.getElementById("attendance-display-section");
    attendance.innerHTML = "";  
    attendance.style.visibility = "hidden";
    if(!all_subjects){
        alert("There are absolutely no subjects to display attendance of!");
        return;
    }
    attendance.style.display = "block";
    all_subjects.forEach(subject => {
        subjectsAttendance[subject] = {
            Present: 0,
            Absent: 0,
            CancelledClass: 0,
            totalClasses: 0,
            Attendance: 0,
            dates: []  
        };
    });
    let overallAttendance = {
        totalPresent: 0,
        totalAbsent: 0,
        totalCancelledClass: 0,
        totalClasses: 0,
        overallAttendancePercentage: 0
    };

    document.querySelectorAll(".table-section").forEach(weekTable => {

        weekTable.querySelectorAll(".week-row").forEach(row => {
            const date = row.querySelector(".date-cell").textContent.trim(); 
            const periodCells = Array.from(row.getElementsByClassName('period'));
            periodCells.forEach(cell => {
                const subject = cell.textContent.trim(); 
                if (!subject) return;  

                const period = periodCells.indexOf(cell) + 1;  

                let status = "";
                if (cell.classList.contains("Present")) {
                    status = "Present";
                    subjectsAttendance[subject].Present++;
                    overallAttendance.totalPresent++;
                    subjectsAttendance[subject].totalClasses++; 
                    overallAttendance.totalClasses++;
                } else if (cell.classList.contains("Absent")) {
                    status = "Absent";
                    subjectsAttendance[subject].Absent++;
                    overallAttendance.totalAbsent++;
                    subjectsAttendance[subject].totalClasses++; 
                    overallAttendance.totalClasses++;
                } else if (cell.classList.contains("no-class")) {
                    status = "no-class";
                    subjectsAttendance[subject].CancelledClass++;
                    overallAttendance.totalCancelledClass++;
                    subjectsAttendance[subject].totalClasses++; 
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

    for (let subject in subjectsAttendance) {
        let subjectData = subjectsAttendance[subject];
        if (subjectData.totalClasses > 0) {
            if(subjectData.Present + subjectData.Absent)    subjectData.Attendance = (subjectData.Present / (subjectData.Present + subjectData.Absent)) * 100;
        } else {
            subjectData.Attendance = 0;  
        }
    }

    if (overallAttendance.totalClasses > 0) {
        if(overallAttendance.totalPresent + overallAttendance.totalAbsent)
        overallAttendance.overallAttendancePercentage = (overallAttendance.totalPresent / (overallAttendance.totalPresent + overallAttendance.totalAbsent)) * 100;
    } else {
        overallAttendance.overallAttendancePercentage = 0;  
    }

    displayAttendance(subjectsAttendance, overallAttendance);
}

function displayAttendance(subjectsAttendance, overallAttendance) {
    const attendanceDisplay = document.getElementById("attendance-display-section");
    attendanceDisplay.innerHTML = "";  
    attendanceDisplay.style.visibility = "visible";
    attendanceDisplay.className = "attendance-display";

    const attendanceContainer = document.createElement("div");
    attendanceContainer.className = "attendance-container";

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

            if (overallAttendance.overallAttendancePercentage >= 75) {
                attendanceContainer.classList.add("high-attendance");
            } else if (overallAttendance.overallAttendancePercentage >= 60) {
                attendanceContainer.classList.add("medium-attendance");
            } else {
                attendanceContainer.classList.add("low-attendance");
            }
        }
    }

    attendanceDisplay.appendChild(attendanceContainer);

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

function showAllWeekMenu(button, weekTable) {

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

    showMenu(button, menu);

    document.body.appendChild(menu);
    menu.focus();
    const okButton = menu.querySelector(".ok-button");
    menu.addEventListener("keydown",function(e){    if(e.key === "Enter"){okButton.click();}})
    okButton.addEventListener("click", () => {
        const selectedStatus = menu.querySelector('input[name="all-Attendance"]:checked')?.value;
        if (!selectedStatus) return;

        weekTable.querySelectorAll(".week-row").forEach(row => {

            row.querySelectorAll(".period").forEach(periodCell => {

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
        menu.remove(); 
    });
}

function deleteAllWeek(weekTable) {

    const firstDateCell = weekTable.querySelector("td:first-child"); 
    const lastDayRow = weekTable.querySelectorAll("tr")[weekTable.rows.length - 1];
    const lastDateCell = lastDayRow.querySelector("td:first-child"); 

    const startDate = firstDateCell ? firstDateCell.textContent.trim() : "Unknown";
    const endDate = lastDateCell ? lastDateCell.textContent.trim() : "Unknown";

    let askbeforedelete = confirm(`Are you sure you want to delete the entire week's Attendance from ${startDate} to ${endDate}?`);
    if (!askbeforedelete) return;

    addtodeleted(`${startDate} - ${endDate}`,convertWeekToStatus(weekTable));
    weekTable.remove(); 
    displaySubjects();
    check_out();
}

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

    const periodNameInput = menu.querySelector(".period-name-input");
    const okButton = menu.querySelector(".ok-button");
    periodNameInput.focus();
    menu.addEventListener("keydown",function(e){    if(e.key === "Enter"){okButton.click();}})
    
    okButton.addEventListener("click", () => {
        const selectedStatus = menu.querySelector('input[name="Attendance"]:checked')?.value;
        const newPeriodName = periodNameInput.value.trim();

        if (newPeriodName) {

            if (selectedStatus) {
                if (selectedStatus === "remove") {

                    cell.classList.remove("Present", "Absent", "no-class");
                    cell.textContent = newPeriodName;
                    menu.remove();
                    return;
                } else {

                    cell.classList.remove("Present", "Absent", "no-class");
                    cell.classList.add(selectedStatus);
                }
            } else {

            }

        } else {
            if(selectedStatus === "remove"){
                menu.remove();
                return;
            }
            if (selectedStatus) {

                alert("Period name cannot be empty while assigning a status!");
                cell.textContent = newPeriodName;

                if (cell.classList.contains("Present") || cell.classList.contains("Absent") || cell.classList.contains("no-class")) cell.classList.remove("Present", "Absent", "no-class");
                menu.remove();
                return;
            } else {

                if (cell.classList.contains("Present") || cell.classList.contains("Absent") || cell.classList.contains("no-class")) {
                    alert("Period name is empty, removing previous status!");
                    cell.classList.remove("Present", "Absent", "no-class");
                }
            }
        }

        cell.textContent = newPeriodName;
        menu.remove(); 
        displaySubjects();
    });
    const cancelButton = menu.querySelector(".cancel-button");
    cancelButton.addEventListener("click", () => {
        menu.remove(); 
    });
}

function showAllDayMenu(cell) {

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

    showMenu(cell, menu);

    document.body.appendChild(menu);
    menu.focus();
    const okButton = menu.querySelector(".ok-button");
    menu.addEventListener("keydown",function(e){    if(e.key === "Enter"){okButton.click();}})

    okButton.addEventListener("click", () => {
        const selectedStatus = menu.querySelector('input[name="all-Attendance"]:checked')?.value;
        if (!selectedStatus) return;
        const row = cell.closest("tr");
        row.querySelectorAll("td.period").forEach((periodCell) => {

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
        menu.remove(); 
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
    displaySubjects();
    if(!rows.querySelectorAll(".week-row").length){
        rows.remove();
        check_out();
    }
}

function convertWeekTablesToStatus() {
    const status_timetable = [];

    const weekTables = document.querySelectorAll(".table-section");
    if (weekTables.length === 0) return null;

    weekTables.forEach((weekTable) => {

        const weekData = convertWeekToStatus(weekTable);
        status_timetable.push(weekData);
    });
    return status_timetable;
}

function convertWeekToStatus(weekTable) {
    const weekData = []; 

    const rows = weekTable.querySelectorAll(".week-row");
    rows.forEach((row) => {

        const rowData = convertRowToStatus(row);
        weekData.push(rowData);
    });
    return weekData;
}

function convertRowToStatus(row) {
    const rowData = []; 

    const dateCell = row.querySelector(".date-cell");
    const dayCell = row.querySelector(".day-cell");

    rowData.push(dateCell ? dateCell.textContent.trim() : ""); 
    rowData.push(dayCell ? dayCell.textContent.trim() : "");   

    const periodCells = row.querySelectorAll(".period");
    periodCells.forEach((periodCell) => {
        const periodName = periodCell.textContent.trim(); 
        let periodStatus = ""; 

        if (periodCell.classList.contains("Present")) {
            periodStatus = "Present";
        } else if (periodCell.classList.contains("Absent")) {
            periodStatus = "Absent";
        } else if (periodCell.classList.contains("no-class")) {
            periodStatus = "no-class";
        }
        rowData.push({ [periodName]: periodStatus });   

    });
    return rowData;
}

document.getElementById("file_input_always").addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result); 
                status_timetable = data; 
                SaveData(status_timetable);
                alert("Data retrieved successfully");
                main_container.innerHTML = ''; 

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

        reader.readAsText(file); 
    } else {
        alert("No file selected.");
    }
});

function downloadAsJSON() {
    status_timetable = convertWeekTablesToStatus();
    if(Array.isArray(status_timetable) && status_timetable.length === 0)   return;
    //SaveData(status_timetable);

    const jsonString = JSON.stringify(status_timetable,null,4);

    const blob = new Blob([jsonString], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.json"; 

    link.click();

    URL.revokeObjectURL(link.href);
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0'); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear(); 
    return `${day}/${month}/${year}`; 
}

function check_out(){
    let weeks = document.querySelectorAll(".table-section");
    if(weeks.length === 0) {
        first();
    }
}
function showMenu(button, menu) {

    document.querySelectorAll(".all-menu").forEach(existingMenu => existingMenu.remove());
    document.querySelectorAll(".Attendance-menu").forEach(menu => menu.remove());

    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    menu.style.position = "absolute";
    menu.style.left = `${buttonRect.left + window.scrollX}px`;
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;

    if (buttonRect.left + menuRect.width > window.innerWidth) {
        menu.style.left = `${buttonRect.right - menuRect.width + window.scrollX}px`;
    }

    if (buttonRect.bottom + menuRect.height > window.innerHeight) {
        menu.style.top = `${buttonRect.top - menuRect.height + window.scrollY}px`;
    }

    if (menu.offsetLeft < 0) {
        menu.style.left = "0px";
    }

    if (menu.offsetTop < 0) {
        menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    }

    document.body.appendChild(menu);
    
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (!document.body.contains(button)) {
                menu.remove(); 
                observer.disconnect(); 
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function scrollToButtonWithOffset(button) {
    const buttonPosition = button.getBoundingClientRect().top + window.scrollY;
    const offset = 123; 
    window.scrollTo({
        top: buttonPosition - window.innerHeight + offset,
        behavior: 'instant'
    });
}

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

function hide(){

    let weekTables = document.querySelectorAll(".table-section");
    weekTables.forEach(weekTable => {
        if (checkifempty(weekTable)){
            weekTable.style.visibility = "hidden";
            return;
        }
        let rows = weekTable.querySelectorAll(".week-row");
        rows.forEach(row => {
            if (checkifempty(row)) row.style.visibility = "hidden";
        });
    });    
}

function restore(){
    let weekTables = document.querySelectorAll(".table-section");
    weekTables.forEach(weekTable => {
        if (weekTable.style.visibility === "hidden"){
            weekTable.style.visibility = "visible";
            return;
        }
        let rows = weekTable.querySelectorAll(".week-row");
        rows.forEach(row => {
            if (row.style.visibility === "hidden") row.style.visibility = "visible";
        });
    });    
}

function addtodeleted(key,value){
    let c_list = {};
    if(!localStorage.getItem(`${b} Deleted`))
        localStorage.setItem(`${b} Deleted`,JSON.stringify(c_list));
    c_list = JSON.parse(localStorage.getItem(`${b} Deleted`));
    c_list[key] = value;
    localStorage.setItem(`${b} Deleted`,JSON.stringify(c_list));
}


