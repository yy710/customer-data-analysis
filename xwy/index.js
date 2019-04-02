const multer = require('multer');
const upload = multer({
    dest: './xwy/uploads/'
});
const excel = require('../excel.js');
const Vue = require('vue');
const renderer = require('vue-server-renderer').createRenderer();
const createApp = require('./app');

module.exports = function (express) {
    const router = express.Router();

    router.use(function (req, res, next) {
        //console.log("req.data", req.data);
        next();
    });

    //router.use('/a', log('good!'), express.static(__dirname + '/public'));
    //router.use(express.static(__dirname + '/public'));
    router.use(express.static('public')); // notic path!

    router.post('/upload', (req, res, next) => {
        res.json({
            msg: "request ok!"
        });
        //res.render('learning-english', {title: '学英语的鱼'});
        next();
    }, upload.single('excel'), function (req, res, next) {
        excel.xlsxToDb(req.file.path, req.data.db, "xwya");
    });

    router.use('/start', function (req, res, next) {
        const app = new Vue({
            data: {
                url: req.url
            },
            template: `<div>The visited URL is: {{ url }}</div>`
        });

        renderer.renderToString(app, (err, html) => {
            if (err) {
                res.status(500).end('Internal Server Error')
                return
            };
            res.end(`
              <!DOCTYPE html>
              <html lang="en">
                <head><title>Hello</title></head>
                <body>${html}</body>
              </html>
            `);
        });
    });

    router.get('/vue', function (req, res, next) {
        const context = {
            url: req.url
        };
        const app = createApp(context);

        renderer.renderToString(app, (err, html) => {
            // handle error...
            if (err) {
                res.status(500).end('Internal Server Error')
                return
            };
            res.end(html)
        });
    });

    router.get('/get-table', function (req, res, next) {
        const tags = Array.isArray(req.query.tags) ? req.query.tags : [];
        console.log("origin: ", tags);
        //if (tags === []) return;

        let condition_json = tags.map(element => {
            let e = JSON.parse(element);
            let _j = {};
            switch (e[0]) {
                case 0:
                    switch (e[1]) {
                        case "0-5000":
                            _j = {
                                "行驶里程": {
                                    $lte: 5000
                                }
                            };
                            return {
                                $match: _j
                            };
                            break;
                        case "5000-10000":
                            _j = {
                                $and: [{
                                    "行驶里程": {
                                        $gt: 5000
                                    }
                                }, {
                                    "行驶里程": {
                                        $lte: 10000
                                    }
                                }]
                            };
                            return {
                                $match: _j
                            };
                            break;
                        case "10000-50000":
                            _j = {
                                $and: [{
                                    "行驶里程": {
                                        $gt: 10000
                                    }
                                }, {
                                    "行驶里程": {
                                        $lte: 50000
                                    }
                                }]
                            };
                            return {
                                $match: _j
                            };
                            break;
                        case ">50000":
                            _j = {
                                "行驶里程": {
                                    $gt: 50000
                                }
                            };
                            return {
                                $match: _j
                            };
                            break;
                    }
                    break;
                case 1:
                    _j = {
                        "车系": e[1]
                    };
                    return {
                        $match: _j
                    };
                    break;
                case 2:
                    _j = {
                        "维修类型": e[1]
                    };
                    return {
                        $match: _j
                    };
                    break;
            }

        });
        console.log("new: ", condition_json);

        const db = req.data.db;
        db.collection('xwya').aggregate(condition_json).toArray((err, doc) => res.json(doc || []));
    });

    return router;
};

function log(text) {
    return function (req, res, next) {
        console.log(text);
        next();
    };
}