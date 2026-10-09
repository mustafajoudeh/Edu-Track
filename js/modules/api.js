const BASE_URL = window.API_URL ?? "http://localhost:3000";

// ================= AUTH API ===========================

export async function loginApi(email, password) {
  try {
    const response = await fetch(
      `${BASE_URL}/instructors?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    );

    if (!response.ok) {
      throw new Error("Login request failed");
    }

    const instructors = await response.json();

    if (instructors.length === 0) {
      throw new Error("Email or password is not valid");
    }

    return instructors[0];
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// ================= STUDENTS API =======================

// Get all students for one instructor
export async function getAllStudents(instructorId) {
  try {
    const response = await fetch(
      `${BASE_URL}/students?instructorId=${instructorId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get instructor students");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Get one student belonging to one instructor
export async function getStudentById(id, instructorId) {
  try {
    const response = await fetch(`${BASE_URL}/students/${id}`);

    if (!response.ok) {
      throw new Error("Failed to get student");
    }

    const student = await response.json();

    if (!student || Number(student.instructorId) !== Number(instructorId)) {
      throw new Error("Student not found");
    }

    return student;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Add student
export async function addStudent(student) {
  try {
    const response = await fetch(`${BASE_URL}/students`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(student),
    });

    if (!response.ok) {
      throw new Error("Failed to add student");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Update student
export async function updateStudent(id, data) {
  try {
    const response = await fetch(`${BASE_URL}/students/${id}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update student");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Delete student
export async function deleteStudent(id) {
  try {
    const response = await fetch(`${BASE_URL}/students/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete student");
    }

    return true;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// ================= ACTIVITIES API =====================

// Get all activities for instructor
export async function getInstructorActivities(instructorId) {
  try {
    const response = await fetch(
      `${BASE_URL}/activities?instructorId=${instructorId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get instructor activities");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Get activities for specific student + instructor
export async function getStudentActivities(studentId, instructorId) {
  try {
    const response = await fetch(
      `${BASE_URL}/activities?studentId=${studentId}&instructorId=${instructorId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get student activities");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// Add activity
export async function addActivity(activity) {
  try {
    const response = await fetch(`${BASE_URL}/activities`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      throw new Error("Failed to add activity");
    }
  } catch (error) {
    console.error(error);
  }
}

// ====================================================
// ===================== TASKS API ===============
// ===================================================

// ================= Get all instructor tasks =================

export async function getTasks(instructorId) {
  try {
    const response = await fetch(
      `${BASE_URL}/tasks?instructorId=${instructorId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get instructor tasks");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// ================= Add new task =================

export async function addTask(task) {
  try {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error("Failed to add task");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// ================= Get task by id =================

export async function getTaskById(taskId, instructorId) {
  try {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`);

    if (!response.ok) {
      throw new Error("Task not found");
    }

    const task = await response.json();

    if (Number(task.instructorId) !== Number(instructorId)) {
      throw new Error("Task not found for this instructor");
    }

    return task;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// ================= Get submissions =================

export async function getSubmissions(instructorId) {
  try {
    const response = await fetch(
      `${BASE_URL}/submissions?instructorId=${instructorId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get submissions");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

// ========== update student grade in truck page =====

export async function updateSubmission(submissionId, updatedData) {
  try {
    const response = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error("Failed to update submission");
    }

    return await response.json();
  } catch (error) {
    console.error(error.message);

    throw error;
  }
}

export async function getActivities() {
  try {
    const response = await fetch(
      `${BASE_URL}/activities?instructorId=${instructor.id}`,
    );

    if (!response.ok) {
      throw new Error("Failed to get activities");
    }

    return await response.json();
  
}catch (error) {
    console.error(error.message);
    throw error;
  }
}
