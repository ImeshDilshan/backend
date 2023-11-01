// bookingRoute.js

const express = require('express');
const cors = require('cors');
const { capturedPacketsDB } = require('../db');
const { detectedVulnerabilitiesDB } = require('../db');
const{ newWal} = require('../db');
// const router = express.Router();
const { createCanvas } = require('canvas');
const Chart = require('chart.js/auto');
const D3Node = require('d3-node');
const fs = require('fs');
const path = require('path');
// const d3 = require('d3');
  // import express from 'express';
// import D3Node from 'd3-node';
// import * as d3 from 'd3';

const router = express.Router();
const app = express();
const nodemailer = require('nodemailer');
app.use(cors());


function categorizeVulnerabilities(vulnerabilities) {
    const categories = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Informational: 0,
    };

    vulnerabilities.forEach((vulnerability) => {
        if (vulnerability.length >= 3000) {
            categories.Critical++;
        } else if (vulnerability.length >= 2000) {
            categories.High++;
        } else if (vulnerability.length >= 1000) {
            categories.Medium++;
        } else if (vulnerability.length >= 500) {
            categories.Low++;
        } else {
            categories.Informational++;
        }
    });

    return Object.values(categories);
}




router.get('/vulnerabilities-chart', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");


    // CREATE TABLE validation_severity (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     protocol TEXT,
    //     source TEXT,
    //     destination TEXT,
    //     length INTEGER,
    //     vulnerability_info TEXT,
    //     severity TEXT
    // )
    // Fetch data from the vulnerabilities table
    const selectQuery = "SELECT Length FROM validation_severity";

    detectedVulnerabilitiesDB.all(selectQuery, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

      
        const vulnerabilityCategories = categorizeVulnerabilities(rows);

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Create a 3D-like doughnut chart using Chart.js
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
                datasets: [{
                    data: vulnerabilityCategories,
                    backgroundColor: ['red', 'orange', 'yellow', 'gray', 'lightgray'],
                }],
            },
            options: {
                cutout: '70%', // Adjust the cutout percentage for a donut effect
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                    },
                },
                elements: {
                    arc: {
                        borderWidth: 4, // Add a border to the doughnut segments
                    },
                },
            },
        });

        // Save the chart as an image file
        const imageFileName = 'vulnerabilities-chart.png';
        const directoryPath = '/home/ubuntu';
        // Specify the directory path
        const imagePath = path.join(directoryPath, imageFileName);

        const imageStream = fs.createWriteStream(imagePath);
        const chartImage = canvas.createPNGStream();
        chartImage.pipe(imageStream);

        imageStream.on('finish', () => {
            // Send the saved image file as a response
            res.status(200).sendFile(imagePath, () => {
                // Clean up: Delete the saved image file
                fs.unlinkSync(imagePath);
            });
        });
    });
});


router.get('/data',async(req,res)=>{
    req.header("Access-Control-Allow-Origin", "*");
    
    const page = req.query.page || 1; // Default to page 1 if not specified
    const perPage = 20; // Number of records per page
    const offset = (page - 1) * perPage;
    const selectQuery = "SELECT * FROM vulnerabilities LIMIT ? OFFSET ?";

    newWal.all(selectQuery, [perPage, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
})





router.get('/pie-chart/:id', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");



    // CREATE TABLE validation_severity (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     protocol TEXT,
    //     source TEXT,
    //     destination TEXT,
    //     length INTEGER,
    //     vulnerability_info TEXT,
    //     severity TEXT
    // )
    // Fetch data from the vulnerabilities table

    const id = req.params.id;

    // Modify the SQL query to retrieve data based on the provided ID
    const selectQuery = "SELECT protocol, COUNT(*) AS count,  Length FROM validation_severity  WHERE id = ? GROUP BY protocol,  Length";

    detectedVulnerabilitiesDB.all(selectQuery, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Define color mapping based on vulnerability severity
        const colorMap = {
            "Critical": "red",
            "High": "orange",
            "Medium": "yellow",
            "Low": "gray",
            "Informational": "lightgray"
        };

        // Prepare the data for the pie chart
        const data = rows.map(row => ({
            label: row.protocol,
            value: row.count,
            severity: row.length >= 2000 ? "Critical" :
                row.length >= 1500? "High" :
                row.length >= 1000 ? "Medium" :
                row.length >= 500? "Low" : "Informational"
        }));

        // Create a D3Node instance to render the pie chart
        const width = 800;
        const height = 400;
        const d3n = new D3Node();

        // Create the pie chart using D3.js
        const svg = d3n.createSVG(width, height);

        const radius = Math.min(width, height) / 2;
        const pie = d3n.d3.pie().value(d => d.value);
        const arc = d3n.d3.arc().outerRadius(radius).innerRadius(radius / 2);

        // Use a color scale to assign colors based on severity
        const colorScale = d3n.d3.scaleOrdinal()
            .domain(Object.keys(colorMap))
            .range(Object.values(colorMap));

        const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

        const arcs = g.selectAll('arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.severity)); // Use severity to determine the fill color

        // Convert the SVG to a string
        const svgString = d3n.svgString();

        // Send the SVG as a response
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
    });
});




// Create a new booking
// Modify your route to accept query parameters for pagination
router.get('/', (req, res) => {
    req.header("Access-Control-Allow-Origin", "*");
    
    // Extract query parameters for pagination
    const page = req.query.page || 1; // Default to page 1 if not specified
    const perPage = 20; // Number of records per page

    // Calculate the offset based on the page number
    const offset = (page - 1) * perPage;

    // Modify your SQL query to include pagination
    const selectQuery = "SELECT * FROM packets LIMIT ? OFFSET ?";

    capturedPacketsDB.all(selectQuery, [perPage, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});


// Create a new captured packet
router.post('/', (req, res) => {
   
    const { protocol, source, destination, length } = req.body;
    const insertQuery = "INSERT INTO packets (protocol, source, destination, length) VALUES (?, ?, ?, ?)";

     capturedPacketsDB.run(insertQuery, [protocol, source, destination, length], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});





router.get('/pie/:id', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    const id = req.params.id;

    // Modify the SQL query to retrieve data based on the provided ID
    const selectQuery = "SELECT protocol, COUNT(*) AS count, protocol   FROM vulnerabilities WHERE id = ? GROUP BY id, protocol";

    newWal.all(selectQuery, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Define color mapping based on vulnerability severity
        const colorMap = {
            "Critical": "red",
            "High": "orange",
            "Medium": "yellow",
            "Low": "gray",
            "Informational": "lightgray"
        };

        // Prepare the data for the pie chart
        const data = rows.map(row => ({
            label: row.protocol,
            value: row.count,
            severity: row.protocol == 'DATA'? "Critical" :
                row.vulnerability_info >= 7.0 ? "High" :
                row.vulnerability_info >= 4.0 ? "Medium" :
                row.vulnerability_info >= 0.1 ? "Low" : "Informational"
        }));

        // Create a D3Node instance to render the pie chart
        const width = 800;
        const height = 400;
        const d3n = new D3Node();

        // Create the pie chart using D3.js
        const svg = d3n.createSVG(width, height);

        const radius = Math.min(width, height) / 2;
        const pie = d3n.d3.pie().value(d => d.value);
        const arc = d3n.d3.arc().outerRadius(radius).innerRadius(radius / 2);

        // Use a color scale to assign colors based on severity
        const colorScale = d3n.d3.scaleOrdinal()
            .domain(Object.keys(colorMap))
            .range(Object.values(colorMap));

        const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

        const arcs = g.selectAll('arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data.severity)); // Use severity to determine the fill color

        // Convert the SVG to a string
        const svgString = d3n.svgString();

        // Send the SVG as a response
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
    });
});


// Create a new booking
// Modify your route to accept query parameters for pagination
router.get('/', (req, res) => {
    req.header("Access-Control-Allow-Origin", "*");
    
    // Extract query parameters for pagination
    const page = req.query.page || 1; // Default to page 1 if not specified
    const perPage = 20; // Number of records per page

    // Calculate the offset based on the page number
    const offset = (page - 1) * perPage;

    // Modify your SQL query to include pagination
    const selectQuery = "SELECT * FROM packets LIMIT ? OFFSET ?";

    capturedPacketsDB.all(selectQuery, [perPage, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});


// Create a new captured packet
router.post('/', (req, res) => {
   
    const { protocol, source, destination, length } = req.body;
    const insertQuery = "INSERT INTO packets (protocol, source, destination, length) VALUES (?, ?, ?, ?)";

     capturedPacketsDB.run(insertQuery, [protocol, source, destination, length], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});


// ...

// ...

// ...

// Like a packet
router.post('/like/:packetId', (req, res) => {
    const packetId = req.params.packetId;

    // Insert a new record into the likes_dislikes table to indicate a like
    const insertQuery = "INSERT INTO likes_dislikes (packet_id, like, dislike) VALUES (?, 1, 0)";

    capturedPacketsDB.run(insertQuery, [packetId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Packet liked successfully' });
    });
});

// Dislike a packet
router.post('/dislike/:packetId', (req, res) => {
    const packetId = req.params.packetId;

    // Insert a new record into the likes_dislikes table to indicate a dislike
    const insertQuery = "INSERT INTO likes_dislikes (packet_id, like, dislike) VALUES (?, 0, 1)";

    capturedPacketsDB.run(insertQuery, [packetId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Packet disliked successfully' });
    });
});


// Get the number of likes for a packet
router.post('/like/:clientIp', (req, res) => {
    const clientIp = req.params.clientIp;

    // Insert the client's IP and like information into the likes_dislikes table
    const insertQuery = "INSERT INTO likes_dislikes (client_ip, like, dislike) VALUES (?, 1, 0)";
    capturedPacketsDB.run(insertQuery, [clientIp], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).send("Liked packet successfully.");
    });
});

router.post('/dislike/:clientIp', (req, res) => {
    const clientIp = req.params.clientIp;

    // Insert the client's IP and dislike information into the likes_dislikes table
    const insertQuery = "INSERT INTO likes_dislikes (client_ip, like, dislike) VALUES (?, 0, 1)";
    capturedPacketsDB.run(insertQuery, [clientIp], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).send("Disliked packet successfully.");
    });
});



























router.get('/graph/:id', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const id = req.params.id;
    const width = 800;
    const height = 400;
    const boxHeight = 60; // Height of the information box

    const d3n = new D3Node();

    const svg = d3n.createSVG(width, height + boxHeight); // Adjusting height for the box

    // Fetch data from the captured_packets table based on the provided ID
    const selectQuery = "SELECT protocol, source, destination FROM packets WHERE id = ?";

      capturedPacketsDB.get(selectQuery, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "Data not found for the provided ID" });
        }

        // Create a box for displaying information
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', boxHeight)
            .attr('fill', '#f0f0f0');

        // Display protocol, source, and destination values in the box
        svg.append('text')
            .attr('x', 350)
            .attr('y', 20)
            .attr('font-size', '16px')
            .text(`Protocol: ${row.protocol} `);

        // Create a diagonal line connecting source and destination
        const lineData = [
            { x: 150, y: boxHeight }, // Source
            { x: 650, y: height + boxHeight }  // Destination
        ];

        const line = d3n.d3.line()
            .x(d => d.x)
            .y(d => d.y);

        svg.append('path')
            .datum(lineData)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Display IP addresses at the end of the nodes
        svg.selectAll('.node-label')
            .data([{ value: row.source }, { value: row.destination }])
            .enter().append('text')
            .attr('class', 'node-label')
            .attr('x', (d, i) => lineData[i].x)
            .attr('y', (d, i) => lineData[i].y)
            .attr('dy', -10) // Adjust the distance above the node
            .attr('text-anchor', (d, i) => i === 0 ? 'end' : 'start')
            .text(d => d.value);

        const svgString = d3n.svgString();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
    });
});


router.get('/pie-chart', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    
   // CREATE TABLE validation_severity (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     protocol TEXT,
    //     source TEXT,
    //     destination TEXT,
    //     length INTEGER,
    //     vulnerability_info TEXT,
    //     severity TEXT
    // )
    // Fetch data from the vulnerabilities table


    
    // Query the 'vulnerabilities' table to retrieve the data you need
    const selectQuery = "SELECT protocol, COUNT(*) AS count FROM validation_severity GROUP BY protocol";

    detectedVulnerabilitiesDB.all(selectQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Prepare the data for the pie chart
        const data = rows.map(row => ({
            label: row.protocol,
            value: row.count
        }));

        // Create a D3Node instance to render the pie chart
        const width = 800;
        const height = 400;
        const d3n = new D3Node();

        // Create the pie chart using D3.js
        const svg = d3n.createSVG(width, height);

        const radius = Math.min(width, height) / 2;
        const pie = d3n.d3.pie().value(d => d.value);
        const arc = d3n.d3.arc().outerRadius(radius).innerRadius(radius / 2);

        const color = d3n.d3.scaleOrdinal().domain(data.map(d => d.label)).range(d3n.d3.schemeCategory10);

        const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

        const arcs = g.selectAll('arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.label));

        // Convert the SVG to a string
        const svgString = d3n.svgString();

        // Send the SVG as a response
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
    });
});








// ...


// ...


// ...


// ...

// GET a specific vulnerability by ID
router.get('/vulnerabilities/:id', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    const id = req.params.id;

     // CREATE TABLE validation_severity (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     protocol TEXT,
    //     source TEXT,
    //     destination TEXT,
    //     length INTEGER,
    //     vulnerability_info TEXT,
    //     severity TEXT
    // )
    // Fetch data from the vulnerabilities table



        // CREATE TABLE validation_severity (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     protocol TEXT,
    //     source TEXT,
    //     destination TEXT,
    //     length INTEGER,
    //     vulnerability_info TEXT,
    //     severity TEXT
    // )
    // Fetch data from the vulnerabilities table


    // Modify the SQL query to retrieve a specific vulnerability by ID
    const selectQuery = "SELECT * FROM validation_severity WHERE id = ?";

    detectedVulnerabilitiesDB.get(selectQuery, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) {
            return res.status(404).json({ error: "Vulnerability not found for the provided ID" });
        }

        res.status(200).json(row);
    });
});

// GET all vulnerabilities
// GET all vulnerabilities with pagination
// GET all vulnerabilities with pagination
router.get('/vulnerabilities', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    // Extract query parameters for pagination
    const page = req.query.page || 1; // Default to page 1 if not specified
    const perPage = 20; // Number of records per page

    // Calculate the offset based on the page number
    const offset = (page - 1) * perPage;

        // CREATE TABLE validation_severity (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     protocol TEXT,
    //     source TEXT,
    //     destination TEXT,
    //     length INTEGER,
    //     vulnerability_info TEXT,
    //     severity TEXT
    // )
    // Fetch data from the vulnerabilities table


    // Modify the SQL query to include pagination
    const selectQuery = "SELECT * FROM validation_severity LIMIT ? OFFSET ?";

    detectedVulnerabilitiesDB.all(selectQuery, [perPage, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(rows);
    });
});

router.post('/send-email', (req, res) => {
    const { email, pdfDataUri } = req.body;
  
    // Set up a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user:'imeshrajakaruna04@gmail.com',
         // Replace with your Gmail email
        pass: 'dgasromelmsxtsrh', // Replace with your Gmail password
      },
    });

    const mailOptions = {
        from: 'dilshanimesh09@gmail.com', // Replace with your Gmail email
        to: email,
        subject: 'Security Incidents PDF Report',
        text: 'Please find the PDF report attached.',
        attachments: [
          {
            filename: 'security_incidents.pdf',
            content: pdfDataUri.split(';base64,').pop(),
            encoding: 'base64',
          },
        ],
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Failed to send email' });
        }
        console.log('Email sent:', info.response);
        return res.status(200).json({ message: 'Email sent successfully' });
      });
    });



// ...



router.get('/graphi', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const width = 800;
    const height = 400;
    const boxHeight = 60; // Height of the information box

    const d3n = new D3Node();

    const svg = d3n.createSVG(width, height + boxHeight); // Adjusting height for the box

    // Fetch data from the captured_packets table
    const selectQuery = "SELECT id, length FROM packets"; // Assuming you have a table named captured_packets with 'id' and 'length' columns

    capturedPacketsDB.all(selectQuery, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "No data found in the captured_packets table" });
        }

        // Create an array to store data points for the line graph
        const dataPoints = rows.map(row => ({ id: row.id, length: row.length }));

        // Create a box for displaying information
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', boxHeight)
            .attr('fill', '#f0f0f0');

        // Create a scale for the X-axis (ID) and reverse the Y-axis (Length)
        const xScale = d3n.d3.scaleLinear()
            .domain([0, dataPoints.length - 1])
            .range([0, width]);

        const yScale = d3n.d3.scaleLinear()
            .domain([0, d3n.d3.max(dataPoints, d => d.length)])
            .range([height + boxHeight, boxHeight]); // Reverse the Y-axis

        // Create a line generator
        const line = d3n.d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d.length));

        // Draw the line graph
        svg.append('path')
            .datum(dataPoints)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('d', line);

        const svgString = d3n.svgString();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
    });
});










module.exports = router;
