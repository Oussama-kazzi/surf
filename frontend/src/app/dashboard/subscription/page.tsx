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
    return (
      <div className="flex items-center gap-3 py-12">
        <div className="w-2 h-2 rounded-full bg-ocean-400 animate-pulse-dot"></div>
        <span className="loading-text">Loading subscription...</span>
      </div>
    );
  }

  const isExpired = subscription?.status === "expired";
  const isCanceled = subscription?.status === "canceled";
  const isTrial = subscription?.status === "trial";
  const isActive = subscription?.status === "active";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="page-subtitle">Manage your plan and billing</p>
        </div>
      </div>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      {/* Current Subscription Status */}
      <div className="card mb-8">
        <h2 className="text-section-title text-gray-900 mb-5">Current Subscription</h2>

        {subscription ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Plan</span>
              <span className="font-medium capitalize text-gray-800">
                {subscription.plan}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Status</span>
              <span className={`badge ${getStatusColor(subscription.status)}`}>
                {capitalize(subscription.status)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Monthly Price</span>
              <span className="font-medium text-gray-800">
                {formatPrice(subscription.pricePerMonth)}/month
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Started</span>
              <span className="text-gray-600">{formatDate(subscription.startDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                {isExpired ? "Expired On" : isTrial ? "Trial Ends" : "Next Billing"}
              </span>
              <span className={isExpired ? "text-red-500 font-medium" : "text-gray-600"}>
                {formatDate(subscription.nextBillingDate)}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
              {isExpired && (
                <button onClick={handleRenew} disabled={actionLoading} className="btn-primary">
                  {actionLoading ? "Processing..." : "Renew Subscription"}
                </button>
              )}
              {(isActive || isTrial) && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">No active subscription found.</p>
            <p className="text-sm text-gray-400">Choose a plan below to get started.</p>
          </div>
        )}
      </div>

      {/* Expired / Canceled Warning */}
      {(isExpired || isCanceled) && (
        <div className="alert-warning mb-8">
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
            <button onClick={handleRenew} disabled={actionLoading} className="btn-primary">
              {actionLoading ? "Processing..." : "Renew Now"}
            </button>
          )}
        </div>
      )}

      {/* Available Plans */}
      <h2 className="text-section-title text-gray-900 mb-5">Available Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`card border-2 transition-all ${
                isCurrentPlan
                  ? "border-ocean-500 bg-ocean-50/50 shadow-lg"
                  : "border-gray-100 hover:border-ocean-200 hover:shadow-card-hover"
              }`}
            >
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-ocean-600">
                    {formatPrice(plan.pricePerMonth)}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan && (isActive || isTrial) ? (
                <button
                  disabled
                  className="w-full py-2.5 px-4 bg-ocean-100 text-ocean-700 rounded-xl font-medium cursor-default"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 bg-ocean-600 text-white rounded-xl font-medium hover:bg-ocean-700 transition-colors disabled:opacity-50"
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

      <p className="text-center text-sm text-gray-400 mt-8">
        Payments are simulated in this demo. In production, this would
        integrate with Stripe or another payment provider.
      </p>
    </div>
  );
}
