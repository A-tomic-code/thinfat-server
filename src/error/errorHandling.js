function errorHandling(err, res, req, next){
    res.status(500).json({
        error:true,
        code: 500,
        message: 'Internal server error --> ' + err.message
    });

    next();
}

module.exports = errorHandling;