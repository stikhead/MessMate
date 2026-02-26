"use client";

import { useState, useEffect } from "react";
import { Users, Search, Loader2, CheckCircle2, AlertCircle, Filter, Mail, Phone, CreditCard } from "lucide-react";
import API from "@/lib/api";
import Toast from "@/components/student/Toast";
import { Student } from "@/types/common";
import AdminLayout from "@/components/admin/Sidebar";
import { useUser } from "@/hooks/useUser";
import { getErrorMessage } from "@/lib/error-handler";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCardStatus, setFilterCardStatus] = useState<"all" | "active" | "inactive">("all");

    const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { user } = useUser();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/getUsers");
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setToast({
        show: true,
        msg: "Failed to load students",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = [...students];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.fullName.toLowerCase().includes(query) ||
          student.roll_no?.includes(query) ||
          student.email.toLowerCase().includes(query)
      );
    }

    if (filterCardStatus !== "all") {
      filtered = filtered.filter((student) => {
        if (filterCardStatus === "active") {
          return student.isCardHolder && student.cardNumber?.isActive === "ACTIVE";
        } else {
          return !student.isCardHolder || student.cardNumber?.isActive !== "ACTIVE";
        }
      });
    }

    setFilteredStudents(filtered);
  }, [searchQuery, filterCardStatus, students]);

  const handleToggleAssign = async (student: Student) => {
  
    if (student.isCardHolder) {
      setToast({ show: true, msg: "Student already has an active card.", type: "error" });
      return;
    }

    setTogglingId(student._id);
    try {
      await API.post("/cards/create", {
        userID: student._id,
      });

      setToast({
        show: true,
        msg: `Card assigned successfully to ${student.fullName}!`,
        type: "success",
      });

      await fetchStudents();
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to submit response");
      setToast({ show: true, msg, type: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-blue-600" />
              Students Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage student accounts and mess cards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {students.length}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                Total Students
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, roll number, or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterCardStatus}
                onChange={(e) =>
                  setFilterCardStatus(e.target.value as "all" | "active" | "inactive")
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
              >
                <option value="all">All Students</option>
                <option value="active">With Active Card</option>
                <option value="inactive">Without Active Card</option>
              </select>
            </div>
          </div>

          {searchQuery || filterCardStatus !== "all" ? (
            <p className="text-sm text-gray-500 mt-3">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          ) : null}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-150 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Users className="h-12 w-12 mb-3 text-gray-300" />
                <p className="font-semibold text-gray-700">No students found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery || filterCardStatus !== "all"
                    ? "Try adjusting your filters"
                    : "No students registered yet"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Assign Card</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => {
                    const isToggling = togglingId === student._id;
                    const hasCard = student.isCardHolder;

                    return (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">

                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{student.fullName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Roll: {student.roll_no}</p>
                          </div>
                        </td>

                        <td className="px-4 sm:px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {student.email}
                            </p>
                            {student.phone && (
                              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <Phone className="h-3 w-3" /> {student.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            ₹{student.currentBalance.toLocaleString("en-IN")}
                          </p>
                        </td>

                        <td className="px-4 sm:px-6 py-4">
                          {hasCard && student.cardNumber?.isActive === "ACTIVE" ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </span>
                              <p className="text-xs text-gray-500 mt-1">{student.cardNumber?.mealAmount || 0} meals left</p>
                            </div>
                          ) : hasCard && student.cardNumber?.isActive !== "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                              <AlertCircle className="h-3 w-3" /> INACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                              <CreditCard className="h-3 w-3" /> No card
                            </span>
                          )}
                        </td>

                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            {isToggling && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}

                            <button
                              type="button"
                              role="switch"
                              aria-checked={hasCard}
                              disabled={isToggling || hasCard}
                              onClick={() => handleToggleAssign(student)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${hasCard
                                  ? 'bg-green-500 cursor-not-allowed'
                                  : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasCard ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}