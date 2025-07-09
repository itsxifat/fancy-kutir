"use client";
import React, { useState, useEffect, useRef } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import fuzzysort from "fuzzysort";

const Navbar = () => {
  const { isSeller, router, user, products } = useAppContext();
  const { openSignIn } = useClerk();

  const [searchVisible, setSearchVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const inputRef = useRef(null);

  const toggleSearch = () => {
    setSearchVisible((prev) => !prev);
    if (searchVisible) {
      setSuggestions([]);
      setInputValue("");
    }
  };

  useEffect(() => {
    if (!inputValue.trim() || !products || products.length === 0) {
      setSuggestions([]);
      return;
    }
    const results = fuzzysort.go(inputValue, products, {
      keys: ["name", "category"],
      limit: 5,
      threshold: -10000,
    });
    setSuggestions(results);
  }, [inputValue, products]);

  // Redirect search query to searched-products page
  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    router.push(`/searched-products?query=${encodeURIComponent(inputValue.trim())}`);

    setSearchVisible(false);
    setSuggestions([]);
  };

  // Same redirect for clicking a suggestion
  const handleSuggestionClick = (item) => {
    const searchStr = item.obj.name;
    setInputValue(searchStr);
    router.push(`/searched-products?query=${encodeURIComponent(searchStr)}`);
    setSuggestions([]);
    setSearchVisible(false);
  };

  useEffect(() => {
    if (searchVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchVisible]);

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700 relative">
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push("/")}
        src={assets.logo}
        alt="logo"
      />

      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/">Home</Link>
        <Link href="/all-products">Shop</Link>
        <Link href="/">About Us</Link>
        <Link href="/">Contact</Link>
        {isSeller && (
          <button
            onClick={() => router.push("/seller")}
            className="text-xs border px-4 py-1.5 rounded-full"
          >
            Seller Dashboard
          </button>
        )}
      </div>

      {/* Search & User area */}
      <div className="flex items-center gap-4 relative">
        {/* Search icon */}
        <button
          onClick={toggleSearch}
          aria-label="Toggle search"
          aria-expanded={searchVisible}
          aria-controls="search-suggestions-list"
          className="w-6 h-6 flex items-center justify-center"
        >
          <Image src={assets.search_icon} alt="search icon" className="w-5 h-5" />
        </button>

        {/* Search input & suggestions */}
        {searchVisible && (
          <form
            onSubmit={handleSearch}
            className="absolute top-full right-0 mt-2 bg-white shadow rounded-md w-64 z-30"
            role="search"
          >
            <input
              ref={inputRef}
              type="search"
              inputMode="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search products..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search products"
              aria-autocomplete="list"
              aria-controls="search-suggestions-list"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e);
                }
              }}
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <ul
                id="search-suggestions-list"
                role="listbox"
                className="max-h-48 overflow-y-auto mt-1"
              >
                {suggestions.map((item, idx) => (
                  <li
                    key={idx}
                    id={`suggestion-${idx}`}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSuggestionClick(item)}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSuggestionClick(item);
                    }}
                  >
                    {item.obj.name} <span className="text-gray-400">({item.obj.category})</span>
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}

        {/* User menu */}
        {user ? (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action label="Home" labelIcon={<HomeIcon />} onClick={() => router.push("/")} />
              <UserButton.Action label="Products" labelIcon={<BoxIcon />} onClick={() => router.push("/all-products")} />
              <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push("/cart")} />
              <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push("/my-orders")} />
            </UserButton.MenuItems>
          </UserButton>
        ) : (
          <button onClick={openSignIn} className="hover:text-gray-900 transition flex items-center gap-1">
            <Image src={assets.user_icon} alt="user icon" /> Account
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
