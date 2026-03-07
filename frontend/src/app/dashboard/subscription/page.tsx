// ================================
// SUBSCRIPTION PAGE
// This page lets company owners:
// - See their current subscription status
// - View available plans
// - Subscribe to a plan or upgrade
// - Renew an expired subscription
// - Cancel their subscription
//
// WHY THIS PAGE EXISTS:
// Companies must pay a monthly fee to use the platform.
// This page is where they manage their billing.
// ================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { subscriptionApi } from "@/lib/api";
import { formatPrice, formatDate, getStatusColor, capitalize } from "@/lib/helpers";
import { Subscription, SubscriptionPlan, Company } from "@/types";

export default function SubscriptionPage() {
  const { user } = useAuth();

  // State for the current subscription
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // State for available plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Loading and messages
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load data when page opens
  useEffect(() => {
    loadData();
  }, []);

  // Fetch subscription + plans from the API
  async function loadData() {
    try {
      // Load both at the same time for speed
      const [subData, plansData] = await Promise.all([
        subscriptionApi.getMine(),
        subscriptionApi.getPlans(),
      ]);

      setSubscription(subData.subscription);
      setCompany(subData.company);
      setPlans(plansData.plans);
    } catch (err: any) {
      console.error("Error loading subscription:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Subscribe to a plan
  async function handleSubscribe(planId: string) {
    setActionLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await subscriptionApi.subscribe(planId);
      setMessage(data.message);
      // Reload the data to show updated subscription
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Renew an expired subscription
  async function handleRenew() {
    setActionLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await subscriptionApi.renew();
      setMessage(data.message);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Cancel subscription
  async function handleCancel() {
    // Ask for confirmation before canceling
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    setActionLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await subscriptionApi.cancel();
      setMessage(data.message);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Show loading state
  if (loading) {
    return <p className="text-gray-500">Loading subscription...</p>;
  }

  // Figure out current status for display
  const isExpired = subscription?.status === "expired";
  const isCanceled = subscription?.status === "canceled";
  const isTrial = subscription?.status === "trial";
  const isActive = subscription?.status === "active";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>

      {/* Show success/error messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* ================================
          CURRENT SUBSCRIPTION STATUS
          Shows the company's current plan and billing info.
          ================================ */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Current Subscription</h2>

        {subscription ? (
          <div className="space-y-3">
            {/* Plan name */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium capitalize">
                {subscription.plan}
              </span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <span
                className={`badge ${getStatusColor(subscription.status)}`}
              >
                {capitalize(subscription.status)}
              </span>
            </div>

            {/* Monthly price */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Monthly Price</span>
              <span className="font-medium">
                {formatPrice(subscription.pricePerMonth)}/month
              </span>
            </div>

            {/* Start date */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Started</span>
              <span>{formatDate(subscription.startDate)}</span>
            </div>

            {/* Next billing / expiry date */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">
                {isExpired ? "Expired On" : isTrial ? "Trial Ends" : "Next Billing"}
              </span>
              <span className={isExpired ? "text-red-600 font-medium" : ""}>
                {formatDate(subscription.nextBillingDate)}
              </span>
            </div>

            {/* Action buttons based on status */}
            <div className="pt-4 border-t flex gap-3">
              {/* If expired — show renew button */}
              {isExpired && (
                <button
                  onClick={handleRenew}
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? "Processing..." : "Renew Subscription"}
                </button>
              )}

              {/* If active or trial — show cancel button */}
              {(isActive || isTrial) && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="text-sm text-red-600 hover:underline"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">
              No active subscription found.
            </p>
            <p className="text-sm text-gray-400">
              Choose a plan below to get started.
            </p>
          </div>
        )}
      </div>

      {/* ================================
          EXPIRED / CANCELED WARNING
          Shows a prominent warning if the subscription is not active.
          ================================ */}
      {(isExpired || isCanceled) && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg mb-8">
          <h3 className="font-bold text-lg mb-2">
            {isExpired
              ? "⚠️ Your Subscription Has Expired"
              : "⚠️ Your Subscription Is Canceled"}
          </h3>
          <p className="mb-4">
            You cannot create new bookings until you renew or subscribe to a new plan.
            Your existing data is safe and accessible.
          </p>
          {isExpired && (
            <button
              onClick={handleRenew}
              disabled={actionLoading}
              className="btn-primary"
            >
              {actionLoading ? "Processing..." : "Renew Now"}
            </button>
          )}
        </div>
      )}

      {/* ================================
          AVAILABLE PLANS
          Shows all plans with prices and features.
          Users can click to subscribe or upgrade.
          ================================ */}
      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          // Check if this is the current plan
          const isCurrentPlan = subscription?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`card border-2 ${
                isCurrentPlan
                  ? "border-ocean-500 bg-ocean-50"
                  : "border-gray-200 hover:border-ocean-300"
              } transition-colors`}
            >
              {/* Plan header */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {formatPrice(plan.pricePerMonth)}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe / Current plan button */}
              {isCurrentPlan && (isActive || isTrial) ? (
                <button
                  disabled
                  className="w-full py-2 px-4 bg-ocean-100 text-ocean-700 rounded-lg font-medium cursor-default"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={actionLoading}
                  className="w-full py-2 px-4 bg-ocean-600 text-white rounded-lg font-medium hover:bg-ocean-700 disabled:opacity-50"
                >
                  {actionLoading
                    ? "Processing..."
                    : isCurrentPlan
                    ? "Renew This Plan"
                    : "Choose This Plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Note about payments */}
      <p className="text-center text-sm text-gray-400 mt-8">
        Payments are simulated in this demo. In production, this would
        integrate with Stripe or another payment provider.
      </p>
    </div>
  );
}
