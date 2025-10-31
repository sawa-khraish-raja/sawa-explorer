import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import TravelerInfoForm from "../components/booking/TravelerInfoForm";
import ProgressBar from "../components/booking/ProgressBar";
// import { NotificationHelpers } from "../components/notifications/notificationHelpers";

export default function CreateBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const city = params.get("city");
    if (city) {
      setBookingData({
        city,
        start_date: params.get("start"),
        end_date: params.get("end"),
        number_of_adults: parseInt(params.get("adults"), 10) || 1,
        number_of_children: parseInt(params.get("children"), 10) || 0,
        selected_services: params.get("services")?.split(",") || [],
        notes: "",
        traveler_email: "",
      });
    } else {
      // Handle case where no city is provided, maybe redirect or show error
      toast.error("Booking details are missing. Please start over.");
      navigate(createPageUrl("Home"));
    }
  }, [location.search, navigate]);

  const createBookingMutation = useMutation({
    mutationFn: (bookingPayload) =>
      base44.entities.Booking.create(bookingPayload),
    onSuccess: async (newBooking) => {
      toast.success(
        "Your booking request has been sent! You will be notified when a host accepts.",
        { duration: 5000 }
      );

      try {
        // 1. Get all approved hosts
        const allUsers = await base44.entities.User.list();
        const approvedHosts = allUsers.filter((u) => u.host_approved && u.city);

        // 2. Find hosts in the same city as the booking
        const cityHosts = approvedHosts.filter(
          (host) => host.city === newBooking.city
        );
        const hostEmails = cityHosts.map((host) => host.email);

        if (hostEmails.length > 0) {
          // 3. Send notifications to these hosts
          // await NotificationHelpers.onBookingRequest(newBooking, hostEmails);
          console.log(
            `Booking request ${newBooking.id} sent to ${hostEmails.length} hosts in ${newBooking.city}.`
          );
        } else {
          console.warn(`No active hosts found for city: ${newBooking.city}`);
          // Optionally notify admin or support
        }
      } catch (error) {
        console.error("Failed to send booking request notifications:", error);
        // Don't block user flow, but log the error
      }

      // Redirect to MyOffers page to see status
      navigate(createPageUrl("MyOffers"));
    },
    onError: (error) => {
      toast.error(
        "There was a problem sending your request. Please try again."
      );
      console.error("Booking Creation Error:", error);
    },
  });

  const handleFinalizeBooking = async (formData) => {
    const user = await base44.auth.me();
    if (!user) {
      toast.error("You must be logged in to book.");
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const finalBookingData = {
      ...bookingData,
      notes: formData.notes,
      traveler_email: user.email,
    };

    createBookingMutation.mutate(finalBookingData);
  };

  if (!bookingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6E6FF] via-white to-[#CCCCFF] py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProgressBar currentStep={3} />

        <Card className="shadow-2xl border-2 border-white/50 rounded-3xl mt-8">
          <CardHeader className="bg-gray-50/50 rounded-t-3xl p-6 border-b">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Finalize Your Request
            </CardTitle>
            <p className="text-gray-600">
              Confirm your details and add any special requests. We'll send this
              to available hosts in{" "}
              <span className="font-semibold text-[#330066]">
                {bookingData.city}
              </span>
              .
            </p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <TravelerInfoForm
              onSubmit={handleFinalizeBooking}
              isLoading={createBookingMutation.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
