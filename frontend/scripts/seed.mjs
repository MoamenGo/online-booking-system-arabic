// scripts/seed.mjs - بيانات تجريبية (run: node scripts/seed.mjs)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إدخال البيانات التجريبية...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const owner = await prisma.user.upsert({
    where: { phone: '+966501234567' },
    update: {},
    create: {
      name: 'د. أحمد محمد',
      phone: '+966501234567',
      email: 'dr.ahmed@clinic.com',
      password: hashedPassword,
      role: 'owner',
    },
  });
  console.log('✅ تم إنشاء المالك:', owner.name);

  const business = await prisma.business.upsert({
    where: { phone: '+966501234567' },
    update: {},
    create: {
      name: 'عيادة الابتسامة لطب الأسنان',
      type: 'clinic',
      phone: '+966501234567',
      email: 'info@abtisama.com',
      description: 'عيادة متخصصة في طب الأسنان بأحدث التقنيات وأعلى المعايير',
      address: 'شارع الملك فهد',
      city: 'الرياض',
      country: 'السعودية',
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      workStart: '09:00',
      workEnd: '21:00',
      slotDuration: 30,
      breakStart: '13:00',
      breakEnd: '15:00',
      emailEnabled: true,
      ownerId: owner.id,
    },
  });
  console.log('✅ تم إنشاء العمل التجاري:', business.name);

  const servicesData = [
    { name: 'كشف عام', description: 'فحص طبي شامل للأسنان', duration: 30, price: 100, color: '#2170e4', sortOrder: 0 },
    { name: 'تنظيف أسنان', description: 'تنظيف وتلميع الأسنان بالأجهزة الحديثة', duration: 45, price: 200, color: '#505f76', sortOrder: 1 },
    { name: 'حشو عصب', description: 'علاج جذور الأسنان بالتخدير الموضعي', duration: 60, price: 500, color: '#0058be', sortOrder: 2 },
    { name: 'تقويم أسنان', description: 'تركيب وتعديل تقويم الأسنان', duration: 30, price: 300, color: '#16a34a', sortOrder: 3 },
    { name: 'خلع ضرس', description: 'خلع طبي آمن تحت التخدير', duration: 45, price: 350, color: '#d97706', sortOrder: 4 },
    { name: 'تبييض أسنان', description: 'تبييض بالليزر لنتائج فورية', duration: 60, price: 800, color: '#dc2626', sortOrder: 5 },
  ];

  const services = [];
  for (const sData of servicesData) {
    const service = await prisma.service.upsert({
      where: { id: `seed-${sData.sortOrder}` },
      update: {},
      create: { id: `seed-${sData.sortOrder}`, businessId: business.id, currency: 'SAR', isActive: true, ...sData },
    });
    services.push(service);
  }
  console.log('✅ تم إنشاء', services.length, 'خدمة');

  const customersData = [
    { name: 'فاطمة علي', phone: '+966509876543', email: 'fatima@example.com' },
    { name: 'محمد خالد', phone: '+966507654321', email: null },
    { name: 'نورة سعد', phone: '+966506543210', email: 'noura@example.com' },
  ];

  const customers = [];
  for (const cData of customersData) {
    const customer = await prisma.user.upsert({
      where: { phone: cData.phone },
      update: {},
      create: { ...cData, password: hashedPassword, role: 'customer' },
    });
    customers.push(customer);
  }
  console.log('✅ تم إنشاء', customers.length, 'عميل');

  const today = new Date();
  const bookingsData = [
    { customerId: customers[0].id, serviceId: services[0].id, date: today, startTime: '09:00', endTime: '09:30', status: 'confirmed', customerName: customers[0].name, customerPhone: customers[0].phone, totalAmount: 100 },
    { customerId: customers[1].id, serviceId: services[1].id, date: today, startTime: '10:30', endTime: '11:15', status: 'pending', customerName: customers[1].name, customerPhone: customers[1].phone, totalAmount: 200 },
    { customerId: customers[2].id, serviceId: services[2].id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), startTime: '14:00', endTime: '15:00', status: 'completed', customerName: customers[2].name, customerPhone: customers[2].phone, totalAmount: 500 },
  ];

  for (let i = 0; i < bookingsData.length; i++) {
    const bData = bookingsData[i];
    const year = bData.date.getFullYear();
    const bookingNumber = `BK-${year}-${String(i + 1).padStart(4, '0')}`;
    await prisma.booking.upsert({
      where: { bookingNumber },
      update: {},
      create: { bookingNumber, businessId: business.id, currency: 'SAR', ...bData },
    });
  }
  console.log('✅ تم إنشاء', bookingsData.length, 'حجز تجريبي');

  console.log('');
  console.log('🎉 ========================================');
  console.log('   اكتملت البيانات التجريبية بنجاح!');
  console.log('========================================');
  console.log('📧  البريد: dr.ahmed@clinic.com');
  console.log('📱  الهاتف: +966501234567');
  console.log('🔑  كلمة المرور: 123456');
  console.log('========================================');
}

main()
  .catch((e) => { console.error('❌ خطأ في seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
