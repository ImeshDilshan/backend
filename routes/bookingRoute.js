// bookingRoute.js

const express = require('express');
const db = require('../db');
// const router = express.Router();
const { createCanvas } = require('canvas');
const Chart = require('chart.js');
const D3Node = require('d3-node');
// const d3 = require('d3');
  // import express from 'express';
// import D3Node from 'd3-node';
// import * as d3 from 'd3';

const router = express.Router();



// Create a new booking
router.get('/', (req, res) => {
    const selectQuery = "SELECT * FROM captured_packets";

    db.all(selectQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

// Create a new captured packet
router.post('/', (req, res) => {
    const { protocol, source, destination, length } = req.body;
    const insertQuery = "INSERT INTO captured_packets (protocol, source, destination, length) VALUES (?, ?, ?, ?)";

    db.run(insertQuery, [protocol, source, destination, length], function (err) {
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
    const id = req.params.id;
    const width = 800;
    const height = 400;
    const boxHeight = 60; // Height of the information box

    const d3n = new D3Node();

    const svg = d3n.createSVG(width, height + boxHeight); // Adjusting height for the box

    // Fetch data from the captured_packets table based on the provided ID
    const selectQuery = "SELECT protocol, source, destination FROM captured_packets WHERE id = ?";

    db.get(selectQuery, [id], (err, row) => {
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

        // Create a line connecting source and destination
        const lineData = [
            { x: 150, y: boxHeight }, // Source
            { x: 650, y: boxHeight }  // Destination
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
            .attr('y', boxHeight)
            .attr('dy', -10) // Adjust the distance above the node
            .attr('text-anchor', (d, i) => i === 0 ? 'end' : 'start')
            .text(d => d.value);

        const svgString = d3n.svgString();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(200).send(svgString);
    });
});






// ...


// ...


// ...















module.exports = router;
