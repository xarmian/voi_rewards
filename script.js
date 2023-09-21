let aggregatedNFDs = [];
let allAddresses = [];

document.addEventListener('DOMContentLoaded', function () {
    populateDateDropdown();
});

function populateDateDropdown() {
    // List all your CSV file dates here
    const availableDates = ["2023-09-20", "2023-09-19"];
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
            const dataArrays = rows.map(row => row.split(','));
            dataArrays.sort((a, b) => Number(b[1]) - Number(a[1]));

            const tableBody = document.getElementById('dataTable').querySelector('tbody');
            tableBody.innerHTML = ''; // clear previous data

            let totalBlocks = 0;
            let totalWallets = 0;
            let totalVoi = 0;

            dataArrays.forEach(columns => {
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
                    if (index == 0) {
                        allAddresses.push(col);
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

            aggregatedNFDs = [];
            getNFD(allAddresses).then(()=>{
                const tablerows = tableBody.querySelectorAll('tr');
            
                tablerows.forEach((row, index) => {
                    const firstCell = row.querySelector('td:first-child');
                    const correspondingNFD = aggregatedNFDs.find(nfd => nfd.key === allAddresses[index]);
                    if (correspondingNFD) {
                        firstCell.textContent = correspondingNFD.replacementValue;
                    }
                });
            });
            
            
            document.getElementById('totalBlocks').textContent = `Total blocks: ${totalBlocks}`;
            document.getElementById('totalWallets').textContent = `Total wallets: ${totalWallets}`;
            document.getElementById('totalVoi').textContent = `Total Voi: ${Math.round(totalVoi * Math.pow(10, 6)) / Math.pow(10, 6)}`;
        });
}



async function getNFD(data) {
    let addressChunks = [];
    let chunkSize = 20;

    for (let i = 0; i < data.length; i += chunkSize) {
        addressChunks.push(data.slice(i, i + chunkSize));
    }

    const allFetches = addressChunks.map((addressChunk, index) => {
        let url = "https://api.nf.domains/nfd/lookup?";
        let params = new URLSearchParams();

        addressChunk.forEach(address => {
            params.append("address", address);
        });

        params.append("view", "tiny");
        params.append("allowUnverified", "true");

        url += params.toString();

        return fetch(url)
            .then(response => response.json())
            .then(additionalData => {
                Object.entries(additionalData).forEach(([key, value]) => {
                    const replacementValue = value.name;
                    aggregatedNFDs.push({ key, replacementValue });
                });
            })
            .catch(error => console.error("Error fetching additional data:", error));
    });

    await Promise.all(allFetches);
    return aggregatedNFDs;
}