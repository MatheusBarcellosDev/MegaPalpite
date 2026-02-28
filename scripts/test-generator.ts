import { generateNumbersWithStrategy } from '../src/lib/lottery/generator';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Testing "balanced" strategy...');
  const balanced = await generateNumbersWithStrategy('balanced', 'lotofacil');
  console.log('Balanced Generator Numbers:', balanced.numbers);
  console.log('Balanced Stats:', JSON.stringify(balanced.stats, null, 2));

  console.log('\nTesting "repeater" strategy...');
  const repeater = await generateNumbersWithStrategy('repeater', 'lotofacil');
  console.log('Repeater Generator Numbers:', repeater.numbers);
  console.log('Repeater Stats:', JSON.stringify(repeater.stats, null, 2));
  
  // Verify Line/Cols for Repeater
  const lines = [0, 0, 0, 0, 0];
  const cols = [0, 0, 0, 0, 0];
  repeater.numbers.forEach(n => {
    lines[Math.floor((n - 1) / 5)]++;
    cols[(n - 1) % 5]++;
  });
  console.log('Repeater Lines (should have no zeros):', lines);
  console.log('Repeater Cols (should have no zeros):', cols);
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
