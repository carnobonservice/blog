"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
    useCurrentAccount,
    useCurrentClient,
    useCurrentNetwork,
    useCurrentWallet,
    useDAppKit,
} from "@mysten/dapp-kit-react"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut } from "lucide-react"

const SuiConnectButton = dynamic(
    () => import("@mysten/dapp-kit-react/ui").then(module => module.ConnectButton),
    {
        ssr: false,
        loading: () => <Button disabled size="sm">Connect</Button>,
    },
)

function shortenAddress(address: string) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function addressHash(address: string) {
    let hash = 0
    for (let index = 0; index < address.length; index += 1) {
        hash = (hash << 5) - hash + address.charCodeAt(index)
        hash |= 0
    }
    return hash >>> 0
}

function AddressAvatar({ address, className }: { address: string; className?: string }) {
    const hash = addressHash(address)
    const hue = hash % 360
    const cells: Array<[number, number]> = []

    for (let index = 0; index < 15; index += 1) {
        const bit = (hash >>> (index % 24)) & 1
        const column = index % 3
        const row = Math.floor(index / 3)

        if (bit) {
            cells.push([column, row], [4 - column, row])
        }
    }

    return (
        <svg
            aria-hidden="true"
            className={cn("shrink-0 rounded-full bg-muted", className)}
            viewBox="0 0 5 5"
        >
            <rect fill={`hsl(${hue} 55% 22%)`} height="5" width="5" />
            {cells.map(([x, y], index) => (
                <rect fill={`hsl(${hue} 78% 66%)`} height="1" key={`${x}-${y}-${index}`} width="1" x={x} y={y} />
            ))}
        </svg>
    )
}

function WalletControl() {
    const account = useCurrentAccount()
    const wallet = useCurrentWallet()
    const dAppKit = useDAppKit()

    if (!account || !wallet) {
        return <SuiConnectButton aria-label="Connect Sui wallet" />
    }

    return (
        <Popover>
            <PopoverTrigger
                aria-label={`Wallet ${shortenAddress(account.address)}`}
                render={
                    <Button size="sm" variant="outline">
                        <AddressAvatar address={account.address} className="size-5" />
                        <span className="hidden sm:inline">{shortenAddress(account.address)}</span>
                        <ChevronDown className="size-3.5" />
                    </Button>
                }
            />
            <PopoverContent align="end" className="w-64 p-2">
                <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">{wallet.name}</p>
                    <p className="mt-0.5 truncate font-medium">{account.address}</p>
                </div>
                <div className="my-1 border-t" />
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Accounts</p>
                {wallet.accounts.map(walletAccount => {
                    const isCurrentAccount = walletAccount.address === account.address

                    return (
                        <button
                            className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                                isCurrentAccount && "bg-accent",
                            )}
                            key={walletAccount.address}
                            onClick={() => dAppKit.switchAccount({ account: walletAccount })}
                            type="button"
                        >
                            <AddressAvatar address={walletAccount.address} className="size-7" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{walletAccount.label ?? shortenAddress(walletAccount.address)}</span>
                                <span className="block truncate text-xs text-muted-foreground">{shortenAddress(walletAccount.address)}</span>
                            </span>
                            {isCurrentAccount && <span className="text-xs text-muted-foreground">Active</span>}
                        </button>
                    )
                })}
                <div className="my-1 border-t" />
                <Button className="w-full justify-start" onClick={() => void dAppKit.disconnectWallet()} size="sm" variant="ghost">
                    <LogOut />
                    Disconnect
                </Button>
            </PopoverContent>
        </Popover>
    )
}

function WalletBalance() {
    const account = useCurrentAccount()
    const client = useCurrentClient()
    const network = useCurrentNetwork()
    const { data, isPending } = useQuery({
        queryKey: ["balance", account?.address, network],
        queryFn: () => client.core.getBalance({
            owner: account!.address,
            coinType: "0x2::sui::SUI",
        }),
        enabled: Boolean(account),
        refetchInterval: 15_000,
    })

    if (!account) return null

    const amount = Number(data?.balance.balance ?? "0") / 1_000_000_000
    const formattedAmount = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 4,
    }).format(amount)

    return (
        <span className="hidden text-sm font-medium tabular-nums text-foreground sm:inline">
            {isPending ? "Loading..." : `${formattedAmount} SUI`}
        </span>
    )
}

// Simple logo component for the navbar
const Logo = () => {
    return (
        <Image src="/logo.png" alt="Logo" width={64} height={64} />
    )
}

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGSVGElement>) => (
    <svg
        aria-label="Menu"
        className={cn("pointer-events-none", className)}
        fill="none"
        height={16}
        role="img"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={16}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
            d="M4 12L20 12"
        />
        <path
            className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
            d="M4 12H20"
        />
        <path
            className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
            d="M4 12H20"
        />
    </svg>
)

// Types
export interface NavbarNavLink {
    href: string
    label: string
    active?: boolean
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
    logo?: React.ReactNode
    navigationLinks?: NavbarNavLink[]
}

// Default navigation links
const defaultNavigationLinks: NavbarNavLink[] = [
    { href: "/", label: "Home" },
    { href: "/discover", label: "Discover" },
    { href: "/events", label: "Events" },
    { href: "/messages", label: "Messages" },
    { href: "/notifications", label: "Notifications" },
    { href: "/profile", label: "Profile" },
]

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
    (
        {
            className,
            logo = <Logo />,
            navigationLinks = defaultNavigationLinks,
            ...props
        },
        ref,
    ) => {
        const [isMobile, setIsMobile] = useState(false)
        const containerRef = useRef<HTMLElement>(null)
        const pathname = usePathname()

        useEffect(() => {
            const checkWidth = () => {
                if (containerRef.current) {
                    const width = containerRef.current.offsetWidth
                    setIsMobile(width < 768) // 768px is md breakpoint
                }
            }

            checkWidth()

            const resizeObserver = new ResizeObserver(checkWidth)
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current)
            }

            return () => {
                resizeObserver.disconnect()
            }
        }, [])

        // Combine refs
        const combinedRef = React.useCallback(
            (node: HTMLElement | null) => {
                containerRef.current = node
                if (typeof ref === "function") {
                    ref(node)
                } else if (ref) {
                    ref.current = node
                }
            },
            [ref],
        )

        return (
            <header
                className={cn(
                    "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline",
                    className,
                )}
                ref={combinedRef}
                {...props}
            >
                <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-center gap-2">
                        {/* Mobile menu trigger */}
                        {isMobile && (
                            <Popover>
                                <PopoverTrigger
                                    render={
                                        <Button
                                            className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <HamburgerIcon />
                                        </Button>
                                    }
                                />
                                <PopoverContent align="start" className="w-48 p-2">
                                    <NavigationMenu className="max-w-none">
                                        <NavigationMenuList className="flex-col items-start gap-1">
                                            {navigationLinks.map((link, index) => (
                                                <NavigationMenuItem className="w-full" key={index}>
                                                    <Link
                                                        href={link.href}
                                                        className={cn(
                                                            "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer no-underline",
                                                            pathname === link.href
                                                                ? "bg-accent text-accent-foreground"
                                                                : "text-foreground/80",
                                                        )}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </NavigationMenuItem>
                                            ))}
                                        </NavigationMenuList>
                                    </NavigationMenu>
                                </PopoverContent>
                            </Popover>
                        )}
                        {/* Main nav */}
                        <div className="flex items-center gap-6">
                            <Link
                                href="/"
                                className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors cursor-pointer"
                            >
                                <div className="text-2xl">{logo}</div>
                            </Link>
                            {/* Navigation menu */}
                            {!isMobile && (
                                <NavigationMenu className="flex">
                                    <NavigationMenuList className="gap-1">
                                        {navigationLinks.map((link, index) => (
                                            <NavigationMenuItem key={index}>
                                                <Link
                                                    href={link.href}
                                                    className={cn(
                                                        "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer no-underline",
                                                        pathname === link.href
                                                            ? "bg-accent text-accent-foreground"
                                                            : "text-foreground/80 hover:text-foreground",
                                                    )}
                                                >
                                                    {link.label}
                                                </Link>
                                            </NavigationMenuItem>
                                        ))}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <WalletBalance />
                        <WalletControl />
                    </div>
                </div>
            </header>
        )
    },
)

Navbar.displayName = "Navbar"

export { Logo, HamburgerIcon }

// Demo
export function Header() {
    return <Navbar />
}
