import connectDB from "@/config/db";
import User from "@/models/user";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"; 


export async function GET(request) {
    try{
        const { userId } = getAuth(request);
        await connectDB();

        const user = await User.findById(userId)

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        return NextResponse.json({success:true, user  })
    }
    catch (error) {
        console.error("Error fetching user data:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}