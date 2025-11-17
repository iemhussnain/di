/**
 * Sidebar Component
 * Main navigation sidebar for ERP modules
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  UserCircle,
  FileText,
  Settings,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Sales',
    icon: ShoppingCart,
    subItems: [
      { title: 'Orders', href: '/sales/orders' },
      { title: 'Registered Invoices', href: '/sales/registered-invoices' },
      { title: 'Unregistered Invoices', href: '/sales/unregistered-invoices' },
      { title: 'Customers', href: '/sales/customers' },
      { title: 'Payments', href: '/sales/payments' },
      { title: 'Analytics', href: '/sales/analytics' },
    ],
  },
  {
    title: 'Purchases',
    icon: ShoppingBag,
    subItems: [
      { title: 'Purchase Orders', href: '/purchases/orders' },
      { title: 'Purchase Invoices', href: '/purchases/invoices' },
      { title: 'Vendors', href: '/purchases/vendors' },
    ],
  },
  {
    title: 'Inventory',
    icon: Package,
    subItems: [
      { title: 'Items', href: '/inventory/items' },
      { title: 'Categories', href: '/inventory/categories' },
      { title: 'Low Stock', href: '/inventory/items/low-stock' },
    ],
  },
  {
    title: 'Accounting',
    icon: DollarSign,
    subItems: [
      { title: 'Chart of Accounts', href: '/accounting/accounts' },
      { title: 'Journal Entries', href: '/accounting/journal' },
      { title: 'Ledger', href: '/accounting/ledger' },
      { title: 'Trial Balance', href: '/accounting/trial-balance' },
      { title: 'Balance Sheet', href: '/accounting/balance-sheet' },
      { title: 'Profit & Loss', href: '/accounting/profit-loss' },
    ],
  },
  {
    title: 'HR & Payroll',
    icon: Users,
    subItems: [
      { title: 'Employees', href: '/hr/employees' },
      { title: 'Attendance', href: '/hr/attendance' },
      { title: 'Leave Management', href: '/hr/leaves' },
      { title: 'Payroll', href: '/hr/payroll' },
    ],
  },
  {
    title: 'FBR Compliance',
    icon: Building2,
    subItems: [
      { title: 'Testing', href: '/fbr/testing' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

function NavItem({ item, isOpen }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const hasSubItems = item.subItems && item.subItems.length > 0

  if (!hasSubItems) {
    const isActive = pathname === item.href

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200 group',
          isActive
            ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/40 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 shadow-sm'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm'
        )}
      >
        <item.icon className={cn(
          "h-5 w-5 transition-transform duration-200",
          isActive ? "scale-110" : "group-hover:scale-105"
        )} />
        {isOpen && <span className="tracking-wide">{item.title}</span>}
      </Link>
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200 group',
          'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm',
          expanded && 'bg-gray-50 dark:bg-gray-800/30'
        )}
      >
        <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
        {isOpen && (
          <>
            <span className="flex-1 text-left tracking-wide">{item.title}</span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
            )}
          </>
        )}
      </button>

      {expanded && isOpen && (
        <div className="ml-9 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {item.subItems.map((subItem) => {
            const isActive = pathname === subItem.href
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  'block rounded-lg px-3.5 py-2.5 text-[14px] transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm border-l-2 border-blue-600 dark:border-blue-400 -ml-[18px] pl-4'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-0.5'
                )}
              >
                {subItem.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-white dark:bg-gray-900 dark:border-gray-800/50 transition-all duration-300 shadow-lg',
          isOpen ? 'w-72' : 'w-0 lg:w-20',
          'lg:sticky'
        )}
      >
        <div className="flex h-full flex-col gap-1.5 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {menuItems.map((item, index) => (
            <NavItem key={index} item={item} isOpen={isOpen} />
          ))}
        </div>
      </aside>
    </>
  )
}
