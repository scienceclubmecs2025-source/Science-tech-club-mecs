const buildStudentUsername = (surname, dob) => {
  const [dd, mm, yyyy] = dob.split("-");
  const yy = yyyy.slice(-2);
  return `${surname}${dd}${mm}${yy}`;
};

const buildFacultyUsername = (email) => email;

module.exports = { buildStudentUsername, buildFacultyUsername };
