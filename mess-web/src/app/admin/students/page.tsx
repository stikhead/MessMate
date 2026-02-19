"use client";

import { useState, useEffect } from "react";
import {  Users,  Search,  CreditCard,  Loader2,  X,  CheckCircle2,  AlertCircle,  Filter,  Mail, Phone } from "lucide-react";
import API from "@/lib/api";
import Toast from "@/components/student/Toast";
import { AssignCardForm, Student, ToastState } from "@/types/common";
import AdminLayout from "@/components/admin/Sidebar";
import { useUser } from "@/hooks/useUser";



export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCardStatus, setFilterCardStatus] = useState<"all" | "active" | "inactive">("all");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useUser();

  const [assignForm, setAssignForm] = useState<AssignCardForm>({
    userId: ""
  });

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
        message: "Failed to load students",
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

  const openAssignModal = (student: Student) => {
    setSelectedStudent(student);
    setAssignForm({
      userId: student._id
    });
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStudent(null);
    setAssignForm({ userId: "" });
  };

  const handleAssignCard = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!selectedStudent) return;

    setSubmitting(true);
    try {
      await API.post("/cards/create", {
        userID: assignForm.userId,
      });

      setToast({
        show: true,
        message: `Card assigned successfully!`,
        type: "success",
      });

      closeAssignModal();
      fetchStudents();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to assign card";
      setToast({ show: true, message: msg, type: "error" });
    } finally {
      setSubmitting(false);
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
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Card Status
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                        
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Roll: {student.roll_no}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </p>
                          {student.phone && (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {student.phone}
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
                        {student.isCardHolder &&
                        student.cardNumber?.isActive === "ACTIVE" ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {student.cardNumber?.mealAmount || 0} meals left
                            </p>
                          </div>
                        ) :
                        student.cardNumber?.isActive !== "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                            <AlertCircle className="h-3 w-3" />
                            INACTIVE
                          </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                            <AlertCircle className="h-3 w-3" />
                            No card
                          </span>
                        ) }
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-right">
                        <button
                          onClick={() => openAssignModal(student)}
                          disabled={student.isCardHolder} 
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold rounded-lg transition-all active:scale-95
                           ${student.isCardHolder
                           ? "cursor-not-allowed bg-gray-400 text-black"
                           : "cursor-pointer  bg-blue-600 hover:bg-blue-700"}`
                        }>
                          <CreditCard className="h-3.5 w-3.5" />
                          {"Assign Card"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  { "Assign Mess Card"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedStudent.fullName}
                </p>
              </div>
              <button
                onClick={closeAssignModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAssignCard} className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Roll Number:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedStudent.roll_no}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Wallet Balance:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{selectedStudent.currentBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {selectedStudent.isCardHolder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Meals:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedStudent.cardNumber?.mealAmount || 0} meals
                      </span>
                    </div>
                  )}
                </div>
              </div>



              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  This will assign a new card to the student.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Assign Card
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}