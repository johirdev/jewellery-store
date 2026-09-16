/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Madina Diamond — main navigation
 * -----------------------------------------------------------------------
 * Fonts: this component leans on two families for the jewellery feel —
 *   - "Cormorant Garamond" (serif) for the wordmark, nav links & headings
 *   - "Jost" (sans) for UI chrome: search input, prices, small print
 * They're referenced with solid system-font fallbacks below, so the bar
 * renders fine even if the fonts aren't loaded yet. For the real look,
 * add them once in your root layout, e.g. with next/font/google:
 *
 *   import { Cormorant_Garamond, Jost } from "next/font/google";
 *   const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-serif" });
 *   const sans  = Jost({ subsets: ["latin"], weight: ["300","400","500"], variable: "--font-sans" });
 *
 * The color palette is self-contained (CSS variables set on the <header>),
 * so it doesn't depend on this project's existing globals.css tokens.
 * -----------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast"; // adjust to your existing toast import
import {
  useCartStore,
  useCartHydrated,
  selectItemCount,
} from "@/src/store/cart.store";

import Image from "next/image";

interface DropdownItem {
  label: string;
  href: string;
}

interface SubTitle {
  en?: string;
  bn?: string;
  [key: string]: string | undefined;
}

interface Category {
  _id: string;
  image?: string;
  name: string;
  sub_title?: SubTitle;
  slug?: string;
  sort_order?: number;
  status?: "active" | "inactive";
}

interface FoodVariation {
  _id: string;
  name?: string;
  regularPrice?: number;
  salePrice?: number;
  discountType?: "flat" | "percentage";
  discountValue?: number;
  is_default?: boolean;
  status?: "active" | "inactive";
  images?: { url?: string; [key: string]: any }[];
}

interface Food {
  _id: string;
  name: string;
  image?: string;
  category_id?: string;
  category_name?: string;
  status?: "active" | "inactive";
  variations?: FoodVariation[];
}

interface NavLink {
  label: string;
  href: string;
  dropdown?: DropdownItem[];
  isCategoryMenu?: boolean;
}

interface NavbarProps {
  navLinks?: NavLink[];
}

const DEFAULT_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/menu", isCategoryMenu: true },
  { label: "Our story", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

const SEARCH_DEBOUNCE_MS = 400;

// Font stacks — swap the first family in once you load the webfonts.
const FONT_SERIF = "";
const FONT_SANS = "";

// Self-contained jewellery palette — set once on the header and consumed
// everywhere below via var(--token) so the whole bar stays in one voice.
const PALETTE = {
  ["--onyx" as any]: "#025B9E",
  ["--onyx-soft" as any]: "#15130F",
  ["--onyx-line" as any]: "#2B261E",
  ["--gold" as any]: "#f0ca61",
  ["--gold-bright" as any]: "#E8CF8B",
  ["--ivory" as any]: "#F4EFE4",
  ["--ivory-faint" as any]: "#9C9382",
  ["--garnet" as any]: "#9C3B47",
} as React.CSSProperties;

const Navbar = ({ navLinks = DEFAULT_LINKS }: NavbarProps) => {
  const router = useRouter();

  // ===== cart (global zustand store) =====
  const cartCount = useCartStore(selectItemCount);
  const openCart = useCartStore((s) => s.openCart);
  const lastAddedKey = useCartStore((s) => s.lastAddedKey);
  const cartHydrated = useCartHydrated();
  const [bump, setBump] = useState(false);

  // কার্টে নতুন কিছু যোগ হলে ব্যাজটা একবার লাফ দেয়
  useEffect(() => {
    if (!lastAddedKey) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [lastAddedKey, cartCount]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState(false);

  // ===== search state =====
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodSearched, setFoodSearched] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== fetch categories =====
  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`/api/v1/categories`);
        const data: Category[] = res.data?.data || [];
        if (cancelled) return;
        setCategories(
          data
            .filter((c) => c.status !== "inactive")
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (!cancelled) setCatError(true);
      } finally {
        if (!cancelled) setCatLoading(false);
      }
    };
    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // close desktop dropdown on outside click, close search panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setDesktopDropdown(null);
      }
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // focus input when search panel opens
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    } else {
      setSearchTerm("");
      setFoods([]);
      setFoodSearched(false);
    }
  }, [searchOpen]);

  // ===== debounced fetch =====
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!searchTerm.trim()) {
      setFoods([]);
      setFoodSearched(false);
      setFoodLoading(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchFoods(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  const fetchFoods = async (term: string) => {
    try {
      setFoodLoading(true);
      const params: Record<string, any> = {
        page: 1,
        limit: 12,
        sortBy: "createdAt",
        sortOrder: "desc",
        searchTerm: term,
      };
      const res = await axios.get(`/api/v1/jewellery`, { params });
      setFoods(res.data.data || []);
    } catch {
      toast.error("Couldn't load pieces right now");
      setFoods([]);
    } finally {
      setFoodLoading(false);
      setFoodSearched(true);
    }
  };

  const openDropdown = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDesktopDropdown(label);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDesktopDropdown(null), 150);
  };

  const hasDropdown = (link: NavLink) =>
    !!link.dropdown || !!link.isCategoryMenu;

  const handleSearchToggle = () => {
    setSearchOpen((o) => !o);
    setMobileOpen(false);
    setDesktopDropdown(null);
  };

  const goToFood = (id: string) => {
    setSearchOpen(false);
    router.push(`/jewellery/${id}`);
  };

  // pick the default variation, fallback to first active one, then first one
  const getVariation = (f: Food): FoodVariation | undefined => {
    if (!f.variations || f.variations.length === 0) return undefined;
    return (
      f.variations.find((v) => v.is_default) ??
      f.variations.find((v) => v.status === "active") ??
      f.variations[0]
    );
  };

  const priceOf = (f: Food) => getVariation(f)?.regularPrice ?? 0;

  const discountOf = (f: Food) => {
    const v = getVariation(f);
    if (!v) return undefined;
    if (typeof v.salePrice === "number") return v.salePrice;
    if (v.discountType && v.discountValue) {
      const regular = v.regularPrice ?? 0;
      return v.discountType === "flat"
        ? regular - v.discountValue
        : Math.round(regular - (regular * v.discountValue) / 100);
    }
    return undefined;
  };

  return (
    <header
      style={PALETTE}
      className="sticky top-0 z-50 w-full bg-[var(--onyx)]"
    >
      {/* ===== Slim utility strip ===== */}
      {/* <div className="hidden sm:flex items-center justify-center border-b border-[var(--onyx-line)] py-1.5">
        <p
          style={{ fontFamily: FONT_SERIF }}
          className="text-[12px] italic tracking-[0.04em] text-[var(--ivory-faint)]"
        >
          Handcrafted fine jewellery, made to be kept
        </p>
      </div> */}

      {/* ===== Main bar ===== */}
      <div className="mx-auto grid max-width grid-cols-[1fr_auto_1fr] items-center px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
        {/* Left: logo */}
        <Link
          href="/"
          className=" flex gap-2 items-center gap-1 flex-shrink-0 justify-self-start"
        >
          <span className="h-12 w-12 overflow-hidden rounded-full  sm:h-14 sm:w-14 lg:h-16 lg:w-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              width={120}
              height={120}
              src="/Madina-Diamond.jpg"
              alt="Madina Diamond"
              className="h-full w-full object-cover"
            />
          </span>
          <div className="d">
            <span
              style={{ fontFamily: FONT_SERIF }}
              className="mt-0.5 flex items-baseline gap-1 text-[19px] font-medium leading-none text-[var(--ivory)] sm:text-[23px] lg:text-[26px]"
            >
              Madina <span className="italic text-[var(--gold)]">Diamond</span>
            </span>
            <span
              style={{ fontFamily: FONT_SANS }}
              className="hidden text-[9px] tracking-[0.28em] text-[var(--ivory-faint)] sm:block"
            >
              Fine jewellery
            </span>
          </div>
        </Link>

        {/* Center: desktop nav */}
        <nav
          ref={navRef}
          className="col-start-2 lg:ps-20 hidden lg:flex items-center mx-auto justify-center gap-8"
          style={{ fontFamily: FONT_SERIF }}
        >
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => hasDropdown(link) && openDropdown(link.label)}
              onMouseLeave={() => hasDropdown(link) && scheduleClose()}
            >
              {hasDropdown(link) ? (
                <button
                  type="button"
                  onClick={() =>
                    setDesktopDropdown((cur) =>
                      cur === link.label ? null : link.label,
                    )
                  }
                  className="group flex items-center gap-1.5 text-[16px] cursor-pointer text-[var(--ivory)] transition-colors hover:text-[var(--gold-bright)]"
                >
                  {link.label}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`text-[var(--gold)] transition-transform ${desktopDropdown === link.label ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className={`pointer-events-none absolute -bottom-1 left-1/2 h-px bg-[var(--gold)] transition-all duration-300 ${desktopDropdown === link.label ? "w-full -translate-x-1/2" : "w-0 -translate-x-1/2"}`}
                  />
                </button>
              ) : (
                <Link
                  href={link.href}
                  className="relative text-[16px] text-[var(--ivory)] transition-colors hover:text-[var(--gold-bright)]"
                >
                  {link.label}
                  <span className="pointer-events-none absolute -bottom-1 left-1/2 h-px w-0 bg-[var(--gold)] transition-all duration-300 group-hover:w-full" />
                </Link>
              )}

              {link.dropdown && desktopDropdown === link.label && (
                <div className="absolute left-0 top-full mt-4 w-56 rounded-sm border border-[var(--onyx-line)] bg-[var(--onyx-soft)] py-2 shadow-2xl">
                  {link.dropdown.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setDesktopDropdown(null)}
                      className="block px-5 py-2.5 text-[14px] text-[var(--ivory-faint)] transition-colors hover:bg-[var(--onyx)] hover:text-[var(--gold-bright)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {link.isCategoryMenu && desktopDropdown === link.label && (
                <div className="absolute left-1/2 top-full mt-4 w-[600px] -translate-x-1/2 rounded-sm border border-[var(--onyx-line)] bg-[var(--onyx-soft)] p-6 shadow-2xl">
                  {catLoading ? (
                    <div className="grid grid-cols-4 gap-5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--onyx-line)]" />
                          <div className="h-3 w-14 animate-pulse rounded bg-[var(--onyx-line)]" />
                        </div>
                      ))}
                    </div>
                  ) : catError ? (
                    <p
                      style={{ fontFamily: FONT_SANS }}
                      className="py-4 text-center text-[13px] text-[var(--ivory-faint)]"
                    >
                      Collections couldn&apos;t be loaded.
                    </p>
                  ) : categories.length === 0 ? (
                    <p
                      style={{ fontFamily: FONT_SANS }}
                      className="py-4 text-center text-[13px] text-[var(--ivory-faint)]"
                    >
                      No collections yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-x-5 gap-y-6">
                      {categories.map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/jewellery/${cat.slug ?? cat._id}`}
                          onClick={() => setDesktopDropdown(null)}
                          className="group flex flex-col items-center gap-2.5 text-center"
                        >
                          <span className="h-16 w-16 overflow-hidden rounded-full bg-[var(--onyx)] ring-1 ring-[var(--gold)]/40 transition-all group-hover:ring-[var(--gold-bright)]">
                            {cat.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <span
                                style={{ fontFamily: FONT_SANS }}
                                className="flex h-full w-full items-center justify-center text-[10px] text-[var(--ivory-faint)]"
                              >
                                No image
                              </span>
                            )}
                          </span>
                          <span className="text-[14px] text-[var(--ivory)] transition-colors group-hover:text-[var(--gold-bright)]">
                            {cat.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right: icons */}
        <div className="col-start-3 flex items-center justify-end gap-3 sm:gap-4 lg:gap-6">
          <button
            type="button"
            onClick={handleSearchToggle}
            aria-label="Search"
            className={`flex transition-colors ${searchOpen ? "text-[var(--gold-bright)]" : "text-[var(--ivory)] hover:text-[var(--gold)]"}`}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </button>

          

          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--gold)] text-[var(--gold)] transition-all hover:bg-[var(--gold)] hover:text-[var(--onyx)] active:scale-95 sm:h-10 sm:w-10"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                d="M6 6h15l-1.5 9h-12L6 6Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6 5 3H2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
            </svg>

            {cartHydrated && cartCount > 0 && (
              <span
                style={{ fontFamily: FONT_SANS }}
                className={`absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--onyx)] bg-[var(--gold)] px-1 text-[10px] font-semibold text-[var(--onyx)] ${
                  bump ? "cart-bump" : ""
                }`}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileOpen((o) => !o);
              setSearchOpen(false);
            }}
            aria-label="Toggle menu"
            className="flex lg:hidden flex-col items-center justify-center gap-[5px] w-8 h-8 flex-shrink-0"
          >
            <span
              className="block h-[1.5px] w-6 bg-[var(--gold)] transition-all"
              style={{
                transform: mobileOpen
                  ? "translateY(6.5px) rotate(45deg)"
                  : "none",
              }}
            />
            <span
              className="block h-[1.5px] w-6 bg-[var(--gold)] transition-all"
              style={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <span
              className="block h-[1.5px] w-6 bg-[var(--gold)] transition-all"
              style={{
                transform: mobileOpen
                  ? "translateY(-6.5px) rotate(-45deg)"
                  : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* ===== Animated search panel ===== */}
      <div
        ref={searchPanelRef}
        className="overflow-hidden border-t border-[var(--onyx-line)] bg-[var(--onyx-soft)] shadow-2xl transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: searchOpen ? 640 : 0,
          opacity: searchOpen ? 1 : 0,
        }}
      >
        <div className="mx-auto max-width px-4 py-6 max-w-[640px] sm:px-6 lg:px-10">
          <div className="relative flex items-center w-full sm:w-[600px] mx-auto border-b border-[var(--onyx-line)] focus-within:border-[var(--gold)]">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="absolute left-1 text-[var(--ivory-faint)]"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rings, necklaces, earrings…"
              style={{ fontFamily: FONT_SANS }}
              className="w-full bg-transparent py-3 pl-8 pr-8 text-[14px] text-[var(--ivory)] outline-none placeholder:text-[var(--ivory-faint)]"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="absolute  right-0 text-[var(--ivory-faint)] hover:text-[var(--gold)]"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* results */}
          <div className="mt-6 max-h-[420px] overflow-y-auto">
            {foodLoading ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="aspect-square w-full animate-pulse rounded-sm bg-[var(--onyx-line)]" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--onyx-line)]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--onyx-line)]" />
                  </div>
                ))}
              </div>
            ) : foods.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {foods.map((food) => {
                  const regular = priceOf(food);
                  const discount = discountOf(food);
                  const hasDiscount = !!discount && discount < regular;
                  return (
                    <button
                      key={food._id}
                      type="button"
                      onClick={() => goToFood(food._id)}
                      className="group flex flex-col items-start text-left"
                    >
                      <span className="aspect-square w-full overflow-hidden rounded-sm bg-[var(--onyx)] ring-1 ring-[var(--onyx-line)] transition-all group-hover:ring-[var(--gold)]">
                        {food.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={food.image}
                            alt={food.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span
                            style={{ fontFamily: FONT_SANS }}
                            className="flex h-full w-full items-center justify-center text-[11px] text-[var(--ivory-faint)]"
                          >
                            No image
                          </span>
                        )}
                      </span>
                      <span
                        style={{ fontFamily: FONT_SERIF }}
                        className="mt-2 line-clamp-2 text-[14px] text-[var(--ivory)] group-hover:text-[var(--gold-bright)]"
                      >
                        {food.name}
                      </span>
                      <span
                        style={{ fontFamily: FONT_SANS }}
                        className="mt-1 flex items-center gap-2"
                      >
                        {hasDiscount ? (
                          <>
                            <span className="text-[13px] font-medium text-[var(--gold)]">
                              ৳{discount}
                            </span>
                            <span className="text-[12px] text-[var(--garnet)] line-through">
                              ৳{regular}
                            </span>
                          </>
                        ) : (
                          <span className="text-[13px] font-medium text-[var(--ivory)]">
                            ৳{regular}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : foodSearched ? (
              <p
                style={{ fontFamily: FONT_SANS }}
                className="py-6 text-center text-[13px] text-[var(--ivory-faint)]"
              >
                No pieces found for {`"${searchTerm}"`}.
              </p>
            ) : searchTerm.trim() ? (
              <p
                style={{ fontFamily: FONT_SANS }}
                className="py-6 text-center text-[13px] text-[var(--ivory-faint)]"
              >
                Searching…
              </p>
            ) : (
              <p
                style={{ fontFamily: FONT_SANS }}
                className="py-6 text-center text-[13px] text-[var(--ivory-faint)]"
              >
                Start typing to explore the collection.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== Mobile slide-down menu ===== */}
      <div
        className="lg:hidden overflow-hidden  bg-[var(--onyx)] transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: mobileOpen ? 560 : 0 }}
      >
        <div className="px-4 py-3 sm:px-6 max-h-[70vh] overflow-y-auto">
        
          {navLinks.map((link) => (
            <div
              key={link.label}
              className=" last:border-b-0"
            >
              {hasDropdown(link) ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setMobileAccordion((cur) =>
                        cur === link.label ? null : link.label,
                      )
                    }
                    style={{ fontFamily: FONT_SERIF }}
                    className="flex w-full items-center justify-between py-3.5 text-[16px] text-[var(--ivory)]"
                  >
                    {link.label}
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className={`text-[var(--gold)] transition-transform ${mobileAccordion === link.label ? "rotate-180" : ""}`}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {link.dropdown && (
                    <div
                      className="overflow-hidden transition-[max-height] duration-300"
                      style={{
                        maxHeight: mobileAccordion === link.label ? 200 : 0,
                      }}
                    >
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          style={{ fontFamily: FONT_SANS }}
                          className="block py-2.5 pl-4 text-[13.5px] text-[var(--ivory-faint)]"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {link.isCategoryMenu && (
                    <div
                      className="overflow-hidden transition-[max-height] duration-300"
                      style={{
                        maxHeight: mobileAccordion === link.label ? 420 : 0,
                      }}
                    >
                      {catLoading ? (
                        <div className="grid grid-cols-4 gap-3 py-3 pl-2">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex flex-col items-center gap-1.5"
                            >
                              <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--onyx-line)]" />
                              <div className="h-2.5 w-10 animate-pulse rounded bg-[var(--onyx-line)]" />
                            </div>
                          ))}
                        </div>
                      ) : catError ? (
                        <p
                          style={{ fontFamily: FONT_SANS }}
                          className="py-3 pl-4 text-[13px] text-[var(--ivory-faint)]"
                        >
                          Collections couldn&apos;t be loaded.
                        </p>
                      ) : categories.length === 0 ? (
                        <p
                          style={{ fontFamily: FONT_SANS }}
                          className="py-3 pl-4 text-[13px] text-[var(--ivory-faint)]"
                        >
                          No collections yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-3 py-3 pl-2">
                          {categories.map((cat) => (
                            <Link
                              key={cat._id}
                              href={`/jewellery/${cat.slug ?? cat._id}`}
                              onClick={() => setMobileOpen(false)}
                              className="flex flex-col items-center gap-1.5 text-center"
                            >
                              <span className="h-12 w-12 overflow-hidden rounded-full bg-[var(--onyx-soft)] ring-1 ring-[var(--gold)]/40">
                                {cat.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span
                                    style={{ fontFamily: FONT_SANS }}
                                    className="flex h-full w-full items-center justify-center text-[9px] text-[var(--ivory-faint)]"
                                  >
                                    N/A
                                  </span>
                                )}
                              </span>
                              <span
                                style={{ fontFamily: FONT_SANS }}
                                className="text-[11px] leading-tight text-[var(--ivory)]"
                              >
                                {cat.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ fontFamily: FONT_SERIF }}
                  className="block py-3.5 text-[16px] text-[var(--ivory)]"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
