
/* ==========================================
   QUEUEFLOW - SMART CAMPUS QUEUE MANAGEMENT
   Frontend application | Local browser storage
========================================== */

const SERVICES = [
  { id:"ADM", name:"Administration", desc:"Bonafide certificates, student records and general enquiries.", icon:"fa-building-columns" },
  { id:"ACC", name:"Accounts & Fees", desc:"Fee payments, receipts, scholarships and financial queries.", icon:"fa-wallet" },
  { id:"ID", name:"ID Card Section", desc:"New ID cards, replacements and student identity services.", icon:"fa-id-card" },
  { id:"LIB", name:"Library", desc:"Book issues, returns, renewals and library assistance.", icon:"fa-book-open" },
  { id:"IT", name:"IT Support", desc:"Technical assistance, Wi-Fi and computer-related support.", icon:"fa-computer" },
  { id:"PKG", name:"Parking Assistance", desc:"Vehicle registration and campus parking enquiries.", icon:"fa-square-parking" },
  { id:"CAN", name:"College Canteen", desc:"Food collection and canteen counter assistance.", icon:"fa-utensils" },
  { id:"EXM", name:"Examination Cell", desc:"Exam forms, hall tickets, results and academic records.", icon:"fa-file-lines" },
  { id:"HST", name:"Hostel Office", desc:"Hostel applications, room allocation and student support.", icon:"fa-bed" },
  { id:"TRN", name:"Transport Office", desc:"Bus routes, transport passes and travel enquiries.", icon:"fa-bus" }
];

const STORAGE_KEY = "queueflow_v1";

function freshData() {
  return {
    tokens: [],
    sequences: Object.fromEntries(SERVICES.map(s => [s.id, 0]))
  };
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tokens) && saved.sequences) {
      return {
        tokens: saved.tokens,
        sequences: { ...freshData().sequences, ...saved.sequences }
      };
    }
  } catch (error) {
    console.warn("Could not read saved QueueFlow data:", error);
  }
  return freshData();
}

let data = loadData();
let activityChart = null;

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    showToast("Unable to save data in this browser.");
    console.error(error);
  }
}

function getService(id) {
  return SERVICES.find(service => service.id === id);
}

function getWaiting(id) {
  return data.tokens
    .filter(t => t.serviceId === id && t.status === "waiting")
    .sort((a,b) => a.createdAt - b.createdAt);
}

function getServing(id) {
  return data.tokens.find(t => t.serviceId === id && t.status === "serving") || null;
}

function getCompleted(id) {
  return data.tokens.filter(t => t.serviceId === id && t.status === "completed");
}

function getTodayTokens() {
  const today = new Date().toDateString();
  return data.tokens.filter(t => new Date(t.createdAt).toDateString() === today);
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit"
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i>${escapeHTML(message)}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* NAVIGATION */

const pageNames = {
  dashboard: "Overview",
  services: "Campus services",
  student: "Get a token",
  operator: "Operator console",
  history: "Queue history"
};

function showPage(page) {
  if (!pageNames[page]) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === `page-${page}`);
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  document.getElementById("breadcrumbName").textContent = pageNames[page];
  document.getElementById("sidebar").classList.remove("open");

  if (page === "dashboard") renderDashboard();
  if (page === "services") renderServices();
  if (page === "student") renderStudentPage();
  if (page === "operator") renderOperator();
  if (page === "history") renderHistory();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

/* INITIAL SETUP */

function setupDate() {
  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

function setupSelects() {
  const options = SERVICES.map(s =>
    `<option value="${s.id}">${escapeHTML(s.name)} (${s.id})</option>`
  ).join("");

  document.getElementById("studentService").innerHTML =
    `<option value="">Choose a department</option>${options}`;

  document.getElementById("operatorService").innerHTML = options;
}

/* DASHBOARD */

function renderDashboard() {
  const today = getTodayTokens();
  const waiting = data.tokens.filter(t => t.status === "waiting");
  const serving = data.tokens.filter(t => t.status === "serving");
  const completedToday = today.filter(t => t.status === "completed");

  document.getElementById("statDepartments").textContent = SERVICES.length;
  document.getElementById("statWaiting").textContent = waiting.length;
  document.getElementById("statServing").textContent = serving.length;
  document.getElementById("statCompleted").textContent = completedToday.length;

  renderOverviewTable();
  renderDistribution();
  renderActivityChart();
}

function renderOverviewTable() {
  const tbody = document.getElementById("overviewTable");

  tbody.innerHTML = SERVICES.map(service => {
    const current = getServing(service.id);
    const waiting = getWaiting(service.id).length;
    const status = current ? "serving" : waiting ? "waiting" : "idle";
    const label = current ? "Serving" : waiting ? "Waiting" : "Available";

    return `
      <tr>
        <td>
          <div class="dept-cell">
            <span class="dept-mini-icon"><i class="fa-solid ${service.icon}"></i></span>
            <span><strong>${escapeHTML(service.name)}</strong><small>${service.id} Department</small></span>
          </div>
        </td>
        <td>${current ? `<strong>${escapeHTML(current.token)}</strong>` : "—"}</td>
        <td>${waiting}</td>
        <td><span class="status-badge ${status}">${label}</span></td>
        <td><button class="text-button" onclick="openOperator('${service.id}')">Manage →</button></td>
      </tr>
    `;
  }).join("");
}

function renderDistribution() {
  const container = document.getElementById("distributionList");
  const counts = SERVICES.map(s => ({
    service: s,
    count: getWaiting(s.id).length
  })).sort((a,b) => b.count - a.count);

  const max = Math.max(1, ...counts.map(item => item.count));

  container.innerHTML = counts.slice(0, 6).map(item => `
    <div class="distribution-item">
      <span class="distribution-name">${escapeHTML(item.service.name)}</span>
      <span class="distribution-value">${item.count} waiting</span>
      <div class="progress-track">
        <div class="progress-fill" style="width:${item.count / max * 100}%"></div>
      </div>
    </div>
  `).join("");
}

function renderActivityChart() {
  const canvas = document.getElementById("activityChart");
  if (!canvas || typeof Chart === "undefined") return;

  const today = getTodayTokens();
  const labels = ["8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM"];

  const generated = labels.map((_, index) => {
    const hour = index + 8;
    return today.filter(t => new Date(t.createdAt).getHours() === hour).length;
  });

  const completed = labels.map((_, index) => {
    const hour = index + 8;
    return today.filter(t =>
      t.status === "completed" &&
      t.completedAt &&
      new Date(t.completedAt).getHours() === hour
    ).length;
  });

  if (activityChart) activityChart.destroy();

  activityChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Tokens generated",
          data: generated,
          borderColor: "#b69aff",
          backgroundColor: "rgba(182,154,255,.12)",
          fill: true,
          tension: .4,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: "Tokens completed",
          data: completed,
          borderColor: "#80e6b2",
          backgroundColor: "rgba(128,230,178,.08)",
          fill: true,
          tension: .4,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#a99fbb", boxWidth: 8, usePointStyle: true, font: { size: 10 } }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.045)" },
          ticks: { color: "#887e99", font: { size: 9 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,.045)" },
          ticks: { color: "#887e99", precision: 0, font: { size: 9 } }
        }
      }
    }
  });
}

/* CAMPUS SERVICES */

function renderServices() {
  const query = document.getElementById("serviceSearch").value.trim().toLowerCase();
  const filtered = SERVICES.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.id.toLowerCase().includes(query) ||
    s.desc.toLowerCase().includes(query)
  );

  document.getElementById("serviceCount").textContent =
    `${filtered.length} department${filtered.length === 1 ? "" : "s"}`;

  document.getElementById("servicesGrid").innerHTML = filtered.length
    ? filtered.map(s => {
      const waiting = getWaiting(s.id).length;
      const current = getServing(s.id);

      return `
        <article class="service-card">
          <div class="service-card-top">
            <div class="service-icon"><i class="fa-solid ${s.icon}"></i></div>
            <span class="service-code">${s.id}</span>
          </div>
          <h3>${escapeHTML(s.name)}</h3>
          <p>${escapeHTML(s.desc)}</p>
          <div class="service-stats">
            <div><strong>${waiting}</strong><small>Waiting</small></div>
            <div><strong>${current ? escapeHTML(current.token) : "—"}</strong><small>Now serving</small></div>
            <div><strong>${getCompleted(s.id).length}</strong><small>Completed</small></div>
          </div>
          <button class="secondary-button" onclick="openOperator('${s.id}')">
            Manage department <i class="fa-solid fa-arrow-right"></i>
          </button>
        </article>
      `;
    }).join("")
    : `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>No departments match your search.</p></div>`;
}

function openOperator(serviceId) {
  document.getElementById("operatorService").value = serviceId;
  showPage("operator");
}

/* STUDENT TOKEN GENERATION */

document.getElementById("tokenForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("studentName").value.trim();
  const studentId = document.getElementById("studentId").value.trim();
  const serviceId = document.getElementById("studentService").value;

  if (!name || !serviceId) {
    showToast("Please enter your name and choose a department.");
    return;
  }

  if (!getService(serviceId)) return;

  data.sequences[serviceId] = (data.sequences[serviceId] || 0) + 1;

  const token = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    token: `${serviceId}-${String(data.sequences[serviceId]).padStart(3,"0")}`,
    serviceId,
    studentName: name,
    studentId,
    status: "waiting",
    createdAt: Date.now(),
    calledAt: null,
    completedAt: null
  };

  data.tokens.push(token);
  saveData();

  document.getElementById("studentName").value = "";
  document.getElementById("studentId").value = "";
  document.getElementById("studentService").value = "";

  showTokenResult(token);
  renderStudentPage();
  showToast(`Token ${token.token} generated successfully!`);
});

function showTokenResult(token) {
  const service = getService(token.serviceId);
  const position = getWaiting(token.serviceId).findIndex(t => t.id === token.id) + 1;
  const result = document.getElementById("tokenResult");

  result.classList.remove("hidden");
  result.innerHTML = `
    <div class="panel-heading">
      <div><h3><i class="fa-solid fa-circle-check" style="color:#80e6b2"></i> Your token is ready!</h3><p>Keep this token safe and track your queue.</p></div>
      <span class="status-badge waiting">Waiting</span>
    </div>
    <div class="token-ticket">
      <div>
        <small>YOUR TOKEN NUMBER</small>
        <strong>${escapeHTML(token.token)}</strong>
        <small>${escapeHTML(service.name)} · ${escapeHTML(token.studentName)}</small>
      </div>
      <div class="ticket-position">
        <small>QUEUE POSITION</small>
        <strong>#${position}</strong>
        <small>${position === 1 ? "You are next!" : `${position - 1} ahead of you`}</small>
      </div>
    </div>
  `;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderStudentPage() {
  const container = document.getElementById("recentTokens");
  const recent = [...data.tokens].sort((a,b) => b.createdAt - a.createdAt).slice(0,5);

  container.innerHTML = recent.length ? recent.map(t => {
    const service = getService(t.serviceId);
    const position = getWaiting(t.serviceId).findIndex(item => item.id === t.id) + 1;
    const detail = t.status === "waiting"
      ? `Position ${position} in ${service.name}`
      : t.status === "serving"
        ? `Now serving · ${service.name}`
        : `Completed · ${service.name}`;

    return `
      <div class="recent-token">
        <div><strong>${escapeHTML(t.token)}</strong><small>${escapeHTML(t.studentName)} · ${escapeHTML(detail)}</small></div>
        <span class="status-badge ${t.status}">${t.status}</span>
      </div>
    `;
  }).join("") : `<div class="empty-state"><i class="fa-solid fa-ticket"></i><p>No tokens generated yet. Your first token starts here.</p></div>`;
}

/* OPERATOR CONSOLE */

function renderOperator() {
  const serviceId = document.getElementById("operatorService").value;
  const service = getService(serviceId);
  if (!service) return;

  const current = getServing(serviceId);
  const waiting = getWaiting(serviceId);

  document.getElementById("operatorWaitingCount").textContent = waiting.length;

  document.getElementById("currentToken").innerHTML = current ? `
    <div class="token-label">CURRENTLY SERVING</div>
    <div class="token-number">${escapeHTML(current.token)}</div>
    <div class="token-person">${escapeHTML(current.studentName)}</div>
    <div class="token-person" style="margin-top:5px">${escapeHTML(current.studentId || "Student ID not provided")}</div>
  ` : `
    <div class="empty-icon"><i class="fa-solid fa-user-clock"></i></div>
    <div class="empty-message">No student currently being served</div>
  `;

  document.getElementById("callNextBtn").disabled = !!current || waiting.length === 0;
  document.getElementById("completeBtn").disabled = !current;

  document.getElementById("operatorHint").textContent = current
    ? "Complete this request before calling the next student."
    : waiting.length
      ? "The next student is ready to be called."
      : `No students waiting at ${service.name}.`;

  document.getElementById("operatorWaitingList").innerHTML = waiting.length
    ? waiting.map((t,index) => `
      <div class="waiting-item">
        <span class="waiting-number">${escapeHTML(t.token)}</span>
        <div class="waiting-details">
          <strong>${escapeHTML(t.studentName)}</strong>
          <small>Joined at ${formatTime(t.createdAt)}</small>
        </div>
        <span class="waiting-index">#${index + 1}</span>
      </div>
    `).join("")
    : `<div class="empty-state"><i class="fa-solid fa-mug-hot"></i><p>All clear! No one is waiting.</p></div>`;
}

function callNext() {
  const serviceId = document.getElementById("operatorService").value;

  if (getServing(serviceId)) {
    showToast("Complete the current token first.");
    return;
  }

  const next = getWaiting(serviceId)[0];
  if (!next) {
    showToast("There are no students waiting.");
    return;
  }

  next.status = "serving";
  next.calledAt = Date.now();

  saveData();
  renderOperator();
  refreshVisibleData();
  showToast(`${next.token} is now being served.`);
}

function completeCurrent() {
  const serviceId = document.getElementById("operatorService").value;
  const current = getServing(serviceId);

  if (!current) {
    showToast("There is no active token to complete.");
    return;
  }

  current.status = "completed";
  current.completedAt = Date.now();

  saveData();
  renderOperator();
  refreshVisibleData();
  showToast(`${current.token} has been completed.`);
}

function refreshVisibleData() {
  renderDashboard();
  renderServices();
  renderStudentPage();
  renderHistory();
}

/* HISTORY */

function renderHistory() {
  const query = (document.getElementById("historySearch")?.value || "").trim().toLowerCase();
  const filter = document.getElementById("historyFilter")?.value || "all";

  const all = [...data.tokens].sort((a,b) => b.createdAt - a.createdAt);
  const filtered = all.filter(t => {
    const service = getService(t.serviceId);
    const matchesQuery = [
      t.token, t.studentName, t.studentId, service?.name, t.serviceId
    ].some(value => String(value || "").toLowerCase().includes(query));

    return matchesQuery && (filter === "all" || t.status === filter);
  });

  document.getElementById("historySummary").innerHTML = `
    <div class="history-stat"><span>Total tokens generated</span><strong>${data.tokens.length}</strong></div>
    <div class="history-stat"><span>Currently waiting</span><strong>${data.tokens.filter(t => t.status === "waiting").length}</strong></div>
    <div class="history-stat"><span>Successfully completed</span><strong>${data.tokens.filter(t => t.status === "completed").length}</strong></div>
  `;

  document.getElementById("historyTable").innerHTML = filtered.map(t => {
    const service = getService(t.serviceId);
    return `
      <tr>
        <td><strong>${escapeHTML(t.token)}</strong></td>
        <td>${escapeHTML(t.studentName)}</td>
        <td>${escapeHTML(service?.name || t.serviceId)}</td>
        <td>${formatTime(t.createdAt)}</td>
        <td><span class="status-badge ${t.status}">${t.status}</span></td>
      </tr>
    `;
  }).join("");

  document.getElementById("historyEmpty").classList.toggle("hidden", filtered.length !== 0);
}

function exportHistory() {
  if (!data.tokens.length) {
    showToast("There is no history to export.");
    return;
  }

  const rows = [
    ["Token","Student","Student ID","Department","Status","Generated","Called","Completed"],
    ...[...data.tokens].sort((a,b) => a.createdAt - b.createdAt).map(t => [
      t.token, t.studentName, t.studentId,
      getService(t.serviceId)?.name || t.serviceId,
      t.status,
      new Date(t.createdAt).toLocaleString(),
      t.calledAt ? new Date(t.calledAt).toLocaleString() : "",
      t.completedAt ? new Date(t.completedAt).toLocaleString() : ""
    ])
  ];

  const csv = rows.map(row => row.map(value =>
    `"${String(value ?? "").replace(/"/g,'""')}"`
  ).join(",")).join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "queueflow-history.csv";
  link.click();
  URL.revokeObjectURL(url);

  showToast("History exported successfully.");
}

/* START APPLICATION */

setupDate();
setupSelects();
renderDashboard();
renderServices();
renderStudentPage();
renderOperator();
renderHistory();

console.log("QueueFlow initialized successfully.");
