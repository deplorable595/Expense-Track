import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = process.env.VERCEL ? path.join(os.tmpdir(), 'database.json') : path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize or Update Data File with Admin Credentials
const ensureDatabase = () => {
    let data = { users: {}, expenses: {}, loginLogs: [] };

    if (fs.existsSync(DATA_FILE)) {
        try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            data = JSON.parse(fileContent);
            if (!data.users) data.users = {};
            if (!data.expenses) data.expenses = {};
            if (!data.loginLogs) data.loginLogs = [];
        } catch (e) {
            console.error("Error reading database, resetting...", e);
        }
    }

    // Enforce Admin Credentials
    data.users['Admin'] = {
        password: 'admin1234',
        email: 'sivuu143@gmail.com'
    };

    // Ensure Admin has an expense array
    if (!data.expenses['Admin']) {
        data.expenses['Admin'] = [];
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

ensureDatabase();

// Helpers
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        // Ensure loginLogs exists for legacy data
        if (!parsed.loginLogs) parsed.loginLogs = [];
        return parsed;
    } catch (err) {
        return { users: {}, expenses: {}, loginLogs: [] };
    }
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// 1. Get All Expenses for User
app.get('/api/expenses/:userId', (req, res) => {
    const { userId } = req.params;
    const data = readData();
    const userExpenses = data.expenses[userId] || [];
    res.json(userExpenses);
});

// 2. Sync Expenses (Overwrite/Update)
app.post('/api/expenses/:userId', (req, res) => {
    const { userId } = req.params;
    const newExpenses = req.body;

    const data = readData();
    data.expenses[userId] = newExpenses;
    writeData(data);

    res.json({ success: true, count: newExpenses.length });
});

// 3. Register User
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    const data = readData();

    if (data.users[username]) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    data.users[username] = { password, email };
    // Initialize empty expenses
    if (!data.expenses[username]) {
        data.expenses[username] = [];
    }

    writeData(data);
    res.json({ success: true });
});


// 4. Login User
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = readData();
    const user = data.users[username];

    const logEntry = {
        timestamp: new Date().toISOString(),
        username,
        ip: req.ip,
        status: 'PENDING'
    };

    if (user && user.password === password) {
        logEntry.status = 'SUCCESS';
        data.loginLogs.push(logEntry);
        writeData(data);
        res.json({ success: true, username });
    } else {
        logEntry.status = 'FAILED';
        data.loginLogs.push(logEntry);
        writeData(data);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// 5. Add Single Expense
app.post('/api/expenses', (req, res) => {
    const { userId, expense } = req.body;
    if (!userId || !expense) return res.status(400).json({ error: 'Missing data' });

    const data = readData();
    if (!data.expenses[userId]) data.expenses[userId] = [];
    data.expenses[userId].push(expense);
    writeData(data);

    res.json({ success: true });
});

// 6. Delete Single Expense
app.delete('/api/expenses/:userId/:id', (req, res) => {
    const { userId, id } = req.params;
    const data = readData();

    if (data.expenses[userId]) {
        data.expenses[userId] = data.expenses[userId].filter(e => e.id !== id);
        writeData(data);
    }

    res.json({ success: true });
});

// 7. Batch Add Expenses (For Imports)
app.post('/api/expenses/batch', (req, res) => {
    const { userId, expenses } = req.body;
    if (!userId || !Array.isArray(expenses)) return res.status(400).json({ error: 'Invalid data' });

    const data = readData();
    if (!data.expenses[userId]) data.expenses[userId] = [];

    // Append new expenses
    data.expenses[userId].push(...expenses);

    writeData(data);
    res.json({ success: true, count: expenses.length });
});

// 7. Admin: Get All Users
app.get('/api/admin/users', (req, res) => {
    const data = readData();
    const userList = Object.entries(data.users).map(([username, info]) => {
        const userExpenses = data.expenses[username] || [];
        const totalVolume = userExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        return {
            username,
            email: info.email,
            password: info.password,
            totalVolume,
            totalEntries: userExpenses.length
        };
    });
    res.json(userList);
});

// 8. Admin: Get Login Logs
app.get('/api/admin/logs', (req, res) => {
    const data = readData();
    // Return logs reversed (newest first)
    res.json(data.loginLogs ? data.loginLogs.reverse() : []);
});

// 9. Admin: Delete User
app.delete('/api/admin/users/:username', (req, res) => {
    const { username } = req.params;
    const data = readData();

    if (username === 'Admin') {
        return res.status(403).json({ error: 'Cannot delete the main Admin account' });
    }

    if (data.users[username]) {
        delete data.users[username];
        delete data.expenses[username]; // Clean up their data

        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Get Local IP
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        const ip = getLocalIp();
        console.log(`\n==================================================`);
        console.log(`SERVER RUNNING at: http://${ip}:${PORT}`);
        console.log(`- API Endpoint: http://${ip}:${PORT}/api`);
        console.log(`==================================================\n`);
    });
}

export default app;
