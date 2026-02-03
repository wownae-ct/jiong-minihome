import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function promoteToAdmin(nickname: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { nickname },
    })

    if (!user) {
      console.error(`사용자 '${nickname}'을(를) 찾을 수 없습니다.`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`'${nickname}'은(는) 이미 관리자입니다.`)
      return
    }

    const updatedUser = await prisma.user.update({
      where: { nickname },
      data: { role: 'admin' },
    })

    console.log(`✅ '${updatedUser.nickname}'이(가) 관리자로 승격되었습니다.`)
    console.log(`   - ID: ${updatedUser.id}`)
    console.log(`   - Email: ${updatedUser.email}`)
    console.log(`   - Role: ${updatedUser.role}`)
  } catch (error) {
    console.error('관리자 승격 중 오류 발생:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const nickname = process.argv[2] || '지옹'
promoteToAdmin(nickname)
