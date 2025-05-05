// src/app/pricing/page.tsx
'use client'; // Required for hooks, state, Stripe interaction, event handlers

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Use Next.js Link
import { useRouter, usePathname } from 'next/navigation'; // Use Next.js router hooks
import { useAuth } from '@/context/AuthContext'; // Use Next.js Auth Context
import { loadStripe } from '@stripe/stripe-js';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Check, LogIn } from 'lucide-react';

// --- Stripe Publishable Key ---
// Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your .env.local file
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// --- Initialize Stripe.js ---
// Type definition for StripePromise
type StripePromise = ReturnType<typeof loadStripe>;
let stripePromise: Promise<StripePromise | null> | null = null; // Initialize as null

if (typeof window !== 'undefined') { // Ensure this runs only on the client
 if (STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
 } else {
  console.error("Stripe Publishable Key is missing or invalid (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY). Stripe functionality will be disabled.");
 }
}

// --- Plan Details ---
const plans = [
 {
  id: 'starter', name: 'Starter StoryTime',
  priceId: 'price_1R88J5KSaqiJUYkjbH0R39VO', priceMonthly: 4.99,
  features: ['15 minutes of custom stories per Month'],
  cta: 'Get Starter', popular: false,
 },
 {
  id: 'super', name: 'Super StoryTime',
  priceId: 'price_1R9u5HKSaqiJUYkjnXkKiJkS', priceMonthly: 14.99,
  features: ['60 minutes of custom stories per Month', 'Priority Support'],
  cta: 'Get Super', popular: true,
 },
 {
  id: 'studio', name: 'Studio StoryTime',
  priceId: 'price_1RHXrmKSaqiJUYkjfie7WbY1', priceMonthly: 49.99,
  features: ['300 minutes of custom stories per Month', 'Highest Priority Support'],
  cta: 'Get Studio', popular: false,
 },
];

// Note: Removed React.FC for simpler default export
export default function PricingPage() {
 // Use Next.js hooks
 const router = useRouter();
 const pathname = usePathname(); // Get current path if needed for redirect
 const { user, loading: authLoading, profile, supabase } = useAuth(); // Get supabase client from context
 const [isRedirecting, setIsRedirecting] = useState<Record<string, boolean>>({});

 // Effect to check Stripe key on mount
 useEffect(() => {
  if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
   toast({
    title: 'Configuration Error',
    description: 'Stripe payments are currently unavailable due to a missing or invalid key.',
    variant: 'destructive',
    duration: Infinity, // Persist this warning
   });
  }
 }, []);

 const handleSubscribe = async (priceId: string) => {
  if (!priceId) {
   toast({ title: 'Error', description: 'Plan information is missing.', variant: 'destructive' });
   return;
  }

  setIsRedirecting((prev) => ({ ...prev, [priceId]: true }));

  if (!stripePromise) {
   toast({ title: 'Error', description: 'Stripe is not configured correctly.', variant: 'destructive' });
   setIsRedirecting((prev) => ({ ...prev, [priceId]: false }));
   return;
  }

  if (!user) {
   toast({
    title: 'Login Required',
    description: 'Please log in or sign up to subscribe.',
    action: (
     // Use Next.js router to navigate, pass redirect info via query params
     <Button variant="outline" size="sm" onClick={() => router.push(`/login?redirect=${pathname}&priceId=${priceId}`)}>
      Log In
     </Button>
    ),
   });
   setIsRedirecting((prev) => ({ ...prev, [priceId]: false }));
   return;
  }

  // --- Calling Supabase Function ---
  // This assumes you still want to call the Edge Function.
  // Alternatively, you could create a Next.js API Route or Server Action.
  try {
   console.log(`Calling create-checkout-session Edge Function for priceId: ${priceId}`);
   // Note: functions.invoke sends the user's auth token automatically
   const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId: priceId },
   });

   console.log('Edge function response:', { data, functionError });

   if (functionError) throw functionError; // Rethrow function-level errors
   if (data?.error) throw new Error(data.error); // Throw errors reported in function data
   if (!data?.sessionId) throw new Error('Checkout session ID not received.');

   const sessionId = data.sessionId;
   console.log(`Received sessionId: ${sessionId}`);

   const stripe = await stripePromise;
   if (!stripe) throw new Error('Stripe.js failed to load.');

   // Redirect to Stripe Checkout
   const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

   if (stripeError) {
    console.error('Stripe redirect error:', stripeError);
    toast({ title: 'Checkout Error', description: stripeError.message || 'Could not redirect to Stripe.', variant: 'destructive' });
    // No need to setIsRedirecting to false here, as the page context is lost on redirect failure typically.
   }
   // If redirect succeeds, the user leaves this page. If it fails, the error is shown.
   // If it fails before calling redirectToCheckout, finally block will run.

  } catch (error: any) {
   console.error('Subscription initiation failed:', error);
   toast({ title: 'Subscription Error', description: error.message || 'Could not initiate checkout. Please try again.', variant: 'destructive' });
   setIsRedirecting((prev) => ({ ...prev, [priceId]: false })); // Only reset if error occurs before redirect attempt
  }
  // Removed finally block that always reset isRedirecting, as it's not needed after successful redirect attempt.
 };

 if (authLoading) {
  return (
   <div className="min-h-[calc(100vh-200px)] bg-[#F9FAFC] py-12 flex items-center justify-center"> {/* Use theme color */}
    <div className="container mx-auto px-6 text-center">
     <Loader2 className="h-12 w-12 animate-spin text-[#8A4FFF] mx-auto" /> {/* Use theme color */}
     <p className="mt-4 text-muted-foreground">Loading your plans...</p>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-[calc(100vh-200px)] bg-[#F9FAFC] py-12"> {/* Use theme color */}
   <div className="container mx-auto px-6">
    <div className="text-center mb-12">
     <h1 className="text-4xl font-bold font-display mb-3 text-[#8A4FFF]">Choose Your Plan</h1> {/* Use theme color */}
     <p className="text-lg text-gray-600 max-w-2xl mx-auto">Unlock more stories and features with our subscription plans.</p>
    </div>

    {/* Pricing Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
     {plans.map((plan) => {
      const isCurrentUserPlan = profile?.active_plan_price_id === plan.priceId && profile?.subscription_status === 'active';
      const isSubscribed = profile?.subscription_status === 'active';
      // Disable button if redirecting or Stripe key missing/invalid
      const isButtonDisabled = isRedirecting[plan.priceId] || !STRIPE_PUBLISHABLE_KEY || !STRIPE_PUBLISHABLE_KEY.startsWith('pk_');

      return (
       <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-[#8A4FFF] border-2 shadow-lg' : 'border-gray-200'}`}> {/* Use theme color */}
        {plan.popular && (
         <div className="bg-[#8A4FFF] text-white text-xs font-bold uppercase tracking-wider text-center py-1 rounded-t-lg -mt-px mx-[-1px]"> {/* Use theme color */}
          Most Popular
         </div>
        )}
        <CardHeader className="pb-4">
         <CardTitle className="text-2xl font-semibold text-gray-800">{plan.name}</CardTitle>
         <CardDescription className="flex items-baseline gap-1 pt-1">
          <span className="text-4xl font-bold text-gray-900">${plan.priceMonthly.toFixed(2)}</span>
          <span className="text-lg text-gray-500">/ month</span>
         </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
         <ul className="space-y-3 text-gray-600 text-sm">
          {plan.features.map((feature, index) => (
           <li key={index} className="flex items-start">
            <Check className="h-4 w-4 mr-2 text-[#06D6A0] flex-shrink-0 mt-0.5" /> {/* Use theme color */}
            <span>{feature}</span>
           </li>
          ))}
         </ul>
        </CardContent>
        <CardFooter>
         {isCurrentUserPlan ? (
          <Button variant="outline" disabled className="w-full h-11 cursor-default">
           <Check className="mr-2 h-4 w-4" /> Current Plan
          </Button>
         ) : isSubscribed ? (
          <Button
           variant="outline"
           onClick={() => {
            // TODO: Redirect to Stripe Customer Portal or custom billing page
            // Example: router.push('/account/billing');
            toast({ title: "Manage Subscription", description: "Redirect to billing management (TODO)." });
           }}
           className="w-full h-11"
          >
           Manage Plan
          </Button>
         ) : (
          <Button
           onClick={() => handleSubscribe(plan.priceId)}
           disabled={isButtonDisabled}
           className={`w-full h-11 ${plan.popular ? 'bg-[#8A4FFF] hover:bg-[#7a3dff]' : 'bg-[#4FB8FF] hover:bg-[#4FB8FF]/90'} text-white`} // Use theme colors
           aria-label={`Subscribe to ${plan.name}`}
          >
           {isRedirecting[plan.priceId] ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<LogIn className="mr-2 h-4 w-4" />)}
           {plan.cta}
          </Button>
         )}
        </CardFooter>
       </Card>
      );
     })}
    </div>

    <div className="text-center mt-10 text-sm text-gray-500">
     <p>Subscriptions automatically renew monthly. You can manage or cancel your subscription anytime from your dashboard.</p>
     <p className="mt-2">
      By subscribing, you agree to our{' '}
      {/* Use Next Link for internal policy pages if they exist, otherwise use <a> */}
      <Link href="/terms" className="underline hover:text-[#4FB8FF]">Terms of Service</Link> and{' '}
      <Link href="/privacy" className="underline hover:text-[#4FB8FF]">Privacy Policy</Link>.
     </p>
    </div>
   </div>
  </div>
 );
}