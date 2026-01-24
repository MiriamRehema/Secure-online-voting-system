function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function greetUser(name) {
  const randomNum = getRandomNumber(1, 100);
  console.log(`Hello, ${name}! Your lucky number today is ${randomNum}. 🎲`);
}

// Test the functions
greetUser("GitHub Tester");