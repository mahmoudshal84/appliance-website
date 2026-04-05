// src/config.js - Centralized configuration file
export const config = {
  // Site information
  siteName: process.env.REACT_APP_SITE_NAME || 'Appliance House',
  phoneNumber: process.env.REACT_APP_PHONE_NUMBER || '(859) 217-3800',
  email: process.env.REACT_APP_EMAIL || 'appliancehouseky@gmail.com',
  address: process.env.REACT_APP_ADDRESS || '305 E High St, Lexington, KY 40507',
  
  // Business hours
  businessHours: {
    weekdays: 'Monday - Thursday: 10:00 AM - 6:00 PM',
    friday: 'Friday: 10:00 AM - 1:30 PM',
    saturday: 'Saturday: 12:00 PM - 5:00 PM',
    sunday: 'Sunday: 12:00 PM - 5:00 PM'
  },
  
  // Firebase configuration
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  },
  
  // Analytics
  googleAnalyticsId: process.env.REACT_APP_GA_TRACKING_ID,
  
  // External links
  externalLinks: {
    snapFinancing: 'https://snapfinance.com/find-stores?zipCode=40507&state=KY&city=Richmond&industry=APPLIANCES&merchantId=490315615&dbaName=Appliance-House---Nicholasville',
    acimaFinancing: 'https://locations.acima.com/kentucky/nicholasville/5000-park-central-ave/',
    googleMaps: 'https://maps.google.com/maps?q=305+E+High+St,Lexington,KY+40507&output=embed'
  }
};

// Validation function
export const validateConfig = () => {
  const requiredFirebaseKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
  const missing = requiredFirebaseKeys.filter(key => !config.firebase[key]);
  
  if (missing.length > 0) {
    console.error('Missing required Firebase configuration:', missing);
    return false;
  }
  
  return true;
};

export default config;