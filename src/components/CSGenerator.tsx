import { useState } from 'react';
import { Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

// 환경 변수 설정
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

type Sender = 'yoon' | 'rachel';
type Platform = 'toss' | 'alwayz' | 'kakao' | 'coupang' | 'naver';
type Status = 'checking_issue' | 'guiding_refund' | 'refund_completed';
type ProductType = 'fresh' | 'industrial';
type CustomerComplaint = 'broken' | 'quality' | 'size_appearance' | 'delay' | 'refund_demand' | 'invalid_reason';
type SellerStance = 'checking' | 'partial_negotiation' | 'partial_proposal' | 'impossible' | 'full_refund_review';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'toss', label: '토스 (Toss)' },
  { value: 'alwayz', label: '올웨이즈 (Alwayz)' },
  { value: 'kakao', label: '카카오 (Kakao)' },
  { value: 'coupang', label: '쿠팡 (Coupang)' },
  { value: 'naver', label: '네이버 (Naver)' },
];

const CUSTOMER_COMPLAINTS: { value: CustomerComplaint; label: string }[] = [
  { value: 'broken', label: '① 파손/터짐/썩음 (육안 확인 완료)' },
  { value: 'quality', label: '② 맛/품질 불만 (육안 확인 불가)' },
  { value: 'size_appearance', label: '③ 크기 및 외관 불만' },
  { value: 'delay', label: '④ 배송 지연 및 누락' },
  { value: 'refund_demand', label: '⑤ 전액 환불 강경 요구' },
  { value: 'invalid_reason', label: '⑥ 사유 미해당/반복적 반품 요청' },
];

const SELLER_STANCES: { value: SellerStance; label: string }[] = [
  { value: 'checking', label: '① 문제 확인 및 농가/공급사 협의 중' },
  { value: 'full_refund_review', label: '② 사진 증빙 검토 후 전액 환불 논의' },
  { value: 'partial_negotiation', label: '③ 농가/공급사와 부분 보상 협의 중' },
  { value: 'partial_proposal', label: '④ 고객에게 조심스럽게 부분 환불 제안 및 증빙 요청 (48시간)' },
  { value: 'impossible', label: '⑤ 규정상 환불 절대 불가 (정상과 판정)' },
];

export default function CSGenerator() {
  const [sender, setSender] = useState<Sender>('yoon');
  const [platform, setPlatform] = useState<Platform>('naver');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [status, setStatus] = useState<Status>('checking_issue');
  const [customerComplaint, setCustomerComplaint] = useState<CustomerComplaint>('broken');
  const [sellerStance, setSellerStance] = useState<SellerStance>('checking');
  const [inquiry, setInquiry] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleProductTypeChange = (type: ProductType) => {
    setProductTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const generateResponse = async () => {
    if (!inquiry.trim()) return;
    if (!apiKey) {
      setGeneratedResponse("API 키가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const storeName = sender === 'yoon' ? '윤씨네 행복상회' : '맛능상회';
      const senderName = sender === 'yoon' ? '윤태성' : '레이첼';
      const isFresh = productTypes.includes('fresh');
      const complaintLabel = CUSTOMER_COMPLAINTS.find(c => c.value === customerComplaint)?.label || '';
      const stanceLabel = SELLER_STANCES.find(s => s.value === sellerStance)?.label || '';

      const prompt = `
        당신은 온라인 쇼핑몰 [${storeName}]의 전문 CS 상담원입니다. 
        미사여구를 배제하고, 차분하고 정중한 비즈니스 톤으로 다음 지침에 따라 메시지를 작성하세요.

        [기본 정보]
        - 발신자: ${senderName}, 쇼핑몰: ${storeName}, 플랫폼: ${platform}
        - 고객 불만: ${complaintLabel}, 판매자 입장: ${stanceLabel}
        - 고객 문의: "${inquiry}"
        ${customInstruction.trim() ? `- 특별 지시: "${customInstruction}"` : ''}

        [CS 규칙]
        1. 첫 문장 고정: "안녕하세요, 고객님. ${storeName}입니다."
        2. 고객 문의 내용 재언급 절대 금지.
        3. 호칭은 무조건 "고객님"으로 통일.
        ${isFresh ? '4. 신선식품: 위생/오염 문제로 택배사 회수 불가 안내 및 자체 폐기 요청 필수.' : ''}
        ${platform === 'toss' ? '5. 토스: 답변 수정 불가 안내 및 추가 소통 시 "새로운 문의글" 작성 요청 필수.' : ''}
        ${sellerStance === 'partial_proposal' || sellerStance === 'full_refund_review' ? `
        6. 사진 증빙 요청 (번호 매겨서): 1.운송장 사진, 2.전체 수량 사진(바둑판 정렬), 3.문제 상품 사진. 
        7. 48시간 이내 접수 기한 강조.` : ''}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      setGeneratedResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "답변 생성 실패");
    } catch (error: any) {
      setGeneratedResponse(`에러: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">CS 답변 생성기</h1>
            <p className="text-stone-500">전문적인 답변을 자동으로 생성합니다.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-stone-700 uppercase">발신자 선택</label>
              <div className="flex gap-4">
                {['yoon', 'rachel'].map((s) => (
                  <label key={s} className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${sender === s ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}>
                    <input type="radio" checked={sender === s} onChange={() => setSender(s as Sender)} className="sr-only" />
                    <div className="text-center font-bold">{s === 'yoon' ? '윤태성' : '레이첼'}</div>
                    <div className="text-center text-xs text-stone-500">[{s === 'yoon' ? '윤씨네 행복상회' : '맛능상회'}]</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                <option value="checking_issue">문제 확인 중</option>
                <option value="guiding_refund">부분/전액 환불 안내</option>
                <option value="refund_completed">환불 완료</option>
              </select>
            </div>

            <div className="space-y-4">
              <select value={customerComplaint} onChange={(e) => setCustomerComplaint(e.target.value as CustomerComplaint)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                {CUSTOMER_COMPLAINTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={sellerStance} onChange={(e) => setSellerStance(e.target.value as SellerStance)} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm">
                {SELLER_STANCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="flex gap-4">
              {['fresh', 'industrial'].map((t) => (
                <label key={t} className="flex items-center space-x-2 cursor-pointer">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${productTypes.includes(t as ProductType) ? 'bg-stone-900 border-stone-900' : 'border-stone-300'}`}>
                    {productTypes.includes(t as ProductType) && <Check size={12} className="text-white" />}
                  </div>
                  <input type="checkbox" checked={productTypes.includes(t as ProductType)} onChange={() => handleProductTypeChange(t as ProductType)} className="hidden" />
                  <span className="text-sm">{t === 'fresh' ? '신선식품' : '공산품'}</span>
                </label>
              ))}
            </div>

            <textarea value={inquiry} onChange={(e) => setInquiry(e.target.value)} placeholder="고객 문의 내용 입력" className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-stone-900" />
            <textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="판매자 지시 사항 (선택)" className="w-full h-20 p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm resize-none" />

            <button onClick={generateResponse} disabled={isLoading || !inquiry.trim()} className="w-full py-4 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              <span>{isLoading ? '답변 생성 중...' : '답변 생성하기'}</span>
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col h-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Send size={18} /> 생성된 답변</h2>
              {generatedResponse && (
                <button onClick={copyToClipboard} className="text-xs font-medium px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center gap-1.5">
                  {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? '복사됨' : '복사하기'}
                </button>
              )}
            </div>
            <div className="flex-1 bg-stone-50 rounded-xl p-6 overflow-y-auto border border-stone-100">
              {generatedResponse ? (
                <div className="whitespace-pre-wrap text-stone-800 leading-relaxed text-sm md:text-base">{generatedResponse}</div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4"><Sparkles size={24} /></div>
                  <p>양식을 작성하고<br/>'답변 생성하기'를 눌러주세요.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}