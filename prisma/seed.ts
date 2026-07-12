import { PrismaClient, Role, RoomType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumana.ng' },
    update: {},
    create: {
      name: 'Lumana Admin',
      email: 'admin@lumana.ng',
      password,
      role: Role.SUPER_ADMIN,
    },
  })

  const property = await prisma.property.upsert({
    where: { id: 'seed-property-1' },
    update: {},
    create: {
      id: 'seed-property-1',
      name: 'Lumana Wuse',
      address: 'Wuse Zone 5, Abuja, FCT',
    },
  })

  await prisma.propertyUser.upsert({
    where: { userId_propertyId: { userId: admin.id, propertyId: property.id } },
    update: {},
    create: { userId: admin.id, propertyId: property.id },
  })

  const area = await prisma.area.upsert({
    where: { id: 'seed-area-1' },
    update: {},
    create: {
      id: 'seed-area-1',
      name: 'Ground Floor',
      propertyId: property.id,
    },
  })

  const rooms = [
    { id: 'seed-room-1', name: 'Room 01', type: RoomType.STUDIO, baseRate: 25000 },
    { id: 'seed-room-2', name: 'Room 02', type: RoomType.ONE_BEDROOM, baseRate: 35000 },
    { id: 'seed-room-3', name: 'Room 03', type: RoomType.ONE_BEDROOM, baseRate: 35000 },
    { id: 'seed-room-4', name: 'Room 04', type: RoomType.TWO_BEDROOM, baseRate: 55000 },
  ]
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: { ...room, areaId: area.id },
    })
  }

  const staffPassword = await bcrypt.hash('Staff@1234', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@lumana.ng' },
    update: {},
    create: {
      name: 'Lumana Staff',
      email: 'staff@lumana.ng',
      password: staffPassword,
      role: Role.STAFF,
    },
  })
  await prisma.propertyUser.upsert({
    where: { userId_propertyId: { userId: staff.id, propertyId: property.id } },
    update: {},
    create: { userId: staff.id, propertyId: property.id },
  })

  console.log('Seed complete. Admin: admin@lumana.ng / Admin@1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
