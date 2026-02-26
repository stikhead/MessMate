"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import AdminLayout from "@/components/admin/Sidebar";
import Toast from "@/components/student/Toast";
import { useUser } from "@/hooks/useUser";
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Search, Filter, User as UserIcon, Calendar, Coffee, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminComplaint, PopulatedUser } from "@/types/common";
import { getErrorMessage } from "@/lib/error-handler";



export default function AdminInboxPage() {
    const { user } = useUser();
    const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);
    const [activeTab, setActiveTab] = useState<"Pending" | "Resolved" | "All">("Pending");
    const [searchQuery, setSearchQuery] = useState("");
    const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await API.get("/feedback/all").catch(() => API.get("/feedback/get"));
            const data = Array.isArray(res.data?.data) ? res.data.data : [];
            setComplaints(data);
        } catch (error) {
            console.error("Failed to fetch complaints", error);
            setToast({ show: true, msg: "Failed to load complaints", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);


    const handleRespond = async (feedbackId: string) => {
        const responseString = replyTexts[feedbackId]?.trim();

        if (!responseString) {
            setToast({ show: true, msg: "Please enter a response before submitting.", type: "error" });
            return;
        }

        setSubmittingId(feedbackId);
        try {
            await API.post("/feedback/respond", {
                FeedbackId: feedbackId,
                responseString
            });

            setToast({ show: true, msg: "Issue resolved successfully!", type: "success" });

            setReplyTexts(prev => ({ ...prev, [feedbackId]: "" }));
            await fetchComplaints();

        } catch (error) {
            const msg = getErrorMessage(error, "Failed to submit response");
            setToast({ show: true, msg, type: "error" });
        } finally {
            setSubmittingId(null);
        }
    };

    const getMealName = (type: number) => {
        return type === 1 ? "Breakfast" : type === 2 ? "Lunch" : "Dinner";
    };

    const getUserName = (cUser: string | PopulatedUser) => {
        if (!cUser) return "Unknown Student";
        if (typeof cUser === "object" && cUser.name) return cUser.name;
        return "Student";
    };

    const filteredComplaints = complaints.filter(c => {
        const statusUpper = (c.status || "").toUpperCase();

        let matchesTab = false;
        if (activeTab === "All") {
            matchesTab = true;
        } else if (activeTab === "Pending") {
            matchesTab = statusUpper === "PENDING" || statusUpper === "SUBMITTED";
        } else if (activeTab === "Resolved") {
            matchesTab = statusUpper === "RESOLVED";
        }

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            c.description.toLowerCase().includes(searchLower) ||
            c.category.toLowerCase().includes(searchLower) ||
            getUserName(c.user).toLowerCase().includes(searchLower);

        return matchesTab && matchesSearch;
    });

    const pendingCount = complaints.filter(c => {

        const statusUpper = (c.status || "").toUpperCase();
        return statusUpper === "PENDING" || statusUpper === "SUBMITTED";
    }).length;

    return (

        <AdminLayout user={user}>
            <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <MessageSquare className="h-7 w-7 text-blue-600" />
                            Issue Tracker
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Read and resolve student feedback and complaints.
                        </p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>


                <div className="flex bg-gray-200/60 p-1.5 rounded-xl shadow-inner w-fit">
                    <button
                        onClick={() => setActiveTab("Pending")}
                        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "Pending" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <AlertCircle className="h-4 w-4" />
                        Pending
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("Resolved")}
                        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "Resolved" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolved
                    </button>
                    <button
                        onClick={() => setActiveTab("All")}
                        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "All" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Filter className="h-4 w-4" />
                        All
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredComplaints.length > 0 ? (
                        filteredComplaints.map((item) => {
                            const mType = item.mealType || item.meal?.mealType;
                            const displayDate = item.date || item.createdAt;

                            const statusUpper = (item.status || "").toUpperCase();
                            const isResolved = statusUpper === "RESOLVED";
                            const displayStatus = (statusUpper === "SUBMITTED" || statusUpper === "PENDING") ? "PENDING" : statusUpper;

                            return (
                                <div
                                    key={item._id}
                                    className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${isResolved ? "border-gray-200" : "border-blue-100 ring-1 ring-blue-50"
                                        }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                <UserIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm">{getUserName(item.user)}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(displayDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200 uppercase tracking-wider">
                                                {item.category}
                                            </span>
                                            {mType && (
                                                <span className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-200 flex items-center gap-1.5 uppercase tracking-wider">
                                                    <Coffee className="h-3 w-3" />
                                                    {getMealName(mType)}
                                                </span>
                                            )}
                                            <Badge variant={isResolved ? "RESOLVED" : "default"} className="uppercase text-[10px]">
                                                {isResolved ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                {displayStatus}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                            &quot;{item.description}&quot;
                                        </p>
                                    </div>

                                    {isResolved ? (
                                        <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                                            <p className="font-bold mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider text-green-700">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Resolution Provided
                                            </p>
                                            <p className="text-green-900 text-sm bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                                                {item.response}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <textarea
                                                value={replyTexts[item._id] || ""}
                                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [item._id]: e.target.value }))}
                                                placeholder="Type your official response to the student here..."
                                                className="w-full h-24 p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none"
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleRespond(item._id)}
                                                    disabled={submittingId === item._id || !(replyTexts[item._id]?.trim())}
                                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {submittingId === item._id ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Resolving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="h-4 w-4" />
                                                            Respond & Resolve
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="inline-flex items-center justify-center h-16 w-16 bg-gray-50 text-gray-400 rounded-full mb-4">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <h3 className="text-gray-900 font-bold mb-1 text-lg">You&lsquo;re all caught up!</h3>
                            <p className="text-gray-500 text-sm">No {activeTab.toLowerCase()} complaints found.</p>
                        </div>
                    )}
                </div>

            </div>

            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </AdminLayout>
    );
}