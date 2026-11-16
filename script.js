
// ==========================================
// QUEUEFLOW - SMART CAMPUS QUEUE MANAGEMENT
// ==========================================

const services = [
    { id: "ADM", name: "College Administration", icon: "🏛️", description: "Bonafide certificates, student records and general enquiries.", wait: 5 },
    { id: "ACC", name: "Accounts & Fees", icon: "💳", description: "Fee payments, receipts and scholarship enquiries.", wait: 7 },
    { id: "ID", name: "ID Card Section", icon: "🪪", description: "New ID cards, replacements and corrections.", wait: 4 },
    { id: "LIB", name: "Library", icon: "📚", description: "Book issues, returns and library assistance.", wait: 3 },
    { id: "IT", name: "IT Support", icon: "💻", description: "Technical support and campus computer assistance.", wait: 8 },
    { id: "PKG", name: "Parking Assistance", icon: "🚗", description: "Parking permits and vehicle-related assistance.", wait: 3 },
    { id: "CAN", name: "College Canteen", icon: "🍽️", description: "Food collection and counter assistance.", wait: 2 },
    { id: "EXM", name: "Examination Cell", icon: "📝", description: "Exam forms, hall tickets and results enquiries.", wait: 6 },
    { id: "HOS", name: "Hostel Office", icon: "🏠", description: "Hostel admissions and accommodation enquiries.", wait: 5 },
    { id: "TRN", name: "Transport Office", icon: "🚌", description: "Bus passes, routes and transport enquiries.", wait: 4 }
];

const STORAGE_KEY = "queueflow_frontend_v1";

function createInitialState() {
    const queues = {};

    services.forEach(service => {
        queues[service.id] = {
            nextNumber: 1,
            waiting: [],
            current: null
        };
    });

    return {
        queues,
        history: []
    };
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const data = JSON.parse(saved);

            if (data && data.queues && data.history) {
                services.forEach(service => {
                    if (!data.queues[service.id]) {
                        data.queues[service.id] = {
                            nextNumber: 1,
                            waiting: [],
                            current: null
                        };
                    }
                });

                return data;
            }
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
    }

    return createInitialState();
}

let state = loadState();

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getService(id) {
    return services.find(service => service.id === id);
}

function getToken(person) {
    return `${person.service}-${String(person.number).padStart(3, "0")}`;
}

function getAllPeople() {
    return state.history;
}

function getWaitingTotal() {
    return services.reduce((total, service) => {
        return total + state.queues[service.id].waiting.length;
    }, 0);
}

function getServingTotal() {
    return services.filter(service => {
        return state.queues[service.id].current !== null;
    }).length;
}

function getCompletedTotal() {
    return state.history.filter(person => {
        return person.status === "Completed";
    }).length;
}

function getTodayPeople() {
    const today = new Date().toDateString();

    return state.history.filter(person => {
        return new Date(person.createdAt).toDateString() === today;
    });
}

function estimateWait(serviceId, position) {
    const service = getService(serviceId);
    const queue = state.queues[serviceId];

    let peopleAhead = Math.max(0, position - 1);

    if (queue.current) {
        peopleAhead += 1;
    }

    return peopleAhead * service.wait;
}

function formatWait(minutes) {
    if (minutes === 0) return "Almost ready";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

// ==========================================
// PAGE NAVIGATION
// ==========================================

const pageNames = {
    dashboard: "Dashboard Overview",
    student: "Join a Queue",
    operator: "Operator Control Center",
    services: "Campus Services",
    history: "Queue History"
};

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    document.getElementById("pageTitle").textContent = pageNames[pageId];
    document.getElementById("breadcrumb").textContent = pageNames[pageId];

    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// ==========================================
// INITIAL SETUP
// ==========================================

function setupSelects() {
    const studentSelect = document.getElementById("serviceSelect");
    const operatorSelect = document.getElementById("operatorService");

    services.forEach(service => {
        const option1 = document.createElement("option");
        option1.value = service.id;
        option1.textContent = `${service.icon} ${service.name}`;
        studentSelect.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = service.id;
        option2.textContent = `${service.icon} ${service.name}`;
        operatorSelect.appendChild(option2);
    });
}

// ==========================================
// JOIN QUEUE AND GENERATE TOKEN
// ==========================================

document.getElementById("joinForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const serviceId = document.getElementById("serviceSelect").value;
    const message = document.getElementById("joinMessage");

    if (!name || !serviceId) {
        message.textContent = "Please enter your name and choose a service.";
        return;
    }

    const queue = state.queues[serviceId];
    const service = getService(serviceId);

    const person = {
        service: serviceId,
        number: queue.nextNumber,
        name,
        studentId: studentId || "Not provided",
        status: "Waiting",
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    queue.nextNumber++;
    queue.waiting.push(person);
    state.history.unshift(person);

    const position = queue.waiting.length;

    saveState();

    document.getElementById("generatedToken").textContent = getToken(person);
    document.getElementById("generatedService").textContent = service.name;
    document.getElementById("generatedPosition").textContent = `#${position}`;
    document.getElementById("generatedWait").textContent =
        formatWait(estimateWait(serviceId, position));

    message.textContent = "Your token has been generated successfully!";

    this.reset();

    renderAll();
});

// ==========================================
// OPERATOR PANEL
// ==========================================

const operatorSelect = document.getElementById("operatorService");

function getSelectedServiceId() {
    return operatorSelect.value || services[0].id;
}

function callNext() {
    const serviceId = getSelectedServiceId();
    const queue = state.queues[serviceId];
    const message = document.getElementById("operatorMessage");

    if (queue.current) {
        message.textContent = "Complete or skip the active token first.";
        return;
    }

    if (queue.waiting.length === 0) {
        message.textContent = "No students are waiting in this queue.";
        return;
    }

    const person = queue.waiting.shift();

    person.status = "Serving";
    queue.current = person;

    saveState();
    message.textContent = `${getToken(person)} is now being served.`;

    renderAll();
}

function completeToken() {
    const serviceId = getSelectedServiceId();
    const queue = state.queues[serviceId];
    const message = document.getElementById("operatorMessage");

    if (!queue.current) {
        message.textContent = "There is no active token to complete.";
        return;
    }

    const person = queue.current;

    person.status = "Completed";
    person.completedAt = new Date().toISOString();

    queue.current = null;

    saveState();
    message.textContent = `${getToken(person)} completed successfully.`;

    renderAll();
}

function skipToken() {
    const serviceId = getSelectedServiceId();
    const queue = state.queues[serviceId];
    const message = document.getElementById("operatorMessage");

    if (!queue.current) {
        message.textContent = "There is no active token to skip.";
        return;
    }

    const person = queue.current;

    person.status = "Skipped";
    person.completedAt = new Date().toISOString();

    queue.current = null;

    saveState();
    message.textContent = `${getToken(person)} has been skipped.`;

    renderAll();
}

document.getElementById("callNextBtn").addEventListener("click", callNext);
document.getElementById("completeBtn").addEventListener("click", completeToken);

operatorSelect.addEventListener("change", () => {
    document.getElementById("operatorMessage").textContent = "";
    renderOperator();
});

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {
    document.getElementById("totalWaiting").textContent = getWaitingTotal();
    document.getElementById("totalServing").textContent = getServingTotal();
    document.getElementById("totalCompleted").textContent = getTodayPeople()
        .filter(person => person.status === "Completed").length;

    const serviceContainer = document.getElementById("dashboardServices");

    serviceContainer.innerHTML = services.map(service => {
        const queue = state.queues[service.id];

        return `
            <div class="service-row">
                <div class="service-icon">${service.icon}</div>
                <div class="service-info">
                    <strong>${escapeHTML(service.name)}</strong>
                    <small>${queue.current ? "Counter active" : "Available"}</small>
                </div>
                <div class="queue-number">
                    ${queue.waiting.length}
                    <small>waiting</small>
                </div>
            </div>
        `;
    }).join("");

    const servingContainer = document.getElementById("servingList");
    const activeServices = services.filter(service => {
        return state.queues[service.id].current;
    });

    servingContainer.innerHTML = activeServices.length
        ? activeServices.map(service => {
            const person = state.queues[service.id].current;

            return `
                <div class="serving-item">
                    <div>
                        <strong>${getToken(person)}</strong>
                        <small>${escapeHTML(service.name)}</small>
                    </div>
                    <span>${escapeHTML(person.name)}</span>
                </div>
            `;
        }).join("")
        : `<div class="empty-state">No active tokens right now.</div>`;

    const recent = state.history.slice(0, 5);

    document.getElementById("recentActivity").innerHTML = recent.length
        ? recent.map(person => `
            <tr>
                <td>${getToken(person)}</td>
                <td>${escapeHTML(person.name)}</td>
                <td>${escapeHTML(getService(person.service).name)}</td>
                <td><span class="status ${person.status}">${person.status}</span></td>
            </tr>
        `).join("")
        : `<tr><td colspan="4">No queue activity yet.</td></tr>`;
}

// ==========================================
// OPERATOR RENDERING
// ==========================================

function renderOperator() {
    const serviceId = getSelectedServiceId();
    const queue = state.queues[serviceId];

    const current = queue.current;

    document.getElementById("operatorCurrent").textContent =
        current ? getToken(current) : "---";

    document.getElementById("operatorName").textContent =
        current ? current.name : "No active token";

    document.getElementById("operatorStudentId").textContent =
        current ? current.studentId : "Waiting for next student";

    document.getElementById("operatorWaitingCount").textContent =
        queue.waiting.length;

    document.getElementById("operatorQueue").innerHTML =
        queue.waiting.length
            ? queue.waiting.map((person, index) => `
                <div class="operator-queue-item">
                    <span>${index + 1}. ${escapeHTML(person.name)}</span>
                    <strong>${getToken(person)}</strong>
                </div>
            `).join("")
            : `<div class="empty-state">No students in this queue.</div>`;
}

// ==========================================
// ALL SERVICES
// ==========================================

function renderServices() {
    document.getElementById("allServices").innerHTML =
        services.map(service => {
            const queue = state.queues[service.id];

            return `
                <div class="service-card">
                    <div class="service-icon">${service.icon}</div>
                    <h3>${escapeHTML(service.name)}</h3>
                    <p>${escapeHTML(service.description)}</p>
                    <div class="service-card-bottom">
                        <span>${queue.waiting.length} waiting</span>
                        <strong>${queue.current ? "Serving" : "Available"}</strong>
                    </div>
                </div>
            `;
        }).join("");
}

// ==========================================
// QUEUE HISTORY
// ==========================================

function renderHistory() {
    const history = state.history;

    document.getElementById("historyTotal").textContent = history.length;
    document.getElementById("historyCompleted").textContent =
        history.filter(person => person.status === "Completed").length;
    document.getElementById("historyWaiting").textContent =
        history.filter(person => person.status === "Waiting").length;
    document.getElementById("historySkipped").textContent =
        history.filter(person => person.status === "Skipped").length;

    document.getElementById("historyTable").innerHTML =
        history.length
            ? history.map(person => `
                <tr>
                    <td>${getToken(person)}</td>
                    <td>${escapeHTML(person.name)}</td>
                    <td>${escapeHTML(getService(person.service).name)}</td>
                    <td><span class="status ${person.status}">${person.status}</span></td>
                    <td>${new Date(person.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5">No history available.</td></tr>`;
}

// ==========================================
// SECURITY: DISPLAY USER TEXT SAFELY
// ==========================================

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

// ==========================================
// RESET DEMO DATA
// ==========================================

document.getElementById("resetBtn").addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure? This will delete all QueueFlow demo data."
    );

    if (!confirmed) return;

    state = createInitialState();
    saveState();

    document.getElementById("generatedToken").textContent = "---";
    document.getElementById("generatedService").textContent =
        "Your service will appear here";
    document.getElementById("generatedPosition").textContent = "--";
    document.getElementById("generatedWait").textContent = "--";

    document.getElementById("operatorMessage").textContent = "";
    document.getElementById("joinMessage").textContent = "";

    renderAll();
});

// ==========================================
// UPDATE ALL APPLICATION SECTIONS
// ==========================================

function renderAll() {
    renderDashboard();
    renderOperator();
    renderServices();
    renderHistory();
}

function initializeApp() {
    setupSelects();

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    renderAll();
}

initializeApp();
