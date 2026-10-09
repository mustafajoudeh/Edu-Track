import {
    getTasks,
    getSubmissions,
    getAllStudents,
    updateSubmission,
    addTask
} from "../modules/api.js";

const currentInstructor  =
    JSON.parse(localStorage.getItem("currentInstructor")) ||
    JSON.parse(sessionStorage.getItem("currentInstructor"));

if (!currentInstructor) {
    window.location.href = "./index.html";
} else {

let tasks = [];
let submissions = [];
let students = [];

// load all data first (json-server must be running: npx json-server db.json)
try {
    [tasks, submissions, students] = await Promise.all([
        getTasks(currentInstructor.id),
        getSubmissions(currentInstructor.id),
        getAllStudents(currentInstructor.id)
    ]);
} catch (error) {
    console.error(error);
    document.getElementById("task-details").innerHTML = `
        <p class="empty-state">
            Could not load data. Please refresh the page and try again.
        </p>
    `;
}

// tasks shown by the current filter + the selected task (kept after saving a grade)
let currentTasks = tasks;
let selectedTaskId = tasks.length > 0 ? tasks[0].id : null;

function renderHeaderStatistics() {
    const openTasks = tasks.filter(t => t.status === "open");
    const upcomingTasks = tasks.filter(t => t.status === "upcoming");
    const closedTasks = tasks.filter(t => t.status === "closed");
    const needsGrading = submissions.filter(s => s.grade === null);

    document.getElementById("open").textContent = `${openTasks.length} open`;
    document.getElementById("upcoming").textContent = `${upcomingTasks.length} upcoming`;
    document.getElementById("closed").textContent = `${closedTasks.length} closed`;
    document.getElementById("needs-grading").textContent = `${needsGrading.length} submissions need grading`;
}

renderHeaderStatistics();






const filterButtons = document.querySelectorAll(".filter-btn");

const allCount = document.getElementById("all-count");
const assignmentCount = document.getElementById("assignment-count");
const quizCount = document.getElementById("quiz-count");
const projectCount = document.getElementById("project-count");
const labCount = document.getElementById("lab-count");

allCount.textContent = tasks.length;

assignmentCount.textContent = tasks.filter(task => {
    return task.type === "assignment";
}).length;

quizCount.textContent = tasks.filter(task => {
    return task.type === "quiz";
}).length;

projectCount.textContent = tasks.filter(task => {
    return task.type === "project";
}).length;

labCount.textContent = tasks.filter(task => {
    return task.type === "lab";
}).length;

// the filter functionaltye

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        const type = button.dataset.type;

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");


        if (type === "all") {

            renderTasks(tasks);

        } else {

            const filteredTasks = tasks.filter(task => {
                return task.type === type;
            });

            renderTasks(filteredTasks);
        }

    });

});


//  cards section functionaltye 

const tasksList = document.getElementById("tasks-list");

function renderTasks(tasksToRender) {

    currentTasks = tasksToRender;

    tasksList.innerHTML = "";

    if (tasksToRender.length === 0) {
        tasksList.innerHTML = `<p class="empty-state">No tasks of this type.</p>`;
        return;
    }

    tasksToRender.forEach(task => {

        const taskSubmissions = submissions.filter(submission => {
            return Number(submission.taskId) === Number(task.id);
        });
        const gradedSubmissions = taskSubmissions.filter(submission => {
            return submission.grade !== null;
        });
        let average = "—";

        if (gradedSubmissions.length > 0) {
        
            const totalGrades = gradedSubmissions.reduce((sum, submission) => {
                return sum + submission.grade;
            }, 0);
        
            const averageGrade =
                totalGrades / gradedSubmissions.length;
        
            const averagePercentage =
                (averageGrade / task.points) * 100;
        
            average = `${Math.round(averagePercentage)}%`;
        }
        const card = document.createElement("div");

        card.classList.add("task-card");

        card.dataset.id = task.id;

        // compare as text: new tasks from json-server get text ids like "AQ-SwIH-uj4"
        if (String(task.id) === String(selectedTaskId)) {
            card.classList.add("active");
        }


        card.innerHTML = `
            <div class="task-card-header">

                <div class="task-info">

                    <span class="task-number">
                        T${task.id}
                    </span>

                    <span class="task-type">
                        ${task.type}
                    </span>

                </div>


                <span class="task-status ${task.status}">
                    ${task.status}
                </span>

            </div>


            <h3 class="task-title">
                ${task.title}
            </h3>


            <p class="task-meta">
                Week ${task.week}
                ·
                Due ${formatDate(task.dueDate)}
                ·
                ${task.points} pts
            </p>


            <div class="task-card-footer">
                <span>
                    ${taskSubmissions.length}/${students.length} submitted
                </span>

                <span>
                    Avg ${average}
                </span>
            </div>
        `;


        tasksList.appendChild(card);
        card.addEventListener("click", () => {

    const allCards = document.querySelectorAll(".task-card");

    allCards.forEach(card => {
        card.classList.remove("active");
    });

    card.classList.add("active");
    selectedTaskId = task.id;
    renderTaskDetails(task);
        });
    });
}

function formatDate(date) {

    const taskDate = new Date(date);

    return taskDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}
const taskDetails = document.getElementById("task-details");


//  task detailes 

function renderTaskDetails(task) {

    const taskSubmissions = submissions.filter(submission => {
        return Number(submission.taskId) === Number(task.id);
    });


    const submittedCount = taskSubmissions.length;


    const needsGradingCount = taskSubmissions.filter(submission => {
        return submission.grade === null;
    }).length;


    const missingCount =
        students.length - taskSubmissions.length;


    const lateCount = taskSubmissions.filter(submission => {
        return new Date(submission.submittedAt) > new Date(task.dueDate);
    }).length;


    taskDetails.innerHTML = `
        <div class="details-header">

            <div>
                <span class="task-type">
                    ${task.type}
                </span>

                <h2>${task.title}</h2>
            </div>

            <span class="task-status ${task.status}">
                ${task.status}
            </span>

        </div>


        <p class="details-meta">
            Due ${formatDate(task.dueDate)}
            · Week ${task.week}
            · ${task.points} pts
        </p>


        <p class="task-description">
            ${task.description}
        </p>


        <div class="submission-summary">

            <div class="summary-box">
                <span>Submitted</span>
                <strong>${submittedCount}</strong>
            </div>

            <div class="summary-box">
                <span>Needs grading</span>
                <strong>${needsGradingCount}</strong>
            </div>

            <div class="summary-box">
                <span>Missing</span>
                <strong>${missingCount}</strong>
            </div>

            <div class="summary-box">
                <span>Late</span>
                <strong>${lateCount}</strong>
            </div>

        </div>


        <div class="students-section">

            <h3>Students</h3>

            <div id="students-container"></div>

        </div>
    `;


    renderStudentRows(task);
}


// show all student in task 
function renderStudentRows(task) {

    const studentsContainer =
        document.getElementById(
            "students-container"
        );


    studentsContainer.innerHTML = "";


    students.forEach(student => {


        // ================= Find Submission =================

        const submission =
            submissions.find(submission => {

                return (

                    Number(submission.taskId)
                    === Number(task.id)

                    &&

                    Number(submission.studentId)
                    === Number(student.id)

                );

            });


        // ================= Default Values =================

        let status =
            "Not submitted";

        let grade =
            "";

        let feedback =
            "";

        let late =
            false;


        // ================= Submission Exists =================

        if (submission) {


            late =
                new Date(submission.submittedAt)
                >
                new Date(task.dueDate);


            feedback =
                submission.feedback ?? "";


            if (submission.grade === null) {

                status =
                    "Needs grading";

            } else {

                status =
                    "Graded";

                grade =
                    submission.grade;

            }

        }


        // ================= Create Row =================

        const row =
            document.createElement("div");


        row.classList.add(
            "student-row"
        );


        // ================= Student Submitted =================

        if (submission) {

            row.innerHTML = `

                <div class="student-info">

                    <strong>
                        ${student.name}
                    </strong>

                    <span>
                        ${student.email}
                    </span>

                </div>


                <div class="student-status">

                    <span class="submission-status ${submission.grade !== null ? "graded" : ""}">
                        ${status}
                    </span>


                    <span class="submission-time ${late ? "late" : ""}">

                        ${
                            late
                                ? "Late"
                                : "On time"
                        }

                    </span>

                </div>


                <div class="student-grade">

                    <label>
                        Grade
                    </label>


                    <div class="grade-field">

                        <input
                            type="number"
                            class="grade-input"
                            min="0"
                            max="${task.points}"
                            value="${grade}"
                        >

                        <span>
                            / ${task.points}
                        </span>

                    </div>

                </div>


                <div class="student-feedback">

                    <label>
                        Feedback
                    </label>


                    <textarea
                        class="feedback-input"
                        placeholder="Write feedback..."
                    >${feedback}</textarea>

                </div>


                <button
                    class="save-grade-btn"
                    data-submission-id="${submission.id}"
                >
                    Save
                </button>
            `;

        }

        // ================= Not Submitted =================

        else {

            row.innerHTML = `

                <div class="student-info">

                    <strong>
                        ${student.name}
                    </strong>

                    <span>
                        ${student.email}
                    </span>

                </div>


                <div class="student-status">

                    <span class="not-submitted">
                        Not submitted
                    </span>

                </div>


                <div class="student-grade">

                    <span>
                        — / ${task.points}
                    </span>

                </div>

            `;

        }


        studentsContainer.appendChild(row);

    });

    // keep the search filter applied after re-rendering
    applyStudentSearch();


    // =====================================================
    // Save Grade + Feedback
    // =====================================================

    const saveButtons =
        document.querySelectorAll(
            ".save-grade-btn"
        );


    saveButtons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {


                // ================= Get Row =================

                const row =
                    button.closest(
                        ".student-row"
                    );


                const gradeInput =
                    row.querySelector(
                        ".grade-input"
                    );


                const feedbackInput =
                    row.querySelector(
                        ".feedback-input"
                    );


                // ================= Values =================

                const submissionId =
                    Number(
                        button.dataset.submissionId
                    );


                const gradeValue =
                    gradeInput.value.trim();


                const feedback =
                    feedbackInput.value.trim();


                // ================= Validate Grade =================

                if (gradeValue === "") {

                    await swal.fire({
                        title: "Error",
                        text: "Please enter a grade.",
                        icon: "error",
                        confirmButtonText: "OK"
                    });

                    return;
                }


                const grade =
                    Number(gradeValue);


                if (
                    grade < 0
                    ||
                    grade > task.points
                ) {

                    await swal.fire({
                        title: "Error",
                        text: `Grade must be between 0 and ${task.points}`,
                        icon: "error",
                        confirmButtonText: "OK"
                    });

                    return;
                }


                // ================= Update Database =================

                try {

                    await updateSubmission(
                        submissionId,
                        {
                            grade: grade,
                            feedback: feedback
                        }
                    );


                    // ================= Update Local Array =================

                    const submission =
                        submissions.find(
                            submission => {

                                return (
                                    Number(submission.id)
                                    === submissionId
                                );

                            }
                        );


                    if (submission) {

                        submission.grade =
                            grade;

                        submission.feedback =
                            feedback;

                    }


                    // ================= Update UI =================

                    renderHeaderStatistics();

                    renderTasks(currentTasks);

                    renderTaskDetails(task);


                    await swal.fire({
                        title: "Success",
                        text: "Grade and feedback saved successfully.",
                        icon: "success",
                        confirmButtonText: "OK"
                    });


                } catch (error) {

                    console.error(error);

                    await swal.fire({
                        title: "Error",
                        text: "Failed to save grade.",
                        icon: "error",
                        confirmButtonText: "OK"
                    });

                }

            }
        );

    });

}



renderTasks(tasks);


// show first task automatically (the first card is marked active by renderTasks)

if (tasks.length > 0) {

    renderTaskDetails(
        tasks[0]
    );

} else if (taskDetails.querySelector(".empty-state")?.textContent.includes("Loading")) {

    taskDetails.innerHTML = `<p class="empty-state">No tasks yet.</p>`;

}


// =====================================================
// Search students (filters rows of the selected task)
// =====================================================

const searchInput = document.getElementById("globalSearch");

searchInput.addEventListener("input", applyStudentSearch);

function applyStudentSearch() {

    const query = document.getElementById("globalSearch").value.trim().toLowerCase();

    document.querySelectorAll(".student-row").forEach(row => {

        const text = row.querySelector(".student-info").textContent.toLowerCase();

        row.style.display = text.includes(query) ? "" : "none";
    });
}


// =====================================================
// Export gradebook (CSV)
// =====================================================

document.getElementById("export-btn").addEventListener("click", () => {

    const header = ["Student", "Email", ...tasks.map(task => `${task.title} (/${task.points})`)];

    const rows = students.map(student => {

        const grades = tasks.map(task => {

            const submission = submissions.find(submission => {
                return (
                    Number(submission.taskId) === Number(task.id)
                    &&
                    Number(submission.studentId) === Number(student.id)
                );
            });

            if (!submission) return "missing";

            return submission.grade ?? "needs grading";
        });

        return [student.name, student.email, ...grades];
    });

    const csv = [header, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const link = document.createElement("a");

    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "gradebook.csv";
    link.click();

    URL.revokeObjectURL(link.href);
});


// =====================================================
// Add task (modal form)
// =====================================================

const addTaskModal = document.getElementById("add-task-modal");
const addTaskForm = document.getElementById("add-task-form");

// open / close the modal
document.getElementById("add-task-btn").addEventListener("click", () => {
    addTaskModal.classList.add("open");
});

function closeAddTaskModal() {
    addTaskModal.classList.remove("open");
    addTaskForm.reset();
}

document.getElementById("cancel-task-btn").addEventListener("click", closeAddTaskModal);

// close the modal when the user clicks outside the white box
addTaskModal.addEventListener("click", (event) => {
    if (event.target === addTaskModal) {
        closeAddTaskModal();
    }
});

// close the modal when the user presses the Escape key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && addTaskModal.classList.contains("open")) {
        closeAddTaskModal();
    }
});

const saveTaskButton = addTaskForm.querySelector('button[type="submit"]');

// save the new task
addTaskForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const title = document.getElementById("task-title").value.trim();

    // stop if the title has only spaces
    if (title === "") {
        alert("Please enter a task title.");
        return;
    }

    const dueDate = document.getElementById("task-due-date").value;

    // if the due date is already in the past the task is closed, if not it is upcoming
    const status = new Date(dueDate) < new Date() ? "closed" : "upcoming";

    const newTask = {
        instructorId: Number(currentInstructor.id),
        title: title,
        type: document.getElementById("task-type").value,
        course: document.getElementById("task-course").value,
        description: document.getElementById("task-description").value.trim(),
        week: Number(document.getElementById("task-week").value),
        dueDate: dueDate,
        points: Number(document.getElementById("task-points").value),
        status: status
    };

    // disable the button while saving, so a double click does not save the task twice
    saveTaskButton.disabled = true;

    try {

        const savedTask = await addTask(newTask);

        tasks.push(savedTask);

        // update the header stats and the filter counts
        renderHeaderStatistics();
        allCount.textContent = tasks.length;
        document.getElementById(`${savedTask.type}-count`).textContent =
            tasks.filter(task => task.type === savedTask.type).length;

        // show all tasks with the new one selected
        selectedTaskId = savedTask.id;
        document.querySelector('.filter-btn[data-type="all"]').click();
        renderTaskDetails(savedTask);

        closeAddTaskModal();

    } catch (error) {
        await swal.fire({
            title: "Error",
            text: "Could not save the task. Make sure json-server is running.",
            icon: "error",
            confirmButtonText: "OK"
        });
    }

    // enable the button again (after success or error)
    saveTaskButton.disabled = false;
});


// =====================================================
// Light / dark theme (same localStorage key as the dashboard)
// =====================================================

const themeButtons = document.querySelectorAll(".theme-btn");

function setTheme(theme) {

    document.documentElement.setAttribute("data-theme", theme);

    themeButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === theme);
    });

    localStorage.setItem("theme", theme);
}

themeButtons.forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.dataset.theme));
});

setTheme(localStorage.getItem("theme") || "light");

}

