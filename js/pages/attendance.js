const studentsBody = document.getElementById("studentsBody");
const searchInput = document.getElementById("searchInput");
const dateInput = document.getElementById("dateInput");
const courseSelect = document.getElementById("courseSelect");
const currentInstructor =
  JSON.parse(localStorage.getItem("currentInstructor")) ||
  JSON.parse(sessionStorage.getItem("currentInstructor"));

if (!currentInstructor?.id) {
  window.location.href = "./index.html";
  throw new Error("No logged-in instructor");
}

// ===== إضافة: تاريخ اليوم كقيمة افتراضية =====
dateInput.value = new Date().toLocaleDateString("en-CA");

fetch(`${window.API_URL ?? "http://localhost:3000"}/students?instructorId=${encodeURIComponent(currentInstructor.id)}`)
  .then(response => response.json())
  .then(students => {

    // إضافة الكورسات الموجودة في البيانات
    const courses = [];

    students.forEach(student => {

      if (!courses.includes(student.course)) {
        courses.push(student.course);
      }

    });

    courses.forEach(course => {

      courseSelect.innerHTML += `
        <option value="${course}">${course}</option>
      `;

    });


    function displayStudents(studentList) {

      studentsBody.innerHTML = "";

      studentList.forEach(student => {

        // حالة الطالب في التاريخ المختار
        const attendance = student.attendance.find(
          item => item.date === dateInput.value
        );

        let status = "-";

        if (attendance) {
          status = attendance.status;
        }


        // حساب Overall
        const totalDays = student.attendance.length;

        const presentDays = student.attendance.filter(
          item => item.status === "present"
        ).length;

        let overall = 0;

        if (totalDays > 0) {
          overall = Math.round((presentDays / totalDays) * 100);
        }


        // عرض الطالب في الجدول
        studentsBody.innerHTML += `
          <tr>
            <td>${student.name}</td>
            <td>${student.id}</td>
            <td>${student.course}</td>
            <td>${overall}%</td>
            <td>${status}</td>
          </tr>
        `;

      });

    }


    // عرض جميع الطلاب
    displayStudents(students);


    // تغيير التاريخ
    dateInput.addEventListener("change", () => {

      displayStudents(students);

    });


    // البحث بالاسم أو ID
    searchInput.addEventListener("input", () => {

      const searchValue = searchInput.value.toLowerCase();

      const filteredStudents = students.filter(student =>
        student.id.includes(searchValue) ||
        student.name.toLowerCase().includes(searchValue)
      );

      displayStudents(filteredStudents);

    });


    // اختيار الكورس
    courseSelect.addEventListener("change", () => {

      const selectedCourse = courseSelect.value;

      if (selectedCourse === "all") {

        displayStudents(students);

      } else {

        const filteredStudents = students.filter(student =>
          student.course === selectedCourse
        );

        displayStudents(filteredStudents);

      }

    });


    // =====================================================
    // ===== إضافة: كل اللي تحت جديد ومكمّل على الكود فوق =====
    // =====================================================

    const markAllBtn = document.getElementById("markAllBtn");
    const saveBtn = document.getElementById("saveBtn");
    const toast = document.getElementById("toast");
    const statPresent = document.getElementById("statPresent");
    const statAbsent = document.getElementById("statAbsent");
    const statNotMarked = document.getElementById("statNotMarked");
    const statRate = document.getElementById("statRate");

    // التعديلات اللي لسا ما انحفظت { id: "present" / "absent" }
    let changes = {};


    // نجيب الطالب من الـ ID
    function findStudent(id) {
      return students.find(student => String(student.id) === String(id));
    }


    // حالة الطالب (التعديل إذا موجود، وإلا المحفوظة)
    function getStatus(student) {

      if (changes[student.id]) {
        return changes[student.id];
      }

      const attendance = student.attendance.find(
        item => item.date === dateInput.value
      );

      if (attendance) {
        return attendance.status;
      }

      return "-";

    }


    // الأحرف الأولى من الاسم للأفاتار
    function getInitials(name) {

      const words = name.split(" ");
      let initials = "";

      words.forEach(word => {
        if (word) {
          initials += word[0].toUpperCase();
        }
      });

      return initials.slice(0, 2);

    }


    // نحوّل الصف العادي لشكل الصورة (أفاتار + إيميل + أزرار)
    function enhanceRow(row) {

      const cells = row.cells;
      const student = findStudent(cells[1].textContent.trim());

      if (!student) return;

      // عمود الطالب (مرة وحدة بس)
      if (!row.dataset.enhanced) {
        cells[0].innerHTML = `
          <div class="att-student">
            <span class="att-avatar">${getInitials(student.name)}</span>
            <div>
              <div class="att-name">${student.name}</div>
              <div class="att-email">${student.email}</div>
            </div>
          </div>
        `;
        row.dataset.enhanced = "true";
      }

      // عمود Overall (بنحدّثه بعد الحفظ)
      const totalDays = student.attendance.length;
      const presentDays = student.attendance.filter(
        item => item.status === "present"
      ).length;

      let overall = 0;

      if (totalDays > 0) {
        overall = Math.round((presentDays / totalDays) * 100);
      }

      cells[3].textContent = overall + "%";

      // عمود الحالة: أزرار Present / Absent
      const status = getStatus(student);

      let presentClass = "";
      let absentClass = "";

      if (status === "present") presentClass = "is-present";
      if (status === "absent") absentClass = "is-absent";

      cells[4].innerHTML = `
        <div class="att-toggle">
          <button type="button" class="${presentClass}"
            data-id="${student.id}" data-status="present">Present</button>
          <button type="button" class="${absentClass}"
            data-id="${student.id}" data-status="absent">Absent</button>
        </div>
      `;

    }


    // نحدّث كل الصفوف الظاهرة
    function enhanceAllRows() {

      const rows = studentsBody.rows;

      // إذا ما في طلاب
      if (rows.length === 0) {
        studentsBody.innerHTML = `
          <tr><td colspan="5" class="att-empty">No students found</td></tr>
        `;
        return;
      }

      for (const row of rows) {
        if (row.cells.length === 5) {
          enhanceRow(row);
        }
      }

      updateStats();

    }


    // تحديث الكروت وزر الحفظ
    function updateStats() {

      let present = 0;
      let absent = 0;
      let notMarked = 0;

      students.forEach(student => {

        if (courseSelect.value !== "all" && student.course !== courseSelect.value) {
          return;
        }

        const status = getStatus(student);

        if (status === "present") present++;
        else if (status === "absent") absent++;
        else notMarked++;

      });

      let rate = 0;

      if (present + absent > 0) {
        rate = Math.round((present / (present + absent)) * 100);
      }

      statPresent.textContent = present;
      statAbsent.textContent = absent;
      statNotMarked.textContent = notMarked;
      statRate.textContent = rate + "%";

      // زر الحفظ بيشتغل بس إذا في تعديلات
      saveBtn.disabled = Object.keys(changes).length === 0;

    }


    // رسالة صغيرة تحت
    function showToast(message) {

      toast.textContent = message;
      toast.classList.add("show");

      setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);

    }


    // كل ما displayStudents ترسم الجدول، بنحوّل الصفوف تلقائياً
    const observer = new MutationObserver(enhanceAllRows);
    observer.observe(studentsBody, { childList: true });

    // أول مرة (الجدول انرسم قبل ما نشغّل الـ observer)
    enhanceAllRows();


    // تغيير التاريخ: التعديلات بتخص اليوم القديم
    dateInput.addEventListener("change", () => {

      changes = {};
      enhanceAllRows();

    });


    // اختيار الكورس: نحدّث الكروت حسب الكورس
    courseSelect.addEventListener("change", () => {

      updateStats();

    });


    // الضغط على Present / Absent
    studentsBody.addEventListener("click", event => {

      const button = event.target.closest("button[data-status]");

      if (!button) return;

      changes[button.dataset.id] = button.dataset.status;

      enhanceRow(button.closest("tr"));
      updateStats();

    });


    // Mark all present (للطلاب الظاهرين بالجدول)
    markAllBtn.addEventListener("click", () => {

      for (const row of studentsBody.rows) {
        if (row.cells.length === 5) {
          changes[row.cells[1].textContent.trim()] = "present";
        }
      }

      enhanceAllRows();

    });


    // Save attendance
    saveBtn.addEventListener("click", () => {

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";

      const requests = Object.keys(changes).map(id => {

        const student = findStudent(id);

        // نحدّث يوم موجود أو نضيف يوم جديد
        const attendance = student.attendance.filter(
          item => item.date !== dateInput.value
        );

        attendance.push({ date: dateInput.value, status: changes[id] });

        return fetch(`${window.API_URL ?? "http://localhost:3000"}/students/${student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attendance: attendance })
        }).then(() => {
          student.attendance = attendance;
        });

      });

      Promise.all(requests)
        .then(() => {
          changes = {};
          showToast("Attendance saved");
        })
        .catch(() => {
          showToast("Something went wrong, try again");
        })
        .finally(() => {
          saveBtn.textContent = "Save attendance";
          enhanceAllRows();
        });

    });

  });