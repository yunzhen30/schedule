document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDescription = document.getElementById('task-description');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const currentDateElement = document.getElementById('current-date');
    
    // 設定今天的日期並更新顯示
    let currentDate = new Date();
    
    const formatDate = (date) => {
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const formatDateValue = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const updateDateDisplay = () => {
        currentDateElement.textContent = formatDate(currentDate);
        taskDate.value = formatDateValue(currentDate);
        loadTasks(); // 重新載入該日期的行程
    };

    // 初始化日期顯示
    updateDateDisplay();

    // 日期切換函數
    window.changeDate = (days) => {
        currentDate.setDate(currentDate.getDate() + days);
        updateDateDisplay();
    };

    // 回到今天
    window.goToToday = () => {
        currentDate = new Date();
        updateDateDisplay();
    };

    // 初始化時間區段列表
    const timeSegments = ['morning', 'afternoon', 'evening'];
    const lists = {};
    timeSegments.forEach(segment => {
        const list = document.getElementById(`${segment}-list`);
        lists[segment] = list;
        new Sortable(list, {
            animation: 150,
            group: 'tasks',
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: saveTasks
        });
    });

    // 從 localStorage 載入儲存的行程
    const loadTasks = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        const currentDateStr = taskDate.value;
        
        // 清空所有時間區段
        timeSegments.forEach(segment => {
            lists[segment].innerHTML = '';
        });

        // 載入當天的行程
        timeSegments.forEach(segment => {
            const segmentTasks = tasks[currentDateStr]?.[segment] || [];
            segmentTasks.forEach(task => {
                addTaskToList(task.text, task.description, segment);
            });
        });
    };

    // 儲存行程到 localStorage
    const saveTasks = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        const currentDateStr = taskDate.value;
        tasks[currentDateStr] = {};

        timeSegments.forEach(segment => {
            const list = lists[segment];
            tasks[currentDateStr][segment] = Array.from(list.children).map(item => ({
                text: item.querySelector('.task-text').textContent,
                description: item.querySelector('.task-description')?.textContent || ''
            }));
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    // 新增行程項目到列表
    const addTaskToList = (taskText, taskDesc, timeSegment) => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <div class="w-100">
                <div>
                    <i class="fas fa-grip-vertical drag-handle"></i>
                    <span class="task-text">${taskText}</span>
                </div>
                ${taskDesc ? `<div class="task-description">${taskDesc}</div>` : ''}
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

        lists[timeSegment].appendChild(li);
    };

    // 處理表單提交
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        const description = taskDescription.value.trim();
        const time = taskTime.value;

        if (text && time) {
            addTaskToList(text, description, time);
            saveTasks();
            taskInput.value = '';
            taskDescription.value = '';
            taskTime.value = '';
        }
    });

    // 當手動選擇日期時重新載入該日期的行程
    taskDate.addEventListener('change', () => {
        currentDate = new Date(taskDate.value);
        updateDateDisplay();
    });

    // 匯出行程資料
    window.exportTasks = () => {
        const tasks = localStorage.getItem('tasks');
        const blob = new Blob([tasks], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 匯入行程資料
    window.importTasks = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const tasks = JSON.parse(e.target.result);
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    loadTasks();
                } catch (err) {
                    alert('檔案格式錯誤，請選擇正確的行程資料檔案。');
                }
            };
            reader.readAsText(file);
        }
    };

    // 載入今天的行程
    loadTasks();
});