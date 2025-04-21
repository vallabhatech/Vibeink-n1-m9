import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

import CONFIG from './config.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1dz2B4pisEmQiNn14GJx099j1efr-jS4",
  authDomain: "vibexxx-e33d7.firebaseapp.com",
  projectId: "vibexxx-e33d7",
  storageBucket: "vibexxx-e33d7.firebasestorage.app",
  messagingSenderId: "133772101647",
  appId: "1:133772101647:web:01448a9dcb2b7ac1e0bb7a",
  measurementId: "G-H9GP7H251P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication functions
export const registerUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email
    await sendEmailVerification(userCredential.user);
    
    // Add user info to Firestore
    await addDoc(collection(db, "users"), {
      uid: userCredential.user.uid,
      username: username,
      email: email,
      emailVerified: false,
      createdAt: new Date().toISOString()
    });
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      return { 
        success: false, 
        error: "Email not verified. Please check your inbox and verify your email.",
        needsVerification: true,
        user: userCredential.user
      };
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to resend verification email
export const resendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to send password reset email
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getUserInfo = async (uid) => {
  try {
    const userQuery = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      return { success: true, data: querySnapshot.docs[0].data() };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Manga functions
export const getAllManga = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "manga"));
    const manga = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: manga };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMangaById = async (mangaId) => {
  try {
    const docRef = doc(db, "manga", mangaId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "Manga not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addManga = async (mangaData) => {
  try {
    const docRef = await addDoc(collection(db, "manga"), mangaData);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Upload image to Firebase Storage
export const uploadImage = async (file) => {
  try {
    const storageRef = ref(storage, `images/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error("Upload error:", error.message);
          reject({ success: false, error: error.message });
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);
          resolve({ success: true, url: downloadURL });
        }
      );
    });
  } catch (error) {
    console.error("Error uploading image:", error.message);
    return { success: false, error: error.message };
  }
};

export default { 
  auth, 
  db, 
  storage,
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  getUserInfo,
  getAllManga,
  getMangaById,
  addManga,
  uploadImage,
  resendVerificationEmail,
  sendPasswordResetEmail
};