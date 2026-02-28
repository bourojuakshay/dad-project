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

// In-memory database (in production, use a real database)
const users = [];
const complaints = [];
const firs = [];
const cases = [];
const locations = new Map();

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
        const { username, password, role } = req.body;

        // Check if user already exists
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role: role || 'constable'
        };

        users.push(user);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = users.find(u => u.username === username);
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

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
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

        const complaint = {
            id: complaints.length + 1,
            title,
            description,
            date: new Date().toISOString(),
            priority,
            status: 'Pending',
            attachment,
            constableId: req.user.id
        };

        complaints.push(complaint);
        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get complaints
app.get('/api/complaints', authenticateToken, (req, res) => {
    try {
        let userComplaints = complaints;

        // If constable, only show their complaints
        if (req.user.role === 'constable') {
            userComplaints = complaints.filter(c => c.constableId === req.user.id);
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

        const complaintId = parseInt(req.params.id);
        const { status } = req.body;

        const complaint = complaints.find(c => c.id === complaintId);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        complaint.status = status;
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

        const fir = {
            id: firs.length + 1,
            firNumber,
            complainantName,
            incidentDate,
            location,
            description,
            status: 'Registered',
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
        };

        firs.push(fir);
        res.status(201).json(fir);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get FIRs
app.get('/api/firs', authenticateToken, (req, res) => {
    try {
        res.json(firs);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update FIR
app.put('/api/firs/:id', authenticateToken, (req, res) => {
    try {
        const firId = parseInt(req.params.id);
        const updates = req.body;

        const fir = firs.find(f => f.id === firId);
        if (!fir) {
            return res.status(404).json({ error: 'FIR not found' });
        }

        Object.assign(fir, updates);
        res.json(fir);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cases

// Create case update
app.post('/api/cases', authenticateToken, upload.single('document'), (req, res) => {
    try {
        const { firId, remarks } = req.body;
        const document = req.file ? `/uploads/${req.file.filename}` : null;

        const caseUpdate = {
            id: cases.length + 1,
            firId: parseInt(firId),
            remarks,
            document,
            createdBy: req.user.id,
            createdAt: new Date().toISOString()
        };

        cases.push(caseUpdate);
        res.status(201).json(caseUpdate);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get case updates
app.get('/api/cases', authenticateToken, (req, res) => {
    try {
        res.json(cases);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GPS Tracking

// Update location
app.post('/api/location', authenticateToken, (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        locations.set(req.user.id, {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
            username: req.user.username
        });

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

        const locationData = Array.from(locations.entries()).map(([id, data]) => ({
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
        const location = locations.get(req.user.id);
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
