import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Store,
  Shield,
  Edit2,
  Save,
  X,
  Rocket,
  Globe,
  MapPin,
  CheckCircle,
  Share2,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Users,
  Award,
  Star,
  Zap,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Wallet
} from "lucide-react";
import { sellerApi } from "../services/sellerApi";
import { toast } from "sonner";
import { useSellerEarnings } from "../context/SellerEarningsContext";
import Card from "@shared/components/ui/Card";
import Button from "@shared/components/ui/Button";
import MapPicker from "../../../shared/components/MapPicker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const SellerProfile = () => {
  const { refreshEarnings } = useSellerEarnings();
  const [profile, setProfile] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    phone: "",
    email: "",
    lat: null,
    lng: null,
    radius: 5,
    address: "",
    dob: "",
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        sellerApi.getProfile(),
        sellerApi.getStats()
      ]);
      
      const data = profileRes.data.result;
      setProfile(data);
      if (statsRes.data.success) {
        setStatsData(statsRes.data.result);
      }
      
      setFormData({
        name: data.name,
        shopName: data.shopName,
        phone: data.phone,
        email: data.email,
        lat: data.location?.coordinates[1] || null,
        lng: data.location?.coordinates[0] || null,
        radius: data.serviceRadius || 5,
        address: data.address || "",
        dob: data.dob || "",
        bankDetails: data.bankDetails || {
          bankName: "",
          accountNumber: "",
          ifscCode: "",
          accountHolderName: "",
        },
      });
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      radius: location.radius,
      address: location.address,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      const cleaned = value.replace(/[0-9]/g, "");
      setFormData({ ...formData, [name]: cleaned });
    } else if (name === "phone") {
      const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
    } else if (name === "email") {
      setFormData({ ...formData, [name]: value.trimStart() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        lat: formData.lat,
        lng: formData.lng,
        radius: formData.radius,
      };
      await sellerApi.updateProfile(payload);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchData();
      refreshEarnings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = !profile.isActive;
      await sellerApi.updateProfile({ isActive: newStatus });
      setProfile((prev) => ({ ...prev, isActive: newStatus }));
      toast.success(`Shop is now ${newStatus ? "Active" : "Inactive"}`);
    } catch (error) {
      toast.error("Failed to update shop status");
    }
  };

  const handleShareProfile = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const performanceData = React.useMemo(() => {
    const raw = statsData?.salesTrend ?? [];
    const arr = Array.isArray(raw) ? raw : [];
    if (arr.length > 0) {
      return arr.map((d) => ({
        name: d.name ?? d.date ?? "—",
        revenue: Number(d.sales ?? d.revenue ?? d.total ?? 0) || 0,
      }));
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { name: dayNames[d.getDay()], revenue: 0 };
    });
  }, [statsData?.salesTrend]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#154D1A]"></div>
      </div>
    );
  }

  // Derived / fallback fields
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "July 2024";
  const sellerId = profile?._id ? `SEL-${profile._id.substring(18).toUpperCase()}` : "SEL-5F98A";
  const gstin = profile?.gstin || "22AAAAA0000A1Z5";
  const businessType = profile?.businessType || "Proprietorship";
  const panNumber = profile?.panNumber || "ABCDE1234F";
  const storeCategory = profile?.storeCategory || "Organic & Fresh Groceries";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1200px] mx-auto p-4 md:p-8 font-['Poppins',_sans-serif] bg-[#F7F9F7] space-y-8 pb-20"
    >
      {/* ==================== TOP HERO SECTION ==================== */}
      <div className="relative bg-gradient-to-br from-[#154D1A] via-[#103D14] to-[#0B290E] rounded-[24px] shadow-xl overflow-hidden p-6 md:p-8 text-white">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-none stroke-current" strokeWidth="0.5">
            <circle cx="50" cy="50" r="40" />
            <circle cx="50" cy="50" r="30" />
            <circle cx="50" cy="50" r="20" />
          </svg>
        </div>
        <div className="absolute bottom-4 right-12 w-24 h-24 opacity-20 pointer-events-none">
          <svg viewBox="0 0 20 20" className="w-full h-full text-white fill-current">
            <circle cx="2" cy="2" r="1" />
            <circle cx="6" cy="2" r="1" />
            <circle cx="10" cy="2" r="1" />
            <circle cx="14" cy="2" r="1" />
            <circle cx="2" cy="6" r="1" />
            <circle cx="6" cy="6" r="1" />
            <circle cx="10" cy="6" r="1" />
            <circle cx="14" cy="6" r="1" />
            <circle cx="2" cy="10" r="1" />
            <circle cx="6" cy="10" r="1" />
            <circle cx="10" cy="10" r="1" />
            <circle cx="14" cy="10" r="1" />
          </svg>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Side Info */}
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-white/10 backdrop-blur-md p-1.5 shadow-lg flex-shrink-0">
              <div className="h-full w-full rounded-full bg-white/90 flex items-center justify-center border-2 border-white/20">
                <span className="text-4xl font-extrabold text-[#154D1A]">
                  {profile?.name?.charAt(0)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-white/10">
                  {profile?.role || "Seller"}
                </span>
                <button
                  onClick={toggleStatus}
                  className={`flex items-center gap-1.5 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all hover:scale-105 active:scale-95 ${
                    profile?.isActive
                      ? "bg-[#2E7D32] text-white border-[#2E7D32]"
                      : "bg-rose-600 text-white border-rose-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${profile?.isActive ? "bg-emerald-300 animate-pulse" : "bg-rose-200"}`} />
                  {profile?.isActive ? "Active" : "Inactive"}
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none text-white">
                {profile?.name}
              </h1>
              <p className="text-white/80 font-medium text-sm">
                {profile?.shopName}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> Member since {memberSince}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1">
                  <Award size={12} /> ID: {sellerId}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto justify-center">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto bg-white text-[#154D1A] hover:bg-slate-50 transition-all rounded-xl px-6 py-3 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Edit2 size={14} /> Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all rounded-xl px-4 py-3 text-xs font-bold flex items-center justify-center"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none bg-white text-[#154D1A] hover:bg-slate-50 transition-all rounded-xl px-6 py-3 font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isSaving ? "Saving..." : <><Save size={14} /> Save</>}
                </Button>
              </div>
            )}
            <Button
              onClick={handleShareProfile}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all rounded-xl px-6 py-3 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97]"
            >
              <Share2 size={14} /> Share Profile
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== SECOND ROW ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8">
        {/* Business Information Card */}
        <Card className="p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[20px] bg-white transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-50">
            <User size={18} className="text-[#154D1A]" />
            Business Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seller Name */}
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Seller Identity
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
                <User size={16} className="text-slate-400 mr-3 group-focus-within:text-[#154D1A]" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
                />
              </div>
            </div>

            {/* Store Name */}
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Store Name
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
                <Store size={16} className="text-slate-400 mr-3" />
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Phone Number
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
                <Phone size={16} className="text-slate-400 mr-3" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Email Address
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
                <Mail size={16} className="text-slate-400 mr-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Date of Birth
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
                <Calendar size={16} className="text-slate-400 mr-3" />
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
                />
              </div>
            </div>

            {/* GST Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                GST Number
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3">
                <FileText size={16} className="text-slate-400 mr-3" />
                <span className="text-xs font-semibold text-slate-600">{gstin}</span>
              </div>
            </div>

            {/* Business Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Business Type
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3">
                <Layers size={16} className="text-slate-400 mr-3" />
                <span className="text-xs font-semibold text-slate-600">{businessType}</span>
              </div>
            </div>

            {/* PAN Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                PAN Number
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3">
                <Shield size={16} className="text-slate-400 mr-3" />
                <span className="text-xs font-semibold text-slate-600">{panNumber}</span>
              </div>
            </div>

            {/* Store Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Store Category
              </label>
              <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3">
                <Sparkles size={16} className="text-slate-400 mr-3" />
                <span className="text-xs font-semibold text-slate-600">{storeCategory}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Trust Card */}
        <Card className="p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[20px] bg-white transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-50">
              <Shield size={18} className="text-[#154D1A]" />
              Security & Trust
            </h3>

            <div className="space-y-5">
              {/* Row 1 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Verification</p>
                    <p className="text-[10px] text-slate-500">Verified Merchant</p>
                  </div>
                </div>
                <span className="bg-emerald-500 text-white rounded-full p-0.5 text-[8px]">✔️</span>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Shield size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Identity Check</p>
                    <p className="text-[10px] text-slate-500">KYC Compliant</p>
                  </div>
                </div>
                <span className="bg-emerald-500 text-white rounded-full p-0.5 text-[8px]">✔️</span>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Rocket size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Growth Tier</p>
                    <p className="text-[10px] text-slate-500">Premium Seller Level</p>
                  </div>
                </div>
                <span className="bg-emerald-500 text-white rounded-full p-0.5 text-[8px]">✔️</span>
              </div>

              {/* Row 4 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Globe size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Service Region</p>
                    <p className="text-[10px] text-slate-500">Pan India Delivery</p>
                  </div>
                </div>
                <span className="bg-emerald-500 text-white rounded-full p-0.5 text-[8px]">✔️</span>
              </div>

              {/* Row 5 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Star size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Seller Rating</p>
                    <p className="text-[10px] text-slate-500">4.8 / 5.0 Rating</p>
                  </div>
                </div>
                <span className="bg-emerald-500 text-white rounded-full p-0.5 text-[8px]">✔️</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ==================== BANK DETAILS ROW ==================== */}
      <Card className="p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[20px] bg-white transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] mb-8">
        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Wallet size={18} className="text-[#154D1A]" />
            Bank Details
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Bank Name</label>
            <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
              <input
                type="text"
                name="bankName"
                value={formData.bankDetails.bankName}
                onChange={handleBankDetailsChange}
                disabled={!isEditing}
                placeholder="e.g. HDFC Bank"
                className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Account Number</label>
            <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
              <input
                type="text"
                name="accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleBankDetailsChange}
                disabled={!isEditing}
                placeholder="Account Number"
                className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">IFSC Code</label>
            <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
              <input
                type="text"
                name="ifscCode"
                value={formData.bankDetails.ifscCode}
                onChange={handleBankDetailsChange}
                disabled={!isEditing}
                placeholder="IFSC Code"
                className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85 uppercase"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Account Holder Name</label>
            <div className="relative flex items-center bg-slate-50/50 border border-slate-100/80 rounded-xl px-4 py-3 transition-all hover:border-[#154D1A]/20 focus-within:border-[#154D1A] focus-within:bg-white">
              <input
                type="text"
                name="accountHolderName"
                value={formData.bankDetails.accountHolderName}
                onChange={handleBankDetailsChange}
                disabled={!isEditing}
                placeholder="Full Name as per Bank"
                className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 disabled:opacity-85"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ==================== THIRD ROW ==================== */}
      <Card className="p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[20px] bg-white transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-[#154D1A]" />
            Location & Service Area
          </h3>
          {isEditing && (
            <Button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all"
            >
              Manage Location
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
                  <MapPin size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Store Address</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                    {formData.address || "Please set your location on the map to define the address."}
                  </p>
                </div>
              </div>

              {formData.lat && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50">
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Latitude</span>
                    <span className="text-xs font-semibold text-slate-600 tabular-nums">{formData.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Longitude</span>
                    <span className="text-xs font-semibold text-slate-600 tabular-nums">{formData.lng.toFixed(6)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase block">Pin Code</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">452001</span>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase block">State</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">MP</span>
              </div>
              <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase block">City</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">Indore</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100/50 flex items-start gap-2">
              <span className="bg-emerald-100 text-emerald-800 rounded-full p-0.5 text-[8px] mt-0.5">✔</span>
              <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                Active Service Coverage: <span className="font-bold">{formData.radius} KM</span> radius around Indore, MP.
              </p>
            </div>
          </div>

          <div className="h-48 lg:h-auto rounded-xl border border-slate-100 overflow-hidden relative shadow-inner bg-slate-50">
            {formData.lat ? (
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center flex-col text-slate-400">
                {/* Simulated map placeholder style */}
                <div className="h-10 w-10 bg-[#154D1A] rounded-full flex items-center justify-center text-white mb-2 shadow-md">
                  <MapPin size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">Map Pin Set</span>
                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">Indore coordinates active</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <MapPin size={32} className="stroke-[1.5] mb-2" />
                <span className="text-xs font-bold">No Location Pin Defined</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ==================== FOURTH ROW (Statistics Cards) ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Orders", value: statsData?.overview?.totalOrders || "0", icon: ShoppingBag, gradient: "from-emerald-500 to-teal-600" },
          { label: "Revenue", value: `₹${statsData?.overview?.totalSales || "0"}`, icon: TrendingUp, gradient: "from-[#154D1A] to-[#2E7D32]" },
          { label: "Customers", value: statsData?.overview?.totalCustomers || "0", icon: Users, gradient: "from-indigo-500 to-blue-600" },
          { label: "Products", value: statsData?.overview?.totalProducts || "0", icon: Award, gradient: "from-amber-500 to-orange-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="p-4 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)] rounded-[18px] bg-white flex items-center gap-4 transition-all">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h4 className="text-lg font-bold text-slate-800 leading-tight mt-0.5">{stat.value}</h4>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ==================== FIFTH ROW (Performance Overview) ==================== */}
      <Card className="p-6 md:p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[20px] bg-white transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-50">
          <BarChart3 size={18} className="text-[#154D1A]" />
          Performance Analytics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Recharts Area Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="profileRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#154D1A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#154D1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#154D1A" strokeWidth={2} fillOpacity={1} fill="url(#profileRevenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick breakdown metrics */}
          <div className="space-y-4 flex flex-col justify-center">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Orders</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">{statsData?.overview?.totalOrders || 0} Orders</p>
              </div>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full">{statsData?.overview?.ordersTrend || "+0%"} MoM</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue Growth</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">₹{statsData?.overview?.totalSales || 0}</p>
              </div>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full">{statsData?.overview?.salesTrend || "+0%"} Growth</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">CSAT Score</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">4.8 / 5.0 Rating</p>
              </div>
              <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full">98% Happy</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ==================== SIXTH ROW (Membership Card) ==================== */}
      <Card className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 text-white p-6 md:p-8 rounded-[20px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Zap size={180} />
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
              Growth Partner Program
            </span>
            <h3 className="text-xl font-bold tracking-tight">Active Plan: Premium Seller Gold</h3>
            <p className="text-white/80 text-xs font-medium">Plan Expires on: December 31, 2026</p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
              <span className="bg-white/10 px-2.5 py-0.5 rounded text-[10px] font-semibold">⚡ Priority Support</span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded text-[10px] font-semibold">⚡ 0% commission limit</span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded text-[10px] font-semibold">⚡ Dedicated Relationship Manager</span>
            </div>
          </div>

          <Button
            type="button"
            className="w-full md:w-auto bg-white text-yellow-800 hover:bg-slate-50 transition-all rounded-xl px-8 py-3.5 font-bold text-xs shadow-md whitespace-nowrap hover:scale-105 active:scale-95"
          >
            Renew Plan
          </Button>
        </div>
      </Card>

      {/* ==================== SEVENTH ROW (Quick Actions) ==================== */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Quick Actions Dashboard</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { label: "Manage Products", icon: Award, path: "/seller/products" },
            { label: "Manage Orders", icon: ShoppingBag, path: "/seller/orders" },
            { label: "Wallet", icon: Wallet, path: "/seller/withdrawals" },
            { label: "Membership", icon: Zap, path: "#" },
            { label: "Reports", icon: BarChart3, path: "/seller/analytics" },
            { label: "Support", icon: FileText, path: "/seller/support" },
            { label: "Privacy", icon: Shield, path: "/seller/privacy" }
          ].map((act, idx) => (
            <motion.a
              href={act.path}
              key={idx}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-800 group-hover:bg-[#154D1A] group-hover:text-white flex items-center justify-center transition-all">
                <act.icon size={18} />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-[#154D1A] transition-colors leading-tight">
                {act.label}
              </span>
            </motion.a>
          ))}
        </div>
      </div>

      {isMapOpen && (
        <MapPicker
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onConfirm={handleLocationSelect}
          initialLocation={
            formData.lat ? { lat: formData.lat, lng: formData.lng } : null
          }
          initialRadius={formData.radius}
        />
      )}
    </motion.div>
  );
};

export default SellerProfile;
