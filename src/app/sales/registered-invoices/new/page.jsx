'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, Plus } from 'lucide-react'

export default function NewRegisteredInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])

  // Seller Information
  const [sellerInfo, setSellerInfo] = useState({
    ntn_cnic: '1234567',
    business_name: 'SUnny',
    province: 'Punjab',
    address: 'lsajflafjsikd,alsksjdlfasjk'
  })

  // Buyer Information
  const [buyerInfo, setBuyerInfo] = useState({
    ntn_cnic: '',
    province: '',
    address: '',
    registration_type: ''
  })

  // Invoice Details
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoice_type: '',
    invoice_date: new Date().toISOString().split('T')[0],
    local_invoice_number: ''
  })

  // Product Details
  const [productDetails, setProductDetails] = useState({
    stock_item: '',
    hs_code: '',
    sale_type: '',
    unit_of_measurement: '',
    rate: '',
    quantity: 0,
    description: ''
  })

  // Financial Details
  const [financialDetails, setFinancialDetails] = useState({
    value_sales_excluding_st: '0.00',
    sales_tax_applicable: '0.00',
    total_values: '0.00',
    fixed_notified_value_retail_price: '0.00',
    sales_tax_withheld_at_source: '0.00',
    extra_tax: '0.00',
    further_tax: '0.00',
    sro_schedule_number: '',
    fed_payable: '0.00',
    sro_item_serial_number: '',
    discount: '0.00'
  })

  useEffect(() => {
    fetchRegisteredCustomers()
    fetchItems()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.ntn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.customer_code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers([])
    }
  }, [searchQuery, customers])

  const fetchRegisteredCustomers = async () => {
    try {
      const res = await fetch('/api/customers/registered')
      const data = await res.json()
      if (data.success) {
        setCustomers(data.data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleCustomerSelect = (customer) => {
    setBuyerInfo({
      ntn_cnic: customer.ntn || customer.customer_code || '',
      province: customer.province || '',
      address: customer.address || '',
      registration_type: customer.ntn ? 'NTN' : 'STRN'
    })
    setSearchQuery(customer.name)
    setFilteredCustomers([])
  }

  const handleStockItemChange = (itemId) => {
    const selectedItem = items.find(item => item._id === itemId)
    if (selectedItem) {
      setProductDetails({
        ...productDetails,
        stock_item: itemId,
        description: selectedItem.description || selectedItem.name,
        rate: selectedItem.sale_price || 0,
        hs_code: selectedItem.hs_code || ''
      })
    }
  }

  const calculateFinancials = () => {
    const qty = parseFloat(productDetails.quantity) || 0
    const rate = parseFloat(productDetails.rate) || 0
    const discount = parseFloat(financialDetails.discount) || 0

    const valueSalesExcludingST = qty * rate
    const salesTaxApplicable = valueSalesExcludingST * 0.18 // 18% GST
    const totalValues = valueSalesExcludingST + salesTaxApplicable - discount

    setFinancialDetails(prev => ({
      ...prev,
      value_sales_excluding_st: valueSalesExcludingST.toFixed(2),
      sales_tax_applicable: salesTaxApplicable.toFixed(2),
      total_values: totalValues.toFixed(2)
    }))
  }

  useEffect(() => {
    calculateFinancials()
  }, [productDetails.quantity, productDetails.rate, financialDetails.discount])

  const handleSaveInvoice = async () => {
    setLoading(true)
    try {
      const payload = {
        seller: sellerInfo,
        buyer: buyerInfo,
        invoice: invoiceDetails,
        product: productDetails,
        financial: financialDetails,
        status: 'Draft'
      }

      const res = await fetch('/api/sales-invoices/fbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        alert('Invoice saved successfully!')
        router.push('/sales/registered-invoices')
      } else {
        alert(data.error || 'Failed to save invoice')
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Failed to save invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleSendToFBR = async () => {
    setLoading(true)
    try {
      const payload = {
        seller: sellerInfo,
        buyer: buyerInfo,
        invoice: invoiceDetails,
        product: productDetails,
        financial: financialDetails,
        status: 'Sent to FBR'
      }

      const res = await fetch('/api/sales-invoices/fbr/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        alert('Invoice sent to FBR successfully!')
        router.push('/sales/registered-invoices')
      } else {
        alert(data.error || 'Failed to send to FBR')
      }
    } catch (error) {
      console.error('Error sending to FBR:', error)
      alert('Failed to send to FBR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sale Invoice
            </h1>
            <Link
              href="/sales/registered-invoices"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Invoices
            </Link>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create and send invoices directly to FBR using your production token
          </p>
        </div>

        {/* Note */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Invoices created here will be saved to your database. You can save as draft and send to FBR later, or send directly. Once sent to FBR, the invoice will be locked and cannot be edited.
          </p>
        </div>

        <div className="space-y-6">
          {/* Seller Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Seller Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seller NTN/CNIC
                </label>
                <input
                  type="text"
                  value={sellerInfo.ntn_cnic}
                  onChange={(e) => setSellerInfo({ ...sellerInfo, ntn_cnic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seller Business Name
                </label>
                <input
                  type="text"
                  value={sellerInfo.business_name}
                  onChange={(e) => setSellerInfo({ ...sellerInfo, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seller Province
                </label>
                <input
                  type="text"
                  value={sellerInfo.province}
                  onChange={(e) => setSellerInfo({ ...sellerInfo, province: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seller Address
                </label>
                <input
                  type="text"
                  value={sellerInfo.address}
                  onChange={(e) => setSellerInfo({ ...sellerInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Buyer Information
              </h2>
              <Link
                href="/sales/customers/new"
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Buyer
              </Link>
            </div>

            {/* Search Buyer */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Buyer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Type to search buyer by name or NTN/CNIC"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer._id}
                      onClick={() => handleCustomerSelect(customer)}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.customer_code} {customer.ntn ? `- NTN: ${customer.ntn}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buyer NTN/CNIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerInfo.ntn_cnic}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, ntn_cnic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buyer Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerInfo.province}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, province: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buyer Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerInfo.address}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buyer Registration Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerInfo.registration_type}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, registration_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={invoiceDetails.invoice_type}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoice_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select invoice type</option>
                  <option value="B2B">B2B (Business to Business)</option>
                  <option value="B2C">B2C (Business to Consumer)</option>
                  <option value="Export">Export</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDetails.invoice_date}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, invoice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Local Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="Enter invoice number (e.g., 1, 5, 555, 893356)"
                  value={invoiceDetails.local_invoice_number}
                  onChange={(e) => setInvoiceDetails({ ...invoiceDetails, local_invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Product Details
              </h2>
              <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm">
                <Settings className="w-4 h-4" />
                Manage Stock
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Stock Item (Optional - Auto-fills HS Code)
              </label>
              <input
                type="text"
                placeholder="Type to search stock items"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HS Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Type HS code"
                  value={productDetails.hs_code}
                  onChange={(e) => setProductDetails({ ...productDetails, hs_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sale Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={productDetails.sale_type}
                  onChange={(e) => setProductDetails({ ...productDetails, sale_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select sale type</option>
                  <option value="Standard">Standard</option>
                  <option value="Zero Rated">Zero Rated</option>
                  <option value="Exempt">Exempt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit of Measurement <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={productDetails.unit_of_measurement}
                  onChange={(e) => setProductDetails({ ...productDetails, unit_of_measurement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select UoM</option>
                  <option value="PCS">PCS (Pieces)</option>
                  <option value="KG">KG (Kilogram)</option>
                  <option value="L">L (Liter)</option>
                  <option value="M">M (Meter)</option>
                  <option value="BOX">BOX</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rate <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={productDetails.rate}
                  onChange={(e) => setProductDetails({ ...productDetails, rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select rate</option>
                  <option value="18">18% (Standard)</option>
                  <option value="0">0% (Zero Rated)</option>
                  <option value="exempt">Exempt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={productDetails.quantity}
                  onChange={(e) => setProductDetails({ ...productDetails, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Description
              </label>
              <textarea
                rows={3}
                value={productDetails.description}
                onChange={(e) => setProductDetails({ ...productDetails, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Financial Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value Sales Excluding ST <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={financialDetails.value_sales_excluding_st}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sales Tax Applicable
                </label>
                <input
                  type="text"
                  value={financialDetails.sales_tax_applicable}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Values <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={financialDetails.total_values}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fixed Notified Value/Retail Price
                </label>
                <input
                  type="text"
                  value={financialDetails.fixed_notified_value_retail_price}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, fixed_notified_value_retail_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sales Tax Withheld at Source
                </label>
                <input
                  type="text"
                  value={financialDetails.sales_tax_withheld_at_source}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, sales_tax_withheld_at_source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Extra Tax
                </label>
                <input
                  type="text"
                  value={financialDetails.extra_tax}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, extra_tax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Further Tax
                </label>
                <input
                  type="text"
                  value={financialDetails.further_tax}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, further_tax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SRO Schedule Number
                </label>
                <input
                  type="text"
                  placeholder="Enter SRO Schedule Number"
                  value={financialDetails.sro_schedule_number}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, sro_schedule_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  FED Payable
                </label>
                <input
                  type="text"
                  value={financialDetails.fed_payable}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, fed_payable: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SRO Item Serial Number
                </label>
                <input
                  type="text"
                  placeholder="Enter SRO Item Serial Number"
                  value={financialDetails.sro_item_serial_number}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, sro_item_serial_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount
                </label>
                <input
                  type="text"
                  value={financialDetails.discount}
                  onChange={(e) => setFinancialDetails({ ...financialDetails, discount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-3 pb-8">
            <button
              onClick={handleSaveInvoice}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
            <button
              onClick={handleSendToFBR}
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending...' : 'Send to FBR'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 pb-8">
          © 2025 All rights reserved. | Digital Invoice Management System
        </div>
      </div>
    </div>
  )
}
