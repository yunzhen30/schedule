class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentView = 'month';
        this.events = [];
        
        // DOM 元素
        this.calendarBody = document.getElementById('calendar-body');
        this.currentPeriod = document.getElementById('current-period');
        this.eventModal = null;
        
        // 載入儲存的行程
        this.loadEvents();
    }
    
    init() {
        // 初始化 Bootstrap modal
        this.eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
        
        // 初始化事件監聽
        this.bindEventHandlers();
        
        // 設定預設視圖
        this.setView('month');
    }
    
    bindEventHandlers() {
        // 移除原有的 onclick 屬性並綁定新的事件處理器
        this.removeDefaultHandlers();
        
        // 視圖切換按鈕
        const viewButtons = document.querySelectorAll('.btn-group [data-view]');
        viewButtons.forEach(btn => {
            const view = btn.dataset.view;
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setView(view);
            });
        });
        
        // 導航按鈕
        document.getElementById('prev-btn').addEventListener('click', () => this.navigate(-1));
        document.getElementById('next-btn').addEventListener('click', () => this.navigate(1));
        document.getElementById('today-btn').addEventListener('click', () => this.goToday());
        
        // 建立行程按鈕
        document.getElementById('create-event-btn').addEventListener('click', () => this.showEventModal());
        
        // 行程對話框按鈕
        document.getElementById('save-event').addEventListener('click', () => this.saveEvent());
        document.getElementById('delete-event').addEventListener('click', () => this.deleteEvent());
        document.getElementById('all-day').addEventListener('change', (e) => this.toggleAllDay(e.target.checked));
        
        // 匯入匯出按鈕
        document.getElementById('export-btn').addEventListener('click', () => this.exportEvents());
        document.getElementById('import-input').addEventListener('change', (e) => this.importEvents(e));
    }
    
    removeDefaultHandlers() {
        // 移除所有具有 onclick 屬性的元素的預設處理器
        document.querySelectorAll('[onclick]').forEach(el => {
            el.removeAttribute('onclick');
        });
    }
    
    setView(view) {
        this.currentView = view;
        this.renderCalendar();
    }
    
    navigate(diff) {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + diff);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + diff * 7);
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + diff);
                break;
        }
        this.renderCalendar();
    }
    
    goToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }
    
    renderCalendar() {
        this.updatePeriodDisplay();
        
        switch (this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }
    
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 清空日曆內容
        this.calendarBody.innerHTML = '';
        
        // 計算當月第一天和最後一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 計算當月第一天是星期幾（0-6）
        const firstDayOfWeek = firstDay.getDay();
        
        // 創建網格容器
        const gridContainer = document.createElement('div');
        gridContainer.className = 'calendar-grid month-view';
        
        // 添加星期標題
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-cell';
            dayHeader.textContent = day;
            gridContainer.appendChild(dayHeader);
        });
        
        // 填充日期格子
        let currentDate = new Date(firstDay);
        currentDate.setDate(currentDate.getDate() - firstDayOfWeek);
        
        // 生成 6 週的日期格子
        for (let i = 0; i < 42; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-cell';
            
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = currentDate.getDate();
            
            // 判斷是否為當前月份
            if (currentDate.getMonth() !== month) {
                dayCell.classList.add('other-month');
            }
            
            // 判斷是否為今天
            if (this.isToday(currentDate)) {
                dayCell.classList.add('today');
            }
            
            // 添加事件容器
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events-container';
            
            // 載入該日期的事件
            const dayEvents = this.getEventsForDate(currentDate);
            dayEvents.forEach(event => {
                const eventElement = this.createEventElement(event);
                eventsContainer.appendChild(eventElement);
            });
            
            dayCell.appendChild(dateNumber);
            dayCell.appendChild(eventsContainer);
            
            // 添加點擊事件處理
            dayCell.addEventListener('click', () => {
                this.selectDate(currentDate);
            });
            
            gridContainer.appendChild(dayCell);
            
            // 移至下一天
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        this.calendarBody.appendChild(gridContainer);
    }
    
    renderWeekView() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'calendar-grid week-view';
        
        // 獲取本週的起始日期
        const weekStart = new Date(this.currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        // 添加時間軸
        for (let hour = 0; hour < 24; hour++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-cell';
            timeCell.textContent = `${hour}:00`;
            gridContainer.appendChild(timeCell);
            
            // 為每一天添加小時格子
            for (let day = 0; day < 7; day++) {
                const hourCell = document.createElement('div');
                hourCell.className = 'hour-cell';
                hourCell.dataset.hour = hour;
                hourCell.dataset.day = day;
                gridContainer.appendChild(hourCell);
            }
        }
        
        // 載入本週事件
        const weekEvents = this.getEventsForWeek(weekStart);
        this.renderEvents(weekEvents, gridContainer);
        
        this.calendarBody.appendChild(gridContainer);
    }
    
    renderDayView() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'calendar-grid day-view';
        
        // 添加時間軸
        for (let hour = 0; hour < 24; hour++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-cell';
            timeCell.textContent = `${hour}:00`;
            gridContainer.appendChild(timeCell);
            
            const hourCell = document.createElement('div');
            hourCell.className = 'hour-cell';
            hourCell.dataset.hour = hour;
            gridContainer.appendChild(hourCell);
        }
        
        // 載入當天事件
        const dayEvents = this.getEventsForDate(this.currentDate);
        this.renderEvents(dayEvents, gridContainer);
        
        this.calendarBody.appendChild(gridContainer);
    }
    
    updatePeriodDisplay() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        
        let displayText = `${year}年 ${monthNames[month]}`;
        
        if (this.currentView === 'week') {
            const weekStart = new Date(this.currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            displayText = `${year}年 ${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}日 - ${weekEnd.getDate()}日`;
        } else if (this.currentView === 'day') {
            displayText = `${year}年 ${monthNames[month]} ${this.currentDate.getDate()}日`;
        }
        
        this.currentPeriod.textContent = displayText;
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.showEventModal();
    }
    
    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
        });
    }
    
    getEventsForWeek(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        return this.events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate >= weekStart && eventDate < weekEnd;
        });
    }
    
    createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.style.backgroundColor = event.color || '#4285f4';
        eventElement.textContent = event.title;
        
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editEvent(event);
        });
        
        return eventElement;
    }
    
    renderEvents(events, container) {
        events.forEach(event => {
            const eventElement = this.createEventElement(event);
            // 根據事件時間計算位置
            const startHour = new Date(event.start).getHours();
            const endHour = new Date(event.end).getHours();
            const duration = endHour - startHour;
            
            eventElement.style.gridRow = `span ${duration}`;
            const targetCell = container.querySelector(`[data-hour="${startHour}"]`);
            if (targetCell) {
                targetCell.appendChild(eventElement);
            }
        });
    }
    
    showEventModal(event = null) {
        // 重置表單
        document.getElementById('event-form').reset();
        
        if (event) {
            // 編輯現有事件
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-start').value = this.formatDateTime(new Date(event.start));
            document.getElementById('event-end').value = this.formatDateTime(new Date(event.end));
            document.getElementById('event-description').value = event.description || '';
            document.getElementById('event-color').value = event.color || '#4285f4';
            document.getElementById('event-repeat').value = event.repeat || 'none';
            document.getElementById('all-day').checked = event.allDay || false;
            document.getElementById('delete-event').style.display = 'block';
            
            // 保存事件ID用於更新
            this.editingEventId = event.id;
        } else {
            // 創建新事件
            const defaultStart = new Date(this.selectedDate);
            defaultStart.setHours(new Date().getHours());
            defaultStart.setMinutes(0);
            
            const defaultEnd = new Date(defaultStart);
            defaultEnd.setHours(defaultStart.getHours() + 1);
            
            document.getElementById('event-start').value = this.formatDateTime(defaultStart);
            document.getElementById('event-end').value = this.formatDateTime(defaultEnd);
            document.getElementById('delete-event').style.display = 'none';
            
            this.editingEventId = null;
        }
        
        this.eventModal.show();
    }
    
    saveEvent() {
        const form = document.getElementById('event-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const event = {
            id: this.editingEventId || Date.now().toString(),
            title: document.getElementById('event-title').value,
            start: document.getElementById('event-start').value,
            end: document.getElementById('event-end').value,
            description: document.getElementById('event-description').value,
            color: document.getElementById('event-color').value,
            repeat: document.getElementById('event-repeat').value,
            allDay: document.getElementById('all-day').checked
        };
        
        if (this.editingEventId) {
            // 更新現有事件
            const index = this.events.findIndex(e => e.id === this.editingEventId);
            if (index !== -1) {
                this.events[index] = event;
            }
        } else {
            // 添加新事件
            this.events.push(event);
        }
        
        // 保存到本地儲存
        this.saveEvents();
        
        // 關閉對話框並重新渲染
        this.eventModal.hide();
        this.renderCalendar();
    }
    
    deleteEvent() {
        if (this.editingEventId) {
            this.events = this.events.filter(event => event.id !== this.editingEventId);
            this.saveEvents();
            this.eventModal.hide();
            this.renderCalendar();
        }
    }
    
    toggleAllDay(isAllDay) {
        const startInput = document.getElementById('event-start');
        const endInput = document.getElementById('event-end');
        
        if (isAllDay) {
            // 保存原始時間值
            this._originalStart = startInput.value;
            this._originalEnd = endInput.value;
            
            // 設置為全天
            const start = new Date(startInput.value);
            start.setHours(0, 0, 0);
            const end = new Date(endInput.value);
            end.setHours(23, 59, 59);
            
            startInput.value = this.formatDateTime(start);
            endInput.value = this.formatDateTime(end);
        } else if (this._originalStart && this._originalEnd) {
            // 恢復原始時間
            startInput.value = this._originalStart;
            endInput.value = this._originalEnd;
        }
    }
    
    saveEvents() {
        localStorage.setItem('calendar-events', JSON.stringify(this.events));
    }
    
    loadEvents() {
        const savedEvents = localStorage.getItem('calendar-events');
        this.events = savedEvents ? JSON.parse(savedEvents) : [];
    }
    
    exportEvents() {
        const dataStr = JSON.stringify(this.events, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-events-${this.formatDate(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    importEvents(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedEvents = JSON.parse(e.target.result);
                this.events = [...this.events, ...importedEvents];
                this.saveEvents();
                this.renderCalendar();
            } catch (error) {
                console.error('匯入失敗:', error);
                alert('匯入失敗，請確認檔案格式正確。');
            }
        };
        reader.readAsText(file);
    }
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    formatDateTime(date) {
        return date.toISOString().slice(0, 16);
    }
}

// 初始化日曆
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar();
    window.calendar.init();
});
