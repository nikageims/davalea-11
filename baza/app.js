const grid = document.getElementById('dataGrid');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const selectAllContainer = document.getElementById('selectAllContainer');
const selectAllCheckbox = document.getElementById('selectAll');
let selectedIds = new Set();

async function fetchData() {
    grid.innerHTML = '<div class="status-msg">🔄 მონაცემები იტვირთება...</div>';
    selectedIds.clear();
    selectAllCheckbox.checked = false;
    updateBulkDeleteButton();
    
    try {
        const timestamp = new Date().getTime();
        const targetUrl = `https://us-central1-js04-b4877.cloudfunctions.net/tasks?t=${timestamp}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const response = await fetch(proxyUrl);
        const fullResponse = await response.json();
        const tasksArray = fullResponse.data;

        grid.innerHTML = '';
        
        if (!tasksArray || tasksArray.length === 0) {
            grid.innerHTML = '<div class="status-msg">📭 ბაზა ცარიელია.</div>';
            selectAllContainer.style.display = 'none';
            return;
        }

        selectAllContainer.style.display = 'flex';

        tasksArray.forEach(item => {
            const card = document.createElement('div');
            card.className = 'data-card';
            card.id = `card-${item.id}`;
            card.innerHTML = `
                <div class="select-container">
                    <input type="checkbox" class="task-checkbox" data-id="${item.id}" onchange="toggleSelect('${item.id}', this)">
                </div>
                <div class="data-text">${item.text || 'ტექსტის გარეშე'}</div>
                <div class="card-footer">
                    <div class="data-id">ID: ${item.id.substring(0, 6)}...</div>
                    <button class="delete-btn" onclick="deleteTask('${item.id}')">წაშლა</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<div class="status-msg">❌ კავშირის შეცდომა.</div>';
    }
}

function toggleSelect(id, checkbox) {
    const card = document.getElementById(`card-${id}`);
    if (checkbox.checked) {
        selectedIds.add(id);
        card.classList.add('selected');
    } else {
        selectedIds.delete(id);
        card.classList.remove('selected');
        selectAllCheckbox.checked = false;
    }
    updateBulkDeleteButton();
}

function toggleAll(masterCheckbox) {
    const allCheckboxes = document.querySelectorAll('.task-checkbox');
    selectedIds.clear();

    allCheckboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
        const id = cb.getAttribute('data-id');
        const card = document.getElementById(`card-${id}`);
        
        if (masterCheckbox.checked) {
            selectedIds.add(id);
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
    const count = selectedIds.size;
    bulkDeleteBtn.style.display = count > 0 ? 'block' : 'none';
    bulkDeleteBtn.innerText = `🗑️ წაშლა (${count})`;
}

async function deleteSelected() {
    if (!confirm(`ნამდვილად გსურთ ${selectedIds.size} ჩანაწერის წაშლა?`)) return;

    const idsArray = Array.from(selectedIds);
    bulkDeleteBtn.innerText = "იშლება...";
    bulkDeleteBtn.disabled = true;

    for (const id of idsArray) {
        await fetch(`https://us-central1-js04-b4877.cloudfunctions.net/tasks/${id}`, { method: 'DELETE' });
    }
    
    fetchData(); // სრული განახლება წაშლის შემდეგ
}

async function deleteTask(id) {
    if (!confirm('წავშალო ჩანაწერი?')) return;
    const res = await fetch(`https://us-central1-js04-b4877.cloudfunctions.net/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
        const card = document.getElementById(`card-${id}`);
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';
        setTimeout(() => {
            card.remove();
            selectedIds.delete(id);
            updateBulkDeleteButton();
            if (grid.children.length === 0) fetchData();
        }, 300);
    }
}

fetchData();