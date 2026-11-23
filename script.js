
/* ==========================================
   QUEUEFLOW - SMART CAMPUS QUEUE MANAGEMENT
   Front-end application
========================================== */


/* 1. CAMPUS DEPARTMENTS */

const departments = [
    {
        code: "ADM",
        name: "Administration",
        description: "Certificates, student records and general enquiries.",
        icon: "▤"
    },
    {
        code: "ACC",
        name: "Accounts & Fees",
        description: "Fee payments, receipts and financial assistance.",
        icon: "₹"
    },
    {
        code: "ID",
        name: "ID Card Section",
        description: "New ID cards, replacements and corrections.",
        icon: "▣"
    },
    {
        code: "LIB",
        name: "Library",
        description: "Book issue, returns and library assistance.",
        icon: "▥"
    },
    {
        code: "IT",
        name: "IT Support",
        description: "Technical assistance and computer-related issues.",
        icon: "⌘"
    },
    {
        code: "PKG",
        name: "Parking Assistance",
        description: "Parking enquiries and vehicle assistance.",
        icon: "P"
    },
    {
        code: "CAN",
        name: "College Canteen",
        description: "Food collection and counter assistance.",
        icon: "☕"
    },
    {
        code: "EXM",
        name: "Examination Cell",
        description: "Exam forms, results and examination enquiries.",
        icon: "✎"
    },
    {
        code: "HST",
        name: "Hostel Office",
        description: "Hostel applications and student assistance.",
        icon: "⌂"
    },
    {
        code: "TRN",
        name: "Transport Office",
        description: "Bus passes, routes and transport enquiries.",
        icon: "▰"
    }
];


/* 2. INITIAL QUEUE DATA */

function createEmptyQueues() {
    const data = {};

    departments.forEach(department => {
        data[department.code] = {
            waiting: [],
            current: null,
            completed: [],
            nextNumber: 1
        };
    });

    return data;
}


/* 3. LOCAL STORAGE */

function loadQueues() {
    try {
        const saved = localStorage.getItem("queueflow_data");

        if (!saved) {
            return createEmptyQueues();
        }

        const parsed = JSON.parse(saved);
        const fresh = createEmptyQueues();

        // Keep only valid department data.
        departments.forEach(department => {
            const code = department.code;
            const old = parsed[code];

            if (old && Array.isArray(old.waiting) &&
                Array.isArray(old.completed)) {
                fresh[code] = {
                    waiting: old.waiting,
                    current: old.current || null,
                    completed: old.completed,
                    nextNumber: Number(old.nextNumber) || 1
                };
            }
        });

        return fresh;

    } catch (error) {
        console.error("Could not load saved queues:", error);
        return createEmptyQueues();
    }
}

let queues = loadQueues();


function saveQueues() {
    try {
        localStorage.setItem("queueflow_data", JSON.stringify(queues));
    } catch (error) {
        showToast("Unable to save data in this browser.");
        console.error(error);
    }
}


/* 4. ACTIVITY HISTORY */

let historyRecords = [];

try {
    historyRecords = JSON.parse(
        localStorage.getItem("queueflow_history") || "[]"
    );

    if (!Array.isArray(historyRecords)) {
        historyRecords = [];
    }
} catch {
    historyRecords = [];
}


function saveHistory() {
    try {
        localStorage.setItem(
            "queueflow_history",
            JSON.stringify(historyRecords)
        );
    } catch (error) {
        console.error("Could not save history:", error);
    }
}


function addHistory(person, status) {
    const record = {
        token: person.token,
        name: person.name,
        studentId: person.studentId,
        department: person.department,
        status: status,
        time: person.time
    };

    const existing = historyRecords.find(
        item => item.token === person.token
    );

    if (existing) {
        existing.status = status;
    } else {
        historyRecords.unshift(record);
    }

    saveHistory();
}


/* 5. DATE AND TOAST */

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });


let toastTimer;

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* 6. PAGE NAVIGATION */

const pageTitles = {
    dashboard: "Campus Overview",
    services: "Campus Services",
    student: "Student Portal",
    operator: "Operator Console",
    history: "Queue History"
};


function navigateTo(pageName) {
    const page = document.getElementById(pageName);

    if (!page) return;

    document.querySelectorAll(".page").forEach(item => {
        item.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    document.getElementById("pageTitle").textContent =
        pageTitles[pageName];

    document.getElementById("breadcrumb").textContent =
        pageName.toUpperCase();

    document.getElementById("sidebar").classList.remove("open");

    refreshPage(pageName);
}


document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.page);
    });
});


document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.goto);
    });
});


document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});


/* 7. QUEUE STATISTICS */

function getWaitingCount() {
    return departments.reduce(
        (total, department) =>
            total + queues[department.code].waiting.length,
        0
    );
}


function getServingCount() {
    return departments.filter(
        department => queues[department.code].current !== null
    ).length;
}


function getCompletedCount() {
    return historyRecords.filter(
        item => item.status === "Completed"
    ).length;
}


function updateStatistics() {
    document.getElementById("totalDepartments").textContent =
        departments.length;

    document.getElementById("totalWaiting").textContent =
        getWaitingCount();

    document.getElementById("totalServing").textContent =
        getServingCount();

    document.getElementById("totalCompleted").textContent =
        getCompletedCount();
}


/* 8. RENDER DEPARTMENT CARDS */

function renderDashboardDepartments() {
    const container = document.getElementById("dashboardDepartments");

    container.innerHTML = departments.map(department => {
        const queue = queues[department.code];

        return `
            <div class="department-card">
                <span class="dept-code">${department.code}</span>
                <h4>${department.name}</h4>
                <p>${queue.waiting.length} students waiting</p>
            </div>
        `;
    }).join("");
}


function renderServiceCards() {
    const container = document.getElementById("serviceGrid");

    const search = document.getElementById("serviceSearch")
        .value.toLowerCase();

    const filter = document.getElementById("serviceFilter").value;

    const filtered = departments.filter(department => {
        const queue = queues[department.code];

        const matchesSearch =
            department.name.toLowerCase().includes(search) ||
            department.code.toLowerCase().includes(search);

        const matchesFilter =
            filter === "all" ||
            (filter === "available" && queue.waiting.length > 0) ||
            (filter === "idle" && queue.waiting.length === 0);

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        container.innerHTML =
            `<div class="panel empty-row">No departments found.</div>`;
        return;
    }

    container.innerHTML = filtered.map(department => {
        const queue = queues[department.code];

        return `
            <article class="service-card">
                <div class="service-card-top">
                    <div class="service-icon">${department.icon}</div>
                    <span class="service-code">${department.code}</span>
                </div>

                <h3>${department.name}</h3>
                <p>${department.description}</p>

                <div class="service-meta">
                    <span>Waiting students</span>
                    <strong>${queue.waiting.length}</strong>
                </div>

                <button class="primary-btn"
                    data-join-service="${department.code}">
                    Join this queue →
                </button>
            </article>
        `;
    }).join("");

    container.querySelectorAll("[data-join-service]").forEach(button => {
        button.addEventListener("click", () => {
            document.getElementById("studentService").value =
                button.dataset.joinService;

            navigateTo("student");
        });
    });
}


/* 9. POPULATE DEPARTMENT SELECTS */

function populateSelects() {
    const options = departments.map(department =>
        `<option value="${department.code}">
            ${department.name}
        </option>`
    ).join("");

    document.getElementById("studentService").innerHTML =
        `<option value="">Choose a department</option>${options}`;

    document.getElementById("operatorService").innerHTML = options;
}


/* 10. GENERATE STUDENT TOKEN */

document.getElementById("tokenForm").addEventListener(
    "submit",
    function(event) {
        event.preventDefault();

        const name = document.getElementById("studentName")
            .value.trim();

        const studentId = document.getElementById("studentId")
            .value.trim();

        const code = document.getElementById("studentService").value;

        if (!name || !code) {
            showToast("Please enter your name and select a department.");
            return;
        }

        const queue = queues[code];

        const number = String(queue.nextNumber).padStart(3, "0");

        const token = `${code}-${number}`;

        const person = {
            token: token,
            name: name,
            studentId: studentId || "Not provided",
            department: code,
            time: new Date().toLocaleString("en-IN"),
            status: "Waiting"
        };

        queue.waiting.push(person);
        queue.nextNumber++;

        saveQueues();
        addHistory(person, "Waiting");

        const position = queue.waiting.length;

        document.getElementById("tokenPlaceholder")
            .classList.add("hidden");

        document.getElementById("generatedToken")
            .classList.remove("hidden");

        document.getElementById("generatedTokenNumber")
            .textContent = token;

        document.getElementById("generatedStudentName")
            .textContent = name;

        document.getElementById("generatedDepartment")
            .textContent = departments.find(
                department => department.code === code
            ).name;

        document.getElementById("generatedPosition")
            .textContent = String(position).padStart(2, "0");

        document.getElementById("studentName").value = "";
        document.getElementById("studentId").value = "";

        document.getElementById("studentService").value = "";

        refreshAll();

        showToast(`Token ${token} generated successfully!`);
    }
);


/* 11. OPERATOR CONSOLE */

function getSelectedDepartment() {
    return document.getElementById("operatorService").value;
}


function renderOperator() {
    const code = getSelectedDepartment();
    const queue = queues[code];

    const department = departments.find(item => item.code === code);

    if (!queue || !department) return;

    const current = queue.current;

    document.getElementById("operatorCurrent").textContent =
        current ? current.token : "---";

    document.getElementById("operatorCurrentName").textContent =
        current ? current.name : "No active token";

    document.getElementById("operatorCurrentService").textContent =
        department.name;

    document.getElementById("operatorWaiting").textContent =
        queue.waiting.length;

    document.getElementById("operatorCompleted").textContent =
        queue.completed.length;

    document.getElementById("operatorNext").textContent =
        queue.waiting.length ? queue.waiting[0].token : "---";

    const tbody = document.getElementById("operatorWaitingList");

    if (queue.waiting.length === 0) {
        tbody.innerHTML =
            `<tr><td colspan="4" class="empty-row">No students waiting.</td></tr>`;
    } else {
        tbody.innerHTML = queue.waiting.map(person => `
            <tr>
                <td><strong>${person.token}</strong></td>
                <td>${escapeHTML(person.name)}</td>
                <td>${escapeHTML(person.studentId)}</td>
                <td><span class="status-badge">Waiting</span></td>
            </tr>
        `).join("");
    }
}


document.getElementById("operatorService")
    .addEventListener("change", renderOperator);


document.getElementById("callNextBtn")
    .addEventListener("click", function() {

        const code = getSelectedDepartment();
        const queue = queues[code];

        const message = document.getElementById("operatorMessage");

        if (queue.current) {
            message.textContent =
                "Complete the current token before calling another.";
            return;
        }

        if (queue.waiting.length === 0) {
            message.textContent = "No students are waiting.";
            return;
        }

        queue.current = queue.waiting.shift();

        queue.current.status = "Serving";

        addHistory(queue.current, "Serving");

        saveQueues();
        refreshAll();

        message.textContent =
            `${queue.current.token} is now being served.`;

        showToast("Next student called successfully.");
    });


document.getElementById("completeBtn")
    .addEventListener("click", function() {

        const code = getSelectedDepartment();
        const queue = queues[code];

        const message = document.getElementById("operatorMessage");

        if (!queue.current) {
            message.textContent = "There is no active token to complete.";
            return;
        }

        const completedPerson = queue.current;

        queue.completed.push(completedPerson);

        addHistory(completedPerson, "Completed");

        queue.current = null;

        saveQueues();
        refreshAll();

        message.textContent =
            `${completedPerson.token} completed successfully.`;

        showToast("Service marked as completed.");
    });


/* 12. HISTORY TABLE */

function renderHistory() {
    const search = document.getElementById("historySearch")
        .value.toLowerCase();

    const filter = document.getElementById("historyFilter").value;

    const filtered = historyRecords.filter(item => {
        const department = departments.find(
            d => d.code === item.department
        );

        const departmentName = department ? department.name : item.department;

        const matchesSearch =
            item.token.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search) ||
            departmentName.toLowerCase().includes(search);

        const matchesFilter =
            filter === "all" || item.status === filter;

        return matchesSearch && matchesFilter;
    });

    const tbody = document.getElementById("historyTable");

    if (filtered.length === 0) {
        tbody.innerHTML =
            `<tr><td colspan="5" class="empty-row">No activity records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const department = departments.find(
            d => d.code === item.department
        );

        const departmentName = department ? department.name : item.department;

        const statusClass = item.status.toLowerCase();

        return `
            <tr>
                <td><strong>${item.token}</strong></td>
                <td>${escapeHTML(item.name)}</td>
                <td>${departmentName}</td>
                <td>${escapeHTML(item.time)}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${item.status}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}


document.getElementById("historySearch")
    .addEventListener("input", renderHistory);

document.getElementById("historyFilter")
    .addEventListener("change", renderHistory);


document.getElementById("clearHistoryBtn")
    .addEventListener("click", function() {

        const confirmed = confirm(
            "Clear all activity history? This cannot be undone."
        );

        if (!confirmed) return;

        historyRecords = [];
        saveHistory();

        // Preserve active and waiting queue data.
        // Only the history records are cleared.
        refreshAll();

        showToast("History cleared.");
    });


/* 13. DASHBOARD CHARTS */

let departmentChart = null;
let queueChart = null;

const chartColors = [
    "#36d985",
    "#65b8f0",
    "#f5bd64",
    "#bd96ff",
    "#f28caa",
    "#5dd5c5",
    "#a5d66e",
    "#e5a46a",
    "#8bafff",
    "#d78bc6"
];


function createCharts() {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js could not be loaded.");
        return;
    }

    const barContext = document.getElementById("departmentChart");
    const doughnutContext = document.getElementById("queueChart");

    departmentChart = new Chart(barContext, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                label: "Waiting students",
                data: [],
                backgroundColor: "#36d985",
                borderRadius: 6,
                maxBarThickness: 25
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: "#8da99a", font: { size: 9 } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#8da99a", precision: 0 },
                    grid: { color: "rgba(132,190,151,0.10)" }
                }
            }
        }
    });

    queueChart = new Chart(doughnutContext, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: chartColors,
                borderColor: "#102c20",
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
                legend: { display: false }
            }
        }
    });
}


function updateCharts() {
    if (!departmentChart || !queueChart) return;

    const labels = departments.map(d => d.code);

    const values = departments.map(
        d => queues[d.code].waiting.length
    );

    departmentChart.data.labels = labels;
    departmentChart.data.datasets[0].data = values;
    departmentChart.update();

    queueChart.data.labels = labels;
    queueChart.data.datasets[0].data = values;
    queueChart.update();

    document.getElementById("queueLegend").innerHTML =
        departments
            .filter(d => queues[d.code].waiting.length > 0)
            .map(d => `
                <span class="legend-item">
                    <span class="legend-dot"></span>
                    ${d.code}
                </span>
            `).join("") ||
        `<span class="muted">No active waiting queues</span>`;
}


/* 14. BASIC HTML ESCAPING */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


/* 15. REFRESH FUNCTIONS */

function refreshAll() {
    updateStatistics();
    renderDashboardDepartments();
    renderServiceCards();
    renderOperator();
    renderHistory();
    updateCharts();
}


function refreshPage(pageName) {
    if (pageName === "dashboard") {
        refreshAll();
    }

    if (pageName === "services") {
        renderServiceCards();
    }

    if (pageName === "operator") {
        renderOperator();
    }

    if (pageName === "history") {
        renderHistory();
    }
}


/* 16. SEARCH AND FILTER EVENTS */

document.getElementById("serviceSearch")
    .addEventListener("input", renderServiceCards);

document.getElementById("serviceFilter")
    .addEventListener("change", renderServiceCards);


/* 17. START APPLICATION */

populateSelects();
createCharts();
refreshAll();

console.log("QueueFlow application started successfully.");
