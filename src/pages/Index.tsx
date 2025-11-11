import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";

// ✅ Import image from src/assets
import logo from "@/assets/logo.png";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background text-gray-900">
      {/* ✅ Pass the required prop */}
      <Navbar toggleSidebar={handleToggleSidebar} />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[70vh] bg-white text-gray-900 px-4 border-b border-gray-200 mt-16">
        {/* ✅ Use imported logo */}
        <img
          src={logo}
          alt="Ezzy Auto Parts Logo"
          className="h-80 w-auto mb-6 object-contain transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Welcome to Ezzy Auto Parts
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mt-3 text-center max-w-xl">
          Reliable spare parts for every vehicle — quality you can trust.
        </p>
      </section>

      {/* Dashboard Section */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
