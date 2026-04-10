const elem1 = document.createElement("li");
elem1.textContent = "First item";

const elem2 = document.createElement("li");
elem2.textContent = "Second item";

const elem3 = document.createElement("li");
elem3.textContent = "Third item";

const target = document.getElementById("target");
target.appendChild(elem1);
target.appendChild(elem2);
target.appendChild(elem3);