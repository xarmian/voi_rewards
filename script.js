let aggregatedNFDs = [];
let allAddresses = [];

document.addEventListener('DOMContentLoaded', function () {
    populateDateDropdown();
});

const filterInput = document.createElement('input');
filterInput.id = 'wallet_filter';
filterInput.type = 'text';
filterInput.placeholder = 'Filter by wallet...';
filterInput.addEventListener('input', () => {
  const filterValue = filterInput.value.toLowerCase();
  const rows = document.querySelectorAll('#dataTable tbody tr');

  rows.forEach(row => {
    const wallet = row.querySelector('td:first-child').textContent.toLowerCase();
    if (wallet.includes(filterValue)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});
document.querySelector('#wallet_column').appendChild(filterInput);

const totalVoiInput = document.querySelector('#totalVoi input');
totalVoiInput.addEventListener('input', () => {
  const newTotalVoi = Number(totalVoiInput.value);
  const totalBlocks = Number(document.querySelector('#totalBlocks span').textContent.replace(',', ''));
  const rows = document.querySelectorAll('#dataTable tbody tr');

  rows.forEach(row => {
    const blocksCell = row.querySelector('td:nth-child(3)');
    const rewardsCell = row.querySelector('td:nth-child(2)');
    const blocks = parseInt(blocksCell.textContent);
    rewardsCell.textContent = Math.round(blocks / totalBlocks * newTotalVoi * Math.pow(10,6)) / Math.pow(10,6);
  });

  //document.querySelector('#totalBlocks span').textContent = Math.round(newTotalVoi * totalBlocks / 50);
});

function populateDateDropdown() {
    // List all your CSV file dates here
    const availableDates = ["20230918-20230924"];
    const dropdown = document.getElementById('datePicker');

    availableDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        // convert `date` to human readable format
        option.textContent = date.replace(/(\d{4})(\d{2})(\d{2})-(\d{4})(\d{2})(\d{2})/, '$1-$2-$3 to $4-$5-$6');
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
            dataArrays.sort((a, b) => Number(b[3]) - Number(a[3]));

            const tableBody = document.getElementById('dataTable').querySelector('tbody');
            tableBody.innerHTML = ''; // clear previous data

            let totalBlocks = 0;
            let totalWallets = 0;
            let totalVoi = 0;

            dataArrays.forEach(columns => {
                if (columns.length < 4) return;

                const tr = document.createElement('tr');

                // Format first column
                const td1 = document.createElement('td');
                allAddresses.push(columns[0]);
                td1.textContent = columns[0];
                tr.appendChild(td1);

                // Skip second column

                // Format third column
                const td3 = document.createElement('td');
                /*totalVoi += Number(columns[2]);
                td3.textContent = Math.round(columns[2] / Math.pow(10, 6) * 1000000) / 1000000;*/
                td3.textContent = '';
                tr.appendChild(td3);

                // Format fourth column
                const td4 = document.createElement('td');
                totalBlocks += parseInt(columns[3]);
                td4.textContent = columns[3];
                tr.appendChild(td4);

                // Format fifth column
                const td5 = document.createElement('td');
                td5.textContent = Math.round(columns[4] * 1000) / 10 + '%';
                tr.appendChild(td5);

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
            
            
        document.querySelector('#totalBlocks span').textContent = totalBlocks;
        document.querySelector('#totalWallets span').textContent = totalWallets;
        document.querySelector('#totalVoi input').dispatchEvent(new Event('input'));
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