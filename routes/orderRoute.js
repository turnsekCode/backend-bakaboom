import express from 'express'
import {placeOrder,allOrders,userOrders,updateStatus, verifyOrder, placeOrderRedsys, verifyOrderRedsys, deleteOrder} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'


const orderRoute = express.Router()

// admin features
orderRoute.post('/list', adminAuth, allOrders)
orderRoute.post('/status', adminAuth, updateStatus)

// payment features
orderRoute.post('/place', placeOrder)

// verify payment 
orderRoute.post('/verify_old', verifyOrder)

orderRoute.post('/redsys', placeOrderRedsys)
orderRoute.post('/verify', verifyOrderRedsys)

orderRoute.post('/delete', adminAuth, deleteOrder)



export default orderRoute;