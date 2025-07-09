"use client";
import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import fuzzysort from "fuzzysort";

const SearchedProducts = () => {
  const { products } = useAppContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("query") || "";

  // Filter products using fuzzysort based on the query from URL
  const filtered = useMemo(() => {
    if (!query.trim()) return products || [];

    const results = fuzzysort.go(query, products, {
      keys: ["name", "category"],
      threshold: -10000,
      limit: 50,
    });

    return results.map((r) => r.obj);
  }, [query, products]);

  // If no query, redirect to all products (optional)
  React.useEffect(() => {
    if (!query.trim()) {
      router.push("/all-products");
    }
  }, [query, router]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
        <div className="flex flex-col items-end pt-12">
          <p className="text-2xl font-medium">
            Search results for &quot;{query}&quot;
          </p>
          <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-10 w-full">
            No products found.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-12 pb-14 w-full">
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default SearchedProducts;
