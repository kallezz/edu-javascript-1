const num1Input = document.getElementById('num1');
const num2Input = document.getElementById('num2');
const operationSelect = document.getElementById('operation');
const calculateBtn = document.getElementById('start');
const resultParagraph = document.getElementById('result');

calculateBtn.addEventListener('click', () => {
    const num1 = Number(num1Input.value);
    const num2 = Number(num2Input.value);
    const operation = operationSelect.value;

    let result;

    if (operation === 'add') {
        result = num1 + num2;
    } else if (operation === 'sub') {
        result = num1 - num2;
    } else if (operation === 'multi') {
        result = num1 * num2;
    } else if (operation === 'div') {
        result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero';
    }

    resultParagraph.textContent = `Result: ${result}`;
});