// Simple UI Validation for University Project
// Basic form validation functions for React components

export interface FieldError {
  field: string
  message: string
}

export interface FormValidation {
  isValid: boolean
  errors: FieldError[]
}

// Phone validation for UI
export const validatePhoneField = (phone: string): FieldError | null => {
  const phoneRegex = /^[0-9]{9,15}$/
  const cleanPhone = phone.replace(/[-\s]/g, '')
  
  if (!phone.trim()) {
    return { field: 'phone', message: 'เบอร์โทรศัพท์ต้องไม่ว่างเปล่า' }
  }
  
  if (!phoneRegex.test(cleanPhone)) {
    return { field: 'phone', message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-15 หลัก' }
  }
  
  return null
}

// Email validation for UI
export const validateEmailField = (email: string): FieldError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email.trim()) {
    return { field: 'email', message: 'อีเมลต้องไม่ว่างเปล่า' }
  }
  
  if (!emailRegex.test(email.trim())) {
    return { field: 'email', message: 'อีเมลต้องอยู่ในรูปแบบที่ถูกต้อง' }
  }
  
  return null
}

// Required field validation for UI
export const validateRequiredField = (value: string, fieldName: string, displayName: string): FieldError | null => {
  if (!value || value.trim().length === 0) {
    return { field: fieldName, message: `${displayName}ต้องไม่ว่างเปล่า` }
  }
  return null
}

// Number validation for UI
export const validatePositiveNumberField = (value: string, fieldName: string, displayName: string): FieldError | null => {
  if (!value || value.trim().length === 0) {
    return { field: fieldName, message: `${displayName}ต้องไม่ว่างเปล่า` }
  }
  
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) {
    return { field: fieldName, message: `${displayName}ต้องมากกว่า 0` }
  }
  
  return null
}

// IMEI validation for UI
export const validateIMEIField = (imei: string): FieldError | null => {
  const imeiRegex = /^[0-9]{15}$/
  const cleanImei = imei.replace(/[-\s]/g, '')
  
  if (imei.trim() && !imeiRegex.test(cleanImei)) {
    return { field: 'imei', message: 'หมายเลข IMEI ต้องเป็นตัวเลข 15 หลัก' }
  }
  
  return null
}

// Tax ID validation for UI
export const validateTaxIdField = (taxId: string): FieldError | null => {
  const taxIdRegex = /^[0-9]{13}$/
  const cleanTaxId = taxId.replace(/[-\s]/g, '')
  
  if (taxId.trim() && !taxIdRegex.test(cleanTaxId)) {
    return { field: 'taxId', message: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก' }
  }
  
  return null
}

// Brand form validation
export const validateBrandForm = (formData: {
  brand_name: string
  brand_country?: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const nameError = validateRequiredField(formData.brand_name, 'brand_name', 'ชื่อแบรนด์')
  if (nameError) errors.push(nameError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Category form validation
export const validateCategoryForm = (formData: {
  category_name_th: string
  category_name_en?: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const thNameError = validateRequiredField(formData.category_name_th, 'category_name_th', 'ชื่อหมวดหมู่ภาษาไทย')
  if (thNameError) errors.push(thNameError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Supplier form validation
export const validateSupplierForm = (formData: {
  supplier_name: string
  supplier_phone?: string
  supplier_email?: string
  supplier_address?: string
  supplier_contact_person?: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const nameError = validateRequiredField(formData.supplier_name, 'supplier_name', 'ชื่อซัพพลายเออร์')
  if (nameError) errors.push(nameError)
  
  const phoneError = validatePhoneField(formData.supplier_phone || '')
  if (phoneError) errors.push(phoneError)
  
  const emailError = validateEmailField(formData.supplier_email || '')
  if (emailError) errors.push(emailError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Customer form validation
export const validateCustomerForm = (formData: {
  customer_fname: string
  customer_lname: string
  customer_phone: string
  customer_tax_number?: string
  customer_address?: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const fnameError = validateRequiredField(formData.customer_fname, 'customer_fname', 'ชื่อ')
  if (fnameError) errors.push(fnameError)
  
  const lnameError = validateRequiredField(formData.customer_lname, 'customer_lname', 'นามสกุล')
  if (lnameError) errors.push(lnameError)
  
  const phoneError = validatePhoneField(formData.customer_phone)
  if (phoneError) errors.push(phoneError)
  
  const taxError = validateTaxIdField(formData.customer_tax_number || '')
  if (taxError) errors.push(taxError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Product Model form validation
export const validateProductModelForm = (formData: {
  model_name: string
  model_made_in?: string
  model_warranty_duration?: string
  brand_id: string
  category_id: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const nameError = validateRequiredField(formData.model_name, 'model_name', 'ชื่อรุ่นสินค้า')
  if (nameError) errors.push(nameError)
  
  const brandError = validateRequiredField(formData.brand_id, 'brand_id', 'แบรนด์')
  if (brandError) errors.push(brandError)
  
  const categoryError = validateRequiredField(formData.category_id, 'category_id', 'หมวดหมู่')
  if (categoryError) errors.push(categoryError)
  
  const warrantyError = validatePositiveNumberField(formData.model_warranty_duration || '12', 'model_warranty_duration', 'ระยะเวลารับประกัน')
  if (warrantyError) errors.push(warrantyError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Product Item form validation
export const validateProductItemForm = (formData: {
  item_serial_number?: string
  item_imei?: string
  item_lot_number?: string
  item_status: string
  model_id: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const modelError = validateRequiredField(formData.model_id, 'model_id', 'รุ่นสินค้า')
  if (modelError) errors.push(modelError)
  
  const imeiError = validateIMEIField(formData.item_imei || '')
  if (imeiError) errors.push(imeiError)
  
  const validStatuses = ['Available', 'Sold', 'Damaged', 'Reserved']
  if (!validStatuses.includes(formData.item_status)) {
    errors.push({ field: 'item_status', message: 'สถานะสินค้าไม่ถูกต้อง' })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Sale Order form validation
export const validateSaleOrderForm = (formData: {
  sale_code: string
  sale_total_amount: string
  sale_additional_cost?: string
  sale_status: string
  customer_id: string
}): FormValidation => {
  const errors: FieldError[] = []
  
  const codeError = validateRequiredField(formData.sale_code, 'sale_code', 'รหัสการขาย')
  if (codeError) errors.push(codeError)
  
  const amountError = validatePositiveNumberField(formData.sale_total_amount, 'sale_total_amount', 'ยอดรวม')
  if (amountError) errors.push(amountError)
  
  const customerError = validateRequiredField(formData.customer_id, 'customer_id', 'ลูกค้า')
  if (customerError) errors.push(customerError)
  
  const validStatuses = ['Pending', 'Completed', 'Cancelled']
  if (!validStatuses.includes(formData.sale_status)) {
    errors.push({ field: 'sale_status', message: 'สถานะการขายไม่ถูกต้อง' })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get error message for field
export const getFieldError = (errors: FieldError[], fieldName: string): string | null => {
  const error = errors.find(err => err.field === fieldName)
  return error ? error.message : null
}

// Check if field has error
export const hasFieldError = (errors: FieldError[], fieldName: string): boolean => {
  return errors.some(err => err.field === fieldName)
}
