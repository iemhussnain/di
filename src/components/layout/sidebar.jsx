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
      { title: 'Invoices', href: '/sales/invoices' },
      { title: 'Customers', href: '/sales/customers' },
      { title: 'Payments', href: '/sales/payments' },
      { title: 'Credit Notes', href: '/sales/credit-notes' },
    ],
  },
  {
    title: 'Purchases',
    icon: ShoppingBag,
    subItems: [
      { title: 'Purchase Orders', href: '/purchases/orders' },
      { title: 'Vendors', href: '/purchases/vendors' },
      { title: 'Payments', href: '/purchases/payments' },
      { title: 'Debit Notes', href: '/purchases/debit-notes' },
    ],
  },
  {
    title: 'Inventory',
    icon: Package,
    subItems: [
      { title: 'Items', href: '/inventory/items' },
      { title: 'Stock Movement', href: '/inventory/movements' },
      { title: 'Stock Adjustment', href: '/inventory/adjustments' },
      { title: 'Stock Reports', href: '/inventory/reports' },
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
      { title: 'Financial Statements', href: '/accounting/statements' },
    ],
  },
  {
    title: 'HR & Payroll',
    icon: Users,
    subItems: [
      { title: 'Employees', href: '/hr/employees' },
      { title: 'Attendance', href: '/hr/attendance' },
      { title: 'Payroll', href: '/hr/payroll' },
      { title: 'Leaves', href: '/hr/leaves' },
    ],
  },
  {
    title: 'FBR Compliance',
    icon: Building2,
    subItems: [
      { title: 'FBR Invoices', href: '/fbr/invoices' },
      { title: 'Tax Returns', href: '/fbr/returns' },
      { title: 'Reports', href: '/fbr/reports' },
    ],
  },
  {
    title: 'Reports',
    icon: FileText,
    subItems: [
      { title: 'Sales Reports', href: '/reports/sales' },
      { title: 'Purchase Reports', href: '/reports/purchases' },
      { title: 'Inventory Reports', href: '/reports/inventory' },
      { title: 'Financial Reports', href: '/reports/financial' },
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
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <item.icon className="h-5 w-5" />
        {isOpen && <span>{item.title}</span>}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'text-gray-700 hover:bg-gray-100'
        )}
      >
        <item.icon className="h-5 w-5" />
        {isOpen && (
          <>
            <span className="flex-1 text-left">{item.title}</span>
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </>
        )}
      </button>

      {expanded && isOpen && (
        <div className="ml-8 mt-1 space-y-1">
          {item.subItems.map((subItem) => {
            const isActive = pathname === subItem.href
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
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
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-white transition-all duration-300',
          isOpen ? 'w-64' : 'w-0 lg:w-20',
          'lg:sticky'
        )}
      >
        <div className="flex h-full flex-col gap-2 overflow-y-auto p-4">
          {menuItems.map((item, index) => (
            <NavItem key={index} item={item} isOpen={isOpen} />
          ))}
        </div>
      </aside>
    </>
  )
}
