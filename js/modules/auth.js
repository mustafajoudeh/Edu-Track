// =====================================================
// auth.js
// Helper functions for instructor accounts (registration).
// Used by: js/pages/registrationPage.js
// =====================================================

const INSTRUCTORS_URL = (window.API_URL ?? "http://localhost:3000") + "/instructors";


// =====================================================
// 1. Validation rules
// Returns an object: { isValid: true/false, message: "..." }
// =====================================================

export function validateRegistration(name, email, password, confirmPassword) {

    // all fields are required
    if (name === "" || email === "" || password === "" || confirmPassword === "") {
        return { isValid: false, message: "Please fill in all the fields." };
    }

    // name must be at least 3 characters
    if (name.length < 3) {
        return { isValid: false, message: "Full name must be at least 3 characters." };
    }

    // simple email check: it must have "@" and "."
    if (!email.includes("@") || !email.includes(".")) {
        return { isValid: false, message: "Please enter a valid email address." };
    }

    // password must be at least 6 characters (same rule as the login page)
    if (password.length < 6) {
        return { isValid: false, message: "Password must be at least 6 characters." };
    }

    // both passwords must be the same
    if (password !== confirmPassword) {
        return { isValid: false, message: "Passwords do not match." };
    }

    return { isValid: true, message: "" };
}


// =====================================================
// 2. Check if the email is already used by another instructor
// Returns true or false.
// =====================================================

export async function isEmailTaken(email) {

    const response = await fetch(INSTRUCTORS_URL);

    if (!response.ok) {
        throw new Error("Failed to get instructors");
    }

    const instructors = await response.json();

    // loop over all instructors and compare the emails
    for (const instructor of instructors) {
        if (instructor.email.toLowerCase() === email.toLowerCase()) {
            return true;
        }
    }

    return false;
}


// =====================================================
// 3. Save the new instructor in db.json (POST request)
// Returns the saved instructor (json-server adds the id).
// =====================================================

export async function registerInstructor(instructor) {

    const response = await fetch(INSTRUCTORS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(instructor)
    });

    if (!response.ok) {
        throw new Error("Failed to register instructor");
    }

    return await response.json();
}
