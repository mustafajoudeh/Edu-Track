// =====================================================
// EduTrack server
// Serves the pages (index.html, css, js...) and the
// json-server API (/instructors, /students, /tasks...)
// from the same address, so the site works online.
// =====================================================

const jsonServer = require("json-server");
const path = require("path");

// 1. create the server
const server = jsonServer.create();

// 2. the database file
const router = jsonServer.router(path.join(__dirname, "db.json"));

// 3. serve the project files (HTML, CSS, JS, images)
const middlewares = jsonServer.defaults({
  static: path.join(__dirname),
});

// 4. the hosting service gives us the port, 3000 on my laptop
const PORT = process.env.PORT || 3000;

server.use(middlewares);
server.use(router);

server.listen(PORT, function () {
  console.log("EduTrack is running on port " + PORT);
});
