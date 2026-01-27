const fs = require('fs');
const path = require('path');

// Shuffles array and returns the new index of the element that was at originalIndex
function shuffleChoices(choices, correctIndex) {
  const correctAnswer = choices[correctIndex];

  // Fisher-Yates shuffle
  const shuffled = [...choices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Find new index of correct answer
  const newCorrectIndex = shuffled.indexOf(correctAnswer);

  return { shuffled, newCorrectIndex };
}

function randomizeQuestion(question) {
  const { shuffled, newCorrectIndex } = shuffleChoices(question.choices, question.correctIndex);
  return {
    ...question,
    choices: shuffled,
    correctIndex: newCorrectIndex
  };
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  // Handle trivia files with questions array
  if (data.questions && Array.isArray(data.questions)) {
    data.questions = data.questions.map(randomizeQuestion);
  }

  // Handle alternate questions
  if (data.alternateQuestions && Array.isArray(data.alternateQuestions)) {
    data.alternateQuestions = data.alternateQuestions.map(randomizeQuestion);
  }

  // Handle steal-questions.json format (array of location objects)
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item.questions && Array.isArray(item.questions)) {
        item.questions = item.questions.map(randomizeQuestion);
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  Updated: ${filePath}`);
}

// Process all trivia files
const triviaDir = path.join(__dirname, '..', 'src', 'data', 'trivia');
const triviaFiles = fs.readdirSync(triviaDir).filter(f => f.endsWith('.json'));

triviaFiles.forEach(file => {
  processFile(path.join(triviaDir, file));
});

// Process steal-questions.json
const stealQuestionsPath = path.join(__dirname, '..', 'src', 'data', 'steal-questions.json');
if (fs.existsSync(stealQuestionsPath)) {
  processFile(stealQuestionsPath);
}

console.log('\nDone! Answer positions have been randomized.');
