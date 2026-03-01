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
      ('Vivo', 'China'),
      ('Realme', 'China'),
      ('Huawei', 'China'),
      ('Sony', 'Japan'),
      ('OnePlus', 'China'),
      ('Motorola', 'USA')
    `)

        // 2. Categories
        console.log('Seeding Categories...')
        await query(`
      INSERT INTO CATEGORY (category_name_th, category_name_en) VALUES
      ('สมาร์ทโฟน', 'Smartphone'),
      ('แท็บเล็ต', 'Tablet'),
      ('สมาร์ทวอทช์', 'Smartwatch'),
      ('หูฟังไร้สาย', 'Earbuds'),
      ('อุปกรณ์ชาร์จ', 'Charging Accessories'),
      ('เคสและฟิล์ม', 'Cases & Protectors'),
      ('อะไหล่', 'Spare Parts')
    `)

        // 3. Suppliers
        console.log('Seeding Suppliers...')
        await query(`
      INSERT INTO SUPPLIER (supplier_name, supplier_phone, supplier_email, supplier_address, supplier_contact_person) VALUES
      ('Tech Distro Co.', '021112222', 'contact@techdistro.com', 'Bangkok, Thailand', 'John Doe'),
      ('Mobile Parts Ltd.', '023334444', 'sales@mobileparts.co.th', 'Nonthaburi, Thailand', 'Jane Smith'),
      ('Siam Phone Wholesale', '025556666', 'info@siamphone.com', 'Pathum Thani, Thailand', 'Somsak Sae-Tia'),
      ('Global Gadget Importer', '027778888', 'import@globalgadget.th', 'Samut Prakan, Thailand', 'Tony Stark'),
      ('Mega Accessories', '029990000', 'wholesale@megaacc.com', 'Bangkok, Thailand', 'Bruce Wayne')
    `)

        // 4. Customers
        console.log('Seeding Customers...')
        await query(`
      INSERT INTO CUSTOMER (customer_fname, customer_lname, customer_phone, customer_tax_number, customer_address) VALUES
      ('Somchai', 'Jaidee', '0812345678', '1234567890123', 'Chiang Mai, Thailand'),
      ('Suda', 'Maneerat', '0898765432', '9876543210987', 'Phuket, Thailand'),
      ('Malee', 'Raktong', '0845556666', '3456789012345', 'Bangkok, Thailand'),
      ('Tanakorn', 'Sri-ngam', '0867778888', '4567890123456', 'Khon Kaen, Thailand'),
      ('Wandee', 'Phokhin', '0823334444', '5678901234567', 'Chonburi, Thailand'),
      ('Nattapong', 'Ruangdech', '0811112222', '6789012345678', 'Songkhla, Thailand')
    `)

        // 5. Product Models
        console.log('Seeding Product Models...')
        // Assuming Apple is ID 1, Samsung is ID 2, Smartphone Category is ID 1
        await query(`
      INSERT INTO PRODUCT_MODEL (model_name, model_made_in, model_warranty_duration, brand_id, category_id) VALUES
      ('iPhone 15 Pro Max', 'China', 12, 1, 1),
      ('iPhone 14', 'China', 12, 1, 1),
      ('iPad Air 5', 'China', 12, 1, 2),
      ('Galaxy S24 Ultra', 'Vietnam', 12, 2, 1),
      ('Galaxy Z Flip 5', 'Vietnam', 12, 2, 1),
      ('Galaxy Tab S9', 'Vietnam', 12, 2, 2),
      ('Redmi Note 13 Pro', 'China', 12, 3, 1),
      ('Oppo Reno 11', 'China', 12, 4, 1),
      ('Vivo V30', 'China', 12, 5, 1),
      ('Apple Watch Series 9', 'Vietnam', 12, 1, 3),
      ('AirPods Pro 2', 'Vietnam', 12, 1, 4)
    `)

        // 6. Product Items
        console.log('Seeding Product Items...')
        await query(`
      INSERT INTO PRODUCT_ITEM (item_serial_number, item_imei, item_lot_number, item_status, model_id) VALUES
      ('SN-APL-001', '351234567890123', 'LOT-2023-A', 'Available', 1),
      ('SN-APL-002', '351234567890124', 'LOT-2023-A', 'Available', 1),
      ('SN-APL-003', '351234567890125', 'LOT-2023-A', 'Sold', 1),
      ('SN-APL-004', '351234567890126', 'LOT-2023-A', 'Damaged', 1),
      ('SN-APL-005', '351234567890127', 'LOT-2023-B', 'Available', 2),
      ('SN-SAM-001', '359876543210987', 'LOT-2023-B', 'Available', 4),
      ('SN-SAM-002', '359876543210988', 'LOT-2023-B', 'Sold', 4),
      ('SN-SAM-003', '359876543210989', 'LOT-2023-B', 'Sold', 4),
      ('SN-SAM-004', '359876543210990', 'LOT-2023-C', 'Available', 5),
      ('SN-XIA-001', '861234567890123', 'LOT-2024-A', 'Available', 7),
      ('SN-APP-W01', 'N/A', 'LOT-2024-W', 'Available', 10),
      ('SN-APP-A01', 'N/A', 'LOT-2024-E', 'Available', 11)
    `)

        // 7. Spare Parts
        console.log('Seeding Spare Parts...')
        await query(`
      INSERT INTO SPARE_PART (part_name, part_status) VALUES
      ('iPhone 15 Display Assembly', 'Available'),
      ('iPhone 14 Display Assembly', 'Available'),
      ('Galaxy S24 Ultra Display Screen', 'Available'),
      ('iPhone 15 Battery', 'Available'),
      ('iPhone 14 Battery', 'Out of Stock'),
      ('Galaxy S24 Battery', 'Available'),
      ('Galaxy Z Flip 5 Inner Display', 'Available'),
      ('USB-C Charging Port Module (Generic)', 'Available'),
      ('Speaker Module (iPhone 15)', 'Available'),
      ('Camera Lens Glass (Galaxy S24 Ultra)', 'Available')
    `)

        console.log('✅ Seeding completed successfully.')
        process.exit(0)
    } catch (error) {
        console.error('❌ Error during seeding:', error)
        process.exit(1)
    }
}

seed()
