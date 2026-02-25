import 'dotenv/config'
import { query } from '../lib/db'

async function seed() {
    console.log('🌱 Starting database seeding...')

    try {
        console.log('Cleaning up existing data...')
        await query('SET FOREIGN_KEY_CHECKS = 0')
        await query('TRUNCATE TABLE BRAND')
        await query('TRUNCATE TABLE CATEGORY')
        await query('TRUNCATE TABLE SUPPLIER')
        await query('TRUNCATE TABLE CUSTOMER')
        await query('TRUNCATE TABLE PRODUCT_MODEL')
        await query('TRUNCATE TABLE PRODUCT_ITEM')
        await query('TRUNCATE TABLE SPARE_PART')
        await query('SET FOREIGN_KEY_CHECKS = 1')

        // 1. Brands
        console.log('Seeding Brands...')
        await query(`
      INSERT INTO BRAND (brand_name, brand_country) VALUES
      ('Apple', 'USA'),
      ('Samsung', 'South Korea'),
      ('Xiaomi', 'China'),
      ('Oppo', 'China'),
      ('Vivo', 'China')
    `)

        // 2. Categories
        console.log('Seeding Categories...')
        await query(`
      INSERT INTO CATEGORY (category_name_th, category_name_en) VALUES
      ('สมาร์ทโฟน', 'Smartphone'),
      ('แท็บเล็ต', 'Tablet'),
      ('อุปกรณ์เสริม', 'Accessories'),
      ('อะไหล่', 'Spare Parts')
    `)

        // 3. Suppliers
        console.log('Seeding Suppliers...')
        await query(`
      INSERT INTO SUPPLIER (supplier_name, supplier_phone, supplier_email, supplier_address, supplier_contact_person) VALUES
      ('Tech Distro Co.', '021112222', 'contact@techdistro.com', 'Bangkok, Thailand', 'John Doe'),
      ('Mobile Parts Ltd.', '023334444', 'sales@mobileparts.co.th', 'Nonthaburi, Thailand', 'Jane Smith')
    `)

        // 4. Customers
        console.log('Seeding Customers...')
        await query(`
      INSERT INTO CUSTOMER (customer_fname, customer_lname, customer_phone, customer_tax_number, customer_address) VALUES
      ('Somchai', 'Jaidee', '0812345678', '1234567890123', 'Chiang Mai, Thailand'),
      ('Suda', 'Maneerat', '0898765432', '9876543210987', 'Phuket, Thailand')
    `)

        // 5. Product Models
        console.log('Seeding Product Models...')
        // Assuming Apple is ID 1, Samsung is ID 2, Smartphone Category is ID 1
        await query(`
      INSERT INTO PRODUCT_MODEL (model_name, model_made_in, model_warranty_duration, brand_id, category_id) VALUES
      ('iPhone 15 Pro Max', 'China', 12, 1, 1),
      ('Galaxy S24 Ultra', 'Vietnam', 12, 2, 1)
    `)

        // 6. Product Items
        console.log('Seeding Product Items...')
        await query(`
      INSERT INTO PRODUCT_ITEM (item_serial_number, item_imei, item_lot_number, item_status, model_id) VALUES
      ('SN-APL-001', '351234567890123', 'LOT-2023-A', 'Available', 1),
      ('SN-APL-002', '351234567890124', 'LOT-2023-A', 'Available', 1),
      ('SN-SAM-001', '359876543210987', 'LOT-2023-B', 'Available', 2),
      ('SN-SAM-002', '359876543210988', 'LOT-2023-B', 'Out of Stock', 2)
    `)

        // 7. Spare Parts
        console.log('Seeding Spare Parts...')
        await query(`
      INSERT INTO SPARE_PART (part_name, part_status) VALUES
      ('iPhone 15 Display Assembly', 'Available'),
      ('Galaxy S24 Battery', 'Available')
    `)

        console.log('✅ Seeding completed successfully.')
        process.exit(0)
    } catch (error) {
        console.error('❌ Error during seeding:', error)
        process.exit(1)
    }
}

seed()
