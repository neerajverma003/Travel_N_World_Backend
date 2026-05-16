import mongoose from 'mongoose';
import { Enquiry } from '../src/models/enquiry.js';
import Agent from '../src/models/agent.js';

async function checkLeads() {
  try {
    const MONGO_URI = 'mongodb+srv://admireTravel:2HSYzAgzELUsgJc1@cluster0.kswyeej.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI);
    
    const unverifiedAgents = await Agent.find({isVerified:false}).select('_id');
    const unverifiedAgentIds = unverifiedAgents.map(a => a._id);

    const marketplaceQuery = {
      $or: [
        { agentId: { $in: unverifiedAgentIds } },
        { agentId: null },
        { agentId: { $exists: false } }
      ]
    };

    const count = await Enquiry.countDocuments(marketplaceQuery);
    const total = await Enquiry.countDocuments({});
    
    console.log('--- Database Check ---');
    console.log('Total Enquiries in DB:', total);
    console.log('Enquiries matching Marketplace criteria:', count);
    
    if (count > 0) {
      const samples = await Enquiry.find(marketplaceQuery).limit(3);
      samples.forEach(s => console.log('Sample Lead:', s.name, '| AgentId:', s.agentId, '| CreatedAt:', s.createdAt));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLeads();
