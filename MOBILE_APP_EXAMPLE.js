// Mobile App: How to Create a Pending Consultation Request
// Instead of writing directly to bookedSlots, write to consultationRequests with status: 'pending'

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // Your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Create a pending consultation request
 * This will appear in the admin dashboard under "Pending Consultation Requests"
 * The admin must confirm it before it appears on the calendar
 */
async function createConsultationRequest(date, time) {
  const user = auth.currentUser;
  
  if (!user) {
    alert('You must be logged in to request a consultation.');
    return;
  }

  try {
    const requestRef = await addDoc(collection(db, 'consultationRequests'), {
      userId: user.uid,                    // User ID making the request
      date: date,                          // Format: "DD/MM/YYYY" (e.g., "23/11/2025")
      time: time,                          // Format: "HH:MM-HH:MM" (e.g., "08:00-09:00")
      status: 'pending',                   // Must be 'pending' for admin review
      requestedAt: serverTimestamp(),      // Server timestamp
      // Optional: add other fields
      name: user.displayName || user.email // Patient name for admin to see
    });

    console.log('Consultation request created:', requestRef.id);
    alert('Your consultation request has been submitted. The admin will review and confirm.');
    
  } catch (error) {
    console.error('Error creating consultation request:', error);
    alert('Failed to submit consultation request: ' + error.message);
  }
}

// Example usage:
// createConsultationRequest('23/11/2025', '08:00-09:00');
