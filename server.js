// Cash Compass App
// CSCI-313 Group Project
// Authors: Preston, Zaid, Nathaniel 

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // port 3000

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve files from the root directory
app.use(express.static('public')); // Serve files from the public directory

// our MongoDB connection
mongoose.connect('mongodb://localhost:27017/cash_compass');

// serving the root route
app.get('/', (req, res) => {
    res.redirect('/index.html'); // Redirect to login page
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// defining schemas
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String
});

const incomeSchema = new mongoose.Schema({
    amount: Number,
    category: String,
    date: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // associated with User
});

const expenseSchema = new mongoose.Schema({
    amount: Number,
    category: String,
    date: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const budgetSchema = new mongoose.Schema({
    category: String,
    allocated: Number,
    spent: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// models
const User = mongoose.model('User', userSchema);
const Income = mongoose.model('Income', incomeSchema);
const Expense = mongoose.model('Expense', expenseSchema);
const Budget = mongoose.model('Budget', budgetSchema);

// additional middleware for to authenticating token and then get user ID
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.userId = user.id; // attaches user ID to request
        next();
    });
};

// signup route
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).send({ message: 'User created' });
});

// login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret'); // using an environmental variable
    res.send({ token, userId: user._id }); // sending user Id back for client storage
});

// income routes
app.post('/api/income', authenticateToken, async (req, res) => {
    const income = new Income({ ...req.body, userId: req.userId });
    await income.save();
    res.status(201).send(income);
});

app.get('/api/income', authenticateToken, async (req, res) => {
    const incomes = await Income.find({ userId: req.userId });
    res.send(incomes);
});

// expense routes
app.post('/api/expenses', authenticateToken, async (req, res) => {
    const expense = new Expense({ ...req.body, userId: req.userId });
    await expense.save();
    res.status(201).send(expense);
});

app.get('/api/expenses', authenticateToken, async (req, res) => {
    const expenses = await Expense.find({ userId: req.userId });
    res.send(expenses);
});

// budget routes
app.post('/api/budgets', authenticateToken, async (req, res) => {
    const budget = new Budget({ ...req.body, userId: req.userId });
    await budget.save();
    res.status(201).send(budget);
});

app.get('/api/budgets', authenticateToken, async (req, res) => {
    const budgets = await Budget.find({ userId: req.userId });
    res.send(budgets);
});

// update budget route
app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
    const { allocated } = req.body;
    const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { allocated },
        { new: true } 
    );
    res.send(budget);
});

// delete budget route
app.delete('/api/budgets/:id', authenticateToken, async (req, res) => {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId }); // making sure the budget belongs to the user
    res.sendStatus(204); 
});

// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});