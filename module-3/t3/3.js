'use strict';
const names = ['John', 'Paul', 'Jones'];
let html = '';

for (let i = 0; i < names.length; i++) {
    html += `<li>${names[i]}</li>`;
}

document.getElementById("target").innerHTML = html;