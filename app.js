// Cash Compass App
// CSCI-313 Group Project
// Authors: Preston, Zaid, Nathaniel 

const apiUrl = 'http://localhost:3000/api'; // port 3000

// handling registration
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch(`${apiUrl}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.message) {
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html'; // redirects to login
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Failed to register. Please try again later.');
    }
});

// handling the login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId); // storing user ID
            window.location.href = 'dashboard.html'; // redirecting to dashboard
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Failed to login. Please try again later.');
    }
});

// loading incomes on page load
async function loadIncomes() {
    const response = await fetch(`${apiUrl}/income`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // including token
        }
    });
    const incomes = await response.json();
    const totalIncomeElem = document.getElementById('total-income');
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    totalIncomeElem.innerText = `$${totalIncome.toFixed(2)}`;
}

// loading expenses on page load
async function loadExpenses() {
    const response = await fetch(`${apiUrl}/expenses`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const expenses = await response.json();
    const totalExpensesElem = document.getElementById('total-expenses');
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalExpensesElem.innerText = `$${totalExpenses.toFixed(2)}`;
}

// loading budgets on page load
async function loadBudgets() {
    const response = await fetch(`${apiUrl}/budgets`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const budgets = await response.json();
    const budgetListElem = document.getElementById('budget-list');
    budgetListElem.innerHTML = ''; // clearing existing ones
    budgets.forEach(budget => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${budget.category}</td>
            <td>$${budget.allocated.toFixed(2)}</td>
            <td><button class="btn btn-warning" onclick="editBudget('${budget._id}')">Edit</button></td>
            <td><button class="btn btn-danger" onclick="deleteBudget('${budget._id}')">Delete</button></td>
        `;
        budgetListElem.appendChild(row);
    });
}

// function to add income
async function addIncome() {
    const amount = prompt("Enter income amount:");
    if (amount) {
        try {
            await fetch(`${apiUrl}/income`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: parseFloat(amount) }) 
            });
            alert(`Income of $${amount} added!`);
            loadIncomes();
            loadRecentTransactions();
        } catch (error) {
            console.error('Error adding income:', error);
        }
    }
}

// Function to add expense
async function addExpense() {
    const amount = prompt("Enter expense amount:");
    if (amount) {
        try {
            await fetch(`${apiUrl}/expenses`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: parseFloat(amount) }) 
            });
            alert(`Expense of $${amount} added!`);
            loadExpenses();
            loadRecentTransactions();
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    }
}

// function to prompt for budget
async function promptBudget() {
    const category = prompt("Enter budget category:");
    const allocatedAmount = prompt("Enter allocated amount:");
    if (category && allocatedAmount) {
        try {
            await fetch(`${apiUrl}/budgets`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ category, allocated: parseFloat(allocatedAmount) })
            });
            alert(`Budget for ${category} of $${allocatedAmount} added!`);
            loadBudgets();
        } catch (error) {
            console.error('Error adding budget:', error);
        }
    }
}

// function to edit budget
async function editBudget(id) {
    const budget = prompt("Enter new allocated amount:");
    if (budget) {
        try {
            await fetch(`${apiUrl}/budgets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ allocated: parseFloat(budget) })
            });
            alert(`Budget updated!`);
            loadBudgets(); // now reload budgets after editing
        } catch (error) {
            console.error('Error editing budget:', error);
        }
    }
}

// function to delete budget
async function deleteBudget(id) {
    if (confirm("Are you sure you want to delete this budget?")) {
        try {
            await fetch(`${apiUrl}/budgets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            alert(`Budget deleted!`);
            loadBudgets();
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    }
}

// load recent transactions
async function loadRecentTransactions() {
    const responseIncome = await fetch(`${apiUrl}/income`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const incomes = await responseIncome.json();

    const responseExpense = await fetch(`${apiUrl}/expenses`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const expenses = await responseExpense.json();

    const transactions = [...incomes, ...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); // gets the latest 5 transactions

    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';

    transactions.forEach(transaction => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item';
        listItem.innerText = `${transaction.amount}`;
        transactionList.appendChild(listItem);
    });
}

// loads this data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadIncomes();
    loadExpenses();
    loadBudgets();
    loadRecentTransactions();
});