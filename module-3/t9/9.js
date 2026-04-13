const calculationInput = document.getElementById('calculation');
const calculateBtn = document.getElementById('start');
const resultParagraph = document.getElementById('result');

calculateBtn.addEventListener('click', () => {
    const input = calculationInput.value;
    let result;

    if (input.includes('+')) {
        const [num1, num2] = input.split('+').map(Number);
        result = num1 + num2;
    } else if (input.includes('-')) {
        const [num1, num2] = input.split('-').map(Number);
        result = num1 - num2;
    } else if (input.includes('*')) {
        const [num1, num2] = input.split('*').map(Number);
        result = num1 * num2;
    } else if (input.includes('/')) {
        const [num1, num2] = input.split('/').map(Number);
        result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero';
    } else {
        result = 'Invalid calculation';
    }

    resultParagraph.textContent = `Result: ${result}`;
});