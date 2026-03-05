const grid = document.getElementById('dataGrid');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const selectAllContainer = document.getElementById('selectAllContainer');
const selectAllCheckbox = document.getElementById('selectAll');
let selectedIds = new Set();

const API_BASE_URL = "https://us-central1-js04-b4877.cloudfunctions.net/tasks";
const PROXY_URL = "https://corsproxy.io/?";

async function fetchData() {
    grid.innerHTML = '<div class="status-msg">🔄 მონაცემები იტვირთება...</div>';
    selectedIds.clear();
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    updateBulkDeleteButton();
    
    try {
        const timestamp = new Date().getTime();
        const targetUrl = `${API_BASE_URL}?t=${timestamp}`;
        const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error();
        
        const fullResponse = await response.json();
        const tasksArray = fullResponse.data || [];

        grid.innerHTML = '';
        
        if (tasksArray.length === 0) {
            grid.innerHTML = '<div class="status-msg">📭 ბაზა ცარიელია.</div>';
            if (selectAllContainer) selectAllContainer.style.display = 'none';
            return;
        }

        if (selectAllContainer) selectAllContainer.style.display = 'flex';

        tasksArray.forEach(item => {
            const card = document.createElement('div');
            card.className = 'data-card';
            card.id = `card-${item.id}`;
            card.innerHTML = `
                <div class="select-container">
                    <input type="checkbox" class="task-checkbox" data-id="${item.id}">
                </div>
                <div class="data-text">${item.text || 'ტექსტის გარეშე'}</div>
                <div class="card-footer">
                    <div class="data-id">ID: ${item.id.substring(0, 6)}...</div>
                    <button class="delete-btn" data-id="${item.id}">წაშლა</button>
                </div>
            `;
            
            const checkbox = card.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleSelect(item.id, checkbox));

            const delBtn = card.querySelector('.delete-btn');
            delBtn.addEventListener('click', () => deleteTask(item.id));

            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = '<div class="status-msg">❌ კავშირის შეცდომა.</div>';
    }
}

function toggleSelect(id, checkbox) {
    const card = document.getElementById(`card-${id}`);
    const allCheckboxes = document.querySelectorAll('.task-checkbox');

    if (checkbox.checked) {
        selectedIds.add(id);
        card.classList.add('selected');
    } else {
        selectedIds.delete(id);
        card.classList.remove('selected');
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.checked = (selectedIds.size === allCheckboxes.length && allCheckboxes.length > 0);
    }
    updateBulkDeleteButton();
}

if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
        const allCheckboxes = document.querySelectorAll('.task-checkbox');
        selectedIds.clear();

        allCheckboxes.forEach(cb => {
            cb.checked = this.checked;
            const id = cb.getAttribute('data-id');
            const card = document.getElementById(`card-${id}`);
            
            if (this.checked) {
                selectedIds.add(id);
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        updateBulkDeleteButton();
    });
}

function updateBulkDeleteButton() {
    if (!bulkDeleteBtn) return;
    const count = selectedIds.size;
    bulkDeleteBtn.style.display = count > 0 ? 'block' : 'none';
    bulkDeleteBtn.innerText = `🗑️ წაშლა (${count})`;
}

async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`ნამდვილად გსურთ ${selectedIds.size} ჩანაწერის წაშლა?`)) return;

    const idsArray = Array.from(selectedIds);
    bulkDeleteBtn.innerText = "იშლება...";
    bulkDeleteBtn.disabled = true;

    try {
        await Promise.all(idsArray.map(id => 
            fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' })
        ));
        fetchData();
    } catch (error) {
        alert("შეცდომა წაშლისას.");
    } finally {
        bulkDeleteBtn.disabled = false;
    }
}

async function deleteTask(id) {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            const card = document.getElementById(`card-${id}`);
            if (card) {
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
    } catch (error) {
        alert("ვერ მოხერხდა წაშლა.");
    }
}

if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = deleteSelected;
}

fetchData();