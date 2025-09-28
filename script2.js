document.addEventListener('DOMContentLoaded', function() {
  const Draggable = FullCalendar.Draggable;

  const plannerData = JSON.parse(localStorage.getItem('plannerData')) || { holidays: [], courses: [], activities: [], wakeUpTime: '06:00', sleepTime: '22:00' };

  const deletedEventsToday = [];

  const externalEvents = document.getElementById('external-events');
  const courseList = document.createElement('div');
  const activityList = document.createElement('div');

  plannerData.courses.forEach(course => {
    const div = document.createElement('div');
    div.classList.add('fc-event');
    div.textContent = course.name;
    div.style.backgroundColor = course.color;
    courseList.appendChild(div);
  });

  plannerData.activities.forEach(activity => {
    const div = document.createElement('div');
    div.classList.add('fc-event');
    div.textContent = activity.name;
    div.style.backgroundColor = activity.color;
    activityList.appendChild(div);
  });

  const courseTitle = document.createElement('h4');
  courseTitle.textContent = 'Courses';
  externalEvents.appendChild(courseTitle);
  externalEvents.appendChild(courseList);

  const activityTitle = document.createElement('h4');
  activityTitle.textContent = 'Activities';
  externalEvents.appendChild(activityTitle);
  externalEvents.appendChild(activityList);

  new Draggable(document.getElementById('external-events'), {
    itemSelector: '.fc-event',
    eventData: function(eventEl) {
      return { title: eventEl.innerText.trim(), color: eventEl.style.backgroundColor };
    }
  });

  const calendarEl = document.getElementById('calendar');

  const ctx = document.getElementById('taskChart')?.getContext?.('2d');
  let taskChart = null;
  if (ctx) {
    taskChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Remaining', 'Deleted'],
        datasets: [{ data: [0, 0, 0], backgroundColor: ['#4caf50', '#e0e0e0', '#d9534f'] }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  }

  const businessHours = [{
    start: plannerData.sleepTime,
    end: '24:00',
    color: '#E0E0E0'
  }, {
    start: '00:00',
    end: plannerData.wakeUpTime,
    color: '#E0E0E0'
  }];

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    editable: true,
    droppable: true,
    selectable: true,
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth'
    },
    views: {
      timeGridWeek: {
        allDaySlot: false,
        slotMinTime: '00:00:00',
        slotMaxTime: '24:00:00',
        businessHours: businessHours,
        slotLabelInterval: '01:00'
      }
    },
    eventSources: [
      {
        events: plannerData.holidays.map(holiday => ({
          title: holiday.title,
          start: holiday.date,
          allDay: true,
          color: '#607d8b'
        }))
      }
    ],

    selectAllow: function(selectInfo) {
      const wakeUpHour = parseInt(plannerData.wakeUpTime.split(':')[0]);
      const sleepHour = parseInt(plannerData.sleepTime.split(':')[0]);
      const startHour = selectInfo.start.getHours();
      
      if (startHour >= sleepHour || startHour < wakeUpHour) {
        return false;
      }
      return true;
    },

    eventAllow: function(dropInfo, draggedEvent) {
      const wakeUpHour = parseInt(plannerData.wakeUpTime.split(':')[0]);
      const sleepHour = parseInt(plannerData.sleepTime.split(':')[0]);
      const startHour = dropInfo.start.getHours();
      
      if (startHour >= sleepHour || startHour < wakeUpHour) {
        return false;
      }
      return true;
    },

    dateClick: function(info) {
        const wakeUpHour = parseInt(plannerData.wakeUpTime.split(':')[0]);
        const sleepHour = parseInt(plannerData.sleepTime.split(':')[0]);
        const clickHour = info.date.getHours();

        if (clickHour < sleepHour && clickHour >= wakeUpHour) {
            openCreateModal(info.date, null, "");
        }
    },

    eventReceive: function(info) {
      autoCreatedEvent = true;
      currentEvent = info.event;
      const defaultTitle = info.draggedEl ? info.draggedEl.innerText.trim() : info.event.title || "";
      openCreateModal(info.event.start, info.event, defaultTitle);
      updateGraph();
    },

    eventClick: function(info) {
      const ev = info.event;
      currentEvent = ev;
      openEventOptionsModal(ev);
    },
    eventDidMount: function(info) {
      if (info.event.start) {
        const startHour = info.event.start.getHours();
        const endHour = info.event.end ? info.event.end.getHours() : startHour + 1;
        const wakeHour = parseInt(plannerData.wakeUpTime.split(':')[0]);
        const sleepHour = parseInt(plannerData.sleepTime.split(':')[0]);

        if ((startHour >= sleepHour && startHour < 24) || (startHour < wakeHour && startHour >= 0)) {
          info.el.style.backgroundColor = 'gray';
          info.el.style.borderColor = 'gray';
        }
      }
    }
  });

  calendar.render();

  const modal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('modalTitle');
  const eventTitleInput = document.getElementById('eventTitle');
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const detailsInput = document.getElementById('eventDetails');
  const dayButtons = document.querySelectorAll('.day-btn');

  const markCompleteBtn = document.getElementById('markCompleteBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveEventBtn = document.getElementById('saveEventBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');


  let selectedDate = null;
  let currentEvent = null;
  let autoCreatedEvent = false;

  function openCreateModal(date, eventObj = null, defaultTitle = "") {
    selectedDate = date;
    currentEvent = eventObj;

    modal.style.display = 'flex';

    document.getElementById('markCompleteBtn').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('saveEventBtn').style.display = 'inline-block';
    document.getElementById('closeModalBtn').style.display = 'inline-block';

    modalTitle.textContent = eventObj ? 'Edit Event' : 'Create Event';

    if (eventObj) {
      eventTitleInput.value = eventObj.title.replace('✅', '').trim() || defaultTitle || '';
    } else {
      eventTitleInput.value = defaultTitle || '';
    }

    if (eventObj && eventObj.start) {
      startTimeInput.value = formatToHHMM(eventObj.start);
      endTimeInput.value = eventObj.end ? formatToHHMM(eventObj.end) : '';
    } else if (date && date instanceof Date && !isNaN(date)) {
      startTimeInput.value = formatToHHMM(date);
      endTimeInput.value = '';
    } else {
      startTimeInput.value = '';
      endTimeInput.value = '';
    }

    if (eventObj && eventObj.extendedProps && eventObj.extendedProps.details) {
      detailsInput.value = eventObj.extendedProps.details;
    } else {
      detailsInput.value = '';
    }

    dayButtons.forEach(b => b.classList.remove('active'));

    if (selectedDate instanceof Date) {
      const dayIndex = selectedDate.getDay();
      if (dayButtons[dayIndex]) {
        dayButtons[dayIndex].classList.add('active');
      }
    }
  }

  function openEventOptionsModal(eventObj) {
    currentEvent = eventObj;
    modal.style.display = 'flex';

    document.getElementById('markCompleteBtn').style.display = 'inline-block';
    document.getElementById('deleteBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('saveEventBtn').style.display = 'none';
    document.getElementById('closeModalBtn').style.display = 'none';

    modalTitle.textContent = eventObj.title;

    eventTitleInput.style.display = 'none';
    startTimeInput.style.display = 'none';
    endTimeInput.style.display = 'none';
    detailsInput.style.display = 'none';
    dayButtons.forEach(b => b.style.display = 'none');
  }

  markCompleteBtn.onclick = () => {
    if (currentEvent) {
      currentEvent.setExtendedProp('completed', true);
      if (!currentEvent.title.includes('✅')) currentEvent.setProp('title', currentEvent.title + ' ✅');
      updateGraph();
      resetForm();
      modal.style.display = 'none';
    }
  };

  deleteBtn.onclick = () => {
    if (currentEvent) {
      const today = (new Date()).toISOString().split('T')[0];
      const eventDate = currentEvent.start.toISOString().split('T')[0];
      if (eventDate === today) {
        deletedEventsToday.push(currentEvent.id);
      }
      currentEvent.remove();
      updateGraph();
      resetForm();
      modal.style.display = 'none';
    }
  };

  cancelBtn.onclick = () => {
    resetForm();
    modal.style.display = 'none';
  };

  saveEventBtn.onclick = () => {
    const title = eventTitleInput.value.trim() || 'Untitled';
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const details = detailsInput.value.trim();

    const selectedDays = [];
    dayButtons.forEach((btn, i) => {
      if (btn.classList.contains('active')) selectedDays.push(i);
    });

    if (currentEvent) {
      if (selectedDays.length > 1) {
        currentEvent.remove();
        const baseDate = (currentEvent.start instanceof Date) ? currentEvent.start : new Date(currentEvent.start);
        const weekStart = new Date(baseDate);
        weekStart.setDate(baseDate.getDate() - baseDate.getDay());

        selectedDays.forEach(dayIndex => {
          const evDate = new Date(weekStart);
          evDate.setDate(weekStart.getDate() + dayIndex);
          const isoDate = dateToISODate(evDate);
          calendar.addEvent({
            title,
            start: startTime ? isoDate + 'T' + startTime : isoDate,
            end: endTime ? isoDate + 'T' + endTime : null,
            extendedProps: { details, completed: false },
            allDay: !startTime
          });
        });
      } else {
        const baseDate = currentEvent.start ? currentEvent.start : selectedDate;
        const isoBase = dateToISODate(baseDate);
        const newStart = startTime ? isoBase + 'T' + startTime : isoBase;
        const newEnd = endTime ? isoBase + 'T' + endTime : null;

        currentEvent.setProp('title', title);
        if (newEnd) currentEvent.setDates(newStart, newEnd);
        else currentEvent.setDates(newStart);
        currentEvent.setExtendedProp('details', details);
        if (!currentEvent.extendedProps || currentEvent.extendedProps.completed === undefined) {
          currentEvent.setExtendedProp('completed', false);
        }
      }
      autoCreatedEvent = false;
      currentEvent = null;
    } else {
      if (!selectedDate) {
        alert('No date selected.');
        return;
      }

      const baseDate = (selectedDate instanceof Date) ? selectedDate : new Date(selectedDate);
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() - baseDate.getDay());

      if (selectedDays.length === 0) {
        const baseIso = dateToISODate(selectedDate);
        calendar.addEvent({
          title,
          start: startTime ? baseIso + 'T' + startTime : baseIso,
          end: endTime ? baseIso + 'T' + endTime : null,
          extendedProps: { details, completed: false },
          allDay: !startTime
        });
      } else {
        selectedDays.forEach(dayIndex => {
          const evDate = new Date(weekStart);
          evDate.setDate(weekStart.getDate() + dayIndex);
          const isoDate = dateToISODate(evDate);
          calendar.addEvent({
            title,
            start: startTime ? isoDate + 'T' + startTime : isoDate,
            end: endTime ? isoDate + 'T' + endTime : null,
            extendedProps: { details, completed: false },
            allDay: !startTime
          });
        });
      }
    }

    modal.style.display = 'none';
    resetForm();
    updateGraph();
  };

  closeModalBtn.onclick = () => {
    if (autoCreatedEvent && currentEvent) {
      try { currentEvent.remove(); } catch (e) {}
    }
    resetForm();
    modal.style.display = 'none';
    autoCreatedEvent = false;
    currentEvent = null;
  };

  function formatToHHMM(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  function dateToISODate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  function resetForm() {
    eventTitleInput.value = '';
    startTimeInput.value = '';
    endTimeInput.value = '';
    detailsInput.value = '';
    dayButtons.forEach(b => b.classList.remove('active'));
    selectedDate = null;
    currentEvent = null;
    autoCreatedEvent = false;

    eventTitleInput.style.display = 'inline-block';
    startTimeInput.style.display = 'inline-block';
    endTimeInput.style.display = 'inline-block';
    detailsInput.style.display = 'inline-block';
    dayButtons.forEach(b => b.style.display = 'inline-block');
  }

  dayButtons.forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('active');
  }));

  window.onclick = function(e) {
    if (e.target === modal) {
      if (autoCreatedEvent && currentEvent) {
        try { currentEvent.remove(); } catch (err) {}
      }
      resetForm();
      modal.style.display = 'none';
    }
  };

  function updateGraph() {
    const today = (new Date()).toISOString().split('T')[0];
    const events = calendar.getEvents();
    let completed = 0, remaining = 0;

    events.forEach(ev => {
      if (!ev.start) return;
      const evDate = ev.start.toISOString().split('T')[0];
      if (evDate === today) {
        if (ev.extendedProps && ev.extendedProps.completed) {
          completed++;
        } else {
          remaining++;
        }
      }
    });

    const deletedCount = deletedEventsToday.length;

    if (taskChart) {
      taskChart.data.datasets[0].data = [completed, remaining, deletedCount];
      taskChart.update();
    }
    const graphText = document.getElementById('graphText');
    if (graphText) graphText.textContent = `Completed: ${completed} / Remaining: ${remaining} / Deleted: ${deletedCount}`;
  }

  updateGraph();
});

function showSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.add('show');
}

function hidesidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.remove('show');
}