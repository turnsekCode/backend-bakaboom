import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
    const {token} = req.headers;

    if (!token) {
        return res.json({message: 'Not authorized'})
    }

    try {
        const token_decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.body.userId = token_decoded.id;
        next();
    } catch (error) {
        console.error(error);
        return res.json({message: error.message})
    }
}

export default authUser;