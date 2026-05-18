const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const Vote = require('./src/models/Vote');
const Token = require('./src/models/Token');
require('dotenv').config();

mongoose.connect(process.env.RAILWAY_MONGO_URL).then(async () => {
  await Student.updateMany({}, { hasVoted: false, votingToken: null });
  await Vote.deleteMany({});
  await Token.deleteMany({});
  console.log('All votes reset successfully!');
  mongoose.disconnect();
}).catch(console.error);
