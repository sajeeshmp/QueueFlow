
/* ==========================================
   QUEUEFLOW - QUEUE MANAGEMENT SYSTEM
   Front-end only version
========================================== */

// 1. CAMPUS SERVICES

const services = [
    {
        id: "ADM",
        name: "Administration",
        description: "Bonafide, student records and general enquiries.",
        icon: "▣",
        color: "#27e6d0"
    },
    {
        id: "ACC",
        name: "Accounts & Fees",
        description: "Fee payments, receipts and financial assistance.",
        icon: "₹",
        color: "#a477ff"
    },
    {
        id: "ID",
        name: "ID Card Section",
        description: "New ID cards, replacements and corrections.",
        icon: "▤",
        color: "#e879d5"
    },
    {
        id: "LIB",
        name: "Library",
        description: "Book issue, return and library support.",
        icon: "▥",
        color: "#ffb36b"
    },
    {
        id: "IT",
        name: "IT Support",
        description: "Computer, network and technical assistance.",
        icon: "⌘",
        color: "#42c8f5"
    },
    {
        id: "PKG",
        name: "Parking Assistance",
        description: "Parking allocation and vehicle enquiries.",
        icon: "P",
        color: "#42e6a4"
    },
    {
        id: "CAN",
        name: "College Canteen",
        description: "Food collection and counter assistance.",
        icon: "☕",
        color: "#ffb36b"
    },
    {
        id: "EXM",
        name: "Examination Cell",
        description: "Exam forms, hall tickets and results.",
        icon: "✎",
        color: "#a477ff"
    },
    {
        id: "HST",
        name: "Hostel Office",
        description: "Room allocation and hostel enquiries.",
        icon: "⌂",
        color: "#e879d5"
    },
    {
        id: "TRN",
        name: "Transport Office",
        description: "Bus routes, passes and transport support.",
        icon: "▰",
        color: "#27e6d0"
    }
];


// 2. INITIAL DATA

const STORAGE_KEY = "queueflow_data_v1";

function createDefaultData() {
    const queues = {};

    services.forEach(service => {
        queues[service.id] = {
            nextNumber: 1,
            waiting: [],
            current: null,
            completed: []
        };
    });

    return {
        queues: queues,
        history: []
    };
}


// 3. LOAD AND SAVE DATA

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return createDefaultData();
        }

        const data = JSON.parse(saved);

        if (!data.queues || !data.history) {
            return createDefaultData();
        }

        // Add any newly introduced services if needed.
        services.forEach(service => {
            if (!data.queues[service.id]) {
                data.queues[service.id] = {
                    nextNumber: 1,
                    waiting: [],
                    current: null,
                    completed: []
                };
            }
        });

        return data;

    } catch (error) {
        console.error("Unable to load QueueFlow data:", error);
        return createDefaultData();
    }
}

let data = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Unable to save QueueFlow data:", error);
        showToast("Could not save data in this browser.");
    }
}


// 4. HELPER FUNCTIONS

function getService(serviceId) {
    return services.find(service => service.id === serviceId);
}

function getQueue(serviceId) {
    return data.queues[serviceId];
}

function formatToken(serviceId, number) {
    return serviceId + "-" + String(number).padStart(3, "0");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function todayDate() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}


// 5. TOAST NOTIFICATION

let toastTimer;

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


// 6. GENERATE SERVICE DROPDOWNS

function populateServiceDropdowns() {

    const studentSelect = document.getElementById("serviceSelect");
    const operatorSelect = document.getElementById("operatorService");

    services.forEach(service => {

        const studentOption = document.createElement("option");
        studentOption.value = service.id;
        studentOption.textContent = service.name;

        studentSelect.appendChild(studentOption);

        const operatorOption = document.createElement("option");
        operatorOption.value = service.id;
        operatorOption.textContent = service.name;

        operatorSelect.appendChild(operatorOption);

    });

    operatorSelect.value = services[0].id;
}


// 7. DISPLAY SERVICE CARDS

function renderServices(searchTerm = "") {

    const grid = document.getElementById("serviceGrid");

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredServices.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                No matching departments found.
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredServices.map(service => {

        const queue = getQueue(service.id);
        const waiting = queue.waiting.length;

        return `
            <div class="service-card"
                 style="--card-color:${service.color};--card-glow:${service.color}">

                <div class="service-card-top">

                    <div class="service-card-icon">
                        ${service.icon}
                    </div>

                    <span class="service-code">${service.id}</span>

                </div>

                <h3>${escapeHTML(service.name)}</h3>

                <p>${escapeHTML(service.description)}</p>

                <div class="service-card-bottom">

                    <span class="service-waiting">
                        <strong>${waiting}</strong> waiting
                    </span>

                    <button class="service-join"
                            data-service="${service.id}">
                        Join Queue →
                    </button>

                </div>

            </div>
        `;

    }).join("");

}


// 8. JOIN QUEUE

function joinQueue(event) {

    event.preventDefault();

    const nameInput = document.getElementById("studentName");
    const idInput = document.getElementById("studentId");
    const serviceInput = document.getElementById("serviceSelect");

    const name = nameInput.value.trim();
    const studentId = idInput.value.trim();
    const serviceId = serviceInput.value;

    if (name.length < 2) {
        showToast("Please enter a valid student name.");
        return;
    }

    if (!serviceId || !getService(serviceId)) {
        showToast("Please select a department.");
        return;
    }

    const queue = getQueue(serviceId);

    const number = queue.nextNumber;

    const token = formatToken(serviceId, number);

    const student = {
        token: token,
        name: name,
        studentId: studentId || "Not provided",
        serviceId: serviceId,
        createdAt: Date.now(),
        status: "Waiting"
    };

    queue.nextNumber++;

    queue.waiting.push(student);

    data.history.unshift({
        ...student,
        action: "Token Generated",
        time: Date.now()
    });

    saveData();

    // Show digital pass

    document.getElementById("generatedToken").textContent = token;

    document.getElementById("passName").textContent = name;

    document.getElementById("passService").textContent =
        getService(serviceId).name;

    document.getElementById("formMessage").textContent =
        "Your token has been generated successfully!";

    // Reset inputs

    nameInput.value = "";
    idInput.value = "";

    // Update dashboard

    renderEverything();

    showToast("Token " + token + " generated successfully!");

}


// 9. OPERATOR - CALL NEXT STUDENT

function callNext() {

    const serviceId = document.getElementById("operatorService").value;

    const queue = getQueue(serviceId);

    if (queue.current !== null) {
        showToast("Complete the current token first.");
        return;
    }

    if (queue.waiting.length === 0) {
        showToast("No students are waiting in this queue.");
        return;
    }

    const student = queue.waiting.shift();

    student.status = "Serving";

    queue.current = student;

    data.history.unshift({
        ...student,
        action: "Called for Service",
        time: Date.now()
    });

    saveData();

    renderEverything();

    document.getElementById("operatorMessage").textContent =
        "Now serving " + student.name + " (" + student.token + ")";

    showToast("Now calling " + student.token);

}


// 10. OPERATOR - COMPLETE TOKEN

function completeToken() {

    const serviceId = document.getElementById("operatorService").value;

    const queue = getQueue(serviceId);

    if (queue.current === null) {
        showToast("There is no active token to complete.");
        return;
    }

    const student = queue.current;

    student.status = "Completed";
    student.completedAt = Date.now();

    queue.completed.push(student);

    data.history.unshift({
        ...student,
        action: "Service Completed",
        time: Date.now()
    });

    queue.current = null;

    saveData();

    renderEverything();

    document.getElementById("operatorMessage").textContent =
        student.token + " has been completed successfully.";

    showToast("Token " + student.token + " completed!");

}


// 11. DASHBOARD STATISTICS

function renderStatistics() {

    let totalWaiting = 0;
    let totalServing = 0;
    let totalCompleted = 0;

    services.forEach(service => {

        const queue = getQueue(service.id);

        totalWaiting += queue.waiting.length;

        if (queue.current !== null) {
            totalServing++;
        }

        totalCompleted += queue.completed.filter(student => {
            return student.completedAt &&
                new Date(student.completedAt).toDateString() ===
                new Date().toDateString();
        }).length;

    });

    document.getElementById("totalServices").textContent =
        services.length;

    document.getElementById("totalWaiting").textContent =
        totalWaiting;

    document.getElementById("totalServing").textContent =
        totalServing;

    document.getElementById("totalCompleted").textContent =
        totalCompleted;
}


// 12. QUEUE DISTRIBUTION

function renderDistribution() {

    const container =
        document.getElementById("departmentDistribution");

    const maximum = Math.max(
        1,
        ...services.map(service => getQueue(service.id).waiting.length)
    );

    container.innerHTML = services.map(service => {

        const waiting = getQueue(service.id).waiting.length;

        const percentage = (waiting / maximum) * 100;

        return `
            <div class="distribution-item">

                <span class="distribution-name">
                    ${escapeHTML(service.name)}
                </span>

                <span class="distribution-value">
                    ${waiting}
                </span>

                <div class="distribution-track">
                    <div class="distribution-fill"
                         style="width:${percentage}%">
                    </div>
                </div>

            </div>
        `;

    }).join("");

}


// 13. OPERATOR DISPLAY

function renderOperator() {

    const serviceId =
        document.getElementById("operatorService").value;

    const queue = getQueue(serviceId);

    const current = queue.current;

    document.getElementById("operatorToken").textContent =
        current ? current.token : "---";

    document.getElementById("operatorStudent").textContent =
        current ? current.name : "No active token";

    document.getElementById("serviceWaiting").textContent =
        queue.waiting.length;

    document.getElementById("serviceCompleted").textContent =
        queue.completed.length;

    document.getElementById("waitingCount").textContent =
        queue.waiting.length + " waiting";

    // Waiting list table

    const table = document.getElementById("waitingTable");

    if (queue.waiting.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    No students waiting in this department.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = queue.waiting.map(student => {

        const service = getService(student.serviceId);

        return `
            <tr>
                <td>${escapeHTML(student.token)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(student.studentId)}</td>
                <td>${escapeHTML(service.name)}</td>
                <td><span class="status-pill">Waiting</span></td>
            </tr>
        `;

    }).join("");

}


// 14. QUEUE HISTORY

function renderHistory() {

    const table = document.getElementById("historyTable");

    if (data.history.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    No activity recorded yet.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = data.history.slice(0, 40).map(item => {

        const service = getService(item.serviceId);

        let statusClass = "status-pill";

        if (item.action === "Service Completed") {
            statusClass += " status-completed";
        }

        if (item.action === "Called for Service") {
            statusClass += " status-serving";
        }

        return `
            <tr>
                <td>${escapeHTML(item.token)}</td>

                <td>${escapeHTML(item.name)}</td>

                <td>${escapeHTML(service ? service.name : item.serviceId)}</td>

                <td>${formatTime(item.time)}</td>

                <td>
                    <span class="${statusClass}">
                        ${escapeHTML(item.action)}
                    </span>
                </td>
            </tr>
        `;

    }).join("");

}


// 15. CHART

let activityChart = null;

function createChart() {

    const canvas = document.getElementById("activityChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const context = canvas.getContext("2d");

    const cyanGradient = context.createLinearGradient(0, 0, 0, 180);
    cyanGradient.addColorStop(0, "rgba(39,230,208,.35)");
    cyanGradient.addColorStop(1, "rgba(39,230,208,0)");

    const purpleGradient = context.createLinearGradient(0, 0, 0, 180);
    purpleGradient.addColorStop(0, "rgba(164,119,255,.3)");
    purpleGradient.addColorStop(1, "rgba(164,119,255,0)");

    activityChart = new Chart(context, {

        type: "line",

        data: {
            labels: ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"],

            datasets: [
                {
                    label: "Waiting Tokens",
                    data: [2, 5, 3, 8, 5, 4],
                    borderColor: "#27e6d0",
                    backgroundColor: cyanGradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                },
                {
                    label: "Completed Tokens",
                    data: [1, 3, 4, 5, 7, 9],
                    borderColor: "#a477ff",
                    backgroundColor: purpleGradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#8293a9",
                        font: {
                            size: 9
                        }
                    },
                    border: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(255,255,255,.055)"
                    },
                    ticks: {
                        color: "#8293a9",
                        font: {
                            size: 9
                        },
                        precision: 0
                    },
                    border: {
                        display: false
                    }
                }
            }
        }

    });

}


// 16. UPDATE CHART

function updateChart() {

    if (!activityChart) {
        return;
    }

    const waiting = services.reduce((total, service) => {
        return total + getQueue(service.id).waiting.length;
    }, 0);

    const completed = services.reduce((total, service) => {
        return total + getQueue(service.id).completed.length;
    }, 0);

    activityChart.data.datasets[0].data = [
        waiting,
        waiting + 1,
        Math.max(0, waiting - 1),
        waiting + 2,
        waiting,
        waiting + 1
    ];

    activityChart.data.datasets[1].data = [
        completed,
        completed + 1,
        completed + 2,
        completed + 1,
        completed + 3,
        completed + 2
    ];

    activityChart.update("none");

}


// 17. RENDER EVERYTHING

function renderEverything() {

    renderStatistics();
    renderServices(
        document.getElementById("serviceSearch").value
    );
    renderDistribution();
    renderOperator();
    renderHistory();
    updateChart();

}


// 18. CLEAR HISTORY

function clearHistory() {

    const confirmed = confirm(
        "Are you sure you want to clear the activity history?"
    );

    if (!confirmed) {
        return;
    }

    data.history = [];

    saveData();

    renderHistory();

    showToast("Activity history cleared.");

}


// 19. EVENT LISTENERS

document.getElementById("queueForm").addEventListener(
    "submit",
    joinQueue
);

document.getElementById("callNextButton").addEventListener(
    "click",
    callNext
);

document.getElementById("completeButton").addEventListener(
    "click",
    completeToken
);

document.getElementById("operatorService").addEventListener(
    "change",
    renderOperator
);

document.getElementById("serviceSearch").addEventListener(
    "input",
    event => {
        renderServices(event.target.value);
    }
);

document.getElementById("globalSearch").addEventListener(
    "input",
    event => {
        const search = event.target.value;

        document.getElementById("serviceSearch").value = search;

        renderServices(search);

        document.getElementById("services").scrollIntoView({
            behavior: "smooth"
        });
    }
);

document.getElementById("clearHistoryButton").addEventListener(
    "click",
    clearHistory
);

document.getElementById("notificationButton").addEventListener(
    "click",
    () => {
        showToast("QueueFlow is running in front-end demo mode.");
    }
);


// Service card join buttons

document.getElementById("serviceGrid").addEventListener(
    "click",
    event => {

        const button = event.target.closest("[data-service]");

        if (!button) {
            return;
        }

        const serviceId = button.dataset.service;

        document.getElementById("serviceSelect").value = serviceId;

        document.getElementById("join").scrollIntoView({
            behavior: "smooth"
        });

        document.getElementById("studentName").focus();

    }
);


// Sidebar active navigation

document.querySelectorAll(".nav-item").forEach(link => {

    link.addEventListener("click", () => {

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");

    });

});


// 20. START APPLICATION

populateServiceDropdowns();

createChart();

renderEverything();

console.log("QueueFlow initialized successfully.");
