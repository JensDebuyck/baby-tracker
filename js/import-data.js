import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp }
    from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const GROUP_ID = "baby-family";

const dayMap = {
    woe: "2026-04-15",
    do: "2026-04-16",
    vrij: "2026-04-17"
};

function formatTime(t) {
    if (!t) return "";
    const parts = t.split(":");
    return parts[0].padStart(2, "0") + ":" + parts[1].padStart(2, "0");
}

const rawData = [
    ["woe","slaap","0:00:00","5:10:00","slaap"],
    ["woe","verversen","5:10:00","5:18:00","andere"],
    ["woe","voeding","5:18:00","5:50:00","voeding"],
    ["woe","slaap","5:50:00","8:47","slaap"],
    ["woe","verversen","8:47","9:17:00","andere"],
    ["woe","voeding","9:17:00","9:30:00","voeding"],
    ["woe","mama tijd","9:30:00","10:15","andere"],
    ["woe","verversen","10:15","10:30:00","andere"],
    ["woe","draagzak","10:30:00","10:50:00","andere"],
    ["woe","slaap","10:50:00","11:33:00","slaap"],
    ["woe","wakker","11:33:00","11:35:00","andere"],
    ["woe","verversen","11:35:00","11:49:00","andere"],
    ["woe","voeding","11:49:00","12:05:00","voeding"],
    ["woe","op schoot","12:05:00","12:16:00","andere"],
    ["woe","mama tijd","12:16:00","12:30:00","andere"],
    ["woe","verversen","12:30:00","12:45:00","andere"],
    ["woe","kine","12:45:00","14:07:00","andere"],
    ["woe","draagzak","14:07:00","14:17:00","andere"],
    ["woe","slaap","14:17:00","15:15:00","slaap"],
    ["woe","wakker","15:15:00","15:33:00","andere"],
    ["woe","voeding","15:33:00","16:05:00","voeding"],
    ["woe","slaap","16:05:00","16:10:00","slaap"],
    ["woe","op schoot","16:10:00","16:30:00","andere"],
    ["woe","speelmat","16:30:00","16:40:00","andere"],
    ["woe","verversen","16:40:00","16:50:00","andere"],
    ["woe","draagzak","16:50:00","17:05:00","andere"],
    ["woe","slaap","17:05:00","17:30:00","slaap"],
    ["woe","wakker","17:30:00","17:45:00","andere"],
    ["woe","voeding","17:45:00","18:05:00","voeding"],
    ["woe","op schoot","18:05:00","18:15:00","andere"],
    ["woe","mama tijd","18:15:00","18:40:00","andere"],
    ["woe","verversen","18:40:00","18:50:00","andere"],
    ["woe","bad","18:50:00","19:10:00","andere"],
    ["woe","draagzak","19:10:00","19:25:00","andere"],
    ["woe","slaap","19:25:00","19:55:00","slaap"],
    ["woe","wakker","19:55:00","20:00:00","andere"],
    ["woe","verversen","20:00:00","20:10:00","andere"],
    ["woe","voeding","20:10:00","21:10:00","voeding"],
    ["woe","slaap","21:10:00","23:59:00","slaap"],

    ["do","slaap","0:00","4:04","slaap"],
    ["do","wakker","4:04","4:05","andere"],
    ["do","verversen","4:05","4:13","andere"],
    ["do","voeding","4:13","4:37","voeding"],
    ["do","slaap","4:37","7:20","slaap"],
    ["do","wakker","7:20","7:25","andere"],
    ["do","mama tijd","7:25","7:40","andere"],
    ["do","verversen","7:40","7:55","andere"],
    ["do","voeding","7:55","8:25","voeding"],
    ["do","op schoot","8:25","8:36","andere"],
    ["do","draagzak","8:36","8:50","andere"],
    ["do","slaap","8:50","9:45","slaap"],
    ["do","verversen","9:55","10:11","andere"],
    ["do","voeding","10:11","10:25","voeding"],
    ["do","op schoot","10:25","10:35","andere"],
    ["do","speelmat","10:35","10:50","andere"],
    ["do","verversen","10:45","11:05","andere"],
    ["do","draagzak","11:05","11:20","andere"],
    ["do","slaap","11:20","13:24","slaap"],
    ["do","wakker","13:24","13:30","andere"],
    ["do","verversen","13:30","13:45","andere"],
    ["do","voeding","13:45","14:20","voeding"],
    ["do","op schoot","14:20","14:35","andere"],
    ["do","draagzak","14:35","15:00","andere"],
    ["do","slaap","15:00","17:00","slaap"],
    ["do","wakker","17:00","17:10","andere"],
    ["do","verversen","17:10","17:30","andere"],
    ["do","voeding","17:30","17:50","voeding"],
    ["do","op schoot","17:50","18:05","andere"],
    ["do","wassen","18:05","18:30","andere"],
    ["do","draagzak","18:30","18:45","andere"],
    ["do","slaap","18:45","19:15","slaap"],
    ["do","wakker","19:15","19:25","andere"],
    ["do","verversen","19:25","19:37","andere"],
    ["do","voeding","19:37","21:23","voeding"],
    ["do","slaap","21:23","22:25","slaap"],
    ["do","voeding","22:26","22:34","voeding"],
    ["do","slaap","22:34","23:59","slaap"],

    ["vrij","slaap","0:00","5:34","slaap"],
    ["vrij","voeding","5:36","6:13","voeding"],
    ["vrij","wakker","6:13","6:27","andere"],
    ["vrij","verversen","6:27","6:49","andere"],
    ["vrij","mama tijd","6:50","6:55","andere"],
    ["vrij","draagzak","6:56","7:06","andere"],
    ["vrij","slaap","7:07","8:26","slaap"]
];

async function importData() {
    for (const row of rawData) {
        const [day, activiteit, start, eind, categorie] = row;

        await addDoc(collection(db, "activities"), {
            dag: dayMap[day],
            activiteit,
            start: formatTime(start),
            eind: formatTime(eind),
            categorie,
            groupId: GROUP_ID,
            createdAt: serverTimestamp()
        });

        console.log("Imported:", activiteit);
    }

    console.log("DONE");
}

importData();