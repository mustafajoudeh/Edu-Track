// =====================================================
// loginPage.js
// Login page logic: show/hide password, check the email and password
// with db.json, save the instructor, then go to the dashboard.
// HTML: index.html
// =====================================================

const API_URL = (window.API_URL ?? "http://localhost:3000") + "/instructors";


// =====================================================
// 1. Get the elements from the HTML
// =====================================================

const form = document.querySelector("form");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const showPasswordBtn = document.getElementById("showpass");
const rememberMe = document.getElementById("remember-me");
const message = document.getElementById("message");


// =====================================================
// 2. Remember me
// If the instructor checked "Keep me signed in" last time,
// fill the email for them.
// =====================================================

const savedEmail = localStorage.getItem("rememberedEmail");

if (savedEmail) {
    emailInput.value = savedEmail;
    rememberMe.checked = true;
}


// =====================================================
// 3. Show / hide password
// =====================================================

showPasswordBtn.addEventListener("click", function () {

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        showPasswordBtn.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        showPasswordBtn.textContent = "Show";
    }
});


// =====================================================
// 4. Show a message under the form
// type: "error" (red) or "success" (green), colors come from main.css
// =====================================================

function showMessage(text, type) {

    message.textContent = text;

    if (type === "success") {
        message.style.color = "var(--ok)";
    } else {
        message.style.color = "var(--bad)";
    }
}


// =====================================================
// 5. Log in
// =====================================================

form.addEventListener("submit", async function (event) {

    // stop the form from reloading the page
    event.preventDefault();

    // read the values (same as the registration page: email is saved in lowercase)
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    try {

        // 5.1 get all instructors from db.json
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to get instructors");
        }

        const instructors = await response.json();

        // 5.2 find the instructor with the same email and password
        const instructor = instructors.find(function (user) {
            return user.email.toLowerCase() === email && user.password === password;
        });

        if (!instructor) {
            showMessage("Invalid email or password.", "error");
            return;
        }

        // 5.3 save the logged in instructor (without password)
        const { password: _pw, ...safeInstructor } = instructor;
        const safeJson = JSON.stringify(safeInstructor);

        // 5.4 remember me: localStorage keeps session; otherwise sessionStorage only
        if (rememberMe.checked) {
            localStorage.setItem("instructorId", safeInstructor.id);
            sessionStorage.removeItem("instructorId");
            localStorage.setItem("currentInstructor", safeJson);
            sessionStorage.removeItem("currentInstructor");
            localStorage.setItem("rememberedEmail", email);
        } else {
            sessionStorage.setItem("instructorId", safeInstructor.id);
            localStorage.removeItem("instructorId");
            sessionStorage.setItem("currentInstructor", safeJson);
            localStorage.removeItem("currentInstructor");
            localStorage.removeItem("rememberedEmail");
        }

        // 5.5 success: go to the dashboard
        showMessage(`Welcome back ${safeInstructor.name}!`, "success");

        setTimeout(function () {
            window.location.href = "dashboard.html";
        }, 1000);

    } catch (error) {

        // the server is not running or the request failed
        console.error(error);
        showMessage("Something went wrong. Please make sure json-server is running.", "error");
    }
});
