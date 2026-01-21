'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  BarChart3, 
  FileText, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { submitLeadAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export default function LandingPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitLeadAction(formData);
      if (result.success) {
        setSubmitted(true);
        toast({
          title: "Request Received!",
          description: "Our team will review your details and contact you shortly.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  }

  const features = [
    {
      icon: FileText,
      title: "Digital Inspection Reports",
      description: "Replace paper checklists with easy-to-use digital forms. Drivers can complete inspections in minutes."
    },
    {
      icon: Truck,
      title: "Fleet Management",
      description: "Keep track of all your vehicles, odometer readings, and assignment history in one central dashboard."
    },
    {
      icon: ShieldCheck,
      title: "Compliance & Safety",
      description: "Ensure every vehicle is road-worthy before it leaves the lot. Pass/Fail verdicts are logged instantly."
    },
    {
      icon: BarChart3,
      title: "Data & Exporting",
      description: "Export reports to CSV for analysis. Maintain a permanent audit trail of all inspections."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen main-wrap">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center bg-[#262626] sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <span className="text-yellow-300">FleetCheckr</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-md font-medium hover:underline underline-offset-4 flex items-center">
            Features
          </Link>
          <Link href="#contact" className="text-md font-medium hover:underline underline-offset-4 flex items-center">
            Contact
          </Link>
          <Link href="/sign-in" className="border border-yellow-300 px-4 py-2 rounded-md text-md font-medium text-yellow-300 hover:bg-yellow-300 hover:text-neutral-900 transition flex items-center">
            Log In
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}

        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden">
        
          <div className="absolute inset-0 -z-10 bg-[#262626]">
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            
            {/* Animated Orbs */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
          {/* --- ANIMATED BACKGROUND END --- */}

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center align-start space-y-4 text-center">
              <div className="flex flex-col items-center space-y-5">
            
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-yellow-900 via-yellow-800 to-yellow-600">
                  Fleet Inspections, <br className="hidden sm:inline" />
                  <span className="text-yellow-300">Reimagined.</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-white md:text-xl font-medium">
                  Streamline your vehicle checks, ensure compliance, and manage your fleet with our powerful digital inspection platform.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Button className="h-12 px-8 text-lg bg-[#03624C] shadow-lg hover:bg-[#03624C]/80 hover:shadow-xl transition-all hover:-translate-y-0.5" asChild>
                  <Link href="#contact">Request Access <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
                <Button variant="outline" className="bg-yellow-300/30 h-12 px-8 text-lg backdrop-blur-sm hover:bg-yellow-300/80" asChild>
                  <Link href="/sign-in">Existing User?</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-[#03624C] px-5 py-3 text-sm text-white">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter text-black sm:text-5xl">Everything you need to manage inspections</h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
              {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 border-gray-200 p-4 rounded-lg">
                  <div className="p-3 bg-yellow-300/10 rounded-full">
                    <feature.icon className="h-8 w-8 text-[#03624C]" />
                  </div>
                  <h3 className="text-xl text-[#03624C] text-center font-bold">{feature.title}</h3>
                  <p className="text-sm text-gray-500 text-center">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / Onboarding Form */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-[#262626] text-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to manage your fleet?
                </h2>
                <p className="max-w-[600px] text-gray-300 md:text-xl">
                  FleetCheckr is currently in an exclusive access period. 
                  Fill out the form to schedule a demo and get your organization onboarded.
                </p>
                <ul className="grid gap-2 py-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#03624C]" />
                    <span>Dedicated Organization Workspace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#03624C]" />
                    <span>Custom Inspection Checklists</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#03624C]" />
                    <span>Driver & Vehicle Management</span>
                  </li>
                </ul>
              </div>

              {/* Form Card */}
              <Card className="text-gray-900 bg-white w-full max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-[#03624C]">Request Access</CardTitle>
                  <CardDescription>
                    Tell us about your fleet. We'll set up your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                      <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-semibold">Request Received!</h3>
                      <p className="text-gray-500">
                        Thanks for your interest. An administrator will review your request and send an invitation link to your email shortly.
                      </p>
                      <Button variant="outline" className="text-white" onClick={() => setSubmitted(false)}>
                        Send another request
                      </Button>
                    </div>
                  ) : (
                    <form action={handleSubmit} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" className="bg-[#262626] border-white ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 text-white outline-none focus:border-white" name="name" required placeholder="John Doe" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input id="email" name="email"  className="bg-[#262626] border-white ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 text-white outline-none focus:border-white" type="email" required placeholder="john@company.com" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="companyName">Company</Label>
                          <Input id="companyName"  className="bg-[#262626] border-white ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 text-white outline-none focus:border-white" name="companyName" required placeholder="Acme Logistics" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="fleetSize">Fleet Size</Label>
                          <Input id="fleetSize"  className="bg-[#262626] border-white ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 text-white outline-none focus:border-white" name="fleetSize" required placeholder="e.g. 50" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="message">Additional Details (Optional)</Label>
                        <Textarea id="message"  className="bg-[#262626] border-white ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 text-white outline-none focus:border-white" name="message" placeholder="Tell us about your specific inspection needs..." />
                      </div>
                      <Button type="submit" className="w-full bg-[#03624C] hover:bg-[#03624C]/90" disabled={isPending}>
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending Request...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-[#262626]">
        <p className="text-xs text-gray-500">&copy; 2026 FleetCheckr Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}