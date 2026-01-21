import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_KEY",
    authDomain: "YOUR_DOMAIN",
    projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function loadCloudPlayer(uid) {
    const ref = doc(db, "players", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

export async function saveCloudPlayer(uid, data) {
    await setDoc(doc(db, "players", uid), data);
}

signInAnonymously(auth);

// Bridge to player.js
if (typeof window !== 'undefined' && window.initCloudSync) {
    window.initCloudSync(auth, loadCloudPlayer, saveCloudPlayer);
}
