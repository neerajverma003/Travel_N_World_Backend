import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGODB_URI || process.env.DB_URI || process.env.MONGO_URI;
await mongoose.connect(uri);

const db = mongoose.connection.db;
const agents = db.collection('agents');

// Find all non-AGENT roles
const nonAgents = await agents.find({ role: { $ne: 'AGENT' } }).project({ password: 0, bannerImage: 0, agentPhotos: 0, agentVideos: 0 }).toArray();
console.log('Non-AGENT roles in agents collection:', nonAgents.length);
nonAgents.forEach(a => console.log('  -', a.email, '|', a.role, '|', String(a._id)));

// Check all distinct roles
const roles = await agents.distinct('role');
console.log('\nAll distinct roles in agents:', roles);

// Check notifications
const notifs = db.collection('notifications');
const allNotifs = await notifs.find({}).toArray();
console.log('\nNotifications:', allNotifs.length);
allNotifs.forEach(n => console.log('  -', n.title, '|', n.recipientRole, '|', 'read:', n.isRead, '|', 'recipient:', String(n.recipient)));

process.exit(0);
