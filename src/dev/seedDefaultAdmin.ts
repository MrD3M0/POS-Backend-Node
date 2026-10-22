
import { prismaMain } from '@/lib/prismaClient';
import * as bcrypt from 'bcrypt';



export async function seedDefaultAdmin() {
  const email = 'admin@gmail.com';
  const plainPassword = 'admin123';

  try {
    // Check if admin already exists
    const existingUser = await prismaMain.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Default admin user already exists.');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Create the admin user
    const adminUser = await prismaMain.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        // Add other required fields based on your schema (e.g., role, name, etc.)
        role: 'ADMIN',
        isEmailVerified: true,

      },
    });

    console.log(`Default admin created successfully: ${adminUser.email}`);
  } catch (error) {
    console.error('Error creating default admin user:', error);
  } finally {
    await prismaMain.$disconnect();
  }
}
