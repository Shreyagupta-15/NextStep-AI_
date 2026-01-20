'use server'
import { auth } from "@clerk/nextjs/server"
import { db } from '@/lib/prisma'
import { generateAIInsights } from "./dashboard";

export async function updateUser(data){
const {userId} = await auth();
if(!userId) throw new Error("Unauthorised");

const user = await db.user.findUnique({
    where:{
        clerkUserID:userId,
    }
});

if(!user){
    throw new Error("User not found");
}

try{
    const result  = await db.$transaction(
async (tx) =>{
    // Find if industry exists
    let industryInsight = await tx.industryInsight.findUnique({
where :{
    industry : data.industry,
}
    });

    // If industry doesn't exist, create it with default value for now, will change it later
    if(!industryInsight){

        const insights = await generateAIInsights(data.industry);
         industryInsight = await db.industryInsight.create({
            data:{
                industry : data.industry,
                ...insights,
                nextUpdate : new Date(Date.now() + 7*24*60*60*1000), // 7 days from now


            }
        })
    }

    // Update user data
const updatedUser = await tx.user.update({
    where:{
        id:user.id,
    },
    data:{
        industryInsights: {
            connect: { industry: data.industry }, // Connect to existing industry
        },
        Skills : data.skills,
        experience : data.experience,
        bio : data.bio,
    },
})
return {
     updatedUser,
    industryInsight
};
}, {
    timeout: 10000,
});
return {success: true, ...result };
    }catch(error){
        console.error("Error updating user and industry", error.message);
        throw new Error("Failed to update profile"+ error.message);
    }




}



export async function getUserOnboardingStatus() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserID: userId },
    });

    if (!user) throw new Error("User not found");

    try {
      const user = await db.user.findUnique({
        where: {
          clerkUserID: userId,
        },
        select: {
          industry: true,
        },
      });

      return {
        isOnboarded: !!user?.industry,
      };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      throw new Error("Failed to check onboarding status");
    }
  }

