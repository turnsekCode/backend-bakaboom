import express from 'express'
import {placeOrder,placeOrderStripe,allOrders,userOrders,updateStatus, verifyOrder, placeOrderSumUp, verifyOrderSumUp, placeOrderRedsys, verifyOrderRedsys} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'


const orderRoute = express.Router()

// admin features
orderRoute.post('/list', adminAuth, allOrders)
orderRoute.post('/status', adminAuth, updateStatus)

// payment features
orderRoute.post('/place', placeOrder)
orderRoute.post('/stripe', placeOrderStripe)
orderRoute.post('/sumup', placeOrderSumUp)

// verify payment 
orderRoute.post('/verify_old', verifyOrder)
orderRoute.post('/verify-sumup', verifyOrderSumUp)

orderRoute.post('/redsys', placeOrderRedsys)
orderRoute.post('/verify', verifyOrderRedsys)



export default orderRoute;