// ================================
// CUSTOMERS PAGE (Dashboard)
// Shows all customers for the company.
// ================================

"use client";

import { useState, useEffect } from "react";
import { customerApi } from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const data = await customerApi.getAll();
      setCustomers(data.customers);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter customers by search term
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = search.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">View and search your guest database</p>
        </div>
        <input
          type="text"
          className="input w-auto"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-12">
          <span className="loading-text">Loading customers...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">
            {search ? "No customers match your search." : "No customers yet."}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="table-row">
                  <td className="table-cell font-medium text-gray-800">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="table-cell text-gray-500">{customer.email}</td>
                  <td className="table-cell text-gray-500">
                    {customer.phone || "—"}
                  </td>
                  <td className="table-cell text-gray-400">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
