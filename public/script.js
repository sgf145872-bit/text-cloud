// آلة حاسبة
function calculate(operation) {
    const num1 = parseFloat(document.getElementById('num1').value);
    const num2 = parseFloat(document.getElementById('num2').value);
    const resultElement = document.getElementById('result');
    
    if (isNaN(num1) || isNaN(num2)) {
        resultElement.innerHTML = '<span style="color: red;">يرجى إدخال أرقام صحيحة</span>';
        return;
    }
    
    let result;
    let operationText;
    
    switch(operation) {
        case 'add':
            result = num1 + num2;
            operationText = 'الجمع';
            break;
        case 'subtract':
            result = num1 - num2;
            operationText = 'الطرح';
            break;
        case 'multiply':
            result = num1 * num2;
            operationText = 'الضرب';
            break;
        case 'divide':
            if (num2 === 0) {
                resultElement.innerHTML = '<span style="color: red;">لا يمكن القسمة على صفر</span>';
                return;
            }
            result = num1 / num2;
            operationText = 'القسمة';
            break;
    }
    
    resultElement.innerHTML = `
        نتيجة ${operationText}: 
        <span style="color: #667eea; font-size: 1.5rem;">${result}</span>
    `;
}

// قائمة المهام
let todos = JSON.parse(localStorage.getItem('todos')) || [];

function renderTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${todo}</span>
            <button onclick="removeTodo(${index})">حذف</button>
        `;
        todoList.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text) {
        todos.push(text);
        localStorage.setItem('todos', JSON.stringify(todos));
        input.value = '';
        renderTodos();
    }
}

function removeTodo(index) {
    todos.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

// الطقس (مثال على استخدام API)
async function getWeather() {
    const weatherElement = document.getElementById('weather');
    weatherElement.innerHTML = 'جاري تحميل بيانات الطقس...';
    
    try {
        // هذا مثال، يمكنك استخدام أي API للطقس
        const response = await fetch('/api/weather');
        const data = await response.json();
        
        weatherElement.innerHTML = `
            <h3>${data.city}</h3>
            <p>درجة الحرارة: ${data.temperature}°C</p>
            <p>الطقس: ${data.description}</p>
        `;
    } catch (error) {
        weatherElement.innerHTML = `
            <span style="color: red;">خطأ في تحميل بيانات الطقس</span>
            <p>درجة الحرارة: 25°C (مثال)</p>
            <p>الطقس: مشمس (مثال)</p>
        `;
    }
}

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    renderTodos();
    
    // إضافة إمكانية استخدام زر Enter في حقل المهام
    document.getElementById('todoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
});
