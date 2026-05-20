import type { Receipt, ReceiptStatus } from '@/types/receipt.types';
import { receiptScanImageFromPool, receiptScanImageUrl } from '@/data/receiptScanAssets';

/** Cheklar sahifasi demo: har bir ishchi uchun 7 yoki 8 ta chek (2026-05). */
const RECEIPT_DEMO_EMPLOYEES = [
  { id: 'e2', fullName: 'Joha' },
  { id: 'e3', fullName: 'Abror' },
  { id: 'e4', fullName: 'Muxsinbek' },
  { id: 'e5', fullName: 'Furqat' },
  { id: 'e6', fullName: 'Faysullz' },
  { id: 'e7', fullName: 'Oscar' },
  { id: 'e8', fullName: 'Ali' },
  { id: 'e9', fullName: 'Oybek' },
  { id: 'e10', fullName: 'Otabek' },
] as const;

type ReceiptTemplate = Pick<
  Receipt,
  'storeName' | 'amount' | 'lineItems' | 'payment'
>;

const RECEIPT_TEMPLATES: ReceiptTemplate[] = [
  {
    storeName: 'GS25 — 역삼중앙점',
    amount: 32_000,
    lineItems: [
      { itemCode: '8801067123456', name: '도시락 / 김밥 세트', quantity: 2, unitPrice: 9_500, lineTotal: 19_000 },
      { itemCode: '8800647123001', name: '바나나우유 + 과자', quantity: 2, unitPrice: 6_500, lineTotal: 13_000 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: 'KB국민카드',
      maskedCardNumber: '5389-20**-****-1122',
      approvalNumber: '009283746',
    },
  },
  {
    storeName: '이마트 — 문래점',
    amount: 28_500,
    lineItems: [
      { itemCode: '8801005638654', name: '과일 / 샐러드', quantity: 1, unitPrice: 8_500, lineTotal: 8_500 },
      { itemCode: '8807500007063', name: '즉석 조리 도시락', quantity: 2, unitPrice: 10_000, lineTotal: 20_000 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '현대카드 (Hyundai Card)',
      maskedCardNumber: '9430-15**-****-6680',
      approvalNumber: '551902834',
    },
  },
  {
    storeName: 'THE HYUNDAI — 압구정본점',
    amount: 22_000,
    lineItems: [
      { itemCode: 'HD-FD-99201', name: '현대백화점 식품 코너', quantity: 1, unitPrice: 22_000, lineTotal: 22_000 },
    ],
    payment: {
      method: '자사모바일',
      cardIssuer: '현대백화점 모바일카드',
      maskedCardNumber: '9500123112******1234',
      approvalNumber: '123456789',
    },
  },
  {
    storeName: 'STARBUCKS — 영등포구청역점',
    amount: 19_500,
    lineItems: [
      { itemCode: 'SB-G-COLDBREW', name: 'G) 콜드브루', quantity: 1, unitPrice: 12_500, lineTotal: 12_500 },
      { itemCode: 'SB-CAKE-S', name: '조각 케이크', quantity: 1, unitPrice: 7_000, lineTotal: 7_000 },
    ],
    payment: {
      method: '복합결제',
      cardIssuer: '스타벅스 카드 + 신한카드',
      maskedCardNumber: '61997317****554* / 4578-09**-****-3310',
      approvalNumber: '304799 / 88291003',
    },
  },
  {
    storeName: '김내준의 탕탕집 — 강남',
    amount: 27_000,
    lineItems: [
      { itemCode: 'MENU-TANG-01', name: '탕 요리 세트', quantity: 1, unitPrice: 24_000, lineTotal: 24_000 },
      { itemCode: 'SIDE-RICE', name: '공깃밥 추가', quantity: 1, unitPrice: 3_000, lineTotal: 3_000 },
    ],
    payment: {
      method: '신용카드 (일시불)',
      cardIssuer: 'IBK BC카드',
      maskedCardNumber: '6250-03**-****-4903',
      approvalNumber: '72110079',
    },
  },
  {
    storeName: '편의점 / 간편식 매장',
    amount: 18_000,
    lineItems: [
      { itemCode: 'RF-MEAL-02', name: '냉동 도시락', quantity: 3, unitPrice: 6_000, lineTotal: 18_000 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '우리카드 (Woori Card)',
      maskedCardNumber: '4021-88**-****-0092',
      approvalNumber: '66291004',
    },
  },
  {
    storeName: '베이커리 카페',
    amount: 12_000,
    lineItems: [
      { itemCode: 'BRK-COF-01', name: '아메리카노 L', quantity: 2, unitPrice: 4_500, lineTotal: 9_000 },
      { itemCode: 'BRK-BRD-02', name: '크림빵', quantity: 1, unitPrice: 3_000, lineTotal: 3_000 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '롯데카드',
      maskedCardNumber: '3569-90**-****-4451',
      approvalNumber: '009928374',
    },
  },
  {
    storeName: '세븐일레븐 — 송파구청역',
    amount: 13_820,
    lineItems: [
      { itemCode: 'SKU-VNL-PNT', name: '라라스위트 바닐라 파인트', quantity: 1, unitPrice: 6_900, lineTotal: 6_900 },
      { itemCode: 'SKU-CHO-PNT', name: '라라스위트 초코 파인트', quantity: 1, unitPrice: 6_900, lineTotal: 6_900 },
      { itemCode: 'BAG-DEP', name: '봉투 보증금', quantity: 1, unitPrice: 20, lineTotal: 20 },
    ],
    payment: { method: '현금', cardIssuer: '자진발급', maskedCardNumber: '—', approvalNumber: '—' },
  },
  {
    storeName: '마트 / 즉석조리 코너',
    amount: 15_000,
    lineItems: [
      { itemCode: 'HMR-SET', name: '즉석 도시락 세트', quantity: 1, unitPrice: 15_000, lineTotal: 15_000 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '삼성카드',
      maskedCardNumber: '5218-90**-****-4410',
      approvalNumber: '90128456',
    },
  },
  {
    storeName: 'STARBUCKS — 테이크아웃',
    amount: 16_800,
    lineItems: [
      { itemCode: 'SB-01', name: '음료 1', quantity: 1, unitPrice: 5_600, lineTotal: 5_600 },
      { itemCode: 'SB-02', name: '음료 2', quantity: 1, unitPrice: 5_500, lineTotal: 5_500 },
      { itemCode: 'SB-03', name: '음료 3', quantity: 1, unitPrice: 5_700, lineTotal: 5_700 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '스타벅스카드',
      maskedCardNumber: '6199********5542',
      approvalNumber: '228837771',
    },
  },
];

const RECEIPT_STATUSES: ReceiptStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function receiptCountForEmployee(employeeId: string): number {
  return 7 + (hashString(employeeId) % 2);
}

function buildDemoReceiptsForEmployees(startId: number): Omit<Receipt, 'imageUrl'>[] {
  const out: Omit<Receipt, 'imageUrl'>[] = [];
  let nextId = startId;

  for (const emp of RECEIPT_DEMO_EMPLOYEES) {
    const count = receiptCountForEmployee(emp.id);
    for (let i = 0; i < count; i++) {
      const seed = `${emp.id}-${i}`;
      const template = RECEIPT_TEMPLATES[hashString(seed) % RECEIPT_TEMPLATES.length];
      const day = 5 + (hashString(`${seed}-day`) % 20);
      const hour = 9 + (hashString(`${seed}-hour`) % 10);
      const minute = hashString(`${seed}-min`) % 60;
      const id = `r${nextId++}`;

      out.push({
        id,
        receiptCode: `KR-202605${String(day).padStart(2, '0')}-${emp.id.toUpperCase()}-${1000 + i}`,
        storeName: template.storeName,
        employeeId: emp.id,
        employeeName: emp.fullName,
        amount: template.amount,
        status: RECEIPT_STATUSES[hashString(`${seed}-status`) % RECEIPT_STATUSES.length],
        createdAt: `2026-05-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
        lineItems: template.lineItems,
        payment: template.payment,
      });
    }
  }

  return out;
}

const abbosReceipts: Omit<Receipt, 'imageUrl'>[] = [
  {
    id: 'r1',
    receiptCode: 'KR-20260512-HLY-884921',
    storeName: "HOLLYS COFFEE — 강남점",
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 45_000,
    status: 'PENDING',
    createdAt: '2026-05-12T10:00:00.000Z',
    lineItems: [
      {
        itemCode: 'SKU-LATTE-R',
        name: 'R) 카페라떼',
        quantity: 1,
        unitPrice: 22_000,
        lineTotal: 22_000,
      },
      {
        itemCode: 'SKU-BRG-SET',
        name: '아침 세트 (샌드위치+음료)',
        quantity: 2,
        unitPrice: 11_500,
        lineTotal: 23_000,
      },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '신한카드 (Shinhan Card)',
      maskedCardNumber: '4578-12**-****-9031',
      approvalNumber: '74839201',
    },
  },
  {
    id: 'r9',
    receiptCode: 'KR-20260514-HYD-1706290102004200010000',
    storeName: 'THE HYUNDAI — 압구정본점',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 10_000,
    status: 'APPROVED',
    createdAt: '2026-05-14T12:00:00.000Z',
    lineItems: [
      {
        itemCode: 'HD-GEN-01',
        name: '현대백화점 상품',
        quantity: 1,
        unitPrice: 10_000,
        lineTotal: 10_000,
      },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '현대카드',
      maskedCardNumber: '9500123112******1234',
      approvalNumber: '123456789',
    },
  },
  {
    id: 'r10',
    receiptCode: 'KR-20260513-711-183083080',
    storeName: '세븐일레븐 — 송파구청역',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 13_820,
    status: 'PENDING',
    createdAt: '2026-05-13T11:59:47.000Z',
    lineItems: [
      {
        itemCode: 'SKU-VNL-PNT',
        name: '라라스위트 바닐라 파인트',
        quantity: 1,
        unitPrice: 6_900,
        lineTotal: 6_900,
      },
      {
        itemCode: 'SKU-CHO-PNT',
        name: '라라스위트 초코 파인트',
        quantity: 1,
        unitPrice: 6_900,
        lineTotal: 6_900,
      },
      {
        itemCode: 'BAG-DEP',
        name: '봉투 보증금',
        quantity: 1,
        unitPrice: 20,
        lineTotal: 20,
      },
    ],
    payment: {
      method: '현금',
      cardIssuer: '자진발급',
      maskedCardNumber: '—',
      approvalNumber: '—',
    },
  },
  {
    id: 'r11',
    receiptCode: 'KR-20260511-HPT-2009271103010699430356',
    storeName: '편의점 / 리테일',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 5_000,
    status: 'APPROVED',
    createdAt: '2026-05-11T15:22:00.000Z',
    lineItems: [
      {
        itemCode: 'RT-SALE-01',
        name: '과세 매장 상품',
        quantity: 1,
        unitPrice: 5_000,
        lineTotal: 5_000,
      },
    ],
    payment: {
      method: '신용카드 (일시불)',
      cardIssuer: 'KB국민제휴',
      maskedCardNumber: '356415******4016',
      approvalNumber: '38086223',
    },
  },
  {
    id: 'r12',
    receiptCode: 'KR-20260510-MKT-882803280',
    storeName: '마트 / 즉석조리 코너',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 15_000,
    status: 'PENDING',
    createdAt: '2026-05-10T12:40:00.000Z',
    lineItems: [
      {
        itemCode: 'HMR-SET',
        name: '즉석 도시락 세트',
        quantity: 1,
        unitPrice: 15_000,
        lineTotal: 15_000,
      },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '삼성카드',
      maskedCardNumber: '5218-90**-****-4410',
      approvalNumber: '90128456',
    },
  },
  {
    id: 'r13',
    receiptCode: 'KR-20260509-FDS-772819044',
    storeName: '식품 전문 매장',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 8_900,
    status: 'APPROVED',
    createdAt: '2026-05-09T19:15:00.000Z',
    lineItems: [
      {
        itemCode: 'FD-BVG-01',
        name: '음료 + 간편식',
        quantity: 1,
        unitPrice: 8_900,
        lineTotal: 8_900,
      },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '신한카드',
      maskedCardNumber: '4578-12**-****-7721',
      approvalNumber: '55661209',
    },
  },
  {
    id: 'r14',
    receiptCode: 'KR-20260508-SBX-ORDER-A85',
    storeName: 'STARBUCKS — 테이크아웃',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 16_800,
    status: 'PENDING',
    createdAt: '2026-05-08T14:30:00.000Z',
    lineItems: [
      { itemCode: 'SB-01', name: '음료 1', quantity: 1, unitPrice: 5_600, lineTotal: 5_600 },
      { itemCode: 'SB-02', name: '음료 2', quantity: 1, unitPrice: 5_500, lineTotal: 5_500 },
      { itemCode: 'SB-03', name: '음료 3', quantity: 1, unitPrice: 5_700, lineTotal: 5_700 },
    ],
    payment: {
      method: '신용카드',
      cardIssuer: '스타벅스카드',
      maskedCardNumber: '6199********5542',
      approvalNumber: '228837771',
    },
  },
];

const mockReceiptsBase: Omit<Receipt, 'imageUrl'>[] = [
  ...abbosReceipts,
  ...buildDemoReceiptsForEmployees(15),
];

export const mockReceipts: Receipt[] = mockReceiptsBase.map((r) => ({
  ...r,
  imageUrl:
    r.employeeId === 'e1'
      ? receiptScanImageUrl(r.id)
      : receiptScanImageFromPool(`${r.employeeId}-${r.id}`),
}));
