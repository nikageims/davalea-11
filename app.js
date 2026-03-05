const API_URL = 'https://us-central1-js04-b4877.cloudfunctions.net/tasks';
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

async function handleSend() {
    const text = taskInput.value.trim();
    if (!text) return;

    addBtn.innerText = "იგზავნება...";
    addBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (response.ok) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${text}</span>
                <span class="status-badge">● გაგზავნილია</span>
            `;
            taskList.prepend(li);
            taskInput.value = "";
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        addBtn.innerText = "დამატება";
        addBtn.disabled = false;
    }
}

addBtn.addEventListener('click', handleSend);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});