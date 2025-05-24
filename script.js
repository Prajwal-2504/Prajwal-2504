let firebaseConfig = {
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
// Firebase User Info Global Variables
let main_user = null;
let uid = null;
let user_email = null;
let user_photoURL = null;
let user_emailVerified = null;
let user_phoneNumber = null;
let user_providerId = null;
let user_isAnonymous = null;
let user_creationTime = null;
let user_lastSignInTime = null;
let user_isNewUser = null;
let user_accessToken = null;
let main_user_data = null;
function login() {
    auth.signInWithPopup(provider)
    .then((result) => {
        const user = result.user;
        const additionalInfo = result.additionalUserInfo;
        const credential = result.credential;

        // Assign values to global variables
        main_user = user.displayName;
        uid = user.uid;
        user_email = user.email;
        user_photoURL = user.photoURL;
        user_emailVerified = user.emailVerified;
        user_phoneNumber = user.phoneNumber;
        user_providerId = user.providerId;
        user_isAnonymous = user.isAnonymous;
        user_creationTime = user.metadata.creationTime;
        user_lastSignInTime = user.metadata.lastSignInTime;
        user_isNewUser = additionalInfo?.isNewUser || null;
        user_accessToken = credential?.accessToken || null;

        alert(`✅ Signed in: ${main_user}\n📧 Email: ${user_email}`);

        dropdown.innerHTML = `
        <option value=''>Select a theme...</option>
        `;
        fts.style.display = 'none';
        loadStoredTimetable(undefined, 1); // Load data now that user is signed in
    })
    .catch((error) => {
        alert(`❌ Login failed: ${error.message}`);
    });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    main_user = user.displayName;
    uid = user.uid;
    user_email = user.email;
    user_photoURL = user.photoURL;
    user_emailVerified = user.emailVerified;
    user_phoneNumber = user.phoneNumber;
    user_providerId = user.providerId;
    user_isAnonymous = user.isAnonymous;
    user_creationTime = user.metadata.creationTime;
    user_lastSignInTime = user.metadata.lastSignInTime;

    //console.log(`✅ Already signed in: ${main_user}, 📧 Email: ${user_email}`);
    loadStoredTimetable(undefined, 1);
  } else {
    console.log('👋 Not signed in. Triggering login...');
    main_container.innerHTML = '';
    most_imp.style.display = 'none';
    resetlatest();
    dropdown.style.display = 'none';
    dropdown.innerHTML = `
    <option value=''>Select a theme...</option>
    `;
    First.style.display = 'none';
    nav.style.display = 'none';
    imp.style.display = 'none';
    fts.style.display = 'block';
  }
});

// Save user data to Firestore
function saveUserDataToFirestore() {
    if (!uid) return;
    
    const now = new Date();
    const creationTime = user_creationTime ? new Date(user_creationTime) : now;
    const lastSignInTime = user_lastSignInTime ? new Date(user_lastSignInTime) : now;
    db.collection('users').doc(uid).set({
    about_user: {
        name: main_user,
        email: user_email,
        photoURL: user_photoURL,
        phoneNumber: user_phoneNumber,
        createdAt: creationTime,
        lastSignInAt: lastSignInTime,
        lastDataSavedAt : now
        //emailVerified: user_emailVerified,
        //providerId: user_providerId,
        //isAnonymous: user_isAnonymous,
        //isNewUser: user_isNewUser,
        //accessToken: user_accessToken
    }
    }, { merge: true })
    .then(() => {
    // console.log('✅ User data saved under about_user');
    })
    .catch((error) => {
    // console.error('❌ Error saving user data:', error);
    });
}

let main_status_timetable = null;
let main_theme = null;
let list_of_themes = new Set();
let list_of_deleted = new Set();
const fts = document.getElementById('first-time-sign-in');
const attendance = document.getElementById('attendance-display-section');
const attbtn = document.getElementById('attendance-btn');
const temp_span = document.getElementById('temp');
const checkbox = document.getElementById('myCheckbox');
const input = document.getElementById('cpn');
const statusSelect = document.getElementById('status');
let selectedStatus = document.querySelector('input[name="status"]:checked')?.value;
let radios = document.querySelectorAll("input[name='status']");
const customevent = new CustomEvent('radioChange');
const checkevent = new CustomEvent('checkchange');
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
        periodCell.textContent = newName.toUpperCase().slice(0, 100); // Set the new name in uppercase

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
    }
    else if(allbtn){
        let row = allbtn.closest('.week-row');
        row.querySelectorAll('.period').forEach((periodCell) => {
            periodCell.classList.remove('Present', 'Absent', 'no-class');
            if (periodCell.textContent.trim() !== '' && selectedStatus !== 'remove') {
                periodCell.classList.add(selectedStatus);
            }
        });
    }
    else if(allweekbtn){
        let table = allweekbtn.closest('.table-section');
        table.querySelectorAll('.period').forEach((periodCell) => {
            periodCell.classList.remove('Present', 'Absent', 'no-class');
            if (periodCell.textContent.trim() !== '' && selectedStatus !== 'remove') {
                periodCell.classList.add(selectedStatus);
            }
        });
    }
    if(periodCell || allbtn || allweekbtn)    updateAttendanceStats(); // Update attendance stats after clicking
};

checkbox.addEventListener('change', () => {
    //alert(checkbox.checked);
    document.querySelector("input[name='status'][value='']").checked = true;
    document.dispatchEvent(customevent);
    // Reset the status select when checkbox is checked/unchecked
    //document.querySelector('input[name="status"][value=""]').click();
    
    document.removeEventListener('click', clickHandler); // Remove click handler
    let isChecked = checkbox.checked;
    input.disabled = !isChecked;
    input.value = ''; // Clear the input field when checkbox is checked/unchecked
    let periodCells = document.querySelectorAll('.period');
    if (isChecked) {
        input.focus();
        // Disable editing and attach the handler
        periodCells.forEach(cell => cell.contentEditable = false);
        document.removeEventListener('click',clickHandler);
        document.addEventListener('click', renameHandler);
    } else {
        // Enable editing and remove the handler
        periodCells.forEach(cell => cell.contentEditable = true);
        document.removeEventListener('click',clickHandler);
        document.removeEventListener('click', renameHandler);
    }
});

document.addEventListener('radioChange', () => {
    //document.removeEventListener('click', renameHandler); // Remove rename handler
    selectedStatus = document.querySelector("input[name='status']:checked").value;
    
    let periodCells = document.querySelectorAll('.period');
    let allCells = document.querySelectorAll('.all-cell');
    let allweekcells = document.querySelectorAll('.all-week-btn');

    if (selectedStatus === '') {
        // Enable contentEditable and remove event listener
        if(!checkbox.checked)   periodCells.forEach(cell => cell.contentEditable = true);
        allCells.forEach(cell => cell.style.display = 'none');
        allweekcells.forEach(cell => cell.style.display = 'none');
        document.removeEventListener('click', clickHandler);
    } else {
        // Disable contentEditable and add click handler
        checkbox.checked = false; // Uncheck the checkbox when status changes
        input.disabled = true; // Disable the input field
        input.value = ''; // Clear the input field when status changes
        periodCells.forEach(cell => cell.contentEditable = false);
        allCells.forEach(cell =>    cell.style.display = '');
        allweekcells.forEach(cell =>    cell.style.display = '');
        document.removeEventListener('click',renameHandler);
        document.addEventListener('click', clickHandler);
    }
});

function SaveData(datatobesaved) {
    try{
        if (!uid) {
            console.error('❌ No user is signed in!');
            login();
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
        if(list_of_themes){
            dropdown.innerHTML = `
            <option value=''>Select a theme...</option>
            `;
            dropdown.style.display = 'block';
            list_of_themes.forEach((theme) => {
                let option = document.createElement('option');
                option.value = theme;
                option.textContent = theme;
                dropdown.appendChild(option);
            });
        }
        list_of_themes = validateAndTruncateThemes(list_of_themes);
        datatobesaved = validateAndTruncateData(datatobesaved);
        saveUserDataToFirestore();
        db.collection('users').doc(uid).set({
            theme : main_theme,
            [`${main_theme} timetableData`]: JSON.stringify(datatobesaved),
            [`${main_theme} latest_timetable`]: JSON.stringify(convertlatestTo2DArray()),
            all_themes : Array.from(list_of_themes)
        }, { merge: true })
        .then(() => {
            //console.log('✅ Data saved successfully for user:', main_user);
            alert(`Data saved successfully for user ${main_user} !`);
            loadStoredTimetable();
        })
        .catch((error) => {
            alert(`❌ Error writing data to backend: ${error}`);
        });
    }
    catch(error){
        alert(`❌ Error saving data: ${error}`);
    }
}

async function RetrieveData() {
    if (!uid) {
        alert('❌ No user is signed in! Triggering sign in');
        login();
        return null;
    }
    try {
        let snap = await db.collection('users').doc(uid).get();
        let data = snap.data();
        theme_in_html.textContent = '';
        if(!data){
            alert(`❌ No data found for user: ${main_user}. Seems like you are using our website for the first time.`);
            //db.collection('users').doc(uid).set({}, { merge: true })
            saveUserDataToFirestore();
            return null;
        }
        list_of_themes = new Set(data.all_themes);
        if(list_of_themes){
            dropdown.innerHTML = `
            <option value=''>Select a theme...</option>
            `;
            dropdown.style.display = 'block';
            list_of_themes.forEach((theme) => {
                let option = document.createElement('option');
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
        let userretrive = data[`${main_theme} timetableData`];
        if(!userretrive){
            alert(`❌ No data under current theme "${main_theme}" found for user: ${main_user}. \nPlease save some data under this theme to display here.`);
            return null;
        }
        //console.log('✅ Data retrieved for user:', main_user);
        //console.log(JSON.parse(data[`${main_theme} latest_timetable`]));
        main_user_data = data;
        if(JSON.parse(data[`${main_theme} latest_timetable`]))
            latestTimetableData = JSON.parse(data[`${main_theme} latest_timetable`]);
        //return data;
        return JSON.parse(userretrive); 
    } catch (error) {
        alert(`❌ Error retrieving data: ${error}`);
        return null;
    }
}

async function MainThemeFunc(parameter){
    try{
        if(parameter === 1) {
            let new_theme = dropdown.value;
            if(new_theme.trim() === '')    return;
            if(new_theme === main_theme){
                alert('This is already the current theme. Please select a different one.');
                return;
            }
            if(main_theme && main_status_timetable){
                let conf = confirm(`Make sure that you have saved all your data under current theme "${main_theme}" before switching to theme "${new_theme}". \nOtherwise, all changes will be lost. \nConfirm to switch to theme "${new_theme}" ?`);
                if(!conf) return;
            }
            db.collection('users').doc(uid).set({
                theme : new_theme,
                all_themes : Array.from(list_of_themes)
            }, { merge: true })
            .then(() => {
                //alert(`Theme changed successfully to "${new_theme}" for user ${main_user} ! Reloading the page to apply changes and load data under new theme.`);
                loadStoredTimetable();
            })
            .catch((error) => {    alert(`❌ Error changing theme: ${error}`);});
        }
        if(parameter === 2) {
            if(list_of_themes.size >= 10){
                alert('Already 10 themes in your account. Cannot add more themes!')
                return;
            }
            let new_theme = prompt('Please enter new theme name:');
            if(!new_theme || new_theme.trim() === ''){
                alert('No theme name provided.');
                return;
            }
            if(list_of_themes.has(new_theme)){
                alert('This theme already exists.');
                return;
            } // Set default theme if not set
            
            // List of invalid characters in Firestore field names
            const invalidChars = ['.', '[', ']', '$', '/', '#','~', '*'];

            // Check if main_theme contains any invalid characters
            const hasInvalidChar = invalidChars.some(char => new_theme.includes(char));

            if (hasInvalidChar) {
                alert(`❌ Invalid theme name "${new_theme}". Please avoid using characters like . [ ] $ / # ~ *`);
                return;
            } 

            if(main_theme && main_status_timetable){
                let conf = confirm(`Make sure that you have saved all your data under current theme "${main_theme}" before switching to new theme "${new_theme}". \nOtherwise, all changes will be lost. \nConfirm to switch to new theme "${new_theme}" ?`);
                if(!conf) return;
            }
            list_of_themes.add(new_theme);
            db.collection('users').doc(uid).set({
                theme : new_theme,
                all_themes : Array.from(list_of_themes)
            }, { merge: true })
            .then(() => {
                //alert(`Theme changed successfully to "${new_theme}" for user ${main_user} ! Reloading the page to apply changes and load data under new theme.`);
                loadStoredTimetable();
            })
            .catch((error) => {    alert(`❌ Error adding new theme: ${error}`);});
        }
        if(parameter === 3) {
            if(!main_theme){
                alert('No current theme found. Cannot rename.');
                return;
            }
            let local_snap = await db.collection('users').doc(uid).get();
            let local_data = local_snap.data();
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
            
            // List of invalid characters in Firestore field names
            const invalidChars = ['.', '[', ']', '$', '/', '#','~', '*'];

            // Check if main_theme contains any invalid characters
            const hasInvalidChar = invalidChars.some(char => new_theme.includes(char));

            if (hasInvalidChar) {
                alert(`❌ Invalid theme name "${new_theme}". Please avoid using characters like . [ ] $ / # ~ *`);
                return;
            }

            let conf = confirm(`Make sure to have saved all data under current theme "${main_theme}" before renaming to theme "${new_theme}". \nOtherwise, all changes will be lost. \nConfirm to rename to "${new_theme}" ?`);
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
                //alert(`Theme changed successfully to "${new_theme}"! Reloading the page to apply changes and load data under the new theme.`);
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
            let conf = confirm(`Are you sure you want to delete this theme? All data, if any, under this theme will be lost. \nConfirm deleting cuurent theme "${main_theme}"?`);
            if(!conf) return;
            list_of_themes.delete(main_theme);
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
            .catch((error) => {    alert(`❌ Error deleting fields: ${error}`);});
        }
    }
    catch(error) {
        alert(`❌ Error in handling theme changes: ${error}`);
    }
}

//window.addEventListener('load', loadStoredTimetable);
//window.addEventListener('beforeunload',() => {SaveData(convertWeekTablesToStatus())});
//window.onbeforeunload = SaveData();

function file_input_first(event) {
    let file = event.target.files[0];
    console.log('File of first input has changed!');
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data = JSON.parse(e.target.result);
                main_status_timetable = data;
                //SaveData(status_timetable);
                alert('Data retrieved successfully');
                //main_container.innerHTML = '';
                remove_first();
                loadStoredTimetable(main_status_timetable,1);
            } catch (error) {
                alert(`Failed to parse the JSON file : ${error}`);
            }
        };
        reader.readAsText(file);
    } else {
        alert('No file selected.');
    }
}

function file_input_always_func(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();

        reader.onload = function(e) {
            try {
                let data = JSON.parse(e.target.result); 
                main_status_timetable = data; 
                //SaveData(status_timetable);
                alert('Data retrieved successfully');
                //main_container.innerHTML = ''; 

                attendance.style.display = 'none';

                loadStoredTimetable(main_status_timetable,1);
            } catch (error) {
                alert(`Failed to parse the JSON file : ${error}`);
            }
        };

        reader.onerror = function(error) {
            alert(`There was a problem reading the file : ${error}`);
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
    if(main_theme)  temp_span.textContent = `under theme "${main_theme}"!`;
    else temp_span.textContent = ``;
    window.scrollTo(0, document.body.scrollHeight);
}

function remove_first(){
    First.style.display = 'none';
    //First.innerHTML = '';
    change_date.style.display = 'none';
    nav.style.display = 'flex';
    //theme_in_html.textContent = `${a} ${b}`;
    displaySubjects();
}

function calculatedate(){
    return new Date().toISOString().split('T')[0];
}
function get_starting_date() {
    change_date.style.display = 'block';
    let submitButton = document.getElementById('submit-date');
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
    let cancelButton = document.getElementById('cancel-date');
    cancelButton.addEventListener('click', () => {
        change_date.innerHTML = '';
        change_date.style.display = 'none';
    });
}

function formatDate(date) {
    let day = String(date.getDate()).padStart(2, '0'); 
    let month = String(date.getMonth() + 1).padStart(2, '0'); 
    let year = date.getFullYear();
    return `${day}/${month}/${year}`; 
}

function adjustToPreviousMonday(dateString) {
    let [year, month, day] = dateString.split("-").map(Number);
    let date = new Date(year, month - 1, day); // Convert string to Date object
    if(date.getDay() === 1)    alert(`Selected date : ${dateString} is a Monday`);
    else    alert(`Selected date : ${dateString} is a ${daysOfWeek[date.getDay()]}. Adjusting to previous Monday`);
    
    // Reverse while loop to find the previous Monday
    while (date.getDay() !== 1) {
        date.setDate(date.getDate() - 1);
    }

    // Convert back to YYYY-MM-DD format
    let yyyy = date.getFullYear();
    let mm = String(date.getMonth() + 1).padStart(2, "0");
    let dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

function findNextMonday() {
    try{
    let weekTables = document.querySelectorAll('.table-section');
    if (weekTables.length === 0) return null;
    let lastWeekTable = weekTables[weekTables.length - 1];
    let weekRows = lastWeekTable.querySelectorAll('.week-row');
    if (weekRows.length === 0) return null;
    let lastRow = weekRows[weekRows.length - 1];
    let dateCell = lastRow.querySelector('.date-cell');
    let dayCell = lastRow.querySelector('.day-cell');
    let dateValue = dateCell ? dateCell.textContent.trim() : null;
    let dayValue = dayCell ? dayCell.textContent.trim() : null;
    if (!dateValue || !dayValue) return null;
    let [day, month, year] = dateValue.split('/').map(Number);
    let currentDate = new Date(year, month - 1, day);
    if (currentDate.getDay() === 1)    currentDate.setDate(currentDate.getDate() + 7);
    else{while (currentDate.getDay() !== 1)    currentDate.setDate(currentDate.getDate() + 1);}
    let nextMonday = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    return nextMonday;
    } catch(error) {
        alert(`An error occured : ${error}`);
    }
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

            row[0] = String(row[0]);
            row[0].length = 10;
            row[1] = String(row[1]);
            if(!daysOfWeek.includes(row[1]))    row[1] = 'Monday';
            row[row.length - 1] = String(row[row.length - 1]);
            if(!(row[row.length - 1] === 'Normal' || row[row.length - 1] === 'Delete'))
                row[row.length - 1] = 'Normal';
            for (let k = 2; k < row.length - 1; k++) {
                if (typeof row[k] !== "object" || row[k] === null) {
                    row[k] = { "": "" }; // Ensure it's a dictionary
                } else {
                    let entries = Object.entries(row[k]); // Convert dict to array of key-value pairs

                    if (entries.length > 0) {
                        let [key, value] = entries[0]; // Take only the first key-value pair
                        key = String(key);
                        key = key.slice(0, 100).toUpperCase(); // Truncate & uppercase key
                        let validValues = ["Present", "Absent", "no-class", ""];

                        // If the subject is empty, status must be empty
                        value = key === "" ? "" : (validValues.includes(value) ? value : "");

                        row[k] = { [key]: value }; // Replace with validated key-value pair
                    } else {
                        row[k] = { "": "" }; // Default empty dictionary
                    }
                }
            }
        });
    });

    // Show a single alert if truncation happened
    if (truncationDone)        alert("Some data exceeded limits and has been truncated.");

    // Log the max values found
    //console.log(`Max Weeks Found: ${data.length}`);
    //console.log(`Max Rows Per Week Found: ${Math.max(...data.map(week => week.length))}`);
    //console.log(`Max Entries Per Row Found: ${Math.max(...data.flatMap(week => week.map(row => row.length)))}`);

    return data;
}
//slice
function createWeeklyTables(param_timetable,monday_date,first_time) {
    //add limit of not more than 28 weektables per theme and not more than 10 themes in one account
    try{
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
        let weekSection = document.createElement('tbody');
        weekSection.className = 'table-section';
        let isFirstSection = main_container.children.length === 0;
        weekSection.style.marginTop = isFirstSection ? '0px' : '50px';

        let headerRow = document.createElement('tr');
        headerRow.className = 'week-header-row';
        let headerDate = document.createElement('th');
        headerDate.textContent = 'Date';
        headerRow.appendChild(headerDate);
        let headerDay = document.createElement('th');
        headerDay.textContent = 'Day';
        headerRow.appendChild(headerDay);

        for (let i = 1; i <= 8; i++) {
            let headerPeriod = document.createElement('th');
            headerPeriod.textContent = `${i}`;
            headerRow.appendChild(headerPeriod);
        }
        let allDay = document.createElement('th');
        allDay.textContent = 'All';
        //headerRow.appendChild(allDay);
        let deletetheDay = document.createElement('th');
        deletetheDay.textContent = 'Delete';
        //headerRow.appendChild(deletetheDay);
        weekSection.appendChild(headerRow);
        for (let i = 0; i < param_timetable.length; i++) {
            let dayRow = document.createElement('tr');
            dayRow.className = 'week-row';
            let dateCell = document.createElement('td');
            dateCell.className = 'date-cell';
            dateCell.textContent = formatDate(weekDate);
            dayRow.appendChild(dateCell);
            let dayCell = document.createElement('td');
            dayCell.className = 'day-cell';
            dayCell.textContent = daysOfWeek[weekDate.getDay()];
            dayRow.appendChild(dayCell);
            //Object.keys(param_timetable[i][j])[0]
            for (let j = 0; j < param_timetable[i].length; j++) {
                let periodCell = document.createElement('td');
                periodCell.className = 'period';
                periodCell.textContent = `${param_timetable[i][j].trim().toUpperCase().slice(0, 100)}`;
                //periodCell.contentEditable = !selectedStatus && !checkbox.checked;
                //periodCell.onclick = () => showPeriodMenu(periodCell);
                periodCell.onblur = () => {
                    periodCell.textContent = periodCell.textContent.trim().toUpperCase(); // Trim and convert to uppercase
                    if(periodCell.textContent.trim() === '')    periodCell.classList.remove('Present', 'Absent', 'no-class');
                    updateAttendanceStats(); // Update attendance stats after renaming
                }
                dayRow.appendChild(periodCell);
            }
            let allCell = document.createElement('td');
            allCell.className = 'all-cell';
            allCell.innerHTML = "<button class='all-btn'>All</button>";
            //allCell.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
            dayRow.appendChild(allCell);
            let deleteCell = document.createElement('td');
            deleteCell.innerHTML = `<button class='del-btn' onclick='deleteDay(this)'>Delete</button>`;
            deleteCell.className = 'delete-cell';
            dayRow.appendChild(deleteCell);
            weekSection.appendChild(dayRow);
            weekDate.setDate(weekDate.getDate() + 1);
        }

        main_container.appendChild(weekSection);

        let buttonContainer = document.createElement('div');
        buttonContainer.className = 'week-buttons';
        buttonContainer.style.height = `${weekSection.clientHeight}px`;

        let button1 = document.createElement('button');
        button1.textContent = 'All Week';
        button1.className = 'all-week-btn';
        //button1.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
        //button1.onclick = function() {    showAllWeekMenu(button1, weekSection);};

        let button2 = document.createElement('button');
        button2.textContent = 'Delete Week';
        button2.className = 'delete-week-btn';
        button2.onclick = () => deleteAllWeek(weekSection);

        buttonContainer.appendChild(button1);
        buttonContainer.appendChild(button2);
        //buttonContainer.appendChild(changePeriodsButton);
        let setaslatest = document.createElement('button');
        setaslatest.textContent = 'Set as latest';
        setaslatest.className = 'set-latest-btn';
        setaslatest.onclick = () => setAsLatest(weekSection);
        buttonContainer.appendChild(setaslatest);

        let copydaywise = document.createElement('button');
        copydaywise.textContent = 'Copy day wise status of weektable';
        copydaywise.className = 'copy-day-wise';
        copydaywise.onclick = () => converttableto2Darraydictstatus(weekSection);
        buttonContainer.appendChild(copydaywise);

        let pastedaywise = document.createElement('button');
        pastedaywise.textContent = 'Paste and update day wise status of weektable';
        pastedaywise.className = 'paste-day-wise';
        pastedaywise.onclick = () => updatestatustoweektable(weekSection);
        buttonContainer.appendChild(pastedaywise);

        weekSection.insertBefore(buttonContainer,weekSection.firstChild);
        buttonContainer.style.height = window.getComputedStyle(weekSection).height;
        if(!main_status_timetable)  main_status_timetable = [];
        if(convertWeekToStatus(weekSection).length) main_status_timetable.push(convertWeekToStatus(weekSection));
        updateAttendanceStats();
        //console.log(main_status_timetable);
    } catch(error) {
        alert(`An error occured : ${error}`);
    }
}

async function loadStoredTimetable(data_if_passed,onload) {
    try{
        list_of_deleted = new Set();
        resetlatest();
        capitalizelatest();
        //document.querySelector('input[name="status"][value=""]').click();
        main_status_timetable = data_if_passed || await RetrieveData();
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
            let headerRow = document.createElement('tr');
            headerRow.className = 'week-header-row';
            let headerDate = document.createElement('th');
            headerDate.textContent = 'Date';
            headerRow.appendChild(headerDate);
            let headerDay = document.createElement('th');
            headerDay.textContent = 'Day';
            headerRow.appendChild(headerDay);
            for (let head = 1; head <= weekTable[0].length - 3 ; head++) {
                let headerPeriod = document.createElement('th');
                headerPeriod.textContent = `${head}`;
                headerRow.appendChild(headerPeriod);
            }
            weekSection.appendChild(headerRow);
            for(let j = 0; j < weekTable.length; j++) {
                let row = weekTable[j];
                if(row[row.length - 1] === "Delete") continue;
                let weekRow = document.createElement('tr');
                weekRow.className = 'week-row';
                let dateCell = document.createElement('td');
                dateCell.className = 'date-cell';
                dateCell.textContent = row[0];
                weekRow.appendChild(dateCell);
                let dayCell = document.createElement('td');
                dayCell.className = 'day-cell';
                dayCell.textContent = row[1];
                weekRow.appendChild(dayCell);
                for (let k = 2; k < row.length - 1; k++) {
                    let periodCell = document.createElement('td');
                    periodCell.className = 'period';
                    periodCell.textContent = Object.keys(row[k])[0].trim().toUpperCase().slice(0, 100);
                    //periodCell.contentEditable = !selectedStatus && !checkbox.checked;
                    if(Object.values(row[k])[0] !== '') periodCell.classList.add(`${Object.values(row[k])[0]}`);
                    //periodCell.onclick = () => showPeriodMenu(periodCell);
                    periodCell.onblur = () => {
                        periodCell.textContent = periodCell.textContent.trim().toUpperCase().slice(0, 100); // Trim and convert to uppercase
                        if(periodCell.textContent.trim() === '')    periodCell.classList.remove('Present', 'Absent', 'no-class');
                        updateAttendanceStats(); // Update attendance stats after renaming
                    }
                    weekRow.appendChild(periodCell);
                }
                let allCell = document.createElement('td');
                allCell.className = 'all-cell';
                allCell.innerHTML = "<button class='all-btn'>All</button>";
                //allCell.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
                weekRow.appendChild(allCell);
                let deleteCell = document.createElement('td');
                deleteCell.innerHTML = `<button class='del-btn' onclick='deleteDay(this)'>Delete</button>`;
                deleteCell.className = 'delete-cell';
                weekRow.appendChild(deleteCell);
                weekSection.appendChild(weekRow);
            }
            let buttonContainer = document.createElement('div');
            buttonContainer.className = 'week-buttons';

            let button1 = document.createElement('button');
            button1.textContent = 'All Week';
            button1.className = 'all-week-btn';
            //button1.style.display = document.querySelector('input[name="status"]:checked').value === '' ? 'none' : '';
            //button1.onclick = function() {    showAllWeekMenu(button1, weekSection);};

            let button2 = document.createElement('button');
            button2.textContent = 'Delete Week';
            button2.className = 'delete-week-btn';
            button2.onclick = function() {    deleteAllWeek(weekSection)};

            buttonContainer.appendChild(button1);
            buttonContainer.appendChild(button2);
            
            //buttonContainer.appendChild(changePeriodsButton);
            
            let setaslatest = document.createElement('button');
            setaslatest.textContent = 'Set as latest';
            setaslatest.className = 'set-latest-btn';
            setaslatest.onclick = () => setAsLatest(weekSection);
            buttonContainer.appendChild(setaslatest);

            let copydaywise = document.createElement('button');
            copydaywise.textContent = 'Copy day wise status of weektable';
            copydaywise.className = 'copy-day-wise';
            copydaywise.onclick = () => converttableto2Darraydictstatus(weekSection);
            buttonContainer.appendChild(copydaywise);
            
            let pastedaywise = document.createElement('button');
            pastedaywise.textContent = 'Paste and update day wise status of weektable';
            pastedaywise.className = 'paste-day-wise';
            pastedaywise.onclick = () => updatestatustoweektable(weekSection);
            buttonContainer.appendChild(pastedaywise);

            weekSection.insertBefore(buttonContainer,weekSection.firstChild);
            main_container.appendChild(weekSection);
            buttonContainer.style.height = window.getComputedStyle(weekSection).height;
        }
        if (!document.querySelectorAll('.week-row').length) return first();
        //showlatest();
        //resetlatest();
        First.style.display = "none";
        //change_date.innerHTML = '';
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
        if(onload)  scrollToButtonWithOffset(document.getElementById('add-week-btn'));
    }
    catch(error){
        //console.error(error);
        alert(`❌ Error loading data to html page: ${error}\nRedirecting to first spawn`);
        //console.error(error);
        return first();
    };
}

function capitalizelatest(){
    latestTimetable.querySelectorAll('td').forEach((cell) => {
        cell.textContent = cell.textContent.trim().toUpperCase();
        cell.onblur = () => {
            cell.textContent = cell.textContent.trim().toUpperCase().slice(0, 100);
            //updateAttendanceStats();
        }
    });
    updateAttendanceStats();
}

function converttableto2Darraydict(weektable) {
    let weekData = {};
    let rows = weektable.querySelectorAll('.week-row');
    rows.forEach((row) => {
        let day = row.querySelector('.day-cell').textContent.trim();
        let periods = [];
        let periodCells = row.querySelectorAll('.period');
        periodCells.forEach((cell) => {
            let subject = cell.textContent.trim();
            periods.push(subject);
        });
        weekData[day] = periods;
    });
    updateAttendanceStats();
    return weekData;
}

function converttableto2Darraydictstatus(weektable) {
    let weekData = {};
    let rows = weektable.querySelectorAll('.week-row');
    rows.forEach((row) => {
        let day = row.querySelector('.day-cell').textContent.trim();
        let periods = [];
        let periodCells = row.querySelectorAll('.period');
        periodCells.forEach((cell) => {
            let subject = cell.textContent.trim();
            let periodStatus = '';
            if (cell.classList.contains('Present')) {
                periodStatus = 'Present';
            } else if (cell.classList.contains('Absent')) {
                periodStatus = 'Absent';
            } else if (cell.classList.contains('no-class')) {
                periodStatus = 'no-class';
            }
            if(!subject)    periodStatus='';
            periods.push({ [subject]: periodStatus });
        });
        weekData[day] = periods;
    });
    navigator.clipboard.writeText(JSON.stringify(weekData))
    .then(() => {    
        alert("Text copied to clipboard!");
        updateAttendanceStats();
    })
    .catch(error => {    alert(`Failed to copy: ${error}`);});
}

function copylatest(){
    navigator.clipboard.writeText(JSON.stringify(convertlatestTo2DArray()))
    .then(() => {    
        alert("Text copied to clipboard!");
        updateAttendanceStats();
    })
    .catch(error => {    alert(`Failed to copy: ${error}`);});
}

function pastelatest(){
    try{
        let statusdata = JSON.parse(prompt('Enter 2D array to update latest timetable'));
        if (!statusdata) {
            alert('No data received');
            return;
        }
        let rows = latestTimetable.querySelectorAll('tbody tr');
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i].querySelectorAll('td');
            let statusrow = statusdata[i];
            for(let j = 0;j < row.length;j++){
                let cell = row[j];
                let celldata = statusrow[j];
                if(cell && celldata){
                    cell.textContent = celldata.trim().toUpperCase().slice(0, 100);
                }
            }
        }
    }
    catch(error){
        alert(`An error occured : ${error}`);
    }
    finally{
        updateAttendanceStats();
    }
}

function updatestatustoweektable(weektable) {
    try{
        let statusdata = JSON.parse(prompt('Enter weekdata status that will be used for updating corresponding weektable'));
        if (!statusdata) {
            alert('No data received');
            return;
        }
        let rows = weektable.querySelectorAll('.week-row');
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let nodedayvalue = row.querySelector('.day-cell');
            let dayName = nodedayvalue.textContent.trim(); // Corrected extraction
            let dayvalue = statusdata[dayName];
            if(dayvalue){
                let periods = row.querySelectorAll('.period');
                for (let j = 0; j < dayvalue.length; j++) {
                    if (periods[j]) { // Ensure period exists before modifying
                        let key = Object.keys(dayvalue[j])[0];
                        let value = Object.values(dayvalue[j])[0];
                        periods[j].textContent = key.trim().toUpperCase().slice(0, 100);
                        periods[j].classList.remove('Present', 'Absent', 'no-class');
                        if(!periods[j].textContent) value='';
                        if (value !== '') periods[j].classList.add(value);
                    }
                }
            }
        }
    }
    catch(error){
        alert(`An error occured : ${error}`);
    }
    finally{
        updateAttendanceStats();
    }
}

function convertlatestTo2DArray() {
    if (!latestTimetable) {
        console.error("Table structure missing!");
        return [];
    }

    let rows = latestTimetable.querySelectorAll("tbody tr"); // Select all rows
    let tableArray = [];

    rows.forEach(row => {
        let rowData = [];
        let cells = row.querySelectorAll("td"); // Select all cells, excluding the day label

        cells.forEach(cell => rowData.push(cell.textContent.trim())); // Push cell content into array
        tableArray.push(rowData);
    });
    //updateAttendanceStats();
    return tableArray;
}

function populateTableFromArray(tableArray) {
    let latestTimetable = document.getElementById("latest-timetable");
    let rows = latestTimetable.querySelectorAll("tbody tr"); // Select all rows
    for(let i=0;i<rows.length;i++){
        let cells = rows[i].querySelectorAll("td"); // Select all cells, excluding the day label
        for(let j=0;j<cells.length;j++)    cells[j].textContent = tableArray[i][j]; // Update cell content
    }
    updateAttendanceStats();
}

function setAsLatest(weekSection) {
    let weekData = converttableto2Darraydict(weekSection);
    let rows = latestTimetable.querySelectorAll("tbody tr"); // Select all rows

    rows.forEach(row => {
        let dayCell = row.querySelector("th"); // Select the first cell (Day label)
        let subjectCells = row.querySelectorAll("td"); // Select editable subject cells

        let dayName = dayCell?.textContent.trim(); // Extract day name
        if (!dayName || !weekData.hasOwnProperty(dayName)) return; // Skip if day is missing in weekData

        let subjects = weekData[dayName]; // Get subject list for this day

        subjects.forEach((subject, index) => {
            if (subjectCells[index]) {
                subjectCells[index].textContent = subject; // Update subject cell
            }
        });
    });
    updateAttendanceStats();
}

function showlatest(){
    let latest_btn = document.getElementById('show-latest-btn');
    let th3 = document.getElementById("latest_timetable_heading");
    if(latest_btn.textContent === 'Show Latest Timetable') {
        latest_btn.textContent = 'Hide Latest Timetable';
        latestTimetable.style.display = 'table';
        th3.style.display = 'block';
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

let container = document.getElementById('period-container');
function displaySubjects() {

    let uniquePeriodNames = new Set(); 
    const validClasses = ["Present", "Absent", "no-class", "period"]; // Allowed classes
    document.querySelectorAll('.period').forEach((cell) => {
        let periodName = cell.textContent.trim().slice(0, 100).toUpperCase();
        cell.textContent = periodName;

        const validClasses = new Set(["Present", "Absent", "no-class", "period", ""]); // Faster lookup

        Array.from(cell.classList).forEach(cls => {
            if (!validClasses.has(cls)) {
                cell.classList.remove(cls);
            }
        });

        // If periodName is empty, remove "Present", "Absent", "no-class"
        // If periodName is empty, remove all three status classes at once
        if (periodName === "") {
            cell.classList.remove("Present", "Absent", "no-class");
        }

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
    
    document.dispatchEvent(customevent);
    finalizedata();
    
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
            let date = row.querySelector('.date-cell').textContent.trim(); 
            let periodCells = Array.from(row.getElementsByClassName('period'));
            periodCells.forEach(cell => {
                let subject = cell.textContent.trim(); 
                if (!subject) return;  

                let period = periodCells.indexOf(cell) + 1;  

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


    let attendanceContainer = document.createElement('div');
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
        let subjectData = subjectsAttendance[subject];
        let subjectDisplay = document.createElement('div');
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
                    let dateEntry = subjectData.dates[k];
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

    let firstDateCell = weekTable.querySelector('td:first-child'); 
    let lastDayRow = weekTable.querySelectorAll('tr')[weekTable.rows.length - 1];
    let lastDateCell = lastDayRow.querySelector('td:first-child'); 

    let startDate = firstDateCell ? firstDateCell.textContent.trim() : 'Unknown';
    let endDate = lastDateCell ? lastDateCell.textContent.trim() : 'Unknown';

    let askbeforedelete = confirm(`Are you sure you want to delete the entire week's Attendance from ${startDate} to ${endDate}?`);
    if (!askbeforedelete) return;
    let rows = weekTable.querySelectorAll('.week-row');
    let rowdates = [];
    rows.forEach(row =>    rowdates.push(row.querySelector('.date-cell').textContent.trim()));
    //addtodeleted(`${startDate} - ${endDate}`,convertWeekToStatus(weekTable));
    outerloop : for(let k=0;k<rowdates.length;k++){
        let date = rowdates[k];
        let periods = rows[k].querySelectorAll('.period');
        midloop : for(let i=0;i<main_status_timetable.length;i++){
            for(let j=0;j<main_status_timetable[i].length;j++){
                let dayrow = main_status_timetable[i][j];
                if(dayrow[0] === date){
                    dayrow[dayrow.length - 1] = 'Delete';
                    for(let k=2;k<dayrow.length-1;k++){
                        let periodCell = periods[k-2];
                        let periodName = periodCell.textContent.trim(); 
                        let periodStatus = ''; 

                        if (periodCell.classList.contains('Present')) {
                            periodStatus = 'Present';
                        } else if (periodCell.classList.contains('Absent')) {
                            periodStatus = 'Absent';
                        } else if (periodCell.classList.contains('no-class')) {
                            periodStatus = 'no-class';
                        }
                        if(!periodName) periodStatus = '';
                        periodName = periodName.slice(0, 100);
                        dayrow[k] = { [periodName]: periodStatus };   

                    }
                    list_of_deleted.add(dayrow[0]);
                    break midloop;
                }
            }
        }
    }
    loadStoredTimetable(main_status_timetable);
    //weekTable.remove(); 
    updateAttendanceStats();
}

function deleteDay(cell) {
    let row = cell.closest('.week-row');
    let date = row.querySelector('.date-cell').textContent;
    let day = row.querySelector('.day-cell').textContent;
    let periods = row.querySelectorAll('.period');
    let askbeforedelete = confirm(`Are you sure you want to delete Attendance of date ${date} (${day})?`);
    if(!askbeforedelete)    return;
    outerloop : for(let i=0;i<main_status_timetable.length;i++){
        for(let j=0;j<main_status_timetable[i].length;j++){
            let dayrow = main_status_timetable[i][j];
            if(dayrow[0] === date){
                dayrow[dayrow.length - 1] = 'Delete';
                for(let k=2;k<dayrow.length-1;k++){
                    let periodCell = periods[k-2];
                    let periodName = periodCell.textContent.trim(); 
                    let periodStatus = ''; 

                    if (periodCell.classList.contains('Present')) {
                        periodStatus = 'Present';
                    } else if (periodCell.classList.contains('Absent')) {
                        periodStatus = 'Absent';
                    } else if (periodCell.classList.contains('no-class')) {
                        periodStatus = 'no-class';
                    }
                    if(!periodName) periodStatus = '';
                    periodName = periodName.slice(0, 100);
                    dayrow[k] = { [periodName]: periodStatus };   

                }
                list_of_deleted.add(dayrow[0]);
                break outerloop;
            }
        }
    }
    loadStoredTimetable(main_status_timetable);
    updateAttendanceStats();
}
function finalizedata(){
    let weekRows = document.querySelectorAll(".week-row");
    for(let k=0;k<weekRows.length;k++){
        let rownode = weekRows[k];
        let rownodedate = rownode.querySelector(".date-cell").textContent.trim();
        if(!main_status_timetable || main_status_timetable.length === 0)    return;
        mainloop : for(let i=0;i<main_status_timetable.length;i++){
            for(let j=0;j<main_status_timetable[i].length;j++){
                let dayrow = main_status_timetable[i][j];
                //console.log(`Final data : html website date : ${rownodedate}, data variable date : ${dayrow[0]}`)
                if(dayrow[0] === rownodedate){
                    let rownodeperiods = rownode.querySelectorAll(".period");
                    for(let l=2;l<dayrow.length-1;l++){
                        let periodCell = rownodeperiods[l-2]; 
                        let periodName = rownodeperiods[l-2].textContent.trim(); 
                        let periodStatus = ''; 
                        if (periodCell.classList.contains('Present')) {
                            periodStatus = 'Present';
                        } else if (periodCell.classList.contains('Absent')) {
                            periodStatus = 'Absent';
                        } else if (periodCell.classList.contains('no-class')) {
                            periodStatus = 'no-class';
                        }
                        if(!periodName) periodStatus='';
                        periodName = periodName.slice(0, 100);
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
    let status_timetable = [];

    let weekTables = document.querySelectorAll('.table-section');
    if (weekTables.length === 0) return null;

    weekTables.forEach((weekTable) => {

        let weekData = convertWeekToStatus(weekTable);
        status_timetable.push(weekData);
    });
    return status_timetable;
}

function convertWeekToStatus(weekTable) {
    let weekData = []; 

    let rows = weekTable.querySelectorAll('.week-row');
    rows.forEach((row) => {

        let rowData = convertRowToStatus(row);
        if(!if_there_already(rowData[0]))    weekData.push(rowData);
    });
    return weekData;
}

function convertRowToStatus(row) {
    let rowData = []; 

    let dateValue = row.querySelector('.date-cell').textContent.trim();
    let dayValue = row.querySelector('.day-cell').textContent.trim();

    rowData.push(dateValue || ''); 
    rowData.push(dayValue || '');   

    let periodCells = row.querySelectorAll('.period');
    periodCells.forEach((periodCell) => {
        let periodName = periodCell.textContent.trim(); 
        let periodStatus = ''; 

        if (periodCell.classList.contains('Present')) {
            periodStatus = 'Present';
        } else if (periodCell.classList.contains('Absent')) {
            periodStatus = 'Absent';
        } else if (periodCell.classList.contains('no-class')) {
            periodStatus = 'no-class';
        }
        if(!periodName) periodStatus = '';
        periodName = periodName.slice(0, 100);
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
    document.dispatchEvent(customevent);
    // Remove existing popup if already open
    let existingPopup = document.getElementById("popup");
    if (existingPopup) existingPopup.remove();
    let existingOverlay = document.getElementById("popup-overlay");
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
    document.dispatchEvent(customevent);
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
    let jsonString = JSON.stringify(status_timetable,null,4);

    let blob = new Blob([jsonString], { type: 'application/json' });

    let link = document.createElement('a');
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
    let buttonPosition = button.getBoundingClientRect().top + window.scrollY;
    let offset = 123; 
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
    let menu = document.createElement('div');
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

    let periodNameInput = menu.querySelector('.period-name-input');
    let okButton = menu.querySelector('.ok-button');
    //periodNameInput.focus();
    menu.addEventListener('keydown',function(e){    if(e.key === 'Enter'){okButton.click();}})
    
    okButton.addEventListener('click', () => {
        let selectedStatus = menu.querySelector('input[name='Attendance']:checked')?.value;
        let newPeriodName = periodNameInput.value.trim();

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
    let cancelButton = menu.querySelector('.cancel-button');
    cancelButton.addEventListener('click', () => {
        menu.remove(); 
    });
}

function showAllDayMenu(cell) {

    let menu = document.createElement('div');
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
    let okButton = menu.querySelector('.ok-button');
    menu.addEventListener('keydown',function(e){    if(e.key === 'Enter'){okButton.click();}})

    okButton.addEventListener('click', () => {
        let selectedStatus = menu.querySelector('input[name='all-Attendance']:checked')?.value;
        if (!selectedStatus) return;
        let row = cell.closest('tr');
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
    let cancelButton = menu.querySelector('.cancel-button');
    cancelButton.addEventListener('click', () => {
        menu.remove(); 
    });
}

function showAllWeekMenu(button, weekTable) {

    let menu = document.createElement('div');
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
    let okButton = menu.querySelector('.ok-button');
    menu.addEventListener('keydown',function(e){    if(e.key === 'Enter'){okButton.click();}})
    okButton.addEventListener('click', () => {
        let selectedStatus = menu.querySelector('input[name='all-Attendance']:checked')?.value;
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
    let cancelButton = menu.querySelector('.cancel-button');
    cancelButton.addEventListener('click', () => {
        menu.remove(); 
    });
}
function showMenu(button, menu) {

    document.querySelectorAll('.all-menu').forEach(existingMenu => existingMenu.remove());
    document.querySelectorAll('.Attendance-menu').forEach(menu => menu.remove());

    let buttonRect = button.getBoundingClientRect();
    let menuRect = menu.getBoundingClientRect();

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
    
    let observer = new MutationObserver(mutations => {
        mutations.forEach(_ => {
            if (!document.body.contains(button)) {
                menu.remove(); 
                observer.disconnect(); 
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}


function updateSubjectsInTimetable() {
    let updated_timetable = [[], [], [], [], []];  
    let weekTables = document.querySelectorAll('.table-section');
    if (weekTables.length === 0)    return null;
    weekTables.forEach((weekTable) => {
        let rows = weekTable.querySelectorAll('.week-row');
        rows.forEach((row) => {
            let dayCell = row.querySelector('.day-cell');
            if (!dayCell) return;  
            let day = dayCell.textContent.trim();  
            let subjectCells = row.querySelectorAll('.period');
            let Subjects=[];
            subjectCells.forEach((subjectCell, index) => {
                let subjectName = subjectCell.textContent.trim();  
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
*/
