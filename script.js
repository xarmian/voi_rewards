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
        
        let totalBlocks = 0;
        let totalWallets = 0;
	let totalVoi = 0;
 
        rows.forEach(row => {
            const columns = row.split(',');
            if (columns.length < 4) return;

            const tr = document.createElement('tr');
            
            columns.forEach((col, index) => {
                const td = document.createElement('td');
            
                // If it's the third column, add a percent symbol
                if (index === 2) {
                    col += '%';
                }
                // If it's the second column, accumulate the total
                if (index === 1) {
                    totalBlocks += parseInt(col);
                }
		if (index === 3) {
		    totalVoi += parseFloat(col);
		}

                td.textContent = col;
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
            totalWallets++;
        });

        document.getElementById('totalBlocks').textContent = `Total blocks: ${totalBlocks}`;
        document.getElementById('totalWallets').textContent = `Total wallets: ${totalWallets}`;
        document.getElementById('totalVoi').textContent = `Total Voi: ${Math.round(totalVoi * Math.pow(10,6)) / Math.pow(10,6)}`;
    });
}

