"use client";

import React, { useState, useEffect } from "react";
import { FaSun, FaCloud, FaCloudRain, FaCloudSun } from "react-icons/fa";
import axios from "axios";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
  };
  weather: { description: string }[];
  wind: {
    speed: number;
  };
}

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius");

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Islamabad&units=metric&appid=cf74a3f03fb5504a47496f1a2cbbe8b7`
        );
        setWeatherData(response.data);
        setLoading(false);
      } catch (error) {
        setError("Error fetching weather data.");
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (loading) return <div>Loading weather data...</div>;
  if (error) return <div>{error}</div>;

  if (!weatherData) {
    return <div>No weather data available.</div>;
  }

  const { main, weather, wind } = weatherData;

  const getWeatherIcon = (description: string) => {
    if (description.includes("cloud"))
      return <FaCloudSun className="w-10 h-10 text-gray-500" />;
    if (description.includes("sun"))
      return <FaSun className="w-10 h-10 text-yellow-500" />;
    if (description.includes("rain"))
      return <FaCloudRain className="w-10 h-10 text-blue-500" />;
    return <FaSun className="w-10 h-10 text-yellow-500" />;
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden max-w-md mx-auto">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getWeatherIcon(weather[0].description)}
          <div>
            <h3 className="text-2xl font-semibold">
              {unit === "celsius" ? main.temp : (main.temp * 9) / 5 + 32}°
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {weather[0].description}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-right text-sm text-gray-500 dark:text-gray-400">
            Humidity: {main.humidity}%
          </p>
          <p className="text-right text-sm text-gray-500 dark:text-gray-400">
            Wind: {wind.speed} kph
          </p>
          <p className="text-right text-sm text-gray-500 dark:text-gray-400">
            Pressure: {main.pressure} hPa
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
          {/* Replace the hardcoded weather data with actual data as necessary */}
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Mon</p>
            <FaCloudSun className="w-6 h-6 text-gray-500 mt-2" />
            <p className="text-sm mt-2">68°</p>
          </div>
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Tue</p>
            <FaCloudSun className="w-6 h-6 text-gray-500 mt-2" />
            <p className="text-sm mt-2">70°</p>
          </div>
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Wed</p>
            <FaCloudRain className="w-6 h-6 text-gray-500 mt-2" />
            <p className="text-sm mt-2">65°</p>
          </div>
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Thu</p>
            <FaCloud className="w-6 h-6 text-gray-500 mt-2" />
            <p className="text-sm mt-2">67°</p>
          </div>
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Fri</p>
            <FaCloudSun className="w-6 h-6 text-gray-500 mt-2" />
            <p className="text-sm mt-2">70°</p>
          </div>
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Sat</p>
            <FaSun className="w-6 h-6 text-yellow-500 mt-2" />
            <p className="text-sm mt-2">75°</p>
          </div>
          <div className="p-2 flex flex-col items-center">
            <p className="text-sm">Sun</p>
            <FaSun className="w-6 h-6 text-yellow-500 mt-2" />
            <p className="text-sm mt-2">77°</p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <RadioGroup
          defaultValue="celsius"
          className="flex items-center justify-center space-x-4"
          onValueChange={(value) => setUnit(value as "celsius" | "fahrenheit")}
        >
          <Label
            htmlFor="fahrenheit"
            className="flex items-center gap-2 cursor-pointer"
          >
            <RadioGroupItem
              id="fahrenheit"
              value="fahrenheit"
              className="peer sr-only"
            />
            <span className="text-sm transition-colors text-gray-500 peer-aria-checked:text-gray-900 dark:text-gray-400 dark:peer-aria-checked:text-gray-50">
              °F
            </span>
          </Label>
          <Label
            htmlFor="celsius"
            className="flex items-center gap-2 cursor-pointer"
          >
            <RadioGroupItem
              id="celsius"
              value="celsius"
              className="peer sr-only"
            />
            <span className="text-sm transition-colors text-gray-500 peer-aria-checked:text-gray-900 dark:text-gray-400 dark:peer-aria-checked:text-gray-50">
              °C
            </span>
          </Label>
        </RadioGroup>
      </div>
    </div>
  );
};

export default WeatherWidget;
