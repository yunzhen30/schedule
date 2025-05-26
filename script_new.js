class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentView = 'month';
        this.events = [];
        this.draggedEvent = null;
        
        // DOM 元素
        this.calendarBody = document.getElementById('calendar-body');
        this.currentPeriod = document.getElementById('current-period');
        this.eventModal = null; // 將在 DOMContentLoaded 後初始化
        
        // 載入儲存的行程
        this.loadEvents();
    }
    
    init() {
        // 初始化 Bootstrap modal
        this.eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
        this.renderCalendar();
        this.bindEventHandlers();
    }
    
    bindEventHandlers() {
        // 視圖切換
        document.querySelectorAll('[onclick^="setView"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('onclick').match(/'(.+)'/)[1];
                this.setView(view);
            });
        });
        
        // 導航按鈕
        document.querySelector('[onclick="prev()"]').addEventListener('click', () => this.navigate(-1));
        document.querySelector('[onclick="next()"]').addEventListener('click', () => this.navigate(1));
        document.querySelector('[onclick="today()"]').addEventListener('click', () => this.goToday());
        
        // 事件處理
        document.querySelector('[onclick="createEvent()"]').addEventListener('click', () => this.showEventModal());
        document.getElementById('save-event').addEventListener('click', () => this.saveEvent());
        document.getElementById('delete-event').addEventListener('click', () => this.deleteEvent());
        document.getElementById('all-day').addEventListener('change', (e) => this.toggleAllDay(e.target.checked));
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
    
    updatePeriodDisplay() {
        let text = '';
        switch (this.currentView) {
            case 'month':
                text = this.currentDate.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long'
                });
                break;
            case 'week':
                const weekStart = new Date(this.currentDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                text = `${weekStart.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}`;
                break;
            case 'day':
                text = this.currentDate.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                });
                break;
        }
        this.currentPeriod.textContent = text;
    }
    
    renderMonthView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        // 清空並準備日曆網格
        this.calendarBody.innerHTML = '';
        this.calendarBody.className = 'calendar-body month-view';
        
        // 產生日期格子
        for (let i = 0; i < 42; i++) {
            const dayDate = new Date(year, month, i - firstDay + 1);
            const isOtherMonth = dayDate.getMonth() !== month;
            const isToday = this.isSameDay(dayDate, today);
            
            const cell = document.createElement('div');
            cell.className = `calendar-cell${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;
            cell.innerHTML = `
                <div class="date">${dayDate.getDate()}</div>
                <div class="events"></div>
            `;
            
            if (!isOtherMonth) {
                const fullDate = dayDate.toISOString().split('T')[0];
                cell.setAttribute('data-date', fullDate);
                cell.addEventListener('click', () => this.selectDate(dayDate));
            }
            
            this.calendarBody.appendChild(cell);
        }
        
        this.renderEvents();
    }
    
    renderWeekView() {
        this.calendarBody.innerHTML = '';
        this.calendarBody.className = 'calendar-body week-view';
        
        // 建立時間格線
        this.createTimeGrid(7);
        
        // 顯示這一週的事件
        this.renderEvents();
    }
    
    renderDayView() {
        this.calendarBody.innerHTML = '';
        this.calendarBody.className = 'calendar-body day-view';
        
        // 建立時間格線
        this.createTimeGrid(1);
        
        // 顯示當天的事件
        this.renderEvents();
    }
    
    createTimeGrid(columns) {
        const container = document.createElement('div');
        container.className = 'time-grid';
        
        // 時間標籤
        const timeLabels = document.createElement('div');
        timeLabels.className = 'time-labels';
        for (let hour = 0; hour < 24; hour++) {
            const label = document.createElement('div');
            label.className = 'time-label';
            label.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeLabels.appendChild(label);
        }
        container.appendChild(timeLabels);
        
        // 時間格子
        const timeSlots = document.createElement('div');
        timeSlots.className = 'time-slots';
        
        // 添加日期標題
        const headerRow = document.createElement('div');
        headerRow.className = 'time-header';
        for (let i = 0; i < columns; i++) {
            const date = new Date(this.currentDate);
            date.setDate(date.getDate() - date.getDay() + i);
            const header = document.createElement('div');
            header.className = 'time-header-cell';
            header.textContent = date.toLocaleDateString('zh-TW', {
                weekday: 'short',
                month: 'numeric',
                day: 'numeric'
            });
            headerRow.appendChild(header);
        }
        timeSlots.appendChild(headerRow);
        
        // 添加時間格子
        for (let col = 0; col < columns; col++) {
            const column = document.createElement('div');
            column.className = 'time-column';
            for (let hour = 0; hour < 24; hour++) {
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() - date.getDay() + col);
                date.setHours(hour, 0, 0, 0);
                slot.setAttribute('data-time', date.toISOString());
                slot.addEventListener('click', () => this.showEventModal(null, date));
                column.appendChild(slot);
            }
            timeSlots.appendChild(column);
        }
        container.appendChild(timeSlots);
        
        this.calendarBody.appendChild(container);
    }
    
    renderEvents() {
        // 清除現有事件
        this.calendarBody.querySelectorAll('.event').forEach(e => e.remove());
        
        // 根據不同視圖渲染事件
        this.events.forEach(event => {
            if (this.shouldRenderEvent(event)) {
                this.renderEvent(event);
            }
        });
    }
    
    shouldRenderEvent(event) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        
        switch (this.currentView) {
            case 'month':
                return start.getMonth() === this.currentDate.getMonth() &&
                       start.getFullYear() === this.currentDate.getFullYear();
            case 'week':
                const weekStart = new Date(this.currentDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return start <= weekEnd && end >= weekStart;
            case 'day':
                return this.isSameDay(start, this.currentDate);
        }
        return false;
    }
    
    renderEvent(event) {
        const eventEl = document.createElement('div');
        eventEl.className = 'event';
        eventEl.style.backgroundColor = event.color;
        eventEl.innerHTML = `
            <div class="event-title">${event.title}</div>
            ${event.allDay ? '' : `
            <div class="event-time">
                ${new Date(event.start).toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'})}
            </div>`}
        `;
        
        // 添加事件處理
        eventEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEventModal(event);
        });
        
        // 根據視圖定位事件
        switch (this.currentView) {
            case 'month':
                this.positionEventInMonth(event, eventEl);
                break;
            case 'week':
            case 'day':
                this.positionEventInTimeGrid(event, eventEl);
                break;
        }
        
        this.calendarBody.appendChild(eventEl);
    }
    
    positionEventInMonth(event, element) {
        const start = new Date(event.start);
        const cell = this.calendarBody.querySelector(`[data-date="${start.toISOString().split('T')[0]}"]`);
        if (cell) {
            cell.querySelector('.events').appendChild(element);
        }
    }
    
    positionEventInTimeGrid(event, element) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const duration = (end - start) / (1000 * 60); // 分鐘
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        
        element.style.position = 'absolute';
        element.style.top = `${(startMinutes / 1440) * 100}%`;
        element.style.height = `${(duration / 1440) * 100}%`;
        element.style.width = '90%';
        
        const dayIndex = start.getDay();
        const column = this.calendarBody.querySelectorAll('.time-column')[dayIndex];
        if (column) {
            column.appendChild(element);
        }
    }
    
    selectDate(date) {
        this.selectedDate = date;
        this.currentDate = new Date(date);
        this.renderCalendar();
    }
    
    showEventModal(event = null, defaultDate = null) {
        const form = document.getElementById('event-form');
        const deleteBtn = document.getElementById('delete-event');
        
        if (event) {
            // 編輯現有事件
            form.querySelector('#event-title').value = event.title;
            form.querySelector('#event-start').value = event.start;
            form.querySelector('#event-end').value = event.end;
            form.querySelector('#event-description').value = event.description || '';
            form.querySelector('#event-color').value = event.color;
            form.querySelector('#all-day').checked = event.allDay;
            form.querySelector('#event-repeat').value = event.repeat || 'none';
            
            deleteBtn.style.display = 'block';
            deleteBtn.onclick = () => this.deleteEvent(event);
        } else {
            // 新增事件
            form.reset();
            const start = defaultDate || new Date();
            const end = new Date(start);
            end.setHours(end.getHours() + 1);
            
            form.querySelector('#event-start').value = start.toISOString().slice(0, 16);
            form.querySelector('#event-end').value = end.toISOString().slice(0, 16);
            form.querySelector('#event-color').value = '#4285f4';
            
            deleteBtn.style.display = 'none';
        }
        
        this.currentEditingEvent = event;
        this.eventModal.show();
    }
    
    saveEvent() {
        const form = document.getElementById('event-form');
        const data = {
            title: form.querySelector('#event-title').value,
            start: form.querySelector('#event-start').value,
            end: form.querySelector('#event-end').value,
            description: form.querySelector('#event-description').value,
            color: form.querySelector('#event-color').value,
            allDay: form.querySelector('#all-day').checked,
            repeat: form.querySelector('#event-repeat').value
        };
        
        if (this.currentEditingEvent) {
            // 更新現有事件
            Object.assign(this.currentEditingEvent, data);
            this.currentEditingEvent = null;
        } else {
            // 新增事件
            this.events.push(data);
        }
        
        this.saveEvents();
        this.renderCalendar();
        this.eventModal.hide();
    }
    
    deleteEvent(event) {
        const index = this.events.indexOf(event);
        if (index > -1) {
            this.events.splice(index, 1);
            this.saveEvents();
            this.renderCalendar();
        }
        this.eventModal.hide();
    }
    
    loadEvents() {
        const saved = localStorage.getItem('calendar_events');
        this.events = saved ? JSON.parse(saved) : [];
    }
    
    saveEvents() {
        localStorage.setItem('calendar_events', JSON.stringify(this.events));
    }
    
    toggleAllDay(checked) {
        const startInput = document.getElementById('event-start');
        const endInput = document.getElementById('event-end');
        
        if (checked) {
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);
            start.setHours(0, 0, 0);
            end.setHours(23, 59, 59);
            startInput.value = start.toISOString().split('T')[0];
            endInput.value = end.toISOString().split('T')[0];
        } else {
            const now = new Date();
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);
            start.setHours(now.getHours());
            end.setHours(now.getHours() + 1);
            startInput.value = start.toISOString().slice(0, 16);
            endInput.value = end.toISOString().slice(0, 16);
        }
        
        startInput.type = checked ? 'date' : 'datetime-local';
        endInput.type = checked ? 'date' : 'datetime-local';
    }
    
    isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }
}

// 全域函數
window.setView = (view) => calendar.setView(view);
window.prev = () => calendar.navigate(-1);
window.next = () => calendar.navigate(1);
window.today = () => calendar.goToday();
window.createEvent = () => calendar.showEventModal();

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar();
    window.calendar.init();
});
