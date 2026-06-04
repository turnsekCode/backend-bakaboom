import mongose from 'mongoose'


const orderSchema = new mongose.Schema({
    userId: {type: String, required: false},
    items: {type: Array, required: true},
    orderNumber: {type: String, required: true},
    amount: {type: Number, required: true},
    address: {type: Object, required: true},
    status: {type: String, required: true, default: 'Order Placed'},
    paymentMethod: {type: String, required: true},
    payment: {type: Boolean, required: true, default: false},
    date: {type: Number, required: true}
})

const orderModel = mongose.models.order || mongose.model('order', orderSchema)

export default orderModel;