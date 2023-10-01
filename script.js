const VOI_BLOCK_REWARDS = 12500000;
const VOI_HEALTH_REWARDS = 10000000;

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
filterInput.addEventListener('click', event => {
  event.stopPropagation();
});
document.querySelector('#wallet_column').appendChild(filterInput);

const calcRewards = () => {
  const block_rewards = Number(document.querySelector('#blockVoiPoolTotal').value.replace(/,/g, ''));
  const health_rewards = Number(document.querySelector('#healthVoiPoolTotal').value.replace(/,/g, ''));
  const totalBlocks = Number(document.querySelector('#totalBlocks span').textContent.replace(/,/g, '')); 

  const hn = document.querySelector('#totalHealthyNodes span');
  const totalHealthyNodes = Number(hn.textContent.replace(',', '')) - Number(hn.getAttribute('empty_nodes'));
 
  const rows = document.querySelectorAll('#dataTable tbody tr');

  rows.forEach(row => {
    const blocksCell = row.querySelector('td:nth-child(2)');
    const rewardsCell = row.querySelector('td:nth-child(3)');
    const healthCell = row.querySelector('td:nth-child(4)');
    const totalCell = row.querySelector('td:nth-child(5)');

    const blocks = parseInt(blocksCell.textContent);
    rewardsCell.textContent = Math.round(blocks / totalBlocks * block_rewards * Math.pow(10,6)) / Math.pow(10,6);
    // set percentCell to percentage of total blocks
    blocksCell.textContent = `${blocks} (${(blocks / totalBlocks * 100).toFixed(2)}%)`;

    // calculate health rewards
    const healthScore = parseFloat(row.querySelector('td:nth-child(4)').getAttribute('health_score'));
    const healthDivisor = parseFloat(row.querySelector('td:nth-child(4)').getAttribute('health_divisor'));
    
    // calculate health reward as VOI_HEALTH_REWARDS / TOTAL_HEALTHY_NODES / HEALTH_DIVISOR
    const healthReward = (healthScore >= 5) ? Math.round(health_rewards / totalHealthyNodes / healthDivisor * Math.pow(10,6)) / Math.pow(10,6) : 0;
    healthCell.textContent = isNaN(healthReward) ? '0' : healthReward.toFixed(6);

    const totalRewards = Math.round((blocks / totalBlocks * block_rewards + healthReward) * Math.pow(10,6)) / Math.pow(10,6);
    totalCell.textContent = totalRewards;

  });

  // Add event listeners to blockVoiPoolTotal and healthVoiPoolTotal input fields
const blockVoiPoolTotal = document.querySelector('#blockVoiPoolTotal');
blockVoiPoolTotal.addEventListener('input', calcRewards);

const healthVoiPoolTotal = document.querySelector('#healthVoiPoolTotal');
healthVoiPoolTotal.addEventListener('input', calcRewards);

    // console log the sum of column 3
    console.log('sum of column 3: '+Array.from(document.querySelectorAll('#dataTable tbody tr td:nth-child(3)')).reduce((a,b)=>a+parseFloat(b.textContent),0));
    // console log the sum of column 4
    console.log('sum of column 4: '+Array.from(document.querySelectorAll('#dataTable tbody tr td:nth-child(4)')).reduce((a,b)=>a+parseFloat(b.textContent),0));

}

document.querySelectorAll('#dataTable th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const rows = Array.from(document.querySelectorAll('#dataTable tbody tr'));
    const sortDirection = (th.classList && th.classList.contains('asc')) ? -1 : 1;
    const sortIndex = th.cellIndex;
    rows.sort((a, b) => {
      const aValue = getCellValue(a, sortIndex);
      const bValue = getCellValue(b, sortIndex);
      if (aValue === bValue) {
        return 0;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * sortDirection;
      } else if (typeof aValue === 'number') {
        return -sortDirection;
      } else if (typeof bValue === 'number') {
        return sortDirection;
      } else {
        return aValue.localeCompare(bValue) * sortDirection;
      }
    });
    rows.forEach(row => document.querySelector('#dataTable tbody').appendChild(row));
    document.querySelectorAll('#dataTable th.sortable i').forEach(icon => icon.classList.remove('fa-sort-up', 'fa-sort-down'));
    if (th.querySelector('i')) {
      th.querySelector('i').classList.add(sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down');
    }
    th.classList.toggle('asc');
    th.classList.toggle('desc');
  });
});

function populateDateDropdown() {
  const dropdown = document.getElementById('datePicker');
  const url = 'https://socksfirstgames.com/proposers/';
  fetch(url, { cache: 'no-store' })
    .then(response => response.json())
    .then(data => {
      const minTimestamp = new Date(data.min_timestamp);
      const maxTimestamp = new Date(data.max_timestamp);
      const dates = [];
      let currentDate = new Date(minTimestamp.toISOString().substring(0, 10) + 'T00:00:00Z');
      while (currentDate <= maxTimestamp) {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6); // Sunday
        const dateStr = `${startOfWeek.toISOString().substring(0, 10).replace(/-/g, '')}-${endOfWeek.toISOString().substring(0, 10).replace(/-/g, '')}`;
        dates.push(dateStr);
        currentDate.setUTCDate(currentDate.getUTCDate() + 7); // Next week
      }
      dates.reverse().forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date.replace(/(\d{4})(\d{2})(\d{2})-(\d{4})(\d{2})(\d{2})/, '$1-$2-$3 to $4-$5-$6');
        dropdown.appendChild(option);
      });
      dropdown.selectedIndex = 0;
      loadData();
    })
    .catch(error => {
      console.error(error);
    });
}

function getCellValue(row, index) {
    const cell = row.cells[index];
    const text = cell.textContent.trim();
    return isNaN(text) ? text : parseFloat(text);
}

function loadData() {
  const overlay = document.querySelector('.overlay');
  overlay.style.display = 'flex';
  
    const date = document.getElementById('datePicker').value;

    // derive start and end dates from the selected date of format YYYYMMDD-YYYYMMDD
    const startDate = date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8);
    const endDate = date.substring(9, 13) + '-' + date.substring(13, 15) + '-' + date.substring(15, 17);
    const url = `https://socksfirstgames.com/proposers/index.php?start=${startDate}&end=${endDate}`;

    fetch(url,{cache: "no-store"})
        .then(response => response.json())
        .then(data => {
            allAddresses = [];
            const dataArrays = data.data;

            // check if the end date selected in dropdown is more than maxTimestamp. If so, add notice below date selection that data is incomplete
            const selectedDate = new Date(Date.UTC(date.substring(9, 13), date.substring(13, 15) - 1, date.substring(15, 17)));
            const endOfDay = new Date(selectedDate);
            endOfDay.setUTCHours(23, 59, 59, 999);
            console.log(endOfDay);
            if (endOfDay > new Date(data.max_timestamp)) {
                document.getElementById('data_notice').style.display = 'block';
            }
            else {
                document.getElementById('data_notice').style.display = 'none';
            }
    
            // Sort the data by block count
            dataArrays.sort((a, b) => b.block_count - a.block_count);

            const tableBody = document.getElementById('dataTable').querySelector('tbody');
            tableBody.innerHTML = ''; // clear previous data

            let totalBlocks = 0;
            let totalWallets = 0;

            dataArrays.forEach(row => {
                const tr = document.createElement('tr');

                // Format first column
                const td1 = document.createElement('td');
                td1.textContent = row.proposer;
                td1.setAttribute('addr', row.proposer);
                td1.setAttribute('title', row.proposer);
                allAddresses.push(row.proposer);
                tr.appendChild(td1);

                // Format second column
                const td2 = document.createElement('td');
                totalBlocks += row.block_count;
                td2.textContent = row.block_count;
                tr.appendChild(td2);

                // Format third column
                const td3 = document.createElement('td');
                td3.textContent = ''; // No data available
                tr.appendChild(td3);

                // Format fourth column
                const td4 = document.createElement('td');
                td4.textContent = '';
                td4.setAttribute('health_score', row.node.health_score);
                td4.setAttribute('health_divisor', row.node.health_divisor);
                td4.setAttribute('title', `Health score: ${row.node.health_score}\nHealth divisor: ${row.node.health_divisor}`);
                tr.appendChild(td4);

                // Format fifth column
                const td5 = document.createElement('td');
                td5.textContent = ''; // No data available
                tr.appendChild(td5);

                tableBody.appendChild(tr);
                totalWallets++;
            });

            // attach click event to column 1 of table to swap between title and textContent
            document.querySelectorAll('#dataTable tbody td:first-child').forEach(td => {
              let isDragging = false;
              td.addEventListener('mousedown', () => {
                isDragging = false;
              });
              td.addEventListener('mousemove', () => {
                isDragging = true;
              });
              td.addEventListener('mouseup', () => {
                if (!isDragging) {
                  const text = td.textContent;
                  const title = td.getAttribute('title');
                  td.textContent = title;
                  td.setAttribute('title', text);
                }
              });
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

                // trigger filterInput event to update the filter
                filterInput.dispatchEvent(new Event('input'));

                overlay.style.display = 'none';
            });

            // Update the total blocks and wallets counts
            document.querySelector('#totalBlocks span').textContent = totalBlocks;
            document.querySelector('#totalWallets span').textContent = totalWallets;

            const hn = document.querySelector('#totalHealthyNodes span');
            hn.textContent = data.healthy_node_count;
            hn.setAttribute('empty_nodes', data.empty_node_count);

            document.querySelector('#lastBlock span').innerHTML = `${data.block_height}<br/><span class='little'>${new Date(data.max_timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</span>`;
            
            // populate blockVoiPoolTotal and healthVoiPoolTotal divs
            document.querySelector('#blockVoiPoolTotal').value = VOI_BLOCK_REWARDS.toLocaleString();
            document.querySelector('#healthVoiPoolTotal').value = VOI_HEALTH_REWARDS.toLocaleString();

            calcRewards();
        });
}

// Function to download the CSV
// type can be 'all', 'block', or 'health'
function downloadCSV(type = 'all', event) {
  if (typeof event !== 'undefined') event.stopPropagation(); // Stop event propagation

  // Get the table data
  const table = document.getElementById('dataTable');
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const data = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const address = cells[0].getAttribute('addr');
    let tokenAmount;
    let note;
    if (type === 'block') {
      tokenAmount = Number(cells[2].textContent);
      note = JSON.stringify({blockRewards: tokenAmount});
    } else if (type === 'health') {
      tokenAmount = Number(cells[3].textContent);
      note = JSON.stringify({healthRewards: tokenAmount});
    } else {
      tokenAmount = Number(cells[2].textContent) + Number(cells[3].textContent);
      note = JSON.stringify({blockRewards: cells[2].textContent, healthRewards: cells[3].textContent});
    }
    note = '"' + note.replace(/"/g, '""') + '"';
    tokenAmount = Math.round(tokenAmount * Math.pow(10,6));

    return [address, 'node', tokenAmount, note];
  }).filter(row => row[2] > 0);

  // Create the CSV content
  const headers = ['account', 'userType', 'tokenAmount', 'note'];
  const csvContent = headers.join(',') + '\n' + data.map(row => row.join(',')).join('\n');

  // Download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = type === 'block' ? 'block_rewards.csv' : type === 'health' ? 'health_rewards.csv' : 'all_rewards.csv';
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
            .catch(error => {}); // suppress error //console.error("Error fetching additional data:", error));
    });

    await Promise.all(allFetches);
    return aggregatedNFDs;
}