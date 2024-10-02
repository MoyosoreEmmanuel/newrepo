"use client";

import AuthNavbar from "@/app/components/AuthNavbar";
import Footer from "@/app/components/Footer";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Image from "next/image";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";

export default function SignInPage() {
  return (
    <SignIn.Root>
      <SignIn.Step name="start" className="pb-4">
        <div className="min-h-screen flex flex-col justify-between bg-gray-50 dark:bg-black">
          <AuthNavbar />
          <div className="flex-grow flex items-center justify-center px-6 pb-6 md:py-2 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl w-full bg-white dark:bg-black shadow-custom shadow-lg rounded-lg overflow-hidden">
              <div className="hidden md:flex md:w-1/2 justify-center items-center p-8">
                <Image
                  src="/logo.png"
                  alt="CropMind"
                  width={350}
                  height={350}
                  className="object-contain"
                />
              </div>

              <div className="flex flex-col justify-center p-6 md:p-10 w-full md:w-1/2 lg:w-1/2 h-full overflow-y-auto">
                <div className="md:flex md:flex-col md:justify-center md:items-start md:h-full">
                  <h1 className="text-2xl md:text-xl lg:text-3xl text-gray-900 dark:text-gray-100">
                    Welcome to Apple Crop Detection! 👋
                  </h1>
                  <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg lg:text-xl mb-6 leading-relaxed">
                    Please sign in to your account and start the adventure.
                  </p>

                  <Clerk.GlobalError className="block text-sm text-red-400" />
                  <div className="space-y-6 w-full">
                    <div className="space-y-4">
                      <div className="mb-4">
                        <Clerk.Field name="identifier">
                          <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                          </Clerk.Label>
                          <Clerk.Input
                            type="email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                            placeholder="user@email.com"
                          />
                          <Clerk.FieldError className="block text-sm text-red-400" />
                        </Clerk.Field>
                      </div>
                      <div className="mb-4">
                        <Clerk.Field name="password">
                          <Clerk.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                          </Clerk.Label>
                          <Clerk.Input
                            type="password"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-custom focus:border-custom sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                            placeholder="******"
                          />
                          <Clerk.FieldError className="block text-sm text-red-400" />
                        </Clerk.Field>
                      </div>
                    </div>

                    <SignIn.Action
                      submit
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-custom hover:bg-custom focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
                    >
                      Login
                    </SignIn.Action>

                    <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
                      {"Don't"} have an account?{" "}
                      <Link
                        href="/sign-up"
                        className="text-custom hover:text-custom"
                      >
                        Create an account
                      </Link>
                    </div>

                    <div className="flex items-center justify-center mt-6">
                      <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mx-4">
                        or
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
                    </div>

                    <div className="flex flex-row justify-center items-center space-x-2">
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
          </div>
          <Footer />
        </div>
      </SignIn.Step>
    </SignIn.Root>
  );
}
