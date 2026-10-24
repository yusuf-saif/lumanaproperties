import {
  PrismaClient,
  Role,
  RoomType,
  RoomStatus,
  OccupancyStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
  IncomeSource,
  PaymentMethod,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Site Settings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      orgName: 'Lumana Hotel Apartments',
      orgTagline: 'Luxury Serviced Apartments · Lagos & Abuja',
      reportFooter: 'Confidential · Lumana Hotel Apartments Operations Intelligence',
    },
  })

  // 2. Properties
  const propLekki = await prisma.property.upsert({
    where: { id: 'prop-lekki' },
    update: {},
    create: {
      id: 'prop-lekki',
      name: 'Lumana Lekki',
      address: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
    },
  })

  const propVI = await prisma.property.upsert({
    where: { id: 'prop-vi' },
    update: {},
    create: {
      id: 'prop-vi',
      name: 'Lumana Victoria Island',
      address: '12 Karimu Kotun Street, Victoria Island, Lagos',
    },
  })

  const propWuse = await prisma.property.upsert({
    where: { id: 'prop-wuse' },
    update: {},
    create: {
      id: 'prop-wuse',
      name: 'Lumana Wuse',
      address: 'Wuse Zone 5, Abuja, FCT',
    },
  })

  const properties = [propLekki, propVI, propWuse]

  // 3. Areas
  const areaLekkiGF = await prisma.area.upsert({
    where: { id: 'area-lekki-gf' },
    update: {},
    create: { id: 'area-lekki-gf', name: 'Ground Floor', propertyId: propLekki.id },
  })
  const areaLekki1F = await prisma.area.upsert({
    where: { id: 'area-lekki-1f' },
    update: {},
    create: { id: 'area-lekki-1f', name: 'First Floor Suites', propertyId: propLekki.id },
  })
  const areaVIWingA = await prisma.area.upsert({
    where: { id: 'area-vi-wing-a' },
    update: {},
    create: { id: 'area-vi-wing-a', name: 'Executive Wing', propertyId: propVI.id },
  })
  const areaWuseGF = await prisma.area.upsert({
    where: { id: 'area-wuse-gf' },
    update: {},
    create: { id: 'area-wuse-gf', name: 'Standard Wing', propertyId: propWuse.id },
  })

  // 4. Rooms
  const roomsData = [
    // Lekki Rooms
    { id: 'room-lk-101', name: 'Suite 101', type: RoomType.STUDIO, dailyRate: 45000, status: RoomStatus.OCCUPIED, areaId: areaLekkiGF.id },
    { id: 'room-lk-102', name: 'Suite 102', type: RoomType.ONE_BEDROOM, dailyRate: 65000, status: RoomStatus.AVAILABLE, areaId: areaLekkiGF.id },
    { id: 'room-lk-201', name: 'Suite 201', type: RoomType.TWO_BEDROOM, dailyRate: 95000, status: RoomStatus.OCCUPIED, areaId: areaLekki1F.id },
    { id: 'room-lk-202', name: 'Penthouse 202', type: RoomType.PENTHOUSE, dailyRate: 180000, status: RoomStatus.AVAILABLE, areaId: areaLekki1F.id },
    // VI Rooms
    { id: 'room-vi-101', name: 'Exec 101', type: RoomType.ONE_BEDROOM, dailyRate: 75000, status: RoomStatus.OCCUPIED, areaId: areaVIWingA.id },
    { id: 'room-vi-102', name: 'Exec 102', type: RoomType.TWO_BEDROOM, dailyRate: 110000, status: RoomStatus.MAINTENANCE, areaId: areaVIWingA.id },
    { id: 'room-vi-103', name: 'Exec 103', type: RoomType.STUDIO, dailyRate: 50000, status: RoomStatus.AVAILABLE, areaId: areaVIWingA.id },
    // Wuse Rooms
    { id: 'room-ws-01', name: 'Room 01', type: RoomType.STUDIO, dailyRate: 35000, status: RoomStatus.AVAILABLE, areaId: areaWuseGF.id },
    { id: 'room-ws-02', name: 'Room 02', type: RoomType.ONE_BEDROOM, dailyRate: 50000, status: RoomStatus.OCCUPIED, areaId: areaWuseGF.id },
  ]

  for (const r of roomsData) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: { status: r.status, dailyRate: r.dailyRate },
      create: r,
    })
  }

  // 5. Users
  const adminPassword = await bcrypt.hash('Admin@1234', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumana.ng' },
    update: {},
    create: {
      name: 'Yusuf Saifur-Rahman',
      email: 'admin@lumana.ng',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
    },
  })

  const managerPassword = await bcrypt.hash('Manager@1234', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@lumana.ng' },
    update: {},
    create: {
      name: 'Operations Manager',
      email: 'manager@lumana.ng',
      password: managerPassword,
      role: Role.PROPERTY_MANAGER,
    },
  })

  const staffPassword = await bcrypt.hash('Staff@1234', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@lumana.ng' },
    update: {},
    create: {
      name: 'Front Desk Lead',
      email: 'staff@lumana.ng',
      password: staffPassword,
      role: Role.STAFF,
    },
  })

  const viewerPassword = await bcrypt.hash('Viewer@1234', 10)
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@lumana.ng' },
    update: {},
    create: {
      name: 'Auditor & Ownership',
      email: 'viewer@lumana.ng',
      password: viewerPassword,
      role: Role.VIEWER,
    },
  })

  const allUsers = [admin, manager, staff, viewer]

  // Link all users to all properties
  for (const u of allUsers) {
    for (const p of properties) {
      await prisma.propertyUser.upsert({
        where: { userId_propertyId: { userId: u.id, propertyId: p.id } },
        update: {},
        create: { userId: u.id, propertyId: p.id },
      })
    }
  }

  // 6. Daily Reports (Past 7 Days)
  const guestPool = [
    'Emeka Okafor',
    'Fatima Dangote',
    'Adebayo Ogundipe',
    'Chinedu Alabi',
    'Ngozi Achebe',
    'David Sterling',
    'Khadijah Bello',
  ]

  for (let d = 6; d >= 0; d--) {
    const reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - d)
    reportDate.setHours(0, 0, 0, 0)

    for (let i = 0; i < roomsData.length; i++) {
      const room = roomsData[i]
      const propId = room.id.startsWith('room-lk')
        ? propLekki.id
        : room.id.startsWith('room-vi')
          ? propVI.id
          : propWuse.id

      // Alternate occupancy for trend data
      const isOccupied = (i + d) % 2 === 0
      const guest = isOccupied ? guestPool[(i + d) % guestPool.length] : null

      await prisma.dailyReport.upsert({
        where: {
          roomId_reportDate: {
            roomId: room.id,
            reportDate,
          },
        },
        update: {},
        create: {
          reportDate,
          propertyId: propId,
          roomId: room.id,
          occupancyStatus: isOccupied ? OccupancyStatus.OCCUPIED : OccupancyStatus.VACANT,
          guestName: guest,
          guestCount: isOccupied ? 1 + ((i + d) % 3) : 0,
          notes: isOccupied ? 'Standard VIP stay' : 'Inspected & prepared by housekeeping',
          submittedById: staff.id,
        },
      })
    }
  }

  // 7. Maintenance Issues
  const maintenanceSeed = [
    {
      id: 'maint-1',
      title: 'AC unit dripping water in living area',
      description: 'Condensation line clogged. Water leaking onto timber flooring.',
      priority: MaintenancePriority.CRITICAL,
      status: MaintenanceStatus.IN_PROGRESS,
      category: MaintenanceCategory.HVAC,
      propertyId: propVI.id,
      roomId: 'room-vi-102',
      raisedById: staff.id,
      assignedToId: manager.id,
    },
    {
      id: 'maint-2',
      title: 'Water heater tripping master breaker',
      description: 'Heating element short-circuited. Replacement element needed.',
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.REPORTED,
      category: MaintenanceCategory.PLUMBING,
      propertyId: propLekki.id,
      roomId: 'room-lk-201',
      raisedById: staff.id,
    },
    {
      id: 'maint-3',
      title: 'Balcony slider lock loose',
      description: 'Latch mechanism tightened and lubricated.',
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.RESOLVED,
      category: MaintenanceCategory.FURNITURE,
      propertyId: propLekki.id,
      roomId: 'room-lk-101',
      raisedById: staff.id,
      assignedToId: manager.id,
      resolvedById: manager.id,
      resolvedAt: new Date(),
      resolutionNotes: 'Tightened internal screw bracket and tested lock engagement.',
    },
  ]

  for (const m of maintenanceSeed) {
    await prisma.maintenanceIssue.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    })
  }

  // 8. Income Records (Past 5 Days)
  const incomeSeed = [
    {
      id: 'inc-1',
      roomId: 'room-lk-101',
      propertyId: propLekki.id,
      recordedById: staff.id,
      amount: 45000,
      source: IncomeSource.ACCOMMODATION,
      paymentMethod: PaymentMethod.POS,
      recordDate: new Date(),
      guestName: 'Emeka Okafor',
      reference: 'POS-LK-9921',
      verified: true,
      notes: 'Full payment on check-in',
    },
    {
      id: 'inc-2',
      roomId: 'room-vi-101',
      propertyId: propVI.id,
      recordedById: staff.id,
      amount: 75000,
      source: IncomeSource.ACCOMMODATION,
      paymentMethod: PaymentMethod.TRANSFER,
      recordDate: new Date(),
      guestName: 'Fatima Dangote',
      reference: 'GTB-TRF-40291',
      verified: true,
      notes: 'Corporate bank transfer confirmed',
    },
    {
      id: 'inc-3',
      roomId: 'room-lk-201',
      propertyId: propLekki.id,
      recordedById: staff.id,
      amount: 12500,
      source: IncomeSource.MINIBAR,
      paymentMethod: PaymentMethod.CARD,
      recordDate: new Date(),
      guestName: 'David Sterling',
      reference: 'CARD-MB-102',
      verified: false,
      notes: 'Champagne and beverage replenishment',
    },
    {
      id: 'inc-4',
      roomId: 'room-ws-02',
      propertyId: propWuse.id,
      recordedById: staff.id,
      amount: 50000,
      source: IncomeSource.ACCOMMODATION,
      paymentMethod: PaymentMethod.TRANSFER,
      recordDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      guestName: 'Khadijah Bello',
      reference: 'ZENITH-39102',
      verified: true,
      notes: 'Abuja stay booking',
    },
  ]

  for (const inc of incomeSeed) {
    await prisma.incomeRecord.upsert({
      where: { id: inc.id },
      update: {},
      create: inc,
    })
  }

  console.log('✅ Seeding complete! Database is populated with:')
  console.log('   - 3 Properties (Lekki, Victoria Island, Wuse Abuja)')
  console.log('   - 4 Areas & 9 Active Rooms (Studios, 1BR, 2BR, Penthouse)')
  console.log('   - 4 Configured Accounts with full access to all properties')
  console.log('   - 7 Days of Daily Reports (charts will render real data)')
  console.log('   - 3 Maintenance Issues (Critical, High, Resolved)')
  console.log('   - Recent Income Records with POS/Transfer/Card payments')
  console.log('\n🔐 Login credentials:')
  console.log('   Super Admin: admin@lumana.ng    / Admin@1234')
  console.log('   Manager:     manager@lumana.ng  / Manager@1234')
  console.log('   Staff:       staff@lumana.ng    / Staff@1234')
  console.log('   Viewer:      viewer@lumana.ng   / Viewer@1234')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
