// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { isSupported, getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDf-HVPpDo1_L-5EhxakQZmdZ-0pnU0TuI",
  authDomain: "rumakidsweb.firebaseapp.com",
  databaseURL: "https://rumakidsweb-default-rtdb.firebaseio.com",
  projectId: "rumakidsweb",
  storageBucket: "rumakidsweb.appspot.com",
  messagingSenderId: "648272882666",
  appId: "1:648272882666:web:9df19c0c8bc083e766a093",
  measurementId: "G-HE37FMJS6E"
};

const app = initializeApp(firebaseConfig);

isSupported().then((yes) => {
  if (yes) {
    getAnalytics(app);
  } else {
    console.warn("Firebase Analytics no soportado.");
  }
});

export const db = getFirestore(app);
export const auth = getAuth(app);