"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const response = await fetch("/api/xmtp");
        const data = await response.json();

        if (response.ok) {
          setClientDetails(data);
        } else {
          setError(data.error || "Failed to fetch client details");
        }
      } catch (err) {
        setError("Failed to fetch client details");
      }
    };

    fetchClientDetails();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">XMTP Client Details</h1>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {clientDetails && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <p>
            <strong>Address:</strong> {clientDetails.address}
          </p>
          <p>
            <strong>Environment:</strong> {clientDetails.env}
          </p>
        </div>
      )}
    </main>
  );
}
