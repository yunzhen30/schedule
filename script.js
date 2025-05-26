class Calendar {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDescription = document.getElementById('task-description');
    const taskTime = document.getElementById('task-time');
    const currentDateElement = document.getElementById('current-date');
    const currentMonthElement = document.getElementById('current-month');
    const calendarGrid = document.getElementById('calendar-grid');
    
    // 設定今天的日期並更新顯示
    let currentDate = new Date();
    let displayedMonth = new Date();
    
    const formatDate = (date) => {
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long'
        });
    };

    const formatDateValue = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };    const updateDateDisplay = () => {
        currentDateElement.textContent = formatDate(currentDate);
        loadTasks(); // 重新載入該日期的行程
    };

    // 初始化日期顯示和日曆
    updateDateDisplay();
    renderCalendar();

    // 回到今天
    window.goToToday = () => {
        currentDate = new Date();
        displayedMonth = new Date();
        updateDateDisplay();
        renderCalendar();
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
    });    // 從 localStorage 載入儲存的行程
    const loadTasks = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        const currentDateStr = formatDateValue(currentDate);
        
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
        const currentDateStr = formatDateValue(currentDate);
        tasks[currentDateStr] = {};

        timeSegments.forEach(segment => {
            const list = lists[segment];
            tasks[currentDateStr][segment] = Array.from(list.children).map(item => ({
                text: item.querySelector('.task-text').textContent,
                description: item.querySelector('.task-description')?.textContent || ''
            }));
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // 更新日曆上的行程指示點
        updateTaskIndicators();
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

    // 日曆相關函數
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();
        const today = new Date();
        
        // 更新月份顯示
        currentMonthElement.textContent = formatMonthYear(displayedMonth);
        
        // 清空日曆格子
        calendarGrid.innerHTML = '';
        
        // 獲取當月第一天是星期幾（0-6）
        const firstDay = getFirstDayOfMonth(year, month);
        const daysInMonth = getDaysInMonth(year, month);
        
        // 上個月的最後幾天
        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElement = createDayElement(prevMonthDays - i, true);
            calendarGrid.appendChild(dayElement);
        }
        
        // 當月的天數
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = year === today.getFullYear() && 
                          month === today.getMonth() && 
                          day === today.getDate();
            const isSelected = year === currentDate.getFullYear() &&
                             month === currentDate.getMonth() &&
                             day === currentDate.getDate();
            const dayElement = createDayElement(day, false, isToday, isSelected);
            calendarGrid.appendChild(dayElement);
        }
        
        // 下個月的開始幾天
        const totalCells = 42; // 6週 x 7天
        const remainingCells = totalCells - (firstDay + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = createDayElement(day, true);
            calendarGrid.appendChild(dayElement);
        }

        // 更新每天的行程指示點
        updateTaskIndicators();
    };

    const createDayElement = (day, isOtherMonth = false, isToday = false, isSelected = false) => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (isOtherMonth) dayDiv.classList.add('other-month');
        if (isToday) dayDiv.classList.add('today');
        if (isSelected) dayDiv.classList.add('selected');
        
        dayDiv.innerHTML = `
            <div class="date">${day}</div>
            <div class="task-indicator"></div>
        `;
        
        if (!isOtherMonth) {
            dayDiv.addEventListener('click', () => {
                // 移除之前選中的日期的選中狀態
                const selected = document.querySelector('.calendar-day.selected');
                if (selected) selected.classList.remove('selected');
                
                // 添加新的選中狀態
                dayDiv.classList.add('selected');
                
                // 更新當前選中的日期
                currentDate = new Date(
                    displayedMonth.getFullYear(),
                    displayedMonth.getMonth(),
                    day
                );
                updateDateDisplay();
            });
        }
        
        return dayDiv;
    };

    const updateTaskIndicators = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || {};
        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        
        // 更新當月每一天的行程指示點
        for (let day = 1; day <= daysInMonth; day++) {
            const date = formatDateValue(new Date(year, month, day));
            const dayTasks = tasks[date] || {};
            
            const dayElement = Array.from(calendarGrid.children)
                .find(el => !el.classList.contains('other-month') && 
                           el.querySelector('.date').textContent == day);
                           
            if (dayElement) {
                const indicator = dayElement.querySelector('.task-indicator');
                indicator.innerHTML = '';
                
                // 檢查每個時段是否有行程
                timeSegments.forEach(segment => {
                    if (dayTasks[segment]?.length > 0) {
                        const dot = document.createElement('div');
                        dot.className = `task-dot ${segment}`;
                        indicator.appendChild(dot);
                    }
                });
            }
        }
    };

    // 月份切換函數
    window.changeMonth = (diff) => {
        displayedMonth.setMonth(displayedMonth.getMonth() + diff);
        renderCalendar();
    };

    // 載入今天的行程
    loadTasks();
});