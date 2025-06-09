import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/user";
import Order from "@/models/order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });



// Inngest Function to save user data

export const saveUserData = inngest.createFunction(
    {
        id: "save-user-from-clerk",

    },
    {
        event: "clerk/user.created",
    },

    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data; 
        const userData = {
            _id: id,
            name: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            imageUrl: image_url,
        }
        await connectDB();
        await User.create(userData)

    }
)

// Inngest Function to update user data

export const updateUserData = inngest.createFunction(
    {
        id: "update-user-from-clerk",
    },
    {
        event: "clerk/user.updated",
    },

    async ({event}) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data; 
        const userData = {
            name: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            imageUrl: image_url,
        }
        await connectDB();
        await User.findByIdAndUpdate(id, userData, {new: true})

    }
)

// Inngest Function to delete user data

export const deleteUserData = inngest.createFunction(
    {
        id: "delete-user-with-clerk",
    },
    {
        event: "clerk/user.deleted",
    },

    async ({event}) => {
        const {id} = event.data; 
        await connectDB();
        await User.findByIdAndDelete(id)

    }

)

// Inngest Function to create order
export const createUserOrder = inngest.createFunction(
    {
        id: "create-user-order",
        batchEvents:{
            maxSize: 25,
            timeout: 5, // seconds
        }
    },
    {
        event: "clerk/order.created",
    },

    async ({events}) => {
        const orders = events.map((event) => {
            return{
                userId: event.data.userId,
                items: event.data.items,
                amount: event.data.amount,
                address: event.data.address,
                date: event.data.date
            }
        });
        await connectDB();

        await Order.insertMany(orders);
        return { success: true, processed: orders.length  };
    }
)
