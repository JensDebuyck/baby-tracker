import { db, auth } from "./firebase.js";

import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ---------------- AUTH ----------------

const provider = new GoogleAuthProvider();

document.getElementById("googleLogin").addEventListener("click", async () => {
    await signInWithPopup(auth, provider);
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
});

// ---------------- UI ELEMENTS ----------------

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const userInfo = document.getElementById("userInfo");

const form = document.getElementById("activity-form");
const tabelBody = document.querySelector("#tabel tbody");

let data = [];
let currentUser = null;

// ---------------- AUTH STATE ----------------

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        authSection.style.display = "none";
        appSection.style.display = "block";

        userInfo.textContent = `Ingelogd als: ${user.displayName}`;

        await loadData();
    } else {
        authSection.style.display = "block";
        appSection.style.display = "none";
    }
});

// ---------------- SAVE DATA ----------------
const activityCategoryMap = {
    slaap: "slaap",
    voeding: "voeding",
    verversen: "zorg",
    draagzak: "zorg",
    speelmat: "spel",
    bad: "zorg",
    mama_tijd: "oudertijd",
    andere: "andere"
};

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    const entry = {
        dag: document.getElementById("dag").value,
        activiteit: document.getElementById("activiteit").value,
        start: document.getElementById("start").value,
        eind: document.getElementById("eind").value,
        categorie: document.getElementById("categorie").value,

        userId: currentUser.uid,

        createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "activities"), entry);

    form.reset();
    await loadData();
});



// ---------------- LOAD DATA ----------------

async function loadData() {
    if (!currentUser) return;

    const q = query(
        collection(db, "activities"),
        where("userId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);

    data = [];

    snapshot.forEach((doc) => {
        data.push(doc.data());
    });

    render();
}

// ---------------- RENDER TABLE ----------------

function render() {
    tabelBody.innerHTML = "";

    data.forEach(item => {
        const duur = calculateDuration(item.start, item.eind);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.dag}</td>
            <td>${item.activiteit}</td>
            <td>${item.start}</td>
            <td>${item.eind}</td>
            <td>${item.categorie}</td>
            <td>${duur}</td>
        `;

        tabelBody.appendChild(row);
    });
}

// ---------------- DURATION ----------------

function calculateDuration(start, end) {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);

    const diffMs = endTime - startTime;

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}u ${remainingMinutes}m`;
}

document.getElementById("activiteit").addEventListener("change", (e) => {
    const activiteit = e.target.value;

    document.getElementById("categorie").value =
        activityCategoryMap[activiteit] || "andere";
});