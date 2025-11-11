import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, FileText, LogOut } from "lucide-react";
import EzzyLogo from "@/assets/logo.png";

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Detect current route

  const handleLogout = () => {
    sessionStorage.removeItem("auth");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`flex flex-col h-full bg-white border-r transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2 px-3 mt-4">
  {/* Dashboard */}
  <button
    onClick={() => navigate("/")}
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
      isActive("/")
        ? "bg-blue-600 text-white font-semibold shadow-sm"
        : "text-blue-600 hover:bg-blue-100"
    }`}
  >
    <LayoutGrid
      size={18}
      className={`${isActive("/") ? "text-white" : "text-blue-600"}`}
    />
    {!collapsed && "Dashboard"}
  </button>

  {/* Billing */}
  <button
    onClick={() => {
      navigate("/billing");
      window.dispatchEvent(new Event("billing-navigation"));
    }}
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
      isActive("/billing")
        ? "bg-blue-600 text-white font-semibold shadow-sm"
        : "text-blue-600 hover:bg-blue-100"
    }`}
  >
    <FileText
      size={18}
      className={`${isActive("/billing") ? "text-white" : "text-blue-600"}`}
    />
    {!collapsed && "Billing"}
  </button>
</nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-600 transition"
        >
          <LogOut size={18} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;