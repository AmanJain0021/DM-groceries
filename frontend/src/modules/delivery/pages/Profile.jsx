import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Truck,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  Settings,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";
import { useAuth } from "@core/context/AuthContext";
import { useSettings } from "@core/context/SettingsContext";
import { toast } from "sonner";
import axiosInstance from '@core/api/axios';
import { useEffect } from 'react';
import { deliveryApi } from "../services/deliveryApi";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const appName = settings?.appName || "App";
  const [faqs, setFaqs] = useState([]);
  const [stats, setStats] = useState({ totalDeliveries: 0 });

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await axiosInstance.get('/public/faqs', { params: { category: 'Delivery', status: 'published' } });
        setFaqs(response.data.results || []);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };
    const fetchStats = async () => {
      try {
        const res = await deliveryApi.getStats();
        if (res.data.success || res.data.result) {
          setStats(res.data.result || { totalDeliveries: 0 });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchFaqs();
    fetchStats();
  }, []);

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await deliveryApi.deleteAccount();
        toast.success("Account deleted successfully.");
        logout();
      } catch (error) {
        toast.error("Failed to delete account.");
        console.error("Delete account error:", error);
      }
    }
  };

  const menuItems = [
    {
      icon: User,
      label: "Personal Details",
      sub: "Name, Address, Email",
      color: "text-brand-600 bg-brand-50",
      path: "/delivery/profile/personal-details",
    },
    {
      icon: Truck,
      label: "Vehicle Information",
      sub: "Bike, License, Insurance",
      color: "text-orange-600 bg-orange-50",
      path: "/delivery/profile/vehicle-info",
    },
    {
      icon: Star,
      label: "My Reviews",
      sub: "Customer ratings & feedback",
      color: "text-amber-600 bg-amber-50",
      path: "/delivery/reviews",
    },
    {
      icon: CreditCard,
      label: "Bank Account",
      sub: "HDFC Bank **** 8921",
      color: "text-brand-600 bg-brand-50",
      path: "/delivery/profile/bank-account",
    },
    {
      icon: IndianRupee,
      label: "Money Request",
      sub: "Withdraw your earnings",
      color: "text-brand-600 bg-brand-50",
      path: "/delivery/profile/withdrawals",
    },
    {
      icon: FileText,
      label: "Documents",
      sub: "Aadhar, PAN, DL (Verified)",
      color: "text-purple-600 bg-purple-50",
      path: "/delivery/profile/documents",
    },
    {
      icon: Shield,
      label: "Safety & Privacy",
      sub: "Emergency contacts, App permissions",
      color: "text-red-600 bg-red-50",
      path: "/delivery/profile/safety-privacy",
    },

    {
      icon: HelpCircle,
      label: "Help & Support",
      sub: "FAQs, Chat support",
      color: "text-teal-600 bg-teal-50",
      path: "/delivery/profile/help-support",
    },
    {
      icon: HelpCircle,
      label: "Support",
      sub: "Read our support policies",
      color: "text-blue-600 bg-blue-50",
      path: "/delivery/support",
    },
    {
      icon: Shield,
      label: "Privacy Policy",
      sub: "How we protect your data",
      color: "text-emerald-600 bg-emerald-50",
      path: "/delivery/privacy",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-[#1A4516] pt-4 pb-12 px-6 rounded-b-[2rem] relative shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-white text-lg font-black leading-tight tracking-tight">My Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => toast.info("No new notifications")}>
            <Bell size={18} />
          </Button>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-full p-0.5 shadow-md">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Profile"
                className="w-full h-full rounded-full object-cover bg-gray-100"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-brand-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="text-white">
            <h2 className="font-extrabold text-base leading-snug">{user?.name || "Delivery Partner"}</h2>
            <p className="text-white/80 text-xs flex items-center mb-1">
              <Phone size={12} className="mr-1 shrink-0" /> {user?.phone || ""}
            </p>
            <div className="flex items-center space-x-1.5">
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm">
                ID: {user?._id ? user._id.substring(0, 6).toUpperCase() : ""}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black shadow-sm tracking-wide ${user?.isVerified ? "bg-brand-500 text-primary-foreground" : "bg-red-500 text-white"}`}>
                {user?.isVerified ? "VERIFIED" : "UNVERIFIED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-6 -mt-6 bg-white rounded-2xl p-3 shadow-md mb-6 flex justify-between text-center relative z-10 border border-gray-100/50">
        <div className="flex-1">
          <p className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">
            Joined
          </p>
          <p className="font-bold text-gray-900 text-sm">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : "New"}
          </p>
        </div>
        <div className="w-px bg-gray-100"></div>
        <div className="flex-1">
          <p className="text-gray-400 text-[9px] uppercase font-bold tracking-wider">
            Trips
          </p>
          <p className="font-bold text-gray-900 text-sm">{stats?.totalDeliveries || 0}</p>
        </div>
        <div className="w-px bg-gray-100"></div>
        <div className="flex-1">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
            Rating
          </p>
          <p className="font-bold text-gray-900 text-lg flex justify-center items-center">
            {user?.averageRating ? Number(user.averageRating).toFixed(1) : "N/A"} <span className="text-yellow-400 text-sm ml-1">★</span>
          </p>
        </div>
      </motion.div>

      {/* Menu Options */}
      <motion.div
        className="px-6 space-y-3 max-w-lg mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            variants={itemVariants}
            className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-gray-50 hover:shadow-md transition-all group"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.path)}>
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full mr-4 transition-colors ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </div>
            <ChevronRight
              size={20}
              className="text-gray-300 group-hover:text-primary transition-colors"
            />
          </motion.button>
        ))}

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Delivery Partner FAQs</p>
          <div className="divide-y divide-gray-50">
            {faqs.length > 0 ? (
              faqs.map((faq) => (
                <DeliveryFAQItem
                  key={faq._id}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))
            ) : (
              <div className="py-4 text-center text-xs text-gray-400">No FAQs available</div>
            )}
          </div>
        </div>

        <motion.div variants={itemVariants} className="pt-4 space-y-3">
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 py-6">
            <LogOut size={20} className="mr-2" /> Delete Account
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 py-6">
            <LogOut size={20} className="mr-2" /> Logout
          </Button>
        </motion.div>
      </motion.div>

      <div className="text-center text-gray-400 text-xs mt-8 pb-4">
        {appName} Delivery Partner App
        <br />
        Version 1.2.0 (Build 450)
      </div>
    </div>
  );
};

const DeliveryFAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="py-4 px-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">{question}</h3>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 text-xs text-gray-500 font-medium leading-relaxed"
        >
          {answer}
        </motion.p>
      )}
    </div>
  );
};

export default Profile;
