<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Self Attendance</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/png" href="prajwal.png">
</head>
<body>
    <h1 class="theme"></h1>
    <div id="first-time"></div>
    <table>
        <tbody id="table-container"></tbody>
    </table>
    <button onclick="
    createWeeklyTables('table-container',updateSubjectsInTimetable());
    scrollToButtonWithOffset(this);
    "
    class="add-week-btn" id="add-week-btn">Add New Week</button>
    <div id="first-time-date"></div>
    <!--
    <button onclick="restore()" class="restore-btn">Restore deleted rows and weeks</button><br>
    -->
    <br><button class="attendance-btn" 
    onclick="updateAttendanceStats()">Update Attendance and Display</button><br>
    <button onclick="SaveData();" class="saved-btn">Save Data</button>
    <button onclick="downloadAsJSON();" class="download-btn">
    Download Data as JSON FILE(optional)</button>
    <input type="file" id="file_input_always" class="user_input_file"><br><br>
    <div id="period-container"></div>
    <div id="attendance-display-section"></div>
    <script src="script.js"></script>
</body>
</html>
