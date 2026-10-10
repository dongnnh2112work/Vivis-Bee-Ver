/**
 * Five multiple-choice questions about MoMo Vietnam.
 * Facts checked against public sources (Oct 2026):
 * - momo.vn/ve-chung-toi — M_Service founded 2007
 * - Forbes Việt Nam, "Đường tới kỳ lân của MoMo" — brand name is short for Money Mobile; Series E / unicorn
 * - VietnamNet / Nhịp cầu đầu tư — licence 16/GP-NHNN on 16 Oct 2015
 * - MoMo press release 21 Dec 2021 — Series E led by Mizuho, about 200 million USD raised; valuation reported above 2 billion USD
 */
export type MomoChoice = { id: string; text: string };

export type MomoQuestion = {
  id: string;
  prompt: string;
  choices: MomoChoice[];
  /** id of the correct choice */
  answer: string;
};

export const MOMO_QUIZ: MomoQuestion[] = [
  {
    id: "company",
    prompt: "Công ty nào vận hành ví điện tử MoMo?",
    choices: [
      { id: "mservice", text: "Công ty Cổ phần Dịch vụ Di Động Trực tuyến (M_Service)" },
      { id: "vnpay", text: "Công ty cổ phần Giải pháp Thanh toán Việt Nam (VNPAY)" },
      { id: "vng", text: "Công ty cổ phần VNG" },
      { id: "viettel", text: "Tổng công ty Viễn thông Viettel" },
    ],
    answer: "mservice",
  },
  {
    id: "founded",
    prompt: "M_Service, công ty mẹ của MoMo, được thành lập vào năm nào?",
    choices: [
      { id: "2007", text: "Năm 2007" },
      { id: "2010", text: "Năm 2010" },
      { id: "2014", text: "Năm 2014" },
      { id: "2015", text: "Năm 2015" },
    ],
    answer: "2007",
  },
  {
    id: "name",
    prompt: "Theo Forbes Việt Nam, tên MoMo là cách viết tắt của cụm từ nào?",
    choices: [
      { id: "money-mobile", text: "Money Mobile" },
      { id: "mobile-money", text: "Mobile Money" },
      { id: "more-money", text: "More Money" },
      { id: "modern-mobile", text: "Modern Mobile" },
    ],
    answer: "money-mobile",
  },
  {
    id: "license",
    prompt: "Ngân hàng Nhà nước cấp giấy phép chính thức ví điện tử MoMo (số 16/GP-NHNN) vào năm nào?",
    choices: [
      { id: "2015", text: "Năm 2015" },
      { id: "2009", text: "Năm 2009" },
      { id: "2010", text: "Năm 2010" },
      { id: "2021", text: "Năm 2021" },
    ],
    answer: "2015",
  },
  {
    id: "unicorn",
    prompt: "Cuối năm 2021, sau vòng gọi vốn Series E do Mizuho dẫn dắt, MoMo được định giá khoảng bao nhiêu?",
    choices: [
      { id: "2b", text: "Hơn 2 tỷ USD" },
      { id: "200m", text: "Khoảng 200 triệu USD" },
      { id: "28m", text: "Khoảng 28 triệu USD" },
      { id: "500m", text: "Khoảng 500 triệu USD" },
    ],
    answer: "2b",
  },
];

export const MOMO_QUESTION_MS = 20_000;

/** Stable shuffle so the four buttons stay put while a question is on screen. */
export function orderChoices(question: MomoQuestion, seed: number): MomoChoice[] {
  const items = [...question.choices];
  let s = seed >>> 0;
  for (let i = items.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const swap = items[i];
    items[i] = items[j];
    items[j] = swap;
  }
  return items;
}
