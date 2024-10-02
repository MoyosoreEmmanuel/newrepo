import React from "react";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

const LoginForm: React.FC = () => {
  return (
    <form noValidate autoComplete="off" className="space-y-6 w-full">
      <div className="space-y-4">
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-rose-600 focus:border-rose-600 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="user@email.com"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-rose-600 focus:border-rose-600 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="******"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            className="text-rose-600 bg-white dark:bg-gray-800 focus:ring-rose-600 border-gray-300 dark:border-gray-600"
          />
          <label
            htmlFor="terms"
            className="text-sm text-gray-900 dark:text-gray-100"
          >
            Remember me
          </label>
        </div>
      </div>

      <div>
        <Link
          href="/dashboard"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-600"
        >
          Login
        </Link>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
        {"Don't"} have an account?{" "}
        <Link href="/register" className="text-rose-600 hover:text-rose-700">
          Create an account
        </Link>
      </div>

      <div className="flex items-center justify-center mt-6">
        <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mx-4">or</div>
        <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
      </div>

      <div className="flex flex-row justify-center items-center space-x-2">
        <FaGoogle className="text-rose-600 text-md" />
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:text-rose-600">
          Continue with Google
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
