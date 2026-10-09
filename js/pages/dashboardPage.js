import {
  calculateStudentAverage,
  calculateAttendanceRate,
  calculateClassAverage,
  calculateClassAttendance,
  calculatePassRate,
  getAtRiskStudents,
  getTopStudents,
  getGradeDistribution,
} from "../modules/reports.js";

import { getLayout } from "./layout.js";

// ===================== Config =====================
const API = window.API_URL ?? "http://localhost:3000";
// Saved by the login page. Falls back to 1 while testing.
const currentInstructor =
  JSON.parse(localStorage.getItem("currentInstructor")) ||
  JSON.parse(sessionStorage.getItem("currentInstructor"));
if (!currentInstructor) {
  window.location.href = "index.html";
}
const content = document.getElementById("content");

// ===================== Helpers =====================
function sameId(a, b) {
  return Number(a) === Number(b);
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function daysLeft(dueDate) {
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function timeAgo(value) {
  const minutes = Math.floor((new Date() - new Date(value)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const activityIcons = {
  grade_updated: "fa-pen-to-square",
  attendance_updated: "fa-calendar-check",
  submission_received: "fa-file-arrow-up",
};

async function getJSON(path) {
  const res = await fetch(`${API}/${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

// ===================== Render pieces =====================
function statCard(label, value, icon, variant = "") {
  return `
    <div class="stat-card ${variant}">
      <span class="stat-icon"><i class="fa-solid ${icon}"></i></span>
      <div>
        <p class="stat-label">${label}</p>
        <p class="stat-value">${value}</p>
      </div>
    </div>`;
}

function emptyState(text) {
  return `<p class="empty">${text}</p>`;
}

function renderDeadlines(tasks, submissions, students) {
  const upcoming = tasks
    .filter((t) => t.status === "open")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (upcoming.length === 0) return emptyState("No upcoming deadlines");

  return `<ul class="list">
    ${upcoming
      .map((t) => {
        const count = submissions.filter((s) => sameId(s.taskId, t.id)).length;
        const percent = students.length ? (count / students.length) * 100 : 0;
        const left = daysLeft(t.dueDate);
        const tag =
          left < 0
            ? `<span class="tag tag-bad">Overdue</span>`
            : left <= 2
              ? `<span class="tag tag-warn">${left === 0 ? "Today" : `${left}d left`}</span>`
              : `<span class="tag">${left}d left</span>`;

        return `
          <li class="list-item">
            <div class="list-main">
              <p class="list-title">${t.title}</p>
              <p class="list-meta"><span class="cap">${t.type}</span> · Due ${formatDate(t.dueDate)} · ${t.points} pts</p>
              <div class="progress"><span style="width:${percent}%"></span></div>
              <p class="list-meta">${count}/${students.length} submitted</p>
            </div>
            ${tag}
          </li>`;
      })
      .join("")}
  </ul>`;
}

function renderNeedsReview(submissions, tasks, students) {
  const pending = submissions.filter((s) => !s.feedback || !s.feedback.trim());

  if (pending.length === 0) return emptyState("All caught up 🎉");

  return `<ul class="list">
    ${pending
      .map((s) => {
        const student = students.find((st) => sameId(st.id, s.studentId));
        const task = tasks.find((t) => sameId(t.id, s.taskId));
        return `
          <li class="list-item">
            <span class="activity-icon"><i class="fa-solid fa-file-pen"></i></span>
            <div class="list-main">
              <p class="list-title">${task?.title ?? `Task #${s.taskId}`}</p>
              <p class="list-meta">${student?.name ?? `Student #${s.studentId}`} · ${formatDate(s.submittedAt)}</p>
            </div>
            <a href="track.html" class="btn btn-outline btn-sm">Review</a>
          </li>`;
      })
      .join("")}
  </ul>`;
}

function renderActivity(activities) {
  const recent = [...activities]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recent.length === 0) return emptyState("No recent activity");

  return `<ul class="list">
    ${recent
      .map(
        (a) => `
        <li class="list-item">
          <span class="activity-icon"><i class="fa-solid ${activityIcons[a.type] || "fa-circle-info"}"></i></span>
          <div class="list-main">
            <p class="list-title">${a.message}</p>
            <p class="list-meta">${timeAgo(a.date)}</p>
          </div>
        </li>`,
      )
      .join("")}
  </ul>`;
}

function renderStudentList(list, submissions, tasks, emptyText) {
  if (list.length === 0) return emptyState(emptyText);

  return `<ul class="list">
    ${list
      .map((st) => {
        const avg = calculateStudentAverage(st, submissions, tasks);
        const att = calculateAttendanceRate(st);
        return `
          <li class="list-item">
            <span class="mini-avatar">${initials(st.name)}</span>
            <div class="list-main">
              <p class="list-title">${st.name}</p>
              <p class="list-meta">ID ${st.id} · Attendance ${att.toFixed(0)}%</p>
            </div>
            <span class="score">${avg.toFixed(0)}%</span>
          </li>`;
      })
      .join("")}
  </ul>`;
}

function renderDistribution(dist, total) {
  const rows = [
    ["Excellent", dist.excellent, "bar-ok"],
    ["Good", dist.good, "bar-info"],
    ["Satisfactory", dist.satisfactory, "bar-warn"],
    ["Fail", dist.fail, "bar-bad"],
  ];

  return `<div class="bars">
    ${rows
      .map(([label, count, cls]) => {
        const percent = total ? (count / total) * 100 : 0;
        return `
          <div class="bar-row">
            <span class="bar-label">${label}</span>
            <div class="bar-track"><span class="${cls}" style="width:${percent}%"></span></div>
            <span class="bar-count">${count}</span>
          </div>`;
      })
      .join("")}
  </div>`;
}

// ===================== Main =====================
async function loadDashboard() {
  await getLayout();
  content.innerHTML = `<p class="loading">Loading dashboard…</p>`;

  try {
    const [instructor, students, tasks, submissions, activities, allStudents] =
      await Promise.all([
        getJSON(`instructors/${currentInstructor.id}`),
        getJSON(`students?instructorId=${currentInstructor.id}`),
        getJSON(`tasks?instructorId=${currentInstructor.id}`),
        getJSON(`submissions?instructorId=${currentInstructor.id}`),
        getJSON(`activities?instructorId=${currentInstructor.id}`),
      ]);

    // ----- Header + sidebar -----
    const firstName = instructor.name.split(" ")[0];
    const topbarSub = document.querySelector(".topbar-sub");
    if (topbarSub) {
      topbarSub.textContent = new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
    const topbarTitle = document.querySelector(".topbar-title");
    if (topbarTitle) {
      topbarTitle.textContent = `Welcome back, ${firstName} 👋`;
    }
    const userName = document.getElementById("userName");
    if (userName) userName.textContent = instructor.name;
    const userAvatar = document.getElementById("userAvatar");
    if (userAvatar) userAvatar.textContent = initials(instructor.name);

    const badge = document.querySelector(".badge");
    if (badge) {
      badge.textContent = activities.length;
      badge.hidden = activities.length === 0;
    }

    const course = students[0]?.course || tasks[0]?.course || "—";
    const cohortCard = document.getElementById("cohortCard");
    if (cohortCard) {
      cohortCard.innerHTML = `
        <div class="cohort-card">
          <p class="cohort-label">Current cohort</p>
          <p class="cohort-name">${course}</p>
          <p class="cohort-meta">${students.length} students · ${tasks.length} tasks</p>
        </div>`;
    }

    // ----- Numbers -----
    const atRisk = getAtRiskStudents(students, submissions, tasks);
    const top = getTopStudents(students, submissions, tasks, 3);
    const dist = getGradeDistribution(students, submissions, tasks);
    const pendingCount = submissions.filter(
      (s) => !s.feedback || !s.feedback.trim(),
    ).length;

    // ----- Page -----
    content.innerHTML = `
      <section class="stats">
        ${statCard("Students", students.length, "fa-users")}
        ${statCard("Class average", calculateClassAverage(students, submissions, tasks).toFixed(1) + "%", "fa-chart-line", "is-info")}
        ${statCard("Attendance", calculateClassAttendance(students).toFixed(0) + "%", "fa-calendar-check", "is-ok")}
        ${statCard("Pass rate", calculatePassRate(students, submissions, tasks).toFixed(0) + "%", "fa-graduation-cap", "is-ok")}
        ${statCard("At risk", atRisk.length, "fa-triangle-exclamation", "is-bad")}
      </section>

      <section class="card">
        <header class="card-head">
          <h2>Upcoming deadlines</h2>
          <a href="track.html" class="card-link">View all</a>
        </header>
        ${renderDeadlines(tasks, submissions, students)}
      </section>

      <section class="card">
        <header class="card-head">
          <h2>Needs review <span class="count">${pendingCount}</span></h2>
          <a href="track.html" class="card-link">Open grading</a>
        </header>
        ${renderNeedsReview(submissions, tasks, students)}
      </section>

      <section class="card">
        <header class="card-head"><h2>Top students</h2></header>
        ${renderStudentList(top, submissions, tasks, "No students yet")}
      </section>

      <section class="card">
        <header class="card-head">
          <h2>At-risk students</h2>
          <a href="students.html" class="card-link">View all</a>
        </header>
        ${renderStudentList(atRisk, submissions, tasks, "No students at risk 👏")}
      </section>

      <section class="card">
        <header class="card-head"><h2>Grade distribution</h2></header>
        ${renderDistribution(dist, students.length)}
      </section>

      <section class="card">
        <header class="card-head"><h2>Recent activity</h2></header>
        ${renderActivity(activities)}
      </section>
    `;
  } catch (error) {
    console.error(error);
    content.innerHTML = `
      <div class="card error-card">
        <h2>Couldn't load the dashboard</h2>
        <p>Make sure json-server is running:</p>
        <code>npx json-server db.json --port 3000</code>
      </div>`;
  }
}

loadDashboard();
