document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    // 從 localStorage 載入儲存的行程
    const loadTasks = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        taskList.innerHTML = '';
        tasks.forEach(task => {
            addTaskToList(task);
        });
    };

    // 儲存行程到 localStorage
    const saveTasks = () => {
        const tasks = Array.from(taskList.children).map(item => item.querySelector('.task-text').textContent);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // 新增行程項目到列表
    const addTaskToList = (taskText) => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div>
                <i class="fas fa-grip-vertical drag-handle"></i>
                <span class="task-text">${taskText}</span>
            </div>
            <button class="delete-btn" aria-label="刪除">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 綁定刪除按鈕事件
        li.querySelector('.delete-btn').addEventListener('click', () => {
            li.remove();
            saveTasks();
        });

        taskList.appendChild(li);
    };

    // 處理表單提交
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            addTaskToList(taskText);
            saveTasks();
            taskInput.value = '';
        }
    });

    // 初始化 Sortable.js
    new Sortable(taskList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: saveTasks
    });

    // 載入儲存的行程
    loadTasks();
});