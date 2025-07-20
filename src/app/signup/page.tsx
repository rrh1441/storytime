// src/app/signup/page.tsx
'use client'; // Required for hooks, state, form handling, event handlers

import { useState } from 'react'; // Import useState for submitting state
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link'; // Use Next.js Link
import { useRouter, useSearchParams } from 'next/navigation'; // Use Next.js navigation

import { useAuth } from '@/context/AuthContext'; // Use Next.js Auth Context
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast'; // Assuming hook is adapted/available
import { Loader2, UserPlus } from 'lucide-react';

const signupSchema = z.object({
 name: z.string().min(1, { message: 'Name is required.' }),
 email: z.string().email({ message: 'Invalid email address.' }),
 password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

// Removed React.FC type for simpler default export
export default function SignupPage() {
 const form = useForm<SignupFormValues>({
  resolver: zodResolver(signupSchema),
  defaultValues: { name: '', email: '', password: '' },
 });

 const { signup, loading: authLoading } = useAuth(); // Get signup function and loading state
 const router = useRouter();
 const searchParams = useSearchParams(); // Get query params

 // State to track form submission process
 const [isSubmitting, setIsSubmitting] = useState(false);

 const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
  setIsSubmitting(true);
  try {
   // Call signup function from useAuth context
   const { error } = await signup({
    email: data.email,
    password: data.password,
    options: {
     data: {
      // Ensure your Supabase trigger/logic handles inserting this name
      // into your 'users' or 'profiles' table correctly.
      // The 'name' here is passed as user_metadata during signup.
      name: data.name,
     }
    }
   });

   if (error) {
     console.error("Signup failed:", error);
     toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
   } else {
     toast({ title: "Signup Successful!", description: "Welcome! Check your email for verification if required." });

     // Redirect logic after successful signup
     const redirectPath = searchParams?.get('redirect') || '/dashboard'; // Default redirect
     const returnToTab = searchParams?.get('tab'); // Check for tab parameter

     let finalRedirectUrl = redirectPath;
     // Avoid redirecting back to login/signup
     if (finalRedirectUrl === '/login' || finalRedirectUrl === '/signup') {
         finalRedirectUrl = '/dashboard';
     }

     // Append tab if it exists
     if (returnToTab && finalRedirectUrl.includes('/create-story')) { // Example: only append tab for specific routes
       finalRedirectUrl = `${finalRedirectUrl}?tab=${returnToTab}`;
       console.log(`Redirecting to ${finalRedirectUrl}`);
     } else {
       console.log(`Redirecting to ${finalRedirectUrl}`);
     }

     // Use replace to avoid adding signup page to history
     router.replace(finalRedirectUrl);
   }
  } catch (error: unknown) { // Replace 'any' with 'unknown'
    // Handle the error
    // console.error((error as Error).message);
    console.error("Signup submission error:", error);
    toast({ title: "Signup Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
  } finally {
   setIsSubmitting(false);
  }
 };

 return (
  <div className="flex items-center justify-center min-h-[calc(100vh-150px)] py-12 bg-[#F2FCE2] px-4"> {/* Use theme color */}
   <div className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
    <div className="text-center">
     <UserPlus className="mx-auto h-10 w-10 text-[#06D6A0]" /> {/* Use theme color */}
     <h1 className="text-3xl font-display font-bold mt-4 text-[#06D6A0]">Create Your Account</h1> {/* Use theme color */}
     <p className="text-[#6b7280] mt-2">Join StoryTime and start creating magical tales!</p>
    </div>
    <Form {...form}>
     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
       control={form.control} name="name"
       render={({ field }) => (
        <FormItem>
         <FormLabel className="text-[#6b7280]">Name</FormLabel>
         <FormControl>
          <Input className="rounded-lg border-gray-300 focus:border-[#06D6A0] focus:ring-[#06D6A0]" placeholder="Your Name" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />
      <FormField
       control={form.control} name="email"
       render={({ field }) => (
        <FormItem>
         <FormLabel className="text-[#6b7280]">Email</FormLabel>
         <FormControl>
          <Input className="rounded-lg border-gray-300 focus:border-[#06D6A0] focus:ring-[#06D6A0]" placeholder="you@example.com" {...field} type="email" />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />
      <FormField
       control={form.control} name="password"
       render={({ field }) => (
        <FormItem>
         <FormLabel className="text-[#6b7280]">Password</FormLabel>
         <FormControl>
          <Input className="rounded-lg border-gray-300 focus:border-[#06D6A0] focus:ring-[#06D6A0]" type="password" placeholder="6+ characters" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />
      <Button type="submit" className="w-full bg-[#06D6A0] hover:bg-[#06D6A0]/90 text-white rounded-full shadow-md h-11" disabled={isSubmitting || authLoading}> {/* Use theme color */}
       {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
       Create Account
      </Button>
     </form>
    </Form>
    <div className="mt-6 text-center text-sm text-[#6b7280]">
     Already have an account?{' '}
     {/* Use Next.js Link */}
     <Link href="/login" className="font-medium text-[#FF9F51] hover:text-[#FF9F51]/80 underline"> {/* Use theme color */}
      Sign in
     </Link>
    </div>
   </div>
  </div>
 );
}