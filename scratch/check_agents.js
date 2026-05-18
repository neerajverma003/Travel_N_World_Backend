import mongoose from 'mongoose';
import Agent from '../src/models/agent.js';

async function verifyAllSatish() {
  try {
    const MONGO_URI = 'mongodb+srv://admireTravel:2HSYzAgzELUsgJc1@cluster0.kswyeej.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB database...');

    // Find all agents with satis in their name/email
    const matches = await Agent.find({
      $or: [
        { firstName: /satish/i },
        { lastName: /satish/i },
        { firstName: /satis/i },
        { lastName: /satis/i },
        { email: /satis/i }
      ]
    });

    console.log('\n--- Found Matching Agents ---');
    matches.forEach(m => {
      console.log(`ID: ${m._id} | Name: ${m.firstName} ${m.lastName} | Email: ${m.email} | Role: ${m.role} | RM: ${m.relationshipManagerId}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifyAllSatish();
