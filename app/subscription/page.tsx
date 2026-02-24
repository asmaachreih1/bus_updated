"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const packages = [
  {
    name: "Daily Subscription",
    price: "$5",
    type: "daily",
    description: "Access for 24 hours. Perfect for short-term needs."
  },
  {
    name: "Weekly Subscription",
    price: "$25",
    type: "weekly",
    description: "Access for 7 days. Ideal for regular commuters."
  },
  {
    name: "Monthly Subscription",
    price: "$80",
    type: "monthly",
    description: "Access for 30 days. Best value for frequent users."
  }
];

const SubscriptionPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('tracker_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSubscribe = async (type: string) => {
    if (!user) {
      alert('Please log in to subscribe.');
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageType: type, userId: user.id })
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        const errorMsg = data.details || data.error || 'Payment error. Please try again.';
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-10">
      <h1 className="text-3xl font-bold mb-8">Choose Your Subscription</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {packages.map((pkg, idx) => (
          <div key={idx} className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-2">{pkg.name}</h2>
            <p className="text-2xl font-bold mb-4">{pkg.price}</p>
            <p className="mb-6 text-gray-600">{pkg.description}</p>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => handleSubscribe(pkg.type)}
              disabled={!user}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
      {!user && (
        <div className="mt-8 text-red-500 text-lg">You must be logged in to subscribe.</div>
      )}
    </div>
  );
};

export default SubscriptionPage;
