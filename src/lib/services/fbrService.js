/**
 * FBR API Service
 * Handles all FBR (Federal Board of Revenue) API integrations
 */

const FBR_BASE_URL = process.env.FBR_BASE_URL || 'https://gw.fbr.gov.pk'
const FBR_TIMEOUT = parseInt(process.env.FBR_TIMEOUT) || 30000
const FBR_RETRY_ATTEMPTS = parseInt(process.env.FBR_RETRY_ATTEMPTS) || 3

class FBRService {
  /**
   * Make API request to FBR
   * @private
   */
  async makeRequest(endpoint, token, options = {}) {
    const url = `${FBR_BASE_URL}${endpoint}`
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    }

    if (options.body) {
      config.body = JSON.stringify(options.body)
    }

    let lastError
    for (let attempt = 1; attempt <= FBR_RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), FBR_TIMEOUT)

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`FBR API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error
        if (attempt < FBR_RETRY_ATTEMPTS) {
          // Exponential backoff: 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw lastError
  }

  /**
   * Fetch provinces (cached in DB)
   */
  async fetchProvinces(token) {
    return this.makeRequest('/pdi/v1/provinces', token)
  }

  /**
   * Fetch document types (cached in DB)
   */
  async fetchDocTypes(token) {
    return this.makeRequest('/pdi/v1/doctypecode', token)
  }

  /**
   * Fetch HS Codes (cached in DB)
   */
  async fetchHSCodes(token) {
    return this.makeRequest('/pdi/v1/itemdesccode', token)
  }

  /**
   * Fetch SRO items (cached in DB)
   */
  async fetchSROItems(token) {
    return this.makeRequest('/pdi/v1/sroitemcode', token)
  }

  /**
   * Fetch transaction types (cached in DB)
   */
  async fetchTransTypes(token) {
    return this.makeRequest('/pdi/v1/transtypecode', token)
  }

  /**
   * Fetch units of measurement (cached in DB)
   */
  async fetchUOM(token) {
    return this.makeRequest('/pdi/v1/uom', token)
  }

  /**
   * Fetch SRO Schedule (dynamic, not cached)
   */
  async fetchSROSchedule(token, rateId, date, originationSupplier) {
    const params = new URLSearchParams({
      rate_id: rateId,
      date: date,
      origination_supplier_csv: originationSupplier,
    })
    return this.makeRequest(`/pdi/v1/SroSchedule?${params}`, token)
  }

  /**
   * Fetch sale type to rate mapping (dynamic, not cached)
   */
  async fetchSaleTypeToRate(token, date, transTypeId, originationSupplier) {
    const params = new URLSearchParams({
      date: date,
      transTypeId: transTypeId,
      originationSupplier: originationSupplier,
    })
    return this.makeRequest(`/pdi/v2/SaleTypeToRate?${params}`, token)
  }

  /**
   * Fetch HS Code with UOM (dynamic, not cached)
   */
  async fetchHSCodeUOM(token, hsCode, annexureId) {
    const params = new URLSearchParams({
      hs_code: hsCode,
      annexure_id: annexureId,
    })
    return this.makeRequest(`/pdi/v2/HS_UOM?${params}`, token)
  }

  /**
   * Fetch SRO Item v2 (dynamic, not cached)
   */
  async fetchSROItemV2(token, date, sroId) {
    const params = new URLSearchParams({
      date: date,
      sro_id: sroId,
    })
    return this.makeRequest(`/pdi/v2/SROItem?${params}`, token)
  }

  /**
   * Check STATL registration status
   */
  async checkSTATL(token, regno, date) {
    return this.makeRequest('/dist/v1/statl', token, {
      method: 'POST',
      body: { regno, date },
    })
  }

  /**
   * Get registration type
   */
  async getRegistrationType(token, registrationNo) {
    return this.makeRequest('/dist/v1/Get_Reg_Type', token, {
      method: 'POST',
      body: { Registration_No: registrationNo },
    })
  }

  /**
   * Validate invoice data (sandbox)
   */
  async validateInvoiceSandbox(token, invoiceData) {
    return this.makeRequest('/di_data/v1/di/validateinvoicedata_sb', token, {
      method: 'POST',
      body: invoiceData,
    })
  }

  /**
   * Post invoice data (sandbox)
   */
  async postInvoiceSandbox(token, invoiceData) {
    return this.makeRequest('/di_data/v1/di/postinvoicedata_sb', token, {
      method: 'POST',
      body: invoiceData,
    })
  }

  /**
   * Validate invoice data (production)
   */
  async validateInvoiceProduction(token, invoiceData) {
    return this.makeRequest('/di_data/v1/di/validateinvoicedata', token, {
      method: 'POST',
      body: invoiceData,
    })
  }

  /**
   * Post invoice data (production)
   */
  async postInvoiceProduction(token, invoiceData) {
    return this.makeRequest('/di_data/v1/di/validateinvoicedata', token, {
      method: 'POST',
      body: invoiceData,
    })
  }
}

export default new FBRService()
