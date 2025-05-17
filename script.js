const firebaseConfig = {
    apiKey: 'AIzaSyAnW7l5Bun9tFJSaZUpkOwWyWmZgs1ejf0',
    authDomain: 'prajwal-s-self-attendance.firebaseapp.com',
    projectId: 'prajwal-s-self-attendance',
    storageBucket: 'prajwal-s-self-attendance.firebasestorage.app',
    messagingSenderId: '963412196516',
    appId: '1:963412196516:web:b2a7d74e6e1487b91c7a31',
    measurementId: 'G-NGY734E26J'
};
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();

const theme_in_html = document.getElementById('theme');
const nav = document.getElementById('navbar');
const imp = document.getElementById('lets-do-it');
const main_container = document.getElementById('table-container');
const most_imp = document.getElementById('most_important');
const dropdown = document.getElementById('themeDropdown');
const latestTimetable = document.getElementById('latest-timetable');
const First = document.getElementById('first-time');
const change_date = document.getElementById("first-time-date");
let latestTimetableData = [
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '']
];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let main_status_timetable = null;
function login() {
    auth.signInWithPopup(provider)
    .then((result) => {
        main_user = result.user.displayName;
        uid = result.user.uid;
        alert(`✅ Signed in: ${main_user}`);
        dropdown.innerHTML = `
        <option value=''>Select a theme...</option>
        `;
        fts.style.display = 'none';
        loadStoredTimetable(); // Load data now that user is signed in
    })
    .catch((error) => {
        alert(`❌ Login failed: ${error.message}`);
    });
}
auth.onAuthStateChanged((user) => {
  if (user) {
    main_user = user.displayName;
    uid = user.uid;
    console.log('✅ Already signed in:', main_user);
    loadStoredTimetable();
  } else {
    console.log('👋 Not signed in. Triggering login...');
    main_container.innerHTML = '';
    //theme_in_html.textContent = '';
    most_imp.style.display = 'none';
    resetlatest();
    dropdown.style.display = 'none';
    dropdown.innerHTML = `
    <option value=''>Select a theme...</option>
    `;
    nav.style.display = 'none';
    imp.style.display = 'none';
    fts.style.display = 'block';
  }
});

let main_user = null;
let uid = null;
let main_theme = null;
let list_of_themes = new Set();
let list_of_deleted = new Set();
const fts = document.getElementById('first-time-sign-in');
const checkbox = document.getElementById('myCheckbox');
const input = document.getElementById('cpn');
const statusSelect = document.getElementById('status');
let selectedStatus = document.querySelector('input[name="status"]:checked')?.value;
const radios = document.querySelectorAll("input[name='status']");
const customevent = new CustomEvent('radioChange');
const attendance = document.getElementById('attendance-display-section');
const attbtn = document.getElementById('attendance-btn');

radios.forEach(radio => {
  radio.addEventListener('change', function () {
    selectedStatus = document.querySelector('input[name="status"]:checked')?.value;
    //console.log('Selected option:', selectedStatus);
    document.dispatchEvent(customevent);
  });
});

let renameHandler = function(e) {
    if (e.target.closest('.period')) {
        let periodCell = e.target.closest('.period');
        let newName = input.value.trim();

        // Disable editing and set the name
        periodCell.contentEditable = false;
        periodCell.textContent = newName.toUpperCase(); // Set the new name in uppercase

        // If empty, remove status classes
        if (newName === '')    periodCell.classList.remove('Present', 'Absent', 'no-class');
        updateAttendanceStats(); // Update attendance stats after renaming
    }
};

let clickHandler = function(e) {
    let periodCell = e.target.closest('.period');
    let allbtn = e.target.closest('.all-cell');
    let allweekbtn = e.target.closest('.all-week-btn');
    if (periodCell) {
        periodCell.classList.remove('Present', 'Absent', 'no-class');
        if(!periodCell.textContent.trim()) return; // Ignore empty cells
        if (selectedStatus === 'remove') return;
        periodCell.classList.add(selectedStatus);
        updateAttendanceStats(); // Update attendance stats after clicking
    }
    else if(allbtn){
        const row = allbtn.closest('.week-row');
        row.querySelectorAll('.period').forEach((periodCell) => {
            if (periodCell.textContent.trim() !== '') {
                periodCell.classList.remove('Present', 'Absent', 'no-class');
                if (selectedStatus !== 'remove')    periodCell.classList.add(selectedStatus);
            }
        });
        updateAttendanceStats(); // Update attendance stats after clicking
    }
    else if(allweekbtn){
        const table = allweekbtn.closest('.table-section');
        table.querySelectorAll('.period').forEach((periodCell) => {
            if (periodCell.textContent.trim() !== '') {
                periodCell.classList.remove('Present', 'Absent', 'no-class');
                if (selectedStatus !== 'remove')    periodCell.classList.add(selectedStatus);
            }
        });
        updateAttendanceStats(); // Update attendance stats after clicking
    }
};

checkbox.addEventListener('change', () => {
    //document.querySelector("input[value='']").checked = true;
    // Reset the status select when checkbox is checked/unchecked
    document.querySelector('input[name="status"][value=""]').click();

    const periodCells = document.querySelectorAll('.period');
    let allCells = document.querySelectorAll('.all-cell');
    let allweekcells = document.querySelectorAll('.all-week-btn');
    allCells.forEach(cell => cell.style.display = 'none');
    allweekcells.forEach(cell => cell.style.display = 'none');

    document.removeEventListener('click', clickHandler); // Remove click handler
    const isChecked = checkbox.checked;
    input.disabled = !isChecked;
    input.value = ''; // Clear the input field when checkbox is checked/unchecked

    if (isChecked) {
        input.focus();
        // Disable editing and attach the handler
        periodCells.forEach(cell => cell.contentEditable = false);
        document.addEventListener('click', renameHandler);
    } else {
        // Enable editing and remove the handler
        periodCells.forEach(cell => cell.contentEditable = true);
        document.removeEventListener('click', renameHandler);
    }
});
document.addEventListener('radioChange', () => {
    checkbox.checked = false; // Uncheck the checkbox when status changes
    input.disabled = true; // Disable the input field
    input.value = ''; // Clear the input field when status changes
    document.removeEventListener('click', renameHandler); // Remove rename handler
    selectedStatus = document.querySelector("input[name='status']:checked").value;
    
    const periodCells = document.querySelectorAll('.period');
    let allCells = document.querySelectorAll('.all-cell');
    let allweekcells = document.querySelectorAll('.all-week-btn');

    if (selectedStatus === '') {
        // Enable contentEditable and remove event listener
        periodCells.forEach(cell => cell.contentEditable = true);
        allCells.forEach(cell => cell.style.display = 'none');
        allweekcells.forEach(cell => cell.style.display = 'none');
        document.removeEventListener('click', clickHandler);
    } else {
        // Disable contentEditable and add click handler
        periodCells.forEach(cell => cell.contentEditable = false);
        allCells.forEach(cell =>    cell.style.display = '');
        allweekcells.forEach(cell =>    cell.style.display = '');
        document.removeEventListener('click', clickHandler); // Remove if already added
        document.addEventListener('click', clickHandler);
    }
});

function SaveData(datatobesaved) {
    if (!uid) {
        console.error('❌ No user is signed in!');
        return;
    }
    if(!main_theme){
        main_theme = prompt('Please enter a theme name for your timetable:');
    } // Set default theme if not set
    if(!main_theme || main_theme.trim() === ''){
        alert('No theme name provided. Data will not be saved.');
        return;
    } // Set default theme if not set
    theme_in_html.textContent = main_theme;
    list_of_themes.add(main_theme);
    validateAndTruncatethemes(list_of_themes);
    if(list_of_themes){
        dropdown.innerHTML = `
        <option value=''>Select a theme...</option>
        `;
        dropdown.style.display = 'block';
        list_of_themes.forEach((theme) => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme;
            dropdown.appendChild(option);
        });
    }
    list_of_themes = validateAndTruncateThemes(list_of_themes);
    validateAndTruncateData(datatobesaved);
    db.collection('users').doc(uid).set({
        theme : main_theme,
        [`${main_theme} timetableData`]: JSON.stringify(datatobesaved),
        [`${main_theme} latest_timetable`]: JSON.stringify(convertlatestTo2DArray()),
        all_themes : Array.from(list_of_themes)
    }, { merge: true })
    .then(() => {
        console.log('✅ Data saved successfully for user:', main_user);
        alert(`Data saved successfully for user ${main_user} !`);
        loadStoredTimetable();
    })
    .catch((error) => {
        console.error('❌ Error saving data:', error);
    });
}

async function RetrieveData() {
    if (!uid) {
        alert('❌ No user is signed in! Triggering sign in');
        login();
        return null;
    }
    try {
        const snap = await db.collection('users').doc(uid).get();
        const data = snap.data();
        if(!data){
            alert(`❌ No data found for user: ${main_user}. Seems like you are using our website for the first time.`);
            db.collection('users').doc(uid).set({}, { merge: true })
            return null;
        }
        list_of_themes = new Set(data.all_themes);
        if(list_of_themes){
            dropdown.innerHTML = `
            <option value=''>Select a theme...</option>
            `;
            dropdown.style.display = 'block';
            list_of_themes.forEach((theme) => {
                const option = document.createElement('option');
                option.value = theme;
                option.textContent = theme;
                dropdown.appendChild(option);
            });
        }
        main_theme = data.theme;
        if(!main_theme){
            alert(`❌ No current theme found for user: ${main_user}. Please save some data under a theme to display here.`);
            return null;
        }
        theme_in_html.textContent = main_theme;
        const userretrive = data[`${main_theme} timetableData`];
        if(!userretrive){
            alert(`❌ No data under current theme ${main_theme} found for user: ${main_user}.
            Please save some data under this theme to display here.`);
            return null;
        }
        console.log('✅ Data retrieved for user:', main_user);
        //console.log(JSON.parse(data[`${main_theme} latest_timetable`]));
        latestTimetableData = JSON.parse(data[`${main_theme} latest_timetable`]);
        return data;
        //return JSON.parse(userretrive); 
    } catch (error) {
        alert(`❌ Error retrieving data: ${error}`);
        return null;
    }
}

async function MainThemeFunc(parameter){
    if(parameter === 1) {
        let new_theme = dropdown.value;
        if(new_theme.trim() === '')    return;
        if(new_theme === main_theme){
            alert('This is already the current theme. Please select a different one.');
            return;
        }
        let conf = confirm(`Make sure that you have saved all your data under current theme ${main_theme} before switching to theme ${new_theme}.
        Otherwise, all changes will be lost.
        Confirm to switch to theme ${new_theme} ?`);
        if(!conf) return;
        db.collection('users').doc(uid).set({
            theme : new_theme,
            all_themes : Array.from(list_of_themes)
        }, { merge: true })
        .then(() => {
            //alert(`Theme changed successfully to ${new_theme} for user ${main_user} ! Reloading the page to apply changes and load data under new theme.`);
            loadStoredTimetable();
        })
        .catch((error) => {    alert('❌ Error changing theme:', error);});
    }
    if(parameter === 2) {
        let new_theme = prompt('Please enter new theme name:');
        if(!new_theme || new_theme.trim() === ''){
            alert('No theme name provided.');
            return;
        }
        if(list_of_themes.has(new_theme)){
            alert('This theme already exists.');
            return;
        } // Set default theme if not set
        if(list_of_themes.size >= 10){
            alert('Already 10 themes in your account. Cannot add more themes!')
            return;
        }
        list_of_themes.add(new_theme);
        if(main_theme){
            let conf = confirm(`Make sure that you have saved all your data under current theme ${main_theme} before switching to new theme ${new_theme}.
            Otherwise, all changes will be lost.
            Confirm to switch to new theme ${new_theme} ?`);
            if(!conf) return;
        }
        db.collection('users').doc(uid).set({
            theme : new_theme,
            [`${new_theme} latest_timetable`]: JSON.stringify(
            [
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', '']
            ]),
            all_themes : Array.from(list_of_themes)
        }, { merge: true })
        .then(() => {
            //alert(`Theme changed successfully to ${new_theme} for user ${main_user} ! Reloading the page to apply changes and load data under new theme.`);
            loadStoredTimetable();
        })
        .catch((error) => {    alert('❌ Error adding new theme:', error);});
    }
    if(parameter === 3) {
        if(!main_theme){
            alert('No current theme found. Cannot rename.');
            return;
        }
        const local_snap = await db.collection('users').doc(uid).get();
        const local_data = local_snap.data();
        if(!local_data[`${main_theme} timetableData`]){
            alert('Please save some data under current theme in order to be able to rename it!');
            return;
        }
        let new_theme = prompt('Please enter a new theme name to rename current them to:');
        if(!new_theme || new_theme.trim() === ''){
            alert('No theme name provided.');
            return;
        } // Set default theme if not set
        if(new_theme === main_theme || list_of_themes.has(new_theme)){
            alert('This theme already exists. Please delete existing one and then rename or enter a different name.');
            return;
        } // Set default theme if not set
        
        let conf = confirm(`Make sure to have saved all data under current theme ${main_theme} before renaming to theme ${new_theme}.
        Otherwise, all changes will be lost.
        Confirm to rename to ${new_theme} ?`);
        if(!conf) return;
        list_of_themes.delete(main_theme);
        list_of_themes.add(new_theme);
        
        db.collection('users').doc(uid).update({
            theme: new_theme,
            [`${new_theme} timetableData`]: local_data[`${main_theme} timetableData`],
            [`${new_theme} latest_timetable`]: local_data[`${main_theme} latest_timetable`] || JSON.stringify(
            [
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', ''],
                ['', '', '', '', '', '', '', '']
            ]),
            [`${main_theme} timetableData`]: firebase.firestore.FieldValue.delete(),
            [`${main_theme} latest_timetable`]: firebase.firestore.FieldValue.delete(),
            all_themes: Array.from(list_of_themes)
        })
        .then(() => {
            //alert(`Theme changed successfully to ${new_theme}! Reloading the page to apply changes and load data under the new theme.`);
            loadStoredTimetable();
        })
        .catch((error) => {
            alert(`❌ Error changing theme: ${error}`);
        });        
    }
    if(parameter === 4) {
        if(!main_theme){
            alert('No current theme found. Cannot delete.');
            return;
        }
        let conf = confirm('Are you sure you want to delete this theme? All data under this theme will be lost.');
        if(!conf) return;
        list_of_themes.delete(main_theme);
        main_theme = null;
        theme_in_html.textContent = '';
        db.collection('users').doc(uid).update({
            theme: firebase.firestore.FieldValue.delete(),
            [`${main_theme} timetableData`]: firebase.firestore.FieldValue.delete(),
            [`${main_theme} latest_timetable`]: firebase.firestore.FieldValue.delete(),
            all_themes : Array.from(list_of_themes)
        })
        .then(() => {
            //alert(`Fields deleted successfully for user ${main_user} !Reloading page to apply changes.`);
            loadStoredTimetable();
        })
        .catch((error) => {    alert('❌ Error deleting fields:', error);});
    }
}

//window.addEventListener('load', loadStoredTimetable);
//window.addEventListener('beforeunload',() => {SaveData(convertWeekTablesToStatus())});
//window.onbeforeunload = SaveData();

function file_input_first(event) {
    const file = event.target.files[0];
    console.log('File of first input has changed!');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                main_status_timetable = data;
                //SaveData(status_timetable);
                alert('Data retrieved successfully');
                main_container.innerHTML = '';
                remove_first();
                loadStoredTimetable(main_status_timetable);
            } catch (error) {
                console.error('Error parsing the JSON file:', error);
                alert('Failed to parse the JSON file.');
            }
        };
        reader.readAsText(file);
    } else {
        alert('No file selected.');
    }
}

function file_input_always_func(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result); 
                main_status_timetable = data; 
                //SaveData(status_timetable);
                alert('Data retrieved successfully');
                main_container.innerHTML = ''; 

                attendance.style.display = 'none';

                loadStoredTimetable(main_status_timetable);
            } catch (error) {
                console.error('Error parsing the JSON file:', error);
                alert('Failed to parse the JSON file.');
            }
        };

        reader.onerror = function(error) {
            console.error('Error reading the file:', error);
            alert('There was a problem reading the file.');
        };

        reader.readAsText(file); 
    } else {
        alert('No file selected.');
    }
}

function first(){
    main_container.innerHTML = '';
    nav.style.display = 'none';
    imp.style.display = 'none';
    attendance.style.display = 'none';
    resetlatest();
    most_imp.style.display = 'block';
    //theme_in_html.textContent = '';
    First.style.display = 'block';
    First.innerHTML = `
    <h2>No stored timetable data found <span id="temp"></span>. Please select a JSON file where you might have stored your data</h2><br>
    <input type="file" id="file_input_on_first_spawn" onchange="file_input_first(event)"><br><br>
    <h2>If you are setting up your Timetable for the first time, press the Add New Week button to start adding weeks!</h2>
    <h3>Or if you have other themes where data is saved you many select from the dropdown!</h3>
    <h3>You may also sign out and login with a different account where your data might be stored!</h3>
    <button class="sign-out-btn" onclick="auth.signOut()">Sign Out</button>
    `;
    if(main_theme)  document.getElementById('temp').textContent = `under theme ${main_theme}!`;
    window.scrollTo(0, document.body.scrollHeight);
}

function remove_first(){
    First.style.display = 'none';
    First.innerHTML = '';
    change_date.style.display = 'none';
    nav.style.display = 'flex';
    //theme_in_html.textContent = `${a} ${b}`;
    displaySubjects();
}

function updateSubjectsInTimetable() {
    const updated_timetable = [[], [], [], [], []];  
    const weekTables = document.querySelectorAll('.table-section');
    if (weekTables.length === 0)    return null;
    weekTables.forEach((weekTable) => {
        const rows = weekTable.querySelectorAll('.week-row');
        rows.forEach((row) => {
            const dayCell = row.querySelector('.day-cell');
            if (!dayCell) return;  
            const day = dayCell.textContent.trim();  
            const subjectCells = row.querySelectorAll('.period');
            let Subjects=[];
            subjectCells.forEach((subjectCell, index) => {
                const subjectName = subjectCell.textContent.trim();  
                Subjects.push(subjectName);
            });
            if(day === 'Monday')    updated_timetable[0] = Subjects;
            if(day === 'Tuesday')    updated_timetable[1] = Subjects;
            if(day === 'Wednesday')    updated_timetable[2] = Subjects;
            if(day === 'Thursday')    updated_timetable[3] = Subjects;
            if(day === 'Friday')    updated_timetable[4] = Subjects;
            });
        });
        for(let i = 0; i < updated_timetable.length; i++)    if((updated_timetable[i]).length === 0)  updated_timetable[i] = latestTimetableData[i];
    return updated_timetable;
}

function get_starting_date() {
    change_date.style.display = 'block';
    change_date.innerHTML = `
    <h2>No stored timetable data found. Please select a start date for your timetable:</h2><br>
    <input type='date' id='start-date' min='1970-01-01' max='${new Date().toISOString().split('T')[0]}'>
    <button id='submit-date'>Submit</button>
    <button id='cancel-date'>Cancel</button>
    `;
    const submitButton = document.getElementById('submit-date');
    submitButton.addEventListener('click', () => {
        let dateInput = document.getElementById('start-date').value;
        if (!dateInput) {
            alert('Please select a valid date.');
            return;
        }
        //alert(`Selected date is: ${dateInput} (${daysOfWeek[new Date(dateInput).getDay()]})`);
        //change_date.innerHTML = '';
        change_date.style.display = 'none';
        dateInput = adjustToPreviousMonday(dateInput);
        remove_first();
        change_date.style.display = 'none';
        imp.style.display = 'block';
        createWeeklyTables(convertlatestTo2DArray(), dateInput, 1);
    });
    const cancelButton = document.getElementById('cancel-date');
    cancelButton.addEventListener('click', () => {
        change_date.innerHTML = '';
        change_date.style.display = 'none';
    });
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0'); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${day}/${month}/${year}`; 
}

function adjustToPreviousMonday(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    let date = new Date(year, month - 1, day); // Convert string to Date object
    if(date.getDay() === 1)    alert(`Selected date : ${dateString} is a Monday`);
    else    alert(`Selected date : ${dateString} is a ${daysOfWeek[date.getDay()]}. Adjusting to previous Monday`);
    
    // Reverse while loop to find the previous Monday
    while (date.getDay() !== 1) {
        date.setDate(date.getDate() - 1);
    }

    // Convert back to YYYY-MM-DD format
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

function findNextMonday() {
    const weekTables = document.querySelectorAll('.table-section');
    if (weekTables.length === 0) return null;
    const lastWeekTable = weekTables[weekTables.length - 1];
    const weekRows = lastWeekTable.querySelectorAll('.week-row');
    if (weekRows.length === 0) return null;
    const lastRow = weekRows[weekRows.length - 1];
    const dateCell = lastRow.querySelector('.date-cell');
    const dayCell = lastRow.querySelector('.day-cell');
    const dateValue = dateCell ? dateCell.textContent.trim() : null;
    const dayValue = dayCell ? dayCell.textContent.trim() : null;
    if (!dateValue || !dayValue) return null;
    const [day, month, year] = dateValue.split('/').map(Number);
    let currentDate = new Date(year, month - 1, day);
    if (currentDate.getDay() === 1)    currentDate.setDate(currentDate.getDate() + 7);
    else{while (currentDate.getDay() !== 1)    currentDate.setDate(currentDate.getDate() + 1);}
    const nextMonday = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    return nextMonday;
}

function firstDateGreaterThanSecond(date1, date2) {
    function parseDate(date) {
        // Convert YYYY-MM-DD to Date object
        let [year, month, day] = date.split("-").map(Number);
        return new Date(year, month - 1, day); // Months are zero-based in JS
    }

    let d1 = parseDate(date1); // Weektable creation date
    let d2 = parseDate(date2); // Latest allowed Monday (from restriction func)

    return d1 > d2;
}

function getMaxAllowedMonday6Months(inputDate) {
    let day,month,year;
    if(inputDate.includes('-')){
        [year, month, day] = inputDate.split('-').map(Number);
    }
    else if(inputDate.includes('/')){
        [day, month, year] = inputDate.split('/').map(Number);
    }
    let start = new Date(year, month - 1, day); // Months are zero-based in JS

    // Add 182 days (exact 6 months)
    let maxDate = new Date(start);
    maxDate.setDate(start.getDate() + 182);

    // Find the previous Monday before or on maxDate
    while (maxDate.getDay() !== 1) { // Monday is day 1 in JS (Sunday = 0)
        maxDate.setDate(maxDate.getDate() - 1);
    }

    // Format output as YYYY-MM-DD
    let yyyy = maxDate.getFullYear();
    let mm = String(maxDate.getMonth() + 1).padStart(2, '0'); // Month needs +1
    let dd = String(maxDate.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

function validateAndTruncateThemes(para) {
    try {    
        if (para.size > 10) {
            alert('The number of themes you are trying to save exceeds 10. Truncating to the first 10 themes.');
            
            // Convert Set to array, slice first 10 elements, create new Set
            para = new Set([...para].slice(0, 10));
        }
    } 
    catch (error) {
        alert(`An error occurred: ${error}`);
    }
    return para; // Return the truncated Set
}

function validateAndTruncateData(data) {
    // **Error Handling**
    if (!Array.isArray(data)) {
        alert("Error: Provided data is not an array.");
        return null;
    }

    if (data.some(item => !Array.isArray(item))) {
        alert("Error: Data should be an array of arrays.");
        return null;
    }

    if (data.some(week => week.some(row => !Array.isArray(row)))) {
        alert("Error: Each row must be an array.");
        return null;
    }

    let d1 = 27;//27
    let d2 = 5;//7
    let d3 = 11;//20

    let truncationDone = false; // Flag to track truncation
    // **Find max values before truncation**
    // **Validations & Truncation**
    if (data.length > d1) {
        data.length = d1; // Truncate to 27 weeks
        truncationDone = true;
    }

    data.forEach(week => {
        if (week.length > d2) {
            week.length = d2; // Truncate to 7 rows per week
            truncationDone = true;
        }

        week.forEach(row => {
            if (row.length > d3) {
                row.length = d3; // Truncate to 20 entries per row
                truncationDone = true;
            }
        });
    });

    // Show a single alert if truncation happened
    if (truncationDone)        alert("Some data exceeded limits and has been truncated.");

    // Log the max values found
    console.log(`Max Weeks Found: ${data.length}`);
    console.log(`Max Rows Per Week Found: ${Math.max(...data.map(week => week.length))}`);
    console.log(`Max Entries Per Row Found: ${Math.max(...data.flatMap(week => week.map(row => row.length)))}`);

    return data;
}

function createWeeklyTables(param_timetable,monday_date,first_time) {
    //add limit of not more than 28 weektables per theme and not more than 10 themes in one account
    let weekDate;
    if(!monday_date){
        get_starting_date();
        return;
    }
    else{
        let selected_date = first_time ? monday_date : main_status_timetable[0][0][0];
        let max_allowed_date = getMaxAllowedMonday6Months(selected_date);
        let noofweektables = document.querySelectorAll('.table-section');
        if(firstDateGreaterThanSecond(monday_date,max_allowed_date)){
            alert(`Can create weektables starting with monday upto ${max_allowed_date} only!`);
            return;
        }
        if(noofweektables >= 27){
            alert(`Cannot create more than 27 weektables under one theme!`);
            return;
        }
        weekDate = new Date(monday_date);
    }
    const weekSection = document.createElement('tbody');
    weekSection.className = 'table-section';
    const isFirstSection = main_container.children.length === 0;
    weekSection.style.marginTop = isFirstSection ? '0px' : '50px';

    const headerRow = document.createElement('tr');
    headerRow.className = 'week-header-row';
    const headerDate = document.createElement('th');
    headerDate.textContent = 'Date';
    headerRow.appendChild(headerDate);
    const headerDay = document.createElement('th');
    headerDay.textContent = 'Day';
    headerRow.appendChild(headerDay);

    for (let i = 1; i <= 8; i++) {
        const headerPeriod = document.createElement('th');
        headerPeriod.textContent = `${i}`;
        headerRow.appendChild(headerPeriod);
    }
    const allDay = document.createElement('th');
    allDay.textContent = 'All';
    //headerRow.appendChild(allDay);
    const deletetheDay = document.createElement('th');
    deletetheDay.textContent = 'Delete';
    //headerRow.appendChild(deletetheDay);
    weekSection.appendChild(headerRow);
    for (let i = 0; i < param_timetable.length; i++) {
        const dayRow = document.createElement('tr');
        dayRow.className = 'week-row';
        const dateCell = document.createElement('td');
        dateCell.className = 'date-cell';
        dateCell.textContent = formatDate(weekDate);
        dayRow.appendChild(dateCell);
        const dayCell = document.createElement('td');
        dayCell.className = 'day-cell';
        dayCell.textContent = daysOfWeek[weekDate.getDay()];
        dayRow.appendChild(dayCell);
        //Object.keys(param_timetable[i][j])[0]
        for (let j = 0; j < param_timetable[i].length; j++) {
            const periodCell = document.createElement('td');
            periodCell.className = 'period';
            periodCell.textContent = `${param_timetable[i][j].trim().toUpperCase()}`;
            //periodCell.contentEditable = !selectedStatus && !checkbox.checked;
            //periodCell.onclick = () => showPeriodMenu(periodCell);
            periodCell.onblur = () => {
                periodCell.textContent = periodCell.textContent.trim().toUpperCase(); // Trim and convert to uppercase
                if(periodCell.textContent.trim() === '')    periodCell.classList.remove('Present', 'Absent', 'no-class');
                updateAttendanceStats(); // Update attendance stats after renaming
            }
            dayRow.appendChild(periodCell);
        }
        const allCell = document.createElement('td');
        allCell.className = 'all-cell';
        allCell.innerHTML = "<button class='all-btn'>All</button>";
        //allCell.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
        dayRow.appendChild(allCell);
        const deleteCell = document.createElement('td');
        deleteCell.innerHTML = `<button class='del-btn' onclick='deleteDay(this)'>Delete</button>`;
        deleteCell.className = 'delete-cell';
        dayRow.appendChild(deleteCell);
        weekSection.appendChild(dayRow);
        weekDate.setDate(weekDate.getDate() + 1);
    }

    main_container.appendChild(weekSection);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'week-buttons';

    const button1 = document.createElement('button');
    button1.textContent = 'All Week';
    button1.className = 'all-week-btn';
    //button1.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
    //button1.onclick = function() {    showAllWeekMenu(button1, weekSection);};

    const button2 = document.createElement('button');
    button2.textContent = 'Delete Week';
    button2.className = 'delete-week-btn';
    button2.onclick = () => deleteAllWeek(weekSection);

    buttonContainer.appendChild(button1);
    buttonContainer.appendChild(button2);
    //buttonContainer.appendChild(changePeriodsButton);
    const setaslatest = document.createElement('button');
    setaslatest.textContent = 'Set as latest';
    setaslatest.className = 'set-latest-btn';
    setaslatest.onclick = () => setAsLatest(weekSection);
    buttonContainer.appendChild(setaslatest);

    const copydaywise = document.createElement('button');
    copydaywise.textContent = 'Copy day wise status of weektable';
    copydaywise.className = 'copy-day-wise';
    copydaywise.onclick = () => converttableto2Darraydictstatus(weekSection);
    buttonContainer.appendChild(copydaywise);

    const pastedaywise = document.createElement('button');
    pastedaywise.textContent = 'Paste and update day wise status of weektable';
    pastedaywise.className = 'paste-day-wise';
    pastedaywise.onclick = () => updatestatustoweektable(weekSection);
    buttonContainer.appendChild(pastedaywise);

    weekSection.insertBefore(buttonContainer,weekSection.firstChild);
    updateAttendanceStats();
    if(!main_status_timetable)  main_status_timetable = [];
    if(convertWeekToStatus(weekSection).length) main_status_timetable.push(convertWeekToStatus(weekSection));
    document.dispatchEvent(customevent);
    //console.log(main_status_timetable);
}

async function loadStoredTimetable(data_if_passed) {
    list_of_deleted = new Set();
    resetlatest();
    capitalizelatest();
    //document.querySelector('input[name="status"][value=""]').click();
    main_status_timetable = data_if_passed || await RetrieveData();
    if (!main_status_timetable || main_status_timetable.length === 0) return first();
    main_status_timetable = data_if_passed ? data_if_passed : JSON.parse(main_status_timetable[`${main_theme} timetableData`]);
    if (!main_status_timetable || main_status_timetable.length === 0) return first();
    //validateAndTruncateData(main_status_timetable);
    //console.log(`Total no. of week datas in received data : ${main_status_timetable.length}`);
    main_container.innerHTML = '';
    //main_status_timetable.forEach(weekData => createWeeklyTables(weekData, undefined, undefined, 1));
    validateAndTruncateData(main_status_timetable);
    for (let i = 0; i < main_status_timetable.length; i++) {
        let weekTable = main_status_timetable[i];
        if(weekTable.every(row => row[row.length - 1] === "Delete")) continue;
        let weekSection = document.createElement('tbody');
        weekSection.className = 'table-section';
        let isFirstSection = main_container.children.length === 0;
        weekSection.style.marginTop = isFirstSection ? '0px' : '50px';
        const headerRow = document.createElement('tr');
        headerRow.className = 'week-header-row';
        const headerDate = document.createElement('th');
        headerDate.textContent = 'Date';
        headerRow.appendChild(headerDate);
        const headerDay = document.createElement('th');
        headerDay.textContent = 'Day';
        headerRow.appendChild(headerDay);
        for (let head = 1; head <= weekTable[0].length - 3 ; head++) {
            const headerPeriod = document.createElement('th');
            headerPeriod.textContent = `${head}`;
            headerRow.appendChild(headerPeriod);
        }
        weekSection.appendChild(headerRow);
        for(let j = 0; j < weekTable.length; j++) {
            let row = weekTable[j];
            if(row[row.length - 1] === "Delete") continue;
            let weekRow = document.createElement('tr');
            weekRow.className = 'week-row';
            const dateCell = document.createElement('td');
            dateCell.className = 'date-cell';
            dateCell.textContent = row[0];
            weekRow.appendChild(dateCell);
            const dayCell = document.createElement('td');
            dayCell.className = 'day-cell';
            dayCell.textContent = row[1];
            weekRow.appendChild(dayCell);
            for (let k = 2; k < row.length - 1; k++) {
                const periodCell = document.createElement('td');
                periodCell.className = 'period';
                periodCell.textContent = Object.keys(row[k])[0].trim().toUpperCase();
                //periodCell.contentEditable = !selectedStatus && !checkbox.checked;
                if(Object.values(row[k])[0] !== '') periodCell.classList.add(`${Object.values(row[k])[0]}`);
                //periodCell.onclick = () => showPeriodMenu(periodCell);
                periodCell.onblur = () => {
                    periodCell.textContent = periodCell.textContent.trim().toUpperCase(); // Trim and convert to uppercase
                    if(periodCell.textContent.trim() === '')    periodCell.classList.remove('Present', 'Absent', 'no-class');
                    updateAttendanceStats(); // Update attendance stats after renaming
                }
                weekRow.appendChild(periodCell);
            }
            const allCell = document.createElement('td');
            allCell.className = 'all-cell';
            allCell.innerHTML = "<button class='all-btn'>All</button>";
            //allCell.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
            weekRow.appendChild(allCell);
            const deleteCell = document.createElement('td');
            deleteCell.innerHTML = `<button class='del-btn' onclick='deleteDay(this)'>Delete</button>`;
            deleteCell.className = 'delete-cell';
            weekRow.appendChild(deleteCell);
            weekSection.appendChild(weekRow);
        }
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'week-buttons';

        const button1 = document.createElement('button');
        button1.textContent = 'All Week';
        button1.className = 'all-week-btn';
        //button1.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
        //button1.onclick = function() {    showAllWeekMenu(button1, weekSection);};

        const button2 = document.createElement('button');
        button2.textContent = 'Delete Week';
        button2.className = 'delete-week-btn';
        button2.onclick = function() {    deleteAllWeek(weekSection)};

        buttonContainer.appendChild(button1);
        buttonContainer.appendChild(button2);
        
        //buttonContainer.appendChild(changePeriodsButton);
        
        const setaslatest = document.createElement('button');
        setaslatest.textContent = 'Set as latest';
        setaslatest.className = 'set-latest-btn';
        setaslatest.onclick = () => setAsLatest(weekSection);
        buttonContainer.appendChild(setaslatest);

        const copydaywise = document.createElement('button');
        copydaywise.textContent = 'Copy day wise status of weektable';
        copydaywise.className = 'copy-day-wise';
        copydaywise.onclick = () => converttableto2Darraydictstatus(weekSection);
        buttonContainer.appendChild(copydaywise);
        
        const pastedaywise = document.createElement('button');
        pastedaywise.textContent = 'Paste and update day wise status of weektable';
        pastedaywise.className = 'paste-day-wise';
        pastedaywise.onclick = () => updatestatustoweektable(weekSection);
        buttonContainer.appendChild(pastedaywise);

        weekSection.insertBefore(buttonContainer,weekSection.firstChild);
        main_container.appendChild(weekSection);
    }
    if (!document.querySelectorAll('.week-row').length) return first();
    //showlatest();
    //resetlatest();
    First.style.display = "none";
    change_date.innerHTML = '';
    change_date.style.display = 'none';

    for(let i=0;i<main_status_timetable.length;i++){
        for(let j=0;j<main_status_timetable[i].length;j++){
            let dayrow = main_status_timetable[i][j];
            if(dayrow[dayrow.length - 1] === 'Delete'){
                list_of_deleted.add(dayrow[0]);
            }
        }
    }
    Object.assign(nav.style, { display: 'flex' });
    Object.assign(most_imp.style, { display: 'block' });
    Object.assign(imp.style, { display: 'block' });
    attendance.style.display = 'none';
    populateTableFromArray(latestTimetableData);
    updateAttendanceStats();
    document.dispatchEvent(customevent);
}

function capitalizelatest(){
    latestTimetable.querySelectorAll('td').forEach((cell) => {
        cell.textContent = cell.textContent.trim().toUpperCase();
        cell.onblur = () => {
            cell.textContent = cell.textContent.trim().toUpperCase();
            updateAttendanceStats();
        }
    });
    updateAttendanceStats();
}

function converttableto2Darraydict(weektable) {
    const weekData = {};
    const rows = weektable.querySelectorAll('.week-row');
    rows.forEach((row) => {
        const day = row.querySelector('.day-cell').textContent.trim();
        const periods = [];
        const periodCells = row.querySelectorAll('.period');
        periodCells.forEach((cell) => {
            const subject = cell.textContent.trim();
            periods.push(subject);
        });
        weekData[day] = periods;
    });
    updateAttendanceStats();
    return weekData;
}

function converttableto2Darraydictstatus(weektable) {
    const weekData = {};
    const rows = weektable.querySelectorAll('.week-row');
    rows.forEach((row) => {
        const day = row.querySelector('.day-cell').textContent.trim();
        const periods = [];
        const periodCells = row.querySelectorAll('.period');
        periodCells.forEach((cell) => {
            const subject = cell.textContent.trim();
            let periodStatus = '';
            if (cell.classList.contains('Present')) {
                periodStatus = 'Present';
            } else if (cell.classList.contains('Absent')) {
                periodStatus = 'Absent';
            } else if (cell.classList.contains('no-class')) {
                periodStatus = 'no-class';
            }
            periods.push({ [subject]: periodStatus });
        });
        weekData[day] = periods;
    });
    navigator.clipboard.writeText(JSON.stringify(weekData))
    .then(() => {    
        alert("Text copied to clipboard!");
        updateAttendanceStats();
    })
    .catch(err => {    console.error("Failed to copy: ", err);});
}

function copylatest(){
    navigator.clipboard.writeText(JSON.stringify(convertlatestTo2DArray()))
    .then(() => {    
        alert("Text copied to clipboard!");
        updateAttendanceStats();
    })
    .catch(err => {    console.error("Failed to copy: ", err);});
}

function pastelatest(){
    try{
        let statusdata = JSON.parse(prompt('Enter 2D array to update latest timetable'));
        if (!statusdata) {
            alert('No data received');
            return;
        }
        const rows = latestTimetable.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].querySelectorAll('td');
            const statusrow = statusdata[i];
            for(let j = 0;j < row.length;j++){
                const cell = row[j];
                const celldata = statusrow[j];
                if(cell && celldata){
                    cell.textContent = celldata.trim();
                }
            }
        }
        updateAttendanceStats();
    }
    catch(error){
        alert(`An error occured : ${error}`);
    }
}

function updatestatustoweektable(weektable) {
    try{
        let statusdata = JSON.parse(prompt('Enter weekdata status that will be used for updating corresponding weektable'));
        if (!statusdata) {
            alert('No data received');
            return;
        }
        const rows = weektable.querySelectorAll('.week-row');
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const nodedayvalue = row.querySelector('.day-cell');
            const dayName = nodedayvalue.textContent.trim(); // Corrected extraction
            const dayvalue = statusdata[dayName];
            if(dayvalue){
                const periods = row.querySelectorAll('.period');
                for (let j = 0; j < dayvalue.length; j++) {
                    if (periods[j]) { // Ensure period exists before modifying
                        const key = Object.keys(dayvalue[j])[0];
                        const value = Object.values(dayvalue[j])[0];
                        periods[j].textContent = key.trim();
                        periods[j].classList.remove('Present', 'Absent', 'no-class');
                        if (value !== '') periods[j].classList.add(value);
                    }
                }
            }
        }
        updateAttendanceStats();
    }
    catch(error){
        alert(`An error occured : ${error}`);
    }
}

function convertlatestTo2DArray() {
    if (!latestTimetable) {
        console.error("Table structure missing!");
        return [];
    }

    const rows = latestTimetable.querySelectorAll("tbody tr"); // Select all rows
    let tableArray = [];

    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll("td"); // Select all cells, excluding the day label

        cells.forEach(cell => rowData.push(cell.textContent.trim())); // Push cell content into array
        tableArray.push(rowData);
    });
    updateAttendanceStats();
    return tableArray;
}

function populateTableFromArray(tableArray) {
    const latestTimetable = document.getElementById("latest-timetable");
    const rows = latestTimetable.querySelectorAll("tbody tr"); // Select all rows
    for(let i=0;i<rows.length;i++){
        const cells = rows[i].querySelectorAll("td"); // Select all cells, excluding the day label
        for(let j=0;j<cells.length;j++)    cells[j].textContent = tableArray[i][j]; // Update cell content
    }
    updateAttendanceStats();
}

function setAsLatest(weekSection) {
    let weekData = converttableto2Darraydict(weekSection);
    if (!latestTimetable) {
        console.error("Table structure missing!");
        return;
    }

    const rows = latestTimetable.querySelectorAll("tbody tr"); // Select all rows

    rows.forEach(row => {
        const dayCell = row.querySelector("th"); // Select the first cell (Day label)
        const subjectCells = row.querySelectorAll("td"); // Select editable subject cells

        const dayName = dayCell?.textContent.trim(); // Extract day name
        if (!dayName || !weekData.hasOwnProperty(dayName)) return; // Skip if day is missing in weekData

        const subjects = weekData[dayName]; // Get subject list for this day

        subjects.forEach((subject, index) => {
            if (subjectCells[index]) {
                subjectCells[index].textContent = subject; // Update subject cell
            }
        });
    });
    updateAttendanceStats();
}

function showlatest(){
    const latest_btn = document.getElementById('show-latest-btn');
    const th3 = document.getElementById("latest_timetable_heading");
    if(latest_btn.textContent === 'Show Latest Timetable') {
        latest_btn.textContent = 'Hide Latest Timetable';
        latestTimetable.style.display = '';
        th3.style.display = '';
    }
    else {
        latest_btn.textContent = 'Show Latest Timetable';
        latestTimetable.style.display = 'none';
        th3.style.display = 'none';
    }
    updateAttendanceStats();
}

function resetlatest(){
    latestTimetable.querySelectorAll('td').forEach(cell => cell.textContent = '');
    updateAttendanceStats();
}

const container = document.getElementById('period-container');
function displaySubjects() {

    let uniquePeriodNames = new Set(); 
    document.querySelectorAll('.period').forEach((cell) => {
        let periodName = cell.textContent.trim();
        if (periodName) uniquePeriodNames.add(periodName);
    });
    uniquePeriodNames = Array.from(uniquePeriodNames);

    container.innerHTML = '';
    container.style.display = 'none';
    if (uniquePeriodNames.length === 0) return;
    container.style.display = 'grid';

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

function updateAttendanceStats(button_clicked) {
    let subjectsAttendance = {};

    let all_subjects = displaySubjects();
    attendance.innerHTML = '';
    attendance.style.backgroundColor = 'white';
    if(button_clicked){    
        if(attbtn.textContent === 'Display Attendance') {
            attbtn.textContent = 'Hide Attendance';
            attendance.style.display = 'block';
        }
        else { // Hide attendance
            attbtn.textContent = 'Display Attendance';
            attendance.style.display = 'none';
            return;
        }
    }
    else{
        if(attbtn.textContent === 'Display Attendance') {
            return;
        }
        else { // Hide attendance
            attendance.style.display = 'block';
        }
    }
    if(!all_subjects){
        attendance.innerHTML = '<h3>There are absolutely no subjects to display attendance of!</h3>';
        attendance.style.backgroundColor = 'gray';
        return;
    }
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

    document.querySelectorAll('.table-section').forEach(weekTable => {

        weekTable.querySelectorAll('.week-row').forEach(row => {
            const date = row.querySelector('.date-cell').textContent.trim(); 
            const periodCells = Array.from(row.getElementsByClassName('period'));
            periodCells.forEach(cell => {
                const subject = cell.textContent.trim(); 
                if (!subject) return;  

                const period = periodCells.indexOf(cell) + 1;  

                let status = '';
                if (cell.classList.contains('Present')) {
                    status = 'Present';
                    subjectsAttendance[subject].Present++;
                    overallAttendance.totalPresent++;
                    subjectsAttendance[subject].totalClasses++; 
                    overallAttendance.totalClasses++;
                } else if (cell.classList.contains('Absent')) {
                    status = 'Absent';
                    subjectsAttendance[subject].Absent++;
                    overallAttendance.totalAbsent++;
                    subjectsAttendance[subject].totalClasses++; 
                    overallAttendance.totalClasses++;
                } else if (cell.classList.contains('no-class')) {
                    status = 'no-class';
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


    const attendanceContainer = document.createElement('div');
    attendanceContainer.className = 'attendance-container';

    if (overallAttendance.totalClasses === 0) {
        attendance.style.backgroundColor = 'gray';
        attendance.innerHTML += `<h3>No classes held at all until now. Thus no attendance to be displayed.</h3>`;
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
            attendanceContainer.style.backgroundColor = 'gray';
            attendanceContainer.innerHTML += `<h3>All held classes are cancelled ones, hence no attendance to show.</h3>`;
            attendance.appendChild(attendanceContainer);
            return;
        } else {
            attendanceContainer.innerHTML += `<h3>Overall Attendance (excluding cancelled classes): ${overallAttendance.overallAttendancePercentage.toFixed(5)}%</h3>`;

            if (overallAttendance.overallAttendancePercentage >= 75) {
                attendanceContainer.classList.add('high-attendance');
            } else if (overallAttendance.overallAttendancePercentage >= 60) {
                attendanceContainer.classList.add('medium-attendance');
            } else {
                attendanceContainer.classList.add('low-attendance');
            }
        }
    }

    attendance.appendChild(attendanceContainer);

    for (let subject in subjectsAttendance) {
        const subjectData = subjectsAttendance[subject];
        const subjectDisplay = document.createElement('div');
        subjectDisplay.className = 'subject-attendance';
        if (subjectData.totalClasses === 0) {
            subjectDisplay.style.backgroundColor = 'gray';
            subjectDisplay.innerHTML = `
                <h2>${subject}</h2>
                <h3>No classes held for '${subject}' until now.</h3>
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
                subjectDisplay.style.backgroundColor = 'gray';
                subjectDisplay.innerHTML += `<h3>All held classes are cancelled ones, hence no attendance to show.</h3>`;
            } else {
                subjectDisplay.innerHTML += `<ul>`;
                for (let k = 0; k < subjectData.dates.length; k++) {
                    const dateEntry = subjectData.dates[k];
                    if(dateEntry.status === 'no-class') subjectDisplay.innerHTML += `<li>${dateEntry.date} - Period ${dateEntry.period}: Class Cancelled</li>`;
                    else    subjectDisplay.innerHTML += `<li class='history'>${dateEntry.date} - Period ${dateEntry.period}: ${dateEntry.status}</li>`;
                }
                subjectDisplay.innerHTML += `</ul>`;
                subjectDisplay.innerHTML += `<h3>Overall Attendance (excluding cancelled classes): ${subjectData.Attendance.toFixed(5)}%</h3>`;

                if (subjectData.Attendance >= 75) {
                    subjectDisplay.classList.add('high-attendance');
                } else if (subjectData.Attendance >= 60) {
                    subjectDisplay.classList.add('medium-attendance');
                } else {
                    subjectDisplay.classList.add('low-attendance');
                }
            }
        }
        attendance.appendChild(subjectDisplay);
    }
}

function deleteAllWeek(weekTable) {

    const firstDateCell = weekTable.querySelector('td:first-child'); 
    const lastDayRow = weekTable.querySelectorAll('tr')[weekTable.rows.length - 1];
    const lastDateCell = lastDayRow.querySelector('td:first-child'); 

    const startDate = firstDateCell ? firstDateCell.textContent.trim() : 'Unknown';
    const endDate = lastDateCell ? lastDateCell.textContent.trim() : 'Unknown';

    let askbeforedelete = confirm(`Are you sure you want to delete the entire week's Attendance from ${startDate} to ${endDate}?`);
    if (!askbeforedelete) return;
    const rows = weekTable.querySelectorAll('.week-row');
    const rowdates = [];
    rows.forEach(row =>    rowdates.push(row.querySelector('.date-cell').textContent.trim()));
    //addtodeleted(`${startDate} - ${endDate}`,convertWeekToStatus(weekTable));
    outerloop : for(let k=0;k<rowdates.length;k++){
        let date = rowdates[k];
        midloop : for(let i=0;i<main_status_timetable.length;i++){
            for(let j=0;j<main_status_timetable[i].length;j++){
                let dayrow = main_status_timetable[i][j];
                if(dayrow[0] === date){
                    dayrow[dayrow.length - 1] = 'Delete';
                    list_of_deleted.add(dayrow[0]);
                    break midloop;
                }
            }
        }
    }
    loadStoredTimetable(main_status_timetable);
    //weekTable.remove(); 
    displaySubjects();
    check_out();
}

function deleteDay(cell) {
    let row = cell.closest('.week-row');
    let date = row.querySelector('.date-cell').textContent;
    let day = row.querySelector('.day-cell').textContent;
    let askbeforedelete = confirm(`Are you sure you want to delete Attendance of date ${date} (${day})?`);
    if(!askbeforedelete)    return;
    let rows = row.closest('.table-section'); 
    outerloop : for(let i=0;i<main_status_timetable.length;i++){
        for(let j=0;j<main_status_timetable[i].length;j++){
            let dayrow = main_status_timetable[i][j];
            if(dayrow[0] === date){
                dayrow[dayrow.length - 1] = 'Delete';
                list_of_deleted.add(dayrow[0]);
                break outerloop;
            }
        }
    }
    loadStoredTimetable(main_status_timetable);
    displaySubjects();
}
function finalizedata(){
    const weekRows = document.querySelectorAll(".week-row");
    for(let k=0;k<weekRows.length;k++){
        const rownode = weekRows[k];
        const rownodedate = rownode.querySelector(".date-cell").textContent.trim();
        mainloop : for(let i=0;i<main_status_timetable.length;i++){
            for(let j=0;j<main_status_timetable[i].length;j++){
                let dayrow = main_status_timetable[i][j];
                //console.log(`Final data : html website date : ${rownodedate}, data variable date : ${dayrow[0]}`)
                if(dayrow[0] === rownodedate){
                    const rownodeperiods = rownode.querySelectorAll(".period");
                    for(let l=2;l<dayrow.length-1;l++){
                        const periodCell = rownodeperiods[l-2]; 
                        const periodName = rownodeperiods[l-2].textContent.trim(); 
                        let periodStatus = ''; 
                        if (periodCell.classList.contains('Present')) {
                            periodStatus = 'Present';
                        } else if (periodCell.classList.contains('Absent')) {
                            periodStatus = 'Absent';
                        } else if (periodCell.classList.contains('no-class')) {
                            periodStatus = 'no-class';
                        }
                        dayrow[l] = { [periodName]: periodStatus };
                    }
                    break mainloop;
                }
            }
        }
    }
    return main_status_timetable;
}
function if_there_already(date_to_check){
    for(let i=0;i<main_status_timetable.length;i++){
        for(let j=0;j<main_status_timetable[i].length;j++){
            let dayrow = main_status_timetable[i][j];
            if(dayrow[0] === date_to_check){
                dayrow[dayrow.length - 1] = 'Normal';
                list_of_deleted.delete(date_to_check);
                return true;
            }
        }
    }
    return false;
}

function convertWeekTablesToStatus() {
    const status_timetable = [];

    const weekTables = document.querySelectorAll('.table-section');
    if (weekTables.length === 0) return null;

    weekTables.forEach((weekTable) => {

        const weekData = convertWeekToStatus(weekTable);
        status_timetable.push(weekData);
    });
    return status_timetable;
}

function convertWeekToStatus(weekTable) {
    const weekData = []; 

    const rows = weekTable.querySelectorAll('.week-row');
    rows.forEach((row) => {

        const rowData = convertRowToStatus(row);
        if(!if_there_already(rowData[0]))    weekData.push(rowData);
    });
    return weekData;
}

function convertRowToStatus(row) {
    const rowData = []; 

    const dateValue = row.querySelector('.date-cell').textContent.trim();
    const dayValue = row.querySelector('.day-cell').textContent.trim();

    rowData.push(dateValue || ''); 
    rowData.push(dayValue || '');   

    const periodCells = row.querySelectorAll('.period');
    periodCells.forEach((periodCell) => {
        const periodName = periodCell.textContent.trim(); 
        let periodStatus = ''; 

        if (periodCell.classList.contains('Present')) {
            periodStatus = 'Present';
        } else if (periodCell.classList.contains('Absent')) {
            periodStatus = 'Absent';
        } else if (periodCell.classList.contains('no-class')) {
            periodStatus = 'no-class';
        }
        rowData.push({ [periodName]: periodStatus });   

    });
    if(list_of_deleted.has(dateValue))   rowData.push('Delete');
    else    rowData.push('Normal') 
    return rowData;
}
function getDayInt(dateStr) {
    let date;
    
    if (dateStr.includes("/")) { 
        // Format: dd/mm/yyyy
        let parts = dateStr.split("/");
        date = new Date(parts[2], parts[1] - 1, parts[0]); // Month index starts from 0
    } else if (dateStr.includes("-")) { 
        // Format: yyyy-mm-dd
        date = new Date(dateStr); // JS natively supports this format
    } else {
        throw new Error("Unsupported date format");
    }

    return date.getDay(); // Returns day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
}

function openPopup() {
    document.querySelector('input[name="status"][value=""]').click();
    document.dispatchEvent(customevent);
    // Remove existing popup if already open
    const existingPopup = document.getElementById("popup");
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.getElementById("popup-overlay");
    if (existingOverlay) existingOverlay.remove();
    
    // Create overlay (blocks all interactions)
    let overlay = document.createElement("div");
    overlay.id = "popup-overlay";
    document.body.appendChild(overlay);

    // Close button
    let closeButton = document.createElement("span");
    closeButton.id = "close-popup";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = closePopup;

    // Create popup container
    let popup = document.createElement("div");
    popup.id = "popup";
    // Content inside popup
    let content = document.createElement("div");
    content.id = 'content-popup';
    content.innerHTML = `<h2>Deleted Items</h2>
    <h3>Note: If a row is deleted but the row is regenerated using Add Week button,it will be removed from list of deleted rows and cannot be restored in original form anymore</h3>
    <h4>List of deleted dates/weeks will appear here...</h4><br>`;
    for (let date of list_of_deleted) {
        content.innerHTML += `
            <p><button onclick="restore('${date}')" id="restore-deleted">Restore</button> [${date}] (${daysOfWeek[getDayInt(date)]})</p><br>
        `;
    }
    popup.appendChild(closeButton);
    popup.appendChild(content);

    document.body.appendChild(popup);
}

function restore(deletedrowdate) {
    outerloop : for(let i=0;i<main_status_timetable.length;i++){
        for(let j=0;j<main_status_timetable[i].length;j++){
            let dayrow = main_status_timetable[i][j];
            if(dayrow[0] === deletedrowdate){
                dayrow[dayrow.length - 1] = 'Normal';
                list_of_deleted.delete(dayrow[0]);
                openPopup();
                loadStoredTimetable(main_status_timetable);
                break outerloop;
            }
        }
    }
}

function closePopup() {
    document.getElementById("popup")?.remove();
    document.getElementById("popup-overlay")?.remove(); // Removes overlay, re-enabling interactions
}

function downloadAsJSON() {
    let status_timetable = finalizedata();
    if(Array.isArray(status_timetable) && status_timetable.length === 0)   return;
    //SaveData(status_timetable);
    let total = [];
    const jsonString = JSON.stringify(status_timetable,null,4);

    const blob = new Blob([jsonString], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.json'; 

    link.click();

    URL.revokeObjectURL(link.href);
}

function check_out(){
    let weeks = document.querySelectorAll('.table-section');
    if(weeks.length === 0) {
        first();
    }
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
    let periods = any.querySelectorAll('.period');
    let a = 1;
    for(let period of periods){
        if (period.textContent && (period.classList.contains('Present') || period.classList.contains('Absent') || period.classList.contains('no-class'))) 
        {    
            a = 0;
            break;
        }
    }
    return a === 1;
}

function addtodeleted(row){
    list_of_deleted[row[0]] = row;
}

/* 
function showPeriodMenu(cell) {
    const menu = document.createElement('div');
    menu.className = 'Attendance-menu';
    menu.innerHTML = `
        <input type='text' class='period-name-input' placeholder='Change period name' value='${cell.textContent}'>
        <br>
        <label><input type='radio' name='Attendance' value='Present'> Present</label>
        <label><input type='radio' name='Attendance' value='Absent'> Absent</label>
        <label><input type='radio' name='Attendance' value='no-class'> Class cancelled</label>
        <label><input type='radio' name='Attendance' value='remove'> Remove current status</label>
        <button class='ok-button'>OK</button>
        <button class='cancel-button'>Cancel</button>
    `;
    showMenu(cell, menu);

    const periodNameInput = menu.querySelector('.period-name-input');
    const okButton = menu.querySelector('.ok-button');
    //periodNameInput.focus();
    menu.addEventListener('keydown',function(e){    if(e.key === 'Enter'){okButton.click();}})
    
    okButton.addEventListener('click', () => {
        const selectedStatus = menu.querySelector('input[name='Attendance']:checked')?.value;
        const newPeriodName = periodNameInput.value.trim();

        if (newPeriodName) {

            if (selectedStatus) {
                if (selectedStatus === 'remove') {

                    cell.classList.remove('Present', 'Absent', 'no-class');
                    cell.textContent = newPeriodName;
                    menu.remove();
                    return;
                } else {

                    cell.classList.remove('Present', 'Absent', 'no-class');
                    cell.classList.add(selectedStatus);
                }
            } else {

            }

        } else {
            if(selectedStatus === 'remove'){
                menu.remove();
                return;
            }
            if (selectedStatus) {

                alert('Period name cannot be empty while assigning a status!');
                cell.textContent = newPeriodName;

                if (cell.classList.contains('Present') || cell.classList.contains('Absent') || cell.classList.contains('no-class')) cell.classList.remove('Present', 'Absent', 'no-class');
                menu.remove();
                return;
            } else {

                if (cell.classList.contains('Present') || cell.classList.contains('Absent') || cell.classList.contains('no-class')) {
                    alert('Period name is empty, removing previous status!');
                    cell.classList.remove('Present', 'Absent', 'no-class');
                }
            }
        }

        cell.textContent = newPeriodName;
        menu.remove(); 
        displaySubjects();
    });
    const cancelButton = menu.querySelector('.cancel-button');
    cancelButton.addEventListener('click', () => {
        menu.remove(); 
    });
}

function showAllDayMenu(cell) {

    const menu = document.createElement('div');
    menu.className = 'all-menu';
    menu.innerHTML = `
        <h3>Mark All</h3>
        <label><input type='radio' name='all-Attendance' value='Present'> Present</label>
        <label><input type='radio' name='all-Attendance' value='Absent'> Absent</label>
        <label><input type='radio' name='all-Attendance' value='no-class'>Class cancelled</label>
        <label><input type='radio' name='all-Attendance' value='remove'> Remove current status</label>
        <button class='ok-button'>OK</button>
        <button class='cancel-button'>Cancel</button>
    `;

    showMenu(cell, menu);

    document.body.appendChild(menu);
    menu.focus();
    const okButton = menu.querySelector('.ok-button');
    menu.addEventListener('keydown',function(e){    if(e.key === 'Enter'){okButton.click();}})

    okButton.addEventListener('click', () => {
        const selectedStatus = menu.querySelector('input[name='all-Attendance']:checked')?.value;
        if (!selectedStatus) return;
        const row = cell.closest('tr');
        row.querySelectorAll('td.period').forEach((periodCell) => {

            if (periodCell.textContent.trim() !== '') {
                periodCell.classList.remove('Present', 'Absent', 'no-class');
                if (selectedStatus !== 'remove') {
                    periodCell.classList.add(selectedStatus);
                }
            }
        });
        menu.remove();
    });
    const cancelButton = menu.querySelector('.cancel-button');
    cancelButton.addEventListener('click', () => {
        menu.remove(); 
    });
}

function showAllWeekMenu(button, weekTable) {

    const menu = document.createElement('div');
    menu.className = 'all-menu';
    menu.innerHTML = `
        <h3>Mark All Week</h3>
        <label><input type='radio' name='all-Attendance' value='Present'> Present</label>
        <label><input type='radio' name='all-Attendance' value='Absent'> Absent</label>
        <label><input type='radio' name='all-Attendance' value='no-class'>Class cancelled</label>
        <label><input type='radio' name='all-Attendance' value='remove'> Remove current status</label>
        <button class='ok-button'>OK</button>
        <button class='cancel-button'>Cancel</button>
    `;

    showMenu(button, menu);

    document.body.appendChild(menu);
    menu.focus();
    const okButton = menu.querySelector('.ok-button');
    menu.addEventListener('keydown',function(e){    if(e.key === 'Enter'){okButton.click();}})
    okButton.addEventListener('click', () => {
        const selectedStatus = menu.querySelector('input[name='all-Attendance']:checked')?.value;
        if (!selectedStatus) return;

        weekTable.querySelectorAll('.week-row').forEach(row => {

            row.querySelectorAll('.period').forEach(periodCell => {

                periodCell.classList.remove('Present', 'Absent', 'no-class');
                if (selectedStatus !== 'remove') {
                    if(periodCell.textContent.trim())    periodCell.classList.add(selectedStatus);
                }
            });
        });
        menu.remove();
    });
    const cancelButton = menu.querySelector('.cancel-button');
    cancelButton.addEventListener('click', () => {
        menu.remove(); 
    });
}
function showMenu(button, menu) {

    document.querySelectorAll('.all-menu').forEach(existingMenu => existingMenu.remove());
    document.querySelectorAll('.Attendance-menu').forEach(menu => menu.remove());

    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    menu.style.position = 'absolute';
    menu.style.left = `${buttonRect.left + window.scrollX}px`;
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;

    if (buttonRect.left + menuRect.width > window.innerWidth) {
        menu.style.left = `${buttonRect.right - menuRect.width + window.scrollX}px`;
    }

    if (buttonRect.bottom + menuRect.height > window.innerHeight) {
        menu.style.top = `${buttonRect.top - menuRect.height + window.scrollY}px`;
    }

    if (menu.offsetLeft < 0) {
        menu.style.left = '0px';
    }

    if (menu.offsetTop < 0) {
        menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    }

    document.body.appendChild(menu);
    
    const observer = new MutationObserver(mutations => {
        mutations.forEach(_ => {
            if (!document.body.contains(button)) {
                menu.remove(); 
                observer.disconnect(); 
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
*/
