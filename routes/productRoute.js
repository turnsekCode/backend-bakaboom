import express from 'express';
import {addProduct, listProducts, removeProduct, singleProduct, updateProduct, updateProductQuantity} from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';


const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]), addProduct);
productRouter.get('/list', listProducts);
productRouter.post('/remove',adminAuth, removeProduct);
productRouter.get('/single/:id', singleProduct);
productRouter.post('/update/:id', adminAuth, upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]), updateProduct);
// routes/productRouter.js
productRouter.post('/update-quantity', updateProductQuantity);


export default productRouter;