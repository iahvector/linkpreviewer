'use strict';

var LinkPreview = require('../../models/linkpreview');

var Preview = require('page-previewer');
var EasyImage = require('easyimage');
var ShortId = require('shortid');
var Async = require('async');

module.exports = function (router) {
    
    router.post('/asyncpreview', function (req, res) {
        var link = req.body.link;

        if (!link) {
            return res.status(400).send('missing parameter: link');
        }

        createAndStorePreview(link, req.headers.host);
        
        return res.send('creating preview asynchronously');
    });

    router.get('/preview', function (req, res) {
        var link = req.query.link;

        if (!link) {
            return res.status(400).send('missing parameter: link');
        }
        
        createAndStorePreview(link, req.headers.host, function(err, result) {
            if (err) {
                return res.status(500).send(err);
            } else {
                if (result.images && result.images.length > 0) {
                    for (var i = 0; i < result.images.length; i++) {
                        if (result.images[i].downsized_image) {
                            result.images[i].downsized_image = req.headers.host + '/' + result.images[i].downsized_image;
                        }
                    }
                }

                return res.send(result);
            }
        });
    });

    router.post('/batchpreviews', function (req, res) {
        var links = req.body.links;

        if (!links || links.length < 1) {
            return res.status(400).send('Missing parameter: links');
        }

        Async.map(links,
            function (link, cb) {
                createAndStorePreview(link, req.headers.host, cb);
            },
            function (err, results) {
                var response = {};
                
                if (results && results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        if (results[i]) {
                            if (results[i].images && results[i].images.length > 0) {
                                for (var j = 0; j < results[i].images.length; j++) {
                                    if (results[i].images[j].downsized_image) {
                                        results[i].images[j].downsized_image = req.headers.host + '/' + results[i].images[j].downsized_image;
                                    }
                                }
                            }

                            response[results[i].url] = results[i];
                        }
                    }
                }

                return res.send(response);
            }
        );
    });

    function createAndStorePreview(link, host, cb) {
        LinkPreview.findOne({'url': link}, function (err, preview) {
            if (err) {
                console.log(err);
                if (cb) {
                    return cb(err, null);
                }
            } else if (preview) {
                if (cb) {
                    return cb(null, preview);
                }
            } else {
                Preview(link, function(err, data) {

                    data.canonical_url = extractCanonicalUrl(data.url);

                    if(err) {
                        console.log(err);
                        if (cb) {
                            return cb(err, null);
                        }
                    } else {
                        if (data.images && data.images.length > 0) {
                            Async.map(
                                data.images,
                                function(image, cb) {
                                    resizeAndSaveImage(image, function(err, result) {
                                        if (err) {
                                            console.log(err);
                                            cb(err, null);
                                        } else {
                                            cb(null, result);
                                        }
                                    });
                                },
                                function(err, results) {
                                    for (var i = 0; i < data.images.length; i++) {
                                        var img = {'original_image': data.images[i]};
                                        if (results[i] && results[i].name) {
                                            img.downsized_image = results[i].name;
                                        } else {
                                            img.downsized_image = null;
                                        }

                                        data.images[i] = img;
                                    }

                                    LinkPreview.create(data, function(err, newPreview) {
                                        if (err) {
                                            console.log(err);
                                            if (cb) {
                                                cb(err, null);
                                            }
                                        } else if (!newPreview) {
                                            console.log('could not create preview');
                                            if (cb) {
                                                cb('could not create preview', null);
                                            } 
                                        } else {
                                            console.log(newPreview);
                                            if (cb) {
                                                cb(null, newPreview);
                                            }
                                        }
                                    });
                                }
                            );
                        } else {
                            if (cb) {
                                return cb(null, data);
                            }
                        }
                    }
                });
            }
        });
        
        if (cb === null) {
            return;
        }
    }

    function resizeAndSaveImage(image, cb) {
        var imgOptions = {
            'src': image,
            'dst': './public/' + ShortId.generate() + '.jpg',
            'width': 400
        };

        EasyImage.resize(imgOptions).then(
            function(img) {
                return cb(null, img);
            },
            function(err) {
                console.log(err);
                return cb(err, null);
            }
        );
    }

    function extractCanonicalUrl(url) {
        var canonicalUrl = url;
        
        if (url.indexOf('http://') === 0) {
            canonicalUrl = url.substring(7);
        } else if (url.indexOf('https://') === 0) {
            canonicalUrl = url.substring(8);
        }

        if (url.indexOf('/') > 0) {
            canonicalUrl = canonicalUrl.substring(0,canonicalUrl.indexOf('/'));
        }

        return canonicalUrl;
    }
};