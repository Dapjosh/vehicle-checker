import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        forceRedirectUrl="/wait-list"
        fallbackRedirectUrl="/wait-list"
      />
    </div>
  );
}
