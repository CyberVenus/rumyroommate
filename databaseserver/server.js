/**
 * @deprecated Legacy module.
 * This file is outside the canonical MVP runtime path.
 * Canonical runtime is app.js.
 */

const express = require('express'); // The express module for server set-up
const mainpage = require('../mainpage/mainpageOperations.js'); // Main page operations
const { host, port } = require('./serverSpecs.js');
const {saveListing} = require('../mainpage/SaveListing.js');

const initializeServer = function () {
    const rumyroommateserver = express(); // The router for the server

    /* UC-03: Search Listings */
    rumyroommateserver.get('/listings/search', function (request, response) {
        const userid = request.query.userid;
        const preferenceid = request.query.preferenceid;
        mainpage.searchListings(request, response, userid, preferenceid);
    });

    /* OP-03: Get Preferences */
    rumyroommateserver.get('/preferences', function (request, response) {
        const userid = request.query.userid;
        const preferenceid = request.query.preferenceid;

        if (userid == undefined || preferenceid == null) {
            response.status(500).send('Bad Query');
            return;
        }

        mainpage.getPreferences(request, response, userid, preferenceid);
    });

    /* OP-05: Get Listings */
    rumyroommateserver.get('/listings', function (request, response) {
        mainpage.getListings(request, response);
    });


    /* OP-08: Get Saved Listings */
    rumyroommateserver.get('/listings/saved', function (request, response){
        mainpage.getSavedListings(request, response);
    })

    /* OP-09: Add saved Listing (UC-04) */
    rumyroommateserver.post('/listings/saved/add', function (request, response) {
        saveListing (request, response);
    });
    
    rumyroommateserver.get('/saved', function (request, response){
        response.sendFile('/Users/vladyslavbartkiv/GithubRepo/rumyroommate/public/frontpage.html');
    });


    /* Listen to requests at the specified port */
    rumyroommateserver.listen(port);
    console.log(`Server started on port ${port}`);

    return rumyroommateserver;
};


const http = require('http'); // HTTP Formatting and Usage
const url = require('url'); // URL Parsing
const querystr = require('querystring'); // Query Parsing

/* HTTP request part of the URI that routes the server actions */
const regExpGet = new RegExp('^\/get.*');
const regExpPost = new RegExp('^\/post.*');
const regExpPatch = new RegExp('^\/patch.*');
const regExpDelete = new RegExp('^\/delete.*');

/* callback function, called by the web server to process client HTTP requests */
const setHeader = function (responeMessage) {
    if (!responeMessage.headers || responeMessage.headers === null) {
        responeMessage.headers = {};
    }
    if (!responeMessage.headers["Content-Type"]) {
        responeMessage.headers["Content-Type"] = "application/json";
    }
};

/* Gets the constituent parts of the requested URL */
const getURLParts = function (request) {
    /* Gets information about any client requests made to server */
    let urlParts = [];
    let segments = request.url.split('/');

    /* Parses the url into constituent components */
    for (index = 0, length = segments.length; index < length; ++index) {
        if (segments[index] !== "") {
            urlParts.push(segments[index]);
        }
    }

    return urlParts;
};

/* Creates a local server at the specified port */
const applicationServer = function (request, response) {
    let done = false;
    let responeMessage = {};
    
    /* Gets information about any client requests made to server */
    const urlParts = getURLParts(request);

    /* Gets method from the request */
    if (request.method === 'GET') {
        try {
            if (regExpGet.test(request.url)) {
                
                done = true;
            }
        }
        catch (exception) { 
            
        }
    }
    else if (request.method === 'POST') {
        try {
            if (regExpPost.test(request.url)) {

                done = true;
            }
        }
        catch (exception) { 
            
        }
    }
    else if (request.method === 'PATCH') {
        try {
            if (regExpPatch.test(request.url)) {

                done = true;
            }
        }
        catch (exception) { 
            
        }
    }
    else if (request.method === 'DELETE') {
        try {
            if (regExpDelete.test(request.url)) {

                done = true;
            }
        }
        catch (exception) { 
            
        }
    }
    else {
        abort();
    }

    if (done === false) {
        responeMessage.code = 404;
        responeMessage.body = 'Not found';
        setHeader(responeMessage)
        response.writeHead(404, responeMessage.headers),
        response.end(responeMessage.body);
    }
    else {
        response.end();
    }
};

// start the web server to wait for client HTTP requests
// const webServer = http.createServer(applicationServer);
// webServer.listen(port);

module.exports = {
    initializeServer
};