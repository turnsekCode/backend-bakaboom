import jwt from 'jsonwebtoken';


const adminAuth = (req,res,next) => {  
    try {
        const {token} = req.headers;
        if (!token) {
            return res.status(401).json({success: false, message: "No token, authorization denied"});
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.status(401).json({success: false, message: "Token verification failed, authorization denied"});
        }
        next();
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
 }

export default adminAuth;