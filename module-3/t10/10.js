const form = document.getElementById('source');
const targetParagraph = document.getElementById('target');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.querySelector('input[name="firstname"]').value;
    const lastName = document.querySelector('input[name="lastname"]').value;

    targetParagraph.textContent = `Your name is ${firstName} ${lastName}`;
});