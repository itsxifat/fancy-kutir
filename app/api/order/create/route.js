import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server'; 
import Order from '@/models/order';
import { inngest } from '@/config/inngest';
import User from '@/models/user';


export async function POST(request) {
    try {
        
        const {userId} = getAuth(request);
        const {address, items} = await request.json();

        if(!address || !items || items.length === 0) {
            return NextResponse.json({ success: false, message: "Address and items are required" });
        }

        //calcullate total price
        const amount = await items.redusce(async(acc, item)=>{
            const product = await items.findById(item.product);
            return acc + (product.price * item.quantity);
        },0);

        await inngest.send({
            name: 'Order Created',
            data: {
                userId,
                address,
                items,
                amount,
                date: Date.now()
            }
        })

        // clear user cart

        const user = await User.findById(userId);
        user.cartItems = [];
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Order created successfully",
            order: {
                userId,
                address,
                items,
                amount,
                date: Date.now()
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
        
    }
}