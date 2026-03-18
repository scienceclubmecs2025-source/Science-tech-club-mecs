export const buildStudentUsername = (surname, dob) => {
  const [dd, mm, yyyy] = dob.split("-");
  const yy = yyyy.slice(-2);
  return `${surname}${dd}${mm}${yy}`;
};

export const buildFacultyUsername = (email) => email;
