"use client";

import { useState } from "react";
import { Save, Plus, Edit2, Trash2, Loader2, X, Calendar } from "lucide-react";
import API from "@/lib/api";
import Toast from "@/components/student/Toast";
import { MenuFormData, MenuItem } from "@/types/common";
import AdminLayout from "@/components/admin/Sidebar";
import { useUser } from "@/hooks/useUser";
import { days, MEAL_TYPES } from "@/constants";
import { useFetchMenu } from "@/hooks/fetchMenu";
import { getErrorMessage } from "@/lib/error-handler";

export default function MenuControlPage() {
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterDay, setFilterDay] = useState<number | "all">("all");
  const [filterMeal, setFilterMeal] = useState<number | "all">("all");
  const { user } = useUser();
  const { menuItems, loading, refreshMenu } = useFetchMenu();

  const [formData, setFormData] = useState<MenuFormData>({
    day: 1,
    mealType: 1,
    items: "",
    price: 0,
  });

 
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ day: 1, mealType: 1, items: "", price: 0 });
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      mealType: item.mealType,
      items: item.items,
      price: item.price || 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ day: 1, mealType: 1, items: "", price: 0 });
  };


 const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!formData.items.trim()) {
      setToast({
        show: true,
        msg: "Please enter menu items",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await API.put(`/menu/update/?id=${editingItem._id}&items=${encodeURIComponent(formData.items)}&price=${formData.price}`);
        
        setToast({
          show: true,
          msg: "Menu updated successfully",
          type: "success",
        });
      } else {
        await API.post("/menu/add", formData);
        setToast({
          show: true,
          msg: "Menu item added successfully",
          type: "success",
        });
      }
      closeModal();
      refreshMenu();
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to submit response");
      setToast({ show: true, msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const cnf = confirm("Are you sure you want to delete this meal?")
    if (!cnf) return;

    try {
      await API.delete(`/menu/delete/?id=${id}`);
      setToast({
        show: true,
        msg: "Meal deleted successfully",
        type: "success",
      });

      refreshMenu();

    } catch (error) {
      console.log(error)
      setToast({ 
        show: true, 
        msg: "Failed to delete meal", 
        type: "error" 
      });
    }
  };


  const getMealIcon = (type: number) => {
    const meal = MEAL_TYPES.find((m) => m.value === type);
    
    if (!meal) return null;
    
    const Icon = meal.icon;

    return <Icon className={`h-4 w-4 ${meal.color}`} />;
  };

  const getMealLabel = (type: number) => {
    return MEAL_TYPES.find((m) => m.value === type)?.label || "Unknown";
  };

  const filteredItems = menuItems.filter((item) => {
    if (filterDay !== "all" && item.day !== filterDay) return false;

    if (filterMeal !== "all" && item.mealType !== filterMeal) return false;
    return true;
  });

  return (
    <AdminLayout user={user}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Menu Control
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Edit and manage weekly meal menus
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Day
              </label>
              <select
                value={filterDay}
                onChange={(e) =>
                  setFilterDay(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="all">All Days</option>
                {days.map((day, idx) => (
                  <option key={idx} value={idx + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Meal
              </label>
              <select
                value={filterMeal}
                onChange={(e) =>
                  setFilterMeal(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="all">All Meals</option>
                {MEAL_TYPES.map((meal) => (
                  <option key={meal.value} value={meal.value}>
                    {meal.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Weekly Menu Schedule
              {filteredItems.length !== menuItems.length && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredItems.length} of {menuItems.length})
                </span>
              )}
            </h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Menu Item
            </button>
          </div>

      
          <div className="overflow-x-auto max-h-150 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p>Loading menu from database...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calendar className="h-12 w-12 mb-3 text-gray-300" />
                <p className="font-semibold text-gray-700">
                  No menu items found
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {menuItems.length > 0
                    ? "Try adjusting your filters"
                    : "Add some to get started!"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Meal
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Menu Items
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900">
                        {days[item.day - 1] || item.day}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg shadow-sm">
                          {getMealIcon(item.mealType)}
                          {getMealLabel(item.mealType)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 max-w-md">
                        {item.items.split(",").join(" • ")}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{item.price || 0}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

    
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Day <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={editingItem !== null}
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      day: Number(e.target.value) 
                    })
                  }
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    editingItem !== null 
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                    }`}
                  required
                >
                  {days.map((day, idx) => (
                    <option key={idx} value={idx + 1}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>




              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meal Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {MEAL_TYPES.map((meal) => {
                    const Icon = meal.icon;
                    return (
                      <button
                        key={meal.value}
                        type="button"
                        disabled={editingItem !== null}
                        onClick={() =>
                          setFormData({ 
                            ...formData, 
                            mealType: meal.value 
                          })
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          editingItem !== null && formData.mealType === meal.value
                          ? "border-blue-500 bg-blue-50 cursor-not-allowed"
                          : formData.mealType === meal.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            formData.mealType === meal.value
                              ? meal.color
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            formData.mealType === meal.value
                              ? "text-blue-700"
                              : "text-gray-600"
                          }`}
                        >
                          {meal.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>


              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Menu Items <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.items}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      items: e.target.value 
                    })
                  }
                  placeholder="e.g., Idli, Sambar, Chutney, Tea"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Separate items with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  min={0}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>


              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingItem ? "Update" : "Add"} Menu
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
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}

