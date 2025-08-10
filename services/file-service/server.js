const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Minimal multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `TEST-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// A single, simple test route
app.post('/upload-test', upload.single('testfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Minimal server: No file uploaded.');
    }
    console.log('Minimal server saved file successfully:', req.file);
    res.status(200).json(req.file);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`--- MINIMAL FILE SERVICE TEST RUNNING ON PORT ${PORT} ---`);
});
