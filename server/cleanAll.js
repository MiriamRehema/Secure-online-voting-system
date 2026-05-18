const mongoose = require('mongoose');
const Election = require('./src/models/Election');
const Candidate = require('./src/models/Candidate');
const Vote = require('./src/models/Vote');
const Token = require('./src/models/Token');
const Student = require('./src/models/Student');
require('dotenv').config();

mongoose.connect(process.env.RAILWAY_MONGO_URL).then(async () => {
  await Election.deleteMany({});
  await Candidate.deleteMany({});
  await Vote.deleteMany({});
  await Token.deleteMany({});
  await Student.updateMany({}, { hasVoted: false, votingToken: null });
  console.log('All data cleaned successfully!');
  mongoose.disconnect();
}).catch(console.error);
