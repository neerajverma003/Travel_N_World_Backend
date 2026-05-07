import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Agent from '../src/models/agent.js';

dotenv.config();

const cleanup = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelworld';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for cleanup...');

    // Find all agents that have "Preview" or invalid strings in their agentPhotos array
    const agents = await Agent.find({
      agentPhotos: { $regex: /preview/i }
    });

    

    for (const agent of agents) {
      const originalCount = agent.agentPhotos.length;
      
      // Filter out invalid URLs
      agent.agentPhotos = agent.agentPhotos.filter(url => 
        url && 
        typeof url === 'string' && 
        !url.toLowerCase().includes('preview') && 
        url.startsWith('http')
      );

      const removedCount = originalCount - agent.agentPhotos.length;
      await agent.save();
      
      console.log(`Cleaned up agent: ${agent.company || agent.firstName}. Removed ${removedCount} broken photos.`);
    }

    console.log('Cleanup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
};

cleanup();
