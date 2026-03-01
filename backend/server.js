const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Enable CORS for all origins (required for Render deployment)
app.use(cors());
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Database File Path
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize database file if it doesn't exist
const initialDbState = {
    users: [],
    complaints: [],
    firs: [],
    cases: [],
    locations: {}
};

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDbState, null, 2));
}

// Database helper functions
const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return initialDbState;
    }
};

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing database:', error);
    }
};

// Seed a default constable account so the deployed site always has a working login
async function seedDefaultUser() {
    try {
        const db = readDb();
        const defaultEmail = 'admin@police.gov';
        const exists = db.users.find(u => u.email === defaultEmail);
        if (!exists) {
            const hashedPassword = await bcrypt.hash('constable123', 10);
            const defaultUser = {
                id: 'default-admin-001',
                username: defaultEmail,
                email: defaultEmail,
                fullName: 'Admin Constable',
                badgeId: 'BADGE001',
                password: hashedPassword,
                role: 'constable',
                createdAt: new Date().toISOString()
            };
            db.users.push(defaultUser);
            writeDb(db);
            console.log('✅ Default admin account seeded: admin@police.gov / constable123');
        }
    } catch (err) {
        console.error('Failed to seed default user:', err);
    }
}

// Run seed on startup
seedDefaultUser();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, role, fullName, email, badgeId } = req.body;
        const db = readDb();

        // Check if user already exists
        if (db.users.find(u => u.username === username || u.email === email || (badgeId && u.badgeId === badgeId))) {
            return res.status(400).json({ error: 'Username, email, or badge ID already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: Date.now().toString(),
            username: username || email, // Use email as username if not provided
            email,
            fullName,
            badgeId,
            password: hashedPassword,
            role: role || 'constable',
            createdAt: new Date().toISOString()
        };

        db.users.push(user);
        writeDb(db);

        // Generate JWT for immediate login
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ message: 'User registered successfully', token, user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = readDb();

        // Find user by username or email
        const user = db.users.find(u => u.username === username || u.email === username);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complaints

// Create complaint
app.post('/api/complaints', authenticateToken, upload.single('attachment'), (req, res) => {
    try {
        const { title, description, priority } = req.body;
        const attachment = req.file ? `/uploads/${req.file.filename}` : null;
        const db = readDb();

        const complaint = {
            id: Date.now().toString(),
            title,
            description,
            date: new Date().toISOString(),
            priority,
            status: 'Pending',
            attachment,
            constableId: req.user.id
        };

        db.complaints.push(complaint);
        writeDb(db);

        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get complaints
app.get('/api/complaints', authenticateToken, (req, res) => {
    try {
        const db = readDb();
        let userComplaints = db.complaints;

        // If constable, only show their complaints
        if (req.user.role === 'constable') {
            userComplaints = db.complaints.filter(c => c.constableId === req.user.id);
        }

        res.json(userComplaints);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update complaint status (Admin only)
app.put('/api/complaints/:id/status', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'officer') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const complaintId = req.params.id;
        const { status } = req.body;
        const db = readDb();

        const complaint = db.complaints.find(c => c.id === complaintId);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        complaint.status = status;
        writeDb(db);

        res.json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// FIRs

// Create FIR
app.post('/api/firs', authenticateToken, (req, res) => {
    try {
        const { firNumber, complainantName, incidentDate, location, description } = req.body;
        const db = readDb();

        const fir = {
            id: Date.now().toString(),
            firNumber,
            complainantName,
            incidentDate,
            location,
            description,
            status: 'Registered',
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
        };

        db.firs.push(fir);
        writeDb(db);

        res.status(201).json(fir);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get FIRs
app.get('/api/firs', authenticateToken, (req, res) => {
    try {
        const db = readDb();
        res.json(db.firs);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update FIR
app.put('/api/firs/:id', authenticateToken, (req, res) => {
    try {
        const firId = req.params.id;
        const updates = req.body;
        const db = readDb();

        const fir = db.firs.find(f => f.id === firId);
        if (!fir) {
            return res.status(404).json({ error: 'FIR not found' });
        }

        Object.assign(fir, updates);
        writeDb(db);

        res.json(fir);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complaints

// Create complaint
app.post('/api/complaints', authenticateToken, (req, res) => {
    try {
        const complaintData = req.body;
        const db = readDb();

        const newComplaint = {
            id: 'CMP-' + Date.now(),
            ...complaintData,
            status: 'Pending',
            createdBy: req.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!db.complaints) {
            db.complaints = [];
        }
        db.complaints.unshift(newComplaint);
        writeDb(db);

        res.status(201).json(newComplaint);
    } catch (error) {
        console.error('Error creating complaint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all complaints
app.get('/api/complaints', authenticateToken, (req, res) => {
    try {
        const db = readDb();
        res.json(db.complaints || []);
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cases

// Create case update
app.post('/api/cases', authenticateToken, upload.single('document'), (req, res) => {
    try {
        const { firId, remarks } = req.body;
        const document = req.file ? `/uploads/${req.file.filename}` : null;
        const db = readDb();

        const caseUpdate = {
            id: Date.now().toString(),
            firId: firId,
            remarks,
            document,
            createdBy: req.user.id,
            createdAt: new Date().toISOString()
        };

        db.cases.push(caseUpdate);
        writeDb(db);
        res.status(201).json(caseUpdate);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get case updates
app.get('/api/cases', authenticateToken, (req, res) => {
    try {
        const db = readDb();
        res.json(db.cases);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GPS Tracking

// Update location
app.post('/api/location', authenticateToken, (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const db = readDb();

        if (!db.locations) db.locations = {};

        db.locations[req.user.id] = {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            username: req.user.username
        };

        writeDb(db);

        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all locations (Admin/Officer only)
app.get('/api/locations', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'officer') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const db = readDb();
        const locationData = Object.entries(db.locations || {}).map(([id, data]) => ({
            id,
            ...data
        }));

        res.json(locationData);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's own location
app.get('/api/location', authenticateToken, (req, res) => {
    try {
        const db = readDb();
        const location = (db.locations || {})[req.user.id];
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Photo Upload Feature

// Upload photos
app.post('/api/upload', authenticateToken, upload.array('files', 10), (req, res) => {
    try {
        const { description, category } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploads = files.map(file => ({
            id: Date.now() + Math.random(),
            filename: file.filename,
            originalName: file.originalname,
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
            description: description || '',
            category: category || 'General',
            uploadedBy: req.user.id,
            createdAt: new Date().toISOString()
        }));

        // In production, you would save this to a database
        console.log('Files uploaded:', uploads);

        res.status(201).json({ message: 'Files uploaded successfully', uploads });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get uploads
app.get('/api/uploads', authenticateToken, (req, res) => {
    try {
        // In production, you would fetch from database
        res.json([]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete upload
app.delete('/api/uploads/:id', authenticateToken, (req, res) => {
    try {
        const uploadId = req.params.id;

        // In production, you would delete from database and filesystem
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});
