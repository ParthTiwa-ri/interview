import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-blue-600">InterviewPrep AI</h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to continue to InterviewPrep AI</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              footerActionLink: "text-blue-600 hover:text-blue-800",
            },
          }}
          routing="path"
          path="/sign-in"
          redirectUrl="/"
        />
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
} 