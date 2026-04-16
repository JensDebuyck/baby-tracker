const form = document.getElementById("activity-form");
const lijst=document.getElementById("lijst");

let data = JSON.parse(localStorage.getItem("babyData")) || [];

render();

form.addEventListener("submit", function(e){
    e.preventDefault();

    const entry = {
        dag: document.getElementById("dag").value,
        activiteit: document.getElementById("activiteit").value,
        start:document.getElementById("start").value,
        eind:document.getElementById("eind").value,
        categorie:document.getElementById("categorie").value,
    };

    data.push(entry);

    localStorage.setItem("babyData", JSON.stringify(data));
    render();
    form.reset();
});

function render(){
    lijst.innerHTML = '';

    data.forEach(item =>{
        const li = document.createElement("li");
        li.textContent = `${item.dag} - ${item.activiteit}  (${item.start} - ${item.eind})`;
        lijst.append(li);
    })
}