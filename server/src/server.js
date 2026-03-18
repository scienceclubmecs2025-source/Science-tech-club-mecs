const routeFiles = [
  ['./routes/auth',          '/api/auth'],
  ['./routes/users',         '/api/users'],
  ['./routes/courses',       '/api/courses'],
  ['./routes/projects',      '/api/projects'],
  ['./routes/events',        '/api/events'],
  ['./routes/announcements', '/api/announcements'],
  ['./routes/messages',      '/api/messages'],
  ['./routes/config',        '/api/config'],
  ['./routes/admin',         '/api/admin'],
  ['./routes/quizzes',       '/api/quizzes'],
  ['./routes/chatbot',       '/api/chatbot'],
  ['./routes/reports',       '/api/reports'],
];

for (const [file, path] of routeFiles) {
  try {
    app.use(path, require(file));
    console.log(`✅ Mounted ${path}`);
  } catch (err) {
    console.error(`❌ FAILED to mount ${path}:`, err.message);
  }
}
