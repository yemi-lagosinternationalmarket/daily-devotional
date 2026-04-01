interface Verse {
  text: string;
  ref: string;
}

const VERSES: Verse[] = [
  { text: "Be still, and know that I am God.", ref: "Psalm 46:10 ESV" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1 ESV" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", ref: "Proverbs 3:5 ESV" },
  { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13 ESV" },
  { text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.", ref: "Jeremiah 29:11 ESV" },
  { text: "The Lord is near to the brokenhearted and saves the crushed in spirit.", ref: "Psalm 34:18 ESV" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7 NIV" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", ref: "Matthew 11:28 ESV" },
  { text: "But those who hope in the Lord will renew their strength.", ref: "Isaiah 40:31 NIV" },
  { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", ref: "Philippians 4:6 NIV" },
  { text: "He has made everything beautiful in its time.", ref: "Ecclesiastes 3:11 NIV" },
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end.", ref: "Lamentations 3:22 ESV" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1 ESV" },
  { text: "And we know that for those who love God all things work together for good.", ref: "Romans 8:28 ESV" },
  { text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you.", ref: "John 14:27 ESV" },
  { text: "The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness.", ref: "Zephaniah 3:17 ESV" },
  { text: "For God gave us a spirit not of fear but of power and love and self-control.", ref: "2 Timothy 1:7 ESV" },
  { text: "Delight yourself in the Lord, and he will give you the desires of your heart.", ref: "Psalm 37:4 ESV" },
  { text: "The name of the Lord is a strong tower; the righteous man runs into it and is safe.", ref: "Proverbs 18:10 ESV" },
  { text: "When I am afraid, I put my trust in you.", ref: "Psalm 56:3 ESV" },
  { text: "He heals the brokenhearted and binds up their wounds.", ref: "Psalm 147:3 ESV" },
  { text: "Wait for the Lord; be strong, and let your heart take courage.", ref: "Psalm 27:14 ESV" },
  { text: "This is the day that the Lord has made; let us rejoice and be glad in it.", ref: "Psalm 118:24 ESV" },
  { text: "Draw near to God, and he will draw near to you.", ref: "James 4:8 ESV" },
  { text: "In all your ways acknowledge him, and he will make straight your paths.", ref: "Proverbs 3:6 ESV" },
  { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1 ESV" },
  { text: "And let the peace of Christ rule in your hearts.", ref: "Colossians 3:15 ESV" },
  { text: "You will seek me and find me, when you seek me with all your heart.", ref: "Jeremiah 29:13 ESV" },
  { text: "Create in me a clean heart, O God, and renew a right spirit within me.", ref: "Psalm 51:10 ESV" },
  { text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.", ref: "Galatians 5:22-23 ESV" },
  { text: "My grace is sufficient for you, for my power is made perfect in weakness.", ref: "2 Corinthians 12:9 ESV" },
];

function dateSeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return (y * 367 + m * 31 + d) % VERSES.length;
}

export function getVerseOfDay(date: Date = new Date()): Verse {
  return VERSES[dateSeed(date)];
}
