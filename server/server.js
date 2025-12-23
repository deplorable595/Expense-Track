import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = process.env.VERCEL ? path.join(os.tmpdir(), 'database.json') : path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Configuration
let mongoCollection = null;
const MONGO_URI = process.env.MONGODB_URI;

// Initial Data Template
const getInitialData = () => ({
    users: {
        'Admin': { password: 'admin1234', email: 'sivuu143@gmail.com' }
    },
    expenses: {
        'Admin': []
    },
    loginLogs: []
});

// Database / File Helpers (Async for DB support)
const ensureDatabase = async () => {
    if (MONGO_URI) {
        // Mongo Mode
        try {
            if (!mongoCollection) {
                const client = new MongoClient(MONGO_URI);
                await client.connect();
                const db = client.db('expense_cluster');
                mongoCollection = db.collection('app_data');
                console.log("✅ Connected to MongoDB");
            }

            const doc = await mongoCollection.findOne({ _id: 'global_store' });
            if (!doc) {
                console.log("Initializing MongoDB with default data...");
                await mongoCollection.insertOne({ _id: 'global_store', ...getInitialData() });
            }
        } catch (e) {
            console.error("❌ MongoDB Connection Error:", e);
        }
    } else {
        // File Mode
        if (!fs.existsSync(DATA_FILE)) {
            try {
                fs.writeFileSync(DATA_FILE, JSON.stringify(getInitialData(), null, 2));
            } catch (e) {
                console.error("Error creating local DB file:", e);
            }
        }
    }
};

const readData = async () => {
    if (mongoCollection) {
        try {
            const doc = await mongoCollection.findOne({ _id: 'global_store' });
            return doc || getInitialData();
        } catch (e) {
            console.error("Mongo Read Error", e);
            return getInitialData();
        }
    } else {
        try {
            if (!fs.existsSync(DATA_FILE)) {
                await ensureDatabase();
            }
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data);
            if (!parsed.loginLogs) parsed.loginLogs = [];
            return parsed;
        } catch (err) {
            return getInitialData();
        }
    }
};

const writeData = async (data) => {
    if (mongoCollection) {
        try {
            // Remove _id from data if present to avoid immutable field error on update
            const { _id, ...cleanData } = data;
            await mongoCollection.updateOne(
                { _id: 'global_store' },
                { $set: cleanData },
                { upsert: true }
            );
        } catch (e) {
            console.error("Mongo Write Error", e);
        }
    } else {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }
};

// Initialize DB Connection
ensureDatabase();

// --- ROUTES (Converted to Async) ---

// 1. Get All Expenses for User
app.get('/api/expenses/:userId', async (req, res) => {
    const { userId } = req.params;
    const data = await readData();
    const userExpenses = data.expenses[userId] || [];
    res.json(userExpenses);
});

// 2. Sync Expenses (Overwrite/Update)
app.post('/api/expenses/:userId', async (req, res) => {
    const { userId } = req.params;
    const newExpenses = req.body;

    const data = await readData();
    data.expenses[userId] = newExpenses;
    await writeData(data);

    res.json({ success: true, count: newExpenses.length });
});

// 3. Register User
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const data = await readData();

    if (data.users[username]) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    data.users[username] = { password, email };
    if (!data.expenses[username]) {
        data.expenses[username] = [];
    }

    await writeData(data);
    res.json({ success: true });
});


// 4. Login User
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const data = await readData();
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
        await writeData(data);
        res.json({ success: true, username });
    } else {
        logEntry.status = 'FAILED';
        data.loginLogs.push(logEntry);
        await writeData(data);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// 5. Add Single Expense
app.post('/api/expenses', async (req, res) => {
    const { userId, expense } = req.body;
    if (!userId || !expense) return res.status(400).json({ error: 'Missing data' });

    const data = await readData();
    if (!data.expenses[userId]) data.expenses[userId] = [];
    data.expenses[userId].push(expense);
    await writeData(data);

    res.json({ success: true });
});

// 6. Delete Single Expense
app.delete('/api/expenses/:userId/:id', async (req, res) => {
    const { userId, id } = req.params;
    const data = await readData();

    if (data.expenses[userId]) {
        data.expenses[userId] = data.expenses[userId].filter(e => e.id !== id);
        await writeData(data);
    }

    res.json({ success: true });
});

// 7. Batch Add Expenses
app.post('/api/expenses/batch', async (req, res) => {
    const { userId, expenses } = req.body;
    if (!userId || !Array.isArray(expenses)) return res.status(400).json({ error: 'Invalid data' });

    const data = await readData();
    if (!data.expenses[userId]) data.expenses[userId] = [];
    data.expenses[userId].push(...expenses);

    await writeData(data);
    res.json({ success: true, count: expenses.length });
});

// 7. Admin: Get All Users
app.get('/api/admin/users', async (req, res) => {
    const data = await readData();
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
app.get('/api/admin/logs', async (req, res) => {
    const data = await readData();
    res.json(data.loginLogs ? data.loginLogs.reverse() : []);
});

// 9. Admin: Delete User
app.delete('/api/admin/users/:username', async (req, res) => {
    const { username } = req.params;
    const data = await readData();

    if (username === 'Admin') {
        return res.status(403).json({ error: 'Cannot delete the main Admin account' });
    }

    if (data.users[username]) {
        delete data.users[username];
        delete data.expenses[username];
        await writeData(data);
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
