'use strict';


var kraken = require('kraken-js'),
    db = require('./lib/database'),
    app = require('express')(),
    options = {
        onconfig: function (config, next) {
            //any config setup/overrides here
            db.config(config.get('databaseConfig'));
            next(null, config);
        }
    },
    port = process.env.PORT || 8000;


app.use(kraken(options));

// Enables CORS
var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'audibu.com, api.audibu.com, links.audibu.com');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
 
    // intercept OPTIONS method
    if (req.method === 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
};
 
 
// enable CORS!
app.use(enableCORS);


app.listen(port, function (err) {
    console.log('[%s] Listening on http://localhost:%d', app.settings.env, port);
});