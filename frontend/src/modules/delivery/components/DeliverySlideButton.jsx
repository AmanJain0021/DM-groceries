import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deliveryApi } from "../services/deliveryApi";
import { getCurrentPositionWithCache } from "../utils/deliveryLastLocation";

/**
 * DeliverySlideButton - A slide-to-confirm button for delivery actions
 * 
 * This component handles the slide gesture to trigger OTP generation.
 * It calls the generate-otp endpoint which uses the delivery person's stored location
 * from the database for proximity validation.
 * 
 * @param {Object} props
 * @param {string} props.orderId - The order ID for OTP generation
 * @param {Function} props.onSuccess - Callback when OTP is successfully generated
 * @param {Function} props.onError - Callback when an error occurs
 * @param {string} props.label - Label text for the slide button (default: "SLIDE TO GENERATE OTP")
 * @param {string} props.bgColor - Background color class (default: "bg-black ")
 * @param {string} props.bgColorLight - Light background color class (default: "bg-brand-50")
 */
const DeliverySlideButton = ({
  orderId,
  onSuccess,
  onError,
  isReturn = false,
  isReturnDrop = false,
  label = "SLIDE TO GENERATE OTP",
  bgColor = "bg-black ",
  bgColorLight = "bg-brand-50",
}) => {
  const [isSlideComplete, setIsSlideComplete] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Reset slide state when orderId changes
  useEffect(() => {
    setIsSlideComplete(false);
    setDragX(0);
    setIsLoading(false);
  }, [orderId]);

  const resetSlide = () => {
    setIsSlideComplete(false);
    setDragX(0);
    setIsLoading(false);
  };

  /**
   * Handle slide completion - generate OTP using stored location
   */
  const handleSlideComplete = async () => {
    setIsLoading(true);

    try {
      let location;
      try {
        location = await new Promise((resolve, reject) => {
          getCurrentPositionWithCache(resolve, reject, {
            maxCacheAgeMs: 20 * 60 * 1000,
          });
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("GPS failed, using fallback location for testing");
          location = { lat: 22.7196, lng: 75.8577 }; // fallback
        } else {
          throw new Error("Location unavailable. Please enable GPS to proceed.");
        }
      }

      const payload = { lat: location.lat, lng: location.lng };

      // Call appropriate endpoint based on flow type
      const response = isReturnDrop
        ? await deliveryApi.requestReturnDropOtp(orderId, payload)
        : isReturn
          ? await deliveryApi.requestReturnOtp(orderId, payload)
          : await deliveryApi.requestDeliveryOtp(orderId, payload);

      // Handle success
      toast.success(response.data?.message || "OTP generated and sent to customer");

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      // Handle different error types. Same dual-shape access pattern as
      // OtpInput.jsx — the canonical workflow controller wraps the
      // structured payload inside `result.error`.
      const respData = error?.response?.data || {};
      const structured =
        (respData.result && respData.result.error) ||
        (typeof respData.error === "object" ? respData.error : null) ||
        {};
      const errorMessage =
        structured.message ||
        respData.message ||
        error?.message ||
        "Failed to generate OTP";
      const errorCode = structured.code;

      // Display user-friendly error messages
      if (errorCode === "PROXIMITY_OUT_OF_RANGE") {
        const details = error?.response?.data?.error?.details;
        const distance = details?.currentDistance;
        const range = details?.requiredRange || "0-120m";

        toast.error(
          `You are too ${distance > 120 ? "far" : "close"}. You must be within ${range} of the delivery location.`,
          { duration: 5000 }
        );
      } else if (errorCode === "LOCATION_REQUIRED" || errorCode === "LOCATION_STALE") {
        toast.error(errorMessage || "Location data is not available. Please ensure location tracking is enabled.");
      } else if (errorCode === "ORDER_NOT_FOUND") {
        toast.error("Order not found. Please refresh and try again.");
      } else if (errorCode === "UNAUTHORIZED_DELIVERY") {
        toast.error("This order is not assigned to you.");
      } else {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(error);
      }

      resetSlide();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={() => {
        if (!isLoading) {
          setIsSlideComplete(true);
          handleSlideComplete();
        }
      }}
      disabled={isLoading}
      className={`w-full h-14 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-md active:scale-[0.98] transition-all ${bgColor.replace("bg-black", "bg-gray-900")}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin mr-2" size={20} />
          {isReturn ? "Requesting OTP..." : "Generating OTP..."}
        </>
      ) : (
        <>
          {label.replace("SLIDE TO ", "")}
        </>
      )}
    </button>
  );
};

export default DeliverySlideButton;
