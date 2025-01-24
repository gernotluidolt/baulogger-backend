require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer to save uploaded files to "uploads" folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage: storage });

// Nodemailer transport configuration (using Gmail SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email password or app password
    }
});

// API Endpoint to Send Email
app.post('/send-email', upload.single('pdf'), async (req, res) => {
    try {
        const { recipient, subject, body } = req.body;
        const file = req.file;

        if (!recipient || !subject || !body || !file) {
            return res.status(400).json({ error: 'Missing required fields or file.' });
        }

        const mailOptions = {
            from: '"[no-reply] Baulogger" <bautagesbericht@baulogger.at>',
            to: recipient,
            subject: subject,
            text: body,
            attachments: [
                {
                    filename: file.originalname,
                    path: file.path
                }
            ],
            envelope: {
                from: process.env.EMAIL_USER,
                to: recipient,
            },
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });

        // Cleanup: Delete the file after sending
        fs.unlinkSync(file.path);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
