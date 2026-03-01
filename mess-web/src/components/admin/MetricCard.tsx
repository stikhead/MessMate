import { MetricCardProps } from "@/types/common";

export default function MetricCard({title, bg, icon, value}: MetricCardProps) {
  return (
    <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-100 cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className={`h-10 w-10 ${bg} rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-700">{value}</h3>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}