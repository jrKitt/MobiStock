import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { query, ResultSetHeader } from '../lib/db'

async function seed() {
    console.log('🌱 Starting database seeding...')

    try {
        // ── Cleanup ──────────────────────────────────────────────────────────
        console.log('Cleaning up existing data...')
        await query('SET FOREIGN_KEY_CHECKS = 0')
        await query('TRUNCATE TABLE ORDER_HISTORY_LOG')
        await query('TRUNCATE TABLE REPAIR_ORDER_IMAGE')
        await query('TRUNCATE TABLE REPAIR_ORDER_PART')
        await query('TRUNCATE TABLE REPAIR_ORDER')
        await query('TRUNCATE TABLE CLAIM_ORDER')
        await query('TRUNCATE TABLE SALE_ORDER_ITEM')
        await query('TRUNCATE TABLE SALE_ORDER')
        await query('TRUNCATE TABLE SUPPLIER_SPARE_PART')
        await query('TRUNCATE TABLE SPARE_PART')
        await query('TRUNCATE TABLE PRODUCT_ITEM')
        await query('TRUNCATE TABLE PRODUCT_MODEL')
        await query('TRUNCATE TABLE BRAND')
        await query('TRUNCATE TABLE CATEGORY')
        await query('TRUNCATE TABLE SUPPLIER')
        await query('TRUNCATE TABLE CUSTOMER')
        await query('TRUNCATE TABLE User')
        await query('SET FOREIGN_KEY_CHECKS = 1')

        // Ensure schema is up-to-date for tables that may predate migrations
        await query(`
            ALTER TABLE User
            ADD COLUMN IF NOT EXISTS role ENUM('admin', 'staff') DEFAULT 'staff'
        `)
        await query(`
            ALTER TABLE SALE_ORDER
            ADD COLUMN IF NOT EXISTS sale_additional_cost DECIMAL(10, 2) DEFAULT 0
        `)

        // ── 1. Brands ────────────────────────────────────────────────────────
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

        // ── 2. Categories ────────────────────────────────────────────────────
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

        // ── 3. Suppliers ─────────────────────────────────────────────────────
        console.log('Seeding Suppliers...')
        await query(`
            INSERT INTO SUPPLIER (supplier_name, supplier_phone, supplier_email, supplier_address, supplier_contact_person) VALUES
            ('Tech Distro Co.', '021112222', 'contact@techdistro.com', 'Bangkok, Thailand', 'John Doe'),
            ('Mobile Parts Ltd.', '023334444', 'sales@mobileparts.co.th', 'Nonthaburi, Thailand', 'Jane Smith'),
            ('Siam Phone Wholesale', '025556666', 'info@siamphone.com', 'Pathum Thani, Thailand', 'Somsak Sae-Tia'),
            ('Global Gadget Importer', '027778888', 'import@globalgadget.th', 'Samut Prakan, Thailand', 'Tony Stark'),
            ('Mega Accessories', '029990000', 'wholesale@megaacc.com', 'Bangkok, Thailand', 'Bruce Wayne')
        `)

        // ── 4. Customers ─────────────────────────────────────────────────────
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

        // ── 5. Product Models ────────────────────────────────────────────────
        // brand_id: Apple=1 Samsung=2 Xiaomi=3 Oppo=4 Vivo=5
        // category_id: Smartphone=1 Tablet=2 Smartwatch=3 Earbuds=4
        console.log('Seeding Product Models...')
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

        // ── 6. Product Items ─────────────────────────────────────────────────
        // item_id 3, 7, 8 → Sold (used in sale orders below)
        // item_id 4 → Damaged (used in a repair order below)
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

        // ── 7. Spare Parts ───────────────────────────────────────────────────
        console.log('Seeding Spare Parts...')
        await query(`
            INSERT INTO SPARE_PART (part_name, part_quantity) VALUES
            ('iPhone 15 Display Assembly', 25),
            ('iPhone 14 Display Assembly', 15),
            ('Galaxy S24 Ultra Display Screen', 20),
            ('iPhone 15 Battery', 50),
            ('iPhone 14 Battery', 8),
            ('Galaxy S24 Battery', 30),
            ('Galaxy Z Flip 5 Inner Display', 10),
            ('USB-C Charging Port Module (Generic)', 40),
            ('Speaker Module (iPhone 15)', 18),
            ('Camera Lens Glass (Galaxy S24 Ultra)', 12)
        `)

        // ── 8. Supplier ↔ Spare Part links ───────────────────────────────────
        // supplier_id: TechDistro=1 MobileParts=2 SiamPhone=3
        // part_id: iP15 Display=1, iP14 Display=2, S24 Display=3, iP15 Bat=4
        console.log('Seeding Supplier Spare Parts...')
        await query(`
            INSERT INTO SUPPLIER_SPARE_PART (supplier_id, part_id) VALUES
            (1, 1), (1, 4), (1, 9),
            (2, 1), (2, 2), (2, 3), (2, 5), (2, 6), (2, 10),
            (3, 7), (3, 8)
        `)

        // ── 9. Sale Orders ───────────────────────────────────────────────────
        console.log('Seeding Sale Orders...')
        const sale1 = await query(
            `INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_additional_cost, sale_status, customer_id, create_by, update_by)
             VALUES ('SO-20260101-00001', '2026-01-10 10:30:00', 42900.00, 0.00, 'Completed', 1, 'admin', 'admin')`
        )
        const sale1Id = (sale1 as ResultSetHeader).insertId
        await query(
            `INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (42900.00, ?, 3)`,
            [sale1Id]
        )

        const sale2 = await query(
            `INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_additional_cost, sale_status, customer_id, create_by, update_by)
             VALUES ('SO-20260115-00002', '2026-01-15 14:00:00', 55400.00, 500.00, 'Completed', 2, 'admin', 'admin')`
        )
        const sale2Id = (sale2 as ResultSetHeader).insertId
        await query(
            `INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (27450.00, ?, 7), (27450.00, ?, 8)`,
            [sale2Id, sale2Id]
        )

        const sale3 = await query(
            `INSERT INTO SALE_ORDER (sale_code, sale_date, sale_total_amount, sale_additional_cost, sale_status, customer_id, create_by, update_by)
             VALUES ('SO-20260301-00003', '2026-03-01 09:15:00', 39900.00, 1000.00, 'Pending', 3, 'admin', 'admin')`
        )
        const sale3Id = (sale3 as ResultSetHeader).insertId
        await query(
            `INSERT INTO SALE_ORDER_ITEM (sale_price, sale_id, item_id) VALUES (38900.00, ?, 9)`,
            [sale3Id]
        )

        // ── 10. Repair Orders ────────────────────────────────────────────────
        console.log('Seeding Repair Orders...')
        const repair1 = await query(
            `INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_labor_cost, repair_status, customer_id, item_id, create_by, update_by)
             VALUES ('หน้าจอแตก ทัสกรีนไม่ตอบสนอง', NULL, '2026-03-01 11:00:00', NULL, 'received', 4, 4, 'admin', 'admin')`
        )
        const repair1Id = (repair1 as ResultSetHeader).insertId
        await query(
            'UPDATE REPAIR_ORDER SET repair_code = ? WHERE repair_id = ?',
            [`RPR-20260301-${String(repair1Id).padStart(5, '0')}`, repair1Id]
        )

        const repair2 = await query(
            `INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_labor_cost, repair_status, customer_id, item_id, create_by, update_by)
             VALUES ('แบตเตอรี่เสื่อม ชาร์จไม่เข้า', 'เปลี่ยนแบตเตอรี่และพอร์ตชาร์จ', '2026-03-03 13:30:00', 500.00, 'in_progress', 5, 5, 'admin', 'admin')`
        )
        const repair2Id = (repair2 as ResultSetHeader).insertId
        await query(
            'UPDATE REPAIR_ORDER SET repair_code = ? WHERE repair_id = ?',
            [`RPR-20260303-${String(repair2Id).padStart(5, '0')}`, repair2Id]
        )
        // Parts used in repair 2
        await query(
            `INSERT INTO REPAIR_ORDER_PART (repair_id, part_id, repair_part_quantity, repair_part_unit_price)
             VALUES (?, 5, 1, 1200.00), (?, 8, 1, 350.00)`,
            [repair2Id, repair2Id]
        )

        // repair 2b — waiting_payment: ซ่อมเสร็จแล้ว รอลูกค้ามาจ่ายเงิน
        const repair2b = await query(
            `INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_labor_cost, repair_status, customer_id, item_id, create_by, update_by)
             VALUES ('กล้องหลังโฟกัสไม่ได้', 'เปลี่ยนโมดูลกล้องใหม่ ทดสอบผ่านแล้ว รอลูกค้ามารับและชำระเงิน', '2026-03-05 10:00:00', 800.00, 'waiting_payment', 3, 6, 'admin', 'admin')`
        )
        const repair2bId = (repair2b as ResultSetHeader).insertId
        await query(
            'UPDATE REPAIR_ORDER SET repair_code = ? WHERE repair_id = ?',
            [`RPR-20260305-${String(repair2bId).padStart(5, '0')}`, repair2bId]
        )
        await query(
            `INSERT INTO REPAIR_ORDER_PART (repair_id, part_id, repair_part_quantity, repair_part_unit_price)
             VALUES (?, 10, 1, 1500.00)`,
            [repair2bId]
        )

        const repair3 = await query(
            `INSERT INTO REPAIR_ORDER (repair_problem_desc, repair_technician_note, repair_date_received, repair_date_completed, repair_labor_cost, repair_status, customer_id, item_id, create_by, update_by)
             VALUES ('ลำโพงไม่มีเสียง', 'เปลี่ยนลำโพงใหม่ ทดสอบผ่านแล้ว', '2026-02-20 10:00:00', '2026-02-22 16:00:00', 300.00, 'completed', 6, 10, 'admin', 'admin')`
        )
        const repair3Id = (repair3 as ResultSetHeader).insertId
        await query(
            'UPDATE REPAIR_ORDER SET repair_code = ? WHERE repair_id = ?',
            [`RPR-20260220-${String(repair3Id).padStart(5, '0')}`, repair3Id]
        )
        await query(
            `INSERT INTO REPAIR_ORDER_PART (repair_id, part_id, repair_part_quantity, repair_part_unit_price)
             VALUES (?, 9, 1, 800.00)`,
            [repair3Id]
        )

        // ── 11. Claim Orders ─────────────────────────────────────────────────
        console.log('Seeding Claim Orders...')
        await query(
            `INSERT INTO CLAIM_ORDER (claim_code, claim_date_received, claim_status, claim_resolution, supplier_id, customer_id, item_id, create_by, update_by)
             VALUES
             ('CLM-20260210-00001', '2026-02-10 09:00:00', 'resolved', 'replacement', 1, 1, 3, 'admin', 'admin'),
             ('CLM-20260305-00002', '2026-03-05 14:30:00', 'in_review', 'unknown', 2, 4, 4, 'admin', 'admin')`
        )

        // ── 12. Users ─────────────────────────────────────────────────────────
        console.log('Seeding Users...')
        const adminHash = await bcrypt.hash('admin1234', 10)
        const staffHash = await bcrypt.hash('staff1234', 10)
        await query(
            `INSERT INTO User (username, email, password, role) VALUES
             ('admin', 'admin@mobistock.com', ?, 'admin'),
             ('staff01', 'staff01@mobistock.com', ?, 'staff')`,
            [adminHash, staffHash]
        )

        console.log('✅ Seeding completed successfully.')
        console.log('   admin@mobistock.com  / admin1234')
        console.log('   staff01@mobistock.com / staff1234')
        process.exit(0)
    } catch (error) {
        console.error('❌ Error during seeding:', error)
        process.exit(1)
    }
}

seed()
