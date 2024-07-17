const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('querystring');
const mysql = require('mysql');

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // replace with your MySQL username
    password: '', // replace with your MySQL password
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to MySQL database.');

    // Create the database if it doesn't exist
    db.query('CREATE DATABASE IF NOT EXISTS mywebsite', (err) => {
        if (err) {
            throw err;
        }
        console.log('Database mywebsite created or already exists.');

        // Use the database
        db.query('USE mywebsite', (err) => {
            if (err) {
                throw err;
            }
            console.log('Using mywebsite database.');

            // Create the contacts table if it doesn't exist
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            db.query(createTableQuery, (err) => {
                if (err) {
                    throw err;
                }
                console.log('Table contacts created or already exists.');
            });
        });
    });
});

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './public/index.html';
    } else if (filePath === './services') {
        filePath = './public/services.html';
    } else if (filePath === './about') {
        filePath = './public/about.html';
    } else if (filePath === './contact') {
        filePath = './public/contact.html';
    } else {
        filePath = './public' + req.url;
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'application/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.on('request', (req, res) => {
    if (req.method === 'POST' && req.url === '/contact') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const parsedBody = parse(body);
            const name = parsedBody.name.trim();
            const email = parsedBody.email.trim();
            const message = parsedBody.message.trim();

            let errors = [];
            if (name === '') errors.push('Name is required.');
            if (email === '' || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email is required.');
            if (message === '') errors.push('Message is required.');

            if (errors.length > 0) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end('<h1>Form submission failed</h1><ul><li>' + errors.join('</li><li>') + '</li></ul>');
            } else {
                // Insert form data into the database
                const query = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
                db.query(query, [name, email, message], (err, result) => {
                    if (err) {
                        console.error('Failed to insert data:', err);
                        if (!res.headersSent) {
                            res.writeHead(500, { 'Content-Type': 'text/html' });
                            res.end('<h1>Server Error</h1><p>Failed to save data.</p>');
                        }
                        return;
                    }
                    if (!res.headersSent) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Form submitted successfully</h1>');
                    }
                });
            }
        });
    }
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
