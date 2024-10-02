"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import Image from "next/image";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";
import AuthNavbar from "@/app/components/AuthNavbar";
import Footer from "@/app/components/Footer";

export default function RegisterPage() {
  return (
    <SignUp.Root>
      {/* Sign-Up Step */}
      <SignUp.Step name="start" className="pb-4">
        <div className="min-h-screen flex flex-col justify-between bg-gray-50 dark:bg-black">
          <AuthNavbar />
          <div className="flex-grow flex items-center justify-center px-6 pb-6 md:py-2 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl w-full bg-white dark:bg-black shadow-lg rounded-lg shadow-custom overflow-hidden">
              {/* Image Section */}
              <div className="hidden md:flex md:w-1/2 justify-center items-center p-8">
                <Image
                  src="/logo.png"
                  alt="CropMind"
                  width={350}
                  height={350}
                  className="object-contain"
                />
              </div>

              {/* Text and Form Section */}
              <div className="flex flex-col justify-center p-6 md:p-10 w-full md:w-1/2 lg:w-1/2 h-full overflow-y-auto">
                <div className="md:flex md:flex-col md:justify-center md:items-start md:h-full">
                  <h1 className="text-2xl md:text-xl lg:text-3xl text-gray-900 dark:text-gray-100">
                    Welcome to Apple Crop Detection! 👋
                  </h1>
                  <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg lg:text-xl mb-6 leading-relaxed">
                    Adventure starts here 🚀
                  </p>
                  <div className="space-y-6 w-full">
                    <div className="space-y-2">
                      <Clerk.Field name="firstName" className="mb-2">
                        <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          First Name
                        </Clerk.Label>
                        <Clerk.Input
                          type="text"
                          id="first_name"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                          placeholder="First Name"
                        />
                        <Clerk.FieldError className="block text-sm text-red-400" />
                      </Clerk.Field>

                      <Clerk.Field name="lastName" className="mb-2">
                        <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Last Name
                        </Clerk.Label>
                        <Clerk.Input
                          type="text"
                          id="last_name"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                          placeholder="Last Name"
                        />
                        <Clerk.FieldError className="block text-sm text-red-400" />
                      </Clerk.Field>

                      <Clerk.Field name="emailAddress" className="mb-2">
                        <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </Clerk.Label>
                        <Clerk.Input
                          type="email"
                          id="email"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                          placeholder="user@email.com"
                        />
                        <Clerk.FieldError className="block text-sm text-red-400" />
                      </Clerk.Field>

                      <Clerk.Field name="password" className="mb-2">
                        <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password
                        </Clerk.Label>
                        <Clerk.Input
                          type="password"
                          id="password"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                          placeholder="******"
                        />
                        <Clerk.FieldError className="block text-sm text-red-400" />
                      </Clerk.Field>
                    </div>

                    <SignUp.Action
                      submit
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-custom hover:bg-custom focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
                    >
                      Sign up
                    </SignUp.Action>
                  </div>

                  <div className="font-medium text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
                    Already have an account?{" "}
                    <Link
                      href="/sign-in"
                      className="text-custom hover:text-custom"
                    >
                      Sign in instead
                    </Link>
                  </div>
                  <div className="space-y-6 w-full flex-col justify-center">
                    <div className="w-full flex items-center justify-center mt-6">
                      <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mx-4">
                        or
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
                    </div>

                    <div className=" w-full flex flex-row justify-center items-center space-x-2">
                      <FaGoogle className="text-custom text-md" />
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:text-custom">
                        <Clerk.Connection name="google">
                          Continue with Google
                        </Clerk.Connection>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>{" "}
          <Footer />
        </div>
      </SignUp.Step>

      {/* Verification Step */}
      <SignUp.Step name="verifications">
        <div className="min-h-screen flex flex-col justify-between bg-gray-50 dark:bg-black">
          <AuthNavbar />
          <div className="flex-grow flex items-center justify-center px-6 pb-6 md:py-2 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl w-full bg-white dark:bg-black shadow-lg rounded-lg overflow-hidden">
              {/* Image Section */}
              <div className="hidden md:flex md:w-1/2 justify-center items-center p-8">
                <Image
                  src="/apple.png"
                  alt="CropMind"
                  width={350}
                  height={350}
                  className="object-contain"
                />
              </div>

              {/* Text and Form Section */}
              <div className="flex flex-col justify-center p-6 md:p-10 w-full md:w-1/2 lg:w-1/2 h-full overflow-y-auto">
                <div className="md:flex md:flex-col md:justify-center md:items-start md:h-full">
                  <h1 className="text-2xl md:text-xl lg:text-3xl text-gray-900 dark:text-gray-100">
                    Verify your email
                  </h1>
                  <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg lg:text-xl mb-6 leading-relaxed">
                    {"We've"} sent a code to your email. Please enter it below.
                  </p>
                  <div className="space-y-6 w-full">
                    <Clerk.Field name="code" className="mb-2">
                      <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Code
                      </Clerk.Label>
                      <Clerk.Input
                        type="text"
                        id="code"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                        placeholder="Enter the code"
                      />
                      <Clerk.FieldError className="block text-sm text-red-400" />
                    </Clerk.Field>

                    <SignUp.Action
                      submit
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-custom hover:bg-custom focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
                    >
                      Continue
                    </SignUp.Action>
                  </div>
                </div>
              </div>
            </div>
          </div>{" "}
          <Footer />
        </div>
      </SignUp.Step>
    </SignUp.Root>
  );
}
