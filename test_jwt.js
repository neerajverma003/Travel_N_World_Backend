import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import { generateAccessToken } from './src/utils/jwt.js';

try {
  const payload = { id: '123', email: 'test@example.com', role: 'ADMIN' };
  const token = generateAccessToken(payload, true);
  
  
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
} catch (error) {
  console.error("Error:", error);
}
