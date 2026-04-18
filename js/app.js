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
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { deleteDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ---------------- AUTH ----------------

const provider = new GoogleAuthProvider();

document.getElementById("googleLogin").addEventListener("click", async () => {
    await signInWithPopup(auth, provider);
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
});

// ---------------- UI ELEMENTS ----------------

const appSection = document.getElementById("appSection");
const userInfo = document.getElementById("userInfo");
const form = document.getElementById("activity-form");
const tabelBody = document.querySelector("#tabel");
const kalenderDiv = document.getElementById("calendar");
const dagTitel = document.getElementById("dagTitel");

let data = [];
let currentUser = null;
let selectedDay = null;
let currentDate = new Date();

// ---------------- AUTH STATE ----------------

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        document.getElementById("authSection").style.display = "none";
        document.getElementById("userBar").style.display = "flex";
        appSection.style.display = "block";
        userInfo.textContent = `Ingelogd als: ${user.displayName}`;

        setCategoryFromActivity();

        await loadData();
    } else {
        document.getElementById("authSection").style.display = "block";
        document.getElementById("userBar").style.display = "none";
        appSection.style.display = "none";
    }

    if (user) {
        document.getElementById("dag").value = new Date().toISOString().split("T")[0];
    }
});

// ---------------- CATEGORY MAP ----------------

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

// ---------------- SAVE DATA ----------------

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) return;

    const newStart = document.getElementById("start").value;
    const newDag = document.getElementById("dag").value;

    // Sluit de vorige open activiteit af van dezelfde dag
    const open = data.find(item => !item.eind && item.dag === newDag);
    if (open) {
        await updateDoc(doc(db, "activities", open.id), { eind: newStart });
    }

    const entry = {
        dag: newDag,
        activiteit: document.getElementById("activiteit").value,
        start: newStart,
        eind: null,
        categorie: document.getElementById("categorie").value,
        groupId: "baby-family",
        createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "activities"), entry);

    form.reset();
    await loadData();

    // Blijf op de geselecteerde dag na opslaan
    selectDay(newDag);
});

// ---------------- LOAD DATA ----------------

async function loadData() {
    if (!currentUser) return;

    const q = query(
        collection(db, "activities"),
        where("groupId", "==", "baby-family")
    );

    const snapshot = await getDocs(q);

    console.log("getDocs:", getDocs);
    console.log("query:", q);

    data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    renderKalender();
    renderTabel();
}

// ---------------- KALENDER ----------------

function renderKalender() {
    if(!kalenderDiv) return;

    kalenderDiv.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() ;

    //Eerste dag van de maan
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById("monthLabel").textContent =
        firstDay.toLocaleDateString("nl-BE", {
            month:"long",
            year:"numeric"
        });

    const grid = document.createElement("div");
    grid.classList.add("calendar-grid");

    //lege vakjes voor start offset
    for (let i = 0; i< (startDay === 0 ? 6 : startDay - 1); i++){
        const empty = document.createElement("div");
        grid.appendChild(empty);
    }

    //Dagen
    for (let day = 1; day <= daysInMonth; day++){
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const btn = document.createElement("button");
        btn.textContent = String(day);
        btn.classList.add("calendar-day");

        // Highlight geselecteerde dag
        if (dateStr === selectedDay) {
            btn.classList.add("actief");
        }

        // Check of er data is op deze dag
        const hasData = data.some(item => item.dag === dateStr);
        if (hasData) {
            btn.classList.add("has-data");
        }

        btn.addEventListener("click", () => selectDay(dateStr));

        grid.appendChild(btn);
    }

    console.log(grid);
    kalenderDiv.appendChild(grid);

}

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderKalender();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderKalender();
});

// ---------------- SELECT DAY ----------------

function selectDay(dag) {
    selectedDay = dag;
    renderKalender(); // herrender om actieve knop bij te werken
    renderTabel();
}

// ---------------- RENDER TABEL ----------------

function renderTabel() {
    if(!tabelBody) return;

    tabelBody.innerHTML = "";

    if (!selectedDay) {
        dagTitel.textContent = "Selecteer een dag";
        return;
    }

    dagTitel.textContent = `Activiteiten op ${formatDag(selectedDay)}`;

    const filtered = data
        .filter(item => item.dag === selectedDay)
        .sort((a, b) => a.start.localeCompare(b.start));

    filtered.forEach(item => {
        const duur = item.eind ? calculateDuration(item.start, item.eind) : "lopend";
        const eind = item.eind ?? "bezig...";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.dag}</td>
            <td>${item.activiteit}</td>
            <td>${item.start}</td>
            <td>${eind}</td>
            <td>${item.categorie}</td>
            <td>${duur}</td>
            <td>
                <button class="edit-btn" data-id="${item.id}">✏️</button>
                <button class="delete-btn" data-id="${item.id}">🗑️</button>
            </td>
        `;
        tabelBody.appendChild(row);
    });
}

// ---------------- HELPERS ----------------

function calculateDuration(start, end) {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diffMs = endTime - startTime;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}u ${remainingMinutes}m`;
}

function formatDag(dag) {
    // Zet "2024-01-15" om naar "ma 15 jan"
    const date = new Date(dag);
    return date.toLocaleDateString("nl-BE", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
}

function setCategoryFromActivity(){
    const activiteit = document.getElementById("activiteit").value;
    document.getElementById("categorie").value = activityCategoryMap[activiteit] || "andere";
}



// ---------------- CATEGORY CHANGE ----------------

document.getElementById("activiteit").addEventListener("change", setCategoryFromActivity);

tabelBody.addEventListener("click", async(e) =>{
    if(e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;

        await deleteDoc(doc(db, "activities", id));
        await loadData();
    }
});

tabelBody.addEventListener("click", async(e) => {
        if (e.target.classList.contains("edit-btn")) {
            const id = e.target.dataset.id;
            const item = data.find(d => d.id === id);

            const newActiviteit = prompt("Activiteit", item.activiteit)
            const newStart = prompt("Start", item.start);
            const newEind = prompt("einde", item.eind || "");

            if (!newActiviteit || !newStart) return;

            await updateDoc(doc(db, "activities", id), {
                activiteit: newActiviteit,
                start: newStart,
                einde: newEind || null,
            });

            await loadData();
        }
    });