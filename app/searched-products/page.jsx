import React, { Suspense } from "react";
import SearchedProducts from "@/components/SearchedProducts";

const Page = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading search results...</div>}>
      <SearchedProducts />
    </Suspense>
  );
};

export default Page;
