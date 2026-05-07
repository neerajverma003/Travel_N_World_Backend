import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import adminLoginCredentialRoutes from './routes/adminLoginCredentialRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import corsOptions from './config/corsoption.js';
import bannerRoutes from "./routes/bannerRoutes.js";
import blogRoutes from "./routes/BlogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import agentItineraryRoutes from "./routes/agentItineraryRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";
import heroVideoRoutes from './routes/heroVideoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/adminslogincredentials', adminLoginCredentialRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/agent-itineraries", agentItineraryRoutes);
app.use("/api/admin-settings", adminSettingsRoutes);
app.use('/api/hero-videos',heroVideoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global error handler
app.use(errorHandler);

export default app;
