import { prisma } from "../src/db/prisma.js";

export async function cleanDb() {
	// Najprościej Prisma deleteMany (nie sypie się na SQL).
	// Dopasuj modele do tego co masz w schema.prisma.

	// Kolejność: dzieci -> rodzice
	try {
		await prisma.contact_messages.deleteMany();
	} catch {}
	try {
		await prisma.peaks.deleteMany();
	} catch {}
	try {
		await prisma.mountain_peaks.deleteMany();
	} catch {}
	try {
		await prisma.mountain_ranges.deleteMany();
	} catch {}
	try {
		await prisma.users.deleteMany();
	} catch {}
}
