// src/app/login/page.tsx
'use client'; // Required for hooks, state, form handling, event handlers

import { useState, useEffect } from 'react';
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
import { Loader2, LogIn } from 'lucide-react';

const loginSchema = z.object({
 email: z.string().email({ message: 'Invalid email address.' }),
 password: z.string().min(1, { message: 'Password is required.' }), // Keep min(1) for required check
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Removed React.FC type for simpler default export
export default function LoginPage() {
 const form = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
 });

 const { login, loading: authLoading, session } = useAuth(); // Get login function and state from context
 const router = useRouter();
 const searchParams = useSearchParams(); // Get search params for redirect info

 // State to track if login API call succeeded (to trigger redirect effect)
 const [loginAttempted, setLoginAttempted] = useState(false);
 // State to track form submission process separate from auth loading
 const [isSubmitting, setIsSubmitting] = useState(false);

 const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
  setLoginAttempted(false); // Reset flag on new submission
  setIsSubmitting(true); // Indicate form submission started

  try {
   // Call login function from useAuth context
   const { error } = await login({ email: data.email, password: data.password });

   if (error) {
    // Handle login error (e.g., invalid credentials)
    console.error('Login failed:', error);
    toast({ title: 'Login Failed', description: error.message || 'Invalid credentials.', variant: 'destructive' });
    setLoginAttempted(false); // Ensure flag is false on error
   } else {
    // Login call succeeded, onAuthStateChange listener in AuthProvider will update session state.
    // We set a flag to allow the useEffect to handle redirection *after* session state updates.
    toast({ title: 'Login Initiated', description: 'Checking credentials...' });
    setLoginAttempted(true); // Set flag indicating Supabase login call succeeded
   }
  } catch (error: any) {
   // Catch unexpected errors during the login call itself
   console.error('Login submission error:', error);
   toast({ title: 'Login Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
   setLoginAttempted(false);
  } finally {
   setIsSubmitting(false); // Indicate form submission finished
  }
 };

 // useEffect to handle navigation AFTER session updates
 useEffect(() => {
  // Only redirect if login attempt was successful AND the session is now valid
  if (loginAttempted && session) {
   console.log('[LoginPage useEffect] Login attempt succeeded and session found, navigating...');
   toast({ title: 'Login Successful!', description: 'Welcome back!' });

   // Get redirect path from query parameter or default to dashboard
   const redirectPath = searchParams.get('redirect') || '/dashboard';
   // Avoid redirect loops back to login/signup
   const finalRedirectPath = (redirectPath === '/login' || redirectPath === '/signup') ? '/dashboard' : redirectPath;

   console.log(`[LoginPage useEffect] Redirecting to: ${finalRedirectPath}`);
   router.replace(finalRedirectPath); // Use replace to remove login from history

   // No need to reset loginAttempted here as the component will unmount on redirect
  } else if (loginAttempted && !session && !authLoading) {
   // Optional: Handle case where loginAttempted was true, but session didn't appear (might indicate an issue)
   console.warn('[LoginPage useEffect] Login attempt flag was set, but session is still null after loading.');
   setLoginAttempted(false); // Reset flag if session didn't materialize
  }
 }, [session, loginAttempted, authLoading, router, searchParams]); // Add authLoading to deps

 return (
  <div className="flex items-center justify-center min-h-[calc(100vh-150px)] py-12 bg-[#F2FCE2] px-4"> {/* Use theme color */}
   <div className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
    <div className="text-center">
     <LogIn className="mx-auto h-10 w-10 text-[#4FB8FF]" /> {/* Use theme color */}
     <h1 className="text-3xl font-display font-bold mt-4 text-[#4FB8FF]">Welcome Back!</h1> {/* Use theme color */}
     <p className="text-[#6b7280] mt-2">Log in to continue your storytelling adventure.</p>
    </div>
    <Form {...form}>
     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
       control={form.control} name="email"
       render={({ field }) => (
        <FormItem>
         <FormLabel className="text-[#6b7280]">Email</FormLabel>
         <FormControl>
          <Input className="rounded-lg border-gray-300 focus:border-[#4FB8FF] focus:ring-[#4FB8FF]" placeholder="you@example.com" {...field} type="email" />
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
          <Input className="rounded-lg border-gray-300 focus:border-[#4FB8FF] focus:ring-[#4FB8FF]" type="password" {...field} />
         </FormControl>
         <FormMessage />
        </FormItem>
       )}
      />
      {/* Disable button based on combined loading state */}
      <Button type="submit" className="w-full bg-[#4FB8FF] hover:bg-[#4FB8FF]/90 text-white rounded-full shadow-md h-11" disabled={isSubmitting || authLoading}>
       {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
       Sign In
      </Button>
     </form>
    </Form>
    <div className="mt-6 text-center text-sm text-[#6b7280]">
     Don't have an account?{' '}
     {/* Use Next.js Link */}
     <Link href="/signup" className="font-medium text-[#06D6A0] hover:text-[#06D6A0]/80 underline"> {/* Use theme color */}
      Sign up
     </Link>
    </div>
   </div>
  </div>
 );
}