import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    // This will center the sign-up form on the page
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
