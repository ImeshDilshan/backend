// bookingRoute.js

const express = require('express');
const cors = require('cors');
const { capturedPacketsDB } = require('../db');
const { detectedVulnerabilitiesDB } = require('../db');
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
        if (vulnerability.vulnerability_info >= 9.0) {
            categories.Critical++;
        } else if (vulnerability.vulnerability_info >= 7.0) {
            categories.High++;
        } else if (vulnerability.vulnerability_info >= 4.0) {
            categories.Medium++;
        } else if (vulnerability.vulnerability_info >= 0.1) {
            categories.Low++;
        } else {
            categories.Informational++;
        }
    });

    return Object.values(categories);
}

router.get('/vulnerabilities-chart', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    // Fetch data from the vulnerabilities table
    const selectQuery = "SELECT vulnerability_info FROM vulnerabilities";

    detectedVulnerabilitiesDB.all(selectQuery, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Categorize vulnerabilities
        const vulnerabilityCategories = categorizeVulnerabilities(rows);

        // Create a canvas for the chart
        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Create a 3D pie chart using Chart.js
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
                datasets: [{
                    data: vulnerabilityCategories,
                    backgroundColor: ['red', 'orange', 'yellow', 'gray', 'lightgray'],
                }],
            },
        });

        // Save the chart as an image file
        const imageFileName = 'vulnerabilities-chart.png';
        const directoryPath = 'D:\\express - Backend - Imesh\\backend'; // Specify the directory path
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
    
    // Query the 'vulnerabilities' table to retrieve the data you need
    const selectQuery = "SELECT protocol, COUNT(*) AS count FROM vulnerabilities GROUP BY protocol";

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















module.exports = router;
