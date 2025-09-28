const steps = document.querySelectorAll(".form");
const stepTabs = document.querySelectorAll(".step");
const nextBtns = document.querySelectorAll(".next");
const prevBtns = document.querySelectorAll(".prev");

let formStepIndex = 0;

function updateStepDisplay() {
    steps.forEach((form, i) => {
        form.classList.toggle("active", i === formStepIndex);
        stepTabs[i].classList.toggle("active", i === formStepIndex);
    });
}

nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (formStepIndex < steps.length - 1) {
            formStepIndex++;
            updateStepDisplay();
        }
    });
});

prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (formStepIndex > 0) {
            formStepIndex--;
            updateStepDisplay();
        }
    });
});

function setupDynamicFields(listId, addId, className, placeholder, colors, hasDate = false) {
    const list = document.getElementById(listId);
    const addLink = document.getElementById(addId);
    let colorIndex = 0;

    addLink.addEventListener("click", () => {
        const div = document.createElement("div");
        div.classList.add(className);
        const color = colors[colorIndex % colors.length];
        colorIndex++;

        let innerHTML = `<span class="color-box" style="background:${color};"></span>
                         <input type="text" placeholder="${placeholder}" data-color="${color}">`;

        if (hasDate) {
            innerHTML += `<input type="date" placeholder="Date" class="holiday-date">`;
        }

        innerHTML += `<button type="button" class="remove-btn" style="border: 2px solid black; color: black;">🗑</button>`;

        div.innerHTML = innerHTML;
        list.appendChild(div);

        div.querySelector(".remove-btn").addEventListener("click", () => {
            div.remove();
        });
    });
}

setupDynamicFields("holiday-list", "add-holiday", "holiday-item", "Holiday name", ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff"], true);
setupDynamicFields("course-list", "add-course", "course-item", "Course name", ["#ff9ff3", "#00d2d3", "#ff6b6b", "#48dbfb"]);
setupDynamicFields("activity-list", "add-activity", "activity-item", "Activity name", ["#ff6b6b", "#feca57", "#54a0ff", "#10ac84", "#5f27cd"]);

const form = document.getElementById('multistepForm');

form.addEventListener('submit', function(event) {
    event.preventDefault();

    const courses = Array.from(document.querySelectorAll('#course-list .course-item')).map(item => {
        const input = item.querySelector('input');
        return {
            name: input.value,
            color: input.getAttribute('data-color')
        };
    }).filter(item => item.name);

    const activities = Array.from(document.querySelectorAll('#activity-list .activity-item')).map(item => {
        const input = item.querySelector('input');
        return {
            name: input.value,
            color: input.getAttribute('data-color')
        };
    }).filter(item => item.name);

    const holidays = Array.from(document.querySelectorAll('#holiday-list .holiday-item')).map(item => {
        const nameInput = item.querySelector('input[type="text"]');
        const dateInput = item.querySelector('.holiday-date');
        return {
            title: nameInput.value,
            date: dateInput.value,
            color: nameInput.getAttribute('data-color')
        };
    }).filter(item => item.title && item.date);

    const wakeUpTime = document.getElementById('wake-up-time').value;
    const sleepTime = document.getElementById('sleep-time').value;

    const plannerData = {
        holidays: holidays,
        courses: courses,
        activities: activities,
        wakeUpTime: wakeUpTime,
        sleepTime: sleepTime
    };

    localStorage.setItem('plannerData', JSON.stringify(plannerData));

    window.location.href = 'index2.html';
});

function showSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.add('show');
}

function hidesidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.remove('show');
}
