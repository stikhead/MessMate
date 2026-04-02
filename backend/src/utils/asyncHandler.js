const asyncHandler = (fn) => {
    return async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        console.error(`err: ${error}`); 
            const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors || []
        });
    }
    }
}

export default asyncHandler;