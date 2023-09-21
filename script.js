document.addEventListener('DOMContentLoaded', function() {
    populateDateDropdown();
});

function populateDateDropdown() {
    // List all your CSV file dates here
    const availableDates = ["2023-09-20"];
    const dropdown = document.getElementById('datePicker');

    availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dropdown.appendChild(option);
    });

    dropdown.selectedIndex = 0;
    loadData();
}

function loadData() {
    const date = document.getElementById('datePicker').value;
    const url = `${date}.csv`;

    fetch(url)
    .then(response => response.text())
    .then(data => {
        const rows = data.split('\n').slice(1); // skip header row
        const tableBody = document.getElementById('dataTable').querySelector('tbody');
        tableBody.innerHTML = ''; // clear previous data
        
        rows.forEach(row => {
            const columns = row.split(',');
            const tr = document.createElement('tr');
            
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = col;
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });
    });
}

