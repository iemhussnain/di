// Quick script to check users in database
const mongoose = require('mongoose')

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system')
    console.log('✅ Connected to MongoDB')

    const users = await mongoose.connection.db.collection('users').find({}).toArray()

    console.log(`\n📊 Found ${users.length} users:\n`)

    if (users.length === 0) {
      console.log('⚠️  No users found in database!')
      console.log('\n💡 Create a user by visiting: http://localhost:3000/register')
    } else {
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Status: ${user.status}`)
        console.log('')
      })
    }

    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkUsers()
