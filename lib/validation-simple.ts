// Simple Validation for University Project
// Basic validation functions for MobiStock

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Phone validation (Thai format)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{9,15}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ''))
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Thai tax ID validation (13 digits)
export const validateTaxId = (taxId: string): boolean => {
  const taxIdRegex = /^[0-9]{13}$/
  return taxIdRegex.test(taxId.replace(/[-\s]/g, ''))
}

// IMEI validation (15 digits)
export const validateIMEI = (imei: string): boolean => {
  const imeiRegex = /^[0-9]{15}$/
  return imeiRegex.test(imei.replace(/[-\s]/g, ''))
}

// Required field validation
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

// Positive number validation
export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num > 0
}

// Non-negative number validation
export const validateNonNegativeNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num >= 0
}

// Brand validation
export const validateBrand = (brand: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(brand.brand_name)) {
    errors.push('ชื่อแบรนด์ต้องไม่ว่างเปล่า')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Category validation
export const validateCategory = (category: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(category.category_name_th)) {
    errors.push('ชื่อหมวดหมู่ภาษาไทยต้องไม่ว่างเปล่า')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Supplier validation
export const validateSupplier = (supplier: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(supplier.supplier_name)) {
    errors.push('ชื่อซัพพลายเออร์ต้องไม่ว่างเปล่า')
  }

  if (supplier.supplier_phone && supplier.supplier_phone.trim()) {
    if (!validatePhone(supplier.supplier_phone)) {
      errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-15 หลัก')
    }
  }

  if (supplier.supplier_email && supplier.supplier_email.trim()) {
    if (!validateEmail(supplier.supplier_email)) {
      errors.push('อีเมลต้องอยู่ในรูปแบบที่ถูกต้อง')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Customer validation
export const validateCustomer = (customer: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(customer.customer_fname)) {
    errors.push('ชื่อต้องไม่ว่างเปล่า')
  }

  if (!validateRequired(customer.customer_lname)) {
    errors.push('นามสกุลต้องไม่ว่างเปล่า')
  }

  if (!validateRequired(customer.customer_phone)) {
    errors.push('เบอร์โทรศัพท์ต้องไม่ว่างเปล่า')
  } else if (!validatePhone(customer.customer_phone)) {
    errors.push('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-15 หลัก')
  }

  if (customer.customer_tax_number && customer.customer_tax_number.trim()) {
    if (!validateTaxId(customer.customer_tax_number)) {
      errors.push('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Product Model validation
export const validateProductModel = (model: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(model.model_name)) {
    errors.push('ชื่อรุ่นสินค้าต้องไม่ว่างเปล่า')
  }

  if (!validatePositiveNumber(model.brand_id)) {
    errors.push('กรุณาเลือกแบรนด์')
  }

  if (!validatePositiveNumber(model.category_id)) {
    errors.push('กรุณาเลือกหมวดหมู่')
  }

  if (model.model_warranty_duration !== undefined) {
    if (!validateNonNegativeNumber(model.model_warranty_duration)) {
      errors.push('ระยะเวลารับประกันต้องไม่ติดลบ')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Product Item validation
export const validateProductItem = (item: any): ValidationResult => {
  const errors: string[] = []

  if (!validatePositiveNumber(item.model_id)) {
    errors.push('กรุณาเลือกรุ่นสินค้า')
  }

  if (item.item_imei && item.item_imei.trim()) {
    if (!validateIMEI(item.item_imei)) {
      errors.push('หมายเลข IMEI ต้องเป็นตัวเลข 15 หลัก')
    }
  }

  const validStatuses = ['Available', 'Sold', 'Damaged', 'Reserved']
  if (!validStatuses.includes(item.item_status)) {
    errors.push('สถานะสินค้าไม่ถูกต้อง')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Sale Order validation
export const validateSaleOrder = (order: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(order.sale_code)) {
    errors.push('รหัสการขายต้องไม่ว่างเปล่า')
  }

  if (!validatePositiveNumber(order.sale_total_amount)) {
    errors.push('ยอดรวมต้องมากกว่า 0')
  }

  if (order.sale_additional_cost !== undefined) {
    if (!validateNonNegativeNumber(order.sale_additional_cost)) {
      errors.push('ค่าใช้จ่ายเพิ่มเติมต้องไม่ติดลบ')
    }
  }

  if (!validatePositiveNumber(order.customer_id)) {
    errors.push('กรุณาเลือกลูกค้า')
  }

  const validStatuses = ['Pending', 'Completed', 'Cancelled']
  if (!validStatuses.includes(order.sale_status)) {
    errors.push('สถานะการขายไม่ถูกต้อง')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Format validation errors for API response
export const formatValidationErrors = (validation: ValidationResult): string[] => {
  return validation.errors
}
