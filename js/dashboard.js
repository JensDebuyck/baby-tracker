import { db } from "./firebase.js";
import { collection, getDocs, query, where }
    from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const GROUP_ID = "baby-family";

let data = [];

await loadData();

async function loadData() {
    const q = query(
        collection(db, "activities"),
        where("groupId", "==", GROUP_ID)
    );

    const snapshot = await getDocs(q);

    data = snapshot.docs.map(doc => doc.data());

    renderStats();
    renderTable();
    renderChart();
}

// ---------------- STATS ----------------

function renderStats() {
    let sleep = 0;
    let feed = 0;
    let other = 0;

    data.forEach(item => {
        if (!item.eind) return; // sla lopende activiteit over

        const minutes = calcMinutes(item.start, item.eind);

        if (item.categorie === "slaap") sleep += minutes;
        else if (item.categorie === "voeding") feed += minutes;
        else other += minutes;
    });

    document.getElementById("sleepTotal").textContent = `Slaap: ${format(sleep)}`;
    document.getElementById("feedTotal").textContent = `Voeding: ${format(feed)}`;
    document.getElementById("otherTotal").textContent = `Andere: ${format(other)}`;
}

// ---------------- TABLE ----------------

function renderTable() {
    const tbody = document.getElementById("dashTable");
    tbody.innerHTML = "";

    data.forEach(item => {
        const duur = item.eind ? format(calcMinutes(item.start, item.eind)) : "lopend";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.dag}</td>
            <td>${item.categorie}</td>
            <td>${item.activiteit}</td>
            <td>${duur}</td>
        `;

        tbody.appendChild(row);
    });
}

// ---------------- TIME CALC ----------------

function calcMinutes(start, end) {
    const s = new Date(`1970-01-01T${start}`);
    const e = new Date(`1970-01-01T${end}`);
    return Math.max(0, (e - s) / 60000);
}

function format(min) {
    const h = Math.floor(min / 60);
    const m = Math.floor(min % 60);
    return `${h}u ${m}m`;
}

// ---------------- CHART ----------------

function renderChart() {
    let slaap = 0;
    let voeding = 0;
    let zorg = 0;
    let andere = 0;

    data.forEach(item => {
        if (!item.eind) return; // sla lopende activiteit over

        const minutes = calcMinutes(item.start, item.eind);

        switch (item.categorie) {
            case "slaap": slaap += minutes; break;
            case "voeding": voeding += minutes; break;
            case "zorg": zorg += minutes; break;
            default: andere += minutes;
        }
    });

    const ctx = document.getElementById("categoryChart");

    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Slaap", "Voeding", "Zorg", "Andere"],
            datasets: [{
                data: [slaap, voeding, zorg, andere]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}