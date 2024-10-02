"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  deleteDoc,
  doc,
  writeBatch,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@clerk/nextjs";
import { database} from "@/firebaseConfig";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, RefreshCw, AppleIcon, TreePineIcon } from "lucide-react";
import AppleDetectionDialog from "./components/AppleDetectionDialog";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { groupBy } from "lodash";
import { useUser } from "@clerk/nextjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from 'next/image';

interface Detection {
  confidence: number;
  box: number[];
  class?: string;
}

interface AIRequest {
  id: string;
  fileName: string;
  downloadURL: string;
  createdAt: string;
  processingStartTime: Date;
  processingEndTime: Date;
  status: string;
  tokenId: string;
  userId: string;
  appleDetections: Detection[];
  treeDetections: Detection[];
  visualizations: string[];
  sessionId: string; // Added sessionId to the interface
}

export default function AiHistory() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [aiRequests, setAIRequests] = useState<AIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState("");
  const [timeFrame, setTimeFrame] = useState("all");
  const [groupedRequests, setGroupedRequests] = useState<{ [key: string]: AIRequest[] }>({});
  const [groupedSessions, setGroupedSessions] = useState<{ [key: string]: AIRequest[] }>({});
  const { toast } = useToast();
  const [totalApples, setTotalApples] = useState(0);
  const [totalTrees, setTotalTrees] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const filterRequestsByDateRange = (requests: AIRequest[], start: Date | null, end: Date | null) => {
    if (!start && !end) return requests;
    return requests.filter(request => {
      const requestDate = new Date(request.createdAt);
      if (start && end) {
        return requestDate >= start && requestDate <= end;
      } else if (start) {
        return requestDate >= start;
      } else if (end) {
        return requestDate <= end;
      }
      return true;
    });
  };

  const fetchAIRequests = useCallback((retryCount = 0) => {
    if (!userId || !user) {
      console.error("User not authenticated");
      toast({
        title: "Authentication Error",
        description: "Please sign in to view your AI history.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log("Fetching AI requests for user:", userId);

    const q = query(
      collection(database, "aiRequests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("Query snapshot size:", querySnapshot.size);
        const requestsData = querySnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
  sessionId: doc.data().sessionId || "Unknown Session",  // Assign default if sessionId is missing
  processingStartTime: doc.data().processingStartTime?.toDate(),
  processingEndTime: doc.data().processingEndTime?.toDate(),
})) as AIRequest[];


        const filteredRequests = filterRequestsByDateRange(requestsData, startDate, endDate);
        
        // Group by date (existing grouping)
        const groupedByDate = groupBy(filteredRequests, (request) =>
          format(new Date(request.createdAt), "yyyy-MM-dd")
        );
        setGroupedRequests(groupedByDate);

        // Group by session ID (new grouping)
        const groupedBySession = groupBy(filteredRequests, "sessionId");
        setGroupedSessions(groupedBySession);

        setAIRequests(filteredRequests);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Error fetching AI requests:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        if (retryCount < 3) {
          console.log(`Retrying... Attempt ${retryCount + 1}`);
          setTimeout(() => fetchAIRequests(retryCount + 1), 1000 * (retryCount + 1));
        } else {
          setError(`Failed to fetch AI requests after multiple attempts: ${error.message}`);
          setLoading(false);
          setRefreshing(false);
          toast({
            title: "Error",
            description: `Failed to fetch AI requests after multiple attempts: ${error.message}`,
            variant: "destructive",
          });
        }
      }
    );

    setUnsubscribe(() => unsub);
  }, [userId, user, toast, startDate, endDate]);

  useEffect(() => {
    if (userId && user) {
      fetchAIRequests();
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchAIRequests, userId, user, unsubscribe]);

  useEffect(() => {
    const appleSum = aiRequests.reduce((sum, request) => sum + request.appleDetections.length, 0);
    const treeSum = aiRequests.reduce((sum, request) => sum + request.treeDetections.length, 0);
    setTotalApples(appleSum);
    setTotalTrees(treeSum);
  }, [aiRequests]);

  const formatDate = useCallback((dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss");
  }, []);

  const handleDelete = useCallback(
    async (requestId: string, fileName: string) => {
      setDeletingId(requestId);
      try {
        await deleteDoc(doc(database, "aiRequests", requestId));
        toast({
          title: "Request Deleted",
          description: `${fileName} has been successfully deleted.`,
        });
      } catch (error) {
        console.error("Error deleting request:", error);
        toast({
          title: "Error",
          description: `Failed to delete ${fileName}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [toast]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (unsubscribe) {
      unsubscribe();
    }
    fetchAIRequests();
  }, [fetchAIRequests, unsubscribe]);

  const handleDeleteAll = useCallback(async () => {
    if (deleteAllConfirmation !== "DELETE-ALL-HISTORY") {
      toast({
        title: "Error",
        description: "Please enter the correct confirmation text.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(database);
      aiRequests.forEach((request) => {
        const requestRef = doc(database, "aiRequests", request.id);
        batch.delete(requestRef);
      });
      await batch.commit();
      toast({
        title: "All Requests Deleted",
        description: "All AI requests have been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting all requests:", error);
      toast({
        title: "Error",
        description: "Failed to delete all requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDeleteAllModalOpen(false);
      setDeleteAllConfirmation("");
    }
  }, [deleteAllConfirmation, aiRequests, toast]);

  const formatProcessingTime = (start: Date, end: Date) => {
    if (!start || !end) return "N/A";
    const diff = end.getTime() - start.getTime();
    return format(new Date(diff), "mm:ss");
  };

  const renderSessionResults = () => {
  const requestsToRender = selectedSession
    ? aiRequests.filter((request) => request.sessionId === selectedSession)
    : aiRequests;

  return Object.entries(groupBy(requestsToRender, (request) => format(new Date(request.createdAt), "yyyy-MM-dd"))).map(
    ([date, requests]) => (
      <div key={date} className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Date: {formatDate(date)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <Image
                  src={request.visualizations[0] || request.downloadURL}
                  alt={request.fileName}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover mb-2 rounded"
                />
                <h3 className="font-semibold truncate">{request.fileName}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <AppleIcon className="text-red-500" size={16} />
                  <span>Apples: {request.appleDetections.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TreePineIcon className="text-green-500" size={16} />
                  <span>Trees: {request.treeDetections.length}</span>
                </div>
                <AppleDetectionDialog
                  imageUrl={request.visualizations[0] || request.downloadURL}
                  detections={[
                    ...request.appleDetections.map((d) => ({ ...d, class: "apple" })),
                    ...request.treeDetections.map((d) => ({ ...d, class: "tree" })),
                  ]}
                />
                <p className="mt-2">
                  Status: <Badge>{request.status}</Badge>
                </p>
                <p>Processing Time: {formatProcessingTime(request.processingStartTime, request.processingEndTime)}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleDelete(request.id, request.fileName)}
                  disabled={deletingId === request.id}
                >
                  {deletingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  );
};


  const renderSessionGroups = () => {
    const sessionsToRender = selectedSession
      ? { [selectedSession]: groupedSessions[selectedSession] }
      : groupedSessions;

    return Object.entries(sessionsToRender).map(([sessionId, requests]) => (
      <div key={sessionId} className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Session: {sessionId}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <Image
                  src={request.visualizations[0] || request.downloadURL}
                  alt={request.fileName}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover mb-2 rounded"
                />
                <h3 className="font-semibold truncate">{request.fileName}</h3>
                <div className="flex items-center space-x-2 mt-2">
                  <AppleIcon className="text-red-500" size={16} />
                  <span>Apples: {request.appleDetections.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TreePineIcon className="text-green-500" size={16} />
                  <span>Trees: {request.treeDetections.length}</span>
                </div>
                <AppleDetectionDialog
                  imageUrl={request.visualizations[0] || request.downloadURL}
                  detections={[
                    ...request.appleDetections.map((d) => ({ ...d, class: "apple" })),
                    ...request.treeDetections.map((d) => ({ ...d, class: "tree" })),
                  ]}
                />
                <p className="mt-2">
                  Status: <Badge>{request.status}</Badge>
                </p>
                <p>Processing Time: {formatProcessingTime(request.processingStartTime, request.processingEndTime)}</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleDelete(request.id, request.fileName)}
                  disabled={deletingId === request.id}
                >
                  {deletingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ));
  };

  if (!userId || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please sign in to view your AI history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Error: {error}. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-background">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold mb-4 sm:mb-0">AI Detection History</h1>
          <div className="space-x-2 flex items-center">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate ?? undefined}
              endDate={endDate ?? undefined}
              placeholderText="Start Date"
              className="border rounded p-2"
            />
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date ?? null)}
              selectsEnd
              startDate={startDate ?? undefined}
              endDate={endDate ?? undefined}
              minDate={startDate ?? undefined}
              placeholderText="End Date"
              className="border rounded p-2"
            />
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteAllModalOpen(true)} disabled={aiRequests.length === 0}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          </div>
        </div>

        <div className="flex items-center mb-4">
  <Select onValueChange={(value) => setSelectedSession(value)}>
    <SelectTrigger className="w-64">
      <SelectValue placeholder="Filter by session" />
    </SelectTrigger>
    <SelectContent>
      {Object.keys(groupedSessions).map((sessionId) => (
        <SelectItem key={sessionId} value={sessionId}>
          {sessionId === "Unknown Session" ? "Unknown Session" : sessionId}  {/* Display fallback nicely */}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <Button variant="ghost" onClick={() => setSelectedSession(null)} className="ml-4">
    Reset Session Filter
  </Button>
</div>


        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AppleIcon className="text-red-500" size={20} />
              <span className="font-semibold">Total Apples: {totalApples}</span>
            </div>
            <div className="flex items-center space-x-2">
              <TreePineIcon className="text-green-500" size={20} />
              <span className="font-semibold">Total Trees: {totalTrees}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-auto p-4">
        {renderSessionResults()}
        {renderSessionGroups()}
      </div>

      <div className="p-4 bg-background border-t">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            1-{Math.min(aiRequests.length, 1000)} of {aiRequests.length}
          </div>
        </div>
      </div>

      <Dialog open={isDeleteAllModalOpen} onOpenChange={setIsDeleteAllModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Requests</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please type &quot;DELETE-ALL-HISTORY&quot; to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteAllConfirmation}
            onChange={(e) => setDeleteAllConfirmation(e.target.value)}
            placeholder="Type DELETE-ALL-HISTORY"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}