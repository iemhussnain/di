# FBR (Federal Board of Revenue) Compliance Implementation

**Date:** 2025-11-17  
**Status:** Foundation Complete - Implementation In Progress  
**Phase:** FBR Compliance (Phase 2)

---

## Overview

This document outlines the implementation of Pakistan's FBR Digital Invoicing system integration with the ERP. The FBR compliance module enables businesses to:

- Submit sales invoices to FBR in real-time
- Validate invoice data before submission
- Cache FBR reference data (provinces, HS codes, tax rates, etc.)
- Handle both sandbox (testing) and production environments
- Lock invoices once FBR approval is received
- Support 28+ different tax scenarios

---

## Current Implementation Status

### ✅ Completed (Foundation)

1. **FBR Reference Data Models**
   - `FBRProvince` - Province codes and descriptions
   - `FBRDocType` - Document types (Sale Invoice, Debit Note)
   - `FBRHSCode` - Harmonized System codes for products
   - `FBRTransType` - Transaction types
   - `FBRUOM` - Units of Measurement

2. **FBR Invoice Model**
   - `FBRInvoice` - Stores invoice submissions and FBR responses
   - Supports both Sale Invoices and Debit Notes
   - Tracks validation status and FBR invoice numbers
   - Invoice locking mechanism when FBR number received

3. **User Model Extensions**
   - Added company tax information fields:
     - `company_ntn` (7-digit NTN)
     - `company_strn` (format: 00-00-0000-000-00)
     - `company_ref_no` (format: 0000000-0)
     - `company_province`
     - `company_address`
     - `fbr_sandbox_token` (encrypted)
     - `fbr_production_token` (encrypted)
     - `fbr_registration_status`

4. **Customer Model Extensions**
   - Added buyer tax information fields:
     - `ref_no` (Reference number)
     - `fbr_registration_status`
     - `buyer_registration_type` (Registered/Unregistered)
   - Existing fields: `ntn`, `strn`

### 🚧 In Progress / To Be Implemented

1. **FBR API Service** - API client for FBR endpoints
2. **Reference Data APIs** - Routes to fetch and cache FBR data
3. **Invoice Submission APIs** - Validate and post invoices to FBR
4. **Testing Scenarios Page** - UI for 28 predefined test scenarios
5. **Sales Invoice Integration** - Link existing invoices with FBR
6. **Caching Strategy** - Implement 1-week cache refresh

---

## FBR API Endpoints

### 1. Digital Invoicing APIs

#### Sandbox Environment
```
POST https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb
POST https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb
```

#### Production Environment
```
POST https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata
```

### 2. Reference Data APIs (Cached)

All require FBR token authentication.

| API | Method | Purpose | Cache |
|-----|--------|---------|-------|
| `/pdi/v1/provinces` | GET | Province codes | 1 week |
| `/pdi/v1/doctypecode` | GET | Document types | 1 week |
| `/pdi/v1/itemdesccode` | GET | HS Codes | 1 week |
| `/pdi/v1/sroitemcode` | GET | SRO Items | 1 week |
| `/pdi/v1/transtypecode` | GET | Transaction types | 1 week |
| `/pdi/v1/uom` | GET | Units of Measurement | 1 week |
| `/pdi/v1/SroSchedule` | GET | SRO Schedule (dynamic) | No cache |
| `/pdi/v2/SaleTypeToRate` | GET | Tax rates by sale type | No cache |
| `/pdi/v2/HS_UOM` | GET | HS Code with UOM | No cache |
| `/pdi/v2/SROItem` | GET | SRO Items (v2) | No cache |

### 3. STATL APIs (Registration Status)

```
GET https://gw.fbr.gov.pk/dist/v1/statl
GET https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type
```

---

## Invoice Data Structure

### Sample FBR Invoice Payload

```json
{
  "invoiceType": "Sale Invoice",
  "invoiceDate": "2025-04-21",
  "sellerNTNCNIC": "0786909",
  "sellerBusinessName": "Company 8",
  "sellerProvince": "Sindh",
  "sellerAddress": "Karachi",
  "buyerNTNCNIC": "1000000000000",
  "buyerBusinessName": "FERTILIZER MANUFAC IRS NEW",
  "buyerProvince": "Sindh",
  "buyerAddress": "Karachi",
  "buyerRegistrationType": "Unregistered",
  "invoiceRefNo": "",
  "items": [
    {
      "hsCode": "0101.2100",
      "productDescription": "product Description",
      "rate": "18%",
      "uoM": "Numbers, pieces, units",
      "quantity": 1.0000,
      "totalValues": 0.00,
      "valueSalesExcludingST": 1000.00,
      "fixedNotifiedValueOrRetailPrice": 0.00,
      "salesTaxApplicable": 180.00,
      "salesTaxWithheldAtSource": 0.00,
      "extraTax": 0.00,
      "furtherTax": 120.00,
      "sroScheduleNo": "SRO123",
      "fedPayable": 0.00,
      "discount": 0.00,
      "saleType": "Goods at standard rate (default)",
      "sroItemSerialNo": ""
    }
  ]
}
```

### Valid Response Example

```json
{
  "invoiceNumber": "7000007DI1747119701593",
  "dated": "2025-05-13 12:01:41",
  "validationResponse": {
    "statusCode": "00",
    "status": "Valid",
    "error": "",
    "invoiceStatuses": [
      {
        "itemSNo": "1",
        "statusCode": "00",
        "status": "Valid",
        "invoiceNo": "7000007DI1747119701593-1",
        "errorCode": "",
        "error": ""
      }
    ]
  }
}
```

### Invalid Response Example

```json
{
  "dated": "2025-05-13 13:09:05",
  "validationResponse": {
    "statusCode": "01",
    "status": "Invalid",
    "errorCode": "0052",
    "error": "Provide proper HS Code with invoice no. null",
    "invoiceStatuses": null
  }
}
```

---

## Caching Strategy

### Cache Requirements

1. **Cache Duration:** 1 week (7 days)
2. **Cache Refresh:** Only on successful API calls
3. **Cache Storage:** MongoDB collections (FBR models)
4. **Cache Invalidation:** Automatic after 7 days

### Cached Data

- ✅ Provinces
- ✅ Document Types
- ✅ HS Codes
- ✅ SRO Items
- ✅ Transaction Types
- ✅ Units of Measurement

### Non-Cached (Dynamic) Data

- SRO Schedules (require date/rate parameters)
- Sale Type to Rate mappings (require date/transaction type)
- HS Code with UOM (require specific HS code)

### Cache Implementation Pattern

```javascript
// Example: Fetch provinces with cache
async function getProvinces() {
  // Check if cache is stale
  const isStale = await FBRProvince.isCacheStale()
  
  if (isStale) {
    // Fetch from FBR API
    const response = await fetch('https://gw.fbr.gov.pk/pdi/v1/provinces', {
      headers: { 'Authorization': `Bearer ${sandboxToken}` }
    })
    const data = await response.json()
    
    // Refresh cache
    await FBRProvince.refreshCache(data)
  }
  
  // Return from cache
  return await FBRProvince.find()
}
```

---

## Tax Field Formats & Validation

### NTN (National Tax Number)
- **Format:** 7 digits
- **Example:** `0786909`
- **Regex:** `/^\d{7}$/`

### STRN/GST (Sales Tax Registration Number)
- **Format:** `00-00-0000-000-00`
- **Example:** `01-23-4567-890-12`
- **Regex:** `/^\d{2}-\d{2}-\d{4}-\d{3}-\d{2}$/`

### Reference Number
- **Format:** `0000000-0`
- **Example:** `1234567-0`
- **Regex:** `/^\d{7}-\d$/`

### Province
- Auto-filled via API based on NTN
- Must match FBR province codes (2-9)

### Registration Status
- Fetched via STATL API
- Values: `Active`, `Inactive`, `Not Registered`

---

## Testing Scenarios (28 Scenarios)

The system includes 28 predefined test scenarios covering different tax situations:

1. **SN001** - Sale of Standard Rate Goods to Registered Buyers
2. **SN002** - Sale of Standard Rate Goods to Unregistered Buyers
3. **SN003** - Sale of Steel (Melted and Re-Rolled)
4. **SN005** - Sales of Reduced Rate Goods (Eighth Schedule)
5. **SN006** - Sale of Exempt Goods (Sixth Schedule)
6. **SN007** - Sale Of Zero-Rated Goods (Fifth Schedule)
7. **SN008** - Sale of 3rd Schedule Goods
8. **SN009** - Purchase From Registered Cotton Ginners
9. **SN010** - Sale Of Telecom Services by Mobile Operators
10. **SN012** - Sale Of Petroleum Products
11. **SN013** - Sale Of Electricity to Retailers
12. **SN014** - Sale of Gas to CNG Stations
13. **SN015** - Sale of Mobile Phones
14. **SN016** - Processing / Conversion of Goods
15. **SN017** - Sale of Goods Where FED Is Charged in ST Mode
16. **SN018** - Sale Of Services Where FED Is Charged in ST Mode
17. **SN019** - Sale of Services (as per ICT Ordinance)
18. **SN020** - Sale of Electric Vehicles
19. **SN021** - Sale of Cement /Concrete Block
20. **SN022** - Sale of Potassium Chlorate
21. **SN023** - Sale of CNG
22. **SN024** - Sale Of Goods Listed in SRO 297(1)/2023
23. **SN025** - Drugs Sold at Fixed ST Rate
24. **SN026** - Sale Of Goods at Standard Rate to End Consumers
25. **SN027** - Sale Of 3rd Schedule Goods to End Consumers
26. **SN028** - Sale of Goods at Reduced Rate to End Consumers

Each scenario includes:
- Complete invoice data
- Expected tax calculations
- Specific SRO schedules
- Transaction type
- Rate information

---

## Invoice Locking Mechanism

### Requirements

1. **Lock Trigger:** When FBR invoice number is received (statusCode: "00")
2. **Lock Actions:**
   - Set `isLocked = true` on FBRInvoice
   - Set `fbr_locked = true` on SalesInvoice
   - Prevent edit operations
   - Prevent delete operations

### Implementation

```javascript
// In FBRInvoice model
FBRInvoiceSchema.methods.lockInvoice = function () {
  this.isLocked = true
  return this.save()
}

// After receiving valid FBR response
if (response.statusCode === '00') {
  await fbrInvoice.lockInvoice()
  await salesInvoice.lockForFBR(response.invoiceNumber)
}
```

### UI Indicators

- 🔒 Lock icon on locked invoices
- Disabled edit/delete buttons
- Warning message: "This invoice is locked by FBR and cannot be modified"

---

## Implementation Roadmap

### Phase 1: Foundation ✅ (Current)

- [x] FBR reference data models
- [x] FBR invoice model
- [x] User tax information fields
- [x] Customer tax information fields

### Phase 2: API Integration (Next)

- [ ] FBR API service class
- [ ] Reference data fetching with caching
- [ ] STATL registration status API
- [ ] Province auto-fill on NTN entry

### Phase 3: Invoice Submission

- [ ] Invoice validation API
- [ ] Invoice posting API (sandbox)
- [ ] Invoice posting API (production)
- [ ] Error handling and retry logic

### Phase 4: UI Integration

- [ ] Tax information forms (User settings)
- [ ] Tax information forms (Customer management)
- [ ] FBR testing scenarios page
- [ ] Invoice FBR submission button
- [ ] FBR status indicators

### Phase 5: Invoice Locking

- [ ] Update SalesInvoice model with fbr_locked field
- [ ] Implement lock mechanism
- [ ] Update API routes to prevent locked invoice edits
- [ ] Update UI to show lock status

### Phase 6: Testing & Deployment

- [ ] Test all 28 scenarios in sandbox
- [ ] Validate data formats
- [ ] Test cache refresh mechanism
- [ ] Production deployment checklist

---

## File Structure

```
src/
├── lib/
│   ├── models/
│   │   ├── fbr/
│   │   │   ├── FBRProvince.js ✅
│   │   │   ├── FBRDocType.js ✅
│   │   │   ├── FBRHSCode.js ✅
│   │   │   ├── FBRTransType.js ✅
│   │   │   ├── FBRUOM.js ✅
│   │   │   └── FBRInvoice.js ✅
│   │   ├── User.js ✅ (updated)
│   │   └── Customer.js ✅ (updated)
│   ├── services/
│   │   └── fbrService.js (TODO)
│   └── constants/
│       └── fbrScenarios.json (TODO)
├── app/
│   ├── api/
│   │   └── fbr/
│   │       ├── provinces/route.js (TODO)
│   │       ├── doctypes/route.js (TODO)
│   │       ├── hscodes/route.js (TODO)
│   │       ├── validate/route.js (TODO)
│   │       ├── submit/route.js (TODO)
│   │       └── statl/route.js (TODO)
│   └── fbr/
│       ├── settings/page.jsx (TODO)
│       └── testing/page.jsx (TODO)
└── components/
    └── fbr/
        ├── TaxInfoForm.jsx (TODO)
        ├── ScenarioTester.jsx (TODO)
        └── FBRStatus.jsx (TODO)
```

---

## Security Considerations

### Token Management

1. **Storage:** FBR tokens stored encrypted in User model
2. **Access:** `select: false` - not returned by default
3. **Usage:** Retrieved only when making FBR API calls
4. **Rotation:** Should support token refresh mechanism

### Data Validation

1. **Format Validation:** Regex patterns for NTN, STRN, ref_no
2. **API Validation:** Server-side validation before FBR submission
3. **Response Validation:** Verify FBR response structure
4. **Error Handling:** Proper error messages without exposing sensitive data

### Rate Limiting

1. **FBR API Calls:** Implement rate limiting to avoid API abuse
2. **Cache First:** Always check cache before API call
3. **Retry Logic:** Exponential backoff on failures
4. **Circuit Breaker:** Stop requests if FBR API is down

---

## Environment Variables

Add to `.env`:

```env
# FBR Configuration
FBR_SANDBOX_URL=https://gw.fbr.gov.pk
FBR_PRODUCTION_URL=https://gw.fbr.gov.pk
FBR_TIMEOUT=30000
FBR_RETRY_ATTEMPTS=3
```

---

## Next Steps

### Immediate Tasks

1. **Create FBR Service Class**
   ```javascript
   // src/lib/services/fbrService.js
   class FBRService {
     async fetchProvinces(token)
     async fetchDocTypes(token)
     async fetchHSCodes(token)
     async validateInvoice(invoiceData, token, environment)
     async submitInvoice(invoiceData, token, environment)
     async checkSTATL(ntn, date, token)
   }
   ```

2. **Create Reference Data APIs**
   - GET `/api/fbr/provinces` - Cached provinces
   - GET `/api/fbr/doctypes` - Cached document types
   - GET `/api/fbr/hscodes?search=` - Search HS codes
   - GET `/api/fbr/transtypes` - Transaction types
   - GET `/api/fbr/uom` - Units of measurement

3. **Create Invoice APIs**
   - POST `/api/fbr/validate` - Validate invoice
   - POST `/api/fbr/submit` - Submit to FBR
   - GET `/api/fbr/status/:invoiceId` - Check FBR status

4. **Create Testing UI**
   - FBR Settings page (`/fbr/settings`)
   - Scenarios testing page (`/fbr/testing`)
   - 28 scenarios with Validate/Post buttons
   - "Post All" functionality

---

## Success Criteria

### Functional

- ✅ All reference data cached and refreshable
- ⏳ Invoice validation returns correct FBR response
- ⏳ Invoice submission generates FBR invoice number
- ⏳ Locked invoices cannot be edited or deleted
- ⏳ All 28 scenarios pass in sandbox environment
- ⏳ STATL integration auto-fills registration status

### Technical

- ✅ Models support all required FBR fields
- ⏳ API calls have proper error handling
- ⏳ Caching reduces API calls by 95%
- ⏳ Token encryption protects credentials
- ⏳ Response times under 3 seconds
- ⏳ 100% test coverage for critical paths

### User Experience

- ⏳ Clear FBR status indicators
- ⏳ Helpful error messages
- ⏳ Auto-fill reduces data entry
- ⏳ One-click scenario testing
- ⏳ Locked invoices clearly marked

---

## References

- FBR Digital Invoicing Portal: https://e.fbr.gov.pk/esbn/
- FBR API Documentation: (Provided by FBR)
- Sales Tax Act 1990
- Income Tax Ordinance 2001

---

**End of FBR Compliance Implementation Guide**
