"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { isWithinInterval, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Treemap } from "recharts";
import * as XLSX from 'xlsx';
import 'jspdf-autotable';

// Helper function to generate colors for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

// Interface definitions
interface AIRequest {
  createdAt: string;
  appleDetections: any[];
  treeDetections: any[];
  fileName: string;
}

// Update the BarChartData interface
interface BarChartData {
  [key: string]: any;  // Allows any property names with string keys
  apples: number;
  trees: number;
  applesComparison?: number;
  treesComparison?: number;
}

import { Trees, Apple, Calculator } from 'lucide-react'; // Import icons

function prepareExportData(data: BarChartData[]) {
  const totals = data.reduce((acc, item) => {
    acc.totalApples += item.apples;
    acc.totalTrees += item.trees;
    return acc;
  }, { totalApples: 0, totalTrees: 0 });

  return {
    rows: data,
    totals
  };
}

function exportToCSV(data: BarChartData[], filename: string) {
  const { rows, totals } = prepareExportData(data);
  const csvRows = [];
  const headers = Object.keys(rows[0]);
  csvRows.push(headers.join(','));

  rows.forEach(row => {
    const values = headers.map(header => `"${('' + row[header]).replace(/"/g, '\\"')}"`);
    csvRows.push(values.join(','));
  });

  csvRows.push(`"Total Apples","${totals.totalApples}"`);
  csvRows.push(`"Total Trees","${totals.totalTrees}"`);

  const csvData = csvRows.join('\n');
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
  link.remove();
}

function exportToExcel(data: BarChartData[], filename: string) {
  const { rows, totals } = prepareExportData(data);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Add totals in a new sheet
  const totalsSheet = XLSX.utils.json_to_sheet([totals]);
  XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Totals');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend the jsPDF type to include autoTable
interface ExtendedJsPDF extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: {
    finalY: number;
  };
}

function exportToPDF(data: BarChartData[], filename: string) {
  const { rows, totals } = prepareExportData(data);
  const doc = new jsPDF() as ExtendedJsPDF;

  doc.autoTable({
    head: [Object.keys(rows[0])],
    body: rows.map(row => Object.values(row)),
    theme: 'grid'
  });

  doc.autoTable({
    head: [['Total Apples', 'Total Trees']],
    body: [[totals.totalApples, totals.totalTrees]],
    startY: doc.lastAutoTable.finalY + 10,
    theme: 'grid'
  });

  doc.save(`${filename}.pdf`);
}

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIRequest[]>([]);
  const [chartType, setChartType] = useState("Bar Chart");

  // Timeframe 1: Main data
  const [barChartData, setBarChartData] = useState<BarChartData[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Timeframe 2: Comparison data
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | undefined>(undefined);
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add these new state variables
  const [totalTreesTimeframe, setTotalTreesTimeframe] = useState(0);
  const [totalApplesTimeframe, setTotalApplesTimeframe] = useState(0);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      const q = query(
        collection(database, "aiRequests"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const requests: AIRequest[] = querySnapshot.docs.map((doc) => doc.data() as AIRequest);

      setData(requests);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // Update the data preparation logic
  useEffect(() => {
    if (startDate && endDate) {
      const filteredData = data.filter((request) => {
        const requestDate = parseISO(request.createdAt);
        return isWithinInterval(requestDate, { start: startDate, end: endDate });
      });

      // Calculate totals for the entire timeframe
      const timeframeTotals = filteredData.reduce((acc, item) => {
        acc.trees += item.treeDetections.length;
        acc.apples += item.appleDetections.length;
        return acc;
      }, { trees: 0, apples: 0 });

      setTotalTreesTimeframe(timeframeTotals.trees);
      setTotalApplesTimeframe(timeframeTotals.apples);

      // Calculate the starting index of the items for the current page
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

      let barData: BarChartData[] = paginatedData.map((request) => ({
        fileName: request.fileName,
        apples: request.appleDetections.length,
        trees: request.treeDetections.length,
        applesComparison: 0,  // Initialize with 0
        treesComparison: 0,   // Initialize with 0
      }));

      if (compareMode && comparisonStartDate && comparisonEndDate) {
        const filteredComparisonData = data.filter((request) => {
          const requestDate = parseISO(request.createdAt);
          return isWithinInterval(requestDate, { start: comparisonStartDate, end: comparisonEndDate });
        });

        // Merge comparison data with primary data
        barData = barData.map((item) => {
          const matchingComparisonItem = filteredComparisonData.find(
            (compItem) => compItem.fileName === item.fileName
          );
          return {
            ...item,
            applesComparison: matchingComparisonItem?.appleDetections.length ?? 0,
            treesComparison: matchingComparisonItem?.treeDetections.length ?? 0,
          };
        });

        // Add items from comparison data that don't exist in primary data
        filteredComparisonData.forEach((compItem) => {
          if (!barData.some(item => item.fileName === compItem.fileName)) {
            barData.push({
              fileName: compItem.fileName,
              apples: 0,
              trees: 0,
              applesComparison: compItem.appleDetections.length,
              treesComparison: compItem.treeDetections.length,
            });
          }
        });
      }

      setBarChartData(barData);
    }
  }, [startDate, endDate, comparisonStartDate, comparisonEndDate, compareMode, data, currentPage, itemsPerPage]);

  // Memoized Data to Avoid Recomputations
  const memoizedBarChartData = useMemo(() => barChartData, [barChartData]);

  const currentChartTotals = useMemo(() => ({
    trees: barChartData.reduce((sum, item) => sum + item.trees, 0),
    apples: barChartData.reduce((sum, item) => sum + item.apples, 0),
    treesComparison: compareMode ? barChartData.reduce((sum, item) => sum + (item.treesComparison || 0), 0) : null,
    applesComparison: compareMode ? barChartData.reduce((sum, item) => sum + (item.applesComparison || 0), 0) : null,
  }), [barChartData, compareMode]);

  // Loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  // Define CustomTooltip component
  const CustomTooltip = ({ active, payload, label }: { active: boolean; payload: any[]; label: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-2 border rounded shadow">
          <p className="label font-bold">{`${label}`}</p>
          <p className="intro">{`Apples: ${payload[0].value}`}</p>
          <p className="desc">{`Trees: ${payload[1].value}`}</p>
          {payload.length > 2 && (
            <>
              <p className="intro">{`Apples (Comparison): ${payload[2].value}`}</p>
              <p className="desc">{`Trees (Comparison): ${payload[3].value}`}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Add this function to handle changes in items per page
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard with Timeframe Comparison</h1>

      <div className="flex justify-between items-center mb-6">
        {/* Summary Statistics */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 bg-green-100 p-3 rounded-lg">
            <Trees className="w-8 h-8 text-green-600" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Total Trees (Timeframe)</span>
              <span className="font-semibold text-lg text-green-700">
                {totalTreesTimeframe}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-red-100 p-3 rounded-lg">
            <Apple className="w-8 h-8 text-red-600" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Total Apples (Timeframe)</span>
              <span className="font-semibold text-lg text-red-700">
                {totalApplesTimeframe}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-blue-100 p-3 rounded-lg">
            <Calculator className="w-8 h-8 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">Avg Apples per Tree (Timeframe)</span>
              <span className="font-semibold text-lg text-blue-700">
                {totalTreesTimeframe > 0 ? (totalApplesTimeframe / totalTreesTimeframe).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Date Pickers and Controls */}
        <div className="flex items-center space-x-4">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date ?? undefined)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className="border rounded p-2"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date ?? undefined)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="End Date"
            className="border rounded p-2"
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="mr-2"
            />
            Compare Timeframes
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="Bar Chart">Bar Chart</option>
            <option value="Stacked Bar Chart">Stacked Bar Chart</option>
            <option value="Line Chart">Line Chart</option>
            <option value="Pie Chart">Pie Chart</option>
            <option value="Radar Chart">Radar Chart</option>
            <option value="Cumulative Sum Graph">Cumulative Sum Graph</option>
            <option value="Box Plot">Box Plot</option>
            <option value="Scatter Plot">Scatter Plot</option>
            <option value="Tree Map">Tree Map</option>
            <option value="Line Chart with Forecasting">Line Chart with Forecasting</option>
            <option value="Control Chart">Control Chart</option>
          </select>
        </div>
      </div>

      {/* Comparison Timeframe Date Pickers */}
      {compareMode && (
        <div className="flex items-center space-x-4 mb-6">
          <DatePicker
            selected={comparisonStartDate}
            onChange={(date) => setComparisonStartDate(date ?? undefined)}
            selectsStart
            startDate={comparisonStartDate}
            endDate={comparisonEndDate}
            placeholderText="Comparison Start Date"
            className="border rounded p-2"
          />
          <DatePicker
            selected={comparisonEndDate}
            onChange={(date) => setComparisonEndDate(date ?? undefined)}
            selectsEnd
            startDate={comparisonStartDate}
            endDate={comparisonEndDate}
            placeholderText="Comparison End Date"
            className="border rounded p-2"
          />
        </div>
      )}

      {/* Move this section just above the chart */}
      <div className="mb-4 bg-gray-100 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Current Chart Totals</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-green-600 font-medium">Trees: {currentChartTotals.trees}</span>
          </div>
          <div>
            <span className="text-red-600 font-medium">Apples: {currentChartTotals.apples}</span>
          </div>
          {compareMode && (
            <>
              <div>
                <span className="text-green-600 font-medium">Trees (Comparison): {currentChartTotals.treesComparison}</span>
              </div>
              <div>
                <span className="text-red-600 font-medium">Apples (Comparison): {currentChartTotals.applesComparison}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart goes here */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {compareMode
            ? `Comparing ${chartType} for Selected Time Frames`
            : `Showing ${chartType} for Selected Time Frame`}
        </h2>

        {/* Visualization Area */}
        <div style={{ width: '100%', height: 400 }}>
          {/* Example: Bar Chart */}
          {chartType === "Bar Chart" && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={memoizedBarChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip content={<CustomTooltip active={false} payload={[]} label={""} />} />
                <Legend />
                <Bar dataKey="apples" fill="#8884d8" name="Apples (Primary)" barSize={20} />
                <Bar dataKey="trees" fill="#82ca9d" name="Trees (Primary)" barSize={20} />
                {compareMode && (
                  <>
                    <Bar dataKey="applesComparison" fill="#ffc658" name="Apples (Comparison)" barSize={20} />
                    <Bar dataKey="treesComparison" fill="#ff8042" name="Trees (Comparison)" barSize={20} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Stacked Bar Chart */}
          {chartType === "Stacked Bar Chart" && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={memoizedBarChartData} stackOffset="expand">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="apples" stackId="a" fill="#8884d8" name="Apples (Primary)" />
                <Bar dataKey="trees" stackId="a" fill="#82ca9d" name="Trees (Primary)" />
                {compareMode && (
                  <>
                    <Bar dataKey="applesComparison" stackId="b" fill="#ffc658" name="Apples (Comparison)" />
                    <Bar dataKey="treesComparison" stackId="b" fill="#ff8042" name="Trees (Comparison)" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Line Chart */}
          {chartType === "Line Chart" && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={memoizedBarChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="apples" stroke="#8884d8" name="Apples (Primary)" />
                <Line type="monotone" dataKey="trees" stroke="#82ca9d" name="Trees (Primary)" />
                {compareMode && (
                  <>
                    <Line type="monotone" dataKey="applesComparison" stroke="#ffc658" name="Apples (Comparison)" />
                    <Line type="monotone" dataKey="treesComparison" stroke="#ff8042" name="Trees (Comparison)" />
                    <Area type="monotone" dataKey="difference" stroke="#8884d8" fillOpacity={0.3} fill="url(#colorUv)" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Pie Chart */}
          {chartType === "Pie Chart" && (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={memoizedBarChartData}
                  dataKey="apples"
                  nameKey="fileName"
                  cx="25%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {memoizedBarChartData.map((entry, index) => (
                    <Cell key={`cell-apples-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Pie
                  data={memoizedBarChartData}
                  dataKey="trees"
                  nameKey="fileName"
                  cx="25%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={110}
                  fill="#82ca9d"
                  label
                >
                  {memoizedBarChartData.map((entry, index) => (
                    <Cell key={`cell-trees-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {compareMode && (
                  <>
                    <Pie
                      data={memoizedBarChartData}
                      dataKey="applesComparison"
                      nameKey="fileName"
                      cx="75%"
                      cy="50%"
                      outerRadius={80}
                      fill="#ffc658"
                      label
                    >
                      {memoizedBarChartData.map((entry, index) => (
                        <Cell key={`cell-apples-comp-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Pie
                      data={memoizedBarChartData}
                      dataKey="treesComparison"
                      nameKey="fileName"
                      cx="75%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={110}
                      fill="#ff8042"
                      label
                    >
                      {memoizedBarChartData.map((entry, index) => (
                        <Cell key={`cell-trees-comp-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </>
                )}
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Radar Chart */}
          {chartType === "Radar Chart" && (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart outerRadius={150} width={730} height={250}>
                <PolarGrid />
                <PolarAngleAxis dataKey="fileName" />
                <PolarRadiusAxis />
                <Radar
                  name="Apples (Primary)"
                  dataKey="apples"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Trees (Primary)"
                  dataKey="trees"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
                {compareMode && (
                  <>
                    <Radar
                      name="Apples (Comparison)"
                      dataKey="applesComparison"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Trees (Comparison)"
                      dataKey="treesComparison"
                      stroke="#ff8042"
                      fill="#ff8042"
                      fillOpacity={0.6}
                    />
                  </>
                )}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}

          {/* Cumulative Sum Graph (Area Chart) */}
          {chartType === "Cumulative Sum Graph" && (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={memoizedBarChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="apples" stroke="#8884d8" fill="#8884d8" name="Apples" />
                <Area type="monotone" dataKey="trees" stroke="#82ca9d" fill="#82ca9d" name="Trees" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Box Plot */}
          {chartType === "Box Plot" && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={memoizedBarChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="apples" fill="#8884d8" name="Apples" />
                <Bar dataKey="trees" fill="#82ca9d" name="Trees" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Scatter Plot */}
          {chartType === "Scatter Plot" && (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trees" name="Trees" />
                <YAxis dataKey="apples" name="Apples" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend />
                <Scatter name="Tree vs. Apple Correlation" data={memoizedBarChartData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          )}

          {/* Tree Map */}
          {chartType === "Tree Map" && (
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={memoizedBarChartData}
                dataKey="apples"
                stroke="#fff"
                fill="#8884d8"
              />
            </ResponsiveContainer>
          )}

          {/* Line Chart with Forecasting */}
          {chartType === "Line Chart with Forecasting" && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={memoizedBarChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="apples" stroke="#8884d8" name="Apples (Primary)" />
                <Line type="monotone" dataKey="trees" stroke="#82ca9d" name="Trees (Primary)" />
                {compareMode && (
                  <>
                    <Line type="monotone" dataKey="applesComparison" stroke="#ffc658" name="Apples (Comparison)" />
                    <Line type="monotone" dataKey="treesComparison" stroke="#ff8042" name="Trees (Comparison)" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Control Chart */}
          {chartType === "Control Chart" && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={memoizedBarChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fileName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="apples" stroke="#8884d8" name="Apples (Primary)" />
                <Line type="monotone" dataKey="trees" stroke="#82ca9d" name="Trees (Primary)" />
                {compareMode && (
                  <>
                    <Line type="monotone" dataKey="applesComparison" stroke="#ffc658" name="Apples (Comparison)" />
                    <Line type="monotone" dataKey="treesComparison" stroke="#ff8042" name="Trees (Comparison)" />
                  </>
                )}
                {/* Upper and Lower Control Limits */}
                <Line type="monotone" dataKey="upperLimit" stroke="red" name="Upper Control Limit" dot={false} />
                <Line type="monotone" dataKey="lowerLimit" stroke="green" name="Lower Control Limit" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
          >
            Prev
          </button>
          <span>Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= data.length}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
            Items per page:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex justify-end space-x-4 mt-8">
        <button 
          onClick={() => exportToCSV(barChartData, 'chart-data')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to CSV
        </button>
        <button 
          onClick={() => exportToExcel(barChartData, 'chart-data')}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to Excel
        </button>
        <button 
          onClick={() => exportToPDF(barChartData, 'chart-data')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export to PDF
        </button>
      </div>
    </div>
  );
}