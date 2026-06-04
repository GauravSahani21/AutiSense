import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Load models
import Child from './models/Child.js';
import Screening from './models/Screening.js';
import Report from './models/Report.js';
import VisualScan from './models/VisualScan.js';

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const clearData = async () => {
  try {
    console.log('Clearing screenings, reports, and visual scans...');
    
    // Delete screenings, reports, and visual scans
    const deletedScreenings = await Screening.deleteMany({});
    const deletedReports = await Report.deleteMany({});
    const deletedVisualScans = await VisualScan.deleteMany({});
    
    console.log(`Deleted ${deletedScreenings.deletedCount} M-CHAT screenings.`);
    console.log(`Deleted ${deletedReports.deletedCount} reports.`);
    console.log(`Deleted ${deletedVisualScans.deletedCount} AI Visual scans.`);

    // Reset risk and score on all child profiles
    console.log('Resetting children screening stats...');
    const result = await Child.updateMany({}, {
      $set: {
        lastScreen: null,
        risk: 'Low',
        score: 0,
        total: 20
      }
    });

    console.log(`Successfully reset stats on ${result.modifiedCount} child profiles.`);
    console.log('✅ DB Screenings Data Cleared Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearData();
