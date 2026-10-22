let tasks = [], editingId = null;
let searchQuery = "";
let userProfile = { name: "", email: "" };
let currentCalendarDate = new Date();
let currentView = "dashboard"; // Menyimpan state tampilan aktif ('dashboard' atau 'calendar')

const reminderInput = document.getElementById("taskReminder");
const notificationButton = document.getElementById("enableNotifications");

// Audio Alarm untuk Reminder
const alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
alarmSound.preload = 'auto';

// Minta Izin Notifikasi Browser
notificationButton.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Perangkat atau browser tidak mendukung notifikasi.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    notificationButton.title = "Notifikasi & Getaran Aktif";
    alarmSound.play().catch(() => {});
    alarmSound.pause();
    alarmSound.currentTime = 0;
    alert("Berhasil! Izin notifikasi, suara, dan getaran diaktifkan.");
    checkTaskReminders();
  } else {
    alert("Izin notifikasi ditolak. Periksa pengaturan browser Anda.");
  }
});

// Cek Reminder Tugas Berkala sesuai Waktu Tenggat
function checkTaskReminders() {
  const now = Date.now();
  let changed = false;

  tasks.forEach((task) => {
    if (!task.reminderAt || task.completed || task.reminderSent) return;

    const reminderTime = new Date(task.reminderAt).getTime();
    
    // Jika waktu tenggat telah tiba
    if (Number.isFinite(reminderTime) && now >= reminderTime) {
      // 1. Munculkan Push Notification Browser (jika diizinkan)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ Tenggat Waktu Tugas Tiba!", {
          body: "Waktunya mengerjakan: " + task.title,
          tag: "task-" + task.id,
          icon: "https://cdn-icons-png.flaticon.com/512/3233/3233483.png"
        });
      }

      // 2. Mainkan Suara Alarm & Getar
      alarmSound.loop = true; // Alarm berbunyi terus sampai dimatikan
      alarmSound.play().catch(err => console.log("Audio play error:", err));

      if ("vibrate" in navigator) {
        navigator.vibrate([600, 200, 600, 200, 600]);
      }

      // 3. TAMPILKAN JENDELA POP-UP INTERNAL APLIKASI
      showAlarmModal(task.title);

      task.reminderSent = true;
      changed = true;
    }
  });

  if (changed) saveData();
}

// FUNGSI UNTUK MEMUNCULKAN DAN MEMATIKAN POP-UP ALARM
function showAlarmModal(title) {
  document.getElementById("alarmTaskTitle").textContent = title;
  document.getElementById("alarmModal").classList.add("active");
}

function stopAlarmModal() {
  alarmSound.pause();
  alarmSound.currentTime = 0;
  document.getElementById("alarmModal").classList.remove("active");
}

// Beralih Tampilan khusus Pengguna HP (via Tombol Header Atas)
function toggleMobileView() {
  if (currentView === "dashboard") {
    switchView("calendar");
  } else {
    switchView("dashboard");
  }
}

// Berpindah Tampilan (Dashboard vs Kalender)
function switchView(viewName) {
  currentView = viewName;
  const listView = document.getElementById("listViewArea");
  const calendarView = document.getElementById("calendarViewArea");
  const navDashboard = document.getElementById("navDashboard");
  const navCalendar = document.getElementById("navCalendar");
  const viewToggleIcon = document.getElementById("viewToggleIcon");

  if (viewName === 'calendar') {
    listView.style.display = 'none';
    calendarView.classList.add('active');
    if (navDashboard) navDashboard.classList.remove('active');
    if (navCalendar) navCalendar.classList.add('active');
    if (viewToggleIcon) viewToggleIcon.className = "fas fa-list-ul"; // Ubah ikon ke daftar
    renderCalendar();
  } else {
    calendarView.classList.remove('active');
    listView.style.display = 'block';
    if (navCalendar) navCalendar.classList.remove('active');
    if (navDashboard) navDashboard.classList.add('active');
    if (viewToggleIcon) viewToggleIcon.className = "fas fa-calendar-alt"; // Ubah ikon ke kalender
  }
}

// Dark Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("taskkita_darkmode", isDark ? "true" : "false");
  
  const icon = document.getElementById("darkModeIcon");
  icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

function loadDarkModePreference() {
  const isDark = localStorage.getItem("taskkita_darkmode") === "true";
  if (isDark) {
    document.body.classList.add("dark-mode");
    document.getElementById("darkModeIcon").className = "fas fa-sun";
  }
}

function loadData() {
  loadDarkModePreference();
  const saved = localStorage.getItem("taskkita_data_v2");
  const savedProfile = localStorage.getItem("taskkita_profile");

  if (saved) {
    tasks = JSON.parse(saved);
  } else {
    tasks = [
      { id: 1, title: "Evaluasi penambahan user ID", category: "coding", status: "pending", priority: "minor", completed: false, reminderAt: "" },
      { id: 2, title: "Laporan Riset Mooci-Gummy", category: "academic", status: "progress", priority: "normal", completed: false, reminderAt: "" }
    ];
  }

  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
    document.getElementById("loginOverlay").classList.add("hidden");
    applyProfileData();
  } else {
    document.getElementById("loginOverlay").classList.remove("hidden");
  }

  updateGreeting();
  renderTasks();
}

function handleLogin(e) {
  e.preventDefault();
  const name = document.getElementById("loginNameInput").value.trim();
  const email = document.getElementById("loginEmailInput").value.trim();

  if (!name || !email) return;

  userProfile = { name, email };
  localStorage.setItem("taskkita_profile", JSON.stringify(userProfile));

  document.getElementById("loginOverlay").classList.add("hidden");
  applyProfileData();
  updateGreeting();
  renderTasks();
}

function applyProfileData() {
  document.getElementById("profileNameInput").value = userProfile.name;
  document.getElementById("profileEmailInput").value = userProfile.email;
  document.getElementById("displayUserName").textContent = userProfile.name;
  
  const initials = userProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  document.getElementById("profileAvatarText").textContent = initials || "US";
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greet = "Selamat Pagi";
  if (hour >= 12 && hour < 15) greet = "Selamat Siang";
  else if (hour >= 15 && hour < 18) greet = "Selamat Sore";
  else if (hour >= 18) greet = "Selamat Malam";
  
  const firstName = userProfile.name ? userProfile.name.split(" ")[0] : "Sobat";
  document.getElementById("greeting").textContent = `${greet}, ${firstName}`;
}

function saveData() {
  localStorage.setItem("taskkita_data_v2", JSON.stringify(tasks));
  localStorage.setItem("taskkita_profile", JSON.stringify(userProfile));
}

function handleSearch(val) {
  searchQuery = val.toLowerCase().trim();
  renderTasks();
}

function getCategoryBadge(cat) {
  switch(cat) {
    case 'academic': return `<span class="category-tag cat-academic"><i class="fas fa-graduation-cap"></i> Akademik</span>`;
    case 'coding': return `<span class="category-tag cat-coding"><i class="fas fa-code"></i> Coding</span>`;
    case 'personal': return `<span class="category-tag cat-personal"><i class="fas fa-user"></i> Pribadi</span>`;
    default: return `<span class="category-tag cat-other"><i class="fas fa-bookmark"></i> Lainnya</span>`;
  }
}

function renderTasks() {
  const filtered = tasks.filter(t => t.title.toLowerCase().includes(searchQuery));
  const onHold = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);

  document.getElementById("onHoldTasks").innerHTML = onHold.length
    ? onHold.map((t) => `
      <div class="task-item">
          <div class="task-checkbox" onclick="toggleTask(${t.id})"></div>
          <div class="task-content">
              <div class="task-title">${t.title}</div>
              <div class="task-meta">
                ${getCategoryBadge(t.category || 'other')}
                <div class="task-reminder">
                  <i class="fas fa-bell"></i> ${t.reminderAt ? new Date(t.reminderAt).toLocaleString("id-ID") : "Belum diatur"}
                </div>
              </div>
          </div>
          <span class="status-badge status-${t.status}">
              ${t.status === "progress" ? "In Progress" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
          </span>
          <div class="priority-badge priority-${t.priority}">
              <i class="fas fa-circle"></i> ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
          </div>
          <div class="action-btn-group">
              <button class="icon-btn" style="width:32px;height:32px;" onclick="editTask(${t.id})" title="Edit">
                  <i class="fas fa-pen" style="font-size:12px;"></i>
              </button>
              <button class="icon-btn" style="width:32px;height:32px;" onclick="deleteTask(${t.id})" title="Hapus">
                  <i class="fas fa-trash" style="font-size:12px; color:#dc2626;"></i>
              </button>
          </div>
      </div>
    `).join("")
    : '<p style="color:var(--text-muted);padding:15px;text-align:center;">Tidak ada tugas ditemukan</p>';

  document.getElementById("completedTasks").innerHTML = completed.length
    ? completed.map((t) => `
      <div class="task-item">
          <div class="task-checkbox completed" onclick="toggleTask(${t.id})"></div>
          <div class="task-content">
              <div class="task-title completed">${t.title}</div>
              <div class="task-meta">
                ${getCategoryBadge(t.category || 'other')}
                <div class="task-reminder">
                  <i class="fas fa-bell"></i> ${t.reminderAt ? new Date(t.reminderAt).toLocaleString("id-ID") : "Belum diatur"}
                </div>
              </div>
          </div>
          <span class="status-badge status-completed">Completed</span>
          <div class="priority-badge priority-${t.priority}">
              <i class="fas fa-circle"></i> ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
          </div>
          <div class="action-btn-group">
              <button class="icon-btn" style="width:32px;height:32px;" onclick="editTask(${t.id})" title="Edit">
                  <i class="fas fa-pen" style="font-size:12px;"></i>
              </button>
              <button class="icon-btn" style="width:32px;height:32px;" onclick="deleteTask(${t.id})" title="Hapus">
                  <i class="fas fa-trash" style="font-size:12px; color:#dc2626;"></i>
              </button>
          </div>
      </div>
    `).join("")
    : '<p style="color:var(--text-muted);padding:15px;text-align:center;">Belum ada tugas selesai</p>';

  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pending = total - completedCount;
  const criticalCount = tasks.filter((t) => t.priority === 'critical' && !t.completed).length;
  const rate = total ? Math.round((completedCount / total) * 100) : 0;

  document.getElementById("dashPending").textContent = pending;
  document.getElementById("dashCompleted").textContent = completedCount;
  document.getElementById("dashTotal").textContent = total;

  document.getElementById("taskCount").textContent = pending;
  document.getElementById("totalTasks").textContent = total;
  document.getElementById("criticalCount").textContent = criticalCount;
  document.getElementById("completionRateValue").textContent = rate + "%";
  document.getElementById("completionProgress").style.width = rate + "%";

  document.getElementById("profileCompletedCount").textContent = completedCount;
  document.getElementById("profileTotalCount").textContent = total;

  saveData();
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  document.getElementById("calendarMonthYear").textContent = `${monthNames[month]} ${year}`;

  const dayHeaders = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  dayHeaders.forEach(dh => {
    grid.innerHTML += `<div class="day-name">${dh}</div>`;
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div></div>`;
  }

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    
    const dayTasks = tasks.filter(t => {
      if (!t.reminderAt) return false;
      const d = new Date(t.reminderAt);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

    let taskDots = dayTasks.map(t => `<div class="task-dot" title="${t.title}">${t.title}</div>`).join("");

    grid.innerHTML += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <span>${day}</span>
        <div class="task-dot-container">${taskDots}</div>
      </div>
    `;
  }
}

function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (t) {
    t.completed = !t.completed;
    t.status = t.completed ? "completed" : "pending";
    renderTasks();
  }
}

function deleteTask(id) {
  if (confirm("Yakin ingin menghapus tugas ini?")) {
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
  }
}

function openModal() { document.getElementById("taskModal").classList.add("active"); }
function closeModal() {
  document.getElementById("taskModal").classList.remove("active");
  document.getElementById("taskForm").reset();
  reminderInput.value = "";
  editingId = null;
}

function openProfileModal() { document.getElementById("profileModal").classList.add("active"); }
function closeProfileModal() { document.getElementById("profileModal").classList.remove("active"); }

function saveProfile(e) {
  e.preventDefault();
  const name = document.getElementById("profileNameInput").value.trim();
  const email = document.getElementById("profileEmailInput").value.trim();

  if (!name || !email) return;

  userProfile.name = name;
  userProfile.email = email;
  applyProfileData();
  updateGreeting();
  saveData();
  closeProfileModal();
  alert("Profil berhasil diperbarui!");
}

document.getElementById("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const category = document.getElementById("taskCategory").value;
  const status = document.getElementById("taskStatus").value;
  const priority = document.getElementById("taskPriority").value;
  const reminderAt = reminderInput.value;

  if (!title || !reminderAt) {
    alert("Harap isi judul tugas dan waktu reminder.");
    return;
  }

  const reminderTime = new Date(reminderAt).getTime();
  if (!Number.isFinite(reminderTime) || reminderTime <= Date.now()) {
    alert("Pilih waktu reminder yang akan datang.");
    return;
  }

  if (editingId !== null) {
    const task = tasks.find((item) => item.id === editingId);
    if (task) {
      const reminderChanged = task.reminderAt !== reminderAt || task.title !== title;
      task.title = title;
      task.category = category;
      task.status = status;
      task.priority = priority;
      task.completed = status === "completed";
      task.reminderAt = reminderAt;
      if (reminderChanged) task.reminderSent = false;
    }
  } else {
    tasks.push({
      id: Date.now(),
      title,
      category,
      status,
      priority,
      completed: status === "completed",
      reminderAt,
      reminderSent: false
    });
  }

  renderTasks();
  closeModal();
});

function editTask(id) {
  editingId = id;
  const t = tasks.find((t) => t.id === id);
  if (t) {
    document.getElementById("taskTitle").value = t.title;
    document.getElementById("taskCategory").value = t.category || "other";
    document.getElementById("taskStatus").value = t.status;
    document.getElementById("taskPriority").value = t.priority;
    reminderInput.value = t.reminderAt || "";
    openModal();
  }
}

// Inisialisasi awal saat halaman dimuat
loadData();
checkTaskReminders();
setInterval(checkTaskReminders, 5000);