document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const dateInput = document.getElementById('dateInput');
    const taskList = document.getElementById('taskList');

    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);


    loadTasks();

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const task = {
            id: Date.now(),
            text: taskInput.value,
            dueDate: dateInput.value,
            createdAt: new Date().toISOString()
        };

        await saveTask(task);

        taskForm.reset();
        loadTasks();
    });

    async function saveTask(task) {
        const { tasks = [] } = await chrome.storage.local.get('tasks');

        tasks.push(task);
        console.log("TAsks from save TAsk", tasks);

        await chrome.storage.local.set({ tasks });
        console.log("TAsks from save Tasks 2", await chrome.storage.local.get('tasks'));
    }


    async function loadTasks() {

        const { tasks = [] } = await chrome.storage.local.get('tasks');

        taskList.innerHTML = '';


        const sortedTasks = tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        sortedTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    function createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-time';

        const dueDate = new Date(task.dueDate).toLocaleDateString();

        div.innerHTML = `
            <div class="task-content>
                <p class="task-text">${task.text}</p>
                <p class="task-date">Due: ${dueDate}</p>
            </div>
            <button class="delete-btn" data-id="${task.id}">x</button>
            `;

        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', async () => {
            await deleteTask(task.id);
            loadTasks();
        });

        return div;
    }

    async function deleteTask(taskId) {
        const { tasks = [] } = await chrome.storage.local.get('tasks');
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        await chrome.storage.local.set({ tasks: updatedTasks });
    }
})