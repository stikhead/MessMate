interface MenuRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  time: string;
  items: string;
  active: boolean;
  timeLeft?: {
     hours: string,
    minutes: string,
    seconds: string,
  };
  activeMeal: string
}

export default function MenuRow({ icon, iconBg, title, time, items, active, activeMeal }: MenuRowProps) {
  const foodList = items
    ? items
        .split(",")
        .map((item: string) => item.trim())
        .filter((i: string) => i)
    : [];

  return (
    <div
      className={`flex items-start gap-3 sm:gap-4 p-4 rounded-xl transition-all ${
        active
          ? "bg-blue-50 border-2 border-blue-200"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
     
      <div
        className={`mt-0.5 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4
              className={`font-bold text-sm sm:text-base ${
                active ? "text-blue-900" : "text-gray-900"
              }`}
            >
              {title}
            </h4>
            {active && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                 {activeMeal}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">{time}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {foodList.length > 0 ? (
            foodList.map((food: string, index: number) => (
              <span
                key={index}
                className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                  active
                    ? "bg-white text-blue-700 border-blue-200 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {food}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              No items listed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}