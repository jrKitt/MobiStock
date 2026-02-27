const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '../public/config.json')

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')

    config.lastUpdated = `${year}-${month}-${day} ${hours}:${minutes}`

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8')

    console.log('อัปเดตวันที่สำเร็จ:', config.lastUpdated)
} catch (error) {
    console.error('เกิดข้อผิดพลาด:', error.message)
    process.exit(1)
}
